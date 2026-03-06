import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { User } from '../types';

export interface AccessTokenPayload {
  userId: number;
  email: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: number;
  tokenId: string;
  type: 'refresh';
}

export const generateAccessToken = (user: User): string => {
  const payload: AccessTokenPayload = {
    userId: user.id,
    email: user.email,
    type: 'access',
  };

  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
};

export const generateRefreshToken = (userId: number): { token: string; tokenId: string } => {
  const tokenId = crypto.randomUUID();
  const payload: RefreshTokenPayload = {
    userId,
    tokenId,
    type: 'refresh',
  };

  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'],
  };

  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, options);

  return { token, tokenId };
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const calculateRefreshExpiry = (): Date => {
  const days = parseInt(env.JWT_REFRESH_EXPIRY.replace('d', ''), 10) || 30;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
};
