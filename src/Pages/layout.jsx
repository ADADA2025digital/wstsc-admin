import "../App.css";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import Header from "../Components/Header";
import Sidebar from "../Components/Sidebar";
import React, { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import api from "../config/axiosConfig.jsx";

export default function RootLayout() {
  const location = useLocation();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const [isFullScreen, setFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [userRoles, setUserRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = Cookies.get("token");
    const authenticated = localStorage.getItem("authenticated");
    return !!(token && authenticated === "true");
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setFullScreen(false);
      }
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setIsSidebarVisible(true);
      else setIsSidebarVisible(false);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch user roles on component mount
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (!isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.get('/roles');
        
        if (response.data && response.data.data) {
          setUserRoles(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch user roles:', error);
        // If we get a 401, the interceptor will handle logout and redirect
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRoles();
  }, []);

  const isLoginPage = location.pathname === "/login";

  // Show loading state while checking authentication
  if (isLoading && !isLoginPage) {
    return (
      <div className="App">
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated() && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if authenticated and on login page
  if (isAuthenticated() && isLoginPage) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="App">
      <div className="content-wrapper container-fluid overflow-y-auto vh-100 p-0">
        {!isLoginPage && (
          <>
            <Header
              setIsSidebarVisible={setIsSidebarVisible}
              isSidebarVisible={isSidebarVisible}
              setCollapsed={setCollapsed}
              collapsed={collapsed}
              sidebarRef={sidebarRef}
              toggleFullScreen={toggleFullScreen}
              isFullScreen={isFullScreen}
            />
            <Sidebar
              setIsSidebarVisible={setIsSidebarVisible}
              isSidebarVisible={isSidebarVisible}
              setCollapsed={setCollapsed}
              collapsed={collapsed}
              isMobile={isMobile}
              userRoles={userRoles} 
            />
          </>
        )}
        <div
          className="main-content px-2 pt-2"
          style={{
            zIndex: "999",
            marginTop: !isLoginPage ? "60px" : "0px",
            marginLeft: !isLoginPage ? (collapsed ? "80px" : "250px") : "0px",
            marginBottom: isMobile && !isLoginPage ? "60px" : "",
          }}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}