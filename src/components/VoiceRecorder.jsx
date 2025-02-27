import { useState, useRef, useEffect } from 'react';

function VoiceRecorder({ onRecordingComplete, isProcessing }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioStreamRef = useRef(null);
  const visualizationRef = useRef(null);
  const audioContextRef = useRef(null);
  
  const MAX_RECORDING_TIME = 300; // 5 minutes in seconds
  
  // Initialize canvas for audio visualization
  useEffect(() => {
    if (canvasRef.current) {
      canvasContextRef.current = canvasRef.current.getContext('2d');
      
      // Initialize with a blank gray canvas
      const ctx = canvasContextRef.current;
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    
    // Cleanup function
    return () => {
      stopMediaTracks();
      clearInterval(timerRef.current);
      
      // Cancel any ongoing animation frame
      if (visualizationRef.current) {
        cancelAnimationFrame(visualizationRef.current);
      }
      
      // Close audio context if it exists
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(err => console.error('Error closing audio context:', err));
      }
    };
  }, []);
  
  // Update recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => {
          const newTime = prevTime + 1;
          if (newTime >= MAX_RECORDING_TIME) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    
    return () => clearInterval(timerRef.current);
  }, [isRecording]);
  
  // Format time display (MM:SS)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Stop all media tracks to release microphone
  const stopMediaTracks = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    // Cancel any ongoing animation frame
    if (visualizationRef.current) {
      cancelAnimationFrame(visualizationRef.current);
      visualizationRef.current = null;
    }
    
    // Close audio context if it exists
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(err => console.error('Error closing audio context:', err));
      audioContextRef.current = null;
    }
    
    // Clear analyzer
    analyserRef.current = null;
  };
  
  // Start visualization of audio input
  const visualizeAudio = () => {
    if (!analyserRef.current || !canvasContextRef.current) {
      console.log('Missing analyzer or canvas context');
      return;
    }
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    
    // Clear the canvas initially
    canvasContextRef.current.fillStyle = '#f9fafb';
    canvasContextRef.current.fillRect(0, 0, width, height);
    
    const draw = () => {
      if (!analyserRef.current) return;
      
      // Continue the animation loop
      const animationId = requestAnimationFrame(draw);
      
      // Store animation ID for cleanup
      visualizationRef.current = animationId;
      
      // Get frequency data
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Clear the canvas
      canvasContextRef.current.fillStyle = '#f9fafb';
      canvasContextRef.current.fillRect(0, 0, width, height);
      
      // Calculate the width of each bar based on canvas width
      const barWidth = Math.max(2, (width / bufferLength) * 2.5);
      let x = 0;
      
      // Draw each frequency bar
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = Math.max(4, (dataArray[i] / 255) * height);
        
        // Use ElevenLabs-like purple color scheme with varying opacity based on volume
        const opacity = 0.3 + (dataArray[i] / 255) * 0.7;
        canvasContextRef.current.fillStyle = `rgba(91, 33, 182, ${opacity})`;
        
        canvasContextRef.current.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    
    // Start the visualization loop
    draw();
    console.log('Visualization started');
  };
  
  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      setAudioBlob(null);
      setRecordingTime(0);
      audioChunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      audioStreamRef.current = stream;
      
      // Create a new AudioContext
      let audioContext;
      try {
        // Try the standard constructor first
        audioContext = new AudioContext();
      } catch (e) {
        // Fall back to the prefixed version for older browsers
        audioContext = new (window.webkitAudioContext || window.AudioContext)();
      }
      
      // Store the audio context reference
      audioContextRef.current = audioContext;
      console.log('AudioContext created:', audioContext.state);
      
      // Resume the audio context if it's not running (needed for some browsers)
      if (audioContext.state !== 'running') {
        await audioContext.resume();
        console.log('AudioContext resumed to:', audioContext.state);
      }
      
      // Create source and analyzer nodes
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      // Configure the analyzer for better visualization
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -10;
      
      // Connect the source to the analyzer
      source.connect(analyser);
      analyserRef.current = analyser;
      
      console.log('Audio context and analyzer set up');
      
      // Start visualization with a slight delay to ensure everything is initialized
      setTimeout(() => {
        visualizeAudio();
      }, 100);
      
      // Create and configure media recorder
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Create blob from recorded chunks
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stopMediaTracks();
      };
      
      // Start recording
      mediaRecorder.start(100); // Collect data in 100ms chunks
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions and try again.');
      stopMediaTracks();
    }
  };
  
  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // Submit recording for transcription
  const handleSubmit = () => {
    if (audioBlob && !isProcessing) {
      // Create a File object from the Blob
      const file = new File([audioBlob], 'recording.webm', { 
        type: 'audio/webm',
        lastModified: new Date().getTime()
      });
      
      onRecordingComplete(file);
    }
  };
  
  // Reset the recording state
  const handleReset = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };
  
  // Add debug info state
  const [debugInfo, setDebugInfo] = useState({ visible: false, info: {} });
  
  // Toggle debug info visibility
  const toggleDebugInfo = () => {
    // Only collect debug info when toggling to visible
    if (!debugInfo.visible) {
      setDebugInfo({
        visible: true,
        info: {
          audioContext: audioContextRef.current ? audioContextRef.current.state : 'not created',
          analyser: analyserRef.current ? 'created' : 'not created',
          canvasContext: canvasContextRef.current ? 'created' : 'not created',
          visualizationActive: visualizationRef.current ? 'active' : 'inactive',
          mediaRecorder: mediaRecorderRef.current ? mediaRecorderRef.current.state : 'not created',
          browserInfo: navigator.userAgent
        }
      });
    } else {
      setDebugInfo(prev => ({ ...prev, visible: false }));
    }
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-semibold">Record Audio</h2>
        <button 
          onClick={toggleDebugInfo}
          className="text-xs text-gray-500 hover:text-gray-700"
          title="Show/hide debug info"
        >
          {debugInfo.visible ? 'Hide Debug' : 'Debug'}
        </button>
      </div>
      
      {debugInfo.visible && (
        <div className="mb-4 p-2 bg-gray-100 rounded-md text-xs font-mono">
          <h3 className="font-semibold mb-1">Debug Info:</h3>
          <ul>
            {Object.entries(debugInfo.info).map(([key, value]) => (
              <li key={key}>{key}: <span className="text-blue-600">{value}</span></li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex items-center mb-2">
          <canvas
            ref={canvasRef}
            width={500}
            height={80}
            className="w-full h-20 bg-gray-100 rounded-md border border-gray-300"
          />
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            {isRecording && (
              <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
            )}
            <span className="text-sm font-medium">
              {isRecording ? 'Recording...' : audioBlob ? 'Recording complete' : 'Ready to record'}
            </span>
          </div>
          
          <div className="text-sm font-mono">
            {formatTime(recordingTime)}
            {isRecording && recordingTime >= MAX_RECORDING_TIME - 30 && (
              <span className="ml-2 text-red-500">
                {MAX_RECORDING_TIME - recordingTime}s left
              </span>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          {!isRecording && !audioBlob && (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Start Recording
            </button>
          )}
          
          {isRecording && (
            <button
              onClick={stopRecording}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Stop Recording
            </button>
          )}
          
          {audioBlob && !isRecording && (
            <>
              <button
                onClick={handleSubmit}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Transcribe'}
              </button>
              
              <button
                onClick={handleReset}
                disabled={isProcessing}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Note: Audio recording requires microphone permission. Recording will automatically stop after 5 minutes.</p>
      </div>
    </div>
  );
}

export default VoiceRecorder;