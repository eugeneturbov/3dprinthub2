import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../../hooks/useAuth';
import { useUserShop } from '../../../hooks/useShops';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SellerShop = () => {
  const { user } = useAuth();
  const { data: shop, refetch } = useUserShop(user?.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm();

  // Set form values when shop data loads
  React.useEffect(() => {
    if (shop) {
      setValue('name', shop.name);
      setValue('description', shop.description);
      setValue('contact_email', shop.contact_email);
      setValue('contact_phone', shop.contact_phone);
      setValue('website', shop.website);
      setLogoPreview(shop.logo_url);
      setBannerPreview(shop.banner_url);
    }
  }, [shop, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // TODO: Implement shop update API call
      console.log('Shop update data:', data);
      toast.success('Магазин обновлен успешно');
      await refetch();
    } catch (error) {
      toast.error('Ошибка обновления магазина');
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

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!shop) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Настройки магазина</h1>
        <p className="text-gray-600">Управление информацией о вашем магазине</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Основная информация</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
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

            <div>
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

          <div className="mt-6">
            <label className="form-label">Описание магазина</label>
            <textarea
              {...register('description')}
              rows={4}
              className="form-input"
              placeholder="Расскажите о вашем магазине и товарах..."
              maxLength={2000}
            />
            <p className="text-sm text-gray-500 mt-1">
              {watch('description')?.length || 0} / 2000 символов
            </p>
          </div>
        </div>

        {/* Logo */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Логотип</h2>

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

        {/* Banner */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Баннер</h2>

          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              {bannerPreview ? (
                <div className="relative">
                  <img
                    src={bannerPreview}
                    alt="Баннер магазина"
                    className="w-48 h-24 rounded-lg object-cover border"
                  />
                  <button
                    type="button"
                    onClick={() => setBannerPreview(null)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="w-48 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <div>
                <label className="form-label">Загрузить баннер</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                  className="form-input"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Рекомендуемый размер: 1200x300px. Максимальный размер: 5MB.
                  Форматы: JPG, PNG, GIF, WebP.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Shop Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Статус магазина</h2>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`badge ${
                  shop.status === 'approved' ? 'badge-success' : 'badge-warning'
                }`}>
                  {shop.status === 'approved' ? 'Активен' : shop.status}
                </span>
                <span className="text-sm text-gray-600">
                  {shop.status === 'approved' 
                    ? 'Ваш магазин активен и доступен для покупателей'
                    : 'Ваш магазин находится на модерации'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => window.history.back()}
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
                Сохранение...
              </>
            ) : (
              'Сохранить изменения'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SellerShop;
