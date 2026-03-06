import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { progressService } from './progress.service';
import { validateParams, validateBody } from '../../middleware/validateRequest';
import { authenticate } from '../../middleware/auth';

const subjectIdSchema = z.object({
  subjectId: z.string().regex(/^\d+$/, 'Subject ID must be a number').transform(Number),
});

const videoIdSchema = z.object({
  videoId: z.string().regex(/^\d+$/, 'Video ID must be a number').transform(Number),
});

const upsertProgressSchema = z.object({
  lastPositionSeconds: z.number().int().min(0, 'Position must be non-negative'),
  isCompleted: z.boolean().optional(),
});

export class ProgressController {
  getSubjectProgress = [
    authenticate,
    validateParams(subjectIdSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const subjectId = Number(req.params.subjectId);
        const userId = req.user!.id;
        
        const progress = await progressService.getSubjectProgress(userId, subjectId);
        const summary = await progressService.getSubjectSummary(userId, subjectId);
        
        res.status(200).json({
          success: true,
          data: {
            progress,
            summary,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getVideoProgress = [
    authenticate,
    validateParams(videoIdSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const videoId = Number(req.params.videoId);
        const userId = req.user!.id;
        
        const progress = await progressService.getProgress(userId, videoId);
        
        res.status(200).json({
          success: true,
          data: progress,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  upsertVideoProgress = [
    authenticate,
    validateParams(videoIdSchema),
    validateBody(upsertProgressSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const videoId = Number(req.params.videoId);
        const userId = req.user!.id;
        const { lastPositionSeconds, isCompleted } = req.body;
        
        const progress = await progressService.upsertProgress({
          userId,
          videoId,
          lastPositionSeconds,
          isCompleted,
        });
        
        res.status(200).json({
          success: true,
          data: progress,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  markCompleted = [
    authenticate,
    validateParams(videoIdSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const videoId = Number(req.params.videoId);
        const userId = req.user!.id;
        
        const progress = await progressService.markCompleted(userId, videoId);
        
        res.status(200).json({
          success: true,
          data: progress,
        });
      } catch (error) {
        next(error);
      }
    },
  ];
}

export const progressController = new ProgressController();
