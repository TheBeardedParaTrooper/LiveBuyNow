import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get('session_id');
    const user_id = params.get('user_id');

    if (!session_id) {
      toast.error('Missing session id');
      navigate('/');
      return;
    }

    const fulfill = async () => {
      try {
        const res = await fetch('/api/fulfill-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id, user_id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to finalize order');
        toast.success('Payment confirmed and order recorded');

        // Fetch order details
        if (data?.order_id) {
          const orderRes = await fetch(`/api/orders?order_id=${data.order_id}`);
          const orderData = await orderRes.json();
          if (orderRes.ok) {
            setOrder(orderData);
          }
        }
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Failed to record order');
      } finally {
        // if order isn't set, leave loading false and let UI handle it
      }
    };

    fulfill();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <Card className="p-8">
          {loading && (
            <div className="text-center">
              <h1 className="text-2xl font-bold">Processing payment...</h1>
              <p className="text-muted-foreground mt-2">Please wait while we confirm your payment and create your order.</p>
            </div>
          )}

          {!loading && order && (
            <div>
              <h1 className="text-2xl font-bold text-center text-success">Payment confirmed</h1>
              <p className="text-center text-muted-foreground mt-2">Order {order.order_number} has been created.</p>

              <div className="mt-6 space-y-4">
                {order.order_items?.map((it: any) => (
                  <div key={it.id || it.product_name} className="flex justify-between">
                    <span>{it.product_name} × {it.quantity}</span>
                    <span>UGX {Number(it.subtotal).toLocaleString()}</span>
                  </div>
                ))}

                <div className="border-t pt-4 flex justify-between font-bold">
                  <span>Total</span>
                  <span>UGX {Number(order.total_amount).toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button onClick={() => navigate('/orders')}>View Your Orders</Button>
              </div>
            </div>
          )}

          {!loading && !order && (
            <div className="text-center">
              <h1 className="text-2xl font-bold">Payment processed</h1>
              <p className="mt-2">We couldn't load the order details, but the payment was processed. Check your orders page.</p>
              <div className="mt-6 text-center">
                <Button onClick={() => navigate('/orders')}>View Orders</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;
