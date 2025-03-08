import { useState, useEffect } from 'react';
import { useCanvas } from '../contexts/CanvasContext';

const CanvasTokenInput = () => {
  const { accessToken, canvasUrl, loading, error, setAccessToken, setCanvasUrl } = useCanvas();
  const [localToken, setLocalToken] = useState(accessToken);
  const [localUrl, setLocalUrl] = useState(canvasUrl);
  const [isExpanded, setIsExpanded] = useState(!accessToken);
  const [showToken, setShowToken] = useState(false);
  const [tokenSource, setTokenSource] = useState<'manual' | 'chat' | null>(null);

  // Update local state when accessToken changes
  useEffect(() => {
    if (accessToken && accessToken !== localToken) {
      setLocalToken(accessToken);
      setTokenSource('chat');
      // Collapse the panel after a token is detected in chat
      setIsExpanded(false);
    }
  }, [accessToken]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAccessToken(localToken);
    setCanvasUrl(localUrl);
    setTokenSource('manual');
    setIsExpanded(false);
  };

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="p-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center">
            <div className="mr-2 text-canvas-blue">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M15.75 1.5a6.75 6.75 0 00-6.651 7.906c.067.39-.032.717-.221.906l-6.5 6.499a3 3 0 00-.878 2.121v2.818c0 .414.336.75.75.75H6a.75.75 0 00.75-.75v-1.5h1.5A.75.75 0 009 19.5V18h1.5a.75.75 0 00.75-.75V15h1.5a.75.75 0 00.53-.22l.5-.5a.75.75 0 00.22-.53V12h1.5a.75.75 0 00.53-.22l.5-.5a.75.75 0 00.22-.53V9.75a.75.75 0 00-.75-.75h-1.5a.75.75 0 00-.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 00-.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 00-.75.75v1.5a.75.75 0 01-.75.75h-1.5a.75.75 0 00-.75.75v1.5a.75.75 0 01-.75.75H3a.75.75 0 00-.75.75V21a.75.75 0 00.75.75h2.25a.75.75 0 00.75-.75v-1.5h1.5a.75.75 0 00.75-.75v-1.5h1.5a.75.75 0 00.75-.75v-1.5h1.5a.75.75 0 00.75-.75v-1.5h1.5a.75.75 0 00.75-.75V10.5a6.75 6.75 0 00-.75-9z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-medium">Canvas Access Token</span>
          </div>
          <div className="flex items-center">
            {accessToken && (
              <span className="mr-2 text-xs px-2 py-1 bg-canvas-green text-white rounded-full">
                Active
              </span>
            )}
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
          </div>
        </button>

        {!isExpanded && accessToken && (
          <div className="mt-2 text-sm">
            <div className="flex items-center text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1 text-canvas-green">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
              <span>
                Canvas token is set {tokenSource === 'chat' ? '(detected in chat)' : '(manually entered)'}
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Connected to: {canvasUrl}
            </p>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 pr-10"
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
              <div className="mt-1 text-xs text-gray-500 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1 text-canvas-blue">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
                <span>
                  You can generate an access token in your Canvas account settings.
                  <a 
                    href="https://community.canvaslms.com/t5/Student-Guide/How-do-I-manage-API-access-tokens-as-a-student/ta-p/273"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 ml-1"
                  >
                    Learn how
                  </a>
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-canvas-red bg-opacity-10 text-canvas-red rounded-md text-sm border border-canvas-red border-opacity-20">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setLocalToken('');
                  setAccessToken('');
                  setTokenSource(null);
                }}
                className="px-4 py-2 mr-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={loading}
              >
                Clear
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
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