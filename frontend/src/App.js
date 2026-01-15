import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Layouts
import Layout from './components/Layout/Layout';
import AuthLayout from './components/Layout/AuthLayout';

// Public pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Shops from './pages/Shops';
import ShopDetail from './pages/ShopDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import CheckoutSuccess from './pages/CheckoutSuccess';
import About from './pages/About';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import VerifyEmail from './pages/Auth/VerifyEmail';

// User dashboard
import UserDashboard from './pages/Dashboard/User/UserDashboard';
import UserProfile from './pages/Dashboard/User/UserProfile';
import UserOrders from './pages/Dashboard/User/UserOrders';
import UserWishlist from './pages/Dashboard/User/UserWishlist';
import UserAddresses from './pages/Dashboard/User/UserAddresses';

// Seller dashboard
import SellerDashboard from './pages/Dashboard/Seller/SellerDashboard';
import SellerProducts from './pages/Dashboard/Seller/SellerProducts';
import SellerOrders from './pages/Dashboard/Seller/SellerOrders';
import SellerShop from './pages/Dashboard/Seller/SellerShop';
import SellerFinance from './pages/Dashboard/Seller/SellerFinance';
import SellerAnalytics from './pages/Dashboard/Seller/SellerAnalytics';
import CreateProduct from './pages/Dashboard/Seller/CreateProduct';
import RegisterShop from './pages/Dashboard/Seller/RegisterShop';

// Admin dashboard
import AdminDashboard from './pages/Dashboard/Admin/AdminDashboard';
import AdminUsers from './pages/Dashboard/Admin/AdminUsers';
import AdminShops from './pages/Dashboard/Admin/AdminShops';
import AdminProducts from './pages/Dashboard/Admin/AdminProducts';
import AdminOrders from './pages/Dashboard/Admin/AdminOrders';
import AdminSettings from './pages/Dashboard/Admin/AdminSettings';

// Components
import ProtectedRoute from './components/Auth/ProtectedRoute';
import PublicRoute from './components/Auth/PublicRoute';

// Hooks
import { useAuth } from './hooks/useAuth';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="products" element={<Products />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="shops" element={<Shops />} />
              <Route path="shops/:slug" element={<ShopDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="terms" element={<Terms />} />
            </Route>

            {/* Auth routes */}
            <Route path="/auth" element={<AuthLayout />}>
              <Route path="login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="forgot-password" element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } />
              <Route path="reset-password" element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              } />
              <Route path="verify-email" element={<VerifyEmail />} />
            </Route>

            {/* Protected checkout */}
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Layout>
                  <Checkout />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/checkout/success" element={
              <ProtectedRoute>
                <Layout>
                  <CheckoutSuccess />
                </Layout>
              </ProtectedRoute>
            } />

            {/* User dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute roles={['user', 'seller', 'admin']}>
                <UserDashboard />
              </ProtectedRoute>
            }>
              <Route path="profile" element={<UserProfile />} />
              <Route path="orders" element={<UserOrders />} />
              <Route path="wishlist" element={<UserWishlist />} />
              <Route path="addresses" element={<UserAddresses />} />
            </Route>

            {/* Seller dashboard */}
            <Route path="/seller" element={
              <ProtectedRoute roles={['seller', 'admin']}>
                <SellerDashboard />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/seller/products" replace />} />
              <Route path="products" element={<SellerProducts />} />
              <Route path="products/new" element={<CreateProduct />} />
              <Route path="products/:id/edit" element={<CreateProduct />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="shop" element={<SellerShop />} />
              <Route path="finance" element={<SellerFinance />} />
              <Route path="register" element={<RegisterShop />} />
              <Route path="analytics" element={<SellerAnalytics />} />
            </Route>

            {/* Admin dashboard */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="shops" element={<AdminShops />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={
              <Layout>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-8">Страница не найдена</p>
                    <a
                      href="/"
                      className="btn btn-primary"
                    >
                      Вернуться на главную
                    </a>
                  </div>
                </div>
              </Layout>
            } />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
