import { useState } from 'react';
import axios from 'axios';

function APITester({ apiKey }) {
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);
  const [showTester, setShowTester] = useState(false);

  const testEndpoints = async () => {
    if (!apiKey) {
      setResults(prev => [...prev, { 
        endpoint: 'All', 
        status: 'error', 
        message: 'API key required' 
      }]);
      return;
    }

    setTesting(true);
    setResults([]);

    const endpoints = [
      {
        name: 'Models List',
        url: 'https://api.elevenlabs.io/v1/models',
        method: 'get',
        data: null
      },
      {
        name: 'Speech-to-Text',
        url: 'https://api.elevenlabs.io/v1/speech-to-text',
        method: 'post',
        data: new FormData() // This would need a file to be valid
      },
      {
        name: 'User Info',
        url: 'https://api.elevenlabs.io/v1/user',
        method: 'get',
        data: null
      }
    ];

    // Test each endpoint without files (just to check API connectivity)
    for (const endpoint of endpoints) {
      try {
        const config = {
          method: endpoint.method,
          url: endpoint.url,
          headers: {
            'xi-api-key': apiKey
          }
        };

        if (endpoint.data) {
          config.headers['Content-Type'] = 'multipart/form-data';
          config.data = endpoint.data;
        }

        // For POST endpoints without files, we expect them to fail with 422
        // but we just want to make sure they exist
        const response = await axios(config).catch(error => {
          if (error.response && (
              error.response.status === 422 || // Unprocessable Entity (expected for POST without proper data)
              error.response.status === 400     // Bad Request (expected for POST without proper data)
          )) {
            return { 
              status: 'partial',
              data: { message: 'Endpoint exists but requires proper data' } 
            };
          }
          throw error;
        });

        setResults(prev => [...prev, { 
          endpoint: endpoint.name, 
          status: 'success', 
          message: endpoint.method === 'get' ? 'Valid endpoint' : 'Endpoint exists',
          details: JSON.stringify(response.data, null, 2)
        }]);
      } catch (error) {
        setResults(prev => [...prev, { 
          endpoint: endpoint.name, 
          status: 'error', 
          message: error.response?.data?.detail || error.message,
          details: error.response?.status 
            ? `Status: ${error.response.status}` 
            : 'Network error'
        }]);
      }
    }

    setTesting(false);
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <button 
          className="text-xs text-blue-600 underline"
          onClick={() => setShowTester(!showTester)}
        >
          {showTester ? 'Hide API Tester' : 'Show API Tester'}
        </button>
      </div>

      {showTester && (
        <div className="bg-gray-100 p-4 rounded-md">
          <div className="mb-3 flex justify-between items-center">
            <h3 className="text-sm font-semibold">API Tester</h3>
            <button
              onClick={testEndpoints}
              disabled={testing}
              className={`px-3 py-1 rounded text-xs ${
                testing ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {testing ? 'Testing...' : 'Test API Endpoints'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="text-xs mt-2 max-h-60 overflow-y-auto">
              <h4 className="font-medium mb-1">Results:</h4>
              {results.map((result, index) => (
                <div 
                  key={index} 
                  className={`mb-2 p-2 rounded ${
                    result.status === 'success' ? 'bg-green-100' : 
                    result.status === 'partial' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}
                >
                  <p className="font-medium">{result.endpoint}: {result.message}</p>
                  {result.details && (
                    <details>
                      <summary className="cursor-pointer">Details</summary>
                      <pre className="whitespace-pre-wrap mt-1 text-xs">{result.details}</pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default APITester;