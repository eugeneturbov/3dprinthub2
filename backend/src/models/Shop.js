const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Shop {
  static async create(shopData) {
    const {
      owner_id,
      name,
      description,
      contact_email,
      contact_phone,
      website
    } = shopData;

    // Generate unique slug
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Ensure slug is unique
    let uniqueSlug = slug;
    let counter = 1;
    while (await this.findBySlug(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const [shop] = await db('shops')
      .insert({
        owner_id,
        name,
        slug: uniqueSlug,
        description,
        contact_email,
        contact_phone,
        website,
        status: 'pending'
      })
      .returning('*');

    return shop;
  }

  static async findById(id) {
    const shop = await db('shops')
      .where({ id })
      .first();

    if (shop) {
      // Get owner info
      const owner = await db('users')
        .where({ id: shop.owner_id })
        .select('id', 'email', 'first_name', 'last_name', 'avatar_url')
        .first();

      shop.owner = owner;
    }

    return shop;
  }

  static async findBySlug(slug) {
    const shop = await db('shops')
      .where({ slug })
      .first();

    if (shop) {
      // Get owner info
      const owner = await db('users')
        .where({ id: shop.owner_id })
        .select('id', 'email', 'first_name', 'last_name', 'avatar_url')
        .first();

      shop.owner = owner;
    }

    return shop;
  }

  static async findByOwnerId(ownerId) {
    const shops = await db('shops')
      .where({ owner_id: ownerId })
      .orderBy('created_at', 'desc');

    return shops;
  }

  static async update(id, shopData) {
    const [shop] = await db('shops')
      .where({ id })
      .update({
        ...shopData,
        updated_at: new Date()
      })
      .returning('*');

    if (shop) {
      // Get owner info
      const owner = await db('users')
        .where({ id: shop.owner_id })
        .select('id', 'email', 'first_name', 'last_name', 'avatar_url')
        .first();

      shop.owner = owner;
    }

    return shop;
  }

  static async updateStatus(id, status) {
    const [shop] = await db('shops')
      .where({ id })
      .update({
        status,
        updated_at: new Date()
      })
      .returning('*');

    return shop;
  }

  static async getProducts(shopId, options = {}) {
    const {
      page = 1,
      limit = 20,
      category_id,
      min_price,
      max_price,
      sort = 'created_at',
      order = 'desc'
    } = options;

    const offset = (page - 1) * limit;

    let query = db('products')
      .where({ shop_id: shopId })
      .where('is_active', true);

    // Apply filters
    if (category_id) {
      query = query.where({ category_id });
    }

    if (min_price) {
      query = query.where('price', '>=', min_price);
    }

    if (max_price) {
      query = query.where('price', '<=', max_price);
    }

    // Apply sorting
    const validSorts = ['created_at', 'price', 'title', 'view_count', 'sold_count', 'rating'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    query = query.orderBy(sortField, sortOrder);

    // Get total count
    const totalCount = await query.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    // Get paginated results
    const products = await query
      .offset(offset)
      .limit(limit)
      .select('*');

    return {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getShopStats(shopId) {
    const stats = await db('shops')
      .where({ id: shopId })
      .select(
        'total_sales',
        'rating',
        'review_count'
      )
      .first();

    // Get product counts
    const productStats = await db('products')
      .where({ shop_id: shopId })
      .select(
        db.raw('COUNT(*) as total_products'),
        db.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active_products'),
        db.raw('SUM(view_count) as total_views'),
        db.raw('SUM(sold_count) as total_sold')
      )
      .first();

    // Get order stats
    const orderStats = await db('orders')
      .join('order_items', 'orders.id', 'order_items.order_id')
      .where('order_items.shop_id', shopId)
      .select(
        db.raw('COUNT(DISTINCT orders.id) as total_orders'),
        db.raw('COUNT(CASE WHEN orders.status = \'pending\' THEN 1 END) as pending_orders'),
        db.raw('COUNT(CASE WHEN orders.status = \'processing\' THEN 1 END) as processing_orders'),
        db.raw('COUNT(CASE WHEN orders.status = \'shipped\' THEN 1 END) as shipped_orders'),
        db.raw('COUNT(CASE WHEN orders.status = \'delivered\' THEN 1 END) as delivered_orders')
      )
      .first();

    return {
      ...stats,
      ...productStats,
      ...orderStats
    };
  }

  static async updateBalance(shopId, amount) {
    await db('shops')
      .where({ id: shopId })
      .update({
        balance: db.raw(`balance + ${amount}`),
        updated_at: new Date()
      });
  }

  static async getSales(shopId, options = {}) {
    const {
      start_date,
      end_date,
      group_by = 'day'
    } = options;

    let query = db('orders')
      .join('order_items', 'orders.id', 'order_items.order_id')
      .where('order_items.shop_id', shopId)
      .where('orders.status', '!=', 'cancelled');

    if (start_date) {
      query = query.where('orders.created_at', '>=', start_date);
    }

    if (end_date) {
      query = query.where('orders.created_at', '<=', end_date);
    }

    let groupBy;
    let dateFormat;
    
    switch (group_by) {
      case 'hour':
        groupBy = db.raw("DATE_TRUNC('hour', orders.created_at)");
        dateFormat = 'YYYY-MM-DD HH24:00';
        break;
      case 'day':
        groupBy = db.raw("DATE_TRUNC('day', orders.created_at)");
        dateFormat = 'YYYY-MM-DD';
        break;
      case 'week':
        groupBy = db.raw("DATE_TRUNC('week', orders.created_at)");
        dateFormat = 'YYYY-"W"WW';
        break;
      case 'month':
        groupBy = db.raw("DATE_TRUNC('month', orders.created_at)");
        dateFormat = 'YYYY-MM';
        break;
      default:
        groupBy = db.raw("DATE_TRUNC('day', orders.created_at)");
        dateFormat = 'YYYY-MM-DD';
    }

    const sales = await query
      .select(
        db.raw(`to_char(${groupBy}, '${dateFormat}') as period`),
        db.raw('COUNT(DISTINCT orders.id) as orders_count'),
        db.raw('SUM(order_items.total) as revenue'),
        db.raw('SUM(order_items.quantity) as items_sold')
      )
      .groupBy(groupBy)
      .orderBy(groupBy, 'asc');

    return sales;
  }

  static async getTopProducts(shopId, limit = 10) {
    const products = await db('products')
      .where({ shop_id: shopId })
      .where('is_active', true)
      .orderBy('sold_count', 'desc')
      .limit(limit)
      .select('*');

    return products;
  }

  static async search(query, options = {}) {
    const {
      page = 1,
      limit = 20,
      category_id,
      min_rating,
      status = 'approved'
    } = options;

    const offset = (page - 1) * limit;

    let dbQuery = db('shops')
      .where('status', status)
      .where('is_active', true);

    // Search by name and description
    if (query) {
      dbQuery = dbQuery.where(function() {
        this.where('name', 'ilike', `%${query}%`)
            .orWhere('description', 'ilike', `%${query}%`);
      });
    }

    // Filter by category (through products)
    if (category_id) {
      dbQuery = dbQuery.whereExists(
        db('products')
          .whereRaw('products.shop_id = shops.id')
          .where({ category_id })
          .where('is_active', true)
      );
    }

    // Filter by rating
    if (min_rating) {
      dbQuery = dbQuery.where('rating', '>=', min_rating);
    }

    // Get total count
    const totalCount = await dbQuery.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    // Get paginated results
    const shops = await dbQuery
      .offset(offset)
      .limit(limit)
      .select('*')
      .orderBy('rating', 'desc')
      .orderBy('total_sales', 'desc');

    return {
      shops,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      sort = 'created_at',
      order = 'desc'
    } = options;

    const offset = (page - 1) * limit;

    let query = db('shops');

    if (status) {
      query = query.where({ status });
    }

    // Apply sorting
    const validSorts = ['created_at', 'name', 'rating', 'total_sales', 'status'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    query = query.orderBy(sortField, sortOrder);

    // Get total count
    const totalCount = await query.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    // Get paginated results
    const shops = await query
      .offset(offset)
      .limit(limit)
      .select('*');

    // Get owner info for each shop
    for (const shop of shops) {
      const owner = await db('users')
        .where({ id: shop.owner_id })
        .select('id', 'email', 'first_name', 'last_name', 'avatar_url')
        .first();

      shop.owner = owner;
    }

    return {
      shops,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = Shop;
