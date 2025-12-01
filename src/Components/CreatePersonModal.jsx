import React, { useState, useEffect } from "react";
import api from "../config/axiosConfig";
import emailjs from "@emailjs/browser";

const CreatePersonModal = ({ isOpen, onClose, onPersonCreated }) => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [formData, setFormData] = useState({
    person_first_name: "",
    person_last_name: "",
    person_email: "",
    schcode: "SCH01",
  });

  const EMAILJS_CONFIG = {
    serviceId: "service_1gocmzl",
    templateId: "template_n832gnt",
    publicKey: "Ro7uPiRIt-owJl0Nn",
  };

  // Roles to hide from selection - case insensitive
  const ROLES_TO_HIDE = ["staff", "student"];

  useEffect(() => {
    if (isOpen) {
      emailjs.init(EMAILJS_CONFIG.publicKey);
      fetchRoles();
      setFormData({
        person_first_name: "",
        person_last_name: "",
        person_email: "",
        schcode: "SCH01",
      });
      setSelectedRoles([]);
      setErrors({});
      setSuccess("");
    }
  }, [isOpen]);

  // Validation functions
  const validateFirstName = (firstName) => {
    if (!firstName.trim()) {
      return "First name is required";
    }
    if (firstName.trim().length < 3) {
      return "First name must be at least 3 characters long";
    }
    if (!/^[a-zA-Z\s]+$/.test(firstName.trim())) {
      return "First name can only contain letters and spaces";
    }
    if (firstName.trim().length > 50) {
      return "First name cannot exceed 50 characters";
    }
    return "";
  };

  const validateLastName = (lastName) => {
    if (!lastName.trim()) {
      return "Last name is required";
    }
    if (lastName.trim().length < 3) {
      return "Last name must be at least 3 characters long";
    }
    if (!/^[a-zA-Z\s]+$/.test(lastName.trim())) {
      return "Last name can only contain letters and spaces";
    }
    if (lastName.trim().length > 50) {
      return "Last name cannot exceed 50 characters";
    }
    return "";
  };

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "Email is required";
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return "Please enter a valid email address (e.g., example@domain.com)";
    }
    
    // More comprehensive email validation
    const parts = email.trim().split('@');
    if (parts.length !== 2) {
      return "Invalid email format";
    }
    
    const localPart = parts[0];
    const domainPart = parts[1];
    
    if (localPart.length === 0) {
      return "Email local part cannot be empty";
    }
    
    if (domainPart.length === 0) {
      return "Email domain cannot be empty";
    }
    
    if (!domainPart.includes('.')) {
      return "Email domain must contain a dot (.)";
    }
    
    if (email.trim().length > 254) {
      return "Email address is too long";
    }
    
    return "";
  };

  // Check if all required fields are filled
  const areAllFieldsFilled = () => {
    return (
      formData.person_first_name.trim() &&
      formData.person_last_name.trim() &&
      formData.person_email.trim() &&
      selectedRoles.length > 0
    );
  };

  // Real-time validation on input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear general error when user makes any change
    if (errors.general) {
      setErrors((prev) => ({
        ...prev,
        general: "",
      }));
    }
  };

  // Validate individual field (for onBlur or real-time)
  const validateField = (name, value) => {
    let error = "";
    
    switch (name) {
      case "person_first_name":
        error = validateFirstName(value);
        break;
      case "person_last_name":
        error = validateLastName(value);
        break;
      case "person_email":
        error = validateEmail(value);
        break;
      default:
        break;
    }
    
    return error;
  };

  // Handle field blur for validation
  const handleFieldBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      console.log("Fetching roles from /roles endpoint...");

      const response = await api.get("/roles");
      console.log("Full API response:", response);
      console.log("Response data:", response.data);
      console.log("Response status:", response.status);

      if (response.data.success) {
        console.log("Roles fetch successful, data:", response.data.data);

        // First filter out duplicate roles
        const uniqueRoles = response.data.data.filter(
          (role, index, self) =>
            index === self.findIndex((r) => r.role_name === role.role_name)
        );

        // Then filter out roles that should be hidden (case insensitive)
        const filteredRoles = uniqueRoles.filter((role) => {
          const roleNameLower = role.role_name.toLowerCase();
          const shouldHide = ROLES_TO_HIDE.some((hiddenRole) =>
            roleNameLower.includes(hiddenRole.toLowerCase())
          );
          return !shouldHide;
        });

        console.log(
          "Filtered roles after hiding staff and students:",
          filteredRoles
        );
        console.log("Number of filtered roles:", filteredRoles.length);

        // Log each role individually
        filteredRoles.forEach((role, index) => {
          console.log(`Role ${index + 1}:`, {
            roleid: role.roleid,
            role_name: role.role_name,
            display_name: role.display_name,
            full_object: role,
          });
        });

        setRoles(filteredRoles);
      } else {
        console.log(
          "Roles fetch not successful, message:",
          response.data.message
        );
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data,
      });
      setErrors({ general: "Failed to load roles. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (roleId) => {
    console.log("Role checkbox changed, roleId:", roleId);
    console.log("Current selected roles before change:", selectedRoles);

    setSelectedRoles((prev) => {
      if (prev.includes(roleId)) {
        const newRoles = prev.filter((id) => id !== roleId);
        console.log("Removed role, new selected roles:", newRoles);
        return newRoles;
      } else {
        const newRoles = [...prev, roleId];
        console.log("Added role, new selected roles:", newRoles);
        return newRoles;
      }
    });

    // Clear general error when roles are selected
    if (errors.general && errors.general.includes("role")) {
      setErrors((prev) => ({
        ...prev,
        general: "",
      }));
    }
  };

  const sendSetupEmail = async (personData) => {
    try {
      // Get all selected role names
      const selectedRoleNames = personData.all_roles.map(
        (role) => role.display_name || role.role_name
      );
      const rolesText = selectedRoleNames.join(", ");

      const templateParams = {
        to_name: `${personData.first_name} ${personData.last_name}`,
        to_email: personData.email,
        setup_url: personData.setup_url,
        expires_at: new Date(personData.expires_at).toLocaleString(),
        from_name: "Western Sydney Tamil Study Centre",
        school_name: "Western Sydney Tamil Study Centre",
        support_email: "info@wstsc.org.au",
        person_type: rolesText, // Now contains all roles separated by commas
        all_roles: rolesText, // Additional parameter with all roles
        roles_list: selectedRoleNames.join(", "), // Comma separated string of all roles
        roles_count: selectedRoleNames.length, // Number of roles
        first_name: personData.first_name,
        last_name: personData.last_name,
      };

      console.log("Sending email with parameters:", templateParams);

      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams
      );

      console.log("Email sent successfully:", response);
      return response.status === 200;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess("");

    // First check if all fields are filled
    if (!areAllFieldsFilled()) {
      setErrors({ 
        general: "All fields are required" 
      });
      setLoading(false);
      return;
    }

    // Then validate field formats
    const firstNameError = validateFirstName(formData.person_first_name);
    const lastNameError = validateLastName(formData.person_last_name);
    const emailError = validateEmail(formData.person_email);

    // Collect all validation errors
    const validationErrors = {};
    if (firstNameError) validationErrors.person_first_name = firstNameError;
    if (lastNameError) validationErrors.person_last_name = lastNameError;
    if (emailError) validationErrors.person_email = emailError;
    
    // If there are field-specific errors
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const apiData = {
        person_first_name: formData.person_first_name.trim(),
        person_last_name: formData.person_last_name.trim(),
        person_email: formData.person_email.toLowerCase().trim(),
        role_id: selectedRoles.map((id) => parseInt(id)),
        schcode: formData.schcode,
      };

      console.log("Submitting person data:", apiData);

      const response = await api.post("/admin/persons", apiData);

      if (response.data.success) {
        const { setup_url, expires_at, person, user } = response.data.data;

        setSuccess("Person created successfully! Sending setup email...");

        if (onPersonCreated) {
          onPersonCreated({
            ...person,
            ...user,
            setup_url,
            expires_at,
            requires_password_update: true,
          });
        }

        // Get the display names for all selected roles
        const allSelectedRoles = roles.filter((role) =>
          selectedRoles.includes(role.roleid)
        );

        console.log("All selected roles for email:", allSelectedRoles);

        // Send setup email with all roles
        const emailSent = await sendSetupEmail({
          setup_url,
          expires_at,
          person_name: `${person.person_first_name} ${person.person_last_name}`,
          email: person.person_email,
          first_name: person.person_first_name,
          last_name: person.person_last_name,
          primary_role: user.primary_role,
          all_roles: allSelectedRoles, // Pass all selected roles
          role_ids: selectedRoles,
        });

        if (emailSent) {
          setSuccess("Person created successfully and setup email sent!");
        } else {
          setSuccess(
            "Person created successfully but failed to send setup email."
          );
        }

        setTimeout(() => {
          onClose();
        }, 2000);
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
          Object.keys(validationErrors).forEach((key) => {
            flattenedErrors[key] = Array.isArray(validationErrors[key])
              ? validationErrors[key][0]
              : validationErrors[key];
          });
          setErrors(flattenedErrors);
        } else {
          setErrors({
            general: error.response.data?.message || "Validation failed",
          });
        }
      } else if (error.response?.data?.message) {
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
    <div
      className="modal fade show"
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
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
            <div
              className="modal-body scrollable-container"
              style={{ maxHeight: "70vh", overflowY: "auto" }}
            >
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
                    className={`form-control ${errors.person_first_name ? 'is-invalid' : ''}`}
                    placeholder="Enter first name"
                    value={formData.person_first_name}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    disabled={loading}
                  />
                  {errors.person_first_name && (
                    <div className="invalid-feedback">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      {errors.person_first_name}
                    </div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="person_last_name"
                    className={`form-control ${errors.person_last_name ? 'is-invalid' : ''}`}
                    placeholder="Enter last name"
                    value={formData.person_last_name}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    disabled={loading}
                  />
                  {errors.person_last_name && (
                    <div className="invalid-feedback">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      {errors.person_last_name}
                    </div>
                  )}
                </div>

                <div className="col-md-8 mb-3">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    name="person_email"
                    className={`form-control ${errors.person_email ? 'is-invalid' : ''}`}
                    placeholder="Enter valid email address"
                    value={formData.person_email}
                    onChange={handleInputChange}
                    onBlur={handleFieldBlur}
                    disabled={loading}
                  />
                  {errors.person_email && (
                    <div className="invalid-feedback">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      {errors.person_email}
                    </div>
                  )}
                </div>

                <div className="col-12 mb-3">
                  <label className="form-label">
                    Roles <span className="text-danger">*</span>
                    <small className="text-muted ms-2">
                      (Select one or more roles)
                    </small>
                  </label>
                  <div
                    className="roles-checkbox-container"
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      border: errors.general && selectedRoles.length === 0 ? "1px solid #dc3545" : "1px solid #dee2e6",
                      borderRadius: "0.375rem",
                      padding: "1rem",
                    }}
                  >
                    {loading ? (
                      <div className="text-center">
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        >
                          <span className="visually-hidden">
                            Loading roles...
                          </span>
                        </div>
                        <span className="ms-2">Loading roles...</span>
                      </div>
                    ) : roles.length > 0 ? (
                      <div className="row">
                        {roles.map((role) => (
                          <div key={role.roleid} className="col-md-6 mb-2">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`role-${role.roleid}`}
                                value={role.roleid}
                                checked={selectedRoles.includes(role.roleid)}
                                onChange={() => handleRoleChange(role.roleid)}
                                disabled={loading}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`role-${role.roleid}`}
                              >
                                {role.display_name}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted text-center">
                        No roles available
                      </div>
                    )}
                  </div>
                  {errors.general && selectedRoles.length === 0 && (
                    <div className="text-danger small mt-1">
                      <i className="bi bi-exclamation-circle me-1"></i>
                      Please select at least one role
                    </div>
                  )}
                  {selectedRoles.length > 0 && (
                    <div className="mt-2">
                      <small className="text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        {selectedRoles.length} role(s) selected:{" "}
                        {roles
                          .filter((role) => selectedRoles.includes(role.roleid))
                          .map((role) => role.display_name)
                          .join(", ")}
                      </small>
                    </div>
                  )}
                </div>

                <div className="col-12 mt-3">
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-shield-lock me-2"></i>
                    Account Setup
                  </h6>
                  <div className="alert alert-info">
                    <small>
                      <i className="bi bi-info-circle me-2"></i>
                      The person will receive a setup link via email to create
                      their password. All assigned roles ({selectedRoles.length}
                      ) will be listed in the email.
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer d-flex justify-content-between">
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