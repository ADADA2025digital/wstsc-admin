import React, { createContext, useContext, useState } from 'react';

const LoadingContext = createContext();

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export const LoadingProvider = ({ children }) => {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const startGlobalLoading = (message = 'Loading...') => {
    console.log(`🔄 Starting global loading: ${message}`);
    setIsGlobalLoading(true);
    setLoadingMessage(message);
  };

  const stopGlobalLoading = () => {
    console.log("🛑 Stopping global loading");
    setIsGlobalLoading(false);
    setLoadingMessage('');
  };

  return (
    <LoadingContext.Provider
      value={{
        isGlobalLoading,
        loadingMessage,
        startGlobalLoading,
        stopGlobalLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};