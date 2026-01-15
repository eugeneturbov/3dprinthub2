import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useShops } from '../hooks/useShops';
import { Spinner } from '../components/UI/Spinner';
import { MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

const Shops = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    min_rating: '',
    status: 'approved'
  });

  const params = {
    q: searchQuery,
    category_id: filters.category,
    min_rating: filters.min_rating,
    status: filters.status,
    limit: 20,
  };

  const { data, isLoading, error } = useShops(params);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is handled by the query parameter
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      min_rating: '',
      status: 'approved'
    });
  };

  const renderRating = (rating, reviewCount) => {
    if (!rating || !reviewCount) return null;

    return (
      <div className="flex items-center space-x-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <StarIconSolid
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">
          {rating.toFixed(1)} ({reviewCount})
        </span>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Магазины</h1>
        <p className="text-gray-600">
          {data?.pagination?.total || 0} магазинов найдено
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск магазинов..."
              className="form-input pl-10"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Поиск
          </button>
        </form>
      </div>

      <div className="flex gap-8">
        {/* Filters Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Очистить
              </button>
            </div>

            {/* Rating Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Минимальный рейтинг</h4>
              <div className="space-y-2">
                {[4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="flex items-center">
                    <input
                      type="radio"
                      name="rating"
                      value={rating}
                      checked={filters.min_rating === rating.toString()}
                      onChange={(e) => handleFilterChange('min_rating', e.target.value)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700 flex items-center">
                      {rating} и выше
                      <div className="ml-1 flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIconSolid
                            key={i}
                            className={`h-3 w-3 ${
                              i < rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </span>
                  </label>
                ))}
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    value=""
                    checked={!filters.min_rating}
                    onChange={(e) => handleFilterChange('min_rating', e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Любой рейтинг</span>
                </label>
              </div>
            </div>

            {/* Status Filter */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Статус</h4>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="form-input text-sm"
              >
                <option value="approved">Активные</option>
                <option value="all">Все</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shops Grid */}
        <div className="flex-1">
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Ошибка загрузки магазинов</p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {/* Shops Grid */}
          {!isLoading && !error && data?.shops?.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.shops.map((shop) => (
                  <div key={shop.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Shop Header */}
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Shop Logo */}
                        <div className="flex-shrink-0">
                          {shop.logo_url ? (
                            <img
                              src={shop.logo_url}
                              alt={shop.name}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-xl font-bold text-gray-500">
                                {shop.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Shop Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            <Link
                              to={`/shops/${shop.slug}`}
                              className="hover:text-primary-600"
                            >
                              {shop.name}
                            </Link>
                          </h3>
                          
                          {/* Rating */}
                          {renderRating(shop.rating, shop.review_count)}

                          {/* Description */}
                          {shop.description && (
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {shop.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Shop Stats */}
                    <div className="px-6 pb-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {shop.total_sales || 0}
                          </div>
                          <div className="text-xs text-gray-600">Продаж</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {shop.review_count || 0}
                          </div>
                          <div className="text-xs text-gray-600">Отзывов</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {shop.rating ? shop.rating.toFixed(1) : '0.0'}
                          </div>
                          <div className="text-xs text-gray-600">Рейтинг</div>
                        </div>
                      </div>
                    </div>

                    {/* Shop Footer */}
                    <div className="px-6 pb-6">
                      <Link
                        to={`/shops/${shop.slug}`}
                        className="btn btn-primary w-full"
                      >
                        Перейти в магазин
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {data.pagination && data.pagination.pages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-outline"
                      disabled
                    >
                      Назад
                    </button>

                    <span className="text-gray-600">
                      Страница 1 из {data.pagination.pages}
                    </span>

                    <button
                      className="btn btn-outline"
                      disabled
                    >
                      Вперед
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* No Results */}
          {!isLoading && !error && data?.shops?.length === 0 && (
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
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Магазины не найдены
              </h3>
              <p className="text-gray-600 mb-4">
                Попробуйте изменить параметры поиска или фильтры
              </p>
              <button onClick={clearFilters} className="btn btn-primary">
                Сбросить фильтры
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shops;
