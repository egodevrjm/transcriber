# Transcriber

A simple React web application that allows you to transcribe audio and video files with speaker diarization.

## Features

- Upload audio or video files for transcription
- Extract audio from video files automatically
- Transcribe speech to text with speaker diarization
- Interactive transcript with playback synchronization
- Export to multiple formats (TXT, SRT, VTT, JSON, CSV)

## Technologies Used

- React
- Vite
- Tailwind CSS
- Axios for API calls

## Getting Started

1. Clone this repository
2. Install dependencies
   ```
   npm install
   ```
3. Start the development server
   ```
   npm run dev
   ```
4. Open the application in your browser
5. Enter your ElevenLabs API key in the Settings section
6. Upload an audio or video file to transcribe

## API Key

You'll need an API key to use this application. The app is powered by the ElevenLabs Scribe STT model.

## Notes

- The application stores your API key locally in your browser's localStorage.
- Maximum file size is limited to 100MB.
- For video files, the application extracts the audio track before sending it for transcription.
- The transcription includes speaker diarization to identify different speakers in the audio.

## License

MIT