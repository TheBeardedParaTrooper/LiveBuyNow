import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import { Input } from '@/components/ui/input';
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
  const [categories, setCategories] = useState<{id:string;name:string}[]>([]);
  const [filters, setFilters] = useState({ category: '', minPrice: 0, maxPrice: 0, q: '' });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.q) {
        query = query.or(`name.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const imageMap: Record<string, string> = {
        'premium-wireless-headphones': headphonesImg,
        'smart-led-tv-43': smartTvImg,
        'wireless-mouse': wirelessMouseImg,
        'household-cleaning-kit': cleaningKitImg,
        'premium-coffee-beans-1kg': coffeeBeansImg,
      };

      const productsWithImages = (data || []).map((product: any) => ({
        ...product,
        image_url: imageMap[product.slug] || product.image_url,
      }));

      setProducts(productsWithImages);
    } catch (err) {
      console.error('Error fetching products:', err);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.from('categories').select('*');
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories', err);
    }
  };

  const applyFilters = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
    setLoading(true);
    setTimeout(() => fetchProducts(), 0);
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
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Products</h2>
          <div className="flex gap-3 items-center">
            <Input
              aria-label="Search products"
              placeholder="Search..."
              value={filters.q}
              onChange={(e: any) => applyFilters({ q: e.target.value })}
              className="max-w-xs"
            />
            <select
              aria-label="Filter by category"
              value={filters.category}
              onChange={(e) => applyFilters({ category: e.target.value })}
              className="select select-sm"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e: any) => applyFilters({ minPrice: Number(e.target.value || 0) })}
              className="w-20"
            />
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e: any) => applyFilters({ maxPrice: Number(e.target.value || 0) })}
              className="w-20"
            />
          </div>
        </div>
        
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
