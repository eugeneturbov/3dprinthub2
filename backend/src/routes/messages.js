const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Send message
router.post('/', authenticate, [
  body('recipient_id')
    .isUUID()
    .withMessage('ID получателя должен быть валидным UUID'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Тема обязательна и не должна превышать 255 символов'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Сообщение обязательно и не должно превышать 2000 символов'),
  body('order_id')
    .optional()
    .isUUID()
    .withMessage('ID заказа должен быть валидным UUID'),
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { recipient_id, subject, content, order_id } = req.body;
    const sender_id = req.user.id;

    // Check if recipient exists
    const recipient = await db('users')
      .where({ id: recipient_id, is_active: true })
      .first();

    if (!recipient) {
      return res.status(404).json({
        error: 'Получатель не найден'
      });
    }

    // Check if user is messaging themselves
    if (sender_id === recipient_id) {
      return res.status(400).json({
        error: 'Нельзя отправить сообщение самому себе'
      });
    }

    // Check if order exists and belongs to either user
    let order = null;
    if (order_id) {
      order = await db('orders')
        .where({ id: order_id })
        .first();

      if (!order) {
        return res.status(404).json({
          error: 'Заказ не найден'
        });
      }

      const isOrderOwner = order.user_id === sender_id;
      const isOrderSeller = await db('order_items')
        .join('products', 'order_items.product_id', 'products.id')
        .join('shops', 'products.shop_id', 'shops.id')
        .where({ 
          'order_items.order_id': order_id,
          'shops.owner_id': recipient_id
        })
        .first();

      if (!isOrderOwner && !isOrderSeller) {
        return res.status(403).json({
          error: 'Вы не можете отправлять сообщения по этому заказу'
        });
      }
    }

    // Create message
    const [message] = await db('messages').insert({
      id: uuidv4(),
      sender_id,
      recipient_id,
      order_id: order_id || null,
      subject,
      content,
      is_read: false,
      created_at: new Date()
    }).returning('*');

    // TODO: Send real-time notification via WebSocket
    // TODO: Send email notification

    res.status(201).json({
      message: 'Сообщение отправлено',
      message
    });

  } catch (error) {
    next(error);
  }
});

// Get conversations
router.get('/conversations', authenticate, async (req, res, next) => {
  try {
    const conversations = await db('messages')
      .where({ sender_id: req.user.id })
      .orWhere({ recipient_id: req.user.id })
      .select(
        'id',
        'sender_id',
        'recipient_id',
        'subject',
        'content',
        'is_read',
        'created_at',
        db.raw('(CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END) as other_user_id'),
        db.raw('(CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END) as other_user_name'),
        db.raw('(CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END) as other_user_avatar_url')
      )
      .orderBy('created_at', 'desc')
      .groupBy('other_user_id')
      .select(
        db.raw('MAX(id) as id'),
        'other_user_id',
        'other_user_name',
        'other_user_avatar_url',
        db.raw('MAX(created_at) as last_message_at'),
        db.raw('COUNT(*) as unread_count'),
        db.raw('(SELECT content FROM messages WHERE (sender_id = ? AND recipient_id = other_user_id OR recipient_id = ? AND sender_id = other_user_id) ORDER BY created_at DESC LIMIT 1) as last_message')
      )
      .orderBy('last_message_at', 'desc');

    // Get latest message for each conversation
    const conversationsWithDetails = [];
    for (const conv of conversations) {
      const latestMessage = await db('messages')
        .where({
          id: conv.id
        })
        .first();

      conversationsWithDetails.push({
        ...conv,
        latestMessage
      });
    }

    res.json({
      conversations: conversationsWithDetails
    });

  } catch (error) {
    next(error);
  }
});

// Get conversation
router.get('/conversation/:userId', authenticate, async (req, res, next) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user.id;

    const messages = await db('messages')
      .where({
        OR: [
          { sender_id: currentUserId, recipient_id: otherUserId },
          { sender_id: otherUserId, recipient_id: currentUserId }
        ]
      })
      .orderBy('created_at', 'asc')
      .select('*');

    // Mark messages as read
    if (messages.length > 0) {
      const unreadMessages = messages.filter(m => 
        m.recipient_id === currentUserId && !m.is_read
      );
      
      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map(m => m.id);
        await db('messages')
          .whereIn('id', unreadIds)
          .update({ is_read: true });
      }
    }

    res.json({
      messages
    });

  } catch (error) {
    next(error);
  }
});

// Mark message as read
router.put('/:messageId/read', authenticate, async (req, res, next) => {
  try {
    const message = await db('messages')
      .where({ 
        id: req.params.messageId,
        recipient_id: req.user.id 
      })
      .first();

    if (!message) {
      return res.status(404).json({
        error: 'Сообщение не найдено'
      });
    }

    await db('messages')
      .where({ id: req.params.messageId })
      .update({ 
        is_read: true,
        updated_at: new Date()
      });

    res.json({
      message: 'Сообщение помечено как прочитанное'
    });

  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await db('messages')
      .where({ 
        recipient_id: req.user.id,
        is_read: false 
      })
      .count('* as count')
      .first();

    res.json({
      unread_count: parseInt(count.count)
    });

  } catch (error) {
    next(error);
  }
});

// Delete conversation
router.delete('/conversation/:userId', authenticate, async (req, res, next) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user.id;

    // Delete all messages between these users
    await db('messages')
      .where({
        OR: [
          { sender_id: currentUserId, recipient_id: otherUserId },
          { sender_id: otherUserId, recipient_id: currentUserId }
        ]
      })
      .del();

    res.json({
      message: 'Переписка удалена'
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
