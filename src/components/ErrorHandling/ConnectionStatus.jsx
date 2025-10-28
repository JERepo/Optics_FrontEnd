import React, { useEffect, useState, useRef } from "react";

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [visible, setVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      setIsOnline(true);
      setVisible(true);
      setShouldRender(true);
      
      // Auto-hide after 3 seconds for online status
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        // Wait for animation to complete before removing from DOM
        setTimeout(() => setShouldRender(false), 500);
      }, 3000);
    };

    const handleOffline = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      setIsOnline(false);
      setVisible(true);
      setShouldRender(true);
      // Don't auto-hide offline status - user needs to see it until connection returns
    };

    // Set up event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Handle animation end for smooth exit
  const handleTransitionEnd = () => {
    if (!visible) {
      setShouldRender(false);
    }
  };

  if (!shouldRender) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      aria-label={isOnline ? "Connection restored" : "You are offline"}
      className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ease-out ${
        visible 
          ? "translate-y-0 opacity-100" 
          : "-translate-y-full opacity-0"
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div
        className={`${
          isOnline 
            ? "bg-green-500 border-b border-green-600" 
            : "bg-red-500 border-b border-red-600"
        } text-white text-center py-4 px-4 shadow-lg`}
      >
        <div className="flex items-center justify-center space-x-3 text-sm font-medium">
          {isOnline ? (
            <>
              <div className="flex-shrink-0">
                <svg 
                  className="w-5 h-5 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2.5} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              </div>
              <div>
                <span className="font-semibold">Connection Restored</span>
                <p className="text-xs opacity-90 mt-1">
                  You're back online and can continue working
                </p>
              </div>
              <button
                onClick={() => {
                  setVisible(false);
                  if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                  }
                }}
                className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
                aria-label="Dismiss notification"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            </>
          ) : (
            <>
              <div className="flex-shrink-0">
                <svg 
                  className="w-5 h-5 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2.5} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" 
                  />
                </svg>
              </div>
              <div className="flex-1">
                <span className="font-semibold">You're Offline</span>
                <p className="text-xs opacity-90 mt-1">
                  Please check your internet connection
                </p>
              </div>
              <button
                onClick={() => {
                  setVisible(false);
                  setTimeout(() => setShouldRender(false), 500);
                }}
                className="flex-shrink-0 ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
                aria-label="Dismiss notification"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionStatus;