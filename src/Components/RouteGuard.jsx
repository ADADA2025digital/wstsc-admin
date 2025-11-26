import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import api from '../config/axiosConfig';
import Loader from '../Pages/Loader';

const RouteGuard = ({ children, requireProfileComplete = false }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      try {
        // Check if user is authenticated
        const token = Cookies.get('token');
        const authenticated = localStorage.getItem('authenticated');
        
        console.log('RouteGuard - Checking auth:', {
          token: !!token,
          authenticated,
          requireProfileComplete
        });

        if (!token || authenticated !== 'true') {
          console.log('RouteGuard - No auth, redirecting to login');
          navigate('/login');
          return;
        }

        // If profile completion is required, check it
        if (requireProfileComplete) {
          // FIRST: Check user_status in localStorage
          const userStatus = localStorage.getItem('user_status');
          
          console.log('RouteGuard - userStatus:', userStatus);

          if (userStatus !== 'active') {
            console.log('RouteGuard - Profile not active, redirecting to update-profile');
            navigate('/update-profile', { replace: true });
            return;
          }

          // SECONDARY: Also check API as fallback but don't block if localStorage says active
          const userData = localStorage.getItem('userData');
          if (userData) {
            const user = JSON.parse(userData);
            
            try {
              const response = await api.get(`/profile/check-completion/${user.id}`);
              const isProfileComplete = response.data.data?.profile_completed || false;
              
              console.log('RouteGuard - API profile completion:', isProfileComplete);
              
              // Only update localStorage if API returns different value
              if (!isProfileComplete && userStatus === 'active') {
                console.log('RouteGuard - API says incomplete, updating localStorage');
                localStorage.setItem('user_status', '');
                navigate('/update-profile', { replace: true });
                return;
              }
            } catch (error) {
              console.error('RouteGuard - Error checking profile completion:', error);
              // If API fails, rely on localStorage user_status only
              // Don't redirect if we already have active status
              if (!userStatus || userStatus !== 'active') {
                navigate('/update-profile', { replace: true });
                return;
              }
            }
          } else {
            // No user data at all, redirect to update profile
            console.log('RouteGuard - No user data, redirecting to update-profile');
            navigate('/update-profile', { replace: true });
            return;
          }
        }

        console.log('RouteGuard - All checks passed, rendering children');
        setIsChecking(false);
      } catch (error) {
        console.error('Route guard error:', error);
        // Don't immediately navigate to login, check if we have valid token
        const token = Cookies.get('token');
        if (!token) {
          navigate('/login');
        } else {
          setIsChecking(false);
        }
      }
    };

    checkAuthAndProfile();
  }, [navigate, requireProfileComplete]);

  if (isChecking) {
    return <Loader />;
  }

  return children;
};

export default RouteGuard;