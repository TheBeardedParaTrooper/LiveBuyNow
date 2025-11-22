import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
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
  const guestToken = typeof window !== 'undefined' ? localStorage.getItem('lbn_guest_token') : null;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: '',
    deliveryAddress: '',
    notes: '',
    paymentMethod: 'mobile_money',
  });
  const [provider, setProvider] = useState('tigo_pesa');
  const [instructions, setInstructions] = useState<string | null>(null);
  const [providerTxId, setProviderTxId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!polling || !providerTxId) return;
    let stopped = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/mobile/status?provider_tx_id=${providerTxId}`);
        const d = await res.json();
        if (res.ok && d.payment_status === 'paid') {
          stopped = true;
          setPolling(false);
          setInstructions(null);
          setProviderTxId(null);
          await clearCart();
          toast.success('Payment confirmed. Thank you!');
          navigate('/orders');
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 4000);

    return () => {
      clearInterval(interval);
    };
  }, [polling, providerTxId, clearCart, navigate]);

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
      // If user selected card payment, create a Stripe Checkout session server-side
      if (formData.paymentMethod === 'card') {
        const payload = {
          items: cartItems.map((item) => ({
            product_id: item.product_id,
            name: item.products.name,
            price: item.products.price,
            quantity: item.quantity,
          })),
          user_id: user.id,
          metadata: {
            phone_number: formData.phoneNumber,
            delivery_address: formData.deliveryAddress,
            notes: formData.notes,
          },
        };

        const res = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to create checkout session');

        // Redirect to Stripe Checkout
        window.location.href = data.url;
        return;
      }

      // Create order server-side (mobile money or other non-card flows)
      const payload: any = {
        phone_number: formData.phoneNumber,
        delivery_address: formData.deliveryAddress,
        notes: formData.notes,
        payment_method: formData.paymentMethod,
      };
      if (user) payload.user_id = user.id;
      else payload.guest_token = guestToken;

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create order');

      // If mobile money selected, initiate provider flow and show instructions
      if (formData.paymentMethod === 'mobile_money') {
        const initRes = await fetch('/api/mobile/initiate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: data.order_id, provider, phone_number: formData.phoneNumber }),
        });
        const initData = await initRes.json();
        if (!initRes.ok) throw new Error(initData?.error || 'Failed to initiate mobile payment');

        setInstructions(initData.instructions || null);
        setProviderTxId(initData.provider_tx_id || null);
        setPolling(true);
        toast.success('Mobile-money payment initiated. Follow the instructions to complete payment.');
        return; // keep user on the page while polling
      }

      // Clear cart on success for non-mobile-money flows
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
                      placeholder="+255 7xx xxx xxx"
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
                      <SelectItem value="mobile_money">Mobile Money (Tanzania)</SelectItem>
                      <SelectItem value="card">Pay with Card (Credit/Debit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.paymentMethod === 'mobile_money' && (
                  <div className="mt-4 space-y-2">
                    <Label>Select Mobile Money Provider</Label>
                    <Select value={provider} onValueChange={(v: string) => setProvider(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tigo_pesa">Tigo Pesa</SelectItem>
                        <SelectItem value="airtel_money">Airtel Money</SelectItem>
                        <SelectItem value="vodacom">Vodacom / M-Pesa</SelectItem>
                        <SelectItem value="halo_pesa">HaloPesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {instructions && (
                  <div className="mt-4 p-4 bg-surface rounded-md border">
                    <h3 className="font-semibold">Payment Instructions</h3>
                    <p className="text-sm mt-2">{instructions}</p>
                    <div className="mt-3">
                      <Button
                        onClick={async () => {
                          if (!providerTxId) return;
                          try {
                            const st = await fetch(`/api/mobile/status?provider_tx_id=${providerTxId}`);
                            const d = await st.json();
                            if (st.ok && d.payment_status === 'paid') {
                              // payment confirmed: clear cart and redirect
                              await clearCart();
                              toast.success('Payment confirmed. Thank you!');
                              navigate('/orders');
                            } else {
                              toast('Payment still pending. Please complete the transfer.');
                            }
                          } catch (err) {
                            console.error(err);
                            toast.error('Failed to check payment status');
                          }
                        }}
                      >
                        Check Payment Status
                      </Button>
                    </div>
                  </div>
                )}
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
