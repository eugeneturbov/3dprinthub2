import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useUserShop } from '../../../hooks/useShops';
import { 
  ShopIcon,
  CubeIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CogIcon,
  UserIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/UI/Spinner';

const SellerDashboard = () => {
  const { user } = useAuth();
  const { data: shop, loading } = useUserShop(user?.id);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-gray-400 mb-4">
              <ShopIcon className="mx-auto h-16 w-16" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              У вас еще нет магазина
            </h2>
            <p className="text-gray-600 mb-8">
              Создайте магазин, чтобы начать продавать свои 3D-модели
            </p>
            <Link
              to="/seller/register"
              className="btn btn-primary"
            >
              Создать магазин
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (shop.status === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-yellow-400 mb-4">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ваш магазин на модерации
            </h2>
            <p className="text-gray-600 mb-8">
              Мы проверяем вашу заявку. Обычно это занимает 1-3 рабочих дня.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                Что происходит дальше?
              </h3>
              <p className="text-yellow-700 text-sm">
                Наша команда проверит информацию о вашем магазине и свяжется с вами при необходимости.
                Вы получите email с решением о модерации.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (shop.status === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="text-red-400 mb-4">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Заявка отклонена
            </h2>
            <p className="text-gray-600 mb-8">
              К сожалению, ваша заявка на создание магазина была отклонена.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-medium text-red-800 mb-2">
                Что делать дальше?
              </h3>
              <p className="text-red-700 text-sm mb-4">
                Вы можете подать новую заявку, исправив причины отклонения.
              </p>
              <Link
                to="/seller/register"
                className="btn btn-primary"
              >
                Подать заявку повторно
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <Link to="/seller" className="text-2xl font-bold text-primary-600">
                3DPrintHub
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Панель продавца</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard/profile"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <UserIcon className="h-5 w-5" />
                {user?.first_name} {user?.last_name}
              </Link>
              <Link
                to="/"
                className="text-gray-600 hover:text-gray-900"
              >
                Перейти на сайт
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Shop Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
                <div className="flex items-center gap-4 mt-1">
                  <span className={`badge ${
                    shop.status === 'approved' ? 'badge-success' : 'badge-warning'
                  }`}>
                    {shop.status === 'approved' ? 'Активен' : shop.status}
                  </span>
                  {shop.rating && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {shop.rating.toFixed(1)} ({shop.review_count})
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Link
              to="/seller/shop"
              className="btn btn-outline"
            >
              <CogIcon className="h-4 w-4 mr-2" />
              Настройки магазина
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Товары</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shop.stats?.total_products || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CubeIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Заказы</p>
                <p className="text-2xl font-bold text-gray-900">
                  {shop.stats?.total_orders || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ShoppingCartIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Продажи</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₽{shop.stats?.total_sales?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <CurrencyDollarIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Баланс</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₽{shop.balance?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/seller/products/new"
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Добавить товар
                </h3>
                <p className="text-gray-600 text-sm">
                  Загрузите новую 3D-модель или товар
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </div>
          </Link>

          <Link
            to="/seller/orders"
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Управление заказами
                </h3>
                <p className="text-gray-600 text-sm">
                  Просмотр и обработка заказов
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </div>
          </Link>

          <Link
            to="/seller/finance"
            className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Финансы
                </h3>
                <p className="text-gray-600 text-sm">
                  Баланс и история транзакций
                </p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
            </div>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Последние заказы
            </h2>
            <Link
              to="/seller/orders"
              className="text-primary-600 hover:text-primary-700 text-sm"
            >
              Все заказы
            </Link>
          </div>
          
          <div className="text-center py-8 text-gray-500">
            <ShoppingCartIcon className="h-12 w-12 mx-auto mb-4" />
            <p>У вас пока нет заказов</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
