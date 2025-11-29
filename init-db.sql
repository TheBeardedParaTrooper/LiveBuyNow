-- Create tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    image_url VARCHAR(255),
    category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    status VARCHAR(50) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add sample products
INSERT INTO products (name, description, price, stock_quantity, image_url, category)
VALUES 
    ('Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 99.99, 50, 'https://example.com/headphones.jpg', 'Electronics'),
    ('Smartphone', 'Latest smartphone with advanced features', 699.99, 30, 'https://example.com/smartphone.jpg', 'Electronics'),
    ('Laptop', 'Powerful laptop for work and gaming', 1299.99, 15, 'https://example.com/laptop.jpg', 'Electronics'),
    ('Smart Watch', 'Feature-rich smartwatch with health tracking', 199.99, 40, 'https://example.com/smartwatch.jpg', 'Wearables'),
    ('Bluetooth Speaker', 'Portable speaker with great sound quality', 79.99, 60, 'https://example.com/speaker.jpg', 'Audio');

-- Create a test user (password: test123)
INSERT INTO users (email, password, name, role)
VALUES ('test@example.com', '\\.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Test User', 'user');
