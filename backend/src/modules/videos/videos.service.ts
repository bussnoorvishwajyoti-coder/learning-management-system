import { VideosRepository, videosRepository } from './videos.repository';
import { Video, VideoNavigation, VideoWithProgress, Section } from '../../types';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import {
  buildGlobalSequence,
  getVideoNavigation,
  isVideoLocked,
} from '../../utils/ordering';

export class VideosService {
  constructor(private repository: VideosRepository) {}

  async getVideo(
    videoId: number,
    userId: number
  ): Promise<VideoWithProgress & { navigation: VideoNavigation }> {
    // Get video with subject info
    const video = await this.repository.findByIdWithSubject(videoId);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    // Get all sections and videos for this subject to build ordering
    const sections = await this.repository.findSectionsBySubjectId(video.subject_id);
    const videos = await this.repository.findVideosBySubjectId(video.subject_id);
    const progress = await this.repository.findAllProgressByUserAndSubject(
      userId,
      video.subject_id
    );

    // Check if video is locked
    const globalSequence = buildGlobalSequence(sections, videos);
    const progressMap = new Map(progress.map(p => [p.video_id, p]));
    const isLocked = isVideoLocked(videoId, globalSequence, progressMap);

    if (isLocked) {
      throw new ForbiddenError('Video is locked. Complete the previous video first.');
    }

    // Get navigation (prev/next)
    const navigation = getVideoNavigation(videoId, sections, videos, progress);

    // Get user's progress for this video
    const videoProgress = progress.find(p => p.video_id === videoId) || null;

    const { subject_id, ...videoWithoutSubject } = video;

    return {
      ...videoWithoutSubject,
      progress: videoProgress,
      is_locked: false, // If we got here, it's not locked
      navigation,
    };
  }

  async getVideoNavigation(
    videoId: number,
    userId: number
  ): Promise<VideoNavigation> {
    const video = await this.repository.findByIdWithSubject(videoId);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    const sections = await this.repository.findSectionsBySubjectId(video.subject_id);
    const videos = await this.repository.findVideosBySubjectId(video.subject_id);
    const progress = await this.repository.findAllProgressByUserAndSubject(
      userId,
      video.subject_id
    );

    return getVideoNavigation(videoId, sections, videos, progress);
  }

  async checkVideoLock(videoId: number, userId: number): Promise<boolean> {
    const video = await this.repository.findByIdWithSubject(videoId);
    if (!video) {
      throw new NotFoundError('Video not found');
    }

    const sections = await this.repository.findSectionsBySubjectId(video.subject_id);
    const videos = await this.repository.findVideosBySubjectId(video.subject_id);
    const progress = await this.repository.findAllProgressByUserAndSubject(
      userId,
      video.subject_id
    );

    const globalSequence = buildGlobalSequence(sections, videos);
    const progressMap = new Map(progress.map(p => [p.video_id, p]));

    return isVideoLocked(videoId, globalSequence, progressMap);
  }
}

export const videosService = new VideosService(videosRepository);
