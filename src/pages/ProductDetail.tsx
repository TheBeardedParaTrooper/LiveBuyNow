import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import headphonesImg from '@/assets/headphones.jpg';
import smartTvImg from '@/assets/smart-tv.jpg';
import wirelessMouseImg from '@/assets/wireless-mouse.jpg';
import cleaningKitImg from '@/assets/cleaning-kit.jpg';
import coffeeBeansImg from '@/assets/coffee-beans.jpg';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  stock_quantity: number;
  specifications: any;
}

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        setLoading(false);
        return;
      }

      if (!data) {
        console.log('No product found with slug:', slug);
        setLoading(false);
        return;
      }

      const imageMap: Record<string, string> = {
        'premium-wireless-headphones': headphonesImg,
        'smart-led-tv-43': smartTvImg,
        'wireless-mouse': wirelessMouseImg,
        'household-cleaning-kit': cleaningKitImg,
        'premium-coffee-beans-1kg': coffeeBeansImg,
      };

      setProduct({
        ...data,
        image_url: imageMap[data.slug] || data.image_url || '',
      });
    } catch (err) {
      console.error('Error in fetchProduct:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Button>
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

        <div className="grid md:grid-cols-2 gap-12">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              {product.stock_quantity > 0 ? (
                <Badge variant="outline" className="text-success">
                  In Stock ({product.stock_quantity} available)
                </Badge>
              ) : (
                <Badge variant="destructive">Out of Stock</Badge>
              )}
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-foreground">
                TZS {product.price.toLocaleString()}
              </span>
            </div>

            {product.description && (
              <p className="text-muted-foreground text-lg">{product.description}</p>
            )}

            {product.specifications && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Specifications</h3>
                <ul className="space-y-1 text-muted-foreground">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <li key={key} className="flex gap-2">
                      <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                      <span>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className="font-medium">Quantity</label>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-sm"
                    onClick={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                  >-</button>
                  <span className="w-8 text-center">{selectedQuantity}</span>
                  <button
                    className="btn btn-sm"
                    onClick={() => setSelectedQuantity(Math.min(product.stock_quantity || 9999, selectedQuantity + 1))}
                    disabled={selectedQuantity >= (product.stock_quantity || 0)}
                  >+</button>
                </div>
                <span className="text-sm text-muted-foreground ml-4">{product.stock_quantity} available</span>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={() => addToCart(product.id, selectedQuantity)}
                disabled={product.stock_quantity === 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.stock_quantity === 0 ? 'Out of Stock' : 'View Quotation'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
