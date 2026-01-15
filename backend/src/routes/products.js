const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/products');
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
    fileSize: 10 * 1024 * 1024, // 10MB
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

// Configure multer for 3D files
const fileStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/files');
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

const fileUpload = multer({
  storage: fileStorage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /stl|obj|3mf|ply|dae|fbx|blend/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только 3D файлы (STL, OBJ, 3MF, PLY, DAE, FBX, BLEND) разрешены'));
    }
  }
});

// Create product
router.post('/', authenticate, authorize('seller', 'admin'), [
  body('title')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Название должно содержать от 2 до 255 символов'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Описание не должно превышать 10000 символов'),
  body('short_description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Краткое описание не должно превышать 500 символов'),
  body('type')
    .isIn(['physical', 'digital'])
    .withMessage('Тип должен быть physical или digital'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
  body('compare_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Цена для сравнения должна быть положительным числом'),
  body('cost_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Себестоимость должна быть положительным числом'),
  body('sku')
    .optional()
    .isLength({ max: 100 })
    .withMessage('SKU не должен превышать 100 символов'),
  body('track_inventory')
    .optional()
    .isBoolean()
    .withMessage('track_inventory должно быть булевым значением'),
  body('inventory_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Количество на складе должно быть неотрицательным целым числом'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Вес должен быть положительным числом'),
  body('requires_shipping')
    .optional()
    .isBoolean()
    .withMessage('requires_shipping должно быть булевым значением'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Get user's shop
    const Shop = require('../models/Shop');
    const shops = await Shop.findByOwnerId(req.user.id);
    
    if (shops.length === 0) {
      return res.status(403).json({
        error: 'У вас нет магазина'
      });
    }

    const shop = shops[0];
    
    if (shop.status !== 'approved') {
      return res.status(403).json({
        error: 'Ваш магазин не одобрен'
      });
    }

    const productData = {
      shop_id: shop.id,
      ...req.body
    };

    const product = await Product.create(productData);
    
    res.status(201).json({
      message: 'Товар создан успешно',
      product
    });
  } catch (error) {
    next(error);
  }
});

// Get products (public)
router.get('/', async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      q: req.query.q,
      category_id: req.query.category_id,
      shop_id: req.query.shop_id,
      min_price: req.query.min_price,
      max_price: req.query.max_price,
      type: req.query.type,
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc',
      featured: req.query.featured === 'true'
    };

    const result = await Product.search(options);
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get featured products
router.get('/featured', async (req, res, next) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await Product.search({ ...options, featured: true });
    
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get product by ID
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Increment view count
    await Product.incrementViewCount(req.params.id);
    
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

// Update product
router.put('/:id', authenticate, authorize('seller', 'admin'), [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Название должно содержать от 2 до 255 символов'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Описание не должно превышать 10000 символов'),
  body('short_description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Краткое описание не должно превышать 500 символов'),
  body('type')
    .optional()
    .isIn(['physical', 'digital'])
    .withMessage('Тип должен быть physical или digital'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
  body('compare_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Цена для сравнения должна быть положительным числом'),
  body('cost_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Себестоимость должна быть положительным числом'),
  body('sku')
    .optional()
    .isLength({ max: 100 })
    .withMessage('SKU не должен превышать 100 символов'),
  body('track_inventory')
    .optional()
    .isBoolean()
    .withMessage('track_inventory должно быть булевым значением'),
  body('inventory_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Количество на складе должно быть неотрицательным целым числом'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Вес должен быть положительным числом'),
  body('requires_shipping')
    .optional()
    .isBoolean()
    .withMessage('requires_shipping должно быть булевым значением'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Check if user owns the product
    if (req.user.role !== 'admin' && product.shop.owner_id !== req.user.id) {
      return res.status(403).json({
        error: 'Доступ запрещен'
      });
    }

    const updatedProduct = await Product.update(req.params.id, req.body);
    
    res.json({
      message: 'Товар обновлен успешно',
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
});

// Delete product
router.delete('/:id', authenticate, authorize('seller', 'admin'), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Check if user owns the product
    if (req.user.role !== 'admin' && product.shop.owner_id !== req.user.id) {
      return res.status(403).json({
        error: 'Доступ запрещен'
      });
    }

    await Product.delete(req.params.id);
    
    res.json({
      message: 'Товар удален успешно'
    });
  } catch (error) {
    next(error);
  }
});

// Upload product images
router.post('/:id/images', authenticate, authorize('seller', 'admin'), upload.array('images', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'Файлы не загружены'
      });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Check if user owns the product
    if (req.user.role !== 'admin' && product.shop.owner_id !== req.user.id) {
      return res.status(403).json({
        error: 'Доступ запрещен'
      });
    }

    const uploadedImages = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const imageUrl = `/uploads/products/${file.filename}`;
      
      const image = await Product.addImage(req.params.id, imageUrl, file.originalname, i);
      uploadedImages.push(image);
    }
    
    res.json({
      message: 'Изображения загружены успешно',
      images: uploadedImages
    });
  } catch (error) {
    next(error);
  }
});

// Delete product image
router.delete('/:productId/images/:imageId', authenticate, authorize('seller', 'admin'), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Check if user owns the product
    if (req.user.role !== 'admin' && product.shop.owner_id !== req.user.id) {
      return res.status(403).json({
        error: 'Доступ запрещен'
      });
    }

    // Get image info before deletion
    const db = require('../config/database');
    const image = await db('product_images')
      .where({ id: req.params.imageId, product_id: req.params.productId })
      .first();

    if (image) {
      // Delete file from filesystem
      try {
        const imagePath = path.join(__dirname, '../../uploads', image.image_url.replace('/uploads/', ''));
        await fs.unlink(imagePath);
      } catch (error) {
        console.error('Error deleting image file:', error);
      }
    }

    await Product.deleteImage(req.params.imageId);
    
    res.json({
      message: 'Изображение удалено успешно'
    });
  } catch (error) {
    next(error);
  }
});

// Upload product file (for digital products)
router.post('/:id/file', authenticate, authorize('seller', 'admin'), fileUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Файл не загружен'
      });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Check if user owns the product
    if (req.user.role !== 'admin' && product.shop.owner_id !== req.user.id) {
      return res.status(403).json({
        error: 'Доступ запрещен'
      });
    }

    if (product.type !== 'digital') {
      return res.status(400).json({
        error: 'Файл можно загрузить только для цифровых товаров'
      });
    }

    // Delete old file if exists
    if (product.file_url) {
      try {
        const oldFilePath = path.join(__dirname, '../../uploads', product.file_url.replace('/uploads/', ''));
        await fs.unlink(oldFilePath);
      } catch (error) {
        console.error('Error deleting old file:', error);
      }
    }

    const fileUrl = `/uploads/files/${req.file.filename}`;
    const fileSize = req.file.size;
    
    const updatedProduct = await Product.update(req.params.id, {
      file_url: fileUrl,
      file_size: fileSize
    });
    
    res.json({
      message: 'Файл загружен успешно',
      file_url: fileUrl,
      file_size: fileSize,
      product: updatedProduct
    });
  } catch (error) {
    next(error);
  }
});

// Create product variant
router.post('/:id/variants', authenticate, authorize('seller', 'admin'), [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Название варианта обязательно и не должно превышать 255 символов'),
  body('sku')
    .optional()
    .isLength({ max: 100 })
    .withMessage('SKU не должен превышать 100 символов'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
  body('compare_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Цена для сравнения должна быть положительным числом'),
  body('cost_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Себестоимость должна быть положительным числом'),
  body('inventory_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Количество на складе должно быть неотрицательным целым числом'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Вес должен быть положительным числом'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Check if user owns the product
    if (req.user.role !== 'admin' && product.shop.owner_id !== req.user.id) {
      return res.status(403).json({
        error: 'Доступ запрещен'
      });
    }

    const variant = await Product.createVariant(req.params.id, req.body);
    
    res.status(201).json({
      message: 'Вариант создан успешно',
      variant
    });
  } catch (error) {
    next(error);
  }
});

// Update product variant
router.put('/variants/:variantId', authenticate, authorize('seller', 'admin'), [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Название варианта не должно превышать 255 символов'),
  body('sku')
    .optional()
    .isLength({ max: 100 })
    .withMessage('SKU не должен превышать 100 символов'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Цена должна быть положительным числом'),
  body('compare_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Цена для сравнения должна быть положительным числом'),
  body('cost_price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Себестоимость должна быть положительным числом'),
  body('inventory_quantity')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Количество на складе должно быть неотрицательным целым числом'),
  body('weight')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Вес должен быть положительным числом'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Get variant to check ownership
    const variant = await Product.getVariantById(req.params.variantId);
    
    if (!variant) {
      return res.status(404).json({
        error: 'Вариант не найден'
      });
    }

    // Get product to check ownership
    const product = await Product.findById(variant.product_id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Check if user owns the product
    if (req.user.role !== 'admin' && product.shop.owner_id !== req.user.id) {
      return res.status(403).json({
        error: 'Доступ запрещен'
      });
    }

    const updatedVariant = await Product.updateVariant(req.params.variantId, req.body);
    
    res.json({
      message: 'Вариант обновлен успешно',
      variant: updatedVariant
    });
  } catch (error) {
    next(error);
  }
});

// Delete product variant
router.delete('/variants/:variantId', authenticate, authorize('seller', 'admin'), async (req, res, next) => {
  try {
    // Get variant to check ownership
    const variant = await Product.getVariantById(req.params.variantId);
    
    if (!variant) {
      return res.status(404).json({
        error: 'Вариант не найден'
      });
    }

    // Get product to check ownership
    const product = await Product.findById(variant.product_id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    // Check if user owns the product
    if (req.user.role !== 'admin' && product.shop.owner_id !== req.user.id) {
      return res.status(403).json({
        error: 'Доступ запрещен'
      });
    }

    await Product.deleteVariant(req.params.variantId);
    
    res.json({
      message: 'Вариант удален успешно'
    });
  } catch (error) {
    next(error);
  }
});

// Get related products
router.get('/:id/related', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Товар не найден'
      });
    }

    const limit = parseInt(req.query.limit) || 10;
    const relatedProducts = await Product.getRelatedProducts(req.params.id, { limit });
    
    res.json({
      products: relatedProducts
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
