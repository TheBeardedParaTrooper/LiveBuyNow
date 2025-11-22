import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// A simple guest token generator stored in localStorage
const GUEST_KEY = 'lbn_guest_token';
function getGuestToken() {
  let t = localStorage.getItem(GUEST_KEY);
  if (!t) {
    t = `g_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    localStorage.setItem(GUEST_KEY, t);
  }
  return t;
}

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
  openCart: () => void;
  closeCart: () => void;
  isCartOpen: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user } = useAuth();

  const guestToken = typeof window !== 'undefined' ? getGuestToken() : null;
  const [isCartOpen, setIsCartOpen] = useState(false);

  const refreshCart = async () => {
    try {
      const params = user ? `?user_id=${user.id}` : `?guest_token=${guestToken}`;
      const res = await fetch(`/api/cart${params}`);
      const data = await res.json();
      setCartItems(
        data.map((d: any) => ({
          id: d.id,
          product_id: d.product_id,
          quantity: d.quantity,
          products: { name: d.name, price: Number(d.price), image_url: d.image_url },
        })) || []
      );
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  useEffect(() => {
    refreshCart();
  }, [user]);

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      const payload: any = { product_id: productId, quantity };
      if (user) payload.user_id = user.id;
      else payload.guest_token = guestToken;

      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to add to cart');
      toast.success('Added to cart!');
      await refreshCart();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to add to cart');
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(itemId);
      return;
    }
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, quantity }),
      });
      if (!res.ok) throw new Error('Failed to update quantity');
      await refreshCart();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update quantity');
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId }),
      });
      if (!res.ok) throw new Error('Failed to remove item');
      toast.success('Item removed');
      await refreshCart();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      if (!user) {
        // clear guest cart
        const res = await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ guest_token: guestToken }),
        });
        if (!res.ok) throw new Error('Failed to clear cart');
        setCartItems([]);
        return;
      }

      const res = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      if (!res.ok) throw new Error('Failed to clear cart');
      setCartItems([]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to clear cart');
    }
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
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        isCartOpen,
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
