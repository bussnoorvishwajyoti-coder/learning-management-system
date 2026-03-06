import { Video, VideoProgress, Section, VideoWithProgress, VideoNavigation } from '../types';

export interface GlobalVideo {
  video: Video;
  sectionOrder: number;
  videoOrder: number;
  globalIndex: number;
}

/**
 * Flattens sections and videos into a globally ordered sequence.
 * Ordering: sections by order_index, videos by order_index within section.
 */
export const buildGlobalSequence = (
  sections: Section[],
  videos: Video[]
): GlobalVideo[] => {
  // Group videos by section
  const videosBySection = new Map<number, Video[]>();
  for (const video of videos) {
    const sectionVideos = videosBySection.get(video.section_id) || [];
    sectionVideos.push(video);
    videosBySection.set(video.section_id, sectionVideos);
  }

  // Sort sections by order_index
  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);

  // Build global sequence
  const globalSequence: GlobalVideo[] = [];
  let globalIndex = 0;

  for (const section of sortedSections) {
    const sectionVideos = videosBySection.get(section.id) || [];
    const sortedVideos = [...sectionVideos].sort((a, b) => a.order_index - b.order_index);

    for (const video of sortedVideos) {
      globalSequence.push({
        video,
        sectionOrder: section.order_index,
        videoOrder: video.order_index,
        globalIndex,
      });
      globalIndex++;
    }
  }

  return globalSequence;
};

/**
 * Finds the previous and next video IDs in the global sequence.
 */
export const findPrevNextVideos = (
  currentVideoId: number,
  globalSequence: GlobalVideo[]
): { prev: number | null; next: number | null } => {
  const currentIndex = globalSequence.findIndex(gv => gv.video.id === currentVideoId);
  
  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  const prev = currentIndex > 0 ? globalSequence[currentIndex - 1].video.id : null;
  const next = currentIndex < globalSequence.length - 1 ? globalSequence[currentIndex + 1].video.id : null;

  return { prev, next };
};

/**
 * Determines if a video is locked based on the completion status of the previous video.
 * First video is always unlocked.
 */
export const isVideoLocked = (
  videoId: number,
  globalSequence: GlobalVideo[],
  progressMap: Map<number, VideoProgress>
): boolean => {
  const currentIndex = globalSequence.findIndex(gv => gv.video.id === videoId);
  
  // First video is always unlocked
  if (currentIndex <= 0) {
    return false;
  }

  // Check if previous video is completed
  const prevVideo = globalSequence[currentIndex - 1].video;
  const prevProgress = progressMap.get(prevVideo.id);
  
  return !prevProgress?.is_completed;
};

/**
 * Enriches videos with progress and lock status.
 */
export const enrichVideosWithProgress = (
  videos: Video[],
  progress: VideoProgress[],
  globalSequence: GlobalVideo[]
): VideoWithProgress[] => {
  const progressMap = new Map(progress.map(p => [p.video_id, p]));

  return videos.map(video => ({
    ...video,
    progress: progressMap.get(video.id) || null,
    is_locked: isVideoLocked(video.id, globalSequence, progressMap),
  }));
};

/**
 * Gets video navigation info (prev/next IDs and lock status).
 */
export const getVideoNavigation = (
  videoId: number,
  sections: Section[],
  videos: Video[],
  progress: VideoProgress[]
): VideoNavigation => {
  const globalSequence = buildGlobalSequence(sections, videos);
  const { prev, next } = findPrevNextVideos(videoId, globalSequence);
  
  const progressMap = new Map(progress.map(p => [p.video_id, p]));
  const isLocked = isVideoLocked(videoId, globalSequence, progressMap);

  return {
    prev_video_id: prev,
    next_video_id: next,
    is_locked: isLocked,
  };
};

/**
 * Validates if a user can access a video (not locked).
 * Throws error if video is locked.
 */
export const validateVideoAccess = (
  videoId: number,
  sections: Section[],
  videos: Video[],
  progress: VideoProgress[]
): void => {
  const globalSequence = buildGlobalSequence(sections, videos);
  const progressMap = new Map(progress.map(p => [p.video_id, p]));
  
  if (isVideoLocked(videoId, globalSequence, progressMap)) {
    throw new Error('Video is locked. Complete the previous video first.');
  }
};
