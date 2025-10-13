import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  order_items: Array<{
    product_name: string;
    quantity: number;
    subtotal: number;
  }>;
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'processing':
        return 'bg-primary';
      case 'cancelled':
        return 'bg-destructive';
      default:
        return 'bg-muted';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shop
        </Button>

        <h1 className="text-3xl font-bold mb-8">My Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              You haven't placed any orders yet
            </p>
            <Button onClick={() => navigate('/')}>Start Shopping</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">
                      Order {order.order_number}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                    <Badge
                      variant={
                        order.payment_status === 'completed'
                          ? 'default'
                          : 'outline'
                      }
                    >
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  {order.order_items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between text-sm border-t pt-2"
                    >
                      <span>
                        {item.product_name} × {item.quantity}
                      </span>
                      <span className="font-semibold">
                        UGX {item.subtotal.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t mt-4 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>UGX {order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
