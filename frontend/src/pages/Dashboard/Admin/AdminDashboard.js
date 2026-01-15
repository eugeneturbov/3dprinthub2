import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { adminAPI } from '../../../services/api';
import { 
  ChartBarIcon,
  UsersIcon,
  ShopIcon,
  CubeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  StarIcon,
  EnvelopeIcon,
  TrendingUpIcon,
  TrendingDownIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/UI/Spinner';

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery(
    'adminDashboard',
    adminAPI.getDashboardStats,
    {
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const getStatIcon = (type) => {
    const icons = {
      users: UsersIcon,
      shops: ShopIcon,
      products: CubeIcon,
      orders: ShoppingCartIcon,
      reviews: StarIcon,
      messages: EnvelopeIcon,
      revenue: CurrencyDollarIcon,
      commission: TrendingUpIcon
    };
    return icons[type] || ChartBarIcon;
  };

  const getStatColor = (type) => {
    const colors = {
      users: 'bg-blue-100 text-blue-600',
      shops: 'bg-purple-100 text-purple-600',
      products: 'bg-green-100 text-green-600',
      orders: 'bg-yellow-100 text-yellow-600',
      reviews: 'bg-orange-100 text-orange-600',
      messages: 'bg-pink-100 text-pink-600',
      revenue: 'bg-emerald-100 text-emerald-600',
      commission: 'bg-indigo-100 text-indigo-600'
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Панель администратора</h1>
        <p className="text-gray-600">Обзор состояния платформы</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Basic Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Пользователи</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.stats?.users || 0)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${getStatColor('users')}`}>
              <UsersIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Магазины</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.stats?.shops || 0)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${getStatColor('shops')}`}>
              <ShopIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Товары</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.stats?.products || 0)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${getStatColor('products')}`}>
              <CubeIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Заказы</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.stats?.orders || 0)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${getStatColor('orders')}`}>
              <ShoppingCartIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Отзывы</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.stats?.reviews || 0)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${getStatColor('reviews')}`}>
              <StarIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Сообщения</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(stats?.stats?.messages || 0)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${getStatColor('messages')}`}>
              <EnvelopeIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Financial Stats */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Общий доход</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(stats?.stats?.total_revenue || 0)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${getStatColor('revenue')}`}>
              <CurrencyDollarIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Комиссии</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(stats?.stats?.total_commission || 0)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${getStatColor('commission')}`}>
              <TrendingUpIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/users"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UsersIcon className="h-5 w-5 text-gray-600" />
            <span className="text-gray-900">Управление пользователями</span>
          </Link>

          <Link
            to="/admin/shops"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShopIcon className="h-5 w-5 text-gray-600" />
            <span className="text-gray-900">Модерация магазинов</span>
          </Link>

          <Link
            to="/admin/products"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CubeIcon className="h-5 w-5 text-gray-600" />
            <span className="text-gray-900">Управление товарами</span>
          </Link>

          <Link
            to="/admin/orders"
            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingCartIcon className="h-5 w-5 text-gray-600" />
            <span className="text-gray-900">Управление заказами</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Последние заказы</h2>
            <Link
              to="/admin/orders"
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              Все заказы
            </Link>
          </div>

          <div className="space-y-4">
            {stats?.recentOrders?.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">
                    #{order.order_number}
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.first_name} {order.last_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-gray-900">
                    {formatPrice(order.total_amount)}
                  </div>
                  <div className={`text-sm ${
                    order.status === 'delivered' ? 'text-green-600' :
                    order.status === 'cancelled' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {order.status === 'delivered' && 'Доставлен'}
                    {order.status === 'cancelled' && 'Отменен'}
                    {order.status === 'pending' && 'Ожидает'}
                    {order.status === 'processing' && 'В обработке'}
                    {order.status === 'shipped' && 'Отправлен'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Популярные товары</h2>
            <Link
              to="/admin/products"
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              Все товары
            </Link>
          </div>

          <div className="space-y-4">
            {stats?.topProducts?.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 truncate max-w-xs">
                      {product.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {product.sold_count} продаж
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-yellow-400">
                    <StarIconSolid className="h-4 w-4" />
                    <span className="text-gray-900">
                      {product.rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    ({product.review_count || 0})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ежемесячная статистика</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-4">Доход</h3>
            <div className="space-y-2">
              {stats?.monthlyStats?.slice(-6).map((stat) => (
                <div key={stat.month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(stat.month).toLocaleDateString('ru-RU', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(parseFloat(stat.revenue || 0))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Orders Chart */}
          <div>
            <h3 className="text-md font-medium text-gray-700 mb-4">Заказы</h3>
            <div className="space-y-2">
              {stats?.monthlyStats?.slice(-6).map((stat) => (
                <div key={stat.month} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {new Date(stat.month).toLocaleDateString('ru-RU', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatNumber(parseInt(stat.orders || 0))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
