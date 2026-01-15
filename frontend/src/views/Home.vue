<template>
  <div class="page-container">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">3DPrintHub</h1>
          <p class="hero-subtitle">Маркетплейс 3D-товаров и моделей для печати</p>
          <div class="hero-actions">
            <el-button type="primary" size="large" @click="$router.push('/products')">
              Каталог товаров
            </el-button>
            <el-button size="large" @click="$router.push('/shops')">
              Магазины
            </el-button>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="categories">
      <div class="container">
        <h2 class="section-title">Категории</h2>
        <div class="categories-grid" v-loading="categoriesLoading">
          <div 
            v-for="category in categories" 
            :key="category.id"
            class="category-card"
            @click="$router.push(`/products?category=${category.slug}`)"
          >
            <div class="category-icon">
              <img v-if="category.icon" :src="category.icon" :alt="category.name" />
              <el-icon v-else><Box /></el-icon>
            </div>
            <h3>{{ category.name }}</h3>
            <p>{{ category.products_count || 0 }} товаров</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="featured-products">
      <div class="container">
        <h2 class="section-title">Популярные товары</h2>
        <div class="products-grid" v-loading="productsLoading">
          <ProductCard 
            v-for="product in featuredProducts" 
            :key="product.id"
            :product="product"
          />
        </div>
        <div class="text-center mt-4">
          <el-button @click="$router.push('/products')">
            Все товары
          </el-button>
        </div>
      </div>
    </section>

    <!-- Featured Shops -->
    <section class="featured-shops">
      <div class="container">
        <h2 class="section-title">Популярные магазины</h2>
        <div class="shops-grid" v-loading="shopsLoading">
          <ShopCard 
            v-for="shop in featuredShops" 
            :key="shop.id"
            :shop="shop"
          />
        </div>
        <div class="text-center mt-4">
          <el-button @click="$router.push('/shops')">
            Все магазины
          </el-button>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="container">
        <h2 class="section-title">Почему выбирают 3DPrintHub</h2>
        <div class="features-grid">
          <div class="feature-card">
            <el-icon class="feature-icon"><Star /></el-icon>
            <h3>Безопасные сделки</h3>
            <p>Защита покупателей и продавцов с эскроу-сервисом</p>
          </div>
          <div class="feature-card">
            <el-icon class="feature-icon"><View /></el-icon>
            <h3>3D-предпросмотр</h3>
            <p>Интерактивный просмотр моделей перед покупкой</p>
          </div>
          <div class="feature-card">
            <el-icon class="feature-icon"><Download /></el-icon>
            <h3>Мгновенная доставка</h3>
          <p>Цифровые товары доступны сразу после оплаты</p>
          </div>
          <div class="feature-card">
            <el-icon class="feature-icon"><Service /></el-icon>
            <h3>Поддержка 24/7</h3>
            <p>Помощь в решении любых вопросов</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Box, Star, View, Download, Service } from '@element-plus/icons-vue'
import api from '@/utils/api'
import ProductCard from '@/components/ProductCard.vue'
import ShopCard from '@/components/ShopCard.vue'

const categories = ref([])
const featuredProducts = ref([])
const featuredShops = ref([])

const categoriesLoading = ref(false)
const productsLoading = ref(false)
const shopsLoading = ref(false)

const fetchCategories = async () => {
  categoriesLoading.value = true
  try {
    const response = await api.get('/categories')
    categories.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch categories:', error)
  } finally {
    categoriesLoading.value = false
  }
}

const fetchFeaturedProducts = async () => {
  productsLoading.value = true
  try {
    const response = await api.get('/products', {
      params: { featured: true, limit: 8 }
    })
    featuredProducts.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch featured products:', error)
  } finally {
    productsLoading.value = false
  }
}

const fetchFeaturedShops = async () => {
  shopsLoading.value = true
  try {
    const response = await api.get('/shops', {
      params: { featured: true, limit: 6 }
    })
    featuredShops.value = response.data.data
  } catch (error) {
    console.error('Failed to fetch featured shops:', error)
  } finally {
    shopsLoading.value = false
  }
}

onMounted(() => {
  fetchCategories()
  fetchFeaturedProducts()
  fetchFeaturedShops()
})
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 80px 0;
  text-align: center;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
}

.hero-subtitle {
  font-size: 20px;
  margin-bottom: 32px;
  opacity: 0.9;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.section-title {
  font-size: 32px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 40px;
  color: var(--text-primary);
}

.categories {
  padding: 60px 0;
  background: white;
}

.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
}

.category-card {
  text-align: center;
  padding: 24px;
  border-radius: 12px;
  background: var(--background-base);
  cursor: pointer;
  transition: all 0.2s;
}

.category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.category-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 12px;
  font-size: 32px;
  color: var(--primary-color);
}

.category-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.category-card h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.category-card p {
  color: var(--text-regular);
  font-size: 14px;
}

.featured-products {
  padding: 60px 0;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.featured-shops {
  padding: 60px 0;
  background: white;
}

.shops-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.features {
  padding: 60px 0;
  background: var(--background-base);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 32px;
}

.feature-card {
  text-align: center;
  padding: 32px 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 48px;
  color: var(--primary-color);
  margin-bottom: 16px;
}

.feature-card h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.feature-card p {
  color: var(--text-regular);
  line-height: 1.6;
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 32px;
  }
  
  .hero-subtitle {
    font-size: 16px;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .section-title {
    font-size: 24px;
  }
  
  .categories-grid,
  .products-grid,
  .shops-grid,
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
