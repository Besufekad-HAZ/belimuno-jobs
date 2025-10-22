"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface LoadingContextType {
  isDashboardLoading: boolean;
  startDashboardLoading: () => void;
  stopDashboardLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);

  const startDashboardLoading = () => {
    setIsDashboardLoading(true);
  };

  const stopDashboardLoading = () => {
    setIsDashboardLoading(false);
  };

  return (
    <LoadingContext.Provider
      value={{
        isDashboardLoading,
        startDashboardLoading,
        stopDashboardLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
