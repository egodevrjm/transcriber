import { useState } from 'react';

function ErrorDisplay({ error }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  // Extract just the main message without technical details
  let mainError = error;
  if (typeof error === 'string') {
    // Remove any common technical prefixes
    mainError = error.replace(/^(Error|TypeError|ReferenceError|API Error|Failed to):\s*/i, '');
    
    // If there's a colon followed by technical details, truncate
    const colonIndex = mainError.indexOf(':');
    if (colonIndex > 0 && colonIndex < 50) {
      mainError = mainError.substring(0, colonIndex);
    }
    
    // Capitalize first letter
    mainError = mainError.charAt(0).toUpperCase() + mainError.slice(1);
  }

  return (
    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
      <div className="flex items-center justify-between">
        <p className="font-medium">{mainError}</p>
        <button
          className="text-sm underline text-red-700"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {showDetails && (
        <div className="mt-3 p-2 bg-red-50 rounded overflow-auto max-h-40 text-xs font-mono">
          <p>Here are some common solutions to try:</p>
          <ul className="list-disc pl-5 mt-2">
            <li>Check that your API key is correct in Settings</li>
            <li>Try a different file format (MP3 or WAV recommended)</li>
            <li>Ensure your file is not too large (under 30MB is ideal)</li>
            <li>Check your internet connection</li>
            <li>Verify you have sufficient account credits</li>
          </ul>
          
          {typeof error === 'string' && error.length > mainError.length && (
            <div className="mt-2 pt-2 border-t border-red-200">
              <p className="font-semibold">Full error message:</p>
              <p className="mt-1 whitespace-pre-wrap">{error}</p>
            </div>
          )}
          
          <p className="mt-2">
            For more information, visit: 
            <a 
              href="https://elevenlabs.io/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              API Documentation
            </a>
          </p>
        </div>
      )}
    </div>
  );
}

export default ErrorDisplay;