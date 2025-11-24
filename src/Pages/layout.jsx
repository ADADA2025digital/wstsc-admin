import "../App.css";
import { Outlet, useLocation, Navigate } from "react-router-dom";
import Header from "../Components/Header";
import Sidebar from "../Components/Sidebar";
import React, { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import api from "../config/axiosConfig.jsx";
import Loader from "../Pages/Loader";
import { useLoading } from "../Context/LoadingContext.jsx";

export default function RootLayout() {
  const location = useLocation();
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const [isFullScreen, setFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [userRoles, setUserRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { isGlobalLoading, loadingMessage } = useLoading();

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
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRoles();
  }, []);

  const isLoginPage = location.pathname === "/login";

  // Show global loading state during profile switching
  if (isGlobalLoading && !isLoginPage) {
    console.log("🔄 RootLayout: Showing global loader -", loadingMessage);
    return (
      <div className="App">
        <div className="global-loader-container">
          <Loader />
          {loadingMessage && (
            <div className="text-center mt-3">
              <p className="loading-message">{loadingMessage}</p>
              <p className="loading-sub-message">Please wait while we update your profile...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show loading state while checking authentication
  if (isLoading && !isLoginPage) {
    return <Loader />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated() && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to dashboard if authenticated and on login page
  if (isAuthenticated() && isLoginPage) {
    return <Navigate to="/" replace />;
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