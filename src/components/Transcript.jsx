import { useState, useEffect, useRef } from 'react';

function Transcript({ data, isProcessing, currentTime, onWordClick }) {
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(null);
  const transcriptRef = useRef(null);
  
  // Find the current word based on the audio time
  useEffect(() => {
    if (!data || !currentTime) return;
    
    // Flatten all words from all segments for easy searching
    let allWords = [];
    let wordIndex = 0;
    
    data.forEach(segment => {
      if (segment.words) {
        segment.words.forEach(word => {
          allWords.push({
            ...word,
            segmentIndex: data.indexOf(segment),
            wordIndexInSegment: segment.words.indexOf(word),
            globalIndex: wordIndex++
          });
        });
      }
    });
    
    // Find the word that corresponds to the current time
    const currentWord = allWords.find(word => 
      currentTime >= word.start && currentTime <= word.end
    );
    
    if (currentWord) {
      setHighlightedWordIndex(currentWord.globalIndex);
      
      // Scroll to the highlighted word if it's not visible
      const highlightedElement = document.getElementById(`word-${currentWord.globalIndex}`);
      if (highlightedElement && transcriptRef.current) {
        const container = transcriptRef.current;
        const containerRect = container.getBoundingClientRect();
        const elementRect = highlightedElement.getBoundingClientRect();
        
        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          highlightedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [data, currentTime]);

  if (isProcessing) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-3">Transcript</h2>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-3/5"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-3">Transcript</h2>
        <p className="text-gray-500">
          Upload a file and transcribe it to see the results here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Transcript</h2>
        <div className="text-xs text-gray-500 flex items-center">
          <span className="inline-block h-3 w-3 bg-yellow-200 rounded-full mr-1"></span>
          <span>Currently playing</span>
        </div>
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto" ref={transcriptRef}>
        {data.map((segment, segmentIndex) => (
          <div key={segmentIndex} className="pb-3 border-b border-gray-100 last:border-0">
            <span className="font-medium text-blue-600">
              {segment.speaker !== undefined && segment.speaker !== null 
                ? (segment.speaker.includes('speaker_') 
                  ? `Speaker ${segment.speaker.replace('speaker_', '')}:` 
                  : `Speaker ${segment.speaker}:`)
                : 'Transcription:'}
            </span>
            <p className="mt-1 text-gray-800 leading-relaxed">
              {segment.words ? (
                // If we have word-level timing, render individual words for highlighting
                segment.words.map((word, wordIndex) => {
                  const globalWordIndex = data.slice(0, segmentIndex).reduce(
                    (acc, seg) => acc + (seg.words?.length || 0), 0
                  ) + wordIndex;
                  
                  return (
                    <span 
                      key={wordIndex}
                      id={`word-${globalWordIndex}`}
                      className={`cursor-pointer hover:text-blue-600 ${globalWordIndex === highlightedWordIndex ? 'bg-yellow-200' : ''}`}
                      onClick={() => {
                        console.log('Clicked word with timing:', word.start, word.text);
                        onWordClick && onWordClick(word.start);
                      }}
                    >
                      {word.text}{' '}
                    </span>
                  );
                })
              ) : (
                // If no word-level timing, just display the text
                segment.text
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Transcript;