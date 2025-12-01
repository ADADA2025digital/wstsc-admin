import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../assets/Styles/Style.css";
import Logo from "../assets/Images/fav.svg";
import Profile from "../assets/Images/profile.jpeg";
import HeaderIcon from "../Components/HeaderIcon";
import Dropdown from "../Components/Dropdown";
import Icon from "../Components/SideBarIcon";
import Loader from "../Pages/Loader";
import Cookies from "js-cookie";
import api from "../config/axiosConfig";
import { useLoading } from "../Context/LoadingContext";
import { useUserData } from "../hooks/useUserData";
import {
  syncUserRole,
  verifyRoleSync,
  shouldRefreshFromAPI,
} from "../utils/roleSync";

const Header = ({ setIsSidebarVisible, setCollapsed, toggleFullScreen }) => {
  const [isEnvelopeDropdownOpen, setEnvelopeDropdownOpen] = useState(false);
  const [isBellDropdownOpen, setBellDropdownOpen] = useState(false);
  const [isBookmarkDropdownOpen, setBookmarkDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isSwitchProfileOpen, setSwitchProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isDarkModeLoading, setIsDarkModeLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [rotate, setRotate] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [profileImage, setProfileImage] = useState(Profile);
  const [isProfileImageLoading, setProfileImageLoading] = useState(false);

  const [showSwitchProfile, setShowSwitchProfile] = useState(false);
  const [availableProfiles, setAvailableProfiles] = useState([]);
  const [switchingProfile, setSwitchingProfile] = useState(false);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const toggleIconRef = useRef(null);
  const bellDropdownRef = useRef(null);
  const bookmarkDropdownRef = useRef(null);
  const envelopeDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const switchProfileRef = useRef(null);

  const navigate = useNavigate();
  const { startGlobalLoading, stopGlobalLoading } = useLoading();
  const {
    userData,
    updateUserData,
    isLoading: userDataLoading,
  } = useUserData();

  const createProfilesFromRoles = (profileData) => {
    if (!profileData || !profileData.all_roles) return [];

    const profiles = profileData.all_roles.map((role, index) => ({
      id: role.roleid || index + 1,
      name: profileData.full_name,
      email: profileData.email,
      role: role.display_name,
      role_name: role.role_name,
      avatar: profileData.photo_url || Profile,
      current: role.role_name === profileData.primary_role?.role_name,
      is_primary: role.is_primary,
      assigned_at: role.assigned_at,
    }));

    console.log("👥 Created profiles from roles:", profiles);
    return profiles;
  };

  const debugRoleSwitch = (profile) => {
    console.log("=== DEBUG ROLE SWITCH ===");
    console.log("Switching to profile:", profile);
    console.log("Current userData:", userData);
    console.log("Available profiles:", availableProfiles);
    console.log(
      "LocalStorage before switch:",
      localStorage.getItem("userData")
    );
    console.log("=== END DEBUG ===");
  };

  const fetchUserProfile = async () => {
    // Check if we recently switched roles - if so, DON'T fetch from API
    const roleSwitchComplete = localStorage.getItem("roleSwitchComplete");
    const lastRoleSwitch = localStorage.getItem("lastRoleSwitch");

    if (roleSwitchComplete === "true" && lastRoleSwitch) {
      const switchTime = new Date(lastRoleSwitch);
      const currentTime = new Date();
      const timeDiff = currentTime - switchTime;
      const minutesDiff = timeDiff / (1000 * 60);

      if (minutesDiff < 5) {
        console.log("🔄 Header: Recently switched roles, skipping API fetch");
        // Just use existing localStorage data
        if (userData) {
          const profilesFromRoles = createProfilesFromRoles(userData);
          setAvailableProfiles(profilesFromRoles);
          if (userData.photo_url) {
            setProfileImage(userData.photo_url);
          }
        }
        setProfileImageLoading(false);
        return;
      }
    }

    // Only fetch from API if we don't have data
    if (userData) {
      console.log("🔄 Header: Using existing user data from localStorage");
      console.log("📊 Current role in userData:", userData.primary_role);

      const profilesFromRoles = createProfilesFromRoles(userData);
      setAvailableProfiles(profilesFromRoles);

      if (userData.photo_url) {
        setProfileImage(userData.photo_url);
      }

      setProfileImageLoading(false);
      return;
    }

    // Only fetch from API if no data exists
    setProfileImageLoading(true);
    try {
      console.log("🔄 Header: No user data found, fetching from API");

      const response = await api.get("/profile/person");
      const profileData = response.data?.data?.profile;

      if (profileData) {
        const userDataFromApi = {
          name: profileData.full_name,
          email: profileData.email,
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          peid: profileData.peid,
          user_id: profileData.user_id,
          primary_role: profileData.primary_role,
          all_roles: profileData.all_roles,
          photo_url: profileData.photo_url,
        };

        console.log("🔄 Header: Setting initial data from API");
        updateUserData(userDataFromApi);

        const profilesFromRoles = createProfilesFromRoles(profileData);
        setAvailableProfiles(profilesFromRoles);

        if (profileData.photo_url) {
          setProfileImage(profileData.photo_url);
        }
      }
    } catch (error) {
      console.error("❌ Header: Error fetching user profile:", error);
    } finally {
      setProfileImageLoading(false);
    }
  };

  // Listen for profile updates from EditProfile
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log("🔄 Header: Profile update event received", event.detail);
      if (event.detail?.photo_url) {
        console.log("📸 Header: Updating profile image to:", event.detail.photo_url);
        setProfileImage(event.detail.photo_url);
      }
      fetchUserProfile(); // Refresh entire profile data
    };

    const handleForceRefresh = () => {
      console.log("🔄 Header: Force refresh triggered");
      fetchUserProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('forceRefresh', handleForceRefresh);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('forceRefresh', handleForceRefresh);
    };
  }, []);

  // Listen for userData changes from the hook
  useEffect(() => {
    if (userData?.photo_url && userData.photo_url !== profileImage) {
      console.log("🔄 Header: userData photo_url changed", userData.photo_url);
      setProfileImage(userData.photo_url);
    }
  }, [userData?.photo_url]);

  // Enhanced fetchUserProfile to handle photo updates
  useEffect(() => {
    fetchUserProfile();
  }, [userData]);

  // Monitor userData changes for debugging
  useEffect(() => {
    if (userData) {
      console.log(
        "🔄 Header: User data updated - Current role:",
        userData.primary_role?.display_name
      );
    }
  }, [userData]);

  // Simple polling as fallback (optional)
  useEffect(() => {
    const pollUserData = () => {
      try {
        const storedUserData = localStorage.getItem("userData");
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          if (parsedData.photo_url && parsedData.photo_url !== profileImage) {
            console.log("🔄 Header: Detected photo URL change via polling");
            setProfileImage(parsedData.photo_url);
          }
        }
      } catch (error) {
        console.error("Error polling user data:", error);
      }
    };

    const interval = setInterval(pollUserData, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [profileImage]);

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
    // Clear all authentication data
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("authenticated");
    localStorage.removeItem("profileImage");
    localStorage.removeItem("roleSwitchComplete");
    localStorage.removeItem("lastRoleSwitch");
    
    // Clear the user_status specifically
    localStorage.removeItem("user_status");
    localStorage.removeItem("profile_completed");

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

  const openSwitchProfileModal = () => {
    setSwitchProfileOpen(false);
    setProfileDropdownOpen(false);
    setShowSwitchProfile(true);
  };

  const closeSwitchProfileModal = () => {
    if (switchingProfile) return;
    setShowSwitchProfile(false);
  };

  const handleSwitchProfile = async (profile) => {
    if (switchingProfile || profile.current) return;

    debugRoleSwitch(profile);

    console.log(`🔄 STARTING PROFILE SWITCH: ${profile.role_name}`);
    console.log("📊 Profile data received:", profile);

    startGlobalLoading(`Switching to ${profile.role} role...`);
    setSwitchingProfile(true);

    try {
      // Step 1: Update available profiles UI
      const updatedProfiles = availableProfiles.map((p) => ({
        ...p,
        current: p.role_name === profile.role_name,
      }));
      setAvailableProfiles(updatedProfiles);

      // Step 2: Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 3: Synchronize role to localStorage using utility
      console.log("🔄 Syncing role to localStorage...");
      const updatedUserData = await syncUserRole(profile);

      // Step 4: Update React state via custom hook - THIS IS CRITICAL
      console.log("🔄 Updating React state with new role...");
      updateUserData(updatedUserData);

      // Step 5: Verify the sync worked
      console.log("🔍 Verifying role sync...");
      const verifiedData = verifyRoleSync();
      console.log("✅ Verified role sync:", verifiedData?.primary_role);

      // Step 6: Set flags to prevent API overwrite
      localStorage.setItem("roleSwitchComplete", "true");
      localStorage.setItem("lastRoleSwitch", new Date().toISOString());
      console.log("✅ Role switch flags set");

      // Step 7: Close all modals
      setSwitchProfileOpen(false);
      setProfileDropdownOpen(false);
      setShowSwitchProfile(false);

      console.log(`✅ PROFILE SWITCH COMPLETE: ${profile.role}`);

      // Step 8: Wait for UI to update, then navigate to home page
      setTimeout(() => {
        console.log("🔄 Navigating to home page...");
        console.log(
          "🔍 Final localStorage check before navigation:",
          localStorage.getItem("userData")
        );
        stopGlobalLoading();

        // Navigate to home page instead of reloading
        navigate("/dashboard", { replace: true });
      }, 1500);
    } catch (error) {
      console.error("❌ PROFILE SWITCH FAILED:", error);
      stopGlobalLoading();
      setSwitchingProfile(false);

      // Show error message to user
      alert("Failed to switch profile. Please try again.");
    }
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
    setIsDarkModeLoading(true);
    
    setTimeout(() => {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      document.body.classList.toggle("dark-mode", newMode);
      localStorage.setItem("darkMode", newMode);
      setIsDarkModeLoading(false);
    }, 800);
  };

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(savedMode);
    if (savedMode) {
      document.body.classList.add("dark-mode");
    }
  }, []);

  // Show loading if user data is still loading
  if (userDataLoading) {
    return (
      <nav className="navbar-top navbar navbar-expand-lg fixed-top">
        <div className="container-fluid d-flex justify-content-center">
          <div className="spinner-border text-white" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* Dark Mode Loader using your custom Loader component */}
      {isDarkModeLoading && (
        <div className="backdrop" style={{ zIndex: 9999 }}>
          <Loader />
          <div className="text-white mt-3 text-center">
            {isDarkMode ? "Switching to Light Mode..." : "Switching to Dark Mode..."}
          </div>
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
              to="/dashboard"
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
              <span className="fw-bold" key={userData.primary_role.role_name}>
                {userData.name} - {userData.primary_role.display_name} Dashboard
              </span>
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
              disabled={isDarkModeLoading}
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
              {userData?.primary_role && (
                <span
                  className="position-absolute bottom-0 end-0 badge bg-success rounded-circle"
                  style={{
                    width: "12px",
                    height: "12px",
                    fontSize: "8px",
                    border: "2px solid white",
                  }}
                  title={userData.primary_role.display_name}
                ></span>
              )}
            </div>
            {isProfileDropdownOpen && (
              <div
                className="dropdown-menu top-100 position-absolute end-0 py-2 d-block shadow rounded-0"
                style={{ minWidth: "200px" }}
              >
                <Link
                  to="/dashboard/useraccount"
                  className="dropdown-item d-flex align-items-center justify-content-end"
                  onClick={() => setProfileDropdownOpen(false)}
                >
                  Account <i className="bi bi-person ms-3"></i>
                </Link>

                {availableProfiles.length > 1 && (
                  <div className="dropdown-item position-relative p-0">
                    <div
                      className="d-flex align-items-center justify-content-between text-decoration-none text-dark w-100 px-3 py-2"
                      style={{ cursor: "pointer" }}
                      onClick={toggleSwitchProfile}
                    >
                      <i className="bi bi-chevron-left small"></i>

                      <span className="d-flex align-items-center text-dark">
                        Switch Profile{" "}
                        <i className="bi bi-arrow-repeat ms-3"></i>
                      </span>
                    </div>

                    {isSwitchProfileOpen && (
                      <div
                        ref={switchProfileRef}
                        className="dropdown-menu accounts-dropdown position-absolute end-100 top-0 mt-0 shadow rounded-0"
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
                                  switchingProfile && !profile.current
                                    ? 0.6
                                    : 1,
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
                                <small className="text-muted">
                                  {profile.assigned_at
                                    ? new Date(
                                        profile.assigned_at
                                      ).toLocaleDateString()
                                    : "Recently assigned"}
                                </small>
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
                )}

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

      {/* Mobile bottom navigation */}
      {isMobile && (
        <nav className="navbar fixed-bottom d-flex justify-content-around py-2 px-3">
          <Link to="/dashboard">
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
            disabled={isDarkModeLoading}
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
            className="modal-dialog modal-dialog-centered modal-md"
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
                        {profile.assigned_at && (
                          <small className="text-muted d-block mt-1">
                            Assigned:{" "}
                            {new Date(profile.assigned_at).toLocaleDateString()}
                          </small>
                        )}
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