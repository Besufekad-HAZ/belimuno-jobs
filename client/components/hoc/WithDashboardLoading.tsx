"use client";

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    // If dashboard loading is active, hide content until video completes
    if (isDashboardLoading) {
      setShowContent(false);
    } else {
      // Show content when dashboard loading is complete
      setShowContent(true);
    }
  }, [isDashboardLoading]);

  useEffect(() => {
    // If the component's isLoading prop becomes false and we're not showing dashboard loading,
    // make sure content is visible
    if (!isLoading && !isDashboardLoading) {
      setShowContent(true);
    }
  }, [isLoading, isDashboardLoading]);

  const handleLoadingComplete = () => {
    stopDashboardLoading();
    // Small delay to ensure smooth transition
    setTimeout(() => {
      setShowContent(true);
    }, 200);
  };

  return (
    <>
      <LogoAnimationLoader
        isVisible={isDashboardLoading}
        onComplete={handleLoadingComplete}
        duration={loadingDuration}
      />
      {/* Only show content when not in dashboard loading state */}
      {showContent && children}
    </>
  );
};

export default WithDashboardLoading;
