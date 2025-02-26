# ElevenLabs Transcription App - Troubleshooting

## API Issues and Solutions

We're encountering a 422 Unprocessable Content error when trying to use the ElevenLabs Speech-to-Text API. This error indicates that the server understood the request but couldn't process it due to semantic errors in the request.

### Troubleshooting Steps

1. **API Endpoint Validation**
   - We've tried multiple endpoints:
     - `/v1/speech-to-text`
     - `/v1/speech-to-text/transcriptions`
   - The API Tester component will help identify which endpoints are currently active

2. **Parameter Format Issues**
   - We've tried different parameter names for the audio file:
     - `file` parameter (common in many APIs)
     - `audio` parameter (used in some ElevenLabs documentation)
   - We've tried various model IDs:
     - `scribe_v1`
     - `eleven_scribe_v1`
     - `eleven_scribe`

3. **Error Handling Improvements**
   - Better parsing of error responses
   - More detailed debugging information
   - Added API endpoint tester to verify connectivity

### Possible Solutions

1. **Check API Documentation**
   - The most current API documentation should be consulted for exact endpoint URLs and parameter names
   - The Speech-to-Text API might have changed since the documentation was written

2. **Check Your Account Permissions**
   - Ensure your ElevenLabs account has access to the Speech-to-Text feature
   - Check if you have sufficient credits for the transcription

3. **Try Different File Formats**
   - Convert your audio to a different format (MP3 or WAV recommended)
   - Ensure the file size is under the API limits (usually 30MB)

4. **Use the API Tester**
   - The included API Tester component can help diagnose which endpoints are accessible
   - It will show if your API key has valid permissions

5. **Contact ElevenLabs Support**
   - If all else fails, contact ElevenLabs support with your API key and example request

## How to Use the API Tester

1. Enter your API key in the Settings section
2. Click "Show API Tester" below the error message
3. Click "Test API Endpoints" to check connectivity to various ElevenLabs endpoints
4. Review the results to see which endpoints are accessible with your API key

The API Tester will help diagnose whether the issue is with the specific endpoint, your API key permissions, or the request format.
