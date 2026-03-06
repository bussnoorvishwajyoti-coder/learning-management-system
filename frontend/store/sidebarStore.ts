import { create } from 'zustand';
import { SubjectTree, VideoWithProgress } from '@/lib/subjects';

interface SidebarState {
  isOpen: boolean;
  subjectTree: SubjectTree | null;
  currentVideoId: number | null;
  expandedSections: Set<number>;

  // Actions
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  setSubjectTree: (tree: SubjectTree | null) => void;
  setCurrentVideo: (videoId: number) => void;
  toggleSection: (sectionId: number) => void;
  expandAllSections: () => void;
  collapseAllSections: () => void;
  findNextVideo: () => number | null;
  findPrevVideo: () => number | null;
}

export const useSidebarStore = create<SidebarState>()((set, get) => ({
  isOpen: true,
  subjectTree: null,
  currentVideoId: null,
  expandedSections: new Set(),

  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  openSidebar: () => set({ isOpen: true }),
  closeSidebar: () => set({ isOpen: false }),

  setSubjectTree: (tree) => {
    set({ subjectTree: tree });
    // Auto-expand all sections when tree is loaded
    if (tree) {
      const allSectionIds = new Set(tree.sections.map((s) => s.id));
      set({ expandedSections: allSectionIds });
    }
  },

  setCurrentVideo: (videoId) => set({ currentVideoId: videoId }),

  toggleSection: (sectionId) =>
    set((state) => {
      const newExpanded = new Set(state.expandedSections);
      if (newExpanded.has(sectionId)) {
        newExpanded.delete(sectionId);
      } else {
        newExpanded.add(sectionId);
      }
      return { expandedSections: newExpanded };
    }),

  expandAllSections: () =>
    set((state) => ({
      expandedSections: new Set(state.subjectTree?.sections.map((s) => s.id) || []),
    })),

  collapseAllSections: () => set({ expandedSections: new Set() }),

  findNextVideo: () => {
    const { subjectTree, currentVideoId } = get();
    if (!subjectTree || !currentVideoId) return null;

    // Flatten all videos in order
    const allVideos: VideoWithProgress[] = [];
    subjectTree.sections.forEach((section) => {
      allVideos.push(...section.videos);
    });

    const currentIndex = allVideos.findIndex((v) => v.id === currentVideoId);
    if (currentIndex === -1 || currentIndex >= allVideos.length - 1) return null;

    return allVideos[currentIndex + 1].id;
  },

  findPrevVideo: () => {
    const { subjectTree, currentVideoId } = get();
    if (!subjectTree || !currentVideoId) return null;

    // Flatten all videos in order
    const allVideos: VideoWithProgress[] = [];
    subjectTree.sections.forEach((section) => {
      allVideos.push(...section.videos);
    });

    const currentIndex = allVideos.findIndex((v) => v.id === currentVideoId);
    if (currentIndex <= 0) return null;

    return allVideos[currentIndex - 1].id;
  },
}));
