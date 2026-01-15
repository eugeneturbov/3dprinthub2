const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Product {
  static async create(productData) {
    const {
      shop_id,
      category_id,
      title,
      description,
      short_description,
      type,
      file_url,
      file_size,
      price,
      compare_price,
      cost_price,
      sku,
      track_inventory = true,
      inventory_quantity = 0,
      weight,
      requires_shipping = true
    } = productData;

    // Generate unique slug
    let slug = title
      .toLowerCase()
      .replace(/[^a-z0-9а-яё\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    // Ensure slug is unique within the shop
    let uniqueSlug = slug;
    let counter = 1;
    while (await this.findByShopAndSlug(shop_id, uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;
    }

    const [product] = await db('products')
      .insert({
        shop_id,
        category_id,
        title,
        slug: uniqueSlug,
        description,
        short_description,
        type,
        file_url,
        file_size,
        price,
        compare_price,
        cost_price,
        sku,
        track_inventory,
        inventory_quantity,
        weight,
        requires_shipping
      })
      .returning('*');

    return product;
  }

  static async findById(id) {
    const product = await db('products')
      .where({ id })
      .first();

    if (product) {
      // Get shop info
      const shop = await db('shops')
        .where({ id: product.shop_id })
        .select('id', 'name', 'slug', 'logo_url', 'rating', 'status')
        .first();

      product.shop = shop;

      // Get category info
      if (product.category_id) {
        const category = await db('categories')
          .where({ id: product.category_id })
          .select('id', 'name', 'slug')
          .first();

        product.category = category;
      }

      // Get images
      const images = await db('product_images')
        .where({ product_id: product.id })
        .orderBy('sort_order', 'asc')
        .select('*');

      product.images = images;

      // Get variants
      const variants = await db('product_variants')
        .where({ product_id: product.id, is_active: true })
        .orderBy('created_at', 'asc')
        .select('*');

      // Get variant options for each variant
      for (const variant of variants) {
        const options = await db('variant_options')
          .where({ variant_id: variant.id })
          .select('*');

        variant.options = options;
      }

      product.variants = variants;
    }

    return product;
  }

  static async findByShopAndSlug(shopId, slug) {
    const product = await db('products')
      .where({ shop_id: shopId, slug })
      .first();

    return product;
  }

  static async findBySlug(slug) {
    const product = await db('products')
      .where({ slug })
      .first();

    return product;
  }

  static async update(id, productData) {
    const [product] = await db('products')
      .where({ id })
      .update({
        ...productData,
        updated_at: new Date()
      })
      .returning('*');

    return product;
  }

  static async delete(id) {
    // Soft delete by setting is_active to false
    const deleted = await db('products')
      .where({ id })
      .update({
        is_active: false,
        updated_at: new Date()
      });

    return deleted > 0;
  }

  static async addImage(productId, imageUrl, altText = null, sortOrder = 0) {
    const [image] = await db('product_images')
      .insert({
        product_id: productId,
        image_url: imageUrl,
        alt_text: altText,
        sort_order: sortOrder
      })
      .returning('*');

    return image;
  }

  static async updateImage(imageId, imageData) {
    const [image] = await db('product_images')
      .where({ id: imageId })
      .update(imageData)
      .returning('*');

    return image;
  }

  static async deleteImage(imageId) {
    const deleted = await db('product_images')
      .where({ id: imageId })
      .del();

    return deleted > 0;
  }

  static async createVariant(productId, variantData) {
    const {
      title,
      sku,
      price,
      compare_price,
      cost_price,
      inventory_quantity = 0,
      weight,
      image_url,
      options = []
    } = variantData;

    const [variant] = await db('product_variants')
      .insert({
        product_id: productId,
        title,
        sku,
        price,
        compare_price,
        cost_price,
        inventory_quantity,
        weight,
        image_url
      })
      .returning('*');

    // Add variant options
    if (options.length > 0) {
      const optionData = options.map(option => ({
        variant_id: variant.id,
        name: option.name,
        value: option.value
      }));

      await db('variant_options').insert(optionData);
    }

    // Get variant with options
    const variantWithOptions = await this.getVariantById(variant.id);

    return variantWithOptions;
  }

  static async getVariantById(variantId) {
    const variant = await db('product_variants')
      .where({ id: variantId })
      .first();

    if (variant) {
      const options = await db('variant_options')
        .where({ variant_id: variant.id })
        .select('*');

      variant.options = options;
    }

    return variant;
  }

  static async updateVariant(variantId, variantData) {
    const { options, ...data } = variantData;

    const [variant] = await db('product_variants')
      .where({ id: variantId })
      .update({
        ...data,
        updated_at: new Date()
      })
      .returning('*');

    // Update options if provided
    if (options) {
      // Delete existing options
      await db('variant_options')
        .where({ variant_id: variantId })
        .del();

      // Add new options
      if (options.length > 0) {
        const optionData = options.map(option => ({
          variant_id: variantId,
          name: option.name,
          value: option.value
        }));

        await db('variant_options').insert(optionData);
      }
    }

    // Get variant with updated options
    const variantWithOptions = await this.getVariantById(variantId);

    return variantWithOptions;
  }

  static async deleteVariant(variantId) {
    // Soft delete by setting is_active to false
    const deleted = await db('product_variants')
      .where({ id: variantId })
      .update({
        is_active: false,
        updated_at: new Date()
      });

    return deleted > 0;
  }

  static async search(query, options = {}) {
    const {
      page = 1,
      limit = 20,
      category_id,
      shop_id,
      min_price,
      max_price,
      type,
      sort = 'created_at',
      order = 'desc',
      featured = false
    } = options;

    const offset = (page - 1) * limit;

    let dbQuery = db('products')
      .where('is_active', true);

    // Search by title and description
    if (query) {
      dbQuery = dbQuery.where(function() {
        this.where('title', 'ilike', `%${query}%`)
            .orWhere('description', 'ilike', `%${query}%`)
            .orWhere('short_description', 'ilike', `%${query}%`);
      });
    }

    // Apply filters
    if (category_id) {
      dbQuery = dbQuery.where({ category_id });
    }

    if (shop_id) {
      dbQuery = dbQuery.where({ shop_id });
    }

    if (min_price) {
      dbQuery = dbQuery.where('price', '>=', min_price);
    }

    if (max_price) {
      dbQuery = dbQuery.where('price', '<=', max_price);
    }

    if (type) {
      dbQuery = dbQuery.where({ type });
    }

    if (featured) {
      dbQuery = dbQuery.where('is_featured', true);
    }

    // Apply sorting
    const validSorts = ['created_at', 'price', 'title', 'view_count', 'sold_count', 'rating'];
    const sortField = validSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    dbQuery = dbQuery.orderBy(sortField, sortOrder);

    // Get total count
    const totalCount = await dbQuery.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    // Get paginated results
    const products = await dbQuery
      .offset(offset)
      .limit(limit)
      .select('*');

    // Get additional data for each product
    for (const product of products) {
      // Get shop info
      const shop = await db('shops')
        .where({ id: product.shop_id })
        .select('id', 'name', 'slug', 'logo_url', 'rating')
        .first();

      product.shop = shop;

      // Get category info
      if (product.category_id) {
        const category = await db('categories')
          .where({ id: product.category_id })
          .select('id', 'name', 'slug')
          .first();

        product.category = category;
      }

      // Get first image
      const firstImage = await db('product_images')
        .where({ product_id: product.id })
        .orderBy('sort_order', 'asc')
        .first();

      product.image = firstImage;
    }

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

  static async incrementViewCount(productId) {
    await db('products')
      .where({ id: productId })
      .update({
        view_count: db.raw('view_count + 1'),
        updated_at: new Date()
      });
  }

  static async updateInventory(productId, quantity, variantId = null) {
    if (variantId) {
      await db('product_variants')
        .where({ id: variantId, product_id: productId })
        .update({
          inventory_quantity: db.raw(`inventory_quantity - ${quantity}`),
          updated_at: new Date()
        });
    } else {
      await db('products')
        .where({ id: productId })
        .update({
          inventory_quantity: db.raw(`inventory_quantity - ${quantity}`),
          sold_count: db.raw(`sold_count + ${quantity}`),
          updated_at: new Date()
        });
    }
  }

  static async getRelatedProducts(productId, limit = 10) {
    const product = await this.findById(productId);
    if (!product) {
      return [];
    }

    const related = await db('products')
      .where('id', '!=', productId)
      .where('is_active', true)
      .where(function() {
        this.where('category_id', product.category_id)
            .orWhere('shop_id', product.shop_id);
      })
      .orderBy('rating', 'desc')
      .orderBy('sold_count', 'desc')
      .limit(limit)
      .select('*');

    // Get shop info and first image for each related product
    for (const relatedProduct of related) {
      const shop = await db('shops')
        .where({ id: relatedProduct.shop_id })
        .select('id', 'name', 'slug', 'logo_url')
        .first();

      relatedProduct.shop = shop;

      const firstImage = await db('product_images')
        .where({ product_id: relatedProduct.id })
        .orderBy('sort_order', 'asc')
        .first();

      relatedProduct.image = firstImage;
    }

    return related;
  }

  static async getFeaturedProducts(limit = 20) {
    const products = await db('products')
      .where('is_active', true)
      .where('is_featured', true)
      .orderBy('rating', 'desc')
      .orderBy('sold_count', 'desc')
      .limit(limit)
      .select('*');

    // Get shop info and first image for each product
    for (const product of products) {
      const shop = await db('shops')
        .where({ id: product.shop_id })
        .select('id', 'name', 'slug', 'logo_url')
        .first();

      product.shop = shop;

      const firstImage = await db('product_images')
        .where({ product_id: product.id })
        .orderBy('sort_order', 'asc')
        .first();

      product.image = firstImage;
    }

    return products;
  }
}

module.exports = Product;
