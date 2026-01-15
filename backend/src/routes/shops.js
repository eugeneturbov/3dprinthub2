const express = require('express');
const { body, validationResult } = require('express-validator');
const Shop = require('../models/Shop');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/shops');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения (JPEG, JPG, PNG, GIF, WebP) разрешены'));
    }
  }
});

// Create shop application
router.post('/', authenticate, [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Название магазина должно содержать от 2 до 255 символов'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Описание не должно превышать 2000 символов'),
  body('contact_email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Пожалуйста, предоставьте действительный email'),
  body('contact_phone')
    .optional()
    .isMobilePhone()
    .withMessage('Пожалуйста, предоставьте действительный номер телефона'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Пожалуйста, предоставьте действительный URL'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if user already has a shop
    const existingShops = await Shop.findByOwnerId(req.user.id);
    if (existingShops.length > 0) {
      return res.status(400).json({
        error: 'У вас уже есть магазин'
      });
    }

    const shopData = {
      owner_id: req.user.id,
      ...req.body
    };

    const shop = await Shop.create(shopData);
    res.status(201).json({
      message: 'Заявка на создание магазина отправлена на модерацию',
      shop
    });
  } catch (error) {
    next(error);
  }
});

// Get user's shop
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const shops = await Shop.findByOwnerId(req.user.id);
    
    if (shops.length === 0) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    const shop = shops[0];
    
    // Get shop stats
    const stats = await Shop.getShopStats(shop.id);
    
    res.json({
      shop: {
        ...shop,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update shop
router.put('/my', authenticate, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Название магазина должно содержать от 2 до 255 символов'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Описание не должно превышать 2000 символов'),
  body('contact_email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Пожалуйста, предоставьте действительный email'),
  body('contact_phone')
    .optional()
    .isMobilePhone()
    .withMessage('Пожалуйста, предоставьте действительный номер телефона'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Пожалуйста, предоставьте действительный URL'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const shops = await Shop.findByOwnerId(req.user.id);
    
    if (shops.length === 0) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    const shop = shops[0];
    
    // Check if shop is approved
    if (shop.status !== 'approved') {
      return res.status(403).json({
        error: 'Магазин не одобрен для редактирования'
      });
    }

    const updatedShop = await Shop.update(shop.id, req.body);
    
    res.json({
      message: 'Магазин обновлен успешно',
      shop: updatedShop
    });
  } catch (error) {
    next(error);
  }
});

// Upload shop logo
router.post('/my/logo', authenticate, upload.single('logo'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Файл не загружен'
      });
    }

    const shops = await Shop.findByOwnerId(req.user.id);
    
    if (shops.length === 0) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    const shop = shops[0];
    
    // Delete old logo if exists
    if (shop.logo_url) {
      try {
        const oldLogoPath = path.join(__dirname, '../../uploads', shop.logo_url.replace('/uploads/', ''));
        await fs.unlink(oldLogoPath);
      } catch (error) {
        console.error('Error deleting old logo:', error);
      }
    }

    // Update shop with new logo
    const logoUrl = `/uploads/shops/${req.file.filename}`;
    const updatedShop = await Shop.update(shop.id, { logo_url: logoUrl });
    
    res.json({
      message: 'Логотип загружен успешно',
      logo_url: logoUrl,
      shop: updatedShop
    });
  } catch (error) {
    next(error);
  }
});

// Upload shop banner
router.post('/my/banner', authenticate, upload.single('banner'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Файл не загружен'
      });
    }

    const shops = await Shop.findByOwnerId(req.user.id);
    
    if (shops.length === 0) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    const shop = shops[0];
    
    // Delete old banner if exists
    if (shop.banner_url) {
      try {
        const oldBannerPath = path.join(__dirname, '../../uploads', shop.banner_url.replace('/uploads/', ''));
        await fs.unlink(oldBannerPath);
      } catch (error) {
        console.error('Error deleting old banner:', error);
      }
    }

    // Update shop with new banner
    const bannerUrl = `/uploads/shops/${req.file.filename}`;
    const updatedShop = await Shop.update(shop.id, { banner_url: bannerUrl });
    
    res.json({
      message: 'Баннер загружен успешно',
      banner_url: bannerUrl,
      shop: updatedShop
    });
  } catch (error) {
    next(error);
  }
});

// Get shop products
router.get('/my/products', authenticate, async (req, res, next) => {
  try {
    const shops = await Shop.findByOwnerId(req.user.id);
    
    if (shops.length === 0) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    const shop = shops[0];
    
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc'
    };

    const result = await Shop.getProducts(shop.id, options);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get shop stats
router.get('/my/stats', authenticate, async (req, res, next) => {
  try {
    const shops = await Shop.findByOwnerId(req.user.id);
    
    if (shops.length === 0) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    const shop = shops[0];
    const stats = await Shop.getShopStats(shop.id);
    
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// Get shop sales data
router.get('/my/sales', authenticate, async (req, res, next) => {
  try {
    const shops = await Shop.findByOwnerId(req.user.id);
    
    if (shops.length === 0) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    const shop = shops[0];
    
    const options = {
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      group_by: req.query.group_by || 'day'
    };

    const sales = await Shop.getSales(shop.id, options);
    
    res.json(sales);
  } catch (error) {
    next(error);
  }
});

// Get top products
router.get('/my/top-products', authenticate, async (req, res, next) => {
  try {
    const shops = await Shop.findByOwnerId(req.user.id);
    
    if (shops.length === 0) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    const shop = shops[0];
    
    const limit = parseInt(req.query.limit) || 10;
    const topProducts = await Shop.getTopProducts(shop.id, limit);
    
    res.json(topProducts);
  } catch (error) {
    next(error);
  }
});

// Public routes

// Get shop by slug
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const shop = await Shop.findBySlug(req.params.slug);
    
    if (!shop) {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    // Only show approved shops publicly
    if (shop.status !== 'approved') {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    res.json({ shop });
  } catch (error) {
    next(error);
  }
});

// Get shop products (public)
router.get('/:slug/products', async (req, res, next) => {
  try {
    const shop = await Shop.findBySlug(req.params.slug);
    
    if (!shop || shop.status !== 'approved') {
      return res.status(404).json({
        error: 'Магазин не найден'
      });
    }

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      category_id: req.query.category_id,
      min_price: req.query.min_price,
      max_price: req.query.max_price,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc'
    };

    const result = await Shop.getProducts(shop.id, options);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Admin routes
router.get('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc'
    };

    const result = await Shop.getAll(options);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Update shop status (admin)
router.put('/:id/status', authenticate, authorize('admin'), [
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
    const shop = await Shop.updateStatus(req.params.id, status);
    
    res.json({
      message: `Статус магазина изменен на ${status}`,
      shop
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
