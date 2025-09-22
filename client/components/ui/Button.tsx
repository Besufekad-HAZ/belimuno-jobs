import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success"
    | "warning";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  disabled,
  ariaLabel,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-gradient-cta hover:from-yellow-500 hover:to-orange-500 text-white focus:ring-yellow-400 shadow-lg hover:shadow-xl",
    secondary:
      "bg-gradient-primary hover:from-blue-800 hover:to-blue-600 text-white focus:ring-blue-400 shadow-md hover:shadow-lg",
    outline:
      "border-2 border-blue-500 bg-white hover:bg-blue-50 text-blue-600 focus:ring-blue-400 hover:border-blue-600",
    ghost:
      "hover:bg-blue-50 text-blue-600 focus:ring-blue-400 hover:text-blue-700",
    danger:
      "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-400 shadow-lg hover:shadow-xl",
    success:
      "bg-gradient-success hover:from-green-500 hover:to-green-600 text-white focus:ring-green-400 shadow-lg hover:shadow-xl",
    warning:
      "bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white focus:ring-orange-400 shadow-lg hover:shadow-xl",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-live={loading ? "polite" : undefined}
      aria-label={ariaLabel}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          role="img"
          aria-label="Loading"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        {children}
      </span>
    </button>
  );
};

export default Button;
