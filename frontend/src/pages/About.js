import React from 'react';
import { Link } from 'react-router-dom';
import { 
  SparklesIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  UsersIcon,
  GlobeAltIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

const About = () => {
  const features = [
    {
      name: 'Качественные 3D-модели',
      description: 'Только проверенные и высококачественные модели от профессиональных дизайнеров',
      icon: SparklesIcon,
    },
    {
      name: 'Безопасные сделки',
      description: 'Защита покупателей и продавцов с помощью эскроу-системы',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Мгновенная доставка',
      description: 'Цифровые товары доступны сразу после оплаты',
      icon: RocketLaunchIcon,
    },
    {
      name: 'Сообщество творцов',
      description: 'Объединяем 3D-дизайнеров и энтузиастов со всего мира',
      icon: UsersIcon,
    },
    {
      name: 'Глобальный охват',
      description: 'Доступ к товарам и покупателям из 25+ стран',
      icon: GlobeAltIcon,
    },
    {
      name: 'Честная монетизация',
      description: 'Прозрачная система комиссий и быстрые выплаты продавцам',
      icon: CurrencyDollarIcon,
    },
  ];

  const stats = [
    { name: 'Активных магазинов', value: '500+' },
    { name: '3D-моделей', value: '10,000+' },
    { name: 'Довольных клиентов', value: '50,000+' },
    { name: 'Стран', value: '25+' },
    { name: 'Объем продаж', value: '₽50M+' },
    { name: 'Выплачено продавцам', value: '₽40M+' },
  ];

  const team = [
    {
      name: 'Александр Петров',
      role: 'CEO & Founder',
      image: null,
      description: 'Визионер с 10+ лет опыта в 3D-индустрии',
    },
    {
      name: 'Мария Иванова',
      role: 'CTO',
      image: null,
      description: 'Эксперт в области веб-технологий и масштабирования',
    },
    {
      name: 'Дмитрий Сидоров',
      role: 'Head of Product',
      image: null,
      description: 'Создает лучший пользовательский опыт',
    },
    {
      name: 'Елена Козлова',
      role: 'Head of Community',
      image: null,
      description: 'Развивает сообщество 3D-творцов',
    },
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 to-primary-800 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              О 3DPrintHub
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 max-w-3xl mx-auto">
              Мы создаем лучшую платформу для 3D-творчества, соединяя дизайнеров и энтузиастов по всему миру
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-8">
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

      {/* Mission Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Наша миссия
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Сделать 3D-печать и моделирование доступными для каждого, создавая экосистему где творцы могут монетизировать свои навыки, а покупатели получать качественные продукты
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Демократизируем 3D-технологии
              </h3>
              <p className="text-gray-600 mb-6">
                Мы верим, что 3D-печать и моделирование должны быть доступны не только профессионалам, но и обычным людям. Наша платформа снижает барьеры для входа в мир 3D.
              </p>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Поддерживаем творцов
              </h3>
              <p className="text-gray-600">
                Мы создаем условия, где 3D-дизайнеры могут сосредоточиться на творчестве, а мы заботимся о технической стороне, маркетинге и монетизации их работ.
              </p>
            </div>
            <div className="bg-gray-100 rounded-lg p-8">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary-600 mb-4">2019</div>
                <div className="text-xl text-gray-900 mb-2">Год основания</div>
                <p className="text-gray-600">
                  С тех пор мы помогли тысячам дизайнеров найти свою аудиторию и заработать на своем творчестве
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Что делает нас особенными
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Мы создали платформу с учетом потребностей как продавцов, так и покупателей
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

      {/* Team Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Наша команда
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Команда энтузиастов, объединенных любовью к 3D-технологиям
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <div key={member.name} className="text-center">
                <div className="mb-4">
                  {member.image ? (
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-24 h-24 rounded-full mx-auto object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-500">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {member.name}
                </h3>
                <p className="text-primary-600 mb-2">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Присоединяйтесь к нашему сообществу
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Начните продавать свои 3D-модли или находите уникальные товары для ваших проектов
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="btn btn-lg bg-white text-primary-600 hover:bg-gray-100"
            >
              Создать аккаунт
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
  );
};

export default About;
