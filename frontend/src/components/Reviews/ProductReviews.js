import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { reviewsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { 
  StarIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Spinner } from '../UI/Spinner';
import toast from 'react-hot-toast';

const ProductReviews = ({ productId, canReview = false }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data, isLoading, error } = useQuery(
    ['productReviews', productId],
    () => reviewsAPI.getProductReviews(productId),
    {
      enabled: !!productId
    }
  );

  const createReviewMutation = useMutation(
    reviewsAPI.createProductReview,
    {
      onSuccess: () => {
        toast.success('Отзыв успешно добавлен');
        setShowReviewForm(false);
        resetForm();
        queryClient.invalidateQueries(['productReviews', productId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка добавления отзыва');
      }
    }
  );

  const updateReviewMutation = useMutation(
    reviewsAPI.updateReview,
    {
      onSuccess: () => {
        toast.success('Отзыв успешно обновлен');
        setEditingReview(null);
        resetForm();
        queryClient.invalidateQueries(['productReviews', productId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка обновления отзыва');
      }
    }
  );

  const deleteReviewMutation = useMutation(
    reviewsAPI.deleteReview,
    {
      onSuccess: () => {
        toast.success('Отзыв удален');
        queryClient.invalidateQueries(['productReviews', productId]);
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка удаления отзыва');
      }
    }
  );

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (rating === 0 || !content.trim()) {
      toast.error('Поставьте оценку и напишите отзыв');
      return;
    }

    const reviewData = {
      product_id: productId,
      rating,
      title: title.trim(),
      content: content.trim(),
      order_id: null // TODO: Add order selection
    };

    if (editingReview) {
      await updateReviewMutation.mutateAsync({
        reviewId: editingReview.id,
        ...reviewData
      });
    } else {
      await createReviewMutation.mutateAsync(reviewData);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setRating(review.rating);
    setTitle(review.title || '');
    setContent(review.content);
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) {
      return;
    }

    await deleteReviewMutation.mutateAsync(reviewId);
  };

  const resetForm = () => {
    setRating(0);
    setTitle('');
    setContent('');
    setEditingReview(null);
  };

  const renderStars = (rating, interactive = false, size = 'small') => {
    const sizeClasses = {
      small: 'h-4 w-4',
      medium: 'h-5 w-5',
      large: 'h-6 w-6'
    };

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setRating(star)}
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <StarIconSolid
              className={`${sizeClasses[size]} ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Ошибка загрузки отзывов</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  const reviews = data?.reviews || [];
  const product = data?.product;

  return (
    <div className="space-y-6">
      {/* Review Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Отзывы</h2>
        
        <div className="flex items-center gap-6 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {product?.rating?.toFixed(1) || '0.0'}
            </div>
            <div className="flex items-center gap-1">
              {renderStars(Math.round(product?.rating || 0))}
            </div>
            <div className="text-sm text-gray-600">
              {product?.review_count || 0} отзыв{product?.review_count === 1 ? '' : 'ов'}
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviews.filter(r => Math.round(r.rating) === star).length;
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              
              return (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="text-sm text-gray-600 w-8">{star}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Review Button */}
        {isAuthenticated && canReview && !showReviewForm && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="btn btn-primary"
          >
            Оставить отзыв
          </button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingReview ? 'Редактировать отзыв' : 'Написать отзыв'}
          </h3>

          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <label className="form-label">Оценка *</label>
              <div className="flex items-center gap-2">
                {renderStars(rating, true, 'large')}
                <span className="text-sm text-gray-600">
                  {rating === 0 ? 'Выберите оценку' : `${rating} из 5`}
                </span>
              </div>
            </div>

            <div>
              <label className="form-label">Заголовок</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Краткое описание отзыва"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Отзыв *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Поделитесь вашим мнением о товаре..."
                className="form-input"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={createReviewMutation.isLoading || updateReviewMutation.isLoading}
                className="btn btn-primary"
              >
                {createReviewMutation.isLoading || updateReviewMutation.isLoading ? (
                  <Spinner size="sm" />
                ) : (
                  editingReview ? 'Сохранить изменения' : 'Отправить отзыв'
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReviewForm(false);
                  resetForm();
                }}
                className="btn btn-outline"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {review.user?.avatar_url ? (
                    <img
                      src={review.user.avatar_url}
                      alt={review.user.first_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-gray-900">
                      {review.user?.first_name} {review.user?.last_name}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {renderStars(review.rating)}
                      {review.is_verified && (
                        <span className="badge badge-success text-xs">Подтвержденная покупка</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>{formatDate(review.created_at)}</span>
                  {isAuthenticated && review.user_id === user.id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditReview(review)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {review.title && (
                <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
              )}

              <p className="text-gray-700 whitespace-pre-wrap">{review.content}</p>
            </div>
          ))}

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-outline"
                  disabled={data.pagination.page === 1}
                >
                  Назад
                </button>
                <span className="text-gray-600">
                  Страница {data.pagination.page} из {data.pagination.pages}
                </span>
                <button
                  className="btn btn-outline"
                  disabled={data.pagination.page === data.pagination.pages}
                >
                  Вперед
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Пока нет отзывов
          </h3>
          <p className="text-gray-600 mb-4">
            Будьте первым, кто оставит отзыв на этот товар
          </p>
          {isAuthenticated && canReview && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="btn btn-primary"
            >
              Написать отзыв
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
