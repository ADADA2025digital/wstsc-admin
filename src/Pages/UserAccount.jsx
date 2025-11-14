import React, { useState, useEffect, useCallback } from "react";
import "../assets/Styles/Style.css";
import Profile from "../assets/Images/profile.png";
import ButtonGlobal from "../Components/Button";
import api from "../config/axiosConfig";
import { formatDisplayDate } from "../config/utils";
import { useNavigate } from "react-router-dom";

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

  // Password form state (kept for UI but not used for API calls)
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
      setPasswordSuccess(null);
    }
  };

  // Optimized password change handler with useCallback
  const handlePasswordChange = useCallback((field, value) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error without causing unnecessary re-renders
    setPasswordErrors(prev => {
      if (!prev[field]) return prev;
      return {
        ...prev,
        [field]: "",
      };
    });
  }, []);

  // Handle password form submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Show success message for demo purposes
      setPasswordSuccess("Password updated successfully! (UI Demo Only - No actual change made)");
      setShowPasswordForm(false);
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
      setIsSubmitting(false);
    }, 1000);
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
                    onClick={() => navigate("/edit-profile")}
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
                        <div className="col-md-4">
                          <label htmlFor="currentPassword" className="form-label small">
                            Current Password *
                          </label>
                          <input
                            key="currentPassword" // Added key prop
                            id="currentPassword"
                            type="password"
                            className={`form-control ${passwordErrors.currentPassword ? 'is-invalid' : ''}`}
                            value={passwordForm.currentPassword}
                            onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                            placeholder="Enter current password"
                          />
                          {passwordErrors.currentPassword && (
                            <div className="invalid-feedback">{passwordErrors.currentPassword}</div>
                          )}
                        </div>

                        <div className="col-md-4">
                          <label htmlFor="newPassword" className="form-label small">
                            New Password *
                          </label>
                          <input
                            key="newPassword" // Added key prop
                            id="newPassword"
                            type="password"
                            className={`form-control ${passwordErrors.newPassword ? 'is-invalid' : ''}`}
                            value={passwordForm.newPassword}
                            onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                            placeholder="Enter new password"
                          />
                          {passwordErrors.newPassword && (
                            <div className="invalid-feedback">{passwordErrors.newPassword}</div>
                          )}
                          <div className="form-text">Password must be at least 6 characters long</div>
                        </div>

                        <div className="col-md-4">
                          <label htmlFor="confirmPassword" className="form-label small">
                            Confirm New Password *
                          </label>
                          <input
                            key="confirmPassword" // Added key prop
                            id="confirmPassword"
                            type="password"
                            className={`form-control ${passwordErrors.confirmPassword ? 'is-invalid' : ''}`}
                            value={passwordForm.confirmPassword}
                            onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                            placeholder="Confirm new password"
                          />
                          {passwordErrors.confirmPassword && (
                            <div className="invalid-feedback">{passwordErrors.confirmPassword}</div>
                          )}
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
                    <div className="text-center py-4">
                      <i
                        className="bi bi-shield-lock text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                      <h5 className="mt-3">Password Management</h5>
                      <p className="text-muted">
                        Click the "Change Password" button to update your
                        password.
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