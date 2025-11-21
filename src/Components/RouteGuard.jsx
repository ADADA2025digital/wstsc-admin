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
        if (!token) {
          navigate('/login');
          return;
        }

        // If profile completion is required, check it
        if (requireProfileComplete) {
          const userData = localStorage.getItem('userData');
          if (userData) {
            const user = JSON.parse(userData);
            
            try {
              const response = await api.get(`/profile/check-completion/${user.id}`);
              const isProfileComplete = response.data.data?.profile_completed || false;
              
              if (!isProfileComplete) {
                navigate('/update-profile');
                return;
              }
            } catch (error) {
              console.error('Error checking profile completion:', error);
              // If API fails, check local storage as fallback
              const localProfileComplete = localStorage.getItem('profile_completed') === 'true';
              if (!localProfileComplete) {
                navigate('/update-profile');
                return;
              }
            }
          }
        }

        setIsChecking(false);
      } catch (error) {
        console.error('Route guard error:', error);
        navigate('/login');
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