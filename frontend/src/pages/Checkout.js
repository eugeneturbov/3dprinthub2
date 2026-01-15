import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useForm } from 'react-hook-form';
import { paymentsAPI } from '../services/api';
import { 
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [order, setOrder] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login', { state: { from: location.pathname } });
    }
  }, [isAuthenticated, navigate, location]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const onSubmit = async (data) => {
    if (!selectedAddress) {
      toast.error('Выберите адрес доставки');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare order data
      const orderData = {
        items: cartItems.map(item => ({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: item.quantity
      })),
        shipping_address: selectedAddress,
        notes: data.notes || ''
      };

      // Create order
      const response = await paymentsAPI.createOrder(orderData);
      setOrder(response.data.order);

      // Clear cart
      await clearCart();

      // Set order placed state
      setOrderPlaced(true);

    } catch (error) {
      toast.error(error.response?.data?.error || 'Ошибка оформления заказа');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    try {
      const returnUrl = `${window.location.origin}/checkout/success?order_id=${order.id}`;
      
      const response = await paymentsAPI.createPayment({
        order_id: order.id,
        amount: order.total_amount,
        currency: order.currency,
        return_url: returnUrl
      });

      // Redirect to payment page
      window.location.href = response.payment_url;

    } catch (error) {
      toast.error('Ошибка создания платежа');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getShippingCost = () => {
    // TODO: Calculate actual shipping cost based on items and location
    const hasPhysicalItems = cartItems.some(item => item.product?.type === 'physical');
    return hasPhysicalItems ? 500 : 0;
  };

  const getTaxAmount = () => {
    // TODO: Calculate actual tax based on location and items
    return 0;
  };

  const shippingCost = getShippingCost();
  const taxAmount = getTaxAmount();
  const totalAmount = cartTotal + shippingCost + taxAmount;

  if (orderPlaced) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Заказ успешно создан!
          </h1>
          <p className="text-gray-600 mb-8">
            Ваш заказ #{order.order_number} успешно оформлен и ожидает оплаты.
          </p>
          
          <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md mx-auto mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Детали заказа
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Номер заказа:</span>
                <span className="font-medium">{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Сумма:</span>
                <span className="font-medium">{formatPrice(order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Статус:</span>
                <span className="badge badge-warning">Ожидает оплаты</span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePayment}
            className="btn btn-primary"
          >
            Оплатить заказ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Оформление заказа</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Товары в корзине ({cartItems.length})
            </h2>
            
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {item.product?.image ? (
                      <img
                        src={item.product.image.image_url}
                        alt={item.product.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8-4M2 7l8 4 8 4m-8-4v8m0 0l8 4m-8-4v8" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {item.product?.title}
                    </h3>
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
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Адрес доставки
            </h2>

            {/* TODO: Add address selection/creation */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {user?.phone}
                    </div>
                    <div className="text-sm text-gray-600">
                      {user?.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                  >
                    Изменить
                  </button>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>Москва, ул. Примерная, 123</p>
                  <p>123456, Россия</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Способ оплаты
            </h2>

            <div className="space-y-3">
              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <div className="ml-3 flex items-center">
                  <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <div>
                    <div className="font-medium text-gray-900">Банковская карта</div>
                    <div className="text-sm text-gray-600">Visa, Mastercard, Мир</div>
                  </div>
                </div>
              </label>

              <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="sbp"
                  checked={paymentMethod === 'sbp'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <div className="ml-3 flex items-center">
                  <div className="w-5 h-5 bg-blue-600 rounded mr-2"></div>
                  <div>
                    <div className="font-medium text-gray-900">СБанк через СБП</div>
                    <div className="text-sm text-gray-600">Сбербанк, Тинькофф</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Примечания к заказу
            </h2>
            
            <textarea
              {...register('notes')}
              rows={4}
              className="form-input"
              placeholder="Добавьте примечания к заказу (необязательно)"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Итого
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Товары</span>
                <span className="font-medium">{formatPrice(cartTotal)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Доставка</span>
                <span className="font-medium">{formatPrice(shippingCost)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Налоги</span>
                <span className="font-medium">{formatPrice(taxAmount)}</span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">
                    К оплате
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatPrice(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">Безопасная оплата</p>
                  <p>Ваши данные защищены шифрованием</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0c5.373 0 10 4.627 10 10h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Оформление...
                  </>
                ) : (
                  'Оформить заказ'
                )}
              </button>
            </form>

            {/* Trust Badges */}
            <div className="mt-6 flex justify-center gap-4">
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <ShieldCheckIcon className="h-4 w-4" />
                SSL защищено
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <TruckIcon className="h-4 w-4" />
                Быстрая доставка
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
