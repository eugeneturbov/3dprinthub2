import React from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, HeartIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const ProductCard = ({ product, showAddToCart = true }) => {
  const { addToCart, isInCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Для добавления в корзину необходимо войти в систему');
      return;
    }

    await addToCart(product.id, 1);
  };

  const renderRating = (rating, reviewCount) => {
    if (!rating || !reviewCount) return null;

    return (
      <div className="flex items-center space-x-1">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <StarIconSolid
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">
          {rating.toFixed(1)} ({reviewCount})
        </span>
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

  return (
    <div className="product-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden group">
      <Link to={`/products/${product.id}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {product.image ? (
            <img
              src={product.image.image_url}
              alt={product.image.alt_text || product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-400">
                <svg
                  className="w-12 h-12"
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
            </div>
          )}

          {/* Product Type Badge */}
          <div className="absolute top-2 left-2">
            <span className={`badge badge-sm ${
              product.type === 'digital' ? 'badge-success' : 'badge-primary'
            }`}>
              {product.type === 'digital' ? 'Цифровой' : 'Физический'}
            </span>
          </div>

          {/* Wishlist Button */}
          <button
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // TODO: Add to wishlist functionality
              toast('Добавлено в избранное');
            }}
          >
            <HeartIcon className="h-4 w-4 text-gray-600 hover:text-red-500" />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Shop Name */}
          {product.shop && (
            <div className="text-sm text-gray-600 mb-1">
              {product.shop.name}
            </div>
          )}

          {/* Product Title */}
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
            {product.title}
          </h3>

          {/* Rating */}
          {renderRating(product.rating, product.review_count)}

          {/* Price */}
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
                {product.compare_price && product.compare_price > product.price && (
                  <span className="ml-2 text-sm text-gray-500 line-through">
                    {formatPrice(product.compare_price)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stock Status */}
          {product.track_inventory && (
            <div className="mt-2">
              {product.inventory_quantity > 0 ? (
                <span className="text-sm text-green-600">
                  В наличии: {product.inventory_quantity}
                </span>
              ) : (
                <span className="text-sm text-red-600">
                  Нет в наличии
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Add to Cart Button */}
      {showAddToCart && product.inventory_quantity > 0 && (
        <div className="px-4 pb-4">
          <button
            onClick={handleAddToCart}
            disabled={isInCart(product.id)}
            className={`w-full btn ${
              isInCart(product.id)
                ? 'btn-secondary'
                : 'btn-primary'
            }`}
          >
            {isInCart(product.id) ? (
              <>
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                В корзине
              </>
            ) : (
              <>
                <ShoppingCartIcon className="h-4 w-4 mr-2" />
                В корзину
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
