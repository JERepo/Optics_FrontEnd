import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const ErrorPage = ({ 
  error, 
  errorInfo, 
  errorId, 
  onReset, 
  onReload,
  showDetails = false 
}) => {
  const navigate = useNavigate();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setIsDetailsOpen(false);
  }, [error]);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await Promise.resolve(onReset?.());
    } finally {
      setIsResetting(false);
    }
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  const handleReload = () => {
    onReload?.();
  };

  const copyErrorDetails = async () => {
    const errorDetails = {
      errorId,
      message: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      // Optional: Add toast notification here
      console.log("Error details copied to clipboard");
    } catch (err) {
      console.error("Failed to copy error details:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 animate-pulse">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Something went wrong
          </h1>
          
          <p className="mt-3 text-lg text-gray-600">
            We've encountered an unexpected error. Don't worry, our team has been notified.
          </p>
          
          {errorId && (
            <p className="mt-2 text-sm text-gray-500">
              Error ID: <code className="bg-gray-100 px-2 py-1 rounded">{errorId}</code>
            </p>
          )}
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          {/* Primary Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isResetting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Recovering...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleGoHome}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go Home
              </button>

              <button
                onClick={handleReload}
                className="flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reload Page
              </button>
            </div>
          </div>

          {/* Error Details - Only shown in development or if explicitly enabled */}
          {(showDetails || import.meta.env.DEV) && (error || errorInfo) && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Error Details</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={copyErrorDetails}
                    className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                  >
                    Copy Details
                  </button>
                  <button
                    onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {isDetailsOpen ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {isDetailsOpen && (
                <div className="space-y-4">
                  {error && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Error Message</h3>
                      <pre className="text-sm text-red-600 bg-red-50 p-3 rounded-lg overflow-x-auto">
                        {error.toString()}
                      </pre>
                    </div>
                  )}
                  
                  {error?.stack && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Stack Trace</h3>
                      <pre className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Component Stack</h3>
                      <pre className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Support Section */}
          <div className="bg-blue-50 rounded-2xl p-6 text-center">
            <h3 className="text-lg font-medium text-blue-900">Need help?</h3>
            <p className="mt-2 text-blue-700">
              Contact our support team with your error ID for assistance.
            </p>
            <div className="mt-4 space-y-2">
              <a
                href="mailto:optics@joinignends.in"
                className="inline-flex items-center text-blue-600 hover:text-blue-500 font-medium"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                optics@joinignends.in
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;