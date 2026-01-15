const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Generate unique order number
const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

// Create order
router.post('/', authenticate, [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Товары обязательны'),
  body('items.*.product_id')
    .isUUID()
    .withMessage('ID товара должен быть валидным UUID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Количество должно быть положительным целым числом'),
  body('items.*.variant_id')
    .optional()
    .isUUID()
    .withMessage('ID варианта должен быть валидным UUID'),
  body('shipping_address')
    .isObject()
    .withMessage('Адрес доставки обязателен'),
  body('shipping_address.recipient_name')
    .notEmpty()
    .withMessage('Имя получателя обязательно'),
  body('shipping_address.phone')
    .notEmpty()
    .withMessage('Телефон получателя обязателен'),
  body('shipping_address.country')
    .notEmpty()
    .withMessage('Страна обязательна'),
  body('shipping_address.city')
    .notEmpty()
    .withMessage('Город обязателен'),
  body('shipping_address.street_address')
    .notEmpty()
    .withMessage('Адрес улицы обязателен'),
  body('shipping_address.postal_code')
    .notEmpty()
    .withMessage('Почтовый индекс обязателен'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Примечания не должны превышать 1000 символов'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { items, shipping_address, notes } = req.body;
    const userId = req.user.id;

    // Start transaction
    const trx = await db.transaction();

    try {
      // Validate and calculate order
      let subtotal = 0;
      const orderItems = [];
      const shopTotals = {}; // Track totals per shop for commission calculation

      for (const item of items) {
        // Get product
        const product = await trx('products')
          .where({ id: item.product_id, is_active: true })
          .first();

        if (!product) {
          await trx.rollback();
          return res.status(400).json({
            error: `Товар с ID ${item.product_id} не найден или неактивен`
          });
        }

        // Get shop
        const shop = await trx('shops')
          .where({ id: product.shop_id, status: 'approved' })
          .first();

        if (!shop) {
          await trx.rollback();
          return res.status(400).json({
            error: `Магазин товара не найден или неактивен`
          });
        }

        // Check variant if specified
        let variant = null;
        let price = product.price;
        let sku = product.sku;

        if (item.variant_id) {
          variant = await trx('product_variants')
            .where({ 
              id: item.variant_id, 
              product_id: item.product_id, 
              is_active: true 
            })
            .first();

          if (!variant) {
            await trx.rollback();
            return res.status(400).json({
              error: `Вариант товара не найден или неактивен`
            });
          }

          price = variant.price || product.price;
          sku = variant.sku || product.sku;

          // Check variant inventory
          if (variant.inventory_quantity < item.quantity) {
            await trx.rollback();
            return res.status(400).json({
              error: `Недостаточно товара на складе. Доступно: ${variant.inventory_quantity}`
            });
          }
        } else {
          // Check product inventory
          if (product.track_inventory && product.inventory_quantity < item.quantity) {
            await trx.rollback();
            return res.status(400).json({
              error: `Недостаточно товара на складе. Доступно: ${product.inventory_quantity}`
            });
          }
        }

        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        // Track shop totals for commission
        if (!shopTotals[shop.id]) {
          shopTotals[shop.id] = { subtotal: 0, commission_rate: shop.commission_rate || 10 };
        }
        shopTotals[shop.id].subtotal += itemTotal;

        orderItems.push({
          product_id: product.id,
          variant_id: item.variant_id,
          shop_id: shop.id,
          title: product.title,
          sku: sku,
          price: price,
          quantity: item.quantity,
          total: itemTotal
        });
      }

      // Calculate totals
      const platformCommissionRate = parseFloat(process.env.PLATFORM_COMMISSION) || 10;
      const totalCommissionAmount = Object.values(shopTotals).reduce((sum, shop) => {
        return sum + (shop.subtotal * shop.commission_rate / 100);
      }, 0);

      const taxAmount = 0; // TODO: Implement tax calculation based on location
      const shippingAmount = 0; // TODO: Implement shipping calculation
      const totalAmount = subtotal + taxAmount + shippingAmount;

      // Create order
      const [order] = await trx('orders').insert({
        id: uuidv4(),
        user_id: userId,
        order_number: generateOrderNumber(),
        status: 'pending',
        currency: 'RUB',
        subtotal,
        tax_amount: taxAmount,
        shipping_amount: shippingAmount,
        total_amount: totalAmount,
        commission_amount: totalCommissionAmount,
        shipping_address: JSON.stringify(shipping_address),
        notes: notes || null
      }).returning('*');

      // Create order items
      for (const item of orderItems) {
        await trx('order_items').insert({
          id: uuidv4(),
          order_id: order.id,
          ...item
        });
      }

      // Update inventory
      for (const item of items) {
        if (item.variant_id) {
          await trx('product_variants')
            .where({ id: item.variant_id })
            .update({
              inventory_quantity: db.raw('inventory_quantity - ?', [item.quantity]),
              sold_count: db.raw('sold_count + ?', [item.quantity]),
              updated_at: new Date()
            });
        } else {
          await trx('products')
            .where({ id: item.product_id })
            .update({
              inventory_quantity: db.raw('inventory_quantity - ?', [item.quantity]),
              sold_count: db.raw('sold_count + ?', [item.quantity]),
              updated_at: new Date()
            });
        }
      }

      await trx.commit();

      // Get complete order with relations
      const completeOrder = await db('orders')
        .where({ id: order.id })
        .first();

      const orderItemsWithDetails = await db('order_items')
        .where({ order_id: order.id })
        .select('*');

      completeOrder.items = orderItemsWithDetails;

      res.status(201).json({
        message: 'Заказ создан успешно',
        order: completeOrder
      });

    } catch (error) {
      await trx.rollback();
      throw error;
    }

  } catch (error) {
    next(error);
  }
});

// Get user orders
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let query = db('orders')
      .where({ user_id: req.user.id })
      .orderBy('created_at', 'desc');

    if (status) {
      query = query.where({ status });
    }

    const totalCount = await query.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    const orders = await query
      .offset(offset)
      .limit(limit)
      .select('*');

    // Get order items for each order
    for (const order of orders) {
      const items = await db('order_items')
        .where({ order_id: order.id })
        .select('*');
      
      order.items = items;
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

// Get order by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id })
      .first();

    if (!order) {
      return res.status(404).json({
        error: 'Заказ не найден'
      });
    }

    // Check if user owns the order or is admin/seller
    const isOwner = order.user_id === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    // Check if seller (check if order contains seller's items)
    let isSeller = false;
    if (!isOwner && !isAdmin) {
      const sellerItems = await db('order_items')
        .join('products', 'order_items.product_id', 'products.id')
        .join('shops', 'products.shop_id', 'shops.id')
        .where({ 
          'order_items.order_id': req.params.id,
          'shops.owner_id': req.user.id
        })
        .first();
      
      isSeller = !!sellerItems;
    }

    if (!isOwner && !isAdmin && !isSeller) {
      return res.status(403).json({
        error: 'Доступ запрещен'
      });
    }

    // Get order items
    const items = await db('order_items')
      .where({ order_id: req.params.id })
      .select('*');

    order.items = items;

    res.json({ order });

  } catch (error) {
    next(error);
  }
});

// Update order status (seller)
router.put('/:id/status', authenticate, authorize('seller', 'admin'), [
  body('status')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
    .withMessage('Недопустимый статус'),
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
    const orderId = req.params.id;

    // Get order
    const order = await db('orders')
      .where({ id: orderId })
      .first();

    if (!order) {
      return res.status(404).json({
        error: 'Заказ не найден'
      });
    }

    // Check if seller owns items in this order
    if (req.user.role !== 'admin') {
      const sellerItems = await db('order_items')
        .join('products', 'order_items.product_id', 'products.id')
        .join('shops', 'products.shop_id', 'shops.id')
        .where({ 
          'order_items.order_id': orderId,
          'shops.owner_id': req.user.id
        })
        .first();

      if (!sellerItems) {
        return res.status(403).json({
          error: 'Этот заказ не содержит ваших товаров'
        });
      }
    }

    // Validate status transitions
    const validTransitions = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered'],
      'delivered': [], // Final state
      'cancelled': [], // Final state
      'refunded': [] // Final state
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return res.status(400).json({
        error: `Невозможно изменить статус с ${order.status} на ${status}`
      });
    }

    // Update order status
    const [updatedOrder] = await db('orders')
      .where({ id: orderId })
      .update({
        status,
        updated_at: new Date()
      })
      .returning('*');

    // Set timestamps for specific statuses
    if (status === 'shipped') {
      await db('orders')
        .where({ id: orderId })
        .update({ shipped_at: new Date() });
    } else if (status === 'delivered') {
      await db('orders')
        .where({ id: orderId })
        .update({ delivered_at: new Date() });
    }

    // TODO: Send email notification to user
    // TODO: Process payment completion for delivered orders

    res.json({
      message: `Статус заказа изменен на ${status}`,
      order: updatedOrder
    });

  } catch (error) {
    next(error);
  }
});

// Cancel order (user)
router.put('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const order = await db('orders')
      .where({ id: req.params.id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({
        error: 'Заказ не найден'
      });
    }

    // Can only cancel pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({
        error: 'Можно отменить только заказы со статусом "Ожидает"'
      });
    }

    // Update order status
    const [updatedOrder] = await db('orders')
      .where({ id: req.params.id })
      .update({
        status: 'cancelled',
        updated_at: new Date()
      })
      .returning('*');

    // Restore inventory
    const orderItems = await db('order_items')
      .where({ order_id: req.params.id })
      .select('*');

    for (const item of orderItems) {
      if (item.variant_id) {
        await db('product_variants')
          .where({ id: item.variant_id })
          .update({
            inventory_quantity: db.raw('inventory_quantity + ?', [item.quantity]),
            sold_count: db.raw('sold_count - ?', [item.quantity]),
            updated_at: new Date()
          });
      } else {
        await db('products')
          .where({ id: item.product_id })
          .update({
            inventory_quantity: db.raw('inventory_quantity + ?', [item.quantity]),
            sold_count: db.raw('sold_count - ?', [item.quantity]),
            updated_at: new Date()
          });
      }
    }

    // TODO: Process refund if payment was made

    res.json({
      message: 'Заказ отменен',
      order: updatedOrder
    });

  } catch (error) {
    next(error);
  }
});

// Get seller orders
router.get('/seller', authenticate, authorize('seller', 'admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    // Get orders that contain seller's items
    let query = db('orders')
      .join('order_items', 'orders.id', 'order_items.order_id')
      .join('products', 'order_items.product_id', 'products.id')
      .join('shops', 'products.shop_id', 'shops.id')
      .where({ 'shops.owner_id': req.user.id })
      .distinct('orders.id')
      .orderBy('orders.created_at', 'desc');

    if (status) {
      query = query.where({ 'orders.status': status });
    }

    const totalCount = await query.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    const orders = await query
      .offset(offset)
      .limit(limit)
      .select('orders.*');

    // Get order items for each order
    for (const order of orders) {
      const items = await db('order_items')
        .where({ order_id: order.id })
        .select('*');
      
      order.items = items;
    }

    // Calculate stats
    const stats = await db('orders')
      .join('order_items', 'orders.id', 'order_items.order_id')
      .join('products', 'order_items.product_id', 'products.id')
      .join('shops', 'products.shop_id', 'shops.id')
      .where({ 'shops.owner_id': req.user.id })
      .select(
        db.raw('COUNT(DISTINCT orders.id) as total_orders'),
        db.raw('COUNT(CASE WHEN orders.status = \'pending\' THEN 1 END) as pending'),
        db.raw('COUNT(CASE WHEN orders.status = \'processing\' THEN 1 END) as processing'),
        db.raw('COUNT(CASE WHEN orders.status = \'shipped\' THEN 1 END) as shipped'),
        db.raw('COUNT(CASE WHEN orders.status = \'delivered\' THEN 1 END) as delivered')
      )
      .first();

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      stats
    });

  } catch (error) {
    next(error);
  }
});

// Admin routes
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let query = db('orders')
      .orderBy('created_at', 'desc');

    if (status) {
      query = query.where({ status });
    }

    const totalCount = await query.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    const orders = await query
      .offset(offset)
      .limit(limit)
      .select('*');

    // Get order items for each order
    for (const order of orders) {
      const items = await db('order_items')
        .where({ order_id: order.id })
        .select('*');
      
      order.items = items;
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

module.exports = router;
