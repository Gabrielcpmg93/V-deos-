import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CreatePostModal from './components/CreatePostModal';
import VideoPlayer from './components/VideoPlayer';
import Button from './components/Button';
import { VideoPost } from './types';
import { VIDEO_PLACEHOLDER_THUMBNAIL } from './constants';

const App: React.FC = () => {
  const [videoPosts, setVideoPosts] = useState<VideoPost[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleCreatePost = async (videoUrl: string, caption: string, thumbnailUrl: string) => {
    setIsLoading(true);
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newPost: VideoPost = {
      id: uuidv4(),
      videoUrl,
      caption,
      thumbnailUrl: thumbnailUrl || VIDEO_PLACEHOLDER_THUMBNAIL,
      createdAt: new Date(),
    };
    setVideoPosts(prevPosts => [newPost, ...prevPosts]);
    setIsLoading(false);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="sticky top-0 z-40 w-full bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Social Video</h1>
          <Button
            onClick={() => setIsModalOpen(true)}
            size="lg"
          >
            Create Post
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        {videoPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] text-gray-600 dark:text-gray-400">
            <svg className="w-24 h-24 mb-6 text-indigo-400 dark:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.552 4.552a1.2 1.2 0 010 1.696-.697.697 0 01-1.696 0L13.5 11.552a1.2 1.2 0 010-1.696l4.552-4.552a.697.697 0 011.696 0 1.2 1.2 0 010 1.696L15 10zm-7 4h.01M7 7h.01M7 10h.01M7 13h.01M7 16h.01M16 18H8a2 2 0 01-2-2V8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2z"></path>
            </svg>
            <p className="text-xl font-medium mb-4">No videos yet!</p>
            <p className="text-lg">Be the first to share a video.</p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="mt-8"
              size="lg"
            >
              Create Your First Post
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videoPosts.map(post => (
              <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <VideoPlayer src={post.videoUrl} thumbnailUrl={post.thumbnailUrl} />
                <div className="p-4">
                  <p className="text-gray-800 dark:text-gray-200 font-medium mb-2">{post.caption}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Posted on {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreatePost={handleCreatePost}
        isLoading={isLoading}
      />

      <footer className="sticky bottom-0 z-40 w-full bg-white dark:bg-gray-800 shadow-t-md p-4 text-center text-gray-600 dark:text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Social Video App. All rights reserved.
      </footer>
    </div>
  );
};

export default App;