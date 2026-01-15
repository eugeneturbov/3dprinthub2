<template>
  <div class="admin-dashboard">
    <div class="page-header">
      <h1 class="page-title">Панель администратора</h1>
      <p class="page-subtitle">Управление маркетплейсом 3DPrintHub</p>
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon users">
          <el-icon><User /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.total_users }}</h3>
          <p>Всего пользователей</p>
          <span class="stat-change positive">+{{ stats.new_users_today }} сегодня</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon shops">
          <el-icon><Shop /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.total_shops }}</h3>
          <p>Магазинов</p>
          <span class="stat-change">{{ stats.pending_shops }} на модерации</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon products">
          <el-icon><Box /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.total_products }}</h3>
          <p>Товаров</p>
          <span class="stat-change">{{ stats.pending_products }} на модерации</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orders">
          <el-icon><ShoppingCart /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.total_orders }}</h3>
          <p>Заказов</p>
          <span class="stat-change positive">+{{ stats.new_orders_today }} сегодня</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon revenue">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ formatCurrency(stats.total_revenue) }}</h3>
          <p>Общая выручка</p>
          <span class="stat-change positive">+{{ formatCurrency(stats.today_revenue) }} сегодня</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon commission">
          <el-icon><CreditCard /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ formatCurrency(stats.total_commission) }}</h3>
          <p>Комиссии</p>
          <span class="stat-change positive">+{{ formatCurrency(stats.today_commission) }} сегодня</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Быстрые действия</h2>
      </div>
      <div class="quick-actions">
        <el-button type="primary" @click="$router.push('/admin/shops')">
          <el-icon><Shop /></el-icon>
          Модерация магазинов
        </el-button>
        <el-button type="primary" @click="$router.push('/admin/products')">
          <el-icon><Box /></el-icon>
          Модерация товаров
        </el-button>
        <el-button type="success" @click="$router.push('/admin/orders')">
          <el-icon><ShoppingCart /></el-icon>
          Управление заказами
        </el-button>
        <el-button type="warning" @click="$router.push('/admin/users')">
          <el-icon><User /></el-icon>
          Управление пользователями
        </el-button>
        <el-button type="info" @click="$router.push('/admin/reports')">
          <el-icon><DataAnalysis /></el-icon>
          Отчеты
        </el-button>
      </div>
    </div>

    <!-- Recent Activities -->
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Последние действия</h2>
      </div>
      <el-table :data="recentActivities" v-loading="activitiesLoading">
        <el-table-column prop="created_at" label="Дата" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="type" label="Тип" width="120">
          <template #default="{ row }">
            <el-tag :type="getActivityTypeColor(row.type)">
              {{ getActivityTypeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="Описание" />
        <el-table-column prop="user_name" label="Пользователь" width="150" />
        <el-table-column label="Действия" width="100">
          <template #default="{ row }">
            <el-button 
              v-if="row.action_url" 
              type="text" 
              size="small"
              @click="handleActivityAction(row)"
            >
              Открыть
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Sales Chart -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Продажи (7 дней)</h2>
        </div>
        <div class="chart-container">
          <canvas ref="salesChart"></canvas>
        </div>
      </div>

      <!-- Commission Chart -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Комиссии (7 дней)</h2>
        </div>
        <div class="chart-container">
          <canvas ref="commissionChart"></canvas>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { 
  User, Shop, Box, ShoppingCart, Money, CreditCard, DataAnalysis 
} from '@element-plus/icons-vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import api from '@/utils/api'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const router = useRouter()

const stats = ref({
  total_users: 0,
  new_users_today: 0,
  total_shops: 0,
  pending_shops: 0,
  total_products: 0,
  pending_products: 0,
  total_orders: 0,
  new_orders_today: 0,
  total_revenue: 0,
  today_revenue: 0,
  total_commission: 0,
  today_commission: 0,
})

const recentActivities = ref([])
const activitiesLoading = ref(false)

const salesChart = ref(null)
const commissionChart = ref(null)

const fetchDashboardData = async () => {
  try {
    const response = await api.get('/admin/dashboard')
    stats.value = response.data.stats
    recentActivities.value = response.data.recent_activities
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error)
  }
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('ru-RU')
}

const getActivityTypeLabel = (type) => {
  const labels = {
    'user_registered': 'Пользователь',
    'shop_created': 'Магазин',
    'product_created': 'Товар',
    'order_created': 'Заказ',
    'payment_completed': 'Оплата',
  }
  return labels[type] || type
}

const getActivityTypeColor = (type) => {
  const colors = {
    'user_registered': 'info',
    'shop_created': 'success',
    'product_created': 'warning',
    'order_created': 'primary',
    'payment_completed': 'success',
  }
  return colors[type] || 'info'
}

const handleActivityAction = (activity) => {
  if (activity.action_url) {
    router.push(activity.action_url)
  }
}

const initCharts = async () => {
  await nextTick()
  
  // Sales Chart
  if (salesChart.value) {
    new ChartJS(salesChart.value, {
      type: 'line',
      data: {
        labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        datasets: [{
          label: 'Продажи',
          data: [12000, 19000, 15000, 25000, 22000, 30000, 28000],
          borderColor: '#409eff',
          backgroundColor: 'rgba(64, 158, 255, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value)
              }
            }
          }
        }
      }
    })
  }
  
  // Commission Chart
  if (commissionChart.value) {
    new ChartJS(commissionChart.value, {
      type: 'line',
      data: {
        labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
        datasets: [{
          label: 'Комиссии',
          data: [1440, 2280, 1800, 3000, 2640, 3600, 3360],
          borderColor: '#67c23a',
          backgroundColor: 'rgba(103, 194, 58, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return formatCurrency(value)
              }
            }
          }
        }
      }
    })
  }
}

onMounted(() => {
  fetchDashboardData()
  initCharts()
})
</script>

<style scoped>
.admin-dashboard {
  padding: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.users { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stat-icon.shops { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stat-icon.products { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stat-icon.orders { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.stat-icon.revenue { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
.stat-icon.commission { background: linear-gradient(135deg, #30cfd0 0%, #330867 100%); }

.stat-content h3 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.stat-content p {
  font-size: 14px;
  color: var(--text-regular);
  margin-bottom: 4px;
}

.stat-change {
  font-size: 12px;
  font-weight: 500;
}

.stat-change.positive {
  color: var(--success-color);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.chart-container {
  height: 300px;
  position: relative;
}

@media (max-width: 768px) {
  .admin-dashboard {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .stat-card {
    padding: 16px;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .stat-content h3 {
    font-size: 20px;
  }
  
  .quick-actions {
    flex-direction: column;
  }
}
</style>
