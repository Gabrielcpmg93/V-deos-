import React from 'react';

interface VideoPlayerProps {
  src: string;
  thumbnailUrl?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, thumbnailUrl }) => {
  return (
    <div className="relative w-full h-auto aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
      <video
        src={src}
        controls
        poster={thumbnailUrl}
        className="w-full h-full object-contain"
        aria-label="Video player"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;