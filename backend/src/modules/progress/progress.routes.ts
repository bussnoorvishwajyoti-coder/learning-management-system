import { Router } from 'express';
import { progressController } from './progress.controller';

const router = Router();

// Subject progress
router.get('/subjects/:subjectId', ...progressController.getSubjectProgress);

// Video progress
router.get('/videos/:videoId', ...progressController.getVideoProgress);
router.post('/videos/:videoId', ...progressController.upsertVideoProgress);
router.post('/videos/:videoId/complete', ...progressController.markCompleted);

export default router;
