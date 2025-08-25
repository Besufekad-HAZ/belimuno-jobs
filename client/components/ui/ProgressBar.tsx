import React from "react";

interface ProgressBarProps {
  progress: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green" | "yellow" | "red" | "purple";
  showPercentage?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  className = "",
  size = "md",
  color = "blue",
  showPercentage = true,
}) => {
  // Normalize and clamp the progress to avoid NaN/invalid values
  const numeric = typeof progress === "number" ? progress : Number(progress);
  const safeProgress = Number.isFinite(numeric) ? numeric : 0;
  const clampedProgress = Math.min(Math.max(safeProgress, 0), 100);

  const sizes = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };

  const colors = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    yellow: "bg-yellow-600",
    red: "bg-red-600",
    purple: "bg-purple-600",
  };

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm font-medium text-gray-700">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizes[size]}`}>
        <div
          className={`${colors[color]} ${sizes[size]} rounded-full transition-all duration-300 ease-in-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
