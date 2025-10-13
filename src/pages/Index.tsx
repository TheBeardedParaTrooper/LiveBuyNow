import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import heroBanner from '@/assets/hero-banner.jpg';
import headphonesImg from '@/assets/headphones.jpg';
import smartTvImg from '@/assets/smart-tv.jpg';
import wirelessMouseImg from '@/assets/wireless-mouse.jpg';
import cleaningKitImg from '@/assets/cleaning-kit.jpg';
import coffeeBeansImg from '@/assets/coffee-beans.jpg';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  stock_quantity: number;
}

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      // Map generated images to products
      const imageMap: Record<string, string> = {
        'premium-wireless-headphones': headphonesImg,
        'smart-led-tv-43': smartTvImg,
        'wireless-mouse': wirelessMouseImg,
        'household-cleaning-kit': cleaningKitImg,
        'premium-coffee-beans-1kg': coffeeBeansImg,
      };

      const productsWithImages = data.map((product) => ({
        ...product,
        image_url: imageMap[product.slug] || product.image_url,
      }));

      setProducts(productsWithImages);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative h-[500px] overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBanner})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-background/50" />
        </div>
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Shop the Latest
              <span className="block bg-gradient-primary bg-clip-text text-transparent">
                Tech & Essentials
              </span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Quality electronics and consumables delivered right to your door. Pay securely with mobile money.
            </p>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                compareAtPrice={product.compare_at_price || undefined}
                imageUrl={product.image_url || undefined}
                stockQuantity={product.stock_quantity}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
