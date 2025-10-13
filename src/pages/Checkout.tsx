import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    deliveryAddress: '',
    notes: '',
    paymentMethod: 'mobile_money',
  });

  const total = cartItems.reduce(
    (sum, item) => sum + item.products.price * item.quantity,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please sign in to place an order');
      navigate('/auth');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      // Generate order number
      const { data: orderNumberData } = await supabase.rpc(
        'generate_order_number'
      );

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumberData,
          total_amount: total,
          payment_method: formData.paymentMethod,
          phone_number: formData.phoneNumber,
          delivery_address: formData.deliveryAddress,
          notes: formData.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products.name,
        product_price: item.products.price,
        quantity: item.quantity,
        subtotal: item.products.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await clearCart();

      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Delivery Information</h2>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Mobile Money)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+256 700 000 000"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Delivery Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your delivery address"
                    value={formData.deliveryAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deliveryAddress: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions?"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
              </Card>

              <Card className="p-6 space-y-4">
                <h2 className="text-xl font-bold">Payment Method</h2>
                <div className="space-y-2">
                  <Label>Select Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile_money">
                        Mobile Money (MTN/Airtel)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Place Order'
                )}
              </Button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-20">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.products.name} × {item.quantity}
                    </span>
                    <span className="font-semibold">
                      UGX {(item.products.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>UGX {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
