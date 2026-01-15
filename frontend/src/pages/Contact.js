import React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement actual contact form submission
      console.log('Contact form data:', data);
      toast.success('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
      reset();
    } catch (error) {
      toast.error('Ошибка отправки сообщения. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: EnvelopeIcon,
      title: 'Email',
      content: 'info@3dprinthub.ru',
      description: 'Общие вопросы и поддержка'
    },
    {
      icon: PhoneIcon,
      title: 'Телефон',
      content: '+7 (999) 123-45-67',
      description: 'Пн-Пт, 9:00 - 18:00 МСК'
    },
    {
      icon: MapPinIcon,
      title: 'Адрес',
      content: 'Москва, ул. Примерная, 123',
      description: 'Офис и демонстрационный зал'
    },
    {
      icon: ClockIcon,
      title: 'Часы работы',
      content: 'Пн-Пт: 9:00 - 18:00',
      description: 'Сб-Вс: выходной'
    },
  ];

  const faqs = [
    {
      question: 'Как начать продавать на 3DPrintHub?',
      answer: 'Просто зарегистрируйтесь, подайте заявку на открытие магазина и после модерации вы сможете загружать свои 3D-модели.'
    },
    {
      question: 'Какие форматы файлов поддерживаются?',
      answer: 'Мы поддерживаем STL, OBJ, 3MF, PLY и другие популярные 3D-форматы. Максимальный размер файла - 1GB.'
    },
    {
      question: 'Как происходит оплата?',
      answer: 'Мы принимаем банковские карты, электронные кошельки и другие популярные способы оплаты. Платежи защищены и безопасны.'
    },
    {
      question: 'Как получить цифровой товар?',
      answer: 'Сразу после оплаты вы получите ссылку для скачивания файла. Ссылка активна в течение 30 дней.'
    },
    {
      question: 'Могу ли я вернуть товар?',
      answer: 'Цифровые товары не подлежат возврату после скачивания. Физические товары можно вернуть в течение 14 дней.'
    },
    {
      question: 'Какая комиссия у платформы?',
      answer: 'Стандартная комиссия составляет 10% от суммы продажи. Для крупных продавцов действуют индивидуальные условия.'
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Контакты
            </h1>
            <p className="text-xl text-primary-100">
              Мы всегда готовы помочь и ответить на ваши вопросы
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Отправить сообщение
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="form-label">
                    Имя
                  </label>
                  <input
                    {...register('name', {
                      required: 'Имя обязательно',
                      minLength: {
                        value: 2,
                        message: 'Имя должно содержать минимум 2 символа',
                      },
                    })}
                    type="text"
                    className={`form-input ${errors.name ? 'border-error-500' : ''}`}
                    placeholder="Ваше имя"
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email обязателен',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Неверный формат email',
                      },
                    })}
                    type="email"
                    className={`form-input ${errors.email ? 'border-error-500' : ''}`}
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="form-error">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="form-label">
                  Тема
                </label>
                <select
                  {...register('subject', {
                    required: 'Выберите тему',
                  })}
                  className={`form-input ${errors.subject ? 'border-error-500' : ''}`}
                >
                  <option value="">Выберите тему</option>
                  <option value="general">Общий вопрос</option>
                  <option value="technical">Техническая поддержка</option>
                  <option value="billing">Вопросы оплаты</option>
                  <option value="partnership">Партнерство</option>
                  <option value="complaint">Жалоба</option>
                </select>
                {errors.subject && (
                  <p className="form-error">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="message" className="form-label">
                  Сообщение
                </label>
                <textarea
                  {...register('message', {
                    required: 'Сообщение обязательно',
                    minLength: {
                      value: 10,
                      message: 'Сообщение должно содержать минимум 10 символов',
                    },
                  })}
                  rows={5}
                  className={`form-input ${errors.message ? 'border-error-500' : ''}`}
                  placeholder="Опишите ваш вопрос или предложение..."
                />
                {errors.message && (
                  <p className="form-error">{errors.message.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary w-full"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Отправка...
                    </>
                  ) : (
                    'Отправить сообщение'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Связаться с нами
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((info) => {
                const Icon = info.icon;
                return (
                  <div key={info.title} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="p-3 bg-primary-100 rounded-full">
                        <Icon className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {info.title}
                      </h3>
                      <p className="text-gray-900 mb-1">{info.content}</p>
                      <p className="text-sm text-gray-600">{info.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Map Placeholder */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Наше расположение
              </h3>
              <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPinIcon className="h-12 w-12 mx-auto mb-2" />
                  <p>Карта Москвы</p>
                  <p className="text-sm">ул. Примерная, 123</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Часто задаваемые вопросы
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Следите за нами в социальных сетях
          </h2>
          
          <div className="flex justify-center gap-6">
            {/* TODO: Add actual social media links */}
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500">FB</span>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500">TW</span>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500">IG</span>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-gray-500">YT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
