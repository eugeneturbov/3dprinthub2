const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Create product review
router.post('/product/:productId', authenticate, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Рейтинг должен быть от 1 до 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Название отзыва не должно превышать 255 символов'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Отзыв должен содержать минимум 10 символов'),
  body('order_id')
    .isUUID()
    .withMessage('ID заказа должен быть валидным UUID'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation failed',
        details: errors.array()
      });
    }

    const { productId } = req.params;
    const { rating, title, content, order_id } = req.body;
    const userId = req.user.id;

    // Check if product exists
    const product = await db('products')
      .where({ id: productId, is_active: true })
      .first();

    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Check if user has purchased the product
    let hasPurchased = false;
    if (order_id) {
      const order = await db('orders')
        .where({ 
          id: order_id, 
          user_id: userId,
          status: 'delivered'
        })
        .join('order_items', 'orders.id', 'order_items.order_id')
        .where({ 'order_items.product_id': productId })
        .first();

      hasPurchased = !!order;
    }

    // Check if user already reviewed this product
    const existingReview = await db('product_reviews')
      .where({ 
        product_id: productId, 
        user_id: userId 
      })
      .first();

    if (existingReview) {
      return res.status(400).json({
        error: 'Вы уже оставили отзыв на этот товар'
      });
    }

    // Create review
    const [review] = await db('product_reviews').insert({
      id: uuidv4(),
      product_id: productId,
      user_id: userId,
      order_id: order_id || null,
      rating,
      title,
      content,
      is_verified: hasPurchased,
      is_approved: true,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    // Update product rating
    await updateProductRating(productId);

    res.status(201).json({
      message: 'Отзыв успешно добавлен',
      review
    });

  } catch (error) {
    next(error);
  }
});

// Create shop review
router.post('/shop/:shopId', authenticate, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Рейтинг должен быть от 1 до 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Название отзыва не должно превышать 255 символов'),
  body('content')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Отзыв должен содержать минимум 10 символов'),
  body('order_id')
    .isUUID()
    .withMessage('ID заказа должен быть валидным UUID'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'validation failed',
        details: errors.array()
      });
    }

    const { shopId } = req.params;
    const { rating, title, content, order_id } = req.body;
    const userId = req.user.id;

    // Check if shop exists
    const shop = await db('shops')
      .where({ id: shopId, status: 'approved' })
      .first();

    if (!shop) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    // Check if user has purchased from this shop
    let hasPurchased = false;
    if (order_id) {
      const order = await db('orders')
        .where({ 
          id: order_id, 
          user_id: userId,
          status: 'delivered'
        })
        .join('order_items', 'orders.id', 'order_items.order_id')
        .join('products', 'order_items.product_id', 'products.id')
        .join('shops', 'products.shop_id', 'shops.id')
        .where({ 'shops.id': shopId })
        .first();

      hasPurchased = !!order;
    }

    // Check if user already reviewed this shop
    const existingReview = await db('shop_reviews')
      .where({ 
        shop_id: shopId, 
        user_id: userId 
      })
      .first();

    if (existingReview) {
      return res.status(400).json({
        error: 'Вы уже оставили отзыв на этот магазин'
      });
    }

    // Create review
    const [review] = await db('shop_reviews').insert({
      id: uuidv4(),
      shop_id: shopId,
      user_id: userId,
      order_id: order_id || null,
      rating,
      title,
      content,
      is_verified: hasPurchased,
      is_approved: true,
      created_at: new Date(),
      updated_at: new Date()
    }).returning('*');

    // Update shop rating
    await updateShopRating(shopId);

    res.status(201).json({
      message: 'Отзыв успешно добавлен',
      review
    });

  } catch (error) {
    next(error);
  }
});

// Get product reviews
router.get('/product/:productId', async (req, res, next) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'created_at';
    const order = req.query.order || 'desc';

    const offset = (page - 1) * limit;

    // Get product
    const product = await db('products')
      .where({ id: productId, is_active: true })
      .first();

    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Get reviews with pagination
    const totalCount = await db('product_reviews')
      .where({ product_id: productId, is_approved: true })
      .count('* as count')
      .first();

    const total = parseInt(totalCount.count);

    const reviews = await db('product_reviews')
      .where({ product_id: productId, is_approved: true })
      .orderBy(sort, order)
      .offset(offset)
      .limit(limit)
      .select('*');

    // Get user info for each review
    for (const review of reviews) {
      const user = await db('users')
        .where({ id: review.user_id })
        .select('id', 'first_name', 'last_name', 'avatar_url')
        .first();

      review.user = user;
    }

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      product: {
        id: product.id,
        title: product.title,
        rating: product.rating,
        review_count: product.review_count
      }
    });

  } catch (error) {
    next(error);
  }
});

// Get shop reviews
router.get('/shop/:shopId', async (req, res, next) => {
  try {
    const { shopId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sort = req.query.sort || 'created_at';
    const order = req.query.order || 'desc';

    const offset = (page - 1) * limit;

    // Get shop
    const shop = await db('shops')
      .where({ id: shopId, status: 'approved' })
      .first();

    if (!shop) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    // Get reviews with pagination
    const totalCount = await db('shop_reviews')
      .where({ shop_id: shopId, is_approved: true })
      .count('* as count')
      .first();

    const total = parseInt(totalCount.count);

    const reviews = await db('shop_reviews')
      .where({ shop_id: shopId, is_approved: true })
      .orderBy(sort, order)
      .offset(offset)
      .limit(limit)
      .select('*');

    // Get user info for each review
    for (const review of reviews) {
      const user = await db('users')
        .where({ id: review.user_id })
        .select('id', 'first_name', 'last_name', 'avatar_url')
        .first();

      review.user = user;
    }

    res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      shop: {
        id: shop.id,
        name: shop.name,
        rating: shop.rating,
        review_count: shop.review_count
      }
    });

  } catch (error) {
    next(error);
  }
});

// Update product rating
async function updateProductRating(productId) {
  const db = require('../config/database');
  
  const reviews = await db('product_reviews')
    .where({ product_id: productId, is_approved: true })
    .select('rating');

  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const reviewCount = reviews.length;
  const averageRating = totalRating / reviewCount;

  await db('products')
    .where({ id: productId })
    .update({
      rating: averageRating,
      review_count: reviewCount,
      updated_at: new Date()
    });
}

// Update shop rating
async function updateShopRating(shopId) {
  const db = require('../config/database');
  
  const reviews = await db('shop_reviews')
    .where({ shop_id: shopId, is_approved: true })
    .select('rating');

  if (reviews.length === 0) return;

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const reviewCount = reviews.length;
  const averageRating = totalRating / reviewCount;

  await db('shops')
    .where({ id: shopId })
    .update({
      rating: averageRating,
      review_count: review_count,
      updated_at: new Date()
    });
}

// Update review
router.put('/:reviewId', authenticate, [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Рейтинг должен быть от 1 до 5'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Название отзыва не должно превышать 255 символов'),
  body('content')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Отзыв должен содержать минимум 10 символов'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { reviewId } = req.params;
    const { rating, title, content } = req.body;

    // Get review to check ownership
    const review = await db('product_reviews')
      .where({ id: reviewId, user_id: req.user.id })
      .first();

    if (!review) {
      return res.status(404).json({
        error: 'Отзыв не найден'
      });
    }

    // Update review
    const [updatedReview] = await db('product_reviews')
      .where({ id: reviewId })
      .update({
        rating,
        title,
        content,
        updated_at: new Date()
      })
      .returning('*');

    // Update product rating if it's a product review
    if (review.product_id) {
      await updateProductRating(review.product_id);
    }

    // Update shop rating if it's a shop review
    if (review.shop_id) {
      await updateShopRating(review.shop_id);
    }

    res.json({
      message: 'Отзыв обновлен',
      review: updatedReview
    });

  } catch (error) {
    next(error);
  }
});

// Delete review
router.delete('/:reviewId', authenticate, async (req, res, next) => {
  try {
    const review = await db('product_reviews')
      .where({ id: req.params.reviewId, user_id: req.user.id })
      .first();

    if (!review) {
      return res.status(404).json({
        error: 'Отзыв не найден'
      });
    }

    // Delete review
    await db('product_reviews')
      .where({ id: req.params.reviewId })
      .del();

    // Update product rating if it's a product review
    if (review.product_id) {
      await updateProductRating(review.product_id);
    }

    // Update shop rating if it's a shop review
    if (review.shop_id) {
      await updateShopRating(review.shop_id);
    }

    res.json({
      message: 'Отзыв удален'
    });

  } catch (error) {
    next(error);
  }
});

// Get user reviews
router.get('/user/:userId', authenticate, authorize('admin'), [
], async (req, res, next) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    const offset = (page - 1) * limit;

    let query = db('product_reviews')
      .where({ user_id: userId });

    if (status) {
      query = query.where({ status });
    }

    const totalCount = await query.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    const reviews = await query
      .orderBy('created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .select('*');

    // Get related entities
    for (const review of reviews) {
      if (review.product_id) {
        const product = await db('products')
          .where({ id: review.product_id })
          .select('id', 'title', 'slug');
        review.product = product;
      }

      if (review.shop_id) {
        const shop = await db('shops')
          .where({ id: review.shop_id })
          .select('id', 'name', 'slug');
        review.shop = shop;
      }

      const user = await db('users')
        .where({ id: review.user_id })
        .select('id', 'first_name', 'last_name', 'avatar_url');
      review.user = user;
    }

    res.json({
      reviews,
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

// Admin routes
router.get('/admin/all', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status;
    const type = req.query.type;
    const offset = (page - 1) * limit;

    let query = db('product_reviews')
      .orderBy('created_at', 'desc');

    if (status) {
      query = query.where({ status });
    }

    if (type === 'product') {
      query = query.whereNotNull('product_id');
    } else if (type === 'shop') {
      query = query.whereNotNull('shop_id');
    }

    const totalCount = await query.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    const reviews = await query
      .offset(offset)
      .limit(limit)
      .select('*');

    // Get related entities
    for (const review of reviews) {
      if (review.product_id) {
        const product = await db('products')
          .where({ id: review.product_id })
          .select('id', 'title', 'slug');
        review.product = product;
      }

      if (review.shop_id) {
        const shop = await db('shops')
          .where({ id: review.shop_id })
          .select('id', 'name', 'slug');
        review.shop = shop;
      }

      const user = await db('users')
        .where({ id: review.user_id })
        .select('id', 'first_name', 'last_name', 'avatar_url');
      review.user = user;
    }

    res.json({
      reviews,
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
