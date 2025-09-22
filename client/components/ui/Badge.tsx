import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "purple"
    | "teal"
    | "orange"
    | "gray"
    | "blue";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
}) => {
  const variants = {
    primary: "bg-blue-100 text-blue-800 border-blue-200",
    secondary: "bg-gray-100 text-gray-800 border-gray-200",
    success: "bg-green-100 text-green-800 border-green-200",
    warning: "bg-red-100 text-red-800 border-red-200",
    danger: "bg-red-100 text-red-800 border-red-200",
    info: "bg-blue-100 text-blue-800 border-blue-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    teal: "bg-teal-100 text-teal-800 border-teal-200",
    orange: "bg-orange-100 text-orange-800 border-orange-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
    blue: "bg-blue-100 text-blue-800 border-blue-200",
  };

  const sizes = {
    sm: "px-2 py-1 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
