import { query } from '../../config/database';
import { Subject, Section, Video, VideoProgress, SubjectTree } from '../../types';

export class SubjectsRepository {
  async findAll(): Promise<Subject[]> {
    return query<Subject[]>(
      'SELECT * FROM subjects WHERE is_published = TRUE ORDER BY created_at DESC'
    );
  }

  async findById(id: number): Promise<Subject | null> {
    const rows = await query<Subject[]>(
      'SELECT * FROM subjects WHERE id = ? AND is_published = TRUE',
      [id]
    );
    return rows[0] || null;
  }

  async findBySlug(slug: string): Promise<Subject | null> {
    const rows = await query<Subject[]>(
      'SELECT * FROM subjects WHERE slug = ? AND is_published = TRUE',
      [slug]
    );
    return rows[0] || null;
  }

  async findSectionsBySubjectId(subjectId: number): Promise<Section[]> {
    return query<Section[]>(
      'SELECT * FROM sections WHERE subject_id = ? ORDER BY order_index ASC',
      [subjectId]
    );
  }

  async findVideosBySectionIds(sectionIds: number[]): Promise<Video[]> {
    if (sectionIds.length === 0) return [];
    
    const placeholders = sectionIds.map(() => '?').join(',');
    return query<Video[]>(
      `SELECT * FROM videos WHERE section_id IN (${placeholders}) ORDER BY order_index ASC`,
      sectionIds
    );
  }

  async findProgressByUserAndVideos(userId: number, videoIds: number[]): Promise<VideoProgress[]> {
    if (videoIds.length === 0) return [];
    
    const placeholders = videoIds.map(() => '?').join(',');
    return query<VideoProgress[]>(
      `SELECT * FROM video_progress WHERE user_id = ? AND video_id IN (${placeholders})`,
      [userId, ...videoIds]
    );
  }

  async getSubjectTree(subjectId: number, userId?: number): Promise<SubjectTree | null> {
    // Get subject
    const subject = await this.findById(subjectId);
    if (!subject) return null;

    // Get sections
    const sections = await this.findSectionsBySubjectId(subjectId);
    
    // Get all videos for these sections
    const sectionIds = sections.map(s => s.id);
    const videos = await this.findVideosBySectionIds(sectionIds);

    // Get progress if userId provided
    let progress: VideoProgress[] = [];
    if (userId) {
      const videoIds = videos.map(v => v.id);
      progress = await this.findProgressByUserAndVideos(userId, videoIds);
    }

    // Group videos by section
    const videosBySection = new Map<number, Video[]>();
    for (const video of videos) {
      const sectionVideos = videosBySection.get(video.section_id) || [];
      sectionVideos.push(video);
      videosBySection.set(video.section_id, sectionVideos);
    }

    // Build tree
    const tree: SubjectTree = {
      ...subject,
      sections: sections.map(section => ({
        ...section,
        videos: videosBySection.get(section.id) || [],
      })),
    };

    return tree;
  }

  async isUserEnrolled(userId: number, subjectId: number): Promise<boolean> {
    const rows = await query<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM enrollments WHERE user_id = ? AND subject_id = ?',
      [userId, subjectId]
    );
    return rows[0]?.count > 0;
  }

  async enrollUser(userId: number, subjectId: number): Promise<void> {
    await query(
      'INSERT IGNORE INTO enrollments (user_id, subject_id) VALUES (?, ?)',
      [userId, subjectId]
    );
  }
}

export const subjectsRepository = new SubjectsRepository();
