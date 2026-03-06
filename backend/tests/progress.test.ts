import { progressService } from '../src/modules/progress/progress.service';
import { progressRepository } from '../src/modules/progress/progress.repository';
import { videosRepository } from '../src/modules/videos/videos.repository';
import { NotFoundError, BadRequestError } from '../src/utils/errors';

// Mock the repositories
jest.mock('../src/modules/progress/progress.repository');
jest.mock('../src/modules/videos/videos.repository');

describe('Progress Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('upsertProgress', () => {
    it('should cap position to video duration', async () => {
      const mockVideo = {
        id: 1,
        duration_seconds: 100,
      };

      (videosRepository.findById as jest.Mock).mockResolvedValue(mockVideo);
      (progressRepository.upsert as jest.Mock).mockResolvedValue({
        id: 1,
        user_id: 1,
        video_id: 1,
        last_position_seconds: 100,
        is_completed: false,
      });

      const result = await progressService.upsertProgress({
        userId: 1,
        videoId: 1,
        lastPositionSeconds: 150, // Exceeds duration
        isCompleted: false,
      });

      expect(progressRepository.upsert).toHaveBeenCalledWith({
        userId: 1,
        videoId: 1,
        lastPositionSeconds: 100, // Should be capped
        isCompleted: false,
      });
    });

    it('should throw NotFoundError when video does not exist', async () => {
      (videosRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        progressService.upsertProgress({
          userId: 1,
          videoId: 999,
          lastPositionSeconds: 50,
          isCompleted: false,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError for negative position', async () => {
      const mockVideo = { id: 1, duration_seconds: 100 };
      (videosRepository.findById as jest.Mock).mockResolvedValue(mockVideo);

      await expect(
        progressService.upsertProgress({
          userId: 1,
          videoId: 1,
          lastPositionSeconds: -10,
          isCompleted: false,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should allow position when no duration is set', async () => {
      const mockVideo = { id: 1, duration_seconds: null };
      (videosRepository.findById as jest.Mock).mockResolvedValue(mockVideo);
      (progressRepository.upsert as jest.Mock).mockResolvedValue({
        id: 1,
        user_id: 1,
        video_id: 1,
        last_position_seconds: 500,
        is_completed: false,
      });

      await progressService.upsertProgress({
        userId: 1,
        videoId: 1,
        lastPositionSeconds: 500,
        isCompleted: false,
      });

      expect(progressRepository.upsert).toHaveBeenCalledWith({
        userId: 1,
        videoId: 1,
        lastPositionSeconds: 500,
        isCompleted: false,
      });
    });
  });

  describe('markCompleted', () => {
    it('should mark video as completed', async () => {
      const mockVideo = { id: 1, duration_seconds: 100 };
      (videosRepository.findById as jest.Mock).mockResolvedValue(mockVideo);
      (progressRepository.markCompleted as jest.Mock).mockResolvedValue({
        id: 1,
        user_id: 1,
        video_id: 1,
        last_position_seconds: 0,
        is_completed: true,
        completed_at: new Date(),
      });

      const result = await progressService.markCompleted(1, 1);

      expect(result.is_completed).toBe(true);
      expect(progressRepository.markCompleted).toHaveBeenCalledWith(1, 1);
    });

    it('should throw NotFoundError when video does not exist', async () => {
      (videosRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(progressService.markCompleted(1, 999)).rejects.toThrow(NotFoundError);
    });
  });
});
