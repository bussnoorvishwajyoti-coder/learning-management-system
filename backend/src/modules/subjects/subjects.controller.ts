import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { subjectsService } from './subjects.service';
import { validateParams } from '../../middleware/validateRequest';
import { authenticate, optionalAuth } from '../../middleware/auth';

const subjectIdSchema = z.object({
  subjectId: z.string().regex(/^\d+$/, 'Subject ID must be a number').transform(Number),
});

export class SubjectsController {
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const subjects = await subjectsService.getAllSubjects();
      
      res.status(200).json({
        success: true,
        data: subjects,
      });
    } catch (error) {
      next(error);
    }
  };

  getById = [
    validateParams(subjectIdSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { subjectId } = req.params;
        const subject = await subjectsService.getSubjectById(Number(subjectId));
        
        res.status(200).json({
          success: true,
          data: subject,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getTree = [
    authenticate,
    validateParams(subjectIdSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { subjectId } = req.params;
        const userId = req.user!.id;
        
        const tree = await subjectsService.getSubjectTree(Number(subjectId), userId);
        
        res.status(200).json({
          success: true,
          data: tree,
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  getFirstVideo = [
    authenticate,
    validateParams(subjectIdSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { subjectId } = req.params;
        const firstVideoId = await subjectsService.getFirstVideoId(Number(subjectId));
        
        if (!firstVideoId) {
          res.status(404).json({
            success: false,
            error: { message: 'No videos found in this subject' },
          });
          return;
        }
        
        res.status(200).json({
          success: true,
          data: { videoId: firstVideoId },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  checkEnrollment = [
    authenticate,
    validateParams(subjectIdSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { subjectId } = req.params;
        const userId = req.user!.id;
        
        const isEnrolled = await subjectsService.checkEnrollment(userId, Number(subjectId));
        
        res.status(200).json({
          success: true,
          data: { isEnrolled },
        });
      } catch (error) {
        next(error);
      }
    },
  ];

  enroll = [
    authenticate,
    validateParams(subjectIdSchema),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const { subjectId } = req.params;
        const userId = req.user!.id;
        
        await subjectsService.enroll(userId, Number(subjectId));
        
        res.status(200).json({
          success: true,
          message: 'Enrolled successfully',
        });
      } catch (error) {
        next(error);
      }
    },
  ];
}

export const subjectsController = new SubjectsController();
