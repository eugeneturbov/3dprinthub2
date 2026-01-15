<template>
  <div class="shop-card" @click="goToShop">
    <div class="shop-header">
      <div class="shop-logo">
        <img v-if="shop.logo_url" :src="shop.logo_url" :alt="shop.name" />
        <div v-else class="no-logo">
          <el-icon><Shop /></el-icon>
        </div>
      </div>
      
      <div class="shop-info">
        <h3 class="shop-name">{{ shop.name }}</h3>
        <div class="shop-rating" v-if="shop.rating_count > 0">
          <el-rate 
            :model-value="shop.rating" 
            disabled 
            size="small"
            show-score
            text-color="#ff9900"
          />
          <span class="rating-count">({{ shop.rating_count }})</span>
        </div>
        <div v-else class="no-rating">Нет отзывов</div>
      </div>
      
      <div class="shop-badges">
        <span v-if="shop.is_featured" class="badge badge-warning">Популярное</span>
      </div>
    </div>
    
    <div class="shop-description" v-if="shop.description">
      <p>{{ shop.description }}</p>
    </div>
    
    <div class="shop-stats">
      <div class="stat-item">
        <span class="stat-value">{{ shop.products_count || 0 }}</span>
        <span class="stat-label">товаров</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ shop.rating_count || 0 }}</span>
        <span class="stat-label">отзывов</span>
      </div>
    </div>
    
    <div class="shop-footer">
      <el-button type="primary" size="small">
        Перейти в магазин
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { Shop } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  shop: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const goToShop = () => {
  router.push(`/shops/${props.shop.slug}`)
}
</script>

<style scoped>
.shop-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  cursor: pointer;
}

.shop-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.shop-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.shop-logo {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.shop-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-logo {
  width: 100%;
  height: 100%;
  background: var(--background-base);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-placeholder);
  font-size: 24px;
}

.shop-info {
  flex: 1;
}

.shop-name {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.shop-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.no-rating {
  font-size: 12px;
  color: var(--text-secondary);
}

.shop-badges {
  display: flex;
  gap: 4px;
}

.shop-description {
  margin-bottom: 16px;
}

.shop-description p {
  font-size: 14px;
  color: var(--text-regular);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.shop-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px 0;
  border-top: 1px solid var(--border-lighter);
  border-bottom: 1px solid var(--border-lighter);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.shop-footer {
  text-align: center;
}

@media (max-width: 768px) {
  .shop-card {
    padding: 16px;
  }
  
  .shop-header {
    gap: 12px;
  }
  
  .shop-logo {
    width: 50px;
    height: 50px;
  }
  
  .shop-name {
    font-size: 16px;
  }
  
  .shop-stats {
    gap: 16px;
  }
}
</style>
