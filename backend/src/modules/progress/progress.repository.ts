import { query, transaction } from '../../config/database';
import { VideoProgress } from '../../types';
import mysql from 'mysql2/promise';

export interface UpsertProgressInput {
  userId: number;
  videoId: number;
  lastPositionSeconds: number;
  isCompleted?: boolean;
}

interface VideoProgressRow extends VideoProgress, mysql.RowDataPacket {}

export class ProgressRepository {
  async findByUserAndVideo(userId: number, videoId: number): Promise<VideoProgress | null> {
    const rows = await query<VideoProgressRow[]>(
      'SELECT * FROM video_progress WHERE user_id = ? AND video_id = ?',
      [userId, videoId]
    );
    return rows[0] || null;
  }

  async findByUserAndSubject(userId: number, subjectId: number): Promise<VideoProgress[]> {
    return query<VideoProgressRow[]>(
      `SELECT vp.* FROM video_progress vp
       JOIN videos v ON vp.video_id = v.id
       JOIN sections s ON v.section_id = s.id
       WHERE vp.user_id = ? AND s.subject_id = ?`,
      [userId, subjectId]
    );
  }

  async upsert(input: UpsertProgressInput): Promise<VideoProgress> {
    const { userId, videoId, lastPositionSeconds, isCompleted } = input;

    return transaction(async (connection) => {
      // Check if progress exists
      const [existingRows] = await connection.execute<VideoProgressRow[]>(
        'SELECT * FROM video_progress WHERE user_id = ? AND video_id = ?',
        [userId, videoId]
      );
      const existing = existingRows[0];

      if (existing) {
        // Update existing progress
        const updates: string[] = ['last_position_seconds = ?'];
        const values: any[] = [lastPositionSeconds];

        if (isCompleted !== undefined) {
          updates.push('is_completed = ?');
          values.push(isCompleted);
          
          if (isCompleted && !existing.completed_at) {
            updates.push('completed_at = NOW()');
          }
        }

        values.push(userId, videoId);

        await connection.execute(
          `UPDATE video_progress SET ${updates.join(', ')} WHERE user_id = ? AND video_id = ?`,
          values
        );
      } else {
        // Insert new progress
        const completedAt = isCompleted ? 'NOW()' : null;
        await connection.execute(
          `INSERT INTO video_progress 
           (user_id, video_id, last_position_seconds, is_completed, completed_at) 
           VALUES (?, ?, ?, ?, ${completedAt})`,
          [userId, videoId, lastPositionSeconds, isCompleted || false]
        );
      }

      // Return updated/created progress
      const [rows] = await connection.execute<VideoProgressRow[]>(
        'SELECT * FROM video_progress WHERE user_id = ? AND video_id = ?',
        [userId, videoId]
      );

      return rows[0];
    });
  }

  async markCompleted(userId: number, videoId: number): Promise<VideoProgress> {
    return this.upsert({
      userId,
      videoId,
      lastPositionSeconds: 0,
      isCompleted: true,
    });
  }

  async getSubjectProgressSummary(userId: number, subjectId: number): Promise<{
    totalVideos: number;
    completedVideos: number;
    progressPercentage: number;
  }> {
    const [result] = await query<{
      totalVideos: number;
      completedVideos: number;
    }[]>(
      `SELECT 
        COUNT(v.id) as totalVideos,
        COUNT(CASE WHEN vp.is_completed = TRUE THEN 1 END) as completedVideos
       FROM videos v
       JOIN sections s ON v.section_id = s.id
       LEFT JOIN video_progress vp ON v.id = vp.video_id AND vp.user_id = ?
       WHERE s.subject_id = ?`,
      [userId, subjectId]
    );

    const totalVideos = result?.totalVideos || 0;
    const completedVideos = result?.completedVideos || 0;
    const progressPercentage = totalVideos > 0 
      ? Math.round((completedVideos / totalVideos) * 100) 
      : 0;

    return {
      totalVideos,
      completedVideos,
      progressPercentage,
    };
  }
}

export const progressRepository = new ProgressRepository();
