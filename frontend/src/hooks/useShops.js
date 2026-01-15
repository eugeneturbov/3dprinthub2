import { useQuery } from 'react-query';
import { shopsAPI } from '../services/api';

export const useShops = (params = {}) => {
  return useQuery(
    ['shops', params],
    () => shopsAPI.getShops(params),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};

export const useShop = (id) => {
  return useQuery(
    ['shop', id],
    () => shopsAPI.getShop(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useShopBySlug = (slug) => {
  return useQuery(
    ['shop', slug],
    () => shopsAPI.getShopBySlug(slug),
    {
      enabled: !!slug,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useShopProducts = (shopId, params = {}) => {
  return useQuery(
    ['shopProducts', shopId, params],
    () => shopsAPI.getShopProducts(shopId, params),
    {
      enabled: !!shopId,
      staleTime: 5 * 60 * 1000,
    }
  );
};

export const useUserShop = (userId) => {
  return useQuery(
    ['userShop', userId],
    () => shopsAPI.getMyShop(),
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000,
      select: (data) => data.shop
    }
  );
};
