import { useState, useEffect, useContext, createContext } from 'react';
import { cartAPI } from '../services/api';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartTotal, setCartTotal] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  // Calculate cart totals whenever items change
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const count = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    setCartTotal(total);
    setCartCount(count);
  }, [cartItems]);

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setCartItems(response.data.items || []);
    } catch (error) {
      console.error('Failed to load cart:', error);
      // Don't show error toast for cart loading failures
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1, variantId = null) => {
    try {
      const response = await cartAPI.addToCart({
        product_id: productId,
        quantity,
        variant_id: variantId,
      });

      setCartItems(response.data.items || []);
      toast.success('Товар добавлен в корзину!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка добавления в корзину';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    if (quantity < 1) {
      return removeFromCart(itemId);
    }

    try {
      const response = await cartAPI.updateCartItem(itemId, quantity);
      setCartItems(response.data.items || []);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка обновления корзины';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const response = await cartAPI.removeFromCart(itemId);
      setCartItems(response.data.items || []);
      toast.success('Товар удален из корзины');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка удаления из корзины';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clearCart();
      setCartItems([]);
      toast.success('Корзина очищена');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Ошибка очистки корзины';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const isInCart = (productId, variantId = null) => {
    return cartItems.some(item => 
      item.product_id === productId && 
      (variantId ? item.variant_id === variantId : !item.variant_id)
    );
  };

  const getCartItem = (productId, variantId = null) => {
    return cartItems.find(item => 
      item.product_id === productId && 
      (variantId ? item.variant_id === variantId : !item.variant_id)
    );
  };

  const getItemQuantity = (productId, variantId = null) => {
    const item = getCartItem(productId, variantId);
    return item ? item.quantity : 0;
  };

  const value = {
    cartItems,
    loading,
    cartTotal,
    cartCount,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    isInCart,
    getCartItem,
    getItemQuantity,
    loadCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
