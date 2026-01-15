import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct, useRelatedProducts } from '../hooks/useProducts';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { 
  StarIcon, 
  ShoppingCartIcon, 
  HeartIcon, 
  ShareIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Spinner } from '../components/UI/Spinner';
import ProductCard from '../components/Products/ProductCard';

const ProductDetail = () => {
  const { id } = useParams();
  const { data: product, loading, error } = useProduct(id);
  const { data: relatedProducts } = useRelatedProducts(id);
  const { addToCart, isInCart } = useCart();
  const { isAuthenticated } = useAuth();
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      // TODO: Show login modal
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(
        product.id, 
        quantity, 
        selectedVariant?.id || null
      );
    } catch (error) {
      // Error is handled in the cart hook
    } finally {
      setIsAddingToCart(false);
    }
  };

  const renderRating = (rating, reviewCount) => {
    if (!rating || !reviewCount) return null;

    return (
      <div className="flex items-center space-x-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <StarIconSolid
              key={i}
              className={`h-5 w-5 ${
                i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-lg font-medium text-gray-900">
          {rating.toFixed(1)}
        </span>
        <span className="text-gray-600">
          ({reviewCount} отзыв{reviewCount === 1 ? '' : reviewCount < 5 ? 'а' : 'ов'})
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Товар не найден
          </h2>
          <p className="text-gray-600 mb-8">
            Запрошенный товар не существует или был удален
          </p>
          <Link to="/products" className="btn btn-primary">
            Вернуться к каталогу
          </Link>
        </div>
      </div>
    );
  }

  const currentPrice = selectedVariant?.price || product.price;
  const currentImage = selectedImage < (product.images?.length || 0) 
    ? product.images[selectedImage] 
    : product.images?.[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/" className="text-gray-500 hover:text-gray-700">
              Главная
            </Link>
          </li>
          <li>
            <span className="text-gray-300">/</span>
          </li>
          <li>
            <Link to="/products" className="text-gray-500 hover:text-gray-700">
              Каталог
            </Link>
          </li>
          <li>
            <span className="text-gray-300">/</span>
          </li>
          <li>
            <span className="text-gray-900">{product.title}</span>
          </li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            {currentImage ? (
              <img
                src={currentImage.image_url}
                alt={currentImage.alt_text || product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg
                  className="w-16 h-16 text-gray-400"
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

          {/* Thumbnail Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 ${
                    selectedImage === index
                      ? 'border-primary-500'
                      : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image.image_url}
                    alt={image.alt_text || product.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {/* Product Type Badge */}
          <div className="mb-4">
            <span className={`badge ${
              product.type === 'digital' ? 'badge-success' : 'badge-primary'
            }`}>
              {product.type === 'digital' ? 'Цифровой товар' : 'Физический товар'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {product.title}
          </h1>

          {/* Shop Info */}
          {product.shop && (
            <div className="mb-6">
              <Link
                to={`/shops/${product.shop.slug}`}
                className="flex items-center gap-2 text-gray-600 hover:text-primary-600"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  {product.shop.logo_url ? (
                    <img
                      src={product.shop.logo_url}
                      alt={product.shop.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium">
                      {product.shop.name.charAt(0)}
                    </span>
                  )}
                </div>
                <span>{product.shop.name}</span>
              </Link>
            </div>
          )}

          {/* Rating */}
          {renderRating(product.rating, product.review_count)}

          {/* Price */}
          <div className="mb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-gray-900">
                {formatPrice(currentPrice)}
              </span>
              {product.compare_price && product.compare_price > currentPrice && (
                <span className="text-lg text-gray-500 line-through">
                  {formatPrice(product.compare_price)}
                </span>
              )}
            </div>
          </div>

          {/* Short Description */}
          {product.short_description && (
            <div className="mb-6">
              <p className="text-gray-600">{product.short_description}</p>
            </div>
          )}

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Варианты</h3>
              <div className="grid grid-cols-2 gap-3">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`p-3 border rounded-lg text-left transition-colors ${
                      selectedVariant?.id === variant.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">
                      {variant.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatPrice(variant.price)}
                    </div>
                    {variant.inventory_quantity > 0 ? (
                      <div className="text-sm text-green-600">
                        В наличии: {variant.inventory_quantity}
                      </div>
                    ) : (
                      <div className="text-sm text-red-600">Нет в наличии</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <label className="form-label">Количество</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-gray-300 rounded-md">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border-0 focus:ring-0"
                  min="1"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              
              {/* Stock Status */}
              {product.track_inventory && (
                <div>
                  {product.inventory_quantity > 0 ? (
                    <span className="text-green-600">
                      В наличии: {product.inventory_quantity}
                    </span>
                  ) : (
                    <span className="text-red-600">Нет в наличии</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || (product.track_inventory && product.inventory_quantity === 0)}
              className="flex-1 btn btn-primary"
            >
              {isAddingToCart ? (
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Добавление...
                </>
              ) : (
                <>
                  <ShoppingCartIcon className="h-5 w-5 mr-2" />
                  {isInCart(product.id) ? 'В корзине' : 'В корзину'}
                </>
              )}
            </button>

            <button className="btn btn-outline">
              <HeartIcon className="h-5 w-5" />
            </button>

            <button className="btn btn-outline">
              <ShareIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-2 text-gray-600">
              <TruckIcon className="h-5 w-5" />
              <span className="text-sm">Быстрая доставка</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <ShieldCheckIcon className="h-5 w-5" />
              <span className="text-sm">Гарантия качества</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">24/7 поддержка</span>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="prose max-w-none">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Описание</h3>
              <div
                className="text-gray-600"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts && relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Похожие товары</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
