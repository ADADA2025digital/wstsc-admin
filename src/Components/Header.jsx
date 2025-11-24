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
  const [isSwitchProfileOpen, setSwitchProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [rotate, setRotate] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [profileImage, setProfileImage] = useState(Profile);
  const [isProfileImageLoading, setProfileImageLoading] = useState(false);

  // Switch profile modal state
  const [showSwitchProfile, setShowSwitchProfile] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [switchingProfile, setSwitchingProfile] = useState(false);

  // Logout confirm modal state
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const toggleIconRef = useRef(null);
  const bellDropdownRef = useRef(null);
  const bookmarkDropdownRef = useRef(null);
  const envelopeDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const switchProfileRef = useRef(null);

  const navigate = useNavigate();

  // Function to fetch profile image
  const fetchProfileImage = async () => {
    setProfileImageLoading(true);
    try {
      // console.log("🔄 Starting profile image fetch from /profile/person");

      const response = await api.get("/profile/person");

      // console.log("✅ Profile API Response received");

      // Extract the image URL from the correct path based on your API response
      const imageUrl = response.data?.data?.profile?.photo_url;

      // console.log("🖼️ Extracted image URL:", imageUrl);

      if (imageUrl) {
        console.log("🔍 Testing if image URL loads...");

        // Verify the image loads successfully
        const img = new Image();
        img.onload = () => {
          // console.log("✅ Profile image loaded successfully");
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
        // console.warn("⚠️ No image URL found, using fallback");
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

        // Mock data for available profiles - replace with actual API call
        setAvailableProfiles([
          {
            id: 1,
            name: "Deniya Edwinraj",
            email: parsedData.email,
            role: "Personal Account",
            avatar: profileImage,
            current: true,
          },
          {
            id: 2,
            name: "ADADA Digital",
            email: "adada@example.com",
            role: "Business Profile",
            avatar:
              "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=100&h=100&fit=crop&crop=face",
          },
          {
            id: 3,
            name: "Student Profile",
            email: "student@example.com",
            role: "Education",
            avatar:
              "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
          },
          {
            id: 4,
            name: "Developer Account",
            email: "dev@example.com",
            role: "Technical",
            avatar:
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
          },
        ]);
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
    setSwitchProfileOpen(false);
  };

  const toggleBookmarkDropdown = () => {
    setBookmarkDropdownOpen((s) => !s);
    setBellDropdownOpen(false);
    setEnvelopeDropdownOpen(false);
    setProfileDropdownOpen(false);
    setSwitchProfileOpen(false);
  };

  const toggleEnvelopeDropdown = () => {
    setEnvelopeDropdownOpen((s) => !s);
    setBellDropdownOpen(false);
    setBookmarkDropdownOpen(false);
    setProfileDropdownOpen(false);
    setSwitchProfileOpen(false);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen((s) => !s);
    setBellDropdownOpen(false);
    setBookmarkDropdownOpen(false);
    setEnvelopeDropdownOpen(false);
    setSwitchProfileOpen(false);
  };

  const toggleSwitchProfile = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSwitchProfileOpen((s) => !s);
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
    const handlePointerDown = (event) => {
      const refs = [
        bellDropdownRef,
        bookmarkDropdownRef,
        envelopeDropdownRef,
        profileDropdownRef,
        switchProfileRef,
        toggleIconRef,
      ];

      const clickedInside = refs.some(
        (r) => r.current && r.current.contains(event.target)
      );

      if (!clickedInside) {
        setBellDropdownOpen(false);
        setBookmarkDropdownOpen(false);
        setEnvelopeDropdownOpen(false);
        setProfileDropdownOpen(false);
        setSwitchProfileOpen(false);
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
        setSwitchProfileOpen(false);
        if (!loggingOut && !switchingProfile) {
          setShowLogoutConfirm(false);
          setShowSwitchProfile(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [loggingOut, switchingProfile]);

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

  // Switch Profile Functions
  const openSwitchProfileModal = () => {
    setSwitchProfileOpen(false);
    setProfileDropdownOpen(false);
    setShowSwitchProfile(true);
  };

  const closeSwitchProfileModal = () => {
    if (switchingProfile) return;
    setShowSwitchProfile(false);
  };

  const handleSwitchProfile = (profile) => {
    if (switchingProfile || profile.current) return;

    setSwitchingProfile(true);

    // Simulate API call to switch profile
    setTimeout(() => {
      console.log("Switching to profile:", profile);

      // Update the current profile
      const updatedProfiles = availableProfiles.map((p) => ({
        ...p,
        current: p.id === profile.id,
      }));
      setAvailableProfiles(updatedProfiles);
      // console.log(updatedProfiles);

      // Update current user data
      if (userData) {
        const updatedUserData = {
          ...userData,
          name: profile.name,
          email: profile.email,
        };
        setUserData(updatedUserData);
        localStorage.setItem("userData", JSON.stringify(updatedUserData));
      }

      setSwitchingProfile(false);
      setSwitchProfileOpen(false);
      setProfileDropdownOpen(false);

      // Show success message
      console.log(`Switched to ${profile.name} successfully!`);
    }, 1000);
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
                  <div
                    className="spinner-border spinner-border-sm text-white"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              )}
              <img
                src={profileImage}
                alt="User Profile"
                className={`rounded-circle ${
                  isProfileImageLoading ? "opacity-25" : ""
                }`}
                style={{
                  width: "40px",
                  height: "40px",
                  cursor: "pointer",
                  objectFit: "cover",
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
              <div
                className="dropdown-menu top-100 position-absolute end-0 py-2 d-block shadow rounded-0"
                style={{ minWidth: "200px" }}
              >
                <Link
                  to="/useraccount"
                  className="dropdown-item d-flex align-items-center justify-content-end"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  Account <i className="bi bi-person ms-3"></i>
                </Link>

                {/* Switch Profile Menu Item with Submenu */}
                <div className="dropdown-item position-relative p-0">
                  <div
                    className="d-flex align-items-center justify-content-between text-decoration-none text-dark w-100 px-3 py-2"
                    style={{ cursor: "pointer" }}
                    onClick={toggleSwitchProfile}
                  >
                    <i className="bi bi-chevron-left small"></i>

                    <span className="d-flex align-items-center text-dark">
                      Switch Profile <i className="bi bi-arrow-repeat ms-3"></i>
                    </span>
                  </div>

                  {/* Switch Profile Submenu - Now on LEFT side */}
                  {isSwitchProfileOpen && (
                    <div
                      ref={switchProfileRef}
                      className="dropdown-menu position-absolute end-100 top-0 mt-0 shadow rounded-0"
                      style={{
                        minWidth: "280px",
                        marginRight: "1px",
                        display: "block",
                      }}
                    >
                      <div className="px-3 py-2 border-bottom">
                        <h6 className="mb-1 fw-bold">Switch Profiles</h6>
                        <p className="text-muted small mb-0">
                          Choose a different profile
                        </p>
                      </div>

                      <div className="py-2">
                        {availableProfiles.slice(0, 3).map((profile) => (
                          <div
                            key={profile.id}
                            className={`profile-item d-flex align-items-center px-3 py-2 ${
                              profile.current ? "bg-light" : "hover-bg"
                            }`}
                            style={{
                              cursor:
                                switchingProfile || profile.current
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                switchingProfile && !profile.current ? 0.6 : 1,
                            }}
                            onClick={() => handleSwitchProfile(profile)}
                          >
                            <img
                              src={profile.avatar}
                              alt={profile.name}
                              className="rounded-circle me-3"
                              style={{
                                width: "40px",
                                height: "40px",
                                objectFit: "cover",
                              }}
                            />
                            <div className="flex-grow-1">
                              <h6 className="mb-0 fw-semibold">
                                {profile.name}
                              </h6>
                              <p className="text-muted small mb-0">
                                {profile.role}
                              </p>
                            </div>
                            {profile.current ? (
                              <i className="bi bi-check-circle-fill text-success"></i>
                            ) : (
                              <i className="bi bi-circle"></i>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="border-top">
                        <button
                          className="dropdown-item d-flex align-items-center"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openSwitchProfileModal();
                          }}
                        >
                          <i className="bi bi-person-rolodex me-2"></i>
                          See all profiles
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <hr className="dropdown-divider" />
                <a
                  href="#logout"
                  className="dropdown-item d-flex align-items-center justify-content-end"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setProfileDropdownOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                >
                  Log Out <i className="bi bi-box-arrow-right ms-3"></i>
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Rest of your mobile nav and modals remain the same */}
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

      {/* Switch Profile Modal (Full View) */}
      {showSwitchProfile && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: "500px" }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-circle me-2"></i> Switch Profile
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeSwitchProfileModal}
                  disabled={switchingProfile}
                ></button>
              </div>

              <div className="modal-body">
                <p className="text-muted mb-3">
                  Choose a profile to switch to. Each profile has different
                  settings and permissions.
                </p>

                <div className="profiles-list">
                  {availableProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className={`profile-item d-flex align-items-center p-3 mb-2 rounded ${
                        profile.current
                          ? "bg-light border border-success"
                          : "hover-bg"
                      }`}
                      style={{
                        cursor:
                          switchingProfile || profile.current
                            ? "not-allowed"
                            : "pointer",
                        opacity: switchingProfile && !profile.current ? 0.6 : 1,
                      }}
                      onClick={() => handleSwitchProfile(profile)}
                    >
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="rounded-circle me-3"
                        style={{
                          width: "50px",
                          height: "50px",
                          objectFit: "cover",
                        }}
                      />
                      <div className="flex-grow-1">
                        <h6 className="mb-1 fw-semibold">
                          {profile.name}
                          {profile.current && (
                            <span className="badge bg-success ms-2">
                              Current
                            </span>
                          )}
                        </h6>
                        <p className="text-muted small mb-1">{profile.email}</p>
                        <span className="badge bg-secondary">
                          {profile.role}
                        </span>
                      </div>
                      {profile.current ? (
                        <i className="bi bi-check-circle-fill text-success fs-5"></i>
                      ) : (
                        <i className="bi bi-chevron-right text-muted"></i>
                      )}
                    </div>
                  ))}
                </div>

                {switchingProfile && (
                  <div className="text-center mt-3">
                    <div
                      className="spinner-border spinner-border-sm text-primary me-2"
                      role="status"
                    >
                      <span className="visually-hidden">
                        Switching profile...
                      </span>
                    </div>
                    <span className="text-muted">Switching profile...</span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeSwitchProfileModal}
                  disabled={switchingProfile}
                >
                  <i className="bi bi-x-circle me-2"></i> Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
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
