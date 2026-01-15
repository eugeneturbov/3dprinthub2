const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all categories (public)
router.get('/', async (req, res, next) => {
  try {
    const categories = await db('categories')
      .where('is_active', true)
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')
      .select('*');

    // Build category tree
    const categoryMap = new Map();
    const rootCategories = [];

    // Create map of all categories
    categories.forEach(category => {
      category.children = [];
      categoryMap.set(category.id, category);
    });

    // Build tree structure
    categories.forEach(category => {
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children.push(category);
        }
      } else {
        rootCategories.push(category);
      }
    });

    res.json({
      categories: rootCategories
    });
  } catch (error) {
    next(error);
  }
});

// Get category by slug (public)
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const category = await db('categories')
      .where({ slug: req.params.slug, is_active: true })
      .first();

    if (!category) {
      return res.status(404).json({
        error: 'Категория не найдена'
      });
    }

    // Get parent category
    if (category.parent_id) {
      const parent = await db('categories')
        .where({ id: category.parent_id })
        .select('id', 'name', 'slug')
        .first();
      category.parent = parent;
    }

    // Get child categories
    const children = await db('categories')
      .where({ parent_id: category.id, is_active: true })
      .orderBy('sort_order', 'asc')
      .select('*');
    category.children = children;

    res.json({ category });
  } catch (error) {
    next(error);
  }
});

// Get category products (public)
router.get('/:slug/products', async (req, res, next) => {
  try {
    const category = await db('categories')
      .where({ slug: req.params.slug, is_active: true })
      .first();

    if (!category) {
      return res.status(404).json({
        error: 'Категория не найдена'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    // Get products in this category and subcategories
    const Product = require('../models/Product');
    const result = await Product.search({
      category_id: category.id,
      page,
      limit,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc'
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Create category (admin only)
router.post('/', authenticate, authorize('admin'), [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Название должно содержать от 2 до 255 символов'),
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Slug должен содержать от 2 до 255 символов'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Описание не должно превышать 2000 символов'),
  body('parent_id')
    .optional()
    .isUUID()
    .withMessage('Parent ID должен быть валидным UUID'),
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order должен быть неотрицательным целым числом'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { name, slug, description, parent_id, sort_order } = req.body;

    // Generate slug if not provided
    let categorySlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Check if slug is unique
    const existingCategory = await db('categories')
      .where({ slug: categorySlug })
      .first();

    if (existingCategory) {
      return res.status(400).json({
        error: 'Категория с таким slug уже существует'
      });
    }

    // If parent_id is provided, check if parent exists
    if (parent_id) {
      const parent = await db('categories')
        .where({ id: parent_id })
        .first();

      if (!parent) {
        return res.status(400).json({
          error: 'Родительская категория не найдена'
        });
      }
    }

    const [category] = await db('categories')
      .insert({
        name,
        slug: categorySlug,
        description,
        parent_id,
        sort_order: sort_order || 0
      })
      .returning('*');

    res.status(201).json({
      message: 'Категория создана успешно',
      category
    });
  } catch (error) {
    next(error);
  }
});

// Update category (admin only)
router.put('/:id', authenticate, authorize('admin'), [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Название должно содержать от 2 до 255 символов'),
  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Slug должен содержать от 2 до 255 символов'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Описание не должно превышать 2000 символов'),
  body('parent_id')
    .optional()
    .isUUID()
    .withMessage('Parent ID должен быть валидным UUID'),
  body('sort_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Sort order должен быть неотрицательным целым числом'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Is active должно быть булевым значением'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const category = await db('categories')
      .where({ id: req.params.id })
      .first();

    if (!category) {
      return res.status(404).json({
        error: 'Категория не найдена'
      });
    }

    const updateData = req.body;

    // Generate slug if name changed and slug not provided
    if (req.body.name && !req.body.slug) {
      updateData.slug = req.body.name
        .toLowerCase()
        .replace(/[^a-z0-9а-яё\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
    }

    // Check if new slug is unique (if changed)
    if (updateData.slug && updateData.slug !== category.slug) {
      const existingCategory = await db('categories')
        .where({ slug: updateData.slug })
        .whereNot('id', req.params.id)
        .first();

      if (existingCategory) {
        return res.status(400).json({
          error: 'Категория с таким slug уже существует'
        });
      }
    }

    // If parent_id is provided, check if parent exists and not self
    if (updateData.parent_id) {
      if (updateData.parent_id === req.params.id) {
        return res.status(400).json({
          error: 'Категория не может быть родительской для самой себя'
        });
      }

      const parent = await db('categories')
        .where({ id: updateData.parent_id })
        .first();

      if (!parent) {
        return res.status(400).json({
          error: 'Родительская категория не найдена'
        });
      }
    }

    const [updatedCategory] = await db('categories')
      .where({ id: req.params.id })
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .returning('*');

    res.json({
      message: 'Категория обновлена успешно',
      category: updatedCategory
    });
  } catch (error) {
    next(error);
  }
});

// Delete category (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const category = await db('categories')
      .where({ id: req.params.id })
      .first();

    if (!category) {
      return res.status(404).json({
        error: 'Категория не найдена'
      });
    }

    // Check if category has children
    const childrenCount = await db('categories')
      .where({ parent_id: req.params.id })
      .count('* as count')
      .first();

    if (parseInt(childrenCount.count) > 0) {
      return res.status(400).json({
        error: 'Нельзя удалить категорию с дочерними категориями'
      });
    }

    // Check if category has products
    const productsCount = await db('products')
      .where({ category_id: req.params.id })
      .count('* as count')
      .first();

    if (parseInt(productsCount.count) > 0) {
      return res.status(400).json({
        error: 'Нельзя удалить категорию с товарами'
      });
    }

    await db('categories')
      .where({ id: req.params.id })
      .del();

    res.json({
      message: 'Категория удалена успешно'
    });
  } catch (error) {
    next(error);
  }
});

// Get category by ID (admin)
router.get('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const category = await db('categories')
      .where({ id: req.params.id })
      .first();

    if (!category) {
      return res.status(404).json({
        error: 'Категория не найдена'
      });
    }

    // Get parent category
    if (category.parent_id) {
      const parent = await db('categories')
        .where({ id: category.parent_id })
        .select('id', 'name', 'slug')
        .first();
      category.parent = parent;
    }

    // Get child categories
    const children = await db('categories')
      .where({ parent_id: category.id })
      .orderBy('sort_order', 'asc')
      .select('*');
    category.children = children;

    // Get products count
    const productsCount = await db('products')
      .where({ category_id: req.params.id })
      .count('* as count')
      .first();
    category.products_count = parseInt(productsCount.count);

    res.json({ category });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
