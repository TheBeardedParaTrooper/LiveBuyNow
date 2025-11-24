import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
  stockQuantity: number;
}

const ProductCard = ({
  id,
  name,
  slug,
  price,
  imageUrl,
  stockQuantity,
}: ProductCardProps) => {
  const navigate = useNavigate();
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
            TZS {price.toLocaleString()}
          </span>
        </div>

        <Button
          className="w-full"
          onClick={() => navigate(`/product/${slug}`)}
          disabled={stockQuantity === 0}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {stockQuantity === 0 ? 'Out of Stock' : 'View Quotation'}
        </Button>
      </div>
    </Card>
  );
};

export default ProductCard;
