import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "https://wstsc.org.au/backend/api",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 300000,
});

// Request interceptor - ADD AUTHENTICATION
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url
    });
    
    // Only logout on 401 if it's not a profile-related endpoint during setup
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      
      // Don't auto-logout for profile endpoints during setup
      if (url.includes('/profile/') && !url.includes('/check-completion')) {
        console.log('Profile API 401 - might be expected during setup');
        return Promise.reject(error);
      }
      
      // Clear authentication data
      localStorage.removeItem("userData");
      localStorage.removeItem("authenticated");
      localStorage.removeItem("user_status");
      localStorage.removeItem("profile_completed");
      Cookies.remove("token");
      Cookies.remove("user_id");
      Cookies.remove("role_id");
      
      // Redirect to login
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default api;