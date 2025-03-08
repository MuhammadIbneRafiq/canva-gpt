import { useState } from 'react';
import { useChat } from '../contexts/ChatContext';

const CanvasContextInput = () => {
  const { canvasContext, setCanvasContext } = useChat();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localContext, setLocalContext] = useState(canvasContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCanvasContext(localContext);
    setIsExpanded(false);
  };

  return (
    <div className="border-b">
      <div className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">Canvas Context</span>
          <svg
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M19 9l-7 7-7-7"
            ></path>
          </svg>
        </button>

        {isExpanded && (
          <form onSubmit={handleSubmit} className="mt-4">
            <textarea
              value={localContext}
              onChange={(e) => setLocalContext(e.target.value)}
              placeholder="Paste Canvas assignment details, due dates, or other context here..."
              className="w-full p-2 border border-gray-300 rounded-md h-32 resize-none"
            />
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => {
                  setLocalContext('');
                  setCanvasContext('');
                }}
                className="btn btn-secondary mr-2"
              >
                Clear
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        )}

        {!isExpanded && canvasContext && (
          <div className="mt-2 text-sm text-gray-600">
            <p className="truncate">
              {canvasContext.length > 100
                ? `${canvasContext.substring(0, 100)}...`
                : canvasContext}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasContextInput; 