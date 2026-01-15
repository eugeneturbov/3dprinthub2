const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get dashboard stats
router.get('/dashboard', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    // Get basic stats
    const [
      usersCount,
      shopsCount,
      productsCount,
      ordersCount,
      reviewsCount,
      messagesCount
    ] = await Promise.all([
      db('users').where({ is_active: true }).count('* as count').first(),
      db('shops').where({ status: 'approved' }).count('* as count').first(),
      db('products').where({ is_active: true }).count('* as count').first(),
      db('orders').count('* as count').first(),
      db('product_reviews').where({ is_approved: true }).count('* as count').first(),
      db('messages').count('* as count').first()
    ]);

    // Get revenue stats
    const revenueStats = await db('orders')
      .where({ status: 'delivered' })
      .select(
        db.raw('SUM(total_amount) as total_revenue'),
        db.raw('SUM(commission_amount) as total_commission'),
        db.raw('COUNT(*) as delivered_orders')
      )
      .first();

    // Get recent orders
    const recentOrders = await db('orders')
      .orderBy('created_at', 'desc')
      .limit(5)
      .join('users', 'orders.user_id', 'users.id')
      .select(
        'orders.*',
        'users.first_name',
        'users.last_name',
        'users.email'
      );

    // Get top products
    const topProducts = await db('products')
      .orderBy('sold_count', 'desc')
      .limit(5)
      .select('id', 'title', 'sold_count', 'rating', 'review_count');

    // Get top shops
    const topShops = await db('shops')
      .orderBy('total_sales', 'desc')
      .limit(5)
      .select('id', 'name', 'total_sales', 'rating', 'review_count');

    // Get monthly stats (last 6 months)
    const monthlyStats = await db('orders')
      .where('created_at', '>=', db.raw("NOW() - INTERVAL '6 months'"))
      .select(
        db.raw("DATE_TRUNC('month', created_at) as month"),
        db.raw('COUNT(*) as orders'),
        db.raw('SUM(total_amount) as revenue')
      )
      .groupBy(db.raw("DATE_TRUNC('month', created_at)"))
      .orderBy('month', 'asc');

    res.json({
      stats: {
        users: parseInt(usersCount.count),
        shops: parseInt(shopsCount.count),
        products: parseInt(productsCount.count),
        orders: parseInt(ordersCount.count),
        reviews: parseInt(reviewsCount.count),
        messages: parseInt(messagesCount.count),
        total_revenue: parseFloat(revenueStats.total_revenue || 0),
        total_commission: parseFloat(revenueStats.total_commission || 0),
        delivered_orders: parseInt(revenueStats.delivered_orders || 0)
      },
      recentOrders,
      topProducts,
      topShops,
      monthlyStats
    });

  } catch (error) {
    next(error);
  }
});

// Get users with pagination and filters
router.get('/users', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const role = req.query.role;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let query = db('users')
      .orderBy('created_at', 'desc');

    // Apply filters
    if (search) {
      query = query.where(function() {
        this.where('first_name', 'ilike', `%${search}%`)
          .orWhere('last_name', 'ilike', `%${search}%`)
          .orWhere('email', 'ilike', `%${search}%`);
      });
    }

    if (role) {
      query = query.where({ role });
    }

    if (status) {
      query = query.where({ is_active: status === 'active' });
    }

    const totalCount = await query.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    const users = await query
      .offset(offset)
      .limit(limit)
      .select('*');

    // Get additional user stats
    for (const user of users) {
      // Get user's shop if seller
      if (user.role === 'seller') {
        const shop = await db('shops')
          .where({ owner_id: user.id })
          .select('id', 'name', 'status', 'rating', 'review_count')
          .first();
        user.shop = shop;
      }

      // Get user's orders count
      const ordersCount = await db('orders')
        .where({ user_id: user.id })
        .count('* as count')
        .first();
      user.orders_count = parseInt(ordersCount.count);
    }

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

// Update user status
router.put('/users/:userId/status', authenticate, authorize('admin'), [
  body('status')
    .isIn(['active', 'inactive'])
    .withMessage('Статус должен быть active или inactive')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { status } = req.body;
    const { userId } = req.params;

    const [updatedUser] = await db('users')
      .where({ id: userId })
      .update({ 
        is_active: status === 'active',
        updated_at: new Date()
      })
      .returning('*');

    if (!updatedUser) {
      return res.status(404).json({
        error: 'Пользователь не найден'
      });
    }

    res.json({
      message: `Статус пользователя изменен на ${status}`,
      user: updatedUser
    });

  } catch (error) {
    next(error);
  }
});

// Get shops with pagination and filters
router.get('/shops', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let query = db('shops')
      .orderBy('created_at', 'desc');

    // Apply filters
    if (search) {
      query = query.where('name', 'ilike', `%${search}%`);
    }

    if (status) {
      query = query.where({ status });
    }

    const totalCount = await query.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    const shops = await query
      .offset(offset)
      .limit(limit)
      .select('*');

    // Get additional shop stats
    for (const shop of shops) {
      // Get owner info
      const owner = await db('users')
        .where({ id: shop.owner_id })
        .select('id', 'first_name', 'last_name', 'email')
        .first();
      shop.owner = owner;

      // Get products count
      const productsCount = await db('products')
        .where({ shop_id: shop.id, is_active: true })
        .count('* as count')
        .first();
      shop.products_count = parseInt(productsCount.count);

      // Get orders count
      const ordersCount = await db('order_items')
        .join('products', 'order_items.product_id', 'products.id')
        .where({ 'products.shop_id': shop.id })
        .count('* as count')
        .first();
      shop.orders_count = parseInt(ordersCount.count);
    }

    res.json({
      shops,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

// Update shop status
router.put('/shops/:shopId/status', authenticate, authorize('admin'), [
  body('status')
    .isIn(['pending', 'approved', 'rejected', 'suspended'])
    .withMessage('Недопустимый статус')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { status } = req.body;
    const { shopId } = req.params;

    const [updatedShop] = await db('shops')
      .where({ id: shopId })
      .update({ 
        status,
        updated_at: new Date()
      })
      .returning('*');

    if (!updatedShop) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    // TODO: Send email notification to shop owner

    res.json({
      message: `Статус магазина изменен на ${status}`,
      shop: updatedShop
    });

  } catch (error) {
    next(error);
  }
});

// Get products with pagination and filters
router.get('/products', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const status = req.query.status;
    const shopId = req.query.shop_id;
    const offset = (page - 1) * limit;

    let query = db('products')
      .orderBy('created_at', 'desc');

    // Apply filters
    if (search) {
      query = query.where('title', 'ilike', `%${search}%`);
    }

    if (status) {
      query = query.where({ is_active: status === 'active' });
    }

    if (shopId) {
      query = query.where({ shop_id: shopId });
    }

    const totalCount = await query.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    const products = await query
      .offset(offset)
      .limit(limit)
      .select('*');

    // Get additional product info
    for (const product of products) {
      // Get shop info
      const shop = await db('shops')
        .where({ id: product.shop_id })
        .select('id', 'name', 'owner_id')
        .first();
      product.shop = shop;

      // Get owner info
      if (shop) {
        const owner = await db('users')
          .where({ id: shop.owner_id })
          .select('id', 'first_name', 'last_name', 'email')
          .first();
        product.shop.owner = owner;
      }

      // Get images count
      const imagesCount = await db('product_images')
        .where({ product_id: product.id })
        .count('* as count')
        .first();
      product.images_count = parseInt(imagesCount.count);

      // Get variants count
      const variantsCount = await db('product_variants')
        .where({ product_id: product.id, is_active: true })
        .count('* as count')
        .first();
      product.variants_count = parseInt(variantsCount.count);
    }

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

// Update product status
router.put('/products/:productId/status', authenticate, authorize('admin'), [
  body('status')
    .isIn(['active', 'active'])
    .withMessage('Статус должен быть active или inactive')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { status } = req.body;
    const { productId } = req.params;

    const [updatedProduct] = await db('products')
      .where({ id: productId })
      .update({ 
        is_active: status === 'active',
        updated_at: new Date()
      })
      .returning('*');

    if (!updatedProduct) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    res.json({
      message: `Статус товара изменен на ${status}`,
      product: updatedProduct
    });

  } catch (error) {
    next(error);
  }
});

// Get orders with pagination and filters
router.get('/orders', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const search = req.query.search;
    const offset = (page - 1) * limit;

    let query = db('orders')
      .orderBy('created_at', 'desc');

    // Apply filters
    if (status) {
      query = query.where({ status });
    }

    if (search) {
      query = query.where('order_number', 'ilike', `%${search}%`);
    }

    const totalCount = await query.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    const orders = await query
      .offset(offset)
      .limit(limit)
      .select('*');

    // Get additional order info
    for (const order of orders) {
      // Get user info
      const user = await db('users')
        .where({ id: order.user_id })
        .select('id', 'first_name', 'last_name', 'email')
        .first();
      order.user = user;

      // Get order items
      const items = await db('order_items')
        .where({ order_id: order.id })
        .select('*');
      order.items = items;

      // Get shop info for each item
      for (const item of order.items) {
        const shop = await db('shops')
          .join('products', 'shops.id', 'products.shop_id')
          .where({ 'products.id': item.product_id })
          .select('shops.id', 'shops.name', 'shops.owner_id')
          .first();
        item.shop = shop;
      }
    }

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get system settings
router.get('/settings', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    // Get system settings from environment variables
    const settings = {
      platform_commission: parseFloat(process.env.PLATFORM_COMMISSION) || 10,
      min_withdrawal_amount: 1000,
      withdrawal_fee_rate: 0.02,
      withdrawal_fee_min: 50,
      max_file_size: {
        image: 10 * 1024 * 1024, // 10MB
        file: 100 * 1024 * 1024 // 100MB
      },
      supported_currencies: ['RUB'],
      default_currency: 'RUB',
      maintenance_mode: false,
      registration_enabled: true,
      shop_approval_required: true
    };

    res.json({ settings });

  } catch (error) {
    next(error);
  }
});

// Update system settings
router.put('/settings', authenticate, authorize('admin'), [
  body('platform_commission')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Комиссия должна быть от 0 до 100'),
  body('min_withdrawal_amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Минимальная сумма вывода должна быть положительной'),
  body('withdrawal_fee_rate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Комиссия вывода должна быть от 0 до 1'),
  body('withdrawal_fee_min')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Минимальная комиссия вывода должна быть положительной'),
  body('maintenance_mode')
    .optional()
    .isBoolean()
    .withMessage('Maintenance mode должно быть булевым значением'),
  body('registration_enabled')
    .optional()
    .isBoolean()
    .withMessage('Registration enabled должно быть булевым значением'),
  body('shop_approval_required')
    .optional()
    .isBoolean()
    .withMessage('Shop approval required должно быть булевым значением')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // TODO: Implement settings storage in database
    // For now, just return success
    res.json({
      message: 'Настройки обновлены'
    });

  } catch (error) {
    next(error);
  }
});

// Get system logs
router.get('/logs', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const level = req.query.level;
    const offset = (page - 1) * limit;

    // TODO: Implement actual logging system
    // For now, return mock data
    const logs = [
      {
        id: 1,
        level: 'info',
        message: 'User john@example.com registered',
        timestamp: new Date().toISOString(),
        user_id: 'user-123',
        ip_address: '192.168.1.1'
      },
      {
        id: 2,
        level: 'warning',
        message: 'Failed login attempt for user@example.com',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        user_id: null,
        ip_address: '192.168.1.2'
      },
      {
        id: 3,
        level: 'error',
        message: 'Database connection failed',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        user_id: null,
        ip_address: '127.0.0.1'
      }
    ];

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total: logs.length,
        pages: 1
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
