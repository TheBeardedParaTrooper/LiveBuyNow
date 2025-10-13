import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    name: string;
    price: number;
    image_url: string | null;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  const refreshCart = async () => {
    if (!user) {
      setCartItems([]);
      return;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select('*, products(name, price, image_url)')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching cart:', error);
      return;
    }

    setCartItems(data || []);
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    const existingItem = cartItems.find(item => item.product_id === productId);

    if (existingItem) {
      await updateQuantity(existingItem.id, existingItem.quantity + quantity);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .insert({ product_id: productId, quantity, user_id: user.id });

    if (error) {
      toast.error('Failed to add to cart');
      console.error(error);
      return;
    }

    toast.success('Added to cart!');
    refreshCart();
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to update quantity');
      return;
    }

    refreshCart();
  };

  const removeFromCart = async (itemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      toast.error('Failed to remove item');
      return;
    }

    toast.success('Item removed');
    refreshCart();
  };

  const clearCart = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      toast.error('Failed to clear cart');
      return;
    }

    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
