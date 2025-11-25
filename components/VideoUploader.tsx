import React, { useState, useRef, useEffect, useCallback } from 'react';
import Button from './Button';
import VideoPlayer from './VideoPlayer';
import { generateVideoFromPrompt } from '../services/geminiVideoService';
import { VIDEO_PLACEHOLDER_THUMBNAIL, VIDEO_GENERATION_MESSAGES } from '../constants';
import { AistudioWindow, ApiKeyState } from '../types';

declare const window: AistudioWindow;

interface VideoUploaderProps {
  onVideoSelected: (videoUrl: string, thumbnailUrl: string) => void;
  onClearVideo: () => void;
  selectedVideoUrl: string | null;
  isSubmitting: boolean;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({
  onVideoSelected,
  onClearVideo,
  selectedVideoUrl,
  isSubmitting,
}) => {
  const [generatePrompt, setGeneratePrompt] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationProgressMessage, setGenerationProgressMessage] = useState<string>('');
  const [showApiKeySelectionButton, setShowApiKeySelectionButton] = useState<boolean>(false); // New state for API key button
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentProgressIndex, setCurrentProgressIndex] = useState(0);
  const progressIntervalRef = useRef<number | undefined>(undefined);

  const startProgressAnimation = useCallback(() => {
    setCurrentProgressIndex(0);
    setGenerationProgressMessage(VIDEO_GENERATION_MESSAGES[0]);
    progressIntervalRef.current = window.setInterval(() => {
      setCurrentProgressIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % VIDEO_GENERATION_MESSAGES.length;
        setGenerationProgressMessage(VIDEO_GENERATION_MESSAGES[nextIndex]);
        return nextIndex;
      });
    }, 3000); // Change message every 3 seconds
  }, []);

  const stopProgressAnimation = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = undefined;
    }
  }, []);

  useEffect(() => {
    if (isGenerating) {
      startProgressAnimation();
    } else {
      stopProgressAnimation();
    }
    return () => {
      stopProgressAnimation();
    };
  }, [isGenerating, startProgressAnimation, stopProgressAnimation]);

  const generateThumbnail = useCallback((videoElement: HTMLVideoElement): string => {
    if (!canvasRef.current) return VIDEO_PLACEHOLDER_THUMBNAIL;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return VIDEO_PLACEHOLDER_THUMBNAIL;

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const videoUrl = URL.createObjectURL(file);
      onVideoSelected(videoUrl, VIDEO_PLACEHOLDER_THUMBNAIL); // Set placeholder, generate real thumbnail later
      setGenerationError(null);
      setGeneratePrompt('');
      setShowApiKeySelectionButton(false); // Clear API key button visibility

      // Generate thumbnail after video metadata is loaded
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            const thumbnailUrl = generateThumbnail(videoRef.current);
            onVideoSelected(videoUrl, thumbnailUrl);
          }
        };
        videoRef.current.src = videoUrl; // Load the video to get metadata
      }
    }
  };

  const handleGenerateVideo = async () => {
    if (!generatePrompt.trim()) {
      setGenerationError('Please enter a prompt to generate a video.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setShowApiKeySelectionButton(false); // Hide the button before new attempt
    onClearVideo(); // Clear any previously selected video

    try {
      const result = await generateVideoFromPrompt(generatePrompt, setGenerationProgressMessage);

      if (result.videoUrl) {
        onVideoSelected(result.videoUrl, VIDEO_PLACEHOLDER_THUMBNAIL);
        setGenerationError(null);
      } else {
        setGenerationError(result.error);
        if (result.apiKeyState === ApiKeyState.NOT_SELECTED) {
          setShowApiKeySelectionButton(true);
        }
      }
    } catch (error: any) {
      console.error('Error in video generation process:', error);
      setGenerationError(error.message || 'An unexpected error occurred during video generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenApiKeySelection = async () => {
    if (window.aistudio) {
      try {
        setGenerationError(null);
        setGenerationProgressMessage('Opening API key selection dialog...');
        await window.aistudio.openSelectKey();
        setGenerationProgressMessage('API key dialog opened. Please select your key and click "Generate Video with AI" again.');
        setShowApiKeySelectionButton(false); // Hide the button as dialog is opened
      } catch (e) {
        console.error('Failed to open API key selection dialog:', e);
        setGenerationError('Failed to open API key selection dialog. Please try again or check developer console.');
      }
    } else {
      setGenerationError('AI Studio environment not detected. Cannot open API key selection dialog.');
    }
  };

  const clearSelectedVideo = () => {
    onClearVideo();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setGenerationError(null);
    setGeneratePrompt('');
    setIsGenerating(false);
    setGenerationProgressMessage('');
    setShowApiKeySelectionButton(false); // Clear API key button visibility
  };

  const isDisabled = isGenerating || isSubmitting;

  return (
    <div className="flex flex-col space-y-4">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Upload or Generate Video</h3>

      {selectedVideoUrl && (
        <div className="relative p-4 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          <h4 className="text-lg font-medium mb-2">Video Preview:</h4>
          <VideoPlayer src={selectedVideoUrl} />
          <Button
            variant="secondary"
            onClick={clearSelectedVideo}
            className="mt-4 w-full"
            disabled={isDisabled}
          >
            Clear Video
          </Button>
        </div>
      )}

      {!selectedVideoUrl && !isGenerating && (
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col p-4 border border-dashed border-gray-400 dark:border-gray-600 rounded-lg text-center">
            <label htmlFor="video-upload" className="cursor-pointer text-indigo-600 dark:text-indigo-400 hover:underline">
              Click to upload a video
            </label>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              disabled={isDisabled}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">or drag and drop (Max 100MB)</span>
          </div>

          <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
            <hr className="flex-grow border-t border-gray-300 dark:border-gray-700" />
            <span className="px-2 text-sm">OR</span>
            <hr className="flex-grow border-t border-gray-300 dark:border-gray-700" />
          </div>

          <div className="flex flex-col space-y-2">
            <textarea
              className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
              placeholder="Describe the video you want to generate with AI (e.g., 'A cat playing piano in a cozy cafe')"
              rows={3}
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              disabled={isDisabled}
            ></textarea>
            <Button
              onClick={handleGenerateVideo}
              loading={isGenerating}
              disabled={isDisabled || !generatePrompt.trim()}
              className="w-full"
            >
              Generate Video with AI
            </Button>
            {generationProgressMessage && (
              <p className="text-sm text-center text-indigo-600 dark:text-indigo-400 mt-2">{generationProgressMessage}</p>
            )}
            {generationError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
                Error: {generationError}
                {showApiKeySelectionButton && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleOpenApiKeySelection}
                    className="mt-2 block mx-auto"
                  >
                    Select API Key
                  </Button>
                )}
                <a
                  href="https://ai.google.dev/gemini-api/docs/billing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-indigo-600 dark:text-indigo-400 hover:underline mt-1"
                >
                  Learn more about billing for Veo models.
                </a>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Hidden video and canvas for thumbnail generation */}
      <video ref={videoRef} className="hidden" muted preload="metadata" />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default VideoUploader;