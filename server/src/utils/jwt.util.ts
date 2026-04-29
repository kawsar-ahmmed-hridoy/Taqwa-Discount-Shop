import jwt from 'jsonwebtoken';
import { AuthUser } from '../types';

const getJwtSecret = (): string => process.env.JWT_SECRET || 'it\'s hridoy, change in production';
const getJwtExpiry = (): string => process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (user: Omit<AuthUser, 'iat' | 'exp'>): string => {
  return (jwt.sign as any)(user, getJwtSecret(), {
    expiresIn: getJwtExpiry(),
  });
};


export const verifyToken = (token: string): AuthUser | null => {
  try {
    const decoded = (jwt.verify as any)(token, getJwtSecret()) as AuthUser;
    return decoded;
  } catch (error) {
    return null;
  }
};


//Extracting token from Authorization header
export const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  return parts.length === 2 && parts[0] === 'Bearer' ? parts[1] : null;
};


export const decodeToken = (token: string): any => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};
