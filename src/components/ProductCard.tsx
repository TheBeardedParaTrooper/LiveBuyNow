import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  imageUrl?: string;
  stockQuantity: number;
}

const ProductCard = ({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  imageUrl,
  stockQuantity,
}: ProductCardProps) => {
  const { addToCart } = useCart();
  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-card">
      <Link to={`/product/${slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {imageUrl && (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          )}
          {discount > 0 && (
            <Badge className="absolute right-2 top-2 bg-destructive">
              -{discount}%
            </Badge>
          )}
        </div>
      </Link>

      <div className="p-4 space-y-3">
        <Link to={`/product/${slug}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
            {name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground">
            UGX {price.toLocaleString()}
          </span>
          {compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">
              UGX {compareAtPrice.toLocaleString()}
            </span>
          )}
        </div>

        <Button
          className="w-full"
          onClick={() => addToCart(id)}
          disabled={stockQuantity === 0}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </Card>
  );
};

export default ProductCard;
