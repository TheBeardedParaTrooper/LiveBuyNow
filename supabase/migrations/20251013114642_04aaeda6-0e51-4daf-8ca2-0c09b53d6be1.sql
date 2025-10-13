-- Create user profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create categories table
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  TO PUBLIC USING (true);

-- Create products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  compare_at_price decimal(10,2),
  image_url text,
  images text[],
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  specifications jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  TO PUBLIC USING (is_active = true);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cart"
  ON public.cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
  ON public.cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
  ON public.cart_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
  ON public.cart_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  total_amount decimal(10,2) NOT NULL,
  payment_method text NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  phone_number text NOT NULL,
  delivery_address text NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create order_items table
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_price decimal(10,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  subtotal decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_order_number text;
BEGIN
  new_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');
  RETURN new_order_number;
END;
$$;

-- Insert sample categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('Electronics', 'electronics', 'Phones, laptops, tablets, and electronic accessories'),
  ('Consumables', 'consumables', 'Everyday items and household essentials');

-- Insert sample products
INSERT INTO public.products (category_id, name, slug, description, price, compare_at_price, stock_quantity, specifications) 
SELECT 
  c.id,
  'Premium Wireless Headphones',
  'premium-wireless-headphones',
  'High-quality wireless headphones with noise cancellation and 30-hour battery life',
  15000.00,
  18000.00,
  50,
  '{"battery": "30 hours", "connectivity": "Bluetooth 5.0", "features": ["Noise Cancellation", "Built-in Mic", "Foldable"]}'::jsonb
FROM public.categories c WHERE c.slug = 'electronics'
UNION ALL
SELECT 
  c.id,
  'Smart LED TV 43"',
  'smart-led-tv-43',
  'Full HD Smart TV with built-in streaming apps and HDR support',
  45000.00,
  50000.00,
  25,
  '{"screen_size": "43 inches", "resolution": "1080p Full HD", "features": ["Smart TV", "HDR", "Built-in WiFi"]}'::jsonb
FROM public.categories c WHERE c.slug = 'electronics'
UNION ALL
SELECT 
  c.id,
  'Wireless Mouse',
  'wireless-mouse',
  'Ergonomic wireless mouse with precision tracking',
  2500.00,
  3000.00,
  100,
  '{"connectivity": "2.4GHz Wireless", "battery": "12 months", "features": ["Ergonomic Design", "6 Buttons"]}'::jsonb
FROM public.categories c WHERE c.slug = 'electronics'
UNION ALL
SELECT 
  c.id,
  'Household Cleaning Kit',
  'household-cleaning-kit',
  'Complete cleaning kit with detergents, brushes, and cloths',
  3500.00,
  NULL,
  200,
  '{"items": ["Detergent", "Brushes", "Microfiber Cloths", "Sponges"]}'::jsonb
FROM public.categories c WHERE c.slug = 'consumables'
UNION ALL
SELECT 
  c.id,
  'Premium Coffee Beans 1kg',
  'premium-coffee-beans-1kg',
  'Freshly roasted Arabica coffee beans with rich flavor',
  4500.00,
  NULL,
  150,
  '{"origin": "Ethiopia", "roast": "Medium", "weight": "1kg"}'::jsonb
FROM public.categories c WHERE c.slug = 'consumables';

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();