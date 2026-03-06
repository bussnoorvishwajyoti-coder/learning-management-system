export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Subject {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Section {
  id: number;
  subject_id: number;
  title: string;
  order_index: number;
  created_at: Date;
  updated_at: Date;
}

export interface Video {
  id: number;
  section_id: number;
  title: string;
  description: string | null;
  youtube_url: string;
  order_index: number;
  duration_seconds: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface Enrollment {
  id: number;
  user_id: number;
  subject_id: number;
  created_at: Date;
}

export interface VideoProgress {
  id: number;
  user_id: number;
  video_id: number;
  last_position_seconds: number;
  is_completed: boolean;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshToken {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

// Extended types for API responses
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

export interface VideoNavigation {
  prev_video_id: number | null;
  next_video_id: number | null;
  is_locked: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}
