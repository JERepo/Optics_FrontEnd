import React, { useState, useRef, useEffect, useCallback } from "react";
import Button from "./ui/Button";
import { FiXCircle } from "react-icons/fi";

const OTPScreen = ({
  length = 6,
  onComplete,
  autoFocus = true,
  disabled = false,
  type = "number",
  placeholder = "○",
  className = "",
  title = "Secure Verification", // 🆕 Dynamic Title
  showClear = true,              // 🆕 Option to toggle "Clear OTP" button
}) => {
  const [otp, setOtp] = useState(Array(length).fill(""));
  const inputRefs = useRef([]);

  const focusInput = useCallback(
    (index) => {
      if (inputRefs.current[index] && !disabled) {
        inputRefs.current[index].focus();
        inputRefs.current[index].select();
      }
    },
    [disabled]
  );

  const focusNext = useCallback(
    (index) => {
      if (index < length - 1) focusInput(index + 1);
    },
    [length, focusInput]
  );

  const focusPrev = useCallback(
    (index) => {
      if (index > 0) focusInput(index - 1);
    },
    [focusInput]
  );

  // 🔢 Handle input change
  const handleChange = useCallback(
    (index, value) => {
      if (disabled) return;

      let validatedValue = value;
      if (type === "number") validatedValue = value.replace(/[^0-9]/g, "");
      else if (type === "alphanumeric")
        validatedValue = value.replace(/[^a-zA-Z0-9]/g, "");

      if (validatedValue.length > 1) {
        // Handle paste
        const pasteData = validatedValue.slice(0, length - index);
        const newOtp = [...otp];

        pasteData.split("").forEach((char, pasteIndex) => {
          const currentIndex = index + pasteIndex;
          if (currentIndex < length) newOtp[currentIndex] = char;
        });

        setOtp(newOtp);
        focusInput(Math.min(index + pasteData.length, length - 1));
      } else {
        const newOtp = [...otp];
        newOtp[index] = validatedValue;
        setOtp(newOtp);

        if (validatedValue && index < length - 1) focusNext(index);
      }
    },
    [otp, length, type, disabled, focusNext, focusInput]
  );

  // ⌨️ Keyboard navigation
  const handleKeyDown = useCallback(
    (index, e) => {
      if (disabled) return;

      switch (e.key) {
        case "Backspace":
          if (!otp[index] && index > 0) {
            const newOtp = [...otp];
            newOtp[index - 1] = "";
            setOtp(newOtp);
            focusPrev(index);
          } else if (otp[index]) {
            const newOtp = [...otp];
            newOtp[index] = "";
            setOtp(newOtp);
          }
          e.preventDefault();
          break;

        case "ArrowLeft":
          focusPrev(index);
          e.preventDefault();
          break;

        case "ArrowRight":
          focusNext(index);
          e.preventDefault();
          break;

        case "Enter":
          if (onComplete && otp.every((v) => v !== "")) {
            onComplete(otp.join(""));
          }
          break;

        default:
          break;
      }
    },
    [otp, focusPrev, focusNext, onComplete, disabled]
  );

  // 📋 Handle paste
  const handlePaste = useCallback(
    (e) => {
      if (disabled) return;

      e.preventDefault();
      const pasteData = e.clipboardData.getData("text").trim();
      if (pasteData.length >= length) {
        const pasteOtp = pasteData.slice(0, length).split("");
        setOtp(pasteOtp);
        focusInput(length - 1);
      }
    },
    [length, disabled, focusInput]
  );

  // 🧹 Clear OTP
  const clearOtp = useCallback(() => {
    setOtp(Array(length).fill(""));
    focusInput(0);
  }, [length, focusInput]);

  // 👀 Auto submit when filled
  useEffect(() => {
    if (onComplete && otp.every((v) => v !== "")) {
      onComplete(otp.join(""));
    }
  }, [otp, onComplete]);

  // 👆 Autofocus first input
  useEffect(() => {
    if (autoFocus && !disabled) focusInput(0);
  }, [autoFocus, disabled, focusInput]);

  return (
    <div className={`flex flex-col items-center gap-3 w-full ${className}`}>
      {/* 🆕 Dynamic title */}
      <h2 className="text-xl font-semibold text-gray-800 text-center">
        {title}
      </h2>
      <p className="text-gray-500 text-sm text-center mb-3">
        Enter the verification code sent to you via Email or Whatsapp
      </p>

      {/* 🔢 OTP Input Fields */}
      <div className="flex gap-3 justify-center w-full items-center">
        {otp.map((value, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type={type === "number" ? "tel" : "text"}
            inputMode={type === "number" ? "numeric" : "text"}
            maxLength="1"
            value={value}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            disabled={disabled}
            placeholder={placeholder}
            className={`
              w-12 h-12 text-center text-lg font-medium
              border-2 rounded-lg bg-white transition-all duration-200
              outline-none
              ${
                value
                  ? "border-green-500 bg-green-50 text-gray-900"
                  : "border-gray-300 text-gray-900"
              }
              ${
                disabled
                  ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                  : "hover:border-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              }
            `}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
          {showClear && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearOtp}
          className="text-sm h-12 w-12"
          icon={FiXCircle}
          title="Clear OTP"
        >
          {/* Clear OTP */}
        </Button>
      )}
      </div>

      {/* 🆕 Clear button */}
    
    </div>
  );
};

export default OTPScreen;
