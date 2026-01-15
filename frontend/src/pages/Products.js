import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/Products/ProductCard';
import { Spinner } from '../components/UI/Spinner';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const type = searchParams.get('type') || '';
  const sort = searchParams.get('sort') || 'created_at';
  const page = parseInt(searchParams.get('page')) || 1;

  const params = {
    q: query,
    category_id: category,
    min_price: minPrice,
    max_price: maxPrice,
    type,
    sort,
    page,
    limit: 20,
  };

  const { data, isLoading, error } = useProducts(params);

  const handleSearch = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newParams = new URLSearchParams(searchParams);
    
    const searchQuery = formData.get('q');
    if (searchQuery) {
      newParams.set('q', searchQuery);
    } else {
      newParams.delete('q');
    }
    
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({ q: query });
  };

  const hasActiveFilters = category || minPrice || maxPrice || type;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {query ? `Результаты поиска: "${query}"` : 'Каталог товаров'}
        </h1>
        <p className="text-gray-600">
          {data?.pagination?.total || 0} товаров найдено
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
              name="q"
              defaultValue={query}
              placeholder="Поиск товаров..."
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
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Очистить
                </button>
              )}
            </div>

            {/* Product Type */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Тип товара</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value=""
                    checked={!type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Все типы</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="digital"
                    checked={type === 'digital'}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Цифровые</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="physical"
                    checked={type === 'physical'}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Физические</span>
                </label>
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Цена</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">От</label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => handleFilterChange('min_price', e.target.value)}
                    placeholder="0"
                    className="form-input text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">До</label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => handleFilterChange('max_price', e.target.value)}
                    placeholder="10000"
                    className="form-input text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Sort */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Сортировка</h4>
              <select
                value={sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="form-input text-sm"
              >
                <option value="created_at">Новинки</option>
                <option value="price_asc">Цена: по возрастанию</option>
                <option value="price_desc">Цена: по убыванию</option>
                <option value="rating">По рейтингу</option>
                <option value="sold_count">По продажам</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 btn btn-outline"
            >
              <FunnelIcon className="h-5 w-5" />
              Фильтры
              {hasActiveFilters && (
                <span className="badge badge-primary">Активны</span>
              )}
            </button>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="lg:hidden mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Фильтры</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              {/* Mobile filter content (same as desktop) */}
              <div className="space-y-6">
                {/* Product Type */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Тип товара</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mobile_type"
                        value=""
                        checked={!type}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Все типы</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mobile_type"
                        value="digital"
                        checked={type === 'digital'}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Цифровые</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="mobile_type"
                        value="physical"
                        checked={type === 'physical'}
                        onChange={(e) => handleFilterChange('type', e.target.value)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Физические</span>
                    </label>
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Цена</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">От</label>
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => handleFilterChange('min_price', e.target.value)}
                        placeholder="0"
                        className="form-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">До</label>
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => handleFilterChange('max_price', e.target.value)}
                        placeholder="10000"
                        className="form-input text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Сортировка</h4>
                  <select
                    value={sort}
                    onChange={(e) => handleFilterChange('sort', e.target.value)}
                    className="form-input text-sm"
                  >
                    <option value="created_at">Новинки</option>
                    <option value="price_asc">Цена: по возрастанию</option>
                    <option value="price_desc">Цена: по убыванию</option>
                    <option value="rating">По рейтингу</option>
                    <option value="sold_count">По продажам</option>
                  </select>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={clearFilters}
                    className="btn btn-outline flex-1"
                  >
                    Очистить
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="btn btn-primary flex-1"
                  >
                    Применить
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Ошибка загрузки товаров</p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!isLoading && !error && data?.products?.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {data.products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {data.pagination && data.pagination.pages > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex items-center gap-2">
                    {page > 1 && (
                      <button
                        onClick={() => handleFilterChange('page', page - 1)}
                        className="btn btn-outline"
                      >
                        Назад
                      </button>
                    )}

                    <span className="text-gray-600">
                      Страница {page} из {data.pagination.pages}
                    </span>

                    {page < data.pagination.pages && (
                      <button
                        onClick={() => handleFilterChange('page', page + 1)}
                        className="btn btn-outline"
                      >
                        Вперед
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* No Results */}
          {!isLoading && !error && data?.products?.length === 0 && (
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
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Товары не найдены
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

export default Products;
