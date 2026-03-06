import { create } from 'zustand';
import { VideoDetail, VideoNavigation, videosApi } from '@/lib/videos';
import { SubjectTree } from '@/lib/subjects';

interface VideoState {
  currentVideo: VideoDetail | null;
  subjectTree: SubjectTree | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadVideo: (videoId: number) => Promise<void>;
  loadSubjectTree: (subjectId: number) => Promise<void>;
  updateProgress: (position: number) => Promise<void>;
  markCompleted: () => Promise<void>;
  navigateToVideo: (videoId: number | null) => Promise<boolean>;
}

export const useVideoStore = create<VideoState>()((set, get) => ({
  currentVideo: null,
  subjectTree: null,
  isLoading: false,
  error: null,

  loadVideo: async (videoId: number) => {
    set({ isLoading: true, error: null });
    try {
      const video = await videosApi.getById(videoId);
      set({ currentVideo: video, isLoading: false });
    } catch (error: any) {
      set({
        error: error.response?.data?.error?.message || 'Failed to load video',
        isLoading: false,
      });
      throw error;
    }
  },

  loadSubjectTree: async (subjectId: number) => {
    try {
      const { subjectsApi } = await import('@/lib/subjects');
      const tree = await subjectsApi.getTree(subjectId);
      set({ subjectTree: tree });
    } catch (error: any) {
      set({ error: error.response?.data?.error?.message || 'Failed to load subject' });
    }
  },

  updateProgress: async (position: number) => {
    const { currentVideo } = get();
    if (!currentVideo) return;

    try {
      await videosApi.updateProgress(currentVideo.id, Math.floor(position));
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  },

  markCompleted: async () => {
    const { currentVideo } = get();
    if (!currentVideo) return;

    try {
      await videosApi.markCompleted(currentVideo.id);
      
      // Update local state
      set((state) => ({
        currentVideo: state.currentVideo
          ? {
              ...state.currentVideo,
              progress: {
                ...(state.currentVideo.progress || {
                  id: 0,
                  user_id: 0,
                  video_id: state.currentVideo.id,
                  last_position_seconds: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }),
                is_completed: true,
                completed_at: new Date().toISOString(),
              },
            }
          : null,
      }));
    } catch (error) {
      console.error('Failed to mark completed:', error);
    }
  },

  navigateToVideo: async (videoId: number | null) => {
    if (!videoId) return false;
    
    try {
      await get().loadVideo(videoId);
      return true;
    } catch (error) {
      return false;
    }
  },
}));
