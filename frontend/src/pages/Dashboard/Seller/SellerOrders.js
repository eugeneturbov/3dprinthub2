import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { ordersAPI } from '../../../services/api';
import { 
  EyeIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/UI/Spinner';
import toast from 'react-hot-toast';

const SellerOrders = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery(
    ['sellerOrders', statusFilter, page],
    () => ordersAPI.getSellerOrders({ status: statusFilter !== 'all' ? statusFilter : undefined, page, limit: 20 }),
    {
      keepPreviousData: true
    }
  );

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateSellerOrderStatus(orderId, newStatus);
      toast.success('Статус заказа обновлен');
      refetch();
    } catch (error) {
      toast.error('Ошибка обновления статуса');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'badge-warning', icon: ClockIcon, text: 'Ожидает' },
      processing: { color: 'badge-primary', icon: EyeIcon, text: 'В обработке' },
      shipped: { color: 'badge-secondary', icon: TruckIcon, text: 'Отправлен' },
      delivered: { color: 'badge-success', icon: CheckCircleIcon, text: 'Доставлен' },
      cancelled: { color: 'badge-error', icon: XCircleIcon, text: 'Отменен' },
      refunded: { color: 'badge-error', icon: XCircleIcon, text: 'Возвращен' }
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
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

  const getStatusActions = (order) => {
    switch (order.status) {
      case 'pending':
        return (
          <>
            <button
              onClick={() => handleStatusUpdate(order.id, 'processing')}
              className="btn btn-sm btn-primary"
            >
              Принять
            </button>
            <button
              onClick={() => handleStatusUpdate(order.id, 'cancelled')}
              className="btn btn-sm btn-outline"
            >
              Отменить
            </button>
          </>
        );
      case 'processing':
        return (
          <button
            onClick={() => handleStatusUpdate(order.id, 'shipped')}
            className="btn btn-sm btn-primary"
          >
            Отправить
          </button>
        );
      case 'shipped':
        return (
          <button
            onClick={() => handleStatusUpdate(order.id, 'delivered')}
            className="btn btn-sm btn-success"
          >
            Подтвердить доставку
          </button>
        );
      default:
        return null;
    }
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
        <p className="text-red-600 mb-4">Ошибка загрузки заказов</p>
        <button
          onClick={() => refetch()}
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
        <h1 className="text-2xl font-bold text-gray-900">Заказы</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Новые</p>
              <p className="text-2xl font-bold text-warning-600">
                {data?.stats?.pending || 0}
              </p>
            </div>
            <ClockIcon className="h-8 w-8 text-warning-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">В обработке</p>
              <p className="text-2xl font-bold text-primary-600">
                {data?.stats?.processing || 0}
              </p>
            </div>
            <EyeIcon className="h-8 w-8 text-primary-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Отправлено</p>
              <p className="text-2xl font-bold text-secondary-600">
                {data?.stats?.shipped || 0}
              </p>
            </div>
            <TruckIcon className="h-8 w-8 text-secondary-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Доставлено</p>
              <p className="text-2xl font-bold text-success-600">
                {data?.stats?.delivered || 0}
              </p>
            </div>
            <CheckCircleIcon className="h-8 w-8 text-success-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`btn ${
              statusFilter === 'all' ? 'btn-primary' : 'btn-outline'
            }`}
          >
            Все заказы
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`btn ${
              statusFilter === 'pending' ? 'btn-primary' : 'btn-outline'
            }`}
          >
            Новые
          </button>
          <button
            onClick={() => setStatusFilter('processing')}
            className={`btn ${
              statusFilter === 'processing' ? 'btn-primary' : 'btn-outline'
            }`}
          >
            В обработке
          </button>
          <button
            onClick={() => setStatusFilter('shipped')}
            className={`btn ${
              statusFilter === 'shipped' ? 'btn-primary' : 'btn-outline'
            }`}
          >
            Отправлено
          </button>
          <button
            onClick={() => setStatusFilter('delivered')}
            className={`btn ${
              statusFilter === 'delivered' ? 'btn-primary' : 'btn-outline'
            }`}
          >
            Доставлено
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {data?.orders?.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Заказ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Покупатель
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Товары
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Сумма
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Статус
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дата
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{order.order_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {order.id.slice(0, 8)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.user?.first_name} {order.user?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.user?.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.items_count} товар{order.items_count > 1 ? 'а' : ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.items?.slice(0, 2).map(item => item.title).join(', ')}
                          {order.items?.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(order.total_amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Комиссия: {formatPrice(order.commission_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {getStatusActions(order)}
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
                        Страница {page} из {data.pagination.pages}
                      </span>
                      <button
                        onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
                        disabled={page === data.pagination.pages}
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
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <CurrencyDollarIcon className="mx-auto h-16 w-16" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Заказы не найдены
            </h3>
            <p className="text-gray-600">
              У вас пока нет заказов. Новые заказы появятся здесь после того, как покупатели оформят покупки в вашем магазине.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOrders;
