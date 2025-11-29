import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '@/lib/auth';
import { AppDataSource } from '@/lib/db';
import { User } from '@/models/User';

type NextApiRequestWithUser = NextApiRequest & {
  user?: any;
};

export function withAuth(handler: Function) {
  return async (req: NextApiRequestWithUser, res: NextApiResponse) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);

      // Verify user exists
      await AppDataSource.initialize();
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOne({ 
        where: { id: decoded.id },
        select: ['id', 'email', 'name', 'role']
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid token' });
      }

      // Attach user to request
      req.user = user;

      // Call the actual handler
      return handler(req, res, user.id);
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ message: 'Invalid or expired token' });
    } finally {
      await AppDataSource.destroy();
    }
  };
}
