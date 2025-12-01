import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import Loader from '../Pages/Loader';

const RouteGuard = ({ children, requireProfileComplete = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      try {
        // Check if user is authenticated
        const token = Cookies.get('token');
        const authenticated = localStorage.getItem('authenticated');
        const userStatus = localStorage.getItem('user_status');
        
        console.log('RouteGuard - Auth check:', {
          token: !!token,
          authenticated,
          userStatus,
          requireProfileComplete,
          currentPath: location.pathname
        });

        if (!token || authenticated !== 'true') {
          console.log('RouteGuard - No auth, redirecting to login');
          navigate('/login');
          return;
        }

        // If profile completion is required, check user_status
        // BUT allow access to update-profile route even if profile is not complete
        if (requireProfileComplete && location.pathname !== '/dashboard/update-profile') {
          console.log('RouteGuard - Checking user_status:', userStatus);

          // If userStatus is active, allow access immediately
          if (userStatus === 'active') {
            console.log('✅ RouteGuard - user_status is ACTIVE, allowing access');
            setIsChecking(false);
            return;
          }

          // If no userStatus or not active, redirect to update profile
          if (!userStatus || userStatus === '') {
            console.log('❌ RouteGuard - user_status is EMPTY, redirecting to update-profile');
            navigate('/dashboard/update-profile', { replace: true });
            return;
          }
        }

        console.log('RouteGuard - All checks passed, rendering children');
        setIsChecking(false);
      } catch (error) {
        console.error('Route guard error:', error);
        const token = Cookies.get('token');
        if (!token) {
          navigate('/login');
        } else {
          setIsChecking(false);
        }
      }
    };

    checkAuthAndProfile();
  }, [navigate, requireProfileComplete, location.pathname]);

  if (isChecking) {
    return <Loader />;
  }

  return children;
};

export default RouteGuard;