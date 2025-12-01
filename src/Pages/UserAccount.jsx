import React, { useState, useEffect, useCallback } from "react";
import "../assets/Styles/Style.css";
import Profile from "../assets/Images/profile.jpeg";
import ButtonGlobal from "../Components/Button";
import api from "../config/axiosConfig";
import { formatDisplayDate } from "../config/utils";
import { useNavigate } from "react-router-dom";
import Loader from "../Pages/Loader";

// Move TabContent component outside the main component
const TabContent = ({ children, active }) => {
  if (!active) return null;
  return <div className="tab-content">{children}</div>;
};

const UserAccount = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });

  // Fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/profile/person");

      if (response.data.success) {
        const profile = response.data.data.profile;
        setUserData(profile);
      } else {
        setError("Failed to fetch user data");
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      setError(err.response?.data?.message || "Failed to load user profile");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Handle refresh with spinning animation
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
  };

  // Password strength checker
  const checkPasswordStrength = useCallback((password) => {
    if (!password) {
      setPasswordStrength({ score: 0, feedback: '' });
      return;
    }

    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('at least 8 characters');
    
    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('one uppercase letter');
    
    // Lowercase check
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('one lowercase letter');
    
    // Number check
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('one number');
    
    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('one special character');
    
    setPasswordStrength({
      score,
      feedback: feedback.length > 0 ? `Consider adding: ${feedback.join(', ')}` : 'Strong password!'
    });
  }, []);

  // Toggle password form visibility
  const togglePasswordForm = () => {
    setShowPasswordForm(!showPasswordForm);
    // Reset form when closing
    if (showPasswordForm) {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordStrength({ score: 0, feedback: '' });
      setPasswordSuccess(null);
      // Reset password visibility states
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  };

  // Optimized password change handler with useCallback
  const handlePasswordChange = useCallback((field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Check password strength in real-time for new password
    if (field === 'newPassword') {
      checkPasswordStrength(value);
    }

    // Clear error without causing unnecessary re-renders
    setPasswordErrors((prev) => {
      if (!prev[field]) return prev;
      return {
        ...prev,
        [field]: "",
      };
    });
  }, [checkPasswordStrength]);

  // Generate strong password
  const generateStrongPassword = () => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one of each type
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // Fill the rest
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // Shuffle the password
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setPasswordForm(prev => ({
      ...prev,
      newPassword: password,
      confirmPassword: password
    }));
    
    checkPasswordStrength(password);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
  };

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};
    let isValid = true;

    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = "Current password is required";
      isValid = false;
    }

    if (!passwordForm.newPassword.trim()) {
      errors.newPassword = "New password is required";
      isValid = false;
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters long";
      isValid = false;
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      errors.newPassword = "New password must be different from current password";
      isValid = false;
    }

    if (!passwordForm.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your new password";
      isValid = false;
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validatePasswordForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.put("/update-password", {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
        new_password_confirmation: passwordForm.confirmPassword,
      });

      if (response.data.success) {
        setPasswordSuccess(response.data.message || "Password updated successfully!");
        
        // Reset form
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordErrors({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordStrength({ score: 0, feedback: '' });
        
        // Hide form after success
        setTimeout(() => {
          setShowPasswordForm(false);
          // Reset password visibility states
          setShowCurrentPassword(false);
          setShowNewPassword(false);
          setShowConfirmPassword(false);
        }, 2000);
      } else {
        setPasswordErrors({
          currentPassword: response.data.message || "Failed to update password",
        });
      }
    } catch (err) {
      console.error("Error updating password:", err);
      
      // Handle different error scenarios
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          "Failed to update password. Please try again.";
      
      // Check for data leak error
      if (errorMessage.toLowerCase().includes('data leak') || 
          errorMessage.toLowerCase().includes('have been pwned') ||
          errorMessage.toLowerCase().includes('appeared in a leak')) {
        setPasswordErrors({
          newPassword: "This password has been found in data breaches. Please choose a more secure password that you haven't used elsewhere.",
        });
      } 
      // Check if it's a current password error
      else if (errorMessage.toLowerCase().includes("current") || 
               errorMessage.toLowerCase().includes("old")) {
        setPasswordErrors({
          currentPassword: errorMessage,
        });
      } else {
        setPasswordErrors({
          newPassword: errorMessage,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loader while loading
  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-danger text-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              Error: {error}
            </div>
            <div className="text-center">
              <ButtonGlobal onClick={handleRefresh} className="btn btn-primary">
                Retry
              </ButtonGlobal>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="alert alert-warning text-center">
              <i className="bi bi-exclamation-circle-fill me-2"></i>
              No user data found
            </div>
            <div className="text-center">
              <ButtonGlobal onClick={handleRefresh} className="btn btn-primary">
                Refresh
              </ButtonGlobal>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Success Messages */}
      <div className="row justify-content-center mb-3">
        <div className="col-lg-10">
          {passwordSuccess && (
            <div
              className="alert alert-success alert-dismissible fade show"
              role="alert"
            >
              <i className="bi bi-check-circle-fill me-2"></i>
              {passwordSuccess}
              <button
                type="button"
                className="btn-close"
                onClick={() => setPasswordSuccess(null)}
              ></button>
            </div>
          )}
          {profileSuccess && (
            <div
              className="alert alert-success alert-dismissible fade show"
              role="alert"
            >
              <i className="bi bi-check-circle-fill me-2"></i>
              {profileSuccess}
              <button
                type="button"
                className="btn-close"
                onClick={() => setProfileSuccess(null)}
              ></button>
            </div>
          )}
        </div>
      </div>

      {/* Header Section */}
      <div className="row justify-content-center mb-4">
        <div className="col-lg-10">
          <div className="bg-secondary bg-opacity-10 card shadow-sm bord">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-md-8">
                  <div className="d-flex align-items-center">
                    <div className="me-4">
                      <img
                        src={userData.photo_url || Profile}
                        alt="Profile"
                        className="rounded-circle"
                        style={{
                          width: "80px",
                          height: "80px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                    <div>
                      <h2 className="h4 mb-1 fw-bold">{userData.full_name}</h2>
                      <p className="mb-1">{userData.occupation}</p>
                      <p className="mb-2">
                        <i className="bi bi-envelope me-1"></i>
                        {userData.email}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 text-md-end mt-3 mt-md-0">
                  <ButtonGlobal
                    onClick={() => navigate("/update-profile")}
                    className="btn custom-btn me-2"
                  >
                    <i className="bi bi-pencil-square me-1"></i>
                    Edit Profile
                  </ButtonGlobal>
                  <ButtonGlobal
                    onClick={handleRefresh}
                    className="btn btn-outline-secondary"
                    disabled={refreshing}
                  >
                    <i
                      className={`bi bi-arrow-clockwise ${
                        refreshing
                          ? "spinner-border spinner-border-sm me-2"
                          : "me-1"
                      }`}
                    ></i>
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </ButtonGlobal>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Tabs Navigation */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-transparent py-3">
              <ul className="nav nav-tabs card-header-tabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${
                      activeTab === "personal" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("personal")}
                    type="button"
                    role="tab"
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    Personal Information
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${
                      activeTab === "account" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("account")}
                    type="button"
                    role="tab"
                  >
                    <i className="bi bi-info-circle me-2"></i>
                    Account Information
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${
                      activeTab === "address" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("address")}
                    type="button"
                    role="tab"
                  >
                    <i className="bi bi-geo-alt me-2"></i>
                    Address Information
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${
                      activeTab === "password" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("password")}
                    type="button"
                    role="tab"
                  >
                    <i className="bi bi-shield-lock me-2"></i>
                    Password Management
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Tab Contents */}
          <div className="tab-content-container">
            {/* Personal Information Tab */}
            <TabContent active={activeTab === "personal"}>
              <div className="card shadow-sm">
                <div className="card-header bg-transparent">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-person-circle me-2"></i>
                    Personal Information
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Full Name</label>
                      <p className="mb-0 fw-semibold">{userData.full_name}</p>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Email Address</label>
                      <p className="mb-0 fw-semibold">{userData.email}</p>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Phone Number</label>
                      <p className="mb-0 fw-semibold">
                        {userData.phone || "Not provided"}
                      </p>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label small">
                        Alternate Phone
                      </label>
                      <p className="mb-0 fw-semibold">
                        {userData.alternate_phone || "Not provided"}
                      </p>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Gender</label>
                      <p className="mb-0 fw-semibold text-capitalize">
                        {userData.gender || "Not provided"}
                      </p>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Date of Birth</label>
                      <p className="mb-0 fw-semibold">
                        {userData.date_of_birth
                          ? formatDisplayDate(userData.date_of_birth)
                          : "Not provided"}
                      </p>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Nationality</label>
                      <p className="mb-0 fw-semibold">
                        {userData.nationality || "Not provided"}
                      </p>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Marital Status</label>
                      <p className="mb-0 fw-semibold text-capitalize">
                        {userData.marital_status || "Not provided"}
                      </p>
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label small">Occupation</label>
                      <p className="mb-0 fw-semibold">
                        {userData.occupation || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabContent>

            {/* Account Information Tab */}
            <TabContent active={activeTab === "account"}>
              <div className="card shadow-sm">
                <div className="card-header bg-transparent">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Account Information
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Person ID</label>
                      <p className="mb-0 fw-semibold">{userData.person_id}</p>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Account Status</label>
                      <p className="mb-0 fw-semibold">
                        <span
                          className={`badge ${
                            userData.is_active ? "bg-success" : "bg-danger"
                          }`}
                        >
                          {userData.is_active ? "Active" : "Inactive"}
                        </span>
                      </p>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label small">
                        Account Created
                      </label>
                      <p className="mb-0 fw-semibold">
                        {formatDisplayDate(userData.created_at)}
                      </p>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Last Updated</label>
                      <p className="mb-0 fw-semibold">
                        {formatDisplayDate(userData.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabContent>

            {/* Address Information Tab */}
            <TabContent active={activeTab === "address"}>
              <div className="card shadow-sm">
                <div className="card-header bg-transparent">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-geo-alt me-2"></i>
                    Address Information
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Address Line 1</label>
                      <p className="mb-0 fw-semibold">
                        {userData.address?.address_line1 || "Not provided"}
                      </p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Address Line 2</label>
                      <p className="mb-0 fw-semibold">
                        {userData.address?.address_line2 || "Not provided"}
                      </p>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label small">City</label>
                      <p className="mb-0 fw-semibold">
                        {userData.address?.city || "Not provided"}
                      </p>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label small">State/Province</label>
                      <p className="mb-0 fw-semibold">
                        {userData.address?.state || "Not provided"}
                      </p>
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label small">Postal Code</label>
                      <p className="mb-0 fw-semibold">
                        {userData.address?.postal_code || "Not provided"}
                      </p>
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label small">Country</label>
                      <p className="mb-0 fw-semibold">
                        {userData.address?.country || "Not provided"}
                      </p>
                    </div>
                    <div className="col-12">
                      <label className="form-label small">Address Type</label>
                      <p className="mb-0 fw-semibold text-capitalize">
                        {userData.address?.address_type || "Not specified"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabContent>

            {/* Password Management Tab */}
            <TabContent active={activeTab === "password"}>
              <div className="card shadow-sm">
                <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-shield-lock me-2"></i>
                    Password Management
                  </h5>
                  <ButtonGlobal
                    onClick={togglePasswordForm}
                    className="btn btn-outline-secondary btn-sm"
                  >
                    <i
                      className={`bi ${
                        showPasswordForm ? "bi-x" : "bi-key"
                      } me-1`}
                    ></i>
                    {showPasswordForm ? "Cancel" : "Change Password"}
                  </ButtonGlobal>
                </div>

                <div className="card-body">
                  {showPasswordForm ? (
                    <form onSubmit={handlePasswordSubmit}>
                      <div className="row">
                        {/* Current Password */}
                        <div className="col-md-4">
                          <label
                            htmlFor="currentPassword"
                            className="form-label small"
                          >
                            Current Password *
                          </label>
                          <div className="input-group">
                            <input
                              key="currentPassword"
                              id="currentPassword"
                              type={showCurrentPassword ? "text" : "password"}
                              className={`form-control ${
                                passwordErrors.currentPassword
                                  ? "is-invalid"
                                  : ""
                              }`}
                              value={passwordForm.currentPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "currentPassword",
                                  e.target.value
                                )
                              }
                              placeholder="Enter current password"
                              disabled={isSubmitting}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary border-start-0"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              disabled={isSubmitting}
                              style={{
                                borderColor: "#ced4da",
                                borderLeft: "none",
                              }}
                            >
                              <i
                                className={`bi ${
                                  showCurrentPassword
                                    ? "bi-eye-slash-fill"
                                    : "bi-eye-fill"
                                }`}
                              ></i>
                            </button>
                            {passwordErrors.currentPassword && (
                              <div className="invalid-feedback">
                                {passwordErrors.currentPassword}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* New Password */}
                        <div className="col-md-4">
                          <label
                            htmlFor="newPassword"
                            className="form-label small"
                          >
                            New Password *
                          </label>
                          <div className="input-group">
                            <input
                              key="newPassword"
                              id="newPassword"
                              type={showNewPassword ? "text" : "password"}
                              className={`form-control ${
                                passwordErrors.newPassword ? "is-invalid" : ""
                              }`}
                              value={passwordForm.newPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "newPassword",
                                  e.target.value
                                )
                              }
                              placeholder="Enter new password"
                              disabled={isSubmitting}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary border-start-0"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              disabled={isSubmitting}
                              style={{
                                borderColor: "#ced4da",
                                borderLeft: "none",
                              }}
                            >
                              <i
                                className={`bi ${
                                  showNewPassword
                                    ? "bi-eye-slash-fill"
                                    : "bi-eye-fill"
                                }`}
                              ></i>
                            </button>
                            {passwordErrors.newPassword && (
                              <div className="invalid-feedback">
                                {passwordErrors.newPassword}
                              </div>
                            )}
                          </div>
                          
                          {/* Password Strength Indicator */}
                          {passwordForm.newPassword && (
                            <div className="mt-2">
                              <div className="d-flex align-items-center mb-1">
                                <small className="me-2">Password Strength:</small>
                                <div className="progress flex-grow-1" style={{ height: '5px' }}>
                                  <div 
                                    className={`progress-bar ${
                                      passwordStrength.score >= 4 ? 'bg-success' : 
                                      passwordStrength.score >= 3 ? 'bg-warning' : 'bg-danger'
                                    }`}
                                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                              <small className={`form-text ${
                                passwordStrength.score >= 4 ? 'text-success' : 
                                passwordStrength.score >= 3 ? 'text-warning' : 'text-danger'
                              }`}>
                                {passwordStrength.feedback}
                              </small>
                            </div>
                          )}

                          <div className="form-text">
                            <small>
                              <strong>Password Requirements:</strong>
                              <ul className="mb-0 ps-3">
                                <li>At least 6 characters long</li>
                                <li>Different from current password</li>
                                <li>Not found in known data breaches</li>
                                <li>Avoid commonly used passwords</li>
                              </ul>
                            </small>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="col-md-4">
                          <label
                            htmlFor="confirmPassword"
                            className="form-label small"
                          >
                            Confirm New Password *
                          </label>
                          <div className="input-group">
                            <input
                              key="confirmPassword"
                              id="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              className={`form-control ${
                                passwordErrors.confirmPassword
                                  ? "is-invalid"
                                  : ""
                              }`}
                              value={passwordForm.confirmPassword}
                              onChange={(e) =>
                                handlePasswordChange(
                                  "confirmPassword",
                                  e.target.value
                                )
                              }
                              placeholder="Confirm new password"
                              disabled={isSubmitting}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary border-start-0"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              disabled={isSubmitting}
                              style={{
                                borderColor: "#ced4da",
                                borderLeft: "none",
                              }}
                            >
                              <i
                                className={`bi ${
                                  showConfirmPassword
                                    ? "bi-eye-slash-fill"
                                    : "bi-eye-fill"
                                }`}
                              ></i>
                            </button>
                            {passwordErrors.confirmPassword && (
                              <div className="invalid-feedback">
                                {passwordErrors.confirmPassword}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Generate Password Button */}
                      <div className="row mt-3">
                        <div className="col-12">
                          <button
                            type="button"
                            className="btn btn-outline-info btn-sm"
                            onClick={generateStrongPassword}
                            disabled={isSubmitting}
                          >
                            <i className="bi bi-shuffle me-1"></i>
                            Generate Strong Password
                          </button>
                        </div>
                      </div>

                      <div className="row mt-4">
                        <div className="col-12">
                          <div className="d-flex justify-content-end">
                            <ButtonGlobal
                              type="submit"
                              className="btn custom-btn"
                              disabled={isSubmitting}
                            >
                              <i className="bi bi-check2-all me-2"></i>
                              {isSubmitting ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" />
                                  Updating...
                                </>
                              ) : (
                                "Update Password"
                              )}
                            </ButtonGlobal>
                          </div>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <div className="content-header text-center py-4">
                      <i
                        className="bi bi-shield-lock text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                      <h5 className="mt-3">Password Security</h5>
                      <p className="text-muted">
                        For your security, we check new passwords against known data breaches. 
                        <br />
                        <strong>Tips for a secure password:</strong>
                      </p>
                      <ul className="list-unstyled text-muted small">
                        <li><i className="bi bi-check text-success me-1"></i>Use at least 8 characters</li>
                        <li><i className="bi bi-check text-success me-1"></i>Mix letters, numbers, and symbols</li>
                        <li><i className="bi bi-check text-success me-1"></i>Avoid common words or patterns</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </TabContent>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccount;