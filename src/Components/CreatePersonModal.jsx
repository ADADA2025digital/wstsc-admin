import React, { useState, useEffect } from "react";
import api from "../config/axiosConfig";
import emailjs from '@emailjs/browser';

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
    schcode: "SCH01"
  });

  const EMAILJS_CONFIG = {
    serviceId: 'service_1gocmzl',
    templateId: 'template_n832gnt', 
    publicKey: 'Ro7uPiRIt-owJl0Nn',
  };

  // Roles to hide from selection - case insensitive
  const ROLES_TO_HIDE = ['staff', 'student'];

  useEffect(() => {
    if (isOpen) {
      emailjs.init(EMAILJS_CONFIG.publicKey);
      fetchRoles();
      setFormData({
        person_first_name: "",
        person_last_name: "",
        person_email: "",
        schcode: "SCH01"
      });
      setSelectedRoles([]);
      setErrors({});
      setSuccess("");
    }
  }, [isOpen]);

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
        const uniqueRoles = response.data.data.filter((role, index, self) => 
          index === self.findIndex(r => r.role_name === role.role_name)
        );

        // Then filter out roles that should be hidden (case insensitive)
        const filteredRoles = uniqueRoles.filter(role => {
          const roleNameLower = role.role_name.toLowerCase();
          const shouldHide = ROLES_TO_HIDE.some(hiddenRole => 
            roleNameLower.includes(hiddenRole.toLowerCase())
          );
          return !shouldHide;
        });
        
        console.log("Filtered roles after hiding staff and students:", filteredRoles);
        console.log("Number of filtered roles:", filteredRoles.length);
        
        // Log each role individually
        filteredRoles.forEach((role, index) => {
          console.log(`Role ${index + 1}:`, {
            roleid: role.roleid,
            role_name: role.role_name,
            display_name: role.display_name,
            full_object: role
          });
        });
        
        setRoles(filteredRoles);
      } else {
        console.log("Roles fetch not successful, message:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      setErrors({ general: "Failed to load roles. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Alternative approach - if you want exact matching but case insensitive:
  const fetchRolesAlternative = async () => {
    try {
      setLoading(true);
      const response = await api.get("/roles");
      
      if (response.data.success) {
        const uniqueRoles = response.data.data.filter((role, index, self) => 
          index === self.findIndex(r => r.role_name === role.role_name)
        );

        // More precise filtering - check both role_name and display_name
        const filteredRoles = uniqueRoles.filter(role => {
          const roleNameLower = role.role_name.toLowerCase();
          const displayNameLower = role.display_name?.toLowerCase() || '';
          
          // Hide if role_name or display_name contains "staff" or "student"
          const shouldHide = 
            roleNameLower.includes('staff') ||
            roleNameLower.includes('student') ||
            displayNameLower.includes('staff') ||
            displayNameLower.includes('student');
            
          return !shouldHide;
        });
        
        setRoles(filteredRoles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setErrors({ general: "Failed to load roles. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Even more precise approach - check the actual role names in your system
  const fetchRolesPrecise = async () => {
    try {
      setLoading(true);
      const response = await api.get("/roles");
      
      if (response.data.success) {
        const uniqueRoles = response.data.data.filter((role, index, self) => 
          index === self.findIndex(r => r.role_name === role.role_name)
        );

        // Log all roles to see what we're working with
        console.log("All available roles:", uniqueRoles.map(r => ({
          roleid: r.roleid,
          role_name: r.role_name,
          display_name: r.display_name
        })));

        // Filter out specific roles - adjust these based on your actual role names
        const filteredRoles = uniqueRoles.filter(role => {
          const roleNameLower = role.role_name.toLowerCase();
          // Add any variations of staff/student roles you want to hide
          return !['staff', 'student', 'students'].includes(roleNameLower);
        });
        
        setRoles(filteredRoles);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
      setErrors({ general: "Failed to load roles. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (roleId) => {
    console.log("Role checkbox changed, roleId:", roleId);
    console.log("Current selected roles before change:", selectedRoles);
    
    setSelectedRoles(prev => {
      if (prev.includes(roleId)) {
        const newRoles = prev.filter(id => id !== roleId);
        console.log("Removed role, new selected roles:", newRoles);
        return newRoles;
      } else {
        const newRoles = [...prev, roleId];
        console.log("Added role, new selected roles:", newRoles);
        return newRoles;
      }
    });
  };

  const sendSetupEmail = async (personData) => {
    try {
      // Get all selected role names
      const selectedRoleNames = personData.all_roles.map(role => role.display_name || role.role_name);
      const rolesText = selectedRoleNames.join(', ');

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
        roles_list: selectedRoleNames.join(', '), // Comma separated string of all roles
        roles_count: selectedRoleNames.length, // Number of roles
        first_name: personData.first_name,
        last_name: personData.last_name
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

    if (!formData.person_first_name || !formData.person_last_name || !formData.person_email || selectedRoles.length === 0) {
      setErrors({ general: "All fields are required and at least one role must be selected" });
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
        role_id: selectedRoles.map(id => parseInt(id)),
        schcode: formData.schcode
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
            requires_password_update: true
          });
        }

        // Get the display names for all selected roles
        const allSelectedRoles = roles.filter(role => 
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
          role_ids: selectedRoles
        });

        if (emailSent) {
          setSuccess("Person created successfully and setup email sent!");
        } else {
          setSuccess("Person created successfully but failed to send setup email.");
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

                <div className="col-12 mb-3">
                  <label className="form-label">
                    Roles <span className="text-danger">*</span>
                    <small className="text-muted ms-2">(Select one or more roles)</small>
                  </label>
                  <div className="roles-checkbox-container" style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "0.375rem", padding: "1rem" }}>
                    {loading ? (
                      <div className="text-center">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Loading roles...</span>
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
                              <label className="form-check-label" htmlFor={`role-${role.roleid}`}>
                                {role.display_name}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted text-center">No roles available</div>
                    )}
                  </div>
                  {selectedRoles.length > 0 && (
                    <div className="mt-2">
                      <small className="text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        {selectedRoles.length} role(s) selected: {roles.filter(role => selectedRoles.includes(role.roleid)).map(role => role.display_name).join(', ')}
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
                      The person will receive a setup link via email to create their password. All assigned roles ({selectedRoles.length}) will be listed in the email.
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