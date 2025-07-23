// components/ui/ConfirmationModal.jsx
import React, { useEffect } from "react";
import Loader from "./Loader";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger = true,
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/5 bg-opacity-80 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      {/* Modal with slide-down animation */}
      <div className="relative bg-white rounded-xl shadow-lg w-full max-w-md border border-gray-200 animate-[slideDown_0.3s_ease-out]">
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-900">{title}</h2>
            <p className="mt-2 text-sm text-gray-500">{message}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row-reverse justify-center items-center gap-3">
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-md text-white ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            } transition-colors`}
            autoFocus
          >
            {isLoading ? <Loader className="text-neutral-50" /> : `${confirmText}`}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-md text-gray-700 transition-colors"
          >
            {cancelText}
          </button>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            transform: translateY(-50px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ConfirmationModal;
