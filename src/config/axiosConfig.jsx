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
    // console.log('Making request to:', config.url);
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
    // console.log('Response success:', {
    //   status: response.status,
    //   url: response.config.url
    // });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url
    });
    
    // Auto logout on 401 Unauthorized
    if (error.response?.status === 401) {
      // Clear authentication data
      localStorage.removeItem("userData");
      localStorage.removeItem("authenticated");
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