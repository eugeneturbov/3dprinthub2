import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { adminAPI } from '../../../services/api';
import { 
  UsersIcon,
  SearchIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  BanIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Spinner } from '../../../components/UI/Spinner';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useQuery(
    ['adminUsers', page, search, roleFilter, statusFilter],
    () => adminAPI.getUsers({
      page,
      search,
      role: roleFilter,
      status: statusFilter
    }),
    {
      keepPreviousData: true
    }
  );

  const updateStatusMutation = useMutation(
    adminAPI.updateUserStatus,
    {
      onSuccess: () => {
        toast.success('Статус пользователя обновлен');
        queryClient.invalidateQueries('adminUsers');
      },
      onError: (error) => {
        toast.error(error.response?.data?.error || 'Ошибка обновления статуса');
      }
    }
  );

  const handleStatusChange = (userId, newStatus) => {
    updateStatusMutation.mutate({
      userId,
      status: newStatus
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      user: { color: 'badge-secondary', text: 'Пользователь' },
      seller: { color: 'badge-primary', text: 'Продавец' },
      admin: { color: 'badge-error', text: 'Администратор' }
    };
    const config = roleConfig[role] || roleConfig.user;
    return <span className={`badge ${config.color}`}>{config.text}</span>;
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <span className="badge badge-success">Активен</span>
    ) : (
      <span className="badge badge-error">Неактивен</span>
    );
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

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Ошибка загрузки пользователей</p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  const users = data?.users || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Пользователи</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <UsersIcon className="h-5 w-5" />
          <span>{pagination?.total || 0} пользователей</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по имени, фамилии или email"
                  className="form-input pl-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="form-input"
              >
                <option value="">Все роли</option>
                <option value="user">Пользователи</option>
                <option value="seller">Продавцы</option>
                <option value="admin">Администраторы</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-input"
              >
                <option value="">Все статусы</option>
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
              </select>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button type="submit" className="btn btn-primary w-full">
                Поиск
              </button>
            </div>
          </div>

          {/* Clear Filters */}
          {(search || roleFilter || statusFilter) && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
                  setStatusFilter('');
                  setPage(1);
                }}
                className="btn btn-outline"
              >
                Сбросить фильтры
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Магазин
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заказы
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата регистрации
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full object-cover"
                            src={user.avatar_url}
                            alt={user.first_name}
                          />
                        ) : (
                          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-500">
                              {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(user.is_active)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.shop ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.shop.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.shop.status === 'approved' ? 'Активен' : user.shop.status}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Нет магазина</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.orders_count} заказ{user.orders_count === 1 ? '' : 'ов'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        title="Просмотр"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        title="Редактировать"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>

                      {user.is_active ? (
                        <button
                          onClick={() => handleStatusChange(user.id, 'inactive')}
                          className="text-gray-400 hover:text-red-600"
                          title="Деактивировать"
                          disabled={updateStatusMutation.isLoading}
                        >
                          <BanIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(user.id, 'active')}
                          className="text-gray-400 hover:text-green-600"
                          title="Активировать"
                          disabled={updateStatusMutation.isLoading}
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                disabled={page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Вперед
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Показано от{' '}
                  <span className="font-medium">
                    {(page - 1) * pagination.limit + 1}
                  </span>{' '}
                  до{' '}
                  <span className="font-medium">
                    {Math.min(page * pagination.limit, pagination.total)}
                  </span>{' '}
                  из{' '}
                  <span className="font-medium">{pagination.total}</span> пользователей
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Страница {page} из {pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(pagination.pages, page + 1))}
                    disabled={page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {users.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Пользователи не найдены
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Попробуйте изменить параметры поиска или фильтры
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
