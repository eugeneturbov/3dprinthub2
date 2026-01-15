const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Register
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('first_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('last_name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, first_name, last_name, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      first_name,
      last_name,
      phone
    });

    // Generate token
    const token = await User.generateToken(user);

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, user.email_verification_token);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email for verification.',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        error: 'Account is deactivated'
      });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate token
    const token = await User.generateToken(user);

    // Remove sensitive data
    delete user.password_hash;
    delete user.email_verification_token;
    delete user.password_reset_token;
    delete user.password_reset_expires;

    res.json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
});

// Verify email
router.post('/verify-email', [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token } = req.body;

    const user = await User.verifyEmail(token);
    if (!user) {
      return res.status(400).json({
        error: 'Invalid or expired verification token'
      });
    }

    res.json({
      message: 'Email verified successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

// Resend verification email
router.post('/resend-verification', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        error: 'Email is already verified'
      });
    }

    // Generate new verification token
    const { v4: uuidv4 } = require('uuid');
    const newToken = uuidv4();

    await User.update(user.id, {
      email_verification_token: newToken
    });

    // Send verification email
    try {
      await emailService.sendVerificationEmail(user.email, newToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      return res.status(500).json({
        error: 'Failed to send verification email'
      });
    }

    res.json({
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Forgot password
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email } = req.body;

    const resetToken = await User.createPasswordResetToken(email);

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      return res.status(500).json({
        error: 'Failed to send password reset email'
      });
    }

    res.json({
      message: 'Password reset email sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Reset password
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token, password } = req.body;

    await User.resetPassword(token, password);

    res.json({
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    next(error);
  }
});

// Update profile
router.put('/me', authenticate, [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('First name must be at least 2 characters long'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Last name must be at least 2 characters long'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { first_name, last_name, phone } = req.body;

    const user = await User.update(req.user.id, {
      first_name,
      last_name,
      phone
    });

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
});

// Change password
router.put('/change-password', authenticate, [
  body('current_password')
    .notEmpty()
    .withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { current_password, new_password } = req.body;

    // Get user with password hash
    const userWithPassword = await db('users')
      .where({ id: req.user.id })
      .first();

    // Verify current password
    const isValidPassword = await User.verifyPassword(current_password, userWithPassword.password_hash);
    if (!isValidPassword) {
      return res.status(400).json({
        error: 'Current password is incorrect'
      });
    }

    await User.updatePassword(req.user.id, new_password);

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
