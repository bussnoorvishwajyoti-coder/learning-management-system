'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import YouTube from 'react-youtube';
import { useAuthStore } from '@/store/authStore';
import { videosApi, VideoDetail } from '@/lib/videos';
import { subjectsApi, SubjectTree } from '@/lib/subjects';
import { ChevronLeft, ChevronRight, Lock, CheckCircle, Play } from 'lucide-react';

export default function VideoPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [subjectTree, setSubjectTree] = useState<SubjectTree | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [player, setPlayer] = useState<any>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const subjectId = Number(params.subjectId);
  const videoId = Number(params.videoId);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadData = async () => {
      try {
        const [videoData, treeData] = await Promise.all([
          videosApi.getById(videoId),
          subjectsApi.getTree(subjectId)
        ]);
        setVideo(videoData);
        setSubjectTree(treeData);
      } catch (err: any) {
        if (err.response?.status === 403) {
          setError('This video is locked. Please complete the previous video first.');
        } else {
          setError(err.response?.data?.error?.message || 'Failed to load video');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isAuthenticated, videoId, subjectId, router]);

  const extractYouTubeId = (url: string): string => {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : '';
  };

  const onPlayerReady = (event: any) => {
    setPlayer(event.target);
    
    // Seek to last position if available
    if (video?.progress?.last_position_seconds) {
      event.target.seekTo(video.progress.last_position_seconds, true);
    }

    // Start progress tracking
    progressInterval.current = setInterval(async () => {
      const currentTime = event.target.getCurrentTime();
      if (currentTime > 0) {
        try {
          await videosApi.updateProgress(videoId, Math.floor(currentTime));
        } catch (err) {
          console.error('Failed to update progress:', err);
        }
      }
    }, 5000); // Update every 5 seconds
  };

  const onPlayerStateChange = async (event: any) => {
    // YouTube player state: 0 = ended
    if (event.data === 0 && video) {
      // Mark as completed
      try {
        await videosApi.markCompleted(videoId);
        setVideo({ ...video, progress: { ...video.progress!, is_completed: true } });
      } catch (err) {
        console.error('Failed to mark completed:', err);
      }
    }
  };

  const handleNavigate = (nextVideoId: number | null) => {
    if (nextVideoId) {
      router.push(`/subjects/${subjectId}/video/${nextVideoId}`);
    }
  };

  const findCurrentVideoIndex = () => {
    if (!subjectTree) return -1;
    let index = 0;
    for (const section of subjectTree.sections) {
      for (const v of section.videos) {
        if (v.id === videoId) return index;
        index++;
      }
    }
    return -1;
  };

  const getAllVideos = () => {
    if (!subjectTree) return [];
    return subjectTree.sections.flatMap(s => s.videos);
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Video Locked</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href={`/subjects/${subjectId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  if (!video || !subjectTree) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-red-600">Video not found</div>
      </div>
    );
  }

  const allVideos = getAllVideos();
  const currentIndex = findCurrentVideoIndex();
  const prevVideo = currentIndex > 0 ? allVideos[currentIndex - 1] : null;
  const nextVideo = currentIndex < allVideos.length - 1 ? allVideos[currentIndex + 1] : null;

  const youtubeId = extractYouTubeId(video.youtube_url);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/subjects/${subjectId}`}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-white">{subjectTree.title}</h1>
                <p className="text-sm text-gray-400">{video.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-300">{user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Main Video Area */}
        <div className="flex-1">
          {/* Video Player */}
          <div className="aspect-video bg-black">
            {youtubeId && (
              <YouTube
                videoId={youtubeId}
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: {
                    autoplay: 1,
                    rel: 0,
                    modestbranding: 1,
                  },
                }}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
                className="w-full h-full"
              />
            )}
          </div>

          {/* Video Info */}
          <div className="bg-gray-800 border-b border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{video.title}</h2>
                {video.description && (
                  <p className="text-gray-400 mt-2">{video.description}</p>
                )}
              </div>
              {video.progress?.is_completed && (
                <div className="flex items-center text-green-400">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span>Completed</span>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="bg-gray-800 p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleNavigate(prevVideo?.id || null)}
                disabled={!prevVideo}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  prevVideo
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Previous
              </button>

              <button
                onClick={() => handleNavigate(nextVideo?.id || null)}
                disabled={!nextVideo || nextVideo.is_locked}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  nextVideo && !nextVideo.is_locked
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Video List */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto max-h-screen">
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Course Content</h3>
          </div>
          
          <div className="divide-y divide-gray-700">
            {subjectTree.sections.map((section) => (
              <div key={section.id}>
                <div className="px-4 py-3 bg-gray-750">
                  <h4 className="text-sm font-medium text-gray-300">{section.title}</h4>
                </div>
                {section.videos.map((v) => (
                  <Link
                    key={v.id}
                    href={v.is_locked ? '#' : `/subjects/${subjectId}/video/${v.id}`}
                    className={`flex items-center px-4 py-3 transition-colors ${
                      v.id === videoId
                        ? 'bg-blue-900/50 border-l-4 border-blue-500'
                        : v.is_locked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-750 cursor-pointer'
                    }`}
                    onClick={(e) => {
                      if (v.is_locked) e.preventDefault();
                    }}
                  >
                    <div className="flex-shrink-0 w-6">
                      {v.is_locked ? (
                        <Lock className="w-4 h-4 text-gray-500" />
                      ) : v.progress?.is_completed ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Play className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className={`text-sm truncate ${
                        v.id === videoId ? 'text-white font-medium' : 'text-gray-300'
                      }`}>
                        {v.title}
                      </p>
                    </div>
                    {v.id === videoId && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
