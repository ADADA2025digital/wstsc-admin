import { useState, useEffect } from 'react';

export const useUserData = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial data from localStorage FIRST
    const loadUserDataFromStorage = () => {
      const storedUserData = localStorage.getItem("userData");
      console.log("🔄 useUserData: Loading from localStorage:", storedUserData);
      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          console.log("✅ useUserData: Parsed user data from localStorage:", parsedData);
          setUserData(parsedData);
          setIsLoading(false);
          return parsedData;
        } catch (error) {
          console.error("❌ useUserData: Error parsing user data:", error);
          setIsLoading(false);
        }
      } else {
        console.log("ℹ️ useUserData: No user data found in localStorage");
        setIsLoading(false);
      }
      return null;
    };

    const storedData = loadUserDataFromStorage();

    // Only fetch from API if we don't have data in localStorage
    // or if we need to refresh the data
    if (!storedData) {
      fetchUserDataFromAPI();
    }

    // Listen for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "userData") {
        console.log("🔄 useUserData: Storage change detected");
        loadUserDataFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchUserDataFromAPI = async () => {
    try {
      setIsLoading(true);
      // This would be your API call to get user data
      // For now, we'll just set loading to false
      setIsLoading(false);
    } catch (error) {
      console.error("❌ useUserData: Error fetching from API:", error);
      setIsLoading(false);
    }
  };

  const updateUserData = (newData) => {
    console.log("🔄 useUserData: Updating user data with:", newData);
    
    // Ensure we have a clean object
    const updatedData = JSON.parse(JSON.stringify(newData));
    
    // Update state
    setUserData(updatedData);
    
    // Update localStorage - THIS IS THE SOURCE OF TRUTH
    localStorage.setItem("userData", JSON.stringify(updatedData));
    console.log("✅ useUserData: User data saved to localStorage");
    
    // Force a storage event to notify other components
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'userData',
      newValue: JSON.stringify(updatedData),
      oldValue: localStorage.getItem("userData"),
      storageArea: localStorage
    }));
    
    return updatedData;
  };

  const clearUserData = () => {
    setUserData(null);
    localStorage.removeItem("userData");
  };

  return { 
    userData, 
    updateUserData, 
    clearUserData,
    isLoading 
  };
};