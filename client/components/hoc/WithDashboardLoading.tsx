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
  loadingDuration = 5000,
}) => {
  const { isDashboardLoading, stopDashboardLoading } = useLoading();
  const [showContent, setShowContent] = useState(false);
  const [videoComplete, setVideoComplete] = useState(false);
  const wasPrimingRef = useRef(false);

  const isPriming = isDashboardLoading || isLoading;
  const loaderVisible = isPriming || !videoComplete;

  useEffect(() => {
    if (isPriming && !wasPrimingRef.current) {
      setVideoComplete(false);
    }
    wasPrimingRef.current = isPriming;
  }, [isPriming]);

  useEffect(() => {
    if (!isLoading && isDashboardLoading) {
      stopDashboardLoading();
    }
  }, [isLoading, isDashboardLoading, stopDashboardLoading]);

  useEffect(() => {
    if (loaderVisible) {
      setShowContent(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowContent(true);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [loaderVisible]);

  const handleVideoComplete = () => {
    setVideoComplete(true);
  };

  return (
    <>
      <LogoAnimationLoader
        isVisible={loaderVisible}
        duration={loadingDuration}
        onComplete={handleVideoComplete}
      />
      {/* Only show content when not in dashboard loading state */}
      {showContent && children}
    </>
  );
};

export default WithDashboardLoading;
