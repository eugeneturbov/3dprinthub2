import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FacebookIcon, 
  TwitterIcon, 
  InstagramIcon, 
  YoutubeIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'О нас', href: '/about' },
      { name: 'Контакты', href: '/contact' },
      { name: 'Блог', href: '/blog' },
      { name: 'Карьера', href: '/careers' },
    ],
    support: [
      { name: 'Помощь', href: '/help' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Условия использования', href: '/terms' },
      { name: 'Политика конфиденциальности', href: '/privacy' },
    ],
    sellers: [
      { name: 'Стать продавцом', href: '/seller/register' },
      { name: 'Тарифы', href: '/pricing' },
      { name: 'Руководство продавца', href: '/seller-guide' },
      { name: 'API', href: '/api-docs' },
    ],
    buyers: [
      { name: 'Как купить', href: '/how-to-buy' },
      { name: 'Доставка', href: '/shipping' },
      { name: 'Оплата', href: '/payment' },
      { name: 'Возврат', href: '/returns' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: FacebookIcon },
    { name: 'Twitter', href: '#', icon: TwitterIcon },
    { name: 'Instagram', href: '#', icon: InstagramIcon },
    { name: 'YouTube', href: '#', icon: YoutubeIcon },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-white mb-4">3DPrintHub</h3>
            <p className="text-gray-300 mb-4">
              Лучший маркетплейс для покупки и продажи 3D-моделей, файлов для печати и аксессуаров.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-gray-300">
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                <span>info@3dprinthub.ru</span>
              </div>
              <div className="flex items-center text-gray-300">
                <PhoneIcon className="h-5 w-5 mr-2" />
                <span>+7 (999) 123-45-67</span>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPinIcon className="h-5 w-5 mr-2" />
                <span>Москва, Россия</span>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Компания</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Поддержка</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sellers Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Продавцам</h4>
            <ul className="space-y-2">
              {footerLinks.sellers.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Buyers Links */}
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Покупателям</h4>
            <ul className="space-y-2">
              {footerLinks.buyers.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links and Newsletter */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Social Links */}
            <div className="flex space-x-6 mb-4 md:mb-0">
              {socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={item.name}
                  >
                    <Icon className="h-6 w-6" />
                  </a>
                );
              })}
            </div>

            {/* Newsletter */}
            <div className="flex flex-col sm:flex-row items-center">
              <span className="text-gray-300 mr-4 mb-2 sm:mb-0">Подпишитесь на новости:</span>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Ваш email"
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-l-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button className="btn btn-primary rounded-l-none">
                  Подписаться
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-400 text-sm">
            <div>
              © {currentYear} 3DPrintHub. Все права защищены.
            </div>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <span>Платформа работает на</span>
              <span className="text-white">Node.js</span>
              <span>+</span>
              <span className="text-white">React</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
