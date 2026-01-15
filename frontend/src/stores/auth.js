import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isSeller = computed(() => user.value?.role === 'seller' || user.value?.role === 'admin')
  const isAdmin = computed(() => user.value?.role === 'admin')

  const initializeAuth = async () => {
    if (token.value) {
      try {
        const response = await api.get('/user/profile')
        user.value = response.data
      } catch (error) {
        logout()
      }
    }
  }

  const login = async (credentials) => {
    loading.value = true
    try {
      const response = await api.post('/auth/login', credentials)
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', token.value)
      return response.data
    } finally {
      loading.value = false
    }
  }

  const register = async (userData) => {
    loading.value = true
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      user.value = null
      token.value = null
      localStorage.removeItem('token')
    }
  }

  const forgotPassword = async (email) => {
    return await api.post('/auth/forgot-password', { email })
  }

  const resetPassword = async (data) => {
    return await api.post('/auth/reset-password', data)
  }

  const updateProfile = async (userData) => {
    const response = await api.put('/user/profile', userData)
    user.value = { ...user.value, ...response.data }
    return response.data
  }

  const updatePassword = async (passwordData) => {
    return await api.put('/user/password', passwordData)
  }

  const uploadAvatar = async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    const response = await api.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    user.value = { ...user.value, ...response.data }
    return response.data
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    isSeller,
    isAdmin,
    initializeAuth,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    updatePassword,
    uploadAvatar,
  }
})
