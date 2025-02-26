import { useState } from 'react';

function ExportTranscript({ transcript }) {
  const [exportFormat, setExportFormat] = useState('txt');
  
  if (!transcript || transcript.length === 0) {
    return null;
  }
  
  const exportFormats = [
    { id: 'txt', name: 'Text (.txt)', description: 'Simple text format' },
    { id: 'srt', name: 'Subtitles (.srt)', description: 'For video subtitles' },
    { id: 'vtt', name: 'WebVTT (.vtt)', description: 'Web video subtitles' },
    { id: 'json', name: 'JSON (.json)', description: 'Complete data with timing' },
    { id: 'csv', name: 'CSV (.csv)', description: 'For spreadsheets' }
  ];
  
  // Generate text format
  const generateTextContent = () => {
    let content = '';
    
    transcript.forEach(segment => {
      if (segment.speaker !== undefined) {
        content += `Speaker ${segment.speaker}: ${segment.text}\n\n`;
      } else {
        content += `${segment.text}\n\n`;
      }
    });
    
    return content;
  };
  
  // Generate SRT format (SubRip Subtitle)
  const generateSrtContent = () => {
    let content = '';
    let index = 1;
    
    transcript.forEach(segment => {
      if (!segment.start && !segment.end) return;
      
      const startTime = formatSrtTime(segment.start);
      const endTime = formatSrtTime(segment.end);
      
      content += `${index}\n`;
      content += `${startTime} --> ${endTime}\n`;
      content += `${segment.speaker !== undefined ? `Speaker ${segment.speaker}: ` : ''}${segment.text}\n\n`;
      
      index++;
    });
    
    return content;
  };
  
  // Generate WebVTT format
  const generateVttContent = () => {
    let content = 'WEBVTT\n\n';
    
    transcript.forEach((segment, index) => {
      if (!segment.start && !segment.end) return;
      
      const startTime = formatVttTime(segment.start);
      const endTime = formatVttTime(segment.end);
      
      content += `${index + 1}\n`;
      content += `${startTime} --> ${endTime}\n`;
      content += `${segment.speaker !== undefined ? `<v Speaker ${segment.speaker}>` : ''}${segment.text}\n\n`;
    });
    
    return content;
  };
  
  // Generate JSON format
  const generateJsonContent = () => {
    return JSON.stringify(transcript, null, 2);
  };
  
  // Generate CSV format
  const generateCsvContent = () => {
    let content = 'Speaker,Start Time,End Time,Text\n';
    
    transcript.forEach(segment => {
      const speaker = segment.speaker !== undefined ? `Speaker ${segment.speaker}` : 'Unknown';
      const startTime = segment.start !== undefined ? segment.start : '';
      const endTime = segment.end !== undefined ? segment.end : '';
      // Escape commas in the text
      const text = `"${segment.text.replace(/"/g, '""')}"`;
      
      content += `${speaker},${startTime},${endTime},${text}\n`;
    });
    
    return content;
  };
  
  // Format time for SRT (00:00:00,000)
  const formatSrtTime = (seconds) => {
    if (seconds === undefined) return '00:00:00,000';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };
  
  // Format time for VTT (00:00:00.000)
  const formatVttTime = (seconds) => {
    if (seconds === undefined) return '00:00:00.000';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };
  
  // Handle export button click
  const handleExport = () => {
    let content = '';
    let filename = `transcript_${new Date().toISOString().slice(0, 10)}`;
    let mimeType = '';
    
    switch (exportFormat) {
      case 'txt':
        content = generateTextContent();
        filename += '.txt';
        mimeType = 'text/plain';
        break;
      case 'srt':
        content = generateSrtContent();
        filename += '.srt';
        mimeType = 'text/plain';
        break;
      case 'vtt':
        content = generateVttContent();
        filename += '.vtt';
        mimeType = 'text/vtt';
        break;
      case 'json':
        content = generateJsonContent();
        filename += '.json';
        mimeType = 'application/json';
        break;
      case 'csv':
        content = generateCsvContent();
        filename += '.csv';
        mimeType = 'text/csv';
        break;
      default:
        content = generateTextContent();
        filename += '.txt';
        mimeType = 'text/plain';
    }
    
    // Create a blob and download link
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };
  
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-3">Export Transcript</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Export Format
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {exportFormats.map(format => (
            <div 
              key={format.id}
              className={`border rounded p-2 cursor-pointer hover:bg-gray-50 ${
                exportFormat === format.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
              onClick={() => setExportFormat(format.id)}
            >
              <div className="flex items-center">
                <input
                  type="radio"
                  id={`format-${format.id}`}
                  name="exportFormat"
                  checked={exportFormat === format.id}
                  onChange={() => setExportFormat(format.id)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor={`format-${format.id}`} className="ml-2 font-medium text-gray-700">
                  {format.name}
                </label>
              </div>
              <p className="text-xs text-gray-500 ml-6">{format.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <button
        onClick={handleExport}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
      >
        Export Transcript
      </button>
    </div>
  );
}

export default ExportTranscript;