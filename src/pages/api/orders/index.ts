import { NextApiRequest, NextApiResponse } from 'next';
import { AppDataSource } from '@/lib/db';
import { Order } from '@/models/Order';
import { OrderItem } from '@/models/OrderItem';
import { Cart } from '@/models/Cart';
import { withAuth } from '@/middleware/auth';

async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    await AppDataSource.initialize();
    const orderRepository = AppDataSource.getRepository(Order);
    const cartRepository = AppDataSource.getRepository(Cart);

    if (req.method === 'GET') {
      // Get user's orders
      const orders = await orderRepository.find({
        where: { user: { id: userId } },
        relations: ['items', 'items.product']
      });
      return res.status(200).json(orders);
    }

    if (req.method === 'POST') {
      // Create new order from cart
      const { shippingAddress } = req.body;

      // Get user's cart items
      const cartItems = await cartRepository.find({
        where: { user: { id: userId } },
        relations: ['product']
      });

      if (cartItems.length === 0) {
        return res.status(400).json({ message: 'Cart is empty' });
      }

      // Calculate total
      const total = cartItems.reduce(
        (sum, item) => sum + (item.product.price * item.quantity),
        0
      );

      // Create order
      const order = new Order();
      order.user = { id: userId } as any;
      order.total = total;
      order.status = 'pending';
      order.shippingAddress = shippingAddress;
      order.items = [];

      // Create order items
      for (const cartItem of cartItems) {
        const orderItem = new OrderItem();
        orderItem.product = cartItem.product;
        orderItem.quantity = cartItem.quantity;
        orderItem.price = cartItem.product.price;
        order.items.push(orderItem);
      }

      // Save order
      const savedOrder = await orderRepository.save(order);

      // Clear cart
      await cartRepository.remove(cartItems);

      return res.status(201).json(savedOrder);
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error) {
    console.error('Orders API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await AppDataSource.destroy();
  }
}

export default withAuth(handler);
