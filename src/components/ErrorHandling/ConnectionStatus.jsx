import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [visible, setVisible] = useState(false);
  const checkingRef = useRef(false);

  const verifyConnection = async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;

    try {
      const res = await fetch("https://www.gstatic.com/generate_204", {
        method: "GET",
        cache: "no-store",
        mode: "no-cors",
      });
      if (!isOnline) {
        setIsOnline(true);
        showBannerTemporarily();
      }
    } catch {
      if (isOnline) {
        setIsOnline(false);
        setVisible(true);
      }
    } finally {
      checkingRef.current = false;
    }
  };

  const showBannerTemporarily = () => {
    setVisible(true);
    setTimeout(() => setVisible(false), 3000);
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showBannerTemporarily();
      const retry = setInterval(verifyConnection, 2000);
      setTimeout(() => clearInterval(retry), 8000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setVisible(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check & periodic re-check
    verifyConnection();
    const interval = setInterval(verifyConnection, 100000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="banner"
          initial={{ y: -100, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30,
            duration: 0.3
          }}
          className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full px-4"
        >
          <div className={`
            relative rounded-2xl shadow-2xl p-4 backdrop-blur-sm border
            ${isOnline 
              ? "bg-green-50/95 border-green-200 text-green-800" 
              : "bg-red-50/95 border-red-200 text-red-800"
            }
          `}>
            {/* Progress bar for online state */}
            {isOnline && (
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 3, ease: "linear" }}
                className="absolute top-0 left-0 right-0 h-1 bg-green-500 rounded-t-2xl origin-left"
              />
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full
                  ${isOnline 
                    ? "bg-green-100 text-green-600" 
                    : "bg-red-100 text-red-600"
                  }
                `}>
                  {isOnline ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <div>
                  <p className="font-semibold text-sm">
                    {isOnline ? "Connection Restored" : "No Internet Connection"}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {isOnline 
                      ? "You're back online and ready to go!" 
                      : "Please check your network connection"
                    }
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setVisible(false)}
                className={`
                  p-1 rounded-full transition-all duration-200 hover:scale-110
                  ${isOnline 
                    ? "hover:bg-green-200/50 text-green-600" 
                    : "hover:bg-red-200/50 text-red-600"
                  }
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Offline action suggestions */}
            {!isOnline && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ delay: 0.2 }}
                className="mt-3 pt-3 border-t border-red-200/50"
              >
                <p className="text-xs font-medium mb-2">Try these steps:</p>
                <ul className="text-xs space-y-1 opacity-80">
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    <span>Check your Wi-Fi or mobile data</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    <span>Restart your router</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                    <span>Check network settings</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}