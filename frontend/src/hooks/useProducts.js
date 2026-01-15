import { useQuery } from 'react-query';
import { productsAPI } from '../services/api';

export const useProducts = (params = {}) => {
  return useQuery(
    ['products', params],
    () => productsAPI.getProducts(params),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useProduct = (id) => {
  return useQuery(
    ['product', id],
    () => productsAPI.getProduct(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useFeaturedProducts = (params = {}) => {
  return useQuery(
    ['featuredProducts', params],
    () => productsAPI.getFeaturedProducts(params),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useRelatedProducts = (productId, params = {}) => {
  return useQuery(
    ['relatedProducts', productId, params],
    () => productsAPI.getRelatedProducts(productId, params),
    {
      enabled: !!productId,
      staleTime: 15 * 60 * 1000, // 15 minutes
    }
  );
};

export const useSearchProducts = (query, params = {}) => {
  return useQuery(
    ['searchProducts', query, params],
    () => productsAPI.searchProducts({ q: query, ...params }),
    {
      enabled: !!query,
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  );
};
