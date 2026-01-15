import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Spinner } from '../UI/Spinner';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, loading, user, hasAnyRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (roles.length > 0 && !hasAnyRole(roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Доступ запрещен</h1>
          <p className="text-gray-600 mb-8">У вас нет прав для доступа к этой странице</p>
          <button
            onClick={() => window.history.back()}
            className="btn btn-primary"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
