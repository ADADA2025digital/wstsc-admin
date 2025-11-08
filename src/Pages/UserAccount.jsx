import React, { useState, useEffect } from "react";
import "../assets/Styles/Style.css";
import Profile from "../assets/Images/profile.png";
import InputField from "../Components/InputField";
import ButtonGlobal from "../Components/Button";
import api from "../config/axiosConfig";
import { formatDisplayDate } from "../config/utils";
import { useNavigate } from "react-router-dom";

const UserAccount = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  // Remove profile form states since we don't need inline editing anymore
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(null);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation patterns - ALL MESSAGES WITHOUT EXCLAMATION MARKS
  const validationPatterns = {
    email: {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: "Please enter a valid email address",
    },
    password: {
      pattern: /^.{6,}$/,
      message: "Password must be at least 6 characters long",
    },
    phone: {
      pattern: /^[\+]?[1-9][\d]{0,15}$/,
      message: "Please enter a valid phone number",
    },
  };

  // Validation states
  const [passwordErrors, setPasswordErrors] = useState({});

  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};

    errors.current_password = passwordData.current_password.trim()
      ? ""
      : "Current password is required";
    errors.new_password = passwordData.new_password.trim()
      ? validationPatterns.password.pattern.test(passwordData.new_password)
        ? ""
        : validationPatterns.password.message
      : "New password is required";

    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      errors.new_password_confirmation = "New passwords do not match";
    } else {
      errors.new_password_confirmation =
        passwordData.new_password_confirmation.trim()
          ? ""
          : "Please confirm your new password";
    }

    setPasswordErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

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

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      const response = await api.put("/profile/update-password", passwordData);

      if (response.data.success) {
        setPasswordSuccess("Password updated successfully");
        setPasswordData({
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
        setShowPasswordForm(false);
        setPasswordErrors({});

        // Clear success message after 5 seconds
        setTimeout(() => {
          setPasswordSuccess(null);
        }, 5000);
      } else {
        setPasswordError(response.data.message || "Failed to update password");
      }
    } catch (err) {
      console.error("Error updating password:", err);
      setPasswordError(
        err.response?.data?.message || "Failed to update password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // Handle input changes for password form
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (passwordError) setPasswordError(null);
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Reset password form
  const resetPasswordForm = () => {
    setPasswordData({
      current_password: "",
      new_password: "",
      new_password_confirmation: "",
    });
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordErrors({});
    setShowPasswordForm(false);
    // Reset visibility states
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  // Toggle password visibility functions
  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Tab content component
  const TabContent = ({ children, active }) => {
    if (!active) return null;
    return <div className="tab-content">{children}</div>;
  };

  // Remove the loading spinner section entirely
  if (loading) {
    return null; // Return nothing while loading
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
                    onClick={() => navigate('/edit-profile')}
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
                    className={`nav-link ${activeTab === 'personal' ? 'active' : ''}`}
                    onClick={() => setActiveTab('personal')}
                    type="button"
                    role="tab"
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    Personal Information
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'account' ? 'active' : ''}`}
                    onClick={() => setActiveTab('account')}
                    type="button"
                    role="tab"
                  >
                    <i className="bi bi-info-circle me-2"></i>
                    Account Information
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'address' ? 'active' : ''}`}
                    onClick={() => setActiveTab('address')}
                    type="button"
                    role="tab"
                  >
                    <i className="bi bi-geo-alt me-2"></i>
                    Address Information
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className={`nav-link ${activeTab === 'password' ? 'active' : ''}`}
                    onClick={() => setActiveTab('password')}
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
            <TabContent active={activeTab === 'personal'}>
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
                      <label className="form-label small">
                        Email Address
                      </label>
                      <p className="mb-0 fw-semibold">{userData.email}</p>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label small">
                        Phone Number
                      </label>
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
                        {userData.date_of_birth ? formatDisplayDate(userData.date_of_birth) : "Not provided"}
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
            <TabContent active={activeTab === 'account'}>
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
                        <span className={`badge ${userData.is_active ? 'bg-success' : 'bg-danger'}`}>
                          {userData.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label small">Account Created</label>
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
            <TabContent active={activeTab === 'address'}>
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
            <TabContent active={activeTab === 'password'}>
              <div className="card shadow-sm">
                <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">
                    <i className="bi bi-shield-lock me-2"></i>
                    Password Management
                  </h5>
                  <ButtonGlobal
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
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
                    <form onSubmit={handlePasswordChange}>
                      {passwordError && (
                        <div
                          className="alert alert-danger alert-dismissible fade show"
                          role="alert"
                        >
                          <i className="bi bi-exclamation-triangle-fill me-2"></i>
                          {passwordError}
                          <button
                            type="button"
                            className="btn-close"
                            onClick={() => setPasswordError(null)}
                          ></button>
                        </div>
                      )}

                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label">Current Password</label>
                          <div className="position-relative">
                            <InputField
                              name="current_password"
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordData.current_password}
                              onChange={handlePasswordInputChange}
                              required
                              placeholder="Enter current password"
                              error={passwordErrors.current_password}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary position-absolute end-0 top-0 mt-2 me-2"
                              onClick={toggleCurrentPasswordVisibility}
                            >
                              <i className={`bi ${showCurrentPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                            </button>
                          </div>
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label">New Password</label>
                          <div className="position-relative">
                            <InputField
                              name="new_password"
                              type={showNewPassword ? "text" : "password"}
                              value={passwordData.new_password}
                              onChange={handlePasswordInputChange}
                              required
                              placeholder="Enter new password"
                              error={passwordErrors.new_password}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary position-absolute end-0 top-0 mt-2 me-2"
                              onClick={toggleNewPasswordVisibility}
                            >
                              <i className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                            </button>
                          </div>
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label">
                            Confirm New Password
                          </label>
                          <div className="position-relative">
                            <InputField
                              name="new_password_confirmation"
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordData.new_password_confirmation}
                              onChange={handlePasswordInputChange}
                              required
                              placeholder="Confirm new password"
                              error={passwordErrors.new_password_confirmation}
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary position-absolute end-0 top-0 mt-2 me-2"
                              onClick={toggleConfirmPasswordVisibility}
                            >
                              <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                        <ButtonGlobal
                          type="button"
                          onClick={resetPasswordForm}
                          className="btn btn-outline-secondary me-md-2"
                        >
                          Cancel
                        </ButtonGlobal>
                        <ButtonGlobal
                          type="submit"
                          className="btn button-global"
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? (
                            <>
                              <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                              ></span>
                              Updating...
                            </>
                          ) : (
                            "Update Password"
                          )}
                        </ButtonGlobal>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-4">
                      <i className="bi bi-shield-lock text-muted" style={{ fontSize: '3rem' }}></i>
                      <h5 className="mt-3">Password Management</h5>
                      <p className="text-muted">
                        Click the "Change Password" button to update your password.
                      </p>
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