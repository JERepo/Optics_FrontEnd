import { FiLoader } from "react-icons/fi";

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
    "inline-flex items-center justify-center gap-1 font-medium transition rounded-md";

  const sizeStyles = {
    xs: "px-2 py-0.5 text-xs", // Extra small
    sm: "px-2.5 py-1 text-sm", // Slightly adjusted small
    md: "px-4 py-2 text-base",
    lg: "px-5 py-3 text-lg",
  };

  const iconSizes = {
    xs: "text-sm", // 0.875rem (14px)
    sm: "text-base", // 1rem (16px)
    md: "text-lg", // 1.125rem (18px)
    lg: "text-xl", // 1.25rem (20px)
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
          <FiLoader className={`animate-spin ${iconSizes[size]}`} />
          <span>{loadingText}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === "left" && (
            <Icon className={iconSizes[size]} />
          )}
          {children}
          {Icon && iconPosition === "right" && (
            <Icon className={iconSizes[size]} />
          )}
        </>
      )}
    </button>
  );
};

export default Button;
