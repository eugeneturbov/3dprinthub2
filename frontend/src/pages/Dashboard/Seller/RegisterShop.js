import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const RegisterShop = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement shop registration API call
      const shopData = {
        ...data,
        logo: logoPreview
      };
      
      console.log('Shop registration data:', shopData);
      toast.success('Заявка на создание магазина отправлена на модерацию');
      navigate('/seller');
    } catch (error) {
      toast.error('Ошибка создания магазина');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Создание магазина</h1>
          <p className="text-gray-600 mt-2">
            Откройте свой магазин и начните продавать 3D-модели
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Shop Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Информация о магазине</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="form-label">Название магазина *</label>
                  <input
                    {...register('name', {
                      required: 'Название магазина обязательно',
                      minLength: {
                        value: 2,
                        message: 'Название должно содержать минимум 2 символа',
                      },
                    })}
                    type="text"
                    className={`form-input ${errors.name ? 'border-error-500' : ''}`}
                    placeholder="Название вашего магазина"
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Описание магазина</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className="form-input"
                    placeholder="Расскажите о вашем магазине и товарах..."
                    maxLength={2000}
                  />
                </div>

                <div>
                  <label className="form-label">Email для связи *</label>
                  <input
                    {...register('contact_email', {
                      required: 'Email обязателен',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Неверный формат email',
                      },
                    })}
                    type="email"
                    className={`form-input ${errors.contact_email ? 'border-error-500' : ''}`}
                    placeholder="contact@shop.com"
                  />
                  {errors.contact_email && (
                    <p className="form-error">{errors.contact_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Телефон</label>
                  <input
                    {...register('contact_phone', {
                      pattern: {
                        value: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
                        message: 'Неверный формат телефона',
                      },
                    })}
                    type="tel"
                    className={`form-input ${errors.contact_phone ? 'border-error-500' : ''}`}
                    placeholder="+7 (999) 123-45-67"
                  />
                  {errors.contact_phone && (
                    <p className="form-error">{errors.contact_phone.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Веб-сайт</label>
                  <input
                    {...register('website', {
                      pattern: {
                        value: /^https?:\/\/.+/,
                        message: 'URL должен начинаться с http:// или https://',
                      },
                    })}
                    type="url"
                    className={`form-input ${errors.website ? 'border-error-500' : ''}`}
                    placeholder="https://your-website.com"
                  />
                  {errors.website && (
                    <p className="form-error">{errors.website.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Logo */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Логотип магазина</h2>

              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <div className="relative">
                      <img
                        src={logoPreview}
                        alt="Логотип магазина"
                        className="w-24 h-24 rounded-lg object-cover border"
                      />
                      <button
                        type="button"
                        onClick={() => setLogoPreview(null)}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div>
                    <label className="form-label">Загрузить логотип</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="form-input"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Рекомендуемый размер: 200x200px. Максимальный размер: 5MB.
                      Форматы: JPG, PNG, GIF, WebP.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Условия использования</h2>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4">Комиссия платформы</h3>
                <p className="text-gray-600 mb-4">
                  3DPrintHub взимает комиссию в размере 10% от каждой успешной продажи. 
                  Комиссия включает в себя:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                  <li>Обслуживание платформы</li>
                  <li>Маркетинговое продвижение</li>
                  <li>Обработка платежей</li>
                  <li>Техническая поддержка</li>
                </ul>

                <h3 className="font-medium text-gray-900 mb-4">Правила и ограничения</h3>
                <p className="text-gray-600 mb-4">
                  Продавцы обязаны соблюдать следующие правила:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 mb-6">
                  <li>Предоставлять достоверную информацию о товарах</li>
                  <li>Не нарушать авторские права третьих лиц</li>
                  <li>Обрабатывать заказы в течение 24 часов</li>
                  <li>Поддерживать высокое качество обслуживания</li>
                </ul>

                <div className="flex items-center">
                  <input
                    {...register('agree_terms', {
                      required: 'Необходимо принять условия использования',
                    })}
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-gray-700">
                    Я согласен с условиями использования и политикой конфиденциальности
                  </label>
                </div>
                {errors.agree_terms && (
                  <p className="form-error mt-2">{errors.agree_terms.message}</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate('/')}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary"
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
                  'Отправить заявку'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Что происходит дальше?
          </h3>
          <p className="text-blue-700">
            После отправки заявки наша команда проверит информацию о вашем магазине. 
            Обычно процесс модерации занимает 1-3 рабочих дня. 
            Вы получите email с решением о модерации.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterShop;
