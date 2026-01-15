const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class User {
  static async create(userData) {
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      role = 'user'
    } = userData;

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const email_verification_token = uuidv4();

    const [user] = await db('users')
      .insert({
        email,
        password_hash,
        first_name,
        last_name,
        phone,
        role,
        email_verification_token
      })
      .returning('*');

    // Remove password hash from response
    delete user.password_hash;
    delete user.email_verification_token;
    delete user.password_reset_token;
    delete user.password_reset_expires;

    return user;
  }

  static async findByEmail(email) {
    const user = await db('users')
      .where({ email })
      .first();

    return user;
  }

  static async findById(id) {
    const user = await db('users')
      .where({ id })
      .first();

    if (user) {
      // Remove sensitive data
      delete user.password_hash;
      delete user.email_verification_token;
      delete user.password_reset_token;
      delete user.password_reset_expires;
    }

    return user;
  }

  static async findBySlug(slug) {
    const user = await db('users')
      .where({ slug })
      .first();

    if (user) {
      // Remove sensitive data
      delete user.password_hash;
      delete user.email_verification_token;
      delete user.password_reset_token;
      delete user.password_reset_expires;
    }

    return user;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  static async verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async update(id, userData) {
    const [user] = await db('users')
      .where({ id })
      .update(userData)
      .returning('*');

    if (user) {
      // Remove sensitive data
      delete user.password_hash;
      delete user.email_verification_token;
      delete user.password_reset_token;
      delete user.password_reset_expires;
    }

    return user;
  }

  static async updatePassword(id, newPassword) {
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    const [user] = await db('users')
      .where({ id })
      .update({
        password_hash,
        updated_at: new Date()
      })
      .returning(['id', 'email', 'updated_at']);

    return user;
  }

  static async verifyEmail(token) {
    const [user] = await db('users')
      .where({ email_verification_token: token })
      .update({
        email_verified: true,
        email_verification_token: null,
        updated_at: new Date()
      })
      .returning('*');

    if (user) {
      // Remove sensitive data
      delete user.password_hash;
      delete user.email_verification_token;
      delete user.password_reset_token;
      delete user.password_reset_expires;
    }

    return user;
  }

  static async createPasswordResetToken(email) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db('users')
      .where({ id: user.id })
      .update({
        password_reset_token: resetToken,
        password_reset_expires: expiresAt,
        updated_at: new Date()
      });

    return resetToken;
  }

  static async resetPassword(token, newPassword) {
    const user = await db('users')
      .where({ password_reset_token: token })
      .andWhere('password_reset_expires', '>', new Date())
      .first();

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const saltRounds = 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    await db('users')
      .where({ id: user.id })
      .update({
        password_hash,
        password_reset_token: null,
        password_reset_expires: null,
        updated_at: new Date()
      });

    return true;
  }

  static async getShippingAddresses(userId) {
    return await db('shipping_addresses')
      .where({ user_id: userId })
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'asc');
  }

  static async addShippingAddress(userId, addressData) {
    // If this is set as default, unset other default addresses
    if (addressData.is_default) {
      await db('shipping_addresses')
        .where({ user_id: userId })
        .update({ is_default: false });
    }

    const [address] = await db('shipping_addresses')
      .insert({
        user_id: userId,
        ...addressData
      })
      .returning('*');

    return address;
  }

  static async updateShippingAddress(userId, addressId, addressData) {
    // If this is set as default, unset other default addresses
    if (addressData.is_default) {
      await db('shipping_addresses')
        .where({ user_id: userId })
        .update({ is_default: false });
    }

    const [address] = await db('shipping_addresses')
      .where({ 
        id: addressId,
        user_id: userId
      })
      .update(addressData)
      .returning('*');

    return address;
  }

  static async deleteShippingAddress(userId, addressId) {
    const deleted = await db('shipping_addresses')
      .where({ 
        id: addressId,
        user_id: userId
      })
      .del();

    return deleted > 0;
  }

  static async getWishlist(userId) {
    return await db('wishlist_items')
      .join('products', 'wishlist_items.product_id', 'products.id')
      .join('shops', 'products.shop_id', 'shops.id')
      .where('wishlist_items.user_id', userId)
      .where('products.is_active', true)
      .select(
        'products.*',
        'shops.name as shop_name',
        'shops.slug as shop_slug',
        'wishlist_items.created_at as added_at'
      )
      .orderBy('wishlist_items.created_at', 'desc');
  }

  static async addToWishlist(userId, productId) {
    // Check if already in wishlist
    const exists = await db('wishlist_items')
      .where({ 
        user_id: userId,
        product_id: productId
      })
      .first();

    if (exists) {
      return exists;
    }

    const [item] = await db('wishlist_items')
      .insert({
        user_id: userId,
        product_id: productId
      })
      .returning('*');

    return item;
  }

  static async removeFromWishlist(userId, productId) {
    const deleted = await db('wishlist_items')
      .where({ 
        user_id: userId,
        product_id: productId
      })
      .del();

    return deleted > 0;
  }
}

module.exports = User;
