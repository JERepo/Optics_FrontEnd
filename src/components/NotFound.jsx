import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  // Set document title
  useEffect(() => {
    document.title = "Page Not Found | Your Brand";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl text-center">
        {/* Visual indicator */}
        <div className="relative mb-12 w-fit mx-auto">
          <div className="absolute -ins-4 rounded-full bg-blue-100/60 animate-pulse"></div>
          <div className="relative flex items-center justify-center">
            <span className="text-8xl font-bold text-blue-600">4</span>
            <div className="mx-2 relative">
              <svg 
                className="w-28 h-28 text-blue-500 animate-float" 
                viewBox="0 0 100 100"
              >
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="280 20" className="animate-rotate" />
                <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="180 20" className="animate-rotate-reverse" />
                <path 
                  d="M35,35 L65,65 M65,35 L35,65" 
                  stroke="currentColor" 
                  strokeWidth="6" 
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="text-8xl font-bold text-blue-600">4</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Page Not Found
          </h1>
          
          <div className="max-w-lg mx-auto">
            <p className="text-lg text-gray-600 mb-4">
              We couldn't find the page at:
            </p>
            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-inner mb-6">
              <code className="text-sm font-mono text-gray-700 break-all">
                {window.location.href}
              </code>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Go Back
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Homepage
            </button>
          </div>

          <div className="pt-8 border-t border-gray-200 mt-8">
            <p className="text-gray-500">
              Need assistance? <a href="/contact" className="text-blue-600 hover:underline font-medium">Contact support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;