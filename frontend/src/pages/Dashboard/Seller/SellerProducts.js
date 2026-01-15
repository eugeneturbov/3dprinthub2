import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useUserShop } from '../../../hooks/useShops';
import { useAuth } from '../../../hooks/useAuth';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CubeIcon,
  CurrencyDollarIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/UI/Spinner';
import toast from 'react-hot-toast';

const SellerProducts = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    sort: 'created_at',
    order: 'desc'
  });

  const { data, isLoading, error } = useShopProducts(user?.id, {
    page,
    limit: 20,
    ...filters
  });

  const handleDelete = async (productId) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
      return;
    }

    try {
      // TODO: Implement delete product API call
      toast.success('Товар удален');
    } catch (error) {
      toast.error('Ошибка удаления товара');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusBadge = (product) => {
    if (!product.is_active) {
      return <span className="badge badge-error">Неактивен</span>;
    }
    if (product.inventory_quantity === 0 && product.track_inventory) {
      return <span className="badge badge-warning">Нет в наличии</span>;
    }
    return <span className="badge badge-success">Активен</span>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Ошибка загрузки товаров</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Товары</h1>
        <Link
          to="/seller/products/new"
          className="btn btn-primary"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Добавить товар
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Статус</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="form-input"
            >
              <option value="all">Все товары</option>
              <option value="active">Активные</option>
              <option value="inactive">Неактивные</option>
              <option value="out_of_stock">Нет в наличии</option>
            </select>
          </div>

          <div>
            <label className="form-label">Сортировка</label>
            <select
              value={filters.sort}
              onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
              className="form-input"
            >
              <option value="created_at">Дате создания</option>
              <option value="title">Названию</option>
              <option value="price">Цене</option>
              <option value="sold_count">Продажам</option>
              <option value="view_count">Просмотрам</option>
            </select>
          </div>

          <div>
            <label className="form-label">Порядок</label>
            <select
              value={filters.order}
              onChange={(e) => setFilters(prev => ({ ...prev, order: e.target.value }))}
              className="form-input"
            >
              <option value="desc">По убыванию</option>
              <option value="asc">По возрастанию</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: 'all', sort: 'created_at', order: 'desc' })}
              className="btn btn-outline w-full"
            >
              Сбросить
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {data?.products?.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Товар
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Цена
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Остаток
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статистика
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {product.image ? (
                              <img
                                className="h-12 w-12 rounded-lg object-cover"
                                src={product.image.image_url}
                                alt={product.title}
                              />
                            ) : (
                              <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <CubeIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              <Link
                                to={`/products/${product.id}`}
                                className="hover:text-primary-600"
                                target="_blank"
                              >
                                {product.title}
                              </Link>
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.type === 'digital' ? 'Цифровой' : 'Физический'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatPrice(product.price)}
                        </div>
                        {product.compare_price && (
                          <div className="text-sm text-gray-500 line-through">
                            {formatPrice(product.compare_price)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.track_inventory ? (
                          <div className="text-sm text-gray-900">
                            {product.inventory_quantity}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Не ограничено</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 space-y-1">
                          <div className="flex items-center gap-2">
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                            {product.view_count || 0}
                          </div>
                          <div className="flex items-center gap-2">
                            <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                            {product.sold_count || 0}
                          </div>
                          {product.rating && (
                            <div className="flex items-center gap-2">
                              <StarIcon className="h-4 w-4 text-yellow-400" />
                              {product.rating.toFixed(1)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/seller/products/${product.id}/edit`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pagination && data.pagination.pages > 1 && (
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
                    disabled={page === data.pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Вперед
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Показано от{' '}
                      <span className="font-medium">
                        {(page - 1) * data.pagination.limit + 1}
                      </span>{' '}
                      до{' '}
                      <span className="font-medium">
                        {Math.min(page * data.pagination.limit, data.pagination.total)}
                      </span>{' '}
                      из{' '}
                      <span className="font-medium">{data.pagination.total}</span> результатов
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Страница {page} из {data.pagination.pages}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
                        disabled={page === data.pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <CubeIcon className="mx-auto h-16 w-16" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Товары не найдены
            </h3>
            <p className="text-gray-600 mb-8">
              У вас пока нет товаров. Добавьте первый товар, чтобы начать продажи.
            </p>
            <Link
              to="/seller/products/new"
              className="btn btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Добавить товар
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerProducts;
