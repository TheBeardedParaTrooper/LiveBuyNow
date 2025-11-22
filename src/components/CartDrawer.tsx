import React from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
import { useCart } from '@/contexts/CartContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';

const CartDrawer = () => {
  const { cartItems, isCartOpen, closeCart, updateQuantity, removeFromCart } = useCart();

  const total = cartItems.reduce((s, it) => s + it.products.price * it.quantity, 0);

  return (
    <Drawer open={isCartOpen} onOpenChange={(open) => { if (!open) closeCart(); }}>
      <DrawerContent>
        <div className="p-4 flex flex-col h-full">
          <div className="flex items-center justify-between">
            <DrawerHeader>
              <DrawerTitle>Your Cart</DrawerTitle>
            </DrawerHeader>
            <DrawerClose asChild>
              <button className="btn">Close</button>
            </DrawerClose>
          </div>

          <div className="mt-4 space-y-3 overflow-auto">
            {cartItems.length === 0 && <div className="text-center text-muted-foreground">Your cart is empty.</div>}
            {cartItems.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-muted rounded overflow-hidden">
                    {item.products.image_url && <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{item.products.name}</div>
                    <div className="text-sm text-muted-foreground">UGX {item.products.price.toLocaleString()}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <button className="btn btn-sm" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <div className="w-8 text-center">{item.quantity}</div>
                      <button className="btn btn-sm" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                  <button className="btn btn-ghost text-destructive" onClick={() => removeFromCart(item.id)}>
                    <Trash2 />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="text-muted-foreground">Total</div>
              <div className="font-bold">UGX {total.toLocaleString()}</div>
            </div>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => { closeCart(); window.location.href = '/checkout'; }}>Checkout</Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CartDrawer;
