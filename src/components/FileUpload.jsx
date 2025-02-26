import { useRef, useState } from 'react';

function FileUpload({ onUpload, isProcessing }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  
  // Define supported formats
  const supportedAudioFormats = ['audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/m4a', 'audio/ogg', 'audio/aac', 'audio/flac'];
  const supportedVideoFormats = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/mpeg'];
  
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const handleFileChange = (e) => {
    setError(null);
    const file = e.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      setError('Please select an audio or video file.');
      return;
    }
    
    // Check if the format is in our list of explicitly supported formats
    const isSupported = [...supportedAudioFormats, ...supportedVideoFormats].some(format => 
      file.type === format || file.type.includes(format.replace('audio/', '').replace('video/', ''))
    );
    
    if (!isSupported) {
      setError('This file format may not be fully supported. For best results, use MP3, WAV, MP4, or MOV files.');
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds the limit (100MB).`);
      return;
    }
    
    setSelectedFile(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFile && !isProcessing && !error) {
      onUpload(selectedFile);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-3">Upload File</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select audio or video file (max 100MB)
          </label>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="audio/*,video/*"
            className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
          />
          
          {error && (
            <p className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
          
          {selectedFile && !error && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={!selectedFile || isProcessing || error}
          className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
            !selectedFile || isProcessing || error
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isProcessing ? 'Processing...' : 'Transcribe'}
        </button>
      </form>
    </div>
  );
}

export default FileUpload;