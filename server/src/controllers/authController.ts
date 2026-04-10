import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const SALT_ROUNDS = 10;

const signToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ message: 'An account with that email already exists.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    const token = signToken(user._id.toString());

    res.status(201).json({ token });
  } catch (error) {
    console.error('[register]', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const token = signToken(user._id.toString());

    res.status(200).json({ token });
  } catch (error) {
    console.error('[login]', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};
