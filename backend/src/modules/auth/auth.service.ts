import { AuthRepository, authRepository } from './auth.repository';
import { RegisterInput, LoginInput, AuthResponse } from './auth.types';
import { hashPassword, verifyPassword } from '../../utils/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  calculateRefreshExpiry,
} from '../../utils/jwt';
import { UnauthorizedError, ConflictError, BadRequestError } from '../../utils/errors';
import { env } from '../../config/env';

export class AuthService {
  constructor(private repository: AuthRepository) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await this.repository.findUserByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Create user
    const user = await this.repository.createUser(
      input.email,
      passwordHash,
      input.name
    );

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, tokenId } = generateRefreshToken(user.id);

    // Store refresh token hash
    const tokenHash = hashToken(refreshToken);
    const expiresAt = calculateRefreshExpiry();
    await this.repository.createRefreshToken(user.id, tokenHash, expiresAt);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  async login(input: LoginInput): Promise<{ auth: AuthResponse; refreshToken: string }> {
    // Find user
    const user = await this.repository.findUserByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValid = await verifyPassword(input.password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const { token: refreshToken, tokenId } = generateRefreshToken(user.id);

    // Store refresh token hash
    const tokenHash = hashToken(refreshToken);
    const expiresAt = calculateRefreshExpiry();
    await this.repository.createRefreshToken(user.id, tokenHash, expiresAt);

    const auth: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      expiresIn: 900, // 15 minutes in seconds
    };

    return { auth, refreshToken };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    // Verify token signature
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if token is stored and not revoked
    const tokenHash = hashToken(refreshToken);
    const storedToken = await this.repository.findRefreshToken(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedError('Refresh token revoked or expired');
    }

    // Check expiration
    if (new Date(storedToken.expires_at) < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    // Get user
    const user = await this.repository.findUserById(payload.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      accessToken,
      expiresIn: 900,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await this.repository.revokeRefreshToken(tokenHash);
  }

  async logoutAll(userId: number): Promise<void> {
    await this.repository.revokeAllUserRefreshTokens(userId);
  }

  getRefreshTokenCookieOptions() {
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    return {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAMESITE as 'strict' | 'lax' | 'none',
      maxAge,
      domain: env.COOKIE_DOMAIN,
      path: '/',
    };
  }
}

export const authService = new AuthService(authRepository);
