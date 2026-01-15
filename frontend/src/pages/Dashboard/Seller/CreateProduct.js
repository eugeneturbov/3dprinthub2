import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const CreateProduct = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productType, setProductType] = useState('digital');
  const [images, setImages] = useState([]);
  const [file, setFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm();

  const onSubmit = async (data) => {
    if (images.length === 0) {
      toast.error('Добавьте хотя бы одно изображение');
      return;
    }

    if (productType === 'digital' && !file) {
      toast.error('Загрузите файл для цифрового товара');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement product creation API call
      const productData = {
        ...data,
        type: productType,
        images,
        file: productType === 'digital' ? file : null
      };
      
      console.log('Product data:', productData);
      toast.success('Товар создан успешно');
      navigate('/seller/products');
    } catch (error) {
      toast.error('Ошибка создания товара');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      if (images.length + files.length > 10) {
        toast.error('Максимум 10 изображений');
        return;
      }

      files.forEach(file => {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Файл ${file.name} слишком большой (макс. 10MB)`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          setImages(prev => [...prev, {
            file,
            preview: reader.result
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 100 * 1024 * 1024) {
        toast.error('Размер файла не должен превышать 100MB');
        return;
      }

      setFile(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Создание товара</h1>
        <p className="text-gray-600">Добавьте новый товар в ваш магазин</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Product Type */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Тип товара</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="relative">
              <input
                type="radio"
                value="digital"
                checked={productType === 'digital'}
                onChange={(e) => setProductType(e.target.value)}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                productType === 'digital'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    productType === 'digital'
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full bg-white m-0.5 ${
                      productType === 'digital' ? 'block' : 'hidden'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Цифровой товар</h3>
                    <p className="text-sm text-gray-600">3D-модель, файл для печати</p>
                  </div>
                </div>
              </div>
            </label>

            <label className="relative">
              <input
                type="radio"
                value="physical"
                checked={productType === 'physical'}
                onChange={(e) => setProductType(e.target.value)}
                className="sr-only"
              />
              <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                productType === 'physical'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                    productType === 'physical'
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}>
                    <div className={`w-2 h-2 rounded-full bg-white m-0.5 ${
                      productType === 'physical' ? 'block' : 'hidden'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Физический товар</h3>
                    <p className="text-sm text-gray-600">Напечатанный продукт</p>
                  </div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Основная информация</h2>

          <div className="space-y-6">
            <div>
              <label className="form-label">Название товара *</label>
              <input
                {...register('title', {
                  required: 'Название товара обязательно',
                  minLength: {
                    value: 2,
                    message: 'Название должно содержать минимум 2 символа',
                  },
                })}
                type="text"
                className={`form-input ${errors.title ? 'border-error-500' : ''}`}
                placeholder="Название вашего товара"
              />
              {errors.title && (
                <p className="form-error">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Краткое описание</label>
              <input
                {...register('short_description')}
                type="text"
                className="form-input"
                placeholder="Краткое описание для превью"
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">
                {watch('short_description')?.length || 0} / 500 символов
              </p>
            </div>

            <div>
              <label className="form-label">Полное описание *</label>
              <textarea
                {...register('description', {
                  required: 'Описание обязательно',
                  minLength: {
                    value: 10,
                    message: 'Описание должно содержать минимум 10 символов',
                  },
                })}
                rows={6}
                className={`form-input ${errors.description ? 'border-error-500' : ''}`}
                placeholder="Подробное описание товара, характеристики, особенности..."
              />
              {errors.description && (
                <p className="form-error">{errors.description.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Изображения</h2>

          <div className="space-y-4">
            <div>
              <label className="form-label">Добавить изображения</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <label className="btn btn-outline cursor-pointer">
                    Выбрать файлы
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    PNG, JPG, GIF, WebP до 10MB. Максимум 10 изображений.
                  </p>
                </div>
              </div>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.preview}
                      alt={`Изображение ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* File (for digital products) */}
        {productType === 'digital' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Файл товара</h2>

            <div className="space-y-4">
              {file ? (
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="btn btn-outline"
                  >
                    Удалить
                  </button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <label className="btn btn-primary cursor-pointer">
                    Выбрать файл
                    <input
                      type="file"
                      accept=".stl,.obj,.3mf,.ply,.dae,.fbx,.blend"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    STL, OBJ, 3MF, PLY, DAE, FBX, BLEND до 100MB
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Ценообразование</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="form-label">Цена *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₽
                </span>
                <input
                  {...register('price', {
                    required: 'Цена обязательна',
                    min: {
                      value: 0,
                      message: 'Цена должна быть положительным числом',
                    },
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-input pl-8 ${errors.price ? 'border-error-500' : ''}`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="form-error">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="form-label">Цена для сравнения</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₽
                </span>
                <input
                  {...register('compare_price', {
                    min: {
                      value: 0,
                      message: 'Цена должна быть положительным числом',
                    },
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Себестоимость</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  ₽
                </span>
                <input
                  {...register('cost_price', {
                    min: {
                      value: 0,
                      message: 'Себестоимость должна быть положительным числом',
                    },
                  })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input pl-8"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Inventory */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Управление запасами</h2>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                {...register('track_inventory')}
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-gray-700">
                Отслеживать количество на складе
              </label>
            </div>

            <div>
              <label className="form-label">Количество на складе</label>
              <input
                {...register('inventory_quantity', {
                  min: {
                    value: 0,
                    message: 'Количество должно быть неотрицательным числом',
                  },
                })}
                type="number"
                min="0"
                className="form-input"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate('/seller/products')}
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
                Создание...
              </>
            ) : (
              'Создать товар'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
