import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';
import VideoUploader from './VideoUploader';
import { VIDEO_PLACEHOLDER_THUMBNAIL } from '../constants';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (videoUrl: string, caption: string, thumbnailUrl: string) => Promise<void>;
  isLoading: boolean;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onCreatePost,
  isLoading,
}) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(VIDEO_PLACEHOLDER_THUMBNAIL);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleVideoSelected = (url: string, thumb: string) => {
    setVideoUrl(url);
    setThumbnailUrl(thumb);
  };

  const handleClearVideo = () => {
    setVideoUrl(null);
    setThumbnailUrl(VIDEO_PLACEHOLDER_THUMBNAIL);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (videoUrl && caption.trim()) {
      await onCreatePost(videoUrl, caption.trim(), thumbnailUrl);
      // Reset form after successful post
      setVideoUrl(null);
      setCaption('');
      setThumbnailUrl(VIDEO_PLACEHOLDER_THUMBNAIL);
      onClose();
    }
  };

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4 overflow-y-auto">
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-post-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>

        <h2 id="create-post-title" className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">
          Create New Video Post
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-6">
          <VideoUploader
            onVideoSelected={handleVideoSelected}
            onClearVideo={handleClearVideo}
            selectedVideoUrl={videoUrl}
            isSubmitting={isLoading}
          />

          <label htmlFor="caption" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Caption
          </label>
          <textarea
            id="caption"
            className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
            placeholder="Add a captivating caption for your video..."
            rows={3}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            disabled={isLoading}
            required
          ></textarea>

          <Button
            type="submit"
            className="w-full"
            loading={isLoading}
            disabled={!videoUrl || !caption.trim() || isLoading}
            size="lg"
          >
            Post Video
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;