import { pool, query } from '../../config/database';
import { User, RefreshToken } from '../../types';

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const rows = await query<User[]>(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()]
    );
    return rows[0] || null;
  }

  async findUserById(id: number): Promise<User | null> {
    const rows = await query<User[]>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async createUser(email: string, passwordHash: string, name: string): Promise<User> {
    const result = await query<{ insertId: number }>(
      'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
      [email.toLowerCase(), passwordHash, name]
    );

    const user = await this.findUserById(result.insertId);
    if (!user) {
      throw new Error('Failed to create user');
    }
    return user;
  }

  async createRefreshToken(userId: number, tokenHash: string, expiresAt: Date): Promise<void> {
    await query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    const rows = await query<RefreshToken[]>(
      'SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL',
      [tokenHash]
    );
    return rows[0] || null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ?',
      [tokenHash]
    );
  }

  async revokeAllUserRefreshTokens(userId: number): Promise<void> {
    await query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL',
      [userId]
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    await query(
      'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL'
    );
  }
}

export const authRepository = new AuthRepository();
