import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import FileUpload from './components/FileUpload';
import Settings from './components/Settings';
import Transcript from './components/Transcript';
import AudioPlayer from './components/AudioPlayer';
import ExportTranscript from './components/ExportTranscript';
import ErrorDisplay from './components/ErrorDisplay';
import APITester from './components/APITester';
import { processMediaFile, transcribeAudio } from './utils/audioProcessing';

function App() {
  const [apiKey, setApiKey] = useState('');
  const [transcript, setTranscript] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [audioFile, setAudioFile] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);

  // Load API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('elevenLabsApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const handleApiKeySave = (key) => {
    setApiKey(key);
    localStorage.setItem('elevenLabsApiKey', key);
  };

  const handleFileUpload = async (file) => {
    if (!apiKey) {
      setError('Please set your ElevenLabs API key in Settings first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setTranscript(null);
    setAudioFile(null);
    
    try {
      // Process the file to extract audio if it's a video
      const audioFile = await processMediaFile(file);
      
      // Save the audio file for playback
      setAudioFile(audioFile);
      
      // Send the audio to ElevenLabs API
      const result = await transcribeAudio(audioFile, apiKey);
      
      setTranscript(result);
    } catch (err) {
      console.error('Error during transcription:', err);
      setError(`${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  const handleWordClick = (time) => {
    console.log('Word clicked at time:', time);
    // Create a small delay to ensure state updates properly
    setTimeout(() => {
      setCurrentTime(time);
      
      // Try to directly control audio playback if we have a reference
      const audioElement = document.querySelector('audio');
      if (audioElement) {
        audioElement.currentTime = time;
        audioElement.play().catch(err => console.error('Direct play error:', err));
      }
    }, 10);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {!apiKey && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Please enter your API key in the Settings section below to use the transcription service.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Settings apiKey={apiKey} onSave={handleApiKeySave} />
            <FileUpload onUpload={handleFileUpload} isProcessing={isProcessing} />
            {transcript && (
              <ExportTranscript transcript={transcript} />
            )}
            
            <ErrorDisplay error={error} />
            <APITester apiKey={apiKey} />
          </div>
          
          <div>
            {audioFile && transcript && (
              <AudioPlayer 
                audioFile={audioFile} 
                transcriptData={transcript} 
                onTimeUpdate={handleTimeUpdate}
                currentPlayerTime={currentTime} 
              />
            )}
            <Transcript 
              data={transcript} 
              isProcessing={isProcessing} 
              currentTime={currentTime}
              onWordClick={handleWordClick}
            />
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            Powered by the ElevenLabs Scribe STT model. 
            <a href="https://elevenlabs.io/docs" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Learn more</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;