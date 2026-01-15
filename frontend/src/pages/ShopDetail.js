import React from 'react';
import { useParams } from 'react-router-dom';
import { useShopBySlug, useShopProducts } from '../hooks/useShops';
import { Spinner } from '../components/UI/Spinner';
import ProductCard from '../components/Products/ProductCard';

const ShopDetail = () => {
  const { slug } = useParams();
  const { data: shop, loading: shopLoading } = useShopBySlug(slug);
  const { data: productsData, loading: productsLoading } = useShopProducts(shop?.id, { limit: 12 });

  if (shopLoading || productsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Магазин не найден
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Shop Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex items-start gap-6">
          {/* Shop Logo */}
          <div className="flex-shrink-0">
            {shop.logo_url ? (
              <img
                src={shop.logo_url}
                alt={shop.name}
                className="w-24 h-24 rounded-lg object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-500">
                  {shop.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Shop Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{shop.name}</h1>
            
            {/* Rating */}
            {shop.rating && shop.review_count && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(shop.rating) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-gray-600">
                  {shop.rating.toFixed(1)} ({shop.review_count} отзыв{shop.review_count === 1 ? '' : shop.review_count < 5 ? 'а' : 'ов'})
                </span>
              </div>
            )}

            {/* Description */}
            {shop.description && (
              <p className="text-gray-600 mb-4">{shop.description}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mb-6">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {shop.total_sales || 0}
                </div>
                <div className="text-sm text-gray-600">Продаж</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {shop.review_count || 0}
                </div>
                <div className="text-sm text-gray-600">Отзывов</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {productsData?.products?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Товаров</div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex gap-6 text-sm text-gray-600">
              {shop.contact_email && (
                <div>
                  <span className="font-medium">Email:</span> {shop.contact_email}
                </div>
              )}
              {shop.contact_phone && (
                <div>
                  <span className="font-medium">Телефон:</span> {shop.contact_phone}
                </div>
              )}
              {shop.website && (
                <div>
                  <span className="font-medium">Сайт:</span>
                  <a
                    href={shop.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 ml-1"
                  >
                    {shop.website}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shop Banner */}
      {shop.banner_url && (
        <div className="mb-8">
          <img
            src={shop.banner_url}
            alt={`${shop.name} banner`}
            className="w-full h-48 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Products Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Товары магазина</h2>
        
        {productsData?.products?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {productsData.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              В этом магазине пока нет товаров
            </h3>
            <p className="text-gray-600">
              Проверьте позже или свяжитесь с продавцом
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDetail;
