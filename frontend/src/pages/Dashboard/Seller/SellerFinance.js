import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { paymentsAPI } from '../../../services/api';
import { 
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  CalendarIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/UI/Spinner';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const SellerFinance = () => {
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [period, setPeriod] = useState('month');

  const { data: balance, isLoading: balanceLoading } = useQuery(
    'sellerBalance',
    () => paymentsAPI.getWithdrawalHistory(),
    {
      select: (data) => ({
        balance: 15000, // TODO: Get from API
        totalEarned: 125000,
        pendingWithdrawals: 2500
      })
    }
  );

  const { data: transactions, isLoading: transactionsLoading } = useQuery(
    ['sellerTransactions', period],
    () => paymentsAPI.getWithdrawalHistory({ period }),
    {
      select: () => ({
        transactions: [
          {
            id: '1',
            type: 'sale',
            amount: 2500,
            fee: 250,
            net_amount: 2250,
            status: 'completed',
            description: 'Продажа товара "3D Модель дома"',
            created_at: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            type: 'withdrawal',
            amount: 5000,
            fee: 100,
            net_amount: 4900,
            status: 'pending',
            description: 'Запрос на вывод средств',
            created_at: '2024-01-14T15:45:00Z'
          },
          {
            id: '3',
            type: 'sale',
            amount: 1800,
            fee: 180,
            net_amount: 1620,
            status: 'completed',
            description: 'Продажа товара "Фигурка дракона"',
            created_at: '2024-01-13T09:20:00Z'
          }
        ]
      })
    }
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onWithdrawalSubmit = async (data) => {
    try {
      // TODO: Implement withdrawal API call
      console.log('Withdrawal data:', data);
      toast.success('Запрос на вывод средств отправлен');
      setShowWithdrawalModal(false);
      reset();
    } catch (error) {
      toast.error('Ошибка отправки запроса');
    }
  };

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'sale':
        return <ArrowDownTrayIcon className="h-5 w-5 text-success-600" />;
      case 'withdrawal':
        return <ArrowUpTrayIcon className="h-5 w-5 text-error-600" />;
      case 'refund':
        return <CreditCardIcon className="h-5 w-5 text-warning-600" />;
      default:
        return <CurrencyDollarIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'badge-success', text: 'Завершено' },
      pending: { color: 'badge-warning', text: 'В обработке' },
      failed: { color: 'badge-error', text: 'Ошибка' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`badge ${config.color}`}>{config.text}</span>;
  };

  if (balanceLoading || transactionsLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Финансы</h1>
        <button
          onClick={() => setShowWithdrawalModal(true)}
          className="btn btn-primary"
        >
          <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
          Запросить вывод
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Текущий баланс</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(balance?.balance || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Всего заработано</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(balance?.totalEarned || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ArrowDownTrayIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ожидает вывода</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(balance?.pendingWithdrawals || 0)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <CalendarIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Period Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">История транзакций</h2>
          <div className="flex gap-2">
            {['week', 'month', 'quarter', 'year'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`btn btn-sm ${
                  period === p ? 'btn-primary' : 'btn-outline'
                }`}
              >
                {p === 'week' && 'Неделя'}
                {p === 'month' && 'Месяц'}
                {p === 'quarter' && 'Квартал'}
                {p === 'year' && 'Год'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Тип
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Описание
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Сумма
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Комиссия
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  К получению
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions?.transactions?.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTransactionIcon(transaction.type)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {transaction.type === 'sale' && 'Продажа'}
                        {transaction.type === 'withdrawal' && 'Вывод'}
                        {transaction.type === 'refund' && 'Возврат'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transaction.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      transaction.type === 'sale' ? 'text-success-600' : 'text-error-600'
                    }`}>
                      {transaction.type === 'sale' ? '+' : '-'}
                      {formatPrice(transaction.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatPrice(transaction.fee)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {formatPrice(transaction.net_amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(transaction.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Запрос на вывод средств
            </h2>

            <form onSubmit={handleSubmit(onWithdrawalSubmit)} className="space-y-6">
              <div>
                <label className="form-label">Сумма вывода</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ₽
                  </span>
                  <input
                    {...register('amount', {
                      required: 'Сумма обязательна',
                      min: {
                        value: 1000,
                        message: 'Минимальная сумма вывода 1000 ₽',
                      },
                      max: {
                        value: balance?.balance || 0,
                        message: 'Сумма превышает доступный баланс',
                      },
                    })}
                    type="number"
                    step="100"
                    min="1000"
                    max={balance?.balance || 0}
                    className={`form-input pl-8 ${errors.amount ? 'border-error-500' : ''}`}
                    placeholder="1000"
                  />
                </div>
                {errors.amount && (
                  <p className="form-error">{errors.amount.message}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Доступно для вывода: {formatPrice(balance?.balance || 0)}
                </p>
              </div>

              <div>
                <label className="form-label">Способ вывода</label>
                <select
                  {...register('method', {
                    required: 'Выберите способ вывода',
                  })}
                  className={`form-input ${errors.method ? 'border-error-500' : ''}`}
                >
                  <option value="">Выберите способ</option>
                  <option value="bank_card">Банковская карта</option>
                  <option value="bank_account">Банковский счет</option>
                  <option value="yoomoney">ЮMoney</option>
                </select>
                {errors.method && (
                  <p className="form-error">{errors.method.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Реквизиты</label>
                <textarea
                  {...register('details', {
                    required: 'Реквизиты обязательны',
                    minLength: {
                      value: 10,
                      message: 'Введите полные реквизиты',
                    },
                  })}
                  rows={3}
                  className={`form-input ${errors.details ? 'border-error-500' : ''}`}
                  placeholder="Номер карты, номер счета, кошелек и т.д."
                />
                {errors.details && (
                  <p className="form-error">{errors.details.message}</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Информация о выводе</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Минимальная сумма вывода: 1000 ₽</li>
                  <li>• Комиссия за вывод: 2% (минимум 50 ₽)</li>
                  <li>• Срок обработки: 1-3 рабочих дня</li>
                  <li>• Вывод осуществляется на реквизиты, указанные в профиле</li>
                </ul>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowWithdrawalModal(false)}
                  className="btn btn-outline"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  Отправить запрос
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerFinance;
