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
      setFormData({
        email: savedEmail || "",
        password: savedPassword || "",
      });
    } else if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail || "" }));
    }

    setupActivityTracking();
  }, []);

  const setupActivityTracking = () => {
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
      window.inactivityTimer = setTimeout(() => {
        if (Cookies.get("rememberMe") === "true") {
          clearRememberMeCookies();
          toast.info("Remember me data cleared due to inactivity");
        }
      }, 5 * 24 * 60 * 60 * 1000);
    };

    resetTimer();

    events.forEach((event) => {
      document.addEventListener(event, resetTimer, false);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer, false);
      });
    };
  };

  const clearRememberMeCookies = () => {
    Cookies.remove("rememberMe");
    Cookies.remove("rememberEmail");
    Cookies.remove("rememberPassword");
    setRememberMe(false);
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

    const fieldError = validateField(name, value);
    setValidationErrors({
      ...validationErrors,
      [name]: fieldError,
    });
  };

  const validateForm = () => {
    const errors = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        errors[key] = error;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Check if user profile is complete by checking if they have basic info
  const checkProfileCompletion = async (userId) => {
    try {
      console.log('Checking profile completion for user:', userId);
      
      // Try to get the user's profile data
      const response = await api.get("/profile/person");
      console.log('Profile API response:', response.data);

      if (response.data.success && response.data.data.profile) {
        const profile = response.data.data.profile;
        
        // Check if essential profile fields are filled
        const hasEssentialInfo = profile.first_name && 
                                profile.last_name && 
                                profile.phone;
        
        console.log('Profile completion check:', {
          hasFirstName: !!profile.first_name,
          hasLastName: !!profile.last_name,
          hasPhone: !!profile.phone,
          isComplete: hasEssentialInfo
        });

        return hasEssentialInfo;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking profile completion:", error);
      
      // If we can't check via API, check localStorage for existing data
      const existingUserData = localStorage.getItem('userData');
      if (existingUserData) {
        try {
          const userData = JSON.parse(existingUserData);
          // Check if we previously marked profile as completed
          if (userData.profile_completed !== undefined) {
            console.log('Using existing userData profile_completed status:', userData.profile_completed);
            return userData.profile_completed;
          }
        } catch (e) {
          console.error('Error parsing existing userData:', e);
        }
      }
      
      return false;
    }
  };

  // Simplified profile completion logic based on first login
  const determineProfileStatus = (loginResponse) => {
    const { is_first_login, user } = loginResponse.data;
    
    console.log('Determining profile status:', {
      is_first_login,
      user_phone: user.phone,
      user_name: user.name
    });

    // If it's first login OR user has no phone number (incomplete profile), require profile completion
    if (is_first_login || !user.phone) {
      return {
        needsProfile: true,
        reason: is_first_login ? 'first_login' : 'missing_phone'
      };
    }

    return {
      needsProfile: false,
      reason: 'profile_complete'
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/login", formData);

      if (response.data.success) {
        const { token, user, is_first_login } = response.data.data;

        console.log('Login successful - Full response:', {
          token: !!token,
          user: user,
          is_first_login: is_first_login,
          full_response: response.data
        });

        // Store token in cookies
        Cookies.set("token", token, { expires: 7 });
        
        // Store user ID
        if (user.uid) {
          Cookies.set("user_id", user.uid, { expires: 7 });
        } else if (user.id) {
          Cookies.set("user_id", user.id, { expires: 7 });
        }
        
        if (user.primary_role?.roleid) {
          Cookies.set("role_id", user.primary_role.roleid, { expires: 7 });
        }

        // Handle remember me
        if (rememberMe) {
          const cookieOptions = {
            expires: 30,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
          };

          Cookies.set("rememberMe", "true", cookieOptions);
          Cookies.set("rememberEmail", formData.email, cookieOptions);
          Cookies.set("rememberPassword", formData.password, cookieOptions);
          resetInactivityTimer();
        } else {
          clearRememberMeCookies();
        }

        // Enhanced user data storage with profile completion status
        const profileStatus = determineProfileStatus(response.data);
        const userDataWithCompletion = {
          ...user,
          profile_completed: !profileStatus.needsProfile,
          is_first_login: is_first_login
        };
        
        localStorage.setItem("userData", JSON.stringify(userDataWithCompletion));
        localStorage.setItem("authenticated", "true");

        toast.success("Login successful!");

        // Simplified decision logic based on first login and profile status
        console.log('Login decision factors:', {
          is_first_login,
          user_phone: user.phone,
          profileStatus,
          userData: userDataWithCompletion
        });

        if (profileStatus.needsProfile) {
          // Profile needs completion - clear status and go to update profile
          localStorage.setItem("user_status", "");
          console.log('❌ Profile needs completion - redirecting to UPDATE PROFILE');
          navigate("/update-profile", { replace: true });
          toast.info("Please complete your profile to continue");
        } else {
          // Profile is complete - set active status and go to home
          localStorage.setItem("user_status", "active");
          console.log('✅ Profile complete - redirecting to HOME');
          navigate("/dashboard", { replace: true });
        }

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

  const resetInactivityTimer = () => {
    if (window.inactivityTimer) {
      clearTimeout(window.inactivityTimer);
    }
    window.inactivityTimer = setTimeout(() => {
      if (Cookies.get("rememberMe") === "true") {
        clearRememberMeCookies();
        toast.info("Remember me data cleared due to inactivity");
      }
    }, 5 * 24 * 60 * 60 * 1000);
  };

  const isFormValid = () => {
    return (
      formData.email &&
      formData.password &&
      !validationErrors.email &&
      !validationErrors.password
    );
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;