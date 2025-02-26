import axios from 'axios';
import { ElevenLabsClient } from 'elevenlabs';

// Convert technical error messages to user-friendly language
function simplifyErrorMessage(errorMessage) {
  if (typeof errorMessage !== 'string') {
    return 'Unknown error occurred';
  }
  
  const lowerCaseError = errorMessage.toLowerCase();
  
  if (lowerCaseError.includes('format') || lowerCaseError.includes('codec')) {
    return 'The audio format is not supported. Try converting to MP3 or WAV';
  }
  
  if (lowerCaseError.includes('timeout') || lowerCaseError.includes('timed out')) {
    return 'The request took too long. Try with a shorter audio file';
  }
  
  if (lowerCaseError.includes('permission') || lowerCaseError.includes('access')) {
    return 'Permission denied. Check your account permissions';
  }
  
  if (lowerCaseError.includes('server') || lowerCaseError.includes('503') || lowerCaseError.includes('502')) {
    return 'Server is temporarily unavailable. Please try again later';
  }
  
  if (lowerCaseError.includes('network') || lowerCaseError.includes('connection')) {
    return 'Network connection issue. Check your internet connection';
  }
  
  // If we can't categorize it, provide a slightly simplified version
  return errorMessage.replace(/^\w+Error:\s*/i, '').replace(/^Error:\s*/i, '');
}

// Function to handle audio/video files and extract audio if needed
export const processMediaFile = async (file) => {
  // If it's already an audio file, return it directly
  if (file.type.startsWith('audio/')) {
    console.log('Processing audio file directly:', file.type);
    return file;
  }
  
  // For video files, extract audio
  console.log('Extracting audio from video file:', file.type);
  try {
    // For most video files, we'll convert to audio
    // Create a temporary URL for the video file
    const videoURL = URL.createObjectURL(file);
    
    return new Promise((resolve, reject) => {
      console.log('Starting audio extraction from video...');
      const video = document.createElement('video');
      video.src = videoURL;
      video.crossOrigin = 'anonymous'; // Handle CORS issues
      
      video.onloadedmetadata = async () => {
        try {
          console.log('Video metadata loaded, duration:', video.duration);
          
          // Create audio context
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const mediaStreamDest = audioContext.createMediaStreamDestination();
          
          // Play video to create media source (muted to avoid feedback)
          video.muted = true;
          await video.play().catch(e => console.error('Video play error:', e));
          console.log('Video playback started for extraction');
          
          // Create media element source and connect to destination
          const source = audioContext.createMediaElementSource(video);
          source.connect(mediaStreamDest);
          source.connect(audioContext.destination); // Connect to context destination to avoid silence
          
          // Create MediaRecorder to capture audio
          const mediaRecorder = new MediaRecorder(mediaStreamDest.stream);
          const chunks = [];
          
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };
          
          mediaRecorder.onstop = () => {
            console.log('Media recorder stopped, processing chunks...');
            const blob = new Blob(chunks, { type: 'audio/wav' });
            const audioFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".wav"), { 
              type: 'audio/wav'
            });
            
            // Clean up
            video.pause();
            URL.revokeObjectURL(videoURL);
            console.log('Audio extraction complete, created file:', audioFile.name, audioFile.type);
            
            resolve(audioFile);
          };
          
          // Start recording
          console.log('Starting media recorder...');
          mediaRecorder.start();
          
          // Record for a short duration to capture enough audio
          const recordingDuration = Math.min(video.duration * 1000, 60 * 1000); // Max 1 minute
          setTimeout(() => {
            if (mediaRecorder.state === 'recording') {
              console.log('Stopping media recorder after', recordingDuration, 'ms');
              mediaRecorder.stop();
            }
          }, recordingDuration);
        } catch (error) {
          console.error('Error during audio extraction:', error);
          reject(error);
        }
      };
      
      video.onerror = (e) => {
        console.error('Video loading error:', e);
        URL.revokeObjectURL(videoURL);
        reject(new Error('Failed to load video file: ' + e.message));
      };
    });
  } catch (error) {
    console.error('Error processing media file:', error);
    throw new Error('Failed to process the media file. Try converting it to MP3 format first.');
  }
};

// Function to send audio to ElevenLabs API for transcription
export const transcribeAudio = async (audioFile, apiKey) => {
  try {
    // Initialize the ElevenLabs client with the API key
    const client = new ElevenLabsClient({
      apiKey: apiKey
    });

    console.log('Sending audio to ElevenLabs using SDK:', {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      fileType: audioFile.type
    });

    // Use the official SDK method for transcription with exact params from documentation
    console.log('Sending transcription request with settings:', {
      file: audioFile.name,
      model_id: 'scribe_v1',  // Using supported model from docs
      tag_audio_events: true,
      language_code: 'eng',
      diarize: true
    });
    
    const transcription = await client.speechToText.convert({
      file: audioFile,
      model_id: 'scribe_v1',  // Only 'scribe_v1' and 'scribe_v1_base' are supported
      tag_audio_events: true, 
      language_code: 'eng',   // Using 'eng' as shown in documentation
      diarize: true           // Enable speaker diarization
    });

    console.log('Transcription response:', transcription);
    return processTranscriptionResponse(transcription);
  } catch (error) {
    console.error('Transcription error:', error);
    
    // Handle specific SDK errors with friendly messages
    if (error.status === 401 || error.message?.includes('authentication')) {
      throw new Error('Your API key appears to be invalid. Please check the key in Settings and try again.');
    } else if (error.status === 413 || error.message?.includes('too large')) {
      throw new Error('The file you uploaded is too large. Please try a smaller file (under 30MB) or trim your audio.');
    } else if (error.status === 429 || error.message?.includes('rate limit')) {
      throw new Error('You have exceeded your usage limits. Please try again later or check your account quota.');
    } else if (error.message && error.message.includes('format')) {
      throw new Error('This file format is not supported. Please try converting to MP3, WAV, or M4A format.');
    } else if (error.message) {
      // Include full technical details for debugging
      let errorMessage = error.message;
      if (error.response?.data) {
        errorMessage += ` Status code: ${error.response.status} Body: ${JSON.stringify(error.response.data)}`;
      }
      throw new Error(`Transcription failed: ${errorMessage}`);
    } else {
      throw new Error('Something went wrong with the transcription. Please try again with a different file.');
    }
  }
};

// Process the response from ElevenLabs API to format it for display
function processTranscriptionResponse(data) {
  console.log('Processing transcription response:', data);
  
  // For debugging diarization
  if (data.words && data.words.length > 0) {
    const speakerCounts = {};
    data.words.forEach(word => {
      if (word.speaker_id) {
        speakerCounts[word.speaker_id] = (speakerCounts[word.speaker_id] || 0) + 1;
      }
    });
    console.log('Speaker distribution in words:', speakerCounts);
  }
  
  // If we have word-level data with timing information
  if (data.words && Array.isArray(data.words) && data.words.length > 0) {
    // Filter out non-word entries (like spacing)
    const actualWords = data.words.filter(word => word.type === 'word' || !word.type);
    
    // Group consecutive words by the same speaker
    const segments = [];
    let currentSegment = null;
    
    for (let i = 0; i < actualWords.length; i++) {
      const word = actualWords[i];
      const speaker = word.speaker_id || word.speaker || 'Unknown';
      
      // Add timing information to each word
      const wordWithTiming = {
        text: word.text,
        start: word.start,
        end: word.end
      };
      
      if (!currentSegment || currentSegment.speaker !== speaker) {
        // Start a new segment for a new speaker
        if (currentSegment) {
          segments.push(currentSegment);
        }
        
        currentSegment = {
          speaker: speaker,
          words: [wordWithTiming],
          text: word.text,
          start: word.start,
          end: word.end
        };
      } else {
        // Add to the current segment
        currentSegment.words.push(wordWithTiming);
        currentSegment.text += ' ' + word.text;
        currentSegment.end = word.end; // Update the end time of the segment
      }
    }
    
    // Add the last segment
    if (currentSegment) {
      segments.push(currentSegment);
    }
    
    return segments;
  }
  
  // If we have utterances with timing information
  if (data.utterances && Array.isArray(data.utterances)) {
    return data.utterances.map(utterance => ({
      speaker: utterance.speaker || 'Unknown',
      text: utterance.text || '',
      start: utterance.start,
      end: utterance.end,
      words: utterance.words || []
    }));
  }
  
  // If we just have plain text without timing, create a simple segment
  if (data.text) {
    return [{
      speaker: undefined,
      text: data.text,
      words: [{ text: data.text, start: 0, end: 0 }]
    }];
  }
  
  return [];
}