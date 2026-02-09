"use client";

import Image from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface LogoAnimationLoaderProps {
  isVisible: boolean;
  onComplete?: () => void;
  duration?: number; // Duration in milliseconds for the slide animation
  fadeDuration?: number; // Fade out duration in milliseconds
  compact?: boolean; // when true, render a lightweight, short animation for repeat views
}

const LogoAnimationLoader: React.FC<LogoAnimationLoaderProps> = ({
  isVisible,
  onComplete,
  duration = 950,
  fadeDuration = 240,
  compact = false,
}) => {
  const TAIL_PLAYBACK_SECONDS = 1;
  const logoSrc = "/belimuno-logo.png";
  const [isClient, setIsClient] = useState(false);
  const [isMounted, setIsMounted] = useState(false); // Start as false to prevent SSR rendering
  const [isShowing, setIsShowing] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasSeekedToTail, setHasSeekedToTail] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(compact);
  const completionRef = useRef(false);
  const pendingTailPlaybackRef = useRef(false);
  
  const resolvedDuration = useMemo(() => {
    if (compact) {
      return Math.min(duration, 1000);
    }
    return Math.max(duration, TAIL_PLAYBACK_SECONDS * 1000 + 200);
  }, [compact, duration]);

  // Ensure we only render on client side to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return; // Don't run effects during SSR

    if (!isVisible) {
      setIsShowing(false);
      const timer = window.setTimeout(() => {
        setIsMounted(false);
        setIsSliding(false);
        setIsVideoReady(compact);
      }, fadeDuration);

      return () => window.clearTimeout(timer);
    }

    setIsMounted(true);
    setIsSliding(false);
    setHasSeekedToTail(false);
    setIsVideoReady(compact);
    completionRef.current = false;

    const frame = requestAnimationFrame(() => {
      setIsShowing(true);
      setIsSliding(true);
    });

    const durationTimer = window.setTimeout(() => {
      if (!completionRef.current) {
        completionRef.current = true;
        setIsVideoReady(true);
        if (onComplete) {
          onComplete();
        }
      }
    }, resolvedDuration);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(durationTimer);
    };
  }, [isClient, compact, fadeDuration, isVisible, onComplete, resolvedDuration]);

  // Prevent hydration mismatch - don't render anything during SSR
  if (!isClient || typeof document === "undefined" || !isMounted) return null;

  const seekToTail = () => {
    if (compact) {
      return;
    }

    const video = videoRef.current;
    if (
      !video ||
      Number.isNaN(video.duration) ||
      video.duration === Infinity ||
      video.duration === 0
    ) {
      return;
    }

    const tailOffset = Math.max(video.duration - TAIL_PLAYBACK_SECONDS, 0);
    try {
      pendingTailPlaybackRef.current = true;
      video.pause();
      video.currentTime = tailOffset;
    } catch {
      // If seeking fails, let the video play from the start as a fallback
      const playPromise = video.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch(() => undefined);
      }
      setHasSeekedToTail(true);
      setIsVideoReady(true);
    }
  };

  const handleLoadedMetadata = () => {
    seekToTail();
  };

  const handleCanPlay = () => {
    if (!hasSeekedToTail) {
      seekToTail();
    }
    if (compact) {
      setIsVideoReady(true);
    }
  };

  const handleSeeked = () => {
    if (!pendingTailPlaybackRef.current) {
      return;
    }

    pendingTailPlaybackRef.current = false;
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const playPromise = video.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise.catch(() => undefined);
    }
    setHasSeekedToTail(true);
    setIsVideoReady(true);
  };

  const handlePlay = () => {
    if (!compact) {
      setIsVideoReady(true);
    }
  };

  const handleError = () => {
    if (completionRef.current) {
      return;
    }
    completionRef.current = true;
    setIsVideoReady(true);
    if (onComplete) {
      onComplete();
    }
  };

  // Render compact (lightweight) variant for repeat views to speed up navigation
  const loader = compact ? (
    <div
      className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur transition-opacity"
      style={{
        opacity: isShowing ? 1 : 0,
        transitionDuration: `${Math.min(fadeDuration, 200)}ms`,
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_-10%,rgba(59,130,246,0.18),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_120%,rgba(6,182,212,0.16),transparent_45%)]" />
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <div className="overflow-hidden rounded-3xl border border-white/30 bg-white p-6 shadow-xl shadow-cyan-900/20">
          <Image
            src={logoSrc}
            alt="Belimuno Jobs"
            width={256}
            height={88}
            priority
            className="h-16 w-auto object-contain drop-shadow-lg"
          />
        </div>
        <div className="w-48 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-1.5 origin-left rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500"
            style={{
              transform: isSliding ? "scaleX(1)" : "scaleX(0)",
              transition: `transform ${resolvedDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            }}
          />
        </div>
        <p className="text-sm font-medium tracking-wide text-white/80">
          Loading your workspace…
        </p>
      </div>
    </div>
  ) : (
    <div
      className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm transition-opacity"
      style={{
        opacity: isShowing ? 1 : 0,
        transitionDuration: `${fadeDuration}ms`,
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_-10%,rgba(59,130,246,0.28),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_120%,rgba(6,182,212,0.22),transparent_45%)]" />

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="flex flex-col items-center gap-6">
          <div className="overflow-hidden rounded-3xl border border-white/40 bg-white p-8 shadow-xl shadow-cyan-900/25">
            <Image
              src={logoSrc}
              alt="Belimuno Jobs"
              width={320}
              height={110}
              priority
              className="h-20 w-auto object-contain drop-shadow-xl"
            />
          </div>
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur"
            style={{
              opacity: isVideoReady ? 1 : 0.8,
              transition: "opacity 220ms ease",
            }}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              autoPlay
              muted
              playsInline
              preload="auto"
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={handleCanPlay}
              onSeeked={handleSeeked}
              onPlay={handlePlay}
              onEnded={() => {
                if (completionRef.current) return;
                completionRef.current = true;
                setIsVideoReady(true);
                if (onComplete) {
                  onComplete();
                }
              }}
              onError={handleError}
            >
              <source
                src="https://belimuno-uploads.s3.eu-north-1.amazonaws.com/public/videos/logo-animation.mp4"
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
            <div
              className="pointer-events-none absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
              style={{ opacity: isVideoReady ? 0 : 1 }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center space-y-4">
          <div className="w-48 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-1.5 origin-left rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500"
              style={{
                transform: isSliding ? "scaleX(1)" : "scaleX(0)",
                transition: `transform ${resolvedDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            />
          </div>
          <p className="text-sm font-medium tracking-wide text-white/90">
            Syncing your workspace…
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(loader, document.body);
};

export default LogoAnimationLoader;
