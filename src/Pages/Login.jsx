import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../config/axiosConfig";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Validation patterns
  const validationPatterns = {
    email: {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: "Please enter a valid email address",
    },
    password: {
      pattern: /^.{6,}$/,
      message: "Password must be at least 6 characters long",
    },
  };

  // Prefill from cookies if the user chose Remember me
  useEffect(() => {
    const remembered = Cookies.get("rememberMe") === "true";
    const savedEmail = Cookies.get("rememberEmail");
    const savedPassword = Cookies.get("rememberPassword");

    if (remembered) {
      setRememberMe(true);
      // Auto-fill both email and password if remember me is enabled
      setFormData({
        email: savedEmail || "",
        password: savedPassword || "",
      });
    } else if (savedEmail) {
      // If only email is saved but remember me is not checked, still prefill email
      setFormData((prev) => ({ ...prev, email: savedEmail || "" }));
    }

    // Set up activity tracking for automatic cleanup
    setupActivityTracking();
  }, []);

  // Set up activity tracking to detect user inactivity
  const setupActivityTracking = () => {
    // Clear any existing timer
    if (window.inactivityTimer) {
      clearTimeout(window.inactivityTimer);
    }

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const resetTimer = () => {
      clearTimeout(window.inactivityTimer);
      // Set timer for 5 days (5 * 24 * 60 * 60 * 1000 milliseconds)
      window.inactivityTimer = setTimeout(() => {
        if (Cookies.get("rememberMe") === "true") {
          clearRememberMeCookies();
          toast.info("Remember me data cleared due to inactivity");
        }
      }, 5 * 24 * 60 * 60 * 1000); // 5 days
    };

    // Set initial timer
    resetTimer();

    // Add event listeners for user activity
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, false);
    });

    // Cleanup function to remove event listeners
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer, false);
      });
    };
  };

  // Clear remember me cookies
  const clearRememberMeCookies = () => {
    Cookies.remove("rememberMe");
    Cookies.remove("rememberEmail");
    Cookies.remove("rememberPassword");
    setRememberMe(false);

    // Also clear the form if user is currently viewing the login page
    setFormData({
      email: "",
      password: "",
    });
  };

  const validateField = (name, value) => {
    const patternConfig = validationPatterns[name];
    if (!patternConfig) return "";

    if (!patternConfig.pattern.test(value)) {
      return patternConfig.message;
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox" && name === "rememberMe") {
      setRememberMe(checked);
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    // Validate the field in real-time
    const fieldError = validateField(name, value);
    setValidationErrors({
      ...validationErrors,
      [name]: fieldError,
    });
  };

  const validateForm = () => {
    const errors = {};

    // Validate all fields
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        errors[key] = error;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/login", formData);

      if (response.data.success) {
        const { token, user } = response.data.data;

        // Store token in cookies
        Cookies.set("token", token, { expires: 7 }); // Expires in 7 days
        Cookies.set("user_id", user.id, { expires: 7 });
        Cookies.set("role_id", user.role_id, { expires: 7 });

        // Handle remember me
        if (rememberMe) {
          const cookieOptions = {
            expires: 30, // 30 days for manual expiration
            secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
            sameSite: "strict", // CSRF protection
          };

          Cookies.set("rememberMe", "true", cookieOptions);
          Cookies.set("rememberEmail", formData.email, cookieOptions);
          Cookies.set("rememberPassword", formData.password, cookieOptions);

          // Reset inactivity timer on successful login with remember me
          resetInactivityTimer();
        } else {
          clearRememberMeCookies();
        }

        // Store user data in localStorage
        localStorage.setItem("userData", JSON.stringify(user));
        localStorage.setItem("authenticated", "true");

        toast.success("Login successful!");

        // Redirect to home page
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        error.response?.data?.message ||
          "Login failed. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (window.inactivityTimer) {
      clearTimeout(window.inactivityTimer);
    }
    // Set new timer for 5 days
    window.inactivityTimer = setTimeout(() => {
      if (Cookies.get("rememberMe") === "true") {
        clearRememberMeCookies();
        toast.info("Remember me data cleared due to inactivity");
      }
    }, 5 * 24 * 60 * 60 * 1000); // 5 days
  };

  // Check if form is valid for submit button
  const isFormValid = () => {
    return (
      formData.email &&
      formData.password &&
      !validationErrors.email &&
      !validationErrors.password
    );
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Clear remember me data manually
  const handleClearRememberMe = () => {
    clearRememberMeCookies();
    toast.info("Saved login credentials cleared");
  };

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
        <ToastContainer position="top-center" autoClose={5000} />
        <div className="container d-flex justify-content-center p-0">
          <div className="col-12 col-md-4 d-flex justify-content-center">
            <div className="form-container bg-white rounded-4 border p-4">
              <h3 className="title text-center fw-bold py-2 mb-2">
                Welcome Back, Login
              </h3>
              <p className="sub-title mb-1">Welcome Back!</p>

              <form
                className="form w-100 d-flex flex-column gap-3 mb-3"
                onSubmit={handleSubmit}
              >
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`form-control input border ${
                    validationErrors.email ? "is-invalid" : ""
                  }`}
                  placeholder="Enter your email"
                  required
                />
                {validationErrors.email && (
                  <div className="text-danger small">
                    {validationErrors.email}
                  </div>
                )}

                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`form-control input border border-end-0 ${
                      validationErrors.password ? "is-invalid" : ""
                    }`}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                  />
                  <span
                    className="d-flex align-items-center"
                    onClick={togglePasswordVisibility}
                    style={{
                      cursor: "pointer",
                      fontSize: "18px",
                      color: "teal",
                      borderLeft: "none",
                      border: "1px solid #dee2e6",
                      padding: "12px 15px",
                      borderTopRightRadius: "20px",
                      borderBottomRightRadius: "20px",
                    }}
                  >
                    {showPassword ? (
                      <i className="bi bi-eye-slash-fill"></i>
                    ) : (
                      <i className="bi bi-eye-fill"></i>
                    )}
                  </span>
                </div>
                {validationErrors.password && (
                  <div className="text-danger small">
                    {validationErrors.password}
                  </div>
                )}

                {/* Remember me */}
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label
                    className="form-check-label small"
                    htmlFor="rememberMe"
                  >
                    Remember me (auto-clear after 5 days inactivity)
                  </label>
                </div>

                <button
                  className="border-0 text-white form-btn"
                  type="submit"
                  disabled={loading || !isFormValid()}
                  style={{
                    backgroundColor:
                      loading || !isFormValid() ? "#6c757d" : "#0d6efd",
                    cursor:
                      loading || !isFormValid() ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </button>
              </form>
              <a
                href="/forgot-password"
                className="sign-up-link text-decoration-underline fw-bold text-end justify-content-end d-block mb-2"
              >
                Forgot Password?
              </a>

              <p className="sign-up-label m-0 text-muted">
                Having trouble logging in? Contact <br />
                <a
                  href="mailto:info@wstsc.org.au"
                  className="sign-up-link text-decoration-underline fw-bold"
                >
                  info@wstsc.org.au
                </a>
              </p>

              {/* <div className="buttons-container w-100 d-flex flex-column justify-content-start gap-3 mt-3">
                <div className="apple-login-button">
                  <svg
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    className="apple-icon"
                    viewBox="0 0 1024 1024"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M747.4 535.7c-.4-68.2 30.5-119.6 92.9-157.5-34.9-50-87.7-77.5-157.3-82.8-65.9-5.2-138 38.4-164.4 38.4-27.9 0-91.7-36.6-141.9-36.6C273.1 298.8 163 379.8 163 544.6c0 48.7 8.9 99 26.7 150.8 23.8 68.2 109.6 235.3 199.1 232.6 46.8-1.1 79.9-33.2 140.8-33.2 59.1 0 89.7 33.2 141.9 33.2 90.3-1.3 167.9-153.2 190.5-221.6-121.1-57.1-114.6-167.2-114.6-170.7zm-105.1-305c50.7-60.2 46.1-115 44.6-134.7-44.8 2.6-96.6 30.5-126.1 64.8-32.5 36.8-51.6 82.3-47.5 133.6 48.4 3.7 92.6-21.2 129-63.7z"></path>
                  </svg>
                  <span>Sign up with Apple</span>
                </div>
                <div className="google-login-button">
                  <svg
                    stroke="currentColor"
                    fill="currentColor"
                    strokeWidth="0"
                    version="1.1"
                    x="0px"
                    y="0px"
                    className="google-icon"
                    viewBox="0 0 48 48"
                    height="1em"
                    width="1em"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fill="#FFC107"
                      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                    ></path>
                    <path
                      fill="#FF3D00"
                      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                    ></path>
                    <path
                      fill="#4CAF50"
                      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                    ></path>
                    <path
                      fill="#1976D2"
                      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571
	c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                    ></path>
                  </svg>
                  <span>Sign up with Google</span>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
