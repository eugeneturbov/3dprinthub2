import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Register = () => {
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await registerUser(data);
      if (result.success) {
        navigate('/');
      }
    } catch (error) {
      // Error is already handled in the auth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Создать аккаунт
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Или{' '}
          <Link
            to="/auth/login"
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            войдите в существующий аккаунт
          </Link>
        </p>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="form-label">
                Имя
              </label>
              <input
                {...register('first_name', {
                  required: 'Имя обязательно',
                  minLength: {
                    value: 2,
                    message: 'Имя должно содержать минимум 2 символа',
                  },
                })}
                type="text"
                autoComplete="given-name"
                className={`form-input ${errors.first_name ? 'border-error-500' : ''}`}
                placeholder="Иван"
              />
              {errors.first_name && (
                <p className="form-error">{errors.first_name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="last_name" className="form-label">
                Фамилия
              </label>
              <input
                {...register('last_name', {
                  required: 'Фамилия обязательна',
                  minLength: {
                    value: 2,
                    message: 'Фамилия должна содержать минимум 2 символа',
                  },
                })}
                type="text"
                autoComplete="family-name"
                className={`form-input ${errors.last_name ? 'border-error-500' : ''}`}
                placeholder="Иванов"
              />
              {errors.last_name && (
                <p className="form-error">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="form-label">
              Email адрес
            </label>
            <input
              {...register('email', {
                required: 'Email обязателен',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Неверный формат email',
                },
              })}
              type="email"
              autoComplete="email"
              className={`form-input ${errors.email ? 'border-error-500' : ''}`}
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="form-label">
              Телефон (необязательно)
            </label>
            <input
              {...register('phone', {
                pattern: {
                  value: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
                  message: 'Неверный формат телефона',
                },
              })}
              type="tel"
              autoComplete="tel"
              className={`form-input ${errors.phone ? 'border-error-500' : ''}`}
              placeholder="+7 (999) 123-45-67"
            />
            {errors.phone && (
              <p className="form-error">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Пароль
            </label>
            <div className="relative">
              <input
                {...register('password', {
                  required: 'Пароль обязателен',
                  minLength: {
                    value: 6,
                    message: 'Пароль должен содержать минимум 6 символов',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`form-input pr-10 ${errors.password ? 'border-error-500' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="form-label">
              Подтвердите пароль
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword', {
                  required: 'Подтверждение пароля обязательно',
                  validate: (value) =>
                    value === password || 'Пароли не совпадают',
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`form-input pr-10 ${errors.confirmPassword ? 'border-error-500' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="form-error">{errors.confirmPassword.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="agree-terms"
            {...register('agree_terms', {
              required: 'Необходимо принять условия использования',
            })}
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
            Я согласен с{' '}
            <Link
              to="/terms"
              className="text-primary-600 hover:text-primary-500"
              target="_blank"
            >
              условиями использования
            </Link>{' '}
            и{' '}
            <Link
              to="/privacy"
              className="text-primary-600 hover:text-primary-500"
              target="_blank"
            >
              политикой конфиденциальности
            </Link>
          </label>
        </div>
        {errors.agree_terms && (
          <p className="form-error">{errors.agree_terms.message}</p>
        )}

        <div>
          <button
            type="submit"
            disabled={isSubmitting || loading}
            className="group relative w-full flex justify-center btn btn-primary"
          >
            {isSubmitting || loading ? (
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
                Регистрация...
              </>
            ) : (
              'Зарегистрироваться'
            )}
          </button>
        </div>

        {/* Social Registration */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Или зарегистрируйтесь через</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              // TODO: Implement Google OAuth
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="ml-2">Google</span>
            </button>

            <button
              type="button"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              // TODO: Implement GitHub OAuth
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="ml-2">GitHub</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Register;
