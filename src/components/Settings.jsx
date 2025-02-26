import { useState } from 'react';
import axios from 'axios';

function Settings({ apiKey, onSave }) {
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(inputKey.trim());
    setTestResult(null);
  };

  const testApiKey = async () => {
    if (!inputKey.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter an API key first'
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Try to make a simple request to the ElevenLabs API
      const response = await axios.get('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': inputKey.trim()
        }
      });

      if (response.status === 200) {
      setTestResult({
      success: true,
      message: 'API key is valid!'
      });
      }
    } catch (error) {
      console.error('API test error:', error);
      setTestResult({
        success: false,
        message: error.response?.status === 401 
          ? 'Invalid API key' 
          : `Error: ${error.message || 'Unknown error'}`
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-3">Settings</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
            API Key
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type={showKey ? "text" : "password"}
              id="apiKey"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your API key"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Your API key is stored locally in your browser and never sent to our servers.
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Save API Key
          </button>
          
          <button
            type="button"
            onClick={testApiKey}
            disabled={testing}
            className={`px-4 py-2 rounded-md text-sm font-medium ${testing ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
          >
            {testing ? 'Testing...' : 'Test API Key'}
          </button>
        </div>
        
        {testResult && (
          <div className={`mt-3 p-2 text-sm rounded ${testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {testResult.message}
          </div>
        )}
      </form>
    </div>
  );
}

export default Settings;