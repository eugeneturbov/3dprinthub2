import React from 'react';
import { Link } from 'react-router-dom';
import { 
  SparklesIcon,
  ShoppingBagIcon,
  StorefrontIcon,
  RocketLaunchIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/Products/ProductCard';
import { Spinner } from '../components/UI/Spinner';

const Home = () => {
  const { data: featuredProducts, loading } = useProducts({ featured: true, limit: 8 });

  const features = [
    {
      name: 'Большой выбор',
      description: 'Тысячи 3D-моделей от лучших дизайнеров',
      icon: SparklesIcon,
    },
    {
      name: 'Безопасные платежи',
      description: 'Защищенные транзакции и возврат средств',
      icon: ShoppingBagIcon,
    },
    {
      name: 'Мгновенная доставка',
      description: 'Цифровые товары доступны сразу после оплаты',
      icon: RocketLaunchIcon,
    },
    {
      name: 'Поддержка продавцов',
      description: 'Инструменты для управления вашим магазином',
      icon: StorefrontIcon,
    },
  ];

  const stats = [
    { name: 'Активных магазинов', value: '500+' },
    { name: '3D-моделей', value: '10,000+' },
    { name: 'Довольных клиентов', value: '50,000+' },
    { name: 'Стран', value: '25+' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Маркетплейс 3D-товаров
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              Покупайте и продавайте 3D-модели, файлы для печати и аксессуары на лучшей платформе для 3D-энтузиастов
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100"
              >
                Начать покупки
              </Link>
              <Link
                to="/seller/register"
                className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary-600"
              >
                Стать продавцом
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.name} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Почему выбирают 3DPrintHub
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Мы создали платформу, которая делает 3D-печать доступной для всех
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.name} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-primary-100 rounded-full">
                      <Icon className="h-8 w-8 text-primary-600" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.name}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Популярные товары
              </h2>
              <p className="text-gray-600">Лучшие 3D-модели от наших продавцов</p>
            </div>
            <Link
              to="/products"
              className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
            >
              Смотреть все
              <ArrowRightIcon className="h-5 w-5 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts?.products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Готовы начать продавать?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Присоединяйтесь к тысячам продавцов, которые уже зарабатывают на своих 3D-моделях
          </p>
          <Link
            to="/seller/register"
            className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100"
          >
            Открыть магазин
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
