import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { videosService } from './videos.service';
import { validateParams } from '../../middleware/validateRequest';
import { authenticate } from '../../middleware/auth';

const videoIdSchema = z.object({
  videoId: z.string().regex(/^\d+$/, 'Video ID must be a number').transform(Number),
});

export class VideosController {
  getById = [
    authenticate,
    validateParams(videoIdSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const videoId = Number(req.params.videoId);
        const userId = req.user!.id;
        
        const video = await videosService.getVideo(videoId, userId);
        
        res.status(200).json({
          success: true,
          data: video,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getNavigation = [
    authenticate,
    validateParams(videoIdSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const videoId = Number(req.params.videoId);
        const userId = req.user!.id;
        
        const navigation = await videosService.getVideoNavigation(videoId, userId);
        
        res.status(200).json({
          success: true,
          data: navigation,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  checkLock = [
    authenticate,
    validateParams(videoIdSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const videoId = Number(req.params.videoId);
        const userId = req.user!.id;
        
        const isLocked = await videosService.checkVideoLock(videoId, userId);
        
        res.status(200).json({
          success: true,
          data: { isLocked },
        });
      } catch (error) {
        next(error);
      }
    },
  ];
}

export const videosController = new VideosController();
