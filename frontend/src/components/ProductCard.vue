<template>
  <div class="product-card" @click="goToProduct">
    <div class="product-image">
      <img v-if="product.main_image_url" :src="product.main_image_url" :alt="product.name" />
      <div v-else class="no-image">
        <el-icon><Picture /></el-icon>
      </div>
      
      <div class="product-badges">
        <span v-if="product.is_featured" class="badge badge-warning">Популярное</span>
        <span v-if="product.type === 'digital'" class="badge badge-info">Цифровой</span>
        <span v-if="has3DModel" class="badge badge-success">3D</span>
      </div>
    </div>
    
    <div class="product-info">
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="product-shop">{{ product.shop?.name }}</p>
      
      <div class="product-rating" v-if="product.rating_count > 0">
        <el-rate 
          :model-value="product.rating" 
          disabled 
          size="small"
          show-score
          text-color="#ff9900"
        />
        <span class="rating-count">({{ product.rating_count }})</span>
      </div>
      
      <div class="product-price">
        <span class="current-price">{{ formatPrice(product.price) }}</span>
        <span v-if="product.compare_price" class="compare-price">
          {{ formatPrice(product.compare_price) }}
        </span>
      </div>
      
      <div class="product-stock" :class="{ 'out-of-stock': !product.is_in_stock }">
        <el-icon v-if="product.is_in_stock"><Check /></el-icon>
        <el-icon v-else><Close /></el-icon>
        {{ product.is_in_stock ? 'В наличии' : 'Нет в наличии' }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Picture, Check, Close } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const has3DModel = computed(() => !!props.product['3d_model_file'])

const formatPrice = (price) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0
  }).format(price)
}

const goToProduct = () => {
  router.push(`/products/${props.product.slug}`)
}
</script>

<style scoped>
.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.product-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.no-image {
  width: 100%;
  height: 100%;
  background: var(--background-base);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-placeholder);
  font-size: 48px;
}

.product-badges {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-info {
  padding: 16px;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-shop {
  font-size: 14px;
  color: var(--text-regular);
  margin-bottom: 8px;
}

.product-rating {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.rating-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.product-price {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.current-price {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.compare-price {
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: line-through;
}

.product-stock {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--success-color);
}

.product-stock.out-of-stock {
  color: var(--danger-color);
}

@media (max-width: 768px) {
  .product-image {
    height: 160px;
  }
  
  .product-info {
    padding: 12px;
  }
  
  .product-name {
    font-size: 14px;
  }
  
  .current-price {
    font-size: 16px;
  }
}
</style>
