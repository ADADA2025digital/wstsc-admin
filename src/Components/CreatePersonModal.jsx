import React, { useState, useEffect } from "react";
import emailjs from '@emailjs/browser';
import { toast } from "react-toastify";
import api from "../config/axiosConfig";

const CreatePersonModal = ({ isOpen, onClose, onPersonCreated, personType = "teacher" }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role_id: personType === "teacher" ? 3 : 2, // Changed to role_id (single value)
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [setupData, setSetupData] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Email.js configuration
  const EMAILJS_CONFIG = {
    serviceId: 'service_atcmru7',
    templateId: 'template_stoertv', 
    publicKey: '1JhpDFWb4tZlLmkCh',
  };

  // Initialize Email.js
  useEffect(() => {
    emailjs.init(EMAILJS_CONFIG.publicKey);
  }, []);

  // Configuration based on person type
  const getConfig = () => {
    const configs = {
      teacher: {
        title: "Add New Teacher",
        icon: "bi bi-person-badge",
        successMessage: "Teacher created successfully!",
        emailSubject: "Western Sydney Tamil Study Centre - Teacher Account Setup",
        roleName: "Teacher",
        defaultRoleId: 3
      },
      parent: {
        title: "Add New Parent", 
        icon: "bi bi-person-plus-fill",
        successMessage: "Parent created successfully!",
        emailSubject: "Western Sydney Tamil Study Centre - Parent Account Setup",
        roleName: "Parent",
        defaultRoleId: 2
      }
    };
    return configs[personType] || configs.teacher;
  };

  const config = getConfig();

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await api.get("/roles");
      
      if (response.data.success) {
        const rolesData = response.data.data;
        console.log("Fetched roles:", rolesData);
        setRoles(Array.isArray(rolesData) ? rolesData : []);
      } else {
        setErrors({ general: "Failed to load roles" });
        setRoles([]);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setErrors({ general: "Failed to load roles. Please try again." });
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
      resetForm();
    }
  }, [isOpen]);

  // Reset form when personType changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      role_id: config.defaultRoleId // Changed to role_id
    }));
  }, [personType, config.defaultRoleId]);

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      role_id: config.defaultRoleId, // Changed to role_id
    });
    setErrors({});
    setSuccess("");
    setSetupData(null);
    setSendingEmail(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    // Clear general error when user makes any change
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: "" }));
    }
  };

  const sendSetupEmail = async (personData) => {
    try {
      setSendingEmail(true);
      
      const templateParams = {
        to_name: `${personData.first_name} ${personData.last_name}`,
        to_email: personData.email,
        setup_url: personData.setup_url,
        expires_at: new Date(personData.expires_at).toLocaleString(),
        from_name: "Western Sydney Tamil Study Centre",
        school_name: "Western Sydney Tamil Study Centre",
        support_email: "info@wstsc.org.au",
        person_type: config.roleName,
      };

      console.log("Sending email with params:", templateParams);

      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      console.log("EmailJS response:", response);

      if (response.status === 200) {
        toast.success(`Setup email sent successfully to ${config.roleName.toLowerCase()}!`);
        return true;
      } else {
        throw new Error(`EmailJS returned status: ${response.status}`);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      
      if (error.text) {
        console.error('EmailJS error details:', error.text);
      }
      
      toast.error(
        `Failed to send setup email: ${error.message || 'Please copy the link and send it manually.'}`
      );
      return false;
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess("");
    setSetupData(null);

    // Validation
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setErrors({ general: "First name, last name, and email are required" });
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrors({ general: "Please enter a valid email address" });
      setLoading(false);
      return;
    }

    try {
      // Prepare data for API - match Postman format exactly
      const apiData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.toLowerCase().trim(),
        role_id: formData.role_id // Single role_id, not array
      };

      console.log(`Creating ${personType}:`, apiData);
      const response = await api.post("/admin/persons", apiData);
      console.log(`Create ${personType} response:`, response.data);

      if (response.data.success) {
        const { setup_url, expires_at, person, assigned_roles } = response.data.data;
        
        // Store setup data for display
        const personSetupData = {
          setup_url,
          expires_at,
          person_name: `${person.first_name} ${person.last_name}`,
          email: person.email,
          first_name: person.first_name,
          last_name: person.last_name
        };

        setSetupData(personSetupData);
        setSuccess(`${config.successMessage} Sending setup email...`);

        // Send email automatically
        const emailSent = await sendSetupEmail(personSetupData);

        if (emailSent) {
          setSuccess(`${config.successMessage} Setup email has been sent to the ${config.roleName.toLowerCase()}.`);
        } else {
          setSuccess(`${config.successMessage} Please copy the setup link and send it to the ${config.roleName.toLowerCase()} manually.`);
        }

        // Notify parent component
        if (onPersonCreated) {
          onPersonCreated({
            ...person,
            setup_url,
            expires_at,
            assigned_roles,
            requires_password_update: true
          });
        }

      } else {
        setErrors({
          general: response.data.message || `Failed to create ${config.roleName.toLowerCase()}`,
        });
      }
    } catch (error) {
      console.error(`Error creating ${personType}:`, error);
      
      // Handle 422 validation errors specifically
      if (error.response?.status === 422) {
        const validationErrors = error.response.data?.errors;
        if (validationErrors) {
          // Convert Laravel validation errors to a flat object
          const flattenedErrors = {};
          Object.keys(validationErrors).forEach(key => {
            flattenedErrors[key] = Array.isArray(validationErrors[key]) 
              ? validationErrors[key][0] 
              : validationErrors[key];
          });
          setErrors(flattenedErrors);
        } else {
          setErrors({ general: error.response.data?.message || "Validation failed" });
        }
      } 
      else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: `Failed to create ${config.roleName.toLowerCase()}. Please try again.` });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Setup link copied to clipboard!");
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toast.error("Failed to copy to clipboard");
    });
  };

  const resendEmail = async () => {
    if (!setupData) return;
    
    const emailSent = await sendSetupEmail(setupData);
    if (emailSent) {
      toast.success("Setup email resent successfully!");
    }
  };

  // Get the role name for display
  const getRoleDisplayName = () => {
    if (!Array.isArray(roles) || roles.length === 0) {
      return config.roleName;
    }
    
    const role = roles.find(r => r.id === config.defaultRoleId);
    
    if (role) {
      return role.display_name || role.name || config.roleName;
    }
    
    return config.roleName;
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={`${config.icon} text-primary me-2`}></i>
              {config.title}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={loading || sendingEmail}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {/* Success Message with Setup Link */}
              {success && setupData && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                  
                  <div className="mt-3 p-3 bg-light rounded">
                    <h6 className="fw-bold mb-2">{config.roleName} Setup Information:</h6>
                    <p className="mb-1"><strong>Name:</strong> {setupData.person_name}</p>
                    <p className="mb-1"><strong>Email:</strong> {setupData.email}</p>
                    <p className="mb-2"><strong>Link Expires:</strong> {new Date(setupData.expires_at).toLocaleString()}</p>
                    
                    <div className="input-group mb-3">
                      <input
                        type="text"
                        className="form-control"
                        value={setupData.setup_url}
                        readOnly
                        style={{ fontFamily: 'monospace', fontSize: '14px' }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => copyToClipboard(setupData.setup_url)}
                        disabled={sendingEmail}
                      >
                        <i className="bi bi-clipboard me-1"></i> Copy Link
                      </button>
                    </div>

                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={resendEmail}
                        disabled={sendingEmail}
                      >
                        {sendingEmail ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-envelope me-1"></i>
                            Resend Email
                          </>
                        )}
                      </button>
                      
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => copyToClipboard(setupData.setup_url)}
                        disabled={sendingEmail}
                      >
                        <i className="bi bi-clipboard me-1"></i>
                        Copy Link Only
                      </button>

                      <a
                        href={`mailto:${setupData.email}?subject=${encodeURIComponent(config.emailSubject)}&body=${encodeURIComponent(`Hello ${setupData.person_name},\n\nPlease use the following link to set up your ${config.roleName.toLowerCase()} account:\n\n${setupData.setup_url}\n\nThis link expires on: ${new Date(setupData.expires_at).toLocaleString()}\n\nBest regards,\nWestern Sydney Tamil Study Centre Team`)}`}
                        className="btn btn-outline-info btn-sm"
                      >
                        <i className="bi bi-send me-1"></i>
                        Open Email Client
                      </a>
                    </div>
                    
                    <small className="text-muted mt-2 d-block">
                      <strong>Important:</strong> The {config.roleName.toLowerCase()} must use this link to set their password before logging in.
                    </small>
                  </div>
                </div>
              )}

              {/* Field-specific errors */}
              {(errors.email || errors.first_name || errors.last_name || errors.role_id) && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Please fix the following errors:
                  <ul className="mb-0 mt-1">
                    {errors.email && <li>{errors.email}</li>}
                    {errors.first_name && <li>{errors.first_name}</li>}
                    {errors.last_name && <li>{errors.last_name}</li>}
                    {errors.role_id && <li>{errors.role_id}</li>}
                  </ul>
                </div>
              )}

              {/* General Error */}
              {errors.general && !errors.email && !errors.first_name && !errors.last_name && !errors.role_id && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {errors.general}
                </div>
              )}

              {/* Only show form if not in success state */}
              {!success && (
                <div className="row">
                  <div className="col-12">
                    <h6 className="text-primary mb-3">
                      <i className="bi bi-person-badge me-2"></i>
                      Basic Information
                    </h6>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      First Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      className={`form-control ${errors.first_name ? "is-invalid" : ""}`}
                      value={formData.first_name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Enter first name"
                    />
                    {errors.first_name && (
                      <div className="invalid-feedback">{errors.first_name}</div>
                    )}
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">
                      Last Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      className={`form-control ${errors.last_name ? "is-invalid" : ""}`}
                      value={formData.last_name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Enter last name"
                    />
                    {errors.last_name && (
                      <div className="invalid-feedback">{errors.last_name}</div>
                    )}
                  </div>

                  <div className="col-md-8 mb-3">
                    <label className="form-label">
                      Email <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <div className="invalid-feedback">{errors.email}</div>
                    )}
                    {errors.email && errors.email.includes("already been taken") && (
                      <small className="text-warning">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        This email is already registered. Please use a different email address.
                      </small>
                    )}
                  </div>

                  <div className="col-md-4 mb-3">
                    <label className="form-label">
                      Role <span className="text-danger">*</span>
                    </label>
                    {rolesLoading ? (
                      <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <span className="text-muted">Loading roles...</span>
                      </div>
                    ) : (
                      <div className="form-control bg-light" style={{ minHeight: '38px', display: 'flex', alignItems: 'center' }}>
                        <div className="d-flex align-items-center justify-content-between w-100">
                          <span className="fw-medium text-dark">{getRoleDisplayName()}</span>
                          <i className="bi bi-lock-fill text-muted"></i>
                        </div>
                        <input
                          type="hidden"
                          name="role_id"
                          value={formData.role_id}
                        />
                      </div>
                    )}
                    <small className="form-text text-muted">
                      Role is automatically set to {config.roleName.toLowerCase()}
                    </small>
                  </div>

                  <div className="col-12 mt-3">
                    <h6 className="text-primary mb-3">
                      <i className="bi bi-shield-lock me-2"></i>
                      Account Setup
                    </h6>
                    <div className="alert alert-info">
                      <small>
                        <i className="bi bi-info-circle me-2"></i>
                        The {config.roleName.toLowerCase()} will automatically receive a setup link via email to create their password using Email.js.
                      </small>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClose}
                disabled={loading || sendingEmail}
              >
                <i className="bi bi-x-circle me-2"></i>
                {success ? "Close" : "Cancel"}
              </button>
              
              {/* Only show create button if not in success state */}
              {!success && (
                <button
                  type="submit"
                  className="btn custom-btn"
                  disabled={loading || rolesLoading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      Create {config.roleName}
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePersonModal;