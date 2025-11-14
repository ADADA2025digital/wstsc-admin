import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetData, setResetData] = useState(null); // Store reset code, token and expiry
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateEmail = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email is invalid";
    }
    return errors;
  };

  const validateCode = () => {
    const errors = {};
    if (!formData.code) {
      errors.code = "Verification code is required";
    } else if (formData.code.length !== 6) {
      errors.code = "Code must be 6 digits";
    }
    return errors;
  };

  const validatePassword = () => {
    const errors = {};
    if (!formData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    return errors;
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    const errors = validateEmail();

    if (Object.keys(errors).length === 0) {
      setLoading(true);
      try {
        // Real API call to send verification code
        const response = await fetch(
          "https://wstsc.org.au/backend/api/forgot-password",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              email: formData.email,
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          console.log("Reset code sent:", data.data.reset_code);
          console.log("Expires at:", data.data.expires_at);

          // Store reset data for verification
          setResetData({
            reset_code: data.data.reset_code,
            expires_at: data.data.expires_at,
          });

          setCurrentStep(2);
          setSuccessMessage("Verification code sent to your email!");

          // Send email notification using EmailJS
          await sendEmailNotification(data.data.reset_code);
        } else {
          setValidationErrors({
            email:
              data.message ||
              "Failed to send verification code. Please try again.",
          });
        }
      } catch (error) {
        console.error("API Error:", error);
        setValidationErrors({
          email: "Network error. Please check your connection and try again.",
        });
      } finally {
        setLoading(false);
      }
    } else {
      setValidationErrors(errors);
    }
  };

  const sendEmailNotification = async (resetCode) => {
    try {
      // Configure EmailJS with your credentials
      const emailjsConfig = {
        serviceId: "service_1gocmzl",
        templateId: "template_z8gndis",
        publicKey: "Ro7uPiRIt-owJl0Nn",
      };

      const templateParams = {
        to_email: formData.email,
        user_name: formData.email.split("@")[0], // Extract name from email
        otp_code: resetCode,
        current_year: new Date().getFullYear(),
        expiry_time: "30 minutes", // From API response
      };

      await emailjs.send(
        emailjsConfig.serviceId,
        emailjsConfig.templateId,
        templateParams,
        emailjsConfig.publicKey
      );

      console.log("Email notification sent successfully");
    } catch (emailError) {
      console.error("Failed to send email notification:", emailError);
      // Don't show error to user as the main functionality (code generation) worked
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const errors = validateCode();

    if (Object.keys(errors).length === 0) {
      setLoading(true);
      try {
        // API verification
        const response = await fetch(
          "https://wstsc.org.au/backend/api/verify-reset-code",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              email: formData.email,
              reset_code: formData.code,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
          console.log("Code verified successfully via API");
          console.log("Reset token:", data.data.reset_token);
          console.log("New expires at:", data.data.expires_at);
          
          // Store the reset token for the password reset step
          setResetData(prev => ({
            ...prev,
            reset_token: data.data.reset_token,
            expires_at: data.data.expires_at
          }));
          
          setCurrentStep(3);
          setSuccessMessage("Code verified successfully!");
        } else {
          setValidationErrors({
            code: data.message || "Invalid verification code",
          });
        }
      } catch (error) {
        console.error("Verification error:", error);
        setValidationErrors({
          code: "Error verifying code. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    } else {
      setValidationErrors(errors);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const errors = validatePassword();

    if (Object.keys(errors).length === 0) {
      setLoading(true);
      try {
        // Use the reset_token from verify-reset-code API response
        const requestBody = {
          reset_token: resetData?.reset_token,
          new_password: formData.newPassword,
          new_password_confirmation: formData.confirmPassword,
        };

        console.log("Sending reset request with:", requestBody);

        const response = await fetch(
          "https://wstsc.org.au/backend/api/reset-password",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(requestBody),
          }
        );

        const data = await response.json();

        if (data.success) {
          console.log("Password reset successful");
          setSuccessMessage("Password reset successfully! Redirecting to login...");
          
          // Redirect to login after a short delay
          setTimeout(() => {
            navigate("/login");
          }, 2000);
          
        } else {
          setValidationErrors({
            submit:
              data.message || "Failed to reset password. Please try again.",
          });
        }
      } catch (error) {
        console.error("Reset password error:", error);
        setValidationErrors({
          submit: "Network error. Please check your connection and try again.",
        });
      } finally {
        setLoading(false);
      }
    } else {
      setValidationErrors(errors);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://wstsc.org.au/backend/api/forgot-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setResetData({
          reset_code: data.data.reset_code,
          expires_at: data.data.expires_at,
        });
        setSuccessMessage("Verification code sent again!");

        // Resend email notification
        await sendEmailNotification(data.data.reset_code);
      } else {
        setValidationErrors({
          code: data.message || "Failed to resend code. Please try again.",
        });
      }
    } catch (error) {
      setValidationErrors({
        code: "Network error. Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const handleBackToEmail = () => {
    setCurrentStep(1);
    setFormData(prev => ({ ...prev, code: "" }));
    setValidationErrors({});
    setSuccessMessage("");
  };

  const handleBackToCode = () => {
    setCurrentStep(2);
    setFormData(prev => ({ ...prev, newPassword: "", confirmPassword: "" }));
    setValidationErrors({});
    setSuccessMessage("");
  };

  const handleGoToLogin = () => {
    navigate("/login");
  };

  // Clear success message after 5 seconds
  React.useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Step 1: Enter Email
  const renderEmailStep = () => (
    <div className="form-container bg-white rounded-4 border p-4">
      <h3 className="title text-center fw-bold py-2 mb-2">
        Reset Your Password
      </h3>
      <p className="sub-title text-center mb-4">
        Enter your email address and we'll send you a verification code
      </p>

      {successMessage && (
        <div className="alert alert-success text-center small mb-3">
          {successMessage}
        </div>
      )}

      <form
        className="form w-100 d-flex flex-column gap-3 mb-3"
        onSubmit={handleSendCode}
      >
        <div>
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
            <div className="text-danger small mt-1">
              {validationErrors.email}
            </div>
          )}
        </div>

        <button
          className="border-0 text-white form-btn"
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: loading ? "#6c757d" : "#0d6efd",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Sending Code...
            </>
          ) : (
            "Send Verification Code"
          )}
        </button>
      </form>
    </div>
  );

  // Step 2: Enter Verification Code
  const renderCodeStep = () => (
    <div className="form-container bg-white rounded-4 border p-4">
      <h3 className="title text-center fw-bold py-2 mb-2">
        Enter Verification Code
      </h3>
      <div className="text-center mb-4">
        <p className="small mb-2">
          We sent a 6-digit code to <strong>{formData.email}</strong>
        </p>
        {resetData?.expires_at && (
          <div className="text-muted small mt-1">
            Code expires at:{" "}
            {new Date(resetData.expires_at.replace(' ', 'T') + 'Z').toLocaleTimeString()}
          </div>
        )}
      </div>

      {successMessage && (
        <div className="alert alert-success text-center small mb-3">
          {successMessage}
        </div>
      )}

      <form
        className="form w-100 d-flex flex-column gap-3 mb-3"
        onSubmit={handleVerifyCode}
      >
        <div>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            maxLength="6"
            className={`form-control input border text-center ${
              validationErrors.code ? "is-invalid" : ""
            }`}
            placeholder="Enter 6-digit code"
            required
            style={{
              fontSize: "18px",
              letterSpacing: "4px",
              fontWeight: "bold",
            }}
          />
          {validationErrors.code && (
            <div className="text-danger small mt-1">
              {validationErrors.code}
            </div>
          )}
        </div>

        <button
          className="border-0 text-white form-btn"
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: loading ? "#6c757d" : "#0d6efd",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </button>

        <div className="text-center">
          <button
            type="button"
            className="btn btn-link p-0 small sign-up-link"
            onClick={handleResendCode}
            disabled={loading}
          >
            Didn't receive code? Resend
          </button>
        </div>

  
      </form>
    </div>
  );

  // Step 3: Enter New Password
  const renderPasswordStep = () => (
    <div className="form-container bg-white rounded-4 border p-4">
      <h3 className="title text-center fw-bold py-2 mb-2">
        Create New Password
      </h3>
      <p className="small text-center mb-4">
        Your new password must be different from previous used passwords
      </p>

      {successMessage && (
        <div className="alert alert-success text-center small mb-3">
          {successMessage}
        </div>
      )}

      <form
        className="form w-100 d-flex flex-column gap-3 mb-3"
        onSubmit={handleResetPassword}
      >
        {/* New Password */}
        <div>
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              className={`form-control input border border-end-0 ${
                validationErrors.newPassword ? "is-invalid" : ""
              }`}
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
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
          {validationErrors.newPassword && (
            <div className="text-danger small mt-1">
              {validationErrors.newPassword}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <div className="input-group">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className={`form-control input border border-end-0 ${
                validationErrors.confirmPassword ? "is-invalid" : ""
              }`}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm new password"
              required
            />
            <span
              className="d-flex align-items-center"
              onClick={toggleConfirmPasswordVisibility}
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
              {showConfirmPassword ? (
                <i className="bi bi-eye-slash-fill"></i>
              ) : (
                <i className="bi bi-eye-fill"></i>
              )}
            </span>
          </div>
          {validationErrors.confirmPassword && (
            <div className="text-danger small mt-1">
              {validationErrors.confirmPassword}
            </div>
          )}
        </div>

        {validationErrors.submit && (
          <div className="alert alert-danger small mb-0">
            {validationErrors.submit}
          </div>
        )}

        <button
          className="border-0 text-white form-btn"
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: loading ? "#6c757d" : "#28a745",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
              Resetting Password...
            </>
          ) : (
            "Reset Password"
          )}
        </button>
      </form>
    </div>
  );

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
          <div className="col-12 col-md-6 col-lg-4 d-flex justify-content-center">
            {currentStep === 1 && renderEmailStep()}
            {currentStep === 2 && renderCodeStep()}
            {currentStep === 3 && renderPasswordStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;