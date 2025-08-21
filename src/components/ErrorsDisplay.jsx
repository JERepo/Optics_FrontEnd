import React, { useState, useEffect } from 'react';

export const ErrorDisplayModal = ({ errors, open, onClose, title = "Error Fetching DIA Details" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // If errors is a string, convert it to an array
  const errorList = Array.isArray(errors) 
    ? errors 
    : typeof errors === 'string' 
      ? [{ message: errors }] 
      : [];

  // Handle animations
  useEffect(() => {
    if (open) {
      setIsMounted(true);
      // Small timeout to allow DOM to update before starting animation
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Wait for animation to complete before unmounting
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with fade effect */}
      <div 
        className={`absolute inset-0 bg-white/40 transition-opacity duration-300 ${
          isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={onClose}
      />
      
      {/* Modal with slide-in effect */}
      <div 
        className={`relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-red-200 bg-gradient-to-r from-red-50 to-red-100 rounded-t-xl">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 mr-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-red-800">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-100 rounded-full"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-96 overflow-y-auto">
          {errorList.length > 0 ? (
            <>
              <p className="text-gray-700 mb-4">We encountered the following issues:</p>
              <ul className="space-y-3">
                {errorList.map((error, index) => (
                  <li 
                    key={index} 
                    className="flex items-start p-3 rounded-lg bg-red-50 border border-red-100 transition-transform hover:translate-x-1"
                  >
                    <span className="flex-shrink-0 w-5 h-5 mt-0.5 mr-3 text-red-500">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="text-gray-800">{error.message || "An unknown error occurred"}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex items-center p-4 rounded-lg bg-red-50 border border-red-100">
              <svg className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-gray-800">An unknown error occurred while fetching DIA details.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 shadow-sm hover:shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};