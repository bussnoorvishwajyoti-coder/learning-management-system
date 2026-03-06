import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { registerSchema, loginSchema } from './auth.types';
import { validateBody } from '../../middleware/validateRequest';
import { UnauthorizedError } from '../../utils/errors';

const REFRESH_TOKEN_COOKIE = 'refreshToken';

export class AuthController {
  register = [
    validateBody(registerSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await authService.register(req.body);
        
        res.status(201).json({
          success: true,
          data: result,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  login = [
    validateBody(loginSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { auth, refreshToken } = await authService.login(req.body);
        
        // Set refresh token as HTTP-only cookie
        res.cookie(
          REFRESH_TOKEN_COOKIE,
          refreshToken,
          authService.getRefreshTokenCookieOptions()
        );
        
        res.status(200).json({
          success: true,
          data: auth,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;
      
      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token required');
      }

      const result = await authService.refresh(refreshToken);
      
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      
      // Clear cookie
      res.clearCookie(REFRESH_TOKEN_COOKIE, {
        httpOnly: true,
        secure: authService.getRefreshTokenCookieOptions().secure,
        sameSite: authService.getRefreshTokenCookieOptions().sameSite,
        path: '/',
      });
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        throw new UnauthorizedError('User not authenticated');
      }
      
      await authService.logoutAll(userId);
      
      // Clear cookie
      res.clearCookie(REFRESH_TOKEN_COOKIE, {
        httpOnly: true,
        secure: authService.getRefreshTokenCookieOptions().secure,
        sameSite: authService.getRefreshTokenCookieOptions().sameSite,
        path: '/',
      });
      
      res.status(200).json({
        success: true,
        message: 'Logged out from all devices',
      });
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      
      if (!user) {
        throw new UnauthorizedError('User not authenticated');
      }
      
      res.status(200).json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
