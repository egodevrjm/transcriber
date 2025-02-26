# ElevenLabs Transcription App - Updates

## API Changes & Fixes

1. **Fixed API Endpoint**: Updated the Speech-to-Text API endpoint to `https://api.elevenlabs.io/v1/speech-to-text` which is the current endpoint for the ElevenLabs transcription service.

2. **Parameter Format**: Changed the way parameters are sent to the API, using `file` for the audio file and a separate `model_parameters` JSON field containing the configuration options.

3. **Improved Error Handling**:
   - Added specific error messages for common HTTP status codes (401, 404, 413, 429)
   - Better error reporting with more context
   - Added a test button to verify the API key validity

4. **UI Improvements**:
   - Added detailed error display component with troubleshooting tips
   - Format validation for audio/video files
   - Warning for non-standard file formats

## How to Test the API Connection

1. Enter your ElevenLabs API key in the Settings section
2. Click the "Test API Key" button to verify connectivity
3. If successful, you'll see a green confirmation message
4. If unsuccessful, you'll see an error message with details

## Troubleshooting

If you encounter issues with the transcription service:

1. **404 Not Found**: The API endpoint may have changed. Check the latest ElevenLabs documentation.
2. **401 Unauthorized**: Your API key is invalid or has expired.
3. **413 Payload Too Large**: Your file exceeds the size limits (typically 30MB).
4. **429 Too Many Requests**: You've exceeded your API rate limits or quota.

For the latest information, visit the [ElevenLabs Documentation](https://elevenlabs.io/docs).
