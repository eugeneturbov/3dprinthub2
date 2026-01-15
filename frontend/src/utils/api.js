import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const authStore = useAuthStore()
    
    if (error.response?.status === 401) {
      authStore.logout()
      window.location.href = '/auth/login'
      return Promise.reject(error)
    }
    
    if (error.response?.status === 422) {
      const errors = error.response.data.errors
      const message = Object.values(errors).flat().join(', ')
      ElMessage.error(message)
    } else if (error.response?.data?.message) {
      ElMessage.error(error.response.data.message)
    } else if (error.message) {
      ElMessage.error(error.message)
    } else {
      ElMessage.error('Произошла ошибка')
    }
    
    return Promise.reject(error)
  }
)

export default api
