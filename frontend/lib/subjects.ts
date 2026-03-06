import apiClient from './apiClient';

export interface Subject {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: number;
  subject_id: number;
  title: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: number;
  section_id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  order_index: number;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

export interface VideoProgress {
  id: number;
  user_id: number;
  video_id: number;
  last_position_seconds: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoWithProgress extends Video {
  progress?: VideoProgress | null;
  is_locked?: boolean;
}

export interface SectionWithVideos extends Section {
  videos: VideoWithProgress[];
}

export interface SubjectTree extends Subject {
  sections: SectionWithVideos[];
}

export const subjectsApi = {
  getAll: async (): Promise<Subject[]> => {
    const response = await apiClient.get('/subjects');
    return response.data.data;
  },

  getById: async (id: number): Promise<Subject> => {
    const response = await apiClient.get(`/subjects/${id}`);
    return response.data.data;
  },

  getTree: async (id: number): Promise<SubjectTree> => {
    const response = await apiClient.get(`/subjects/${id}/tree`);
    return response.data.data;
  },

  getFirstVideo: async (id: number): Promise<{ videoId: number }> => {
    const response = await apiClient.get(`/subjects/${id}/first-video`);
    return response.data.data;
  },

  checkEnrollment: async (id: number): Promise<{ isEnrolled: boolean }> => {
    const response = await apiClient.get(`/subjects/${id}/enrollment`);
    return response.data.data;
  },

  enroll: async (id: number): Promise<void> => {
    await apiClient.post(`/subjects/${id}/enroll`);
  },
};
