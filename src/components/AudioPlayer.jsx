import { useState, useRef, useEffect } from 'react';

function AudioPlayer({ audioFile, transcriptData, onTimeUpdate, currentPlayerTime }) {
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const mediaUrlRef = useRef(null);
  const [isVideo, setIsVideo] = useState(false);

  // Create object URL for the media file
  useEffect(() => {
    if (audioFile) {
      // Determine if it's a video file
      setIsVideo(audioFile.type.startsWith('video/'));
      
      // Revoke previous URL to prevent memory leaks
      if (mediaUrlRef.current) {
        URL.revokeObjectURL(mediaUrlRef.current);
      }
      mediaUrlRef.current = URL.createObjectURL(audioFile);
    }

    return () => {
      if (mediaUrlRef.current) {
        URL.revokeObjectURL(mediaUrlRef.current);
      }
    };
  }, [audioFile]);

  // React to external time changes (when clicking on words in transcript)
  useEffect(() => {
    // Determine which media element to use
    const mediaElement = isVideo ? videoRef.current : audioRef.current;
    
    if (mediaElement && mediaElement.readyState >= 2 && 
        currentPlayerTime !== undefined && 
        Math.abs(mediaElement.currentTime - currentPlayerTime) > 0.1) {
      
      // Update media time
      mediaElement.currentTime = currentPlayerTime;
      
      // Start playback
      console.log('Attempting to play media from timestamp:', currentPlayerTime);
      mediaElement.play()
        .then(() => {
          console.log('Media playback started successfully');
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('Error playing media:', error);
        });
    }
  }, [currentPlayerTime, isVideo]);

  // Set up event listeners for the media element
  useEffect(() => {
    // Determine which media element to use
    const mediaElement = isVideo ? videoRef.current : audioRef.current;
    if (!mediaElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(mediaElement.currentTime);
      onTimeUpdate(mediaElement.currentTime);
    };

    const handleDurationChange = () => {
      setDuration(mediaElement.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      mediaElement.currentTime = 0;
    };

    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('durationchange', handleDurationChange);
    mediaElement.addEventListener('play', handlePlay);
    mediaElement.addEventListener('pause', handlePause);
    mediaElement.addEventListener('ended', handleEnded);

    return () => {
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('durationchange', handleDurationChange);
      mediaElement.removeEventListener('play', handlePlay);
      mediaElement.removeEventListener('pause', handlePause);
      mediaElement.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate, isVideo]);

  // Toggle play/pause
  const togglePlay = () => {
    const mediaElement = isVideo ? videoRef.current : audioRef.current;
    if (mediaElement.paused) {
      mediaElement.play();
    } else {
      mediaElement.pause();
    }
  };

  // Handle seeking
  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    const mediaElement = isVideo ? videoRef.current : audioRef.current;
    if (mediaElement) {
      mediaElement.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  // Format time as mm:ss
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!audioFile) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-3">Media Player</h2>
      
      {isVideo ? (
        <video 
          ref={videoRef} 
          src={mediaUrlRef.current}
          className="w-full mb-3 rounded-md"
          controls={false}
        />
      ) : (
        <audio 
          ref={audioRef} 
          src={mediaUrlRef.current}
          className="hidden" // Hide the default audio element
        />
      )}
      
      <div className="flex items-center mb-3">
        <button
          onClick={togglePlay}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>
        
        <span className="ml-3 text-sm font-medium w-16">{formatTime(currentTime)}</span>
        
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="flex-grow mx-3 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        
        <span className="text-sm font-medium w-16 text-right">{formatTime(duration)}</span>
      </div>
      
      <p className="text-xs text-gray-500 mt-2">
        Click on words in the transcript to jump to that part of the media.
      </p>
    </div>
  );
}

export default AudioPlayer;