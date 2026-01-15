import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('@/views/Home.vue'),
    },
    {
      path: '/products',
      name: 'Products',
      component: () => import('@/views/Products.vue'),
    },
    {
      path: '/products/:slug',
      name: 'ProductDetail',
      component: () => import('@/views/ProductDetail.vue'),
    },
    {
      path: '/shops',
      name: 'Shops',
      component: () => import('@/views/Shops.vue'),
    },
    {
      path: '/shops/:slug',
      name: 'ShopDetail',
      component: () => import('@/views/ShopDetail.vue'),
    },
    {
      path: '/cart',
      name: 'Cart',
      component: () => import('@/views/Cart.vue'),
    },
    {
      path: '/checkout',
      name: 'Checkout',
      component: () => import('@/views/Checkout.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/checkout/success',
      name: 'CheckoutSuccess',
      component: () => import('@/views/CheckoutSuccess.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/auth/login',
      name: 'Login',
      component: () => import('@/views/auth/Login.vue'),
      meta: { guest: true },
    },
    {
      path: '/auth/register',
      name: 'Register',
      component: () => import('@/views/auth/Register.vue'),
      meta: { guest: true },
    },
    {
      path: '/auth/forgot-password',
      name: 'ForgotPassword',
      component: () => import('@/views/auth/ForgotPassword.vue'),
      meta: { guest: true },
    },
    {
      path: '/auth/reset-password',
      name: 'ResetPassword',
      component: () => import('@/views/auth/ResetPassword.vue'),
      meta: { guest: true },
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('@/views/dashboard/Dashboard.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'UserDashboard',
          component: () => import('@/views/dashboard/user/Profile.vue'),
        },
        {
          path: 'orders',
          name: 'UserOrders',
          component: () => import('@/views/dashboard/user/Orders.vue'),
        },
        {
          path: 'addresses',
          name: 'UserAddresses',
          component: () => import('@/views/dashboard/user/Addresses.vue'),
        },
        {
          path: 'balance',
          name: 'UserBalance',
          component: () => import('@/views/dashboard/user/Balance.vue'),
        },
      ],
    },
    {
      path: '/seller',
      name: 'SellerDashboard',
      component: () => import('@/views/dashboard/SellerDashboard.vue'),
      meta: { requiresAuth: true, requiresSeller: true },
      children: [
        {
          path: '',
          name: 'SellerHome',
          component: () => import('@/views/dashboard/seller/Home.vue'),
        },
        {
          path: 'shop',
          name: 'SellerShop',
          component: () => import('@/views/dashboard/seller/Shop.vue'),
        },
        {
          path: 'products',
          name: 'SellerProducts',
          component: () => import('@/views/dashboard/seller/Products.vue'),
        },
        {
          path: 'products/create',
          name: 'SellerCreateProduct',
          component: () => import('@/views/dashboard/seller/CreateProduct.vue'),
        },
        {
          path: 'products/:id/edit',
          name: 'SellerEditProduct',
          component: () => import('@/views/dashboard/seller/EditProduct.vue'),
        },
        {
          path: 'orders',
          name: 'SellerOrders',
          component: () => import('@/views/dashboard/seller/Orders.vue'),
        },
        {
          path: 'finance',
          name: 'SellerFinance',
          component: () => import('@/views/dashboard/seller/Finance.vue'),
        },
      ],
    },
    {
      path: '/admin',
      name: 'AdminDashboard',
      component: () => import('@/views/dashboard/AdminDashboard.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'AdminHome',
          component: () => import('@/views/dashboard/admin/Home.vue'),
        },
        {
          path: 'users',
          name: 'AdminUsers',
          component: () => import('@/views/dashboard/admin/Users.vue'),
        },
        {
          path: 'shops',
          name: 'AdminShops',
          component: () => import('@/views/dashboard/admin/Shops.vue'),
        },
        {
          path: 'products',
          name: 'AdminProducts',
          component: () => import('@/views/dashboard/admin/Products.vue'),
        },
        {
          path: 'orders',
          name: 'AdminOrders',
          component: () => import('@/views/dashboard/admin/Orders.vue'),
        },
        {
          path: 'reports',
          name: 'AdminReports',
          component: () => import('@/views/dashboard/admin/Reports.vue'),
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: () => import('@/views/NotFound.vue'),
    },
  ],
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth/login')
    return
  }
  
  if (to.meta.guest && authStore.isAuthenticated) {
    next('/dashboard')
    return
  }
  
  if (to.meta.requiresSeller && !authStore.isSeller) {
    next('/dashboard')
    return
  }
  
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/dashboard')
    return
  }
  
  next()
})

export default router
