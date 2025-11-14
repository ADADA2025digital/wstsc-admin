import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/Styles/Style.css";
import Logo from "../assets/Images/fav.svg";
import Profile from "../assets/Images/profile.jpeg";
import HeaderIcon from "../Components/HeaderIcon";
import Dropdown from "../Components/Dropdown";
import Icon from "../Components/SideBarIcon";
import Cookies from "js-cookie";
import api from "../config/axiosConfig";

const Header = ({ setIsSidebarVisible, setCollapsed, toggleFullScreen }) => {
  const [isEnvelopeDropdownOpen, setEnvelopeDropdownOpen] = useState(false);
  const [isBellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [isBookmarkDropdownOpen, setBookmarkDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [rotate, setRotate] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(Profile);
  const [isProfileImageLoading, setProfileImageLoading] = useState(false);

  // Logout confirm modal state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const toggleIconRef = useRef(null);
  const bellDropdownRef = useRef(null);
  const bookmarkDropdownRef = useRef(null);
  const envelopeDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const navigate = useNavigate();

  // Function to fetch profile image
  const fetchProfileImage = async () => {
    setProfileImageLoading(true);
    try {
      console.log("🔄 Starting profile image fetch from /profile/person");
      
      const response = await api.get("/profile/person");
      
      console.log("✅ Profile API Response received");
      
      // Extract the image URL from the correct path based on your API response
      const imageUrl = response.data?.data?.profile?.photo_url;
      
      console.log("🖼️ Extracted image URL:", imageUrl);
      
      if (imageUrl) {
        console.log("🔍 Testing if image URL loads...");
        
        // Verify the image loads successfully
        const img = new Image();
        img.onload = () => {
          console.log("✅ Profile image loaded successfully");
          setProfileImage(imageUrl);
          setProfileImageLoading(false);
        };
        img.onerror = () => {
          console.warn("❌ Profile image failed to load, using fallback");
          setProfileImage(Profile);
          setProfileImageLoading(false);
        };
        img.src = imageUrl;
      } else {
        console.warn("⚠️ No image URL found, using fallback");
        setProfileImage(Profile);
        setProfileImageLoading(false);
      }
    } catch (error) {
      console.error("❌ Error fetching profile image:", error);
      setProfileImage(Profile);
      setProfileImageLoading(false);
    }
  };

  // Load user data from localStorage and fetch profile image
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      try {
        const parsedData = JSON.parse(storedUserData);
        setUserData(parsedData);
        
        // Fetch profile image
        fetchProfileImage();
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  const toggleBellDropdown = () => {
    setBellDropdownOpen((s) => !s);
    setBookmarkDropdownOpen(false);
    setEnvelopeDropdownOpen(false);
    setProfileDropdownOpen(false);
  };

  const toggleBookmarkDropdown = () => {
    setBookmarkDropdownOpen((s) => !s);
    setBellDropdownOpen(false);
    setEnvelopeDropdownOpen(false);
    setProfileDropdownOpen(false);
  };

  const toggleEnvelopeDropdown = () => {
    setEnvelopeDropdownOpen((s) => !s);
    setBellDropdownOpen(false);
    setBookmarkDropdownOpen(false);
    setProfileDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen((s) => !s);
    setBellDropdownOpen(false);
    setBookmarkDropdownOpen(false);
    setEnvelopeDropdownOpen(false);
  };

  const toggleSidebar = () => {
    setRotate(true);
    setIsSidebarVisible((prev) => !prev);
    setTimeout(() => setRotate(false), 500);
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close all dropdowns when clicking outside
  useEffect(() => {
    const refs = [
      bellDropdownRef,
      bookmarkDropdownRef,
      envelopeDropdownRef,
      profileDropdownRef,
      toggleIconRef,
    ];

    const handlePointerDown = (event) => {
      const clickedInside = refs.some(
        (r) => r.current && r.current.contains(event.target)
      );
      if (!clickedInside) {
        setBellDropdownOpen(false);
        setBookmarkDropdownOpen(false);
        setEnvelopeDropdownOpen(false);
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  // Close on Esc
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setBellDropdownOpen(false);
        setBookmarkDropdownOpen(false);
        setEnvelopeDropdownOpen(false);
        setProfileDropdownOpen(false);
        if (!loggingOut) setShowLogoutConfirm(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loggingOut]);

  const actuallyLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("authenticated");
    localStorage.removeItem("profileImage");

    const cookies = Cookies.get();
    Object.keys(cookies).forEach((cookieName) => {
      Cookies.remove(cookieName);
    });

    window.location.href = "/login";
  };

  const confirmLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      actuallyLogout();
    }, 800);
  };

  const cancelLogout = () => {
    if (loggingOut) return;
    setShowLogoutConfirm(false);
  };

  const handleFullScreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
    toggleFullScreen && toggleFullScreen();
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenMode = !!document.fullscreenElement;
      setIsFullScreen(fullscreenMode);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleDarkMode = () => {
    setIsLoading(true);
    setTimeout(() => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      document.body.classList.toggle("dark-mode", newMode);
      localStorage.setItem("darkMode", newMode);
      setIsLoading(false);
    }, 500);
  };

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(savedMode);
    if (savedMode) {
      document.body.classList.add("dark-mode");
    }
  }, []);

  return (
    <>
      {isLoading && (
        <div className="backdrop">
          <div className="spinner"></div>
        </div>
      )}

      <nav
        className={`navbar-top navbar navbar-expand-lg fixed-top d-flex align-items-center justify-content-between py-2 px-3 ${
          isFullScreen ? "fullscreen-mode" : "container-fluid"
        }`}
      >
        <div className="d-flex align-items-center justify-content-between gap-2">
          {!isMobile && (
            <Icon
              type="bi-grid"
              className={`fs-6 text-white cursor-pointer ${
                rotate ? "icon-rotate" : ""
              }`}
              onClick={() => {
                setCollapsed((prev) => !prev);
                setIsSidebarVisible(true);
                setRotate(true);
                setTimeout(() => setRotate(false), 500);
              }}
              style={{ cursor: "pointer" }}
            />
          )}

          {isMobile && (
            <Icon
              ref={toggleIconRef}
              type="bi-list"
              className={`fs-6 rounded circle text-white cursor-pointer ${
                rotate ? "icon-rotate" : ""
              }`}
              onClick={toggleSidebar}
            />
          )}

          {isMobile && <h4 className="text-white m-0">ADADA Dashboard</h4>}

          {!isMobile && (
            <Link
              to="/"
              className="navbar-brand d-flex align-items-center gap-2"
            >
              <span className="fw-bold">WSTSC</span>
            </Link>
          )}
        </div>

        <div className="d-flex align-items-center justify-content-between gap-3">
          {/* Welcome Message for Desktop */}
          {!isMobile && userData && (
            <div className="d-flex align-items-center text-white">
              <span className="fw-light me-2">
                Welcome to Western Sydney Tamil Study Center,
              </span>
              <span className="fw-bold">{userData.name}</span>
            </div>
          )}

          {!isMobile && (
            <HeaderIcon
              type={
                isFullScreen ? "bi-fullscreen-exit" : "bi-arrows-fullscreen"
              }
              onClick={handleFullScreenToggle}
            />
          )}

          {!isMobile && (
            <HeaderIcon
              type={isDarkMode ? "bi-brightness-high" : "bi-moon-stars"}
              onClick={toggleDarkMode}
            />
          )}

          <div ref={profileDropdownRef} className="position-relative">
            <div className="position-relative">
              {isProfileImageLoading && (
                <div className="position-absolute top-50 start-50 translate-middle">
                  <div className="spinner-border spinner-border-sm text-white" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              <img
                src={profileImage}
                alt="User Profile"
                className={`rounded-circle ${isProfileImageLoading ? 'opacity-25' : ''}`}
                style={{ 
                  width: "40px", 
                  height: "40px", 
                  cursor: "pointer",
                  objectFit: "cover"
                }}
                onClick={toggleProfileDropdown}
                onError={(e) => {
                  console.warn("Profile image load error, using fallback");
                  e.target.src = Profile;
                  setProfileImage(Profile);
                }}
              />
            </div>
            {isProfileDropdownOpen && (
              <div className="dropdown-menu top-100 position-absolute end-0 py-2 d-block shadow">
                <Link
                  to="/useraccount"
                  className="dropdown-item d-flex align-items-center"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  <i className="bi bi-person me-3"></i> Account
                </Link>
                <hr className="dropdown-divider" />
                <a
                  href="#logout"
                  className="dropdown-item d-flex align-items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setProfileDropdownOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                >
                  <i className="bi bi-box-arrow-right me-3"></i> Log Out
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {isMobile && (
        <nav className="navbar fixed-bottom d-flex justify-content-around py-2 px-3">
          <Link to="/">
            <HeaderIcon type="bi-house" />
          </Link>

          <div ref={bellDropdownRef}>
            <HeaderIcon type="bi-bell" onClick={toggleBellDropdown} />
            {isBellDropdownOpen && (
              <Dropdown
                title="Notifications"
                style={{ left: isMobile ? "8%" : "77%", bottom: "100%" }}
              />
            )}
          </div>

          <div ref={bookmarkDropdownRef}>
            <HeaderIcon type="bi-bookmark" onClick={toggleBookmarkDropdown} />
            {isBookmarkDropdownOpen && (
              <Dropdown
                title="Bookmarks"
                style={{ left: isMobile ? "8%" : "80%", bottom: "100%" }}
              />
            )}
          </div>

          <div ref={envelopeDropdownRef}>
            <HeaderIcon type="bi-envelope" onClick={toggleEnvelopeDropdown} />
            {isEnvelopeDropdownOpen && (
              <Dropdown
                title="Messages"
                style={{ left: "8%", bottom: "100%" }}
              />
            )}
          </div>

          <HeaderIcon
            type={isDarkMode ? "bi-brightness-high" : "bi-moon-stars"}
            onClick={toggleDarkMode}
          />
        </nav>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                  Confirm Logout
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={cancelLogout}
                  disabled={loggingOut}
                ></button>
              </div>

              <div className="modal-body text-center">
                <div className="mb-3">
                  <i
                    className="bi bi-door-open text-danger"
                    style={{ fontSize: "3rem" }}
                  ></i>
                </div>

                <h6 className="mb-3">
                  Are you sure you want to <strong>log out</strong>?
                </h6>

                <p className="text-muted small">
                  You'll be signed out from this device. You can sign back in
                  anytime.
                </p>

                {loggingOut && (
                  <div className="mt-3">
                    <div
                      className="spinner-border spinner-border-sm text-primary me-2"
                      role="status"
                    >
                      <span className="visually-hidden">Logging out...</span>
                    </div>
                    <span className="text-muted">Logging out...</span>
                  </div>
                )}
              </div>

              <div className="modal-footer justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={cancelLogout}
                  disabled={loggingOut}
                >
                  <i className="bi bi-x-circle me-2"></i> Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Logging out...</span>
                      </span>
                      Logging out...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-right me-2"></i> Yes, Log
                      Out
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;