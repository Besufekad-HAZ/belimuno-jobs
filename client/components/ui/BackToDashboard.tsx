import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import Button from "./Button";
import { getRoleDashboardPath } from "@/lib/auth";

interface BackToDashboardProps {
  currentRole: string;
  className?: string;
  variant?: "button" | "link" | "breadcrumb";
  showIcon?: boolean;
}

const BackToDashboard: React.FC<BackToDashboardProps> = ({
  currentRole,
  className = "",
  variant = "button",
  showIcon = true,
}) => {
  const router = useRouter();
  const dashboardPath = getRoleDashboardPath(currentRole);

  const handleBackToDashboard = () => {
    router.push(dashboardPath);
  };

  if (variant === "link") {
    return (
      <button
        onClick={handleBackToDashboard}
        className={`inline-flex items-center space-x-2 text-blue-600 hover:text-blue-500 transition-colors ${className}`}
      >
        {showIcon && <ArrowLeft className="w-4 h-4" />}
        <span>Back to Dashboard</span>
      </button>
    );
  }

  if (variant === "breadcrumb") {
    return (
      <nav className={`flex items-center space-x-2 text-sm ${className}`}>
        <button
          onClick={handleBackToDashboard}
          className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
        >
          {showIcon && <Home className="w-4 h-4" />}
          <span>Dashboard</span>
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-900 font-medium">Current Page</span>
      </nav>
    );
  }

  return (
    <Button
      onClick={handleBackToDashboard}
      variant="outline"
      className={`flex items-center space-x-2 ${className}`}
    >
      {showIcon && <ArrowLeft className="w-4 h-4" />}
      <span>Back to Dashboard</span>
    </Button>
  );
};

export default BackToDashboard;
