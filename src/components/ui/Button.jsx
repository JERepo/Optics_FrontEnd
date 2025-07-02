import React from "react";
import { FiLoader } from "react-icons/fi"; // optional spinner icon

const Button = ({
  children,
  icon: Icon,
  iconPosition = "left",
  variant = "primary",
  size = "md",
  className = "",
  isLoading = false,
  loadingText = "Loading...",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium transition rounded-md";
  const sizeStyles = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-5 py-3 text-lg",
  };

  const variantStyles = {
    primary: "bg-neutral-800 text-white hover:bg-neutral-700",
    secondary: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
    outline: "border border-neutral-300 text-neutral-800 hover:bg-neutral-100",
    danger: "bg-red-600 text-white hover:bg-red-500",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <FiLoader className="animate-spin text-lg" />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon className="text-lg" />}
          {children}
          {Icon && iconPosition === "right" && <Icon className="text-lg" />}
        </>
      )}
    </button>
  );
};

export default Button;
