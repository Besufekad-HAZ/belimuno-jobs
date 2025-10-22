"use client";

import React, { useEffect, useState } from "react";

interface LogoAnimationLoaderProps {
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds
}

const LogoAnimationLoader: React.FC<LogoAnimationLoaderProps> = ({
  isVisible,
  onComplete,
  duration = 5000, // Default 5 seconds
}) => {
  const [showLoader, setShowLoader] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowLoader(true);
      setVideoLoaded(false);

      // Set a timer to complete the loading
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
        // Fade out animation
        setTimeout(() => {
          setShowLoader(false);
        }, 500);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete, duration]);

  const handleVideoLoad = () => {
    setVideoLoaded(true);
  };

  const handleVideoEnd = () => {
    if (onComplete) {
      onComplete();
    }
    // Fade out animation
    setTimeout(() => {
      setShowLoader(false);
    }, 500);
  };

  if (!showLoader) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4">
        {/* Video Container - Perfect Aspect Ratio, No Cropping */}
        <div className="relative mb-8 w-full max-w-4xl">
          <div className="relative w-full aspect-video bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
            <video
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
              loop
              onLoadedData={handleVideoLoad}
              onEnded={handleVideoEnd}
              onError={() => {
                console.log("Video failed to load");
                setVideoLoaded(true);
              }}
            >
              <source
                src="https://belimuno-uploads.s3.eu-north-1.amazonaws.com/public/videos/logo-animation.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>

            {/* Subtle Loading Ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-white/20 animate-spin" />
          </div>
        </div>

        {/* Loading Text */}
        <div className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Welcome to Belimuno
          </h2>
          <div className="flex items-center justify-center space-x-2">
            <div className="flex space-x-1">
              <div
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 bg-white rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-white/80 text-lg">
              Loading your dashboard
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-8 w-64 h-1 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: videoLoaded ? "100%" : "0%",
              transition: `width ${duration}ms ease-out`,
            }}
          />
        </div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse" />
        <div
          className="absolute top-1/3 right-1/4 w-1 h-1 bg-cyan-300/30 rounded-full animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-blue-300/20 rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-white/10 rounded-full animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </div>
    </div>
  );
};

export default LogoAnimationLoader;
