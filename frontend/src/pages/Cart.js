import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { Spinner } from '../components/UI/Spinner';

const Cart = () => {
  const { cartItems, loading, updateCartItem, removeFromCart, clearCart, cartTotal } = useCart();
  const { isAuthenticated } = useAuth();

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(itemId);
    } else {
      await updateCartItem(itemId, newQuantity);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Корзина доступна только для авторизованных пользователей
          </h2>
          <p className="text-gray-600 mb-8">
            Войдите в аккаунт или зарегистрируйтесь, чтобы просматривать корзину
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth/login" className="btn btn-primary">
              Войти
            </Link>
            <Link to="/auth/register" className="btn btn-outline">
              Регистрация
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
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
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ваша корзина пуста
          </h2>
          <p className="text-gray-600 mb-8">
            Добавьте товары в корзину, чтобы оформить заказ
          </p>
          <Link to="/products" className="btn btn-primary">
            Перейти к покупкам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Корзина</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Товары ({cartItems.length})
                </h2>
                <button
                  onClick={clearCart}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Очистить корзину
                </button>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 border border-gray-200 rounded-lg">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.product?.image ? (
                        <img
                          src={item.product.image.image_url}
                          alt={item.product.title}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            <Link
                              to={`/products/${item.product_id}`}
                              className="hover:text-primary-600"
                            >
                              {item.product?.title}
                            </Link>
                          </h3>
                          {item.product?.shop && (
                            <p className="text-sm text-gray-600">
                              {item.product.shop.name}
                            </p>
                          )}
                          {item.variant && (
                            <p className="text-sm text-gray-600">
                              {item.variant.title}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {formatPrice(item.price)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatPrice(item.total)}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
                          >
                            <MinusIcon className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            className="p-1 rounded-md border border-gray-300 hover:bg-gray-50"
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Итого
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between text-gray-600">
                <span>Товары ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              
              <div className="flex justify-between text-gray-600">
                <span>Доставка</span>
                <span>Рассчитывается при оформлении</span>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Итого</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Link
                to="/checkout"
                className="btn btn-primary w-full"
              >
                Оформить заказ
              </Link>

              <Link
                to="/products"
                className="btn btn-outline w-full"
              >
                Продолжить покупки
              </Link>
            </div>

            {/* Promo Code */}
            <div className="mt-6">
              <label className="form-label">Промокод</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Введите промокод"
                  className="form-input flex-1"
                />
                <button className="btn btn-outline">
                  Применить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
