'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { subjectsApi, SubjectTree } from '@/lib/subjects';
import { Lock, Play, CheckCircle, Circle } from 'lucide-react';

export default function SubjectPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user } = useAuthStore();
  const [subjectTree, setSubjectTree] = useState<SubjectTree | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const subjectId = Number(params.subjectId);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const loadSubject = async () => {
      try {
        const tree = await subjectsApi.getTree(subjectId);
        setSubjectTree(tree);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: { message?: string } } } };
        setError(error.response?.data?.error?.message || 'Failed to load subject');
      } finally {
        setIsLoading(false);
      }
    };

    loadSubject();
  }, [isAuthenticated, subjectId, router]);

  const getFirstVideoId = () => {
    if (!subjectTree || subjectTree.sections.length === 0) return null;
    const firstSection = subjectTree.sections[0];
    if (firstSection.videos.length === 0) return null;
    return firstSection.videos[0].id;
  };

  const calculateProgress = () => {
    if (!subjectTree) return { completed: 0, total: 0, percentage: 0 };
    
    let total = 0;
    let completed = 0;
    
    subjectTree.sections.forEach(section => {
      section.videos.forEach(video => {
        total++;
        if (video.progress?.is_completed) completed++;
      });
    });
    
    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !subjectTree) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg text-red-600">{error || 'Subject not found'}</div>
      </div>
    );
  }

  const progress = calculateProgress();
  const firstVideoId = getFirstVideoId();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{subjectTree.title}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Welcome, {user?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Course Progress</span>
            <span className="text-sm text-gray-500">{progress.completed} / {progress.total} videos</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{progress.percentage}% Complete</p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {subjectTree.description && (
          <p className="text-gray-600 mb-8 text-lg">{subjectTree.description}</p>
        )}

        {/* Start Learning Button */}
        {firstVideoId && (
          <div className="mb-8">
            <Link
              href={`/subjects/${subjectId}/video/${firstVideoId}`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Play className="w-5 h-5 mr-2" />
              {progress.completed > 0 ? 'Continue Learning' : 'Start Learning'}
            </Link>
          </div>
        )}

        {/* Course Content */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Course Content</h2>
          
          {subjectTree.sections.map((section, sectionIndex) => (
            <div key={section.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* Section Header */}
              <div className="px-6 py-4 bg-gray-50 border-b">
                <div className="flex items-center">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                    {sectionIndex + 1}
                  </span>
                  <h3 className="ml-3 text-lg font-medium text-gray-900">{section.title}</h3>
                  <span className="ml-auto text-sm text-gray-500">
                    {section.videos.length} videos
                  </span>
                </div>
              </div>

              {/* Videos List */}
              <div className="divide-y divide-gray-200">
                {section.videos.map((video, videoIndex) => (
                  <Link
                    key={video.id}
                    href={video.is_locked ? '#' : `/subjects/${subjectId}/video/${video.id}`}
                    className={`flex items-center px-6 py-4 hover:bg-gray-50 transition-colors ${
                      video.is_locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                    }`}
                    onClick={(e) => {
                      if (video.is_locked) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {/* Status Icon */}
                    <div className="flex-shrink-0 w-8">
                      {video.is_locked ? (
                        <Lock className="w-5 h-5 text-gray-400" />
                      ) : video.progress?.is_completed ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="ml-4 flex-1">
                      <p className={`text-sm font-medium ${
                        video.is_locked ? 'text-gray-400' : 'text-gray-900'
                      }`}>
                        {videoIndex + 1}. {video.title}
                      </p>
                      {video.is_locked && (
                        <p className="text-xs text-gray-400 mt-1">
                          Complete previous video to unlock
                        </p>
                      )}
                    </div>

                    {/* Play Icon for unlocked */}
                    {!video.is_locked && !video.progress?.is_completed && (
                      <Play className="w-4 h-4 text-gray-400" />
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
