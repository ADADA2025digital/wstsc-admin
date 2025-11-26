import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import Loader from '../Pages/Loader';

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('token');
      const authenticated = localStorage.getItem('authenticated');
      
      console.log('AuthGuard - Checking:', {
        token: !!token,
        authenticated
      });

      if (!token || authenticated !== 'true') {
        console.log('AuthGuard - Not authenticated, redirecting to login');
        navigate('/login');
        return;
      }
      
      console.log('AuthGuard - Authenticated, proceeding');
      setIsChecking(false);
    };

    checkAuth();
  }, [navigate]);

  if (isChecking) {
    return <Loader />;
  }

  return children;
};

export default AuthGuard;