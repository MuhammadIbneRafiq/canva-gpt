import { useState } from 'react';
import { useCanvas } from '../contexts/CanvasContext';

const CanvasTokenInput = () => {
  const { accessToken, canvasUrl, loading, error, setAccessToken, setCanvasUrl } = useCanvas();
  const [localToken, setLocalToken] = useState(accessToken);
  const [localUrl, setLocalUrl] = useState(canvasUrl);
  const [isExpanded, setIsExpanded] = useState(!accessToken);
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccessToken(localToken);
    setCanvasUrl(localUrl);
    setIsExpanded(false);
  };

  return (
    <div className="border-b">
      <div className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-medium">Canvas Access Token</span>
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

        {!isExpanded && accessToken && (
          <div className="mt-2 text-sm text-gray-600">
            <p>Canvas token is set ✓</p>
          </div>
        )}

        {isExpanded && (
          <form onSubmit={handleSubmit} className="mt-4">
            <div className="mb-4">
              <label htmlFor="canvasUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Canvas URL
              </label>
              <input
                id="canvasUrl"
                type="text"
                value={localUrl}
                onChange={(e) => setLocalUrl(e.target.value)}
                placeholder="https://canvas.tue.nl"
                className="input"
              />
              <p className="mt-1 text-xs text-gray-500">
                The URL of your Canvas instance (e.g., https://canvas.tue.nl)
              </p>
            </div>

            <div className="mb-4">
              <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700 mb-1">
                Access Token
              </label>
              <div className="relative">
                <input
                  id="accessToken"
                  type={showToken ? 'text' : 'password'}
                  value={localToken}
                  onChange={(e) => setLocalToken(e.target.value)}
                  placeholder="Enter your Canvas access token"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-700"
                >
                  {showToken ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                You can generate an access token in your Canvas account settings.
                <a 
                  href="https://community.canvaslms.com/t5/Student-Guide/How-do-I-manage-API-access-tokens-as-a-student/ta-p/273"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 ml-1"
                >
                  Learn how
                </a>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-2 bg-red-100 text-red-800 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setLocalToken('');
                  setAccessToken('');
                }}
                className="btn btn-secondary mr-2"
                disabled={loading}
              >
                Clear
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading || !localToken}
              >
                {loading ? 'Saving...' : 'Save Token'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CanvasTokenInput; 