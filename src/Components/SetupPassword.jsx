import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../config/axiosConfig";

const PasswordSetup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState({
    new_password: "",
    new_password_confirmation: "",
  });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setErrors({ general: "Invalid setup link. No token found." });
        setVerifying(false);
        return;
      }

      try {
        console.log("Verifying token:", token);
        const response = await api.post("/password-setup/verify-token", {
          token,
        });
        console.log("Token verification response:", response.data);

        if (response.data.success) {
          setUser(response.data.data.user);
        } else {
          setErrors({ general: "Invalid or expired setup link" });
        }
      } catch (error) {
        console.error("Token verification error:", error);
        const errorMessage =
          error.response?.data?.message || "Invalid setup link";
        setErrors({ general: errorMessage });
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.new_password) {
      newErrors.new_password = "New password is required";
    } else if (formData.new_password.length < 6) {
      newErrors.new_password = "Password must be at least 6 characters long";
    }

    if (!formData.new_password_confirmation) {
      newErrors.new_password_confirmation = "Please confirm your new password";
    } else if (formData.new_password !== formData.new_password_confirmation) {
      newErrors.new_password_confirmation = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log("Setting up password with token:", token);
      const response = await api.post("/password-setup/setup", {
        token,
        new_password: formData.new_password,
        new_password_confirmation: formData.new_password_confirmation,
      });

      console.log("Password setup response:", response.data);

      if (response.data.success) {
        setSuccess(true);

        // Redirect to login page after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        throw new Error(response.data.message || "Failed to set password");
      }
    } catch (error) {
      console.error("Password setup error:", error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        const errorMessage =
          error.response?.data?.message ||
          "Failed to set password. Please try again.";
        setErrors({ general: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="container-fluid p-0">
        <div
          className="login-container bg-light w-100"
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="text-center">
            <div
              className="spinner-border text-primary"
              role="status"
              style={{ width: "3rem", height: "3rem" }}
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 fs-5">Verifying your setup link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errors.general && !user) {
    return (
      <div className="container-fluid p-0">
        <div
          className="login-container bg-light w-100"
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="container d-flex justify-content-center p-0">
            <div className="col-12 col-md-6 col-lg-4">
              <div className="alert alert-danger text-center">
                <i className="bi bi-exclamation-triangle display-4 text-danger mb-3"></i>
                <h4 className="alert-heading">Setup Link Error</h4>
                <p className="mb-3">{errors.general}</p>
                <div className="mt-3">
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/login")}
                  >
                    Go to Login Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="container-fluid p-0">
        <div
          className="login-container bg-light w-100"
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="container d-flex justify-content-center p-0">
            <div className="col-12 col-md-4 d-flex justify-content-center">
              <div className="card shadow-sm border-0">
                <div className="card-body p-5 text-center">
                  <i className="bi bi-check-circle text-success display-1"></i>
                  <h3 className="mt-4 text-success">
                    Password Set Successfully!
                  </h3>
                  <p className="text-muted mt-3">
                    Your password has been set successfully. You can now login
                    with your new password.
                  </p>
                  <p className="text-muted">Redirecting to login page...</p>
                  <div
                    className="spinner-border text-primary mt-3"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid p-0">
      <div
        className="login-container bg-light w-100"
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="container d-flex justify-content-center p-0">
          <div className="col-12 col-md-4 d-flex justify-content-center">
            <div className="bg-white rounded-4 border p-4">
              <h5 className="title text-center fw-bold py-2">
                Welcome {user.name}, <br /> Setup Your Password
              </h5>
              <p className="small text-center mb-1">Set your password and activate your account</p>

              <form
                className="form w-100 d-flex flex-column gap-3 mb-3"
                onSubmit={handleSubmit}
              >
                {errors.general && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {errors.general}
                  </div>
                )}

                {/* Auto-filled user info (read-only) */}
                {user && (
                  <div className="p-3 bg-light rounded mt-3">
                    <h6 className="fw-bold mb-2">Account Information</h6>
                    <div className="row">
                      <div className="col-12 mb-2">
                        <label className="form-label text-muted small mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          className="form-control input border"
                          value={user.name}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label text-muted small mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control input border"
                          value={user.email}
                          readOnly
                          style={{ backgroundColor: "#f8f9fa" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* New Password Field */}
                <div>
                  <label className="form-label fw-semibold">New Password</label>
                  <input
                    type="password"
                    name="new_password"
                    className={`form-control input border ${
                      errors.new_password ? "is-invalid" : ""
                    }`}
                    value={formData.new_password}
                    onChange={handleChange}
                    placeholder="Enter new password"
                    required
                    minLength="6"
                  />
                  {errors.new_password && (
                    <div className="invalid-feedback">
                      {errors.new_password}
                    </div>
                  )}
                  <div className="form-text">
                    Password must be at least 6 characters long
                  </div>
                </div>

                {/* Confirm New Password Field */}
                <div>
                  <label className="form-label fw-semibold">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="new_password_confirmation"
                    className={`form-control input border ${
                      errors.new_password_confirmation ? "is-invalid" : ""
                    }`}
                    value={formData.new_password_confirmation}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    required
                  />
                  {errors.new_password_confirmation && (
                    <div className="invalid-feedback">
                      {errors.new_password_confirmation}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="border-0 text-white form-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Setting Password...
                    </>
                  ) : (
                    "Set Password"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordSetup;
