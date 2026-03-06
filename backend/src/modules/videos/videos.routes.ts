import { Router } from 'express';
import { videosController } from './videos.controller';

const router = Router();

router.get('/:videoId', ...videosController.getById);
router.get('/:videoId/navigation', ...videosController.getNavigation);
router.get('/:videoId/lock', ...videosController.checkLock);

export default router;
