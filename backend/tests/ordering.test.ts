import {
  buildGlobalSequence,
  findPrevNextVideos,
  isVideoLocked,
  enrichVideosWithProgress,
  getVideoNavigation,
} from '../src/utils/ordering';
import { Video, Section, VideoProgress } from '../src/types';

describe('Ordering Logic', () => {
  const mockSections: Section[] = [
    { id: 1, subject_id: 1, title: 'Section 1', order_index: 1, created_at: new Date(), updated_at: new Date() },
    { id: 2, subject_id: 1, title: 'Section 2', order_index: 2, created_at: new Date(), updated_at: new Date() },
  ];

  const mockVideos: Video[] = [
    { id: 1, section_id: 1, title: 'Video 1', description: null, youtube_url: 'url1', order_index: 1, duration_seconds: 100, created_at: new Date(), updated_at: new Date() },
    { id: 2, section_id: 1, title: 'Video 2', description: null, youtube_url: 'url2', order_index: 2, duration_seconds: 100, created_at: new Date(), updated_at: new Date() },
    { id: 3, section_id: 2, title: 'Video 3', description: null, youtube_url: 'url3', order_index: 1, duration_seconds: 100, created_at: new Date(), updated_at: new Date() },
    { id: 4, section_id: 2, title: 'Video 4', description: null, youtube_url: 'url4', order_index: 2, duration_seconds: 100, created_at: new Date(), updated_at: new Date() },
  ];

  describe('buildGlobalSequence', () => {
    it('should create correct global ordering', () => {
      const sequence = buildGlobalSequence(mockSections, mockVideos);
      
      expect(sequence).toHaveLength(4);
      expect(sequence[0].video.id).toBe(1); // Section 1, Video 1
      expect(sequence[1].video.id).toBe(2); // Section 1, Video 2
      expect(sequence[2].video.id).toBe(3); // Section 2, Video 1
      expect(sequence[3].video.id).toBe(4); // Section 2, Video 2
    });

    it('should handle empty sections', () => {
      const sequence = buildGlobalSequence([], []);
      expect(sequence).toHaveLength(0);
    });

    it('should handle sections with no videos', () => {
      const sections = [{ ...mockSections[0] }];
      const sequence = buildGlobalSequence(sections, []);
      expect(sequence).toHaveLength(0);
    });
  });

  describe('findPrevNextVideos', () => {
    const sequence = buildGlobalSequence(mockSections, mockVideos);

    it('should find previous and next videos correctly', () => {
      const result = findPrevNextVideos(2, sequence);
      
      expect(result.prev).toBe(1);
      expect(result.next).toBe(3);
    });

    it('should return null for prev when first video', () => {
      const result = findPrevNextVideos(1, sequence);
      
      expect(result.prev).toBeNull();
      expect(result.next).toBe(2);
    });

    it('should return null for next when last video', () => {
      const result = findPrevNextVideos(4, sequence);
      
      expect(result.prev).toBe(3);
      expect(result.next).toBeNull();
    });

    it('should return null for both when video not found', () => {
      const result = findPrevNextVideos(999, sequence);
      
      expect(result.prev).toBeNull();
      expect(result.next).toBeNull();
    });
  });

  describe('isVideoLocked', () => {
    const sequence = buildGlobalSequence(mockSections, mockVideos);

    it('should return false for first video', () => {
      const progressMap = new Map<number, VideoProgress>();
      const isLocked = isVideoLocked(1, sequence, progressMap);
      
      expect(isLocked).toBe(false);
    });

    it('should return true when previous video not completed', () => {
      const progressMap = new Map<number, VideoProgress>();
      progressMap.set(1, {
        id: 1, user_id: 1, video_id: 1, last_position_seconds: 50,
        is_completed: false, completed_at: null, created_at: new Date(), updated_at: new Date()
      });
      
      const isLocked = isVideoLocked(2, sequence, progressMap);
      expect(isLocked).toBe(true);
    });

    it('should return false when previous video is completed', () => {
      const progressMap = new Map<number, VideoProgress>();
      progressMap.set(1, {
        id: 1, user_id: 1, video_id: 1, last_position_seconds: 100,
        is_completed: true, completed_at: new Date(), created_at: new Date(), updated_at: new Date()
      });
      
      const isLocked = isVideoLocked(2, sequence, progressMap);
      expect(isLocked).toBe(false);
    });

    it('should check chain of completions', () => {
      const progressMap = new Map<number, VideoProgress>();
      
      // Video 1 completed, Video 2 not completed
      progressMap.set(1, {
        id: 1, user_id: 1, video_id: 1, last_position_seconds: 100,
        is_completed: true, completed_at: new Date(), created_at: new Date(), updated_at: new Date()
      });
      progressMap.set(2, {
        id: 2, user_id: 1, video_id: 2, last_position_seconds: 50,
        is_completed: false, completed_at: null, created_at: new Date(), updated_at: new Date()
      });
      
      // Video 3 should be locked because Video 2 is not completed
      const isLocked = isVideoLocked(3, sequence, progressMap);
      expect(isLocked).toBe(true);
    });
  });

  describe('enrichVideosWithProgress', () => {
    const sequence = buildGlobalSequence(mockSections, mockVideos);

    it('should enrich videos with progress and lock status', () => {
      const progress: VideoProgress[] = [
        { id: 1, user_id: 1, video_id: 1, last_position_seconds: 100, is_completed: true, completed_at: new Date(), created_at: new Date(), updated_at: new Date() },
      ];

      const enriched = enrichVideosWithProgress(mockVideos, progress, sequence);
      
      expect(enriched[0].is_locked).toBe(false);
      expect(enriched[0].progress?.is_completed).toBe(true);
      expect(enriched[1].is_locked).toBe(false); // Previous (video 1) is completed
      expect(enriched[2].is_locked).toBe(true);  // Previous (video 2) not completed
    });
  });

  describe('getVideoNavigation', () => {
    it('should return navigation with lock status', () => {
      const progress: VideoProgress[] = [
        { id: 1, user_id: 1, video_id: 1, last_position_seconds: 100, is_completed: true, completed_at: new Date(), created_at: new Date(), updated_at: new Date() },
      ];

      const navigation = getVideoNavigation(2, mockSections, mockVideos, progress);
      
      expect(navigation.prev_video_id).toBe(1);
      expect(navigation.next_video_id).toBe(3);
      expect(navigation.is_locked).toBe(false);
    });
  });
});
