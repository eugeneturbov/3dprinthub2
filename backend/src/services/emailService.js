const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"3DPrintHub" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Подтвердите ваш email - 3DPrintHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Добро пожаловать в 3DPrintHub!</h2>
        <p style="color: #666;">Спасибо за регистрацию на нашей платформе. Пожалуйста, подтвердите ваш email адрес.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Подтвердить Email
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:<br>
          <a href="${verificationUrl}" style="color: #007bff;">${verificationUrl}</a>
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Эта ссылка действительна 24 часа. Если вы не регистрировались на 3DPrintHub, 
          проигнорируйте это письмо.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"3DPrintHub" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Сброс пароля - 3DPrintHub',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Сброс пароля</h2>
        <p style="color: #666;">Вы запросили сброс пароля для вашего аккаунта на 3DPrintHub.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #dc3545; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Сбросить пароль
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:<br>
          <a href="${resetUrl}" style="color: #dc3545;">${resetUrl}</a>
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Эта ссылка действительна 1 час. Если вы не запрашивали сброс пароля, 
          проигнорируйте это письмо.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendOrderConfirmationEmail = async (email, order) => {
  const orderUrl = `${process.env.FRONTEND_URL}/orders/${order.id}`;

  const mailOptions = {
    from: `"3DPrintHub" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Подтверждение заказа #${order.order_number} - 3DPrintHub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Заказ подтвержден!</h2>
        <p style="color: #666;">Спасибо за ваш заказ на 3DPrintHub. Ваш заказ №${order.order_number} успешно оформлен.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Детали заказа:</h3>
          <p><strong>Номер заказа:</strong> ${order.order_number}</p>
          <p><strong>Сумма:</strong> ${order.total_amount} ${order.currency}</p>
          <p><strong>Статус:</strong> ${order.status}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${orderUrl}" 
             style="background-color: #28a745; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Посмотреть заказ
          </a>
        </div>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Если у вас есть вопросы, свяжитесь с нашей поддержкой.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const sendOrderStatusUpdateEmail = async (email, order) => {
  const orderUrl = `${process.env.FRONTEND_URL}/orders/${order.id}`;

  const statusMessages = {
    'processing': 'Ваш заказ находится в обработке',
    'shipped': 'Ваш заказ отправлен',
    'delivered': 'Ваш заказ доставлен',
    'cancelled': 'Ваш заказ отменен',
    'refunded': 'Возврат средств оформлен'
  };

  const mailOptions = {
    from: `"3DPrintHub" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Обновление статуса заказа #${order.order_number} - 3DPrintHub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Обновление статуса заказа</h2>
        <p style="color: #666;">${statusMessages[order.status] || `Статус вашего заказа изменен на: ${order.status}`}</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Детали заказа:</h3>
          <p><strong>Номер заказа:</strong> ${order.order_number}</p>
          <p><strong>Новый статус:</strong> ${order.status}</p>
          <p><strong>Сумма:</strong> ${order.total_amount} ${order.currency}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${orderUrl}" 
             style="background-color: #007bff; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Посмотреть заказ
          </a>
        </div>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Если у вас есть вопросы, свяжитесь с нашей поддержкой.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail
};
