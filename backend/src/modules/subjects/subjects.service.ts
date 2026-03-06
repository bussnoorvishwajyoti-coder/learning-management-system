import { SubjectsRepository, subjectsRepository } from './subjects.repository';
import { Subject, SubjectTree, VideoWithProgress, SectionWithVideos } from '../../types';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { buildGlobalSequence, enrichVideosWithProgress } from '../../utils/ordering';

export class SubjectsService {
  constructor(private repository: SubjectsRepository) {}

  async getAllSubjects(): Promise<Subject[]> {
    return this.repository.findAll();
  }

  async getSubjectById(id: number): Promise<Subject> {
    const subject = await this.repository.findById(id);
    if (!subject) {
      throw new NotFoundError('Subject not found');
    }
    return subject;
  }

  async getSubjectTree(subjectId: number, userId?: number): Promise<SubjectTree> {
    const tree = await this.repository.getSubjectTree(subjectId, userId);
    if (!tree) {
      throw new NotFoundError('Subject not found');
    }

    // If user is authenticated, enrich with progress and lock status
    if (userId) {
      const allVideos = tree.sections.flatMap(s => s.videos);
      const allProgress = await this.repository.findProgressByUserAndVideos(
        userId,
        allVideos.map(v => v.id)
      );

      const globalSequence = buildGlobalSequence(tree.sections, allVideos);

      // Enrich each section's videos
      tree.sections = tree.sections.map(section => ({
        ...section,
        videos: enrichVideosWithProgress(section.videos, allProgress, globalSequence),
      }));
    }

    return tree;
  }

  async getFirstVideoId(subjectId: number): Promise<number | null> {
    const tree = await this.repository.getSubjectTree(subjectId);
    if (!tree || tree.sections.length === 0) return null;

    // Sort sections by order_index
    const sortedSections = [...tree.sections].sort((a, b) => a.order_index - b.order_index);
    
    for (const section of sortedSections) {
      if (section.videos.length > 0) {
        // Sort videos by order_index
        const sortedVideos = [...section.videos].sort((a, b) => a.order_index - b.order_index);
        return sortedVideos[0].id;
      }
    }

    return null;
  }

  async checkEnrollment(userId: number, subjectId: number): Promise<boolean> {
    return this.repository.isUserEnrolled(userId, subjectId);
  }

  async enroll(userId: number, subjectId: number): Promise<void> {
    // Verify subject exists
    const subject = await this.repository.findById(subjectId);
    if (!subject) {
      throw new NotFoundError('Subject not found');
    }

    await this.repository.enrollUser(userId, subjectId);
  }
}

export const subjectsService = new SubjectsService(subjectsRepository);
