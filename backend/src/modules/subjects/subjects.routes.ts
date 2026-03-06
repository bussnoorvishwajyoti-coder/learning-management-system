import { Router } from 'express';
import { subjectsController } from './subjects.controller';

const router = Router();

// Public routes
router.get('/', subjectsController.getAll);
router.get('/:subjectId', ...subjectsController.getById);

// Protected routes
router.get('/:subjectId/tree', ...subjectsController.getTree);
router.get('/:subjectId/first-video', ...subjectsController.getFirstVideo);
router.get('/:subjectId/enrollment', ...subjectsController.checkEnrollment);
router.post('/:subjectId/enroll', ...subjectsController.enroll);

export default router;
