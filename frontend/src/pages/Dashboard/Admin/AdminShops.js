import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../../services/api';
import { 
  ShopIcon,
  SearchIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/UI/Spinner';
import toast from 'react-hot-toast';

const AdminShops = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useQuery(
    ['adminShops', page, search, statusFilter],
    () => adminAPI.getShops({
      page,
      search,
      status: statusFilter
    }),
    {
      keepPreviousData: true
    }
  );

  const updateStatusMutation = useMutation(
    adminAPI.updateShopStatus,
    {
      onSuccess: () => {
        toast.success('Статус магазина обновлен');
        queryClient.invalidateQueries('adminShops');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка обновления статуса');
      }
    }
  );

  const handleStatusChange = (shopId, newStatus) => {
    updateStatusMutation.mutate({
      shopId,
      status: newStatus
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'badge-warning', text: 'На модерации', icon: ClockIcon },
      approved: { color: 'badge-success', text: 'Активен', icon: CheckCircleIcon },
      rejected: { color: 'badge-error', text: 'Отклонен', icon: XCircleIcon },
      suspended: { color: 'badge-secondary', text: 'Приостановлен', icon: XCircleIcon }
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`badge ${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
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
        <p className="text-red-600 mb-4">Ошибка загрузки магазинов</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  const shops = data?.shops || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Магазины</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ShopIcon className="h-5 w-5" />
          <span>{pagination?.total || 0} магазинов</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по названию магазина"
                  className="form-input pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input"
              >
                <option value="">Все статусы</option>
                <option value="pending">На модерации</option>
                <option value="approved">Активные</option>
                <option value="rejected">Отклоненные</option>
                <option value="suspended">Приостановленные</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button type="submit" className="btn btn-primary w-full">
                Поиск
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {(search || statusFilter) && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setPage(1);
                }}
                className="btn btn-outline"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Shops Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Магазин
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Владелец
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Товары
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заказы
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Рейтинг
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Продажи
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата создания
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shops.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {shop.logo_url ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={shop.logo_url}
                            alt={shop.name}
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-500">
                              {shop.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {shop.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {shop.description?.substring(0, 50)}
                          {shop.description?.length > 50 && '...'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {shop.owner ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {shop.owner.first_name} {shop.owner.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {shop.owner.email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Не указан</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(shop.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {shop.products_count} товар{shop.products_count === 1 ? '' : 'ов'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {shop.orders_count} заказ{shop.orders_count === 1 ? '' : 'ов'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(shop.rating || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539 1.118l1.07 3.292a1 1 0 001.95.69h3.462c.969 0 1.371-1.24.588-1.81l-2.8-2.034a1 1 0 00-.364-1.118l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-gray-900">
                        {shop.rating?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-gray-500">
                        ({shop.review_count || 0})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(shop.total_sales || 0)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(shop.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        title="Просмотр магазина"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        title="Редактировать"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      {/* Status Actions */}
                      {shop.status === 'pending' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStatusChange(shop.id, 'approved')}
                            className="text-green-600 hover:text-green-700"
                            title="Одобрить"
                            disabled={updateStatusMutation.isLoading}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(shop.id, 'rejected')}
                            className="text-red-600 hover:text-red-700"
                            title="Отклонить"
                            disabled={updateStatusMutation.isLoading}
                          >
                            <XCircleIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}

                      {shop.status === 'approved' && (
                        <button
                          onClick={() => handleStatusChange(shop.id, 'suspended')}
                          className="text-yellow-600 hover:text-yellow-700"
                          title="Приостановить"
                          disabled={updateStatusMutation.isLoading}
                        >
                          <ClockIcon className="h-4 w-4" />
                        </button>
                      )}

                      {shop.status === 'suspended' && (
                        <button
                          onClick={() => handleStatusChange(shop.id, 'approved')}
                          className="text-green-600 hover:text-green-700"
                          title="Активировать"
                          disabled={updateStatusMutation.isLoading}
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
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
                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                disabled={page === pagination.pages}
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
                    {(page - 1) * pagination.limit + 1}
                  </span>{' '}
                  до{' '}
                  <span className="font-medium">
                    {Math.min(page * pagination.limit, pagination.total)}
                  </span>{' '}
                  из{' '}
                  <span className="font-medium">{pagination.total}</span> магазинов
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Страница {page} из {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                    disabled={page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {shops.length === 0 && (
        <div className="text-center py-12">
          <ShopIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Магазины не найдены
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Попробуйте изменить параметры поиска или фильтры
          </p>
        </div>
      )}
    </div>
  );
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
  }).format(price);
};

export default AdminShops;
