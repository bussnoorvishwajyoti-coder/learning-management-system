import { ProgressRepository, progressRepository, UpsertProgressInput } from './progress.repository';
import { VideoProgress } from '../../types';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { videosRepository } from '../videos/videos.repository';

export class ProgressService {
  constructor(private repository: ProgressRepository) {}

  async getProgress(userId: number, videoId: number): Promise<VideoProgress | null> {
    return this.repository.findByUserAndVideo(userId, videoId);
  }

  async getSubjectProgress(userId: number, subjectId: number): Promise<VideoProgress[]> {
    return this.repository.findByUserAndSubject(userId, subjectId);
  }

  async upsertProgress(input: UpsertProgressInput): Promise<VideoProgress> {
    const { userId, videoId, lastPositionSeconds, isCompleted } = input;

    // Verify video exists
    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    // Validate position
    if (lastPositionSeconds < 0) {
      throw new BadRequestError('Position cannot be negative');
    }

    // Cap position to duration if available
    let cappedPosition = lastPositionSeconds;
    if (video.duration_seconds && lastPositionSeconds > video.duration_seconds) {
      cappedPosition = video.duration_seconds;
    }

    return this.repository.upsert({
      userId,
      videoId,
      lastPositionSeconds: cappedPosition,
      isCompleted,
    });
  }

  async markCompleted(userId: number, videoId: number): Promise<VideoProgress> {
    // Verify video exists
    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    return this.repository.markCompleted(userId, videoId);
  }

  async getSubjectSummary(userId: number, subjectId: number): Promise<{
    totalVideos: number;
    completedVideos: number;
    progressPercentage: number;
  }> {
    return this.repository.getSubjectProgressSummary(userId, subjectId);
  }
}

export const progressService = new ProgressService(progressRepository);
