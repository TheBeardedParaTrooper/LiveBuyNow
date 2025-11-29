import { NextApiRequest, NextApiResponse } from 'next';
import { AppDataSource } from '@/lib/db';
import { User } from '@/models/User';
import { hashPassword } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await AppDataSource.initialize();
    const userRepository = AppDataSource.getRepository(User);

    // Check if user exists
    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User();
    user.email = email;
    user.name = name;
    user.password = await hashPassword(password);
    user.role = 'user';

    await userRepository.save(user);
    
    return res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await AppDataSource.destroy();
  }
}
