import { query } from '../../config/database';
import { Video, Section, VideoProgress } from '../../types';

export class VideosRepository {
  async findById(id: number): Promise<Video | null> {
    const rows = await query<Video[]>(
      'SELECT * FROM videos WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  async findByIdWithSubject(id: number): Promise<(Video & { subject_id: number }) | null> {
    const rows = await query<(Video & { subject_id: number })[]>(
      `SELECT v.*, s.subject_id 
       FROM videos v 
       JOIN sections s ON v.section_id = s.id 
       WHERE v.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  async findSectionsBySubjectId(subjectId: number): Promise<Section[]> {
    return query<Section[]>(
      'SELECT * FROM sections WHERE subject_id = ? ORDER BY order_index ASC',
      [subjectId]
    );
  }

  async findVideosBySubjectId(subjectId: number): Promise<Video[]> {
    return query<Video[]>(
      `SELECT v.* FROM videos v
       JOIN sections s ON v.section_id = s.id
       WHERE s.subject_id = ?
       ORDER BY s.order_index ASC, v.order_index ASC`,
      [subjectId]
    );
  }

  async findProgressByUserAndVideo(userId: number, videoId: number): Promise<VideoProgress | null> {
    const rows = await query<VideoProgress[]>(
      'SELECT * FROM video_progress WHERE user_id = ? AND video_id = ?',
      [userId, videoId]
    );
    return rows[0] || null;
  }

  async findAllProgressByUserAndSubject(userId: number, subjectId: number): Promise<VideoProgress[]> {
    return query<VideoProgress[]>(
      `SELECT vp.* FROM video_progress vp
       JOIN videos v ON vp.video_id = v.id
       JOIN sections s ON v.section_id = s.id
       WHERE vp.user_id = ? AND s.subject_id = ?`,
      [userId, subjectId]
    );
  }
}

export const videosRepository = new VideosRepository();
