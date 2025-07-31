import React, { useEffect, useState } from "react";

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-xl",
  height = "max-h-[90vh]",
  scrollRef
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      setTimeout(() => setIsVisible(true), 10);
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      setTimeout(() => setIsMounted(false), 200);
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* White backdrop with slight opacity */}
      <div
        className={`fixed inset-0 bg-white bg-opacity-70 transition-opacity duration-200 ${
          isVisible ? "opacity-80" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal content */}
      <div
       ref={scrollRef}
        className={`relative bg-white rounded-xl shadow-lg w-full ${width} ${height} overflow-y-auto transform transition-all duration-200 ${
          isVisible
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-95"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className=" absolute top-2 right-4 text-gray-500 hover:text-gray-800 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
          aria-label="Close Modal"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Title */}
        {title && (
          <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-2 border-b border-gray-100">
            <h3 className="text-2xl font-semibold text-gray-800">{title}</h3>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
