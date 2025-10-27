"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLoading } from "@/contexts/LoadingContext";
import LogoAnimationLoader from "@/components/ui/LogoAnimationLoader";

interface WithDashboardLoadingProps {
  children: React.ReactNode;
  isLoading?: boolean;
  loadingDuration?: number;
}

const WithDashboardLoading: React.FC<WithDashboardLoadingProps> = ({
  children,
  isLoading = false,
  loadingDuration = 950,
}) => {
  const { isDashboardLoading, stopDashboardLoading } = useLoading();
  const loaderStorageKey = "belimuno:dashboard-loader-shown";
  const getStoredLoaderState = () =>
    typeof window === "undefined"
      ? false
      : window.sessionStorage.getItem(loaderStorageKey) === "true";

  const [hasSeenLoader, setHasSeenLoader] =
    useState<boolean>(getStoredLoaderState);
  const [animationComplete, setAnimationComplete] =
    useState<boolean>(getStoredLoaderState);
  const [showContent, setShowContent] = useState<boolean>(getStoredLoaderState);
  const wasPrimingRef = useRef(false);

  const isPriming = isDashboardLoading || isLoading;
  const loaderVisible = isPriming || (!animationComplete && !hasSeenLoader);
  // For repeat visits, use a compact short animation (around 1s) to improve perceived performance
  const effectiveDuration = hasSeenLoader
    ? Math.min(loadingDuration, 1000)
    : loadingDuration;
  const compact = hasSeenLoader;

  useEffect(() => {
    if (hasSeenLoader) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const stored = window.sessionStorage.getItem(loaderStorageKey) === "true";
    if (stored) {
      setHasSeenLoader(true);
      setAnimationComplete(true);
      setShowContent(true);
    }
  }, [hasSeenLoader, loaderStorageKey]);

  useEffect(() => {
    if (!hasSeenLoader) {
      return;
    }

    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(loaderStorageKey, "true");
    }
  }, [hasSeenLoader]);

  useEffect(() => {
    if (isPriming && !wasPrimingRef.current) {
      setAnimationComplete(false);
    }
    wasPrimingRef.current = isPriming;
  }, [isPriming]);

  useEffect(() => {
    if (!isLoading && isDashboardLoading) {
      stopDashboardLoading();
    }
  }, [isLoading, isDashboardLoading, stopDashboardLoading]);

  useEffect(() => {
    if (!hasSeenLoader && loaderVisible) {
      setShowContent(false);
      return;
    }

    const timer = window.setTimeout(
      () => {
        setShowContent(true);
      },
      hasSeenLoader ? 0 : 160,
    );

    return () => window.clearTimeout(timer);
  }, [loaderVisible, hasSeenLoader]);

  const handleAnimationComplete = () => {
    setAnimationComplete(true);
    if (!hasSeenLoader) {
      setHasSeenLoader(true);
    }
    if (isDashboardLoading) {
      stopDashboardLoading();
    }
  };

  return (
    <>
      <LogoAnimationLoader
        isVisible={loaderVisible}
        duration={effectiveDuration}
        compact={compact}
        onComplete={handleAnimationComplete}
      />
      {/* Keep content hidden only until the first intro animation completes */}
      {showContent && children}
    </>
  );
};

export default WithDashboardLoading;
