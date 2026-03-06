import apiClient from './apiClient';
import { VideoWithProgress, VideoProgress } from './subjects';

export interface VideoNavigation {
  prev_video_id: number | null;
  next_video_id: number | null;
  is_locked: boolean;
}

export interface VideoDetail extends VideoWithProgress {
  navigation: VideoNavigation;
}

export const videosApi = {
  getById: async (id: number): Promise<VideoDetail> => {
    const response = await apiClient.get(`/videos/${id}`);
    return response.data.data;
  },

  getNavigation: async (id: number): Promise<VideoNavigation> => {
    const response = await apiClient.get(`/videos/${id}/navigation`);
    return response.data.data;
  },

  checkLock: async (id: number): Promise<{ isLocked: boolean }> => {
    const response = await apiClient.get(`/videos/${id}/lock`);
    return response.data.data;
  },

  getProgress: async (id: number): Promise<VideoProgress | null> => {
    const response = await apiClient.get(`/progress/videos/${id}`);
    return response.data.data;
  },

  updateProgress: async (id: number, lastPositionSeconds: number, isCompleted?: boolean): Promise<VideoProgress> => {
    const response = await apiClient.post(`/progress/videos/${id}`, {
      lastPositionSeconds,
      isCompleted,
    });
    return response.data.data;
  },

  markCompleted: async (id: number): Promise<VideoProgress> => {
    const response = await apiClient.post(`/progress/videos/${id}/complete`);
    return response.data.data;
  },
};
