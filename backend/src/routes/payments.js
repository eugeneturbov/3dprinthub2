const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const yookassa = require('yookassa');

const router = express.Router();

// Initialize YooKassa
const yooKassa = new yookassa({
  shopId: process.env.YOOKASSA_SHOP_ID,
  secretKey: process.env.YOOKASSA_SECRET_KEY
});

// Create payment
router.post('/create', authenticate, [
  body('order_id')
    .isUUID()
    .withMessage('ID заказа должен быть валидным UUID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Сумма должна быть положительным числом'),
  body('currency')
    .isIn(['RUB'])
    .withMessage('Валюта должна быть RUB'),
  body('return_url')
    .isURL()
    .withMessage('Return URL должен быть валидным URL'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { order_id, amount, currency, return_url } = req.body;

    // Get order details
    const db = require('../config/database');
    const order = await db('orders')
      .where({ id: order_id, user_id: req.user.id })
      .first();

    if (!order) {
      return res.status(404).json({
        error: 'Заказ не найден'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        error: 'Заказ уже обработан'
      });
    }

    // Create payment in YooKassa
    const idempotenceKey = crypto.randomBytes(16).toString('hex');
    
    const payment = await yooKassa.createPayment({
      amount: {
        value: amount.toString(),
        currency: currency
      },
      payment_method_data: {
        type: 'bank_card'
      },
      confirmation: {
        type: 'redirect',
        return_url: return_url
      },
      description: `Оплата заказа #${order.order_number}`,
      metadata: {
        order_id: order_id
      },
      capture: true,
      idempotenceKey
    });

    // Save payment record
    const [paymentRecord] = await db('transactions').insert({
      id: uuidv4(),
      user_id: req.user.id,
      order_id,
      type: 'payment',
      amount,
      fee: 0, // YooKassa fee will be calculated later
      net_amount: amount,
      status: 'pending',
      payment_method: 'yookassa',
      external_id: payment.id,
      description: `Оплата заказа #${order.order_number}`
    }).returning('*');

    // Update order with payment ID
    await db('orders')
      .where({ id: order_id })
      .update({
        payment_id: payment.id,
        updated_at: new Date()
      });

    res.status(201).json({
      payment_url: payment.confirmation.confirmation_url,
      payment_id: payment.id,
      transaction_id: paymentRecord.id
    });

  } catch (error) {
    next(error);
  }
});

// Confirm payment (webhook)
router.post('/confirm/:paymentId', async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const body = req.body;

    // Verify webhook signature
    const signature = req.headers['authorization'];
    const expectedSignature = crypto
      .createHmac('sha256', process.env.YOOKASSA_SECRET_KEY)
      .update(JSON.stringify(body))
      .digest('base64');

    if (signature !== expectedSignature) {
      return res.status(401).json({
        error: 'Invalid signature'
      });
    }

    const payment = await yooKassa.getPayment(paymentId);

    if (payment.status === 'succeeded') {
      const db = require('../config/database');
      
      // Get transaction record
      const transaction = await db('transactions')
        .where({ external_id: paymentId })
        .first();

      if (!transaction) {
        return res.status(404).json({
          error: 'Transaction not found'
        });
      }

      // Update transaction status
      await db('transactions')
        .where({ id: transaction.id })
        .update({
          status: 'completed',
          updated_at: new Date()
        });

      // Update order status
      await db('orders')
        .where({ id: transaction.order_id })
        .update({
          status: 'processing',
          updated_at: new Date()
        });

      // TODO: Send confirmation email
      // TODO: Update shop balance (for digital products)

      res.json({ status: 'success' });
    } else {
      res.json({ status: 'failed', payment });
    }

  } catch (error) {
    next(error);
  }
});

// Get payment status
router.get('/status/:paymentId', authenticate, async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    const payment = await yooKassa.getPayment(paymentId);

    res.json({
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      created_at: payment.created_at,
      captured_at: payment.captured_at
    });

  } catch (error) {
    next(error);
  }
});

// Request withdrawal
router.post('/withdrawal', authenticate, authorize('seller', 'admin'), [
  body('amount')
    .isFloat({ min: 1000 })
    .withMessage('Минимальная сумма вывода 1000'),
  body('method')
    .isIn(['bank_card', 'bank_account', 'yoomoney'])
    .withMessage('Недопустимый способ вывода'),
  body('details')
    .notEmpty()
    .withMessage('Реквизиты обязательны'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { amount, method, details } = req.body;
    const userId = req.user.id;

    const db = require('../config/database');

    // Get user's shop
    const shop = await db('shops')
      .where({ owner_id: userId, status: 'approved' })
      .first();

    if (!shop) {
      return res.status(403).json({
        error: 'У вас нет активного магазина'
      });
    }

    // Check balance
    if (amount > shop.balance) {
      return res.status(400).json({
        error: 'Недостаточно средств на балансе'
      });
    }

    // Calculate withdrawal fee
    const fee = Math.max(50, amount * 0.02); // 2% or 50 minimum
    const netAmount = amount - fee;

    // Create withdrawal transaction
    const [transaction] = await db('transactions').insert({
      id: uuidv4(),
      user_id: userId,
      shop_id: shop.id,
      type: 'withdrawal',
      amount,
      fee,
      net_amount: netAmount,
      status: 'pending',
      payment_method: method,
      description: `Вывод средств: ${method}`,
      metadata: JSON.stringify({ details })
    }).returning('*');

    // Update shop balance
    await db('shops')
      .where({ id: shop.id })
      .update({
        balance: db.raw('balance - ?', [amount]),
        updated_at: new Date()
      });

    // TODO: Send notification to admin
    // TODO: Process withdrawal (manual review)

    res.status(201).json({
      message: 'Запрос на вывод средств создан',
      transaction
    });

  } catch (error) {
    next(error);
  }
});

// Get withdrawal history
router.get('/withdrawals', authenticate, authorize('seller', 'admin'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const offset = (page - 1) * limit;

    const db = require('../config/database');

    let query = db('transactions')
      .where({ type: 'withdrawal' });

    if (req.user.role !== 'admin') {
      query = query.where({ user_id: req.user.id });
    }

    if (status) {
      query = query.where({ status });
    }

    query = query.orderBy('created_at', 'desc');

    const totalCount = await query.clone().count('* as count').first();
    const total = parseInt(totalCount.count);

    const withdrawals = await query
      .offset(offset)
      .limit(limit)
      .select('*');

    res.json({
      withdrawals,
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

// Process refund
router.post('/refund/:orderId', authenticate, authorize('admin'), [
  body('reason')
    .notEmpty()
    .withMessage('Причина возврата обязательна'),
  body('amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Сумма возврата должна быть положительным числом'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { orderId } = req.params;
    const { reason, amount } = req.body;

    const db = require('../config/database');

    // Get order
    const order = await db('orders')
      .where({ id: orderId })
      .first();

    if (!order) {
      return res.status(404).json({
        error: 'Заказ не найден'
      });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        error: 'Возврат возможен только для доставленных заказов'
      });
    }

    const refundAmount = amount || order.total_amount;

    if (refundAmount > order.total_amount) {
      return res.status(400).json({
        error: 'Сумма возврата не может превышать сумму заказа'
      });
    }

    // Create refund transaction
    const [transaction] = await db('transactions').insert({
      id: uuidv4(),
      user_id: order.user_id,
      order_id: orderId,
      type: 'refund',
      amount: refundAmount,
      fee: 0,
      net_amount: -refundAmount,
      status: 'completed',
      description: reason,
      payment_method: order.payment_method
    }).returning('*');

    // Update order status
    await db('orders')
      .where({ id: orderId })
      .update({
        status: 'refunded',
        updated_at: new Date()
      });

    // TODO: Process actual refund via payment gateway
    // TODO: Update shop balance if needed

    res.json({
      message: 'Возврат обработан',
      transaction
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
