import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('token');
      if (!token) {
        navigate('/login');
        return;
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthGuard;