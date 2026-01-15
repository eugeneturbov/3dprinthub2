import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ordersAPI } from '../services/api';
import { 
  CheckCircleIcon,
  TruckIcon,
  EnvelopeIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '../components/UI/Spinner';

const CheckoutSuccess = () => {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  
  const [isChecking, setIsChecking] = useState(true);
  const [order, setOrder] = useState(null);

  const { data, isLoading, error } = useQuery(
    ['order', orderId],
    () => ordersAPI.getOrder(orderId),
    {
      enabled: !!orderId,
      onSuccess: (data) => {
        setOrder(data.order);
        setIsChecking(false);
      },
      onError: () => {
        setIsChecking(false);
      }
    }
  );

  useEffect(() => {
    if (!orderId) {
      navigate('/checkout');
    }
  }, [orderId, navigate]);

  if (isChecking || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Проверка заказа...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Заказ не найден
          </h1>
          <p className="text-gray-600 mb-8">
            Не удалось найти информацию о заказе. Возможно, ссылка устарела или произошла ошибка.
          </p>
          <button
            onClick={() => navigate('/checkout')}
            className="btn btn-primary"
          >
            Вернуться к оформлению
          </button>
        </div>
      </div>
    );
  }

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'badge-warning', text: 'Ожидает оплаты' },
      processing: { color: 'badge-primary', text: 'В обработке' },
      shipped: { color: 'badge-secondary', text: 'Отправлен' },
      delivered: { color: 'badge-success', text: 'Доставлен' },
      cancelled: { color: 'badge-error', text: 'Отменен' },
      refunded: { color: 'badge-error', text: 'Возвращен' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`badge ${config.color}`}>{config.text}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Заказ успешно оплачен!
          </h1>
          <p className="text-gray-600">
            Спасибо за ваш заказ. Мы уже начали его обработку.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Заказ #{order.order_number}
                </h2>
                <p className="text-sm text-gray-500">
                  от {formatDate(order.created_at)}
                </p>
              </div>
              <div>
                {getStatusBadge(order.status)}
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Состав заказа
            </h3>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className="flex-shrink-0">
                    {item.product?.image ? (
                      <img
                        src={item.product.image.image_url}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8-4M2 7l8 4 8 4m-8-4v8m0 0l8 4m-8-4v8" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {item.title}
                    </h4>
                    {item.variant && (
                      <p className="text-sm text-gray-600">
                        {item.variant.title}
                      </p>
                    )}
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-600">
                        {item.quantity} × {formatPrice(item.price)}
                      </span>
                      <span className="font-medium text-gray-900">
                        {formatPrice(item.total)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Подытог</span>
                  <span className="font-medium">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Доставка</span>
                  <span className="font-medium">{formatPrice(order.shipping_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Налоги</span>
                  <span className="font-medium">{formatPrice(order.tax_amount)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                  <span>Итого</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Адрес доставки
          </h3>
          {order.shipping_address && (
            <div className="text-gray-700">
              <p className="font-medium">{order.shipping_address.recipient_name}</p>
              <p>{order.shipping_address.phone}</p>
              <p>{order.shipping_address.street_address}</p>
              <p>{order.shipping_address.city}, {order.shipping_address.postal_code}</p>
              <p>{order.shipping_address.country}</p>
            </div>
          )}
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Что дальше?
          </h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <TruckIcon className="h-6 w-6 text-primary-600 mt-1" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Обработка заказа</h4>
                <p className="text-sm text-gray-600">
                  Продавец начнет обработку вашего заказа в течение 24 часов.
                  Вы получите уведомление об изменении статуса.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-6 w-6 text-primary-600 mt-1" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Email уведомления</h4>
                <p className="text-sm text-gray-600">
                  Мы отправим вам email с подтверждением заказа и информацией о доставке.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-primary-600 mt-1" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Отслеживание заказа</h4>
                <p className="text-sm text-gray-600">
                  Вы можете отслеживать статус заказа в личном кабинете.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/dashboard/orders')}
            className="btn btn-primary flex-1"
          >
            <ArrowRightIcon className="h-4 w-4 mr-2" />
            Мои заказы
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline flex-1"
          >
            Продолжить покупки
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
