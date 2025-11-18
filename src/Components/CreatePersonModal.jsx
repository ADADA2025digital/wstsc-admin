import React, { useState, useEffect } from "react";
import api from "../config/axiosConfig";
import emailjs from '@emailjs/browser';

const CreatePersonModal = ({ isOpen, onClose, onPersonCreated }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    person_first_name: "",
    person_last_name: "",
    person_email: "",
    role_id: "",
    schcode: "SCH01"
  });

  const EMAILJS_CONFIG = {
    serviceId: 'service_1gocmzl',
    templateId: 'template_n832gnt', 
    publicKey: 'Ro7uPiRIt-owJl0Nn',
  };

  useEffect(() => {
    if (isOpen) {
      emailjs.init(EMAILJS_CONFIG.publicKey);
      fetchRoles();
      setFormData({
        person_first_name: "",
        person_last_name: "",
        person_email: "",
        role_id: "",
        schcode: "SCH01"
      });
      setErrors({});
      setSuccess("");
    }
  }, [isOpen]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get("/roles");
      
      if (response.data.success) {
        const uniqueRoles = response.data.data.filter((role, index, self) => 
          index === self.findIndex(r => r.role_name === role.role_name)
        );
        setRoles(uniqueRoles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setErrors({ general: "Failed to load roles. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const sendSetupEmail = async (personData) => {
    try {
      const templateParams = {
        to_name: `${personData.first_name} ${personData.last_name}`,
        to_email: personData.email,
        setup_url: personData.setup_url,
        expires_at: new Date(personData.expires_at).toLocaleString(),
        from_name: "Western Sydney Tamil Study Centre",
        school_name: "Western Sydney Tamil Study Centre",
        support_email: "info@wstsc.org.au",
        person_type: personData.primary_role?.display_name || "User",
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      return response.status === 200;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess("");

    // Validation
    if (!formData.person_first_name || !formData.person_last_name || !formData.person_email || !formData.role_id) {
      setErrors({ general: "All fields are required" });
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.person_email)) {
      setErrors({ general: "Please enter a valid email address" });
      setLoading(false);
      return;
    }

    try {
      const apiData = {
        person_first_name: formData.person_first_name.trim(),
        person_last_name: formData.person_last_name.trim(),
        person_email: formData.person_email.toLowerCase().trim(),
        role_id: [parseInt(formData.role_id)],
        schcode: formData.schcode
      };

      const response = await api.post("/admin/persons", apiData);

      if (response.data.success) {
        const { setup_url, expires_at, person, user } = response.data.data;
        
        // Show success message
        setSuccess("Person created successfully! Sending setup email...");

        // Notify parent component
        if (onPersonCreated) {
          onPersonCreated({
            ...person,
            ...user,
            setup_url,
            expires_at,
            requires_password_update: true
          });
        }

        // Send email in background
        sendSetupEmail({
          setup_url,
          expires_at,
          person_name: `${person.person_first_name} ${person.person_last_name}`,
          email: person.person_email,
          first_name: person.person_first_name,
          last_name: person.person_last_name,
          primary_role: user.primary_role
        });

        // Close modal after showing success message briefly
        setTimeout(() => {
          onClose();
        }, 1000);

      } else {
        setErrors({
          general: response.data.message || "Failed to create person",
        });
      }
    } catch (error) {
      console.error("Error creating person:", error);
      
      if (error.response?.status === 422) {
        const validationErrors = error.response.data?.errors;
        if (validationErrors) {
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
        setErrors({ general: "Failed to create person. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-person-badge text-primary me-2"></i>
              Add New Person
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {errors.general && (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {errors.general}
                </div>
              )}

              {success && (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                </div>
              )}

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
                    name="person_first_name"
                    className="form-control"
                    placeholder="Enter first name"
                    value={formData.person_first_name}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="person_last_name"
                    className="form-control"
                    placeholder="Enter last name"
                    value={formData.person_last_name}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-md-8 mb-3">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="person_email"
                    className="form-control"
                    placeholder="Enter email address"
                    value={formData.person_email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">
                    Role <span className="text-danger">*</span>
                  </label>
                  <select
                    name="role_id"
                    className="form-select"
                    value={formData.role_id}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.roleid} value={role.roleid}>
                        {role.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 mt-3">
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-shield-lock me-2"></i>
                    Account Setup
                  </h6>
                  <div className="alert alert-info">
                    <small>
                      <i className="bi bi-info-circle me-2"></i>
                      The person will receive a setup link via email to create their password.
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="btn custom-btn"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create Person"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePersonModal;