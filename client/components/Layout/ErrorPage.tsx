import React from "react";

interface ErrorPageProps {
  message?: string;
  onRetry?: () => void;
}

function ErrorPage({
  message = "An error occurred. Please try again.",
  onRetry,
}: ErrorPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-[#2e4b8b] mb-6">
        <svg
          className="h-24 w-24"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <p className="text-gray-700 text-lg text-center mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[#2e4b8b] text-white rounded-md hover:bg-[#1a2b5c] focus:outline-none focus:ring-2 focus:ring-[#2e4b8b] focus:ring-offset-2 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorPage;
