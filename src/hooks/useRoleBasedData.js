// src/hooks/useRoleBasedData.js
import { useState, useEffect } from 'react';
import { useUserData } from './useUserData';
import api from '../config/axiosConfig';

export const useRoleBasedData = (endpoints) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userData } = useUserData();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentRole = userData?.primary_role?.role_name;
      const endpoint = endpoints[currentRole] || endpoints.default;

      if (!endpoint) {
        throw new Error(`No endpoint defined for role: ${currentRole}`);
      }

      console.log(`🔄 Fetching data for ${currentRole} role from: ${endpoint}`);
      
      const response = await api.get(endpoint);
      
      if (response.data && response.data.data) {
        setData(response.data.data);
      }

    } catch (err) {
      console.error("❌ Error fetching role-based data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchData();
    }
  }, [userData?.primary_role?.role_name]);

  return { data, loading, error, refetch: fetchData };
};