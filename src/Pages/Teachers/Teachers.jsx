import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import $ from "jquery";
import api from "../../config/axiosConfig";
import Form from "react-bootstrap/Form";

if (typeof window !== "undefined") {
  window.$ = $;
  window.jQuery = $;
}

const CreateTeacherModal = ({ isOpen, onClose, onTeacherCreated }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role_ids: [3], // Teacher role ID from API response
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  // Fetch available roles from the correct API endpoint
  const fetchRoles = async () => {
    try {
      setRolesLoading(true);
      console.log("Fetching roles from API...");

      // Using the correct endpoint from your API response
      const response = await api.get("/roles");
      console.log("Roles API Response:", response.data);

      if (response.data.success) {
        const rolesData = response.data.data;

        if (rolesData && Array.isArray(rolesData)) {
          setRoles(rolesData);
        } else {
          console.warn("Unexpected roles data format:", rolesData);
          setRoles([]);
        }
      } else {
        console.error("Failed to fetch roles:", response.data.message);
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

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      role_ids: [3], // Default to teacher role
    });
    setErrors({});
    setSuccess("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleRoleChange = (e) => {
    const selectedRoleId = parseInt(e.target.value);
    setFormData((prev) => ({
      ...prev,
      role_ids: [selectedRoleId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess("");

    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.email) {
      setErrors({ general: "First name, last name, and email are required" });
      setLoading(false);
      return;
    }

    try {
      console.log("Submitting teacher data:", formData);

      // Use the correct API endpoint from your response - /admin/persons
      const response = await api.post("/admin/persons", formData);
      console.log("Create teacher response:", response.data);

      if (response.data.success) {
        setSuccess("Teacher created successfully!");

        // Extract the temporary password from response
        const tempPassword = response.data.data.temp_password;
        const teacherData = {
          ...response.data.data.person,
          temp_password: tempPassword,
          requires_password_update: response.data.data.requires_password_update,
          assigned_roles: response.data.data.assigned_roles,
        };

        // Notify parent component with complete data including temp password
        if (onTeacherCreated) {
          onTeacherCreated(teacherData);
        }

        // Show success message with temporary password
        setSuccess(
          `Teacher created successfully! Temporary password: ${tempPassword}`
        );

        // Close modal after success
        setTimeout(() => {
          onClose();
          resetForm();
        }, 3000); // Longer timeout to show the password
      } else {
        setErrors({
          general: response.data.message || "Failed to create teacher",
        });
      }
    } catch (error) {
      console.error("Error creating teacher:", error);

      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response?.data?.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({
          general: "Failed to create teacher. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Safe role rendering function
  const renderRoleOptions = () => {
    if (!Array.isArray(roles)) {
      console.error("Roles is not an array:", roles);
      return <option value="">No roles available</option>;
    }

    if (roles.length === 0) {
      return <option value="">No roles found</option>;
    }

    return roles.map((role) => {
      // Use the structure from your API response
      const roleId = role.id;
      const roleName = role.display_name || role.name || "Unknown Role";

      return (
        <option key={roleId} value={roleId}>
          {roleName}
        </option>
      );
    });
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
              <i className="bi bi-person-plus-fill text-primary me-2"></i>
              Add New Teacher
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              disabled={loading}
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              className="modal-body"
              style={{ maxHeight: "70vh", overflowY: "auto" }}
            >
              {success && (
                <div
                  className="alert alert-success alert-dismissible fade show"
                  role="alert"
                >
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                  <br />
                  <small className="mt-1 d-block">
                    <strong>Important:</strong> Please provide this temporary
                    password to the teacher. They will be required to change it
                    on first login.
                  </small>
                </div>
              )}

              {errors.general && (
                <div
                  className="alert alert-danger alert-dismissible fade show"
                  role="alert"
                >
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {errors.general}
                </div>
              )}

              <div className="row">
                {/* Personal Information */}
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
                    className={`form-control ${
                      errors.first_name ? "is-invalid" : ""
                    }`}
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
                    className={`form-control ${
                      errors.last_name ? "is-invalid" : ""
                    }`}
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
                    className={`form-control ${
                      errors.email ? "is-invalid" : ""
                    }`}
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>

                <div className="col-md-4 mb-3">
                  <label className="form-label">
                    Role <span className="text-danger">*</span>
                  </label>
                  {rolesLoading ? (
                    <div className="d-flex align-items-center">
                      <div
                        className="spinner-border spinner-border-sm text-primary me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="text-muted">Loading roles...</span>
                    </div>
                  ) : (
                    <select
                      name="role_id"
                      className={`form-select ${
                        errors.role_ids ? "is-invalid" : ""
                      }`}
                      value={formData.role_ids[0] || ""}
                      onChange={handleRoleChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Select Role</option>
                      {renderRoleOptions()}
                    </select>
                  )}
                  {errors.role_ids && (
                    <div className="invalid-feedback">{errors.role_ids}</div>
                  )}
                </div>

                {/* Account Information */}
                <div className="col-12 mt-3">
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-shield-lock me-2"></i>
                    Account Information
                  </h6>
                  <div className="alert alert-info">
                    <small>
                      <i className="bi bi-info-circle me-2"></i>A temporary
                      password will be automatically generated and shown after
                      creation. The teacher will be required to change it on
                      first login.
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                <i className="bi bi-x-circle me-2"></i>
                Cancel
              </button>
              <button
                type="submit"
                className="btn custom-btn"
                disabled={loading || rolesLoading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    ></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus me-2"></i>
                    Create Teacher
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Status Toggle Component
const StatusToggle = ({ teacher, onStatusChange }) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(teacher.status);

  const handleStatusToggle = async () => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

    setIsUpdatingStatus(true);

    try {
      const success = await onStatusChange(teacher.id, newStatus);
      if (success) {
        setCurrentStatus(newStatus);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const isActive = currentStatus === "Active";

  return (
    <div className="d-flex align-items-center justify-content-center gap-2">
      {isUpdatingStatus && (
        <div
          className="spinner-border spinner-border-sm text-primary"
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
      <Form.Check
        type="switch"
        id={`status-toggle-${teacher.id}`}
        label={
          <span
            className={`fw-medium small ${
              isActive ? "text-success" : "text-danger"
            }`}
          >
            {currentStatus}
          </span>
        }
        checked={isActive}
        onChange={handleStatusToggle}
        disabled={isUpdatingStatus}
        className="mb-0"
      />
    </div>
  );
};

// Main TeachersTable Component
export default function TeachersTable() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Fetch teachers from backend
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching teachers from API...");
      const response = await api.get("/admin/teachers");
      console.log("API Response:", response.data);

      if (response.data.success) {
        // Handle different possible response structures
        let teachersData = response.data.data;

        // If data is nested under a property, extract it
        if (teachersData && teachersData.teachers) {
          teachersData = teachersData.teachers;
        } else if (teachersData && Array.isArray(teachersData)) {
          // Already an array, use as is
          teachersData = teachersData;
        } else {
          // If data is not in expected format, try to extract from response
          teachersData = response.data.data || response.data.teachers || [];
        }

        console.log("Processed teachers data:", teachersData);

        // Transform API data to match table structure
        const formattedTeachers = teachersData.map((teacher, index) => {
          // Safely extract properties with fallbacks
          const personData = teacher.person || teacher;
          const userId = teacher.user_id || teacher.id;
          const personId = personData.person_id || personData.id || userId;

          // Build full name safely
          const firstName = personData.first_name || "";
          const lastName = personData.last_name || "";
          const middleName = personData.middle_name || "";
          const fullName =
            [firstName, middleName, lastName]
              .filter((name) => name && name.trim() !== "")
              .join(" ")
              .trim() || "Unknown Name";

          // Handle address data
          let addressText = "Address not available";
          if (personData.address) {
            const addr = personData.address;
            addressText = [
              addr.address_line1,
              addr.address_line2,
              addr.city,
              addr.state,
              addr.country,
            ]
              .filter((part) => part && part.trim() !== "")
              .join(", ");
          } else if (personData.primaryAddress) {
            const addr = personData.primaryAddress;
            addressText = [
              addr.address_line1,
              addr.address_line2,
              addr.city,
              addr.state,
              addr.country,
            ]
              .filter((part) => part && part.trim() !== "")
              .join(", ");
          }

          return {
            index: index + 1,
            id: personId,
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            full_name: fullName,
            gender: personData.gender || "Not specified",
            date_of_birth: personData.date_of_birth,
            nationality: personData.nationality || "Not specified",
            email: personData.email || teacher.email,
            phone: personData.phone || "Not provided",
            alternate_phone: personData.alternate_phone,
            marital_status: personData.marital_status || "Not specified",
            occupation: personData.occupation || "Teacher",
            address: addressText,
            status: personData.is_active ? "Active" : "Inactive",
            grade:
              teacher.current_classroom?.class_name ||
              teacher.classroom_assignments?.[0]?.class_name ||
              "Not assigned",
            // Store original data for updates
            originalData: teacher,
          };
        });

        console.log("Formatted teachers:", formattedTeachers);
        setTeachers(formattedTeachers);
      } else {
        setError(response.data.message || "Failed to fetch teachers");
      }
    } catch (err) {
      console.error("Error fetching teachers:", err);
      setError(err.response?.data?.message || "Failed to load teachers");

      // Fallback to empty array to prevent DataTables errors
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Debug function to check data structure
  const debugDataStructure = (data) => {
    if (data.length > 0) {
      console.log("First teacher data structure:", data[0]);
      console.log("Available properties:", Object.keys(data[0]));
    }
  };

  // expose a helper for jQuery -> React state update
  useEffect(() => {
    window.__applyTeacherEdits = (updatedList) => {
      setTeachers(updatedList);
      setTimeout(() => {
        if ($.fn.DataTable.isDataTable("#teachersTable")) {
          $("#teachersTable").DataTable().destroy();
        }
        initializeDataTable(updatedList);
      }, 0);
    };
    return () => {
      delete window.__applyTeacherEdits;
    };
  }, []);

  const handleDeleteClick = (teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!teacherToDelete) return;

    try {
      // Use user_id for deletion since that's what the backend expects
      const userId = teacherToDelete.user_id || teacherToDelete.id;
      const response = await api.delete(`/admin/users/${userId}`);

      if (response.data.success) {
        const updatedTeachers = teachers.filter(
          (t) => t.id !== teacherToDelete.id
        );
        setTeachers(updatedTeachers);
        setShowDeleteModal(false);
        setTeacherToDelete(null);

        setTimeout(() => {
          if ($.fn.DataTable.isDataTable("#teachersTable")) {
            $("#teachersTable").DataTable().destroy();
          }
          initializeDataTable(updatedTeachers);
        }, 0);
      } else {
        setError("Failed to delete teacher");
      }
    } catch (err) {
      console.error("Error deleting teacher:", err);
      setError(err.response?.data?.message || "Failed to delete teacher");
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setTeacherToDelete(null);
  };

  const handleAddTeacher = () => {
    setShowCreateModal(true);
  };

  const handleTeacherCreated = (newTeacher) => {
    // Show success message with teacher details
    setSuccessMessage(
      `Teacher ${newTeacher.first_name} ${newTeacher.last_name} created successfully!`
    );

    // Refresh the teachers list
    fetchTeachers();
    setError(""); // Clear any existing errors

    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  const handleViewTeacher = (teacher) => {
    // Use the teacher's full name for the route and pass the ID in state
    navigate(`/teachers/${encodeURIComponent(teacher.full_name)}`, {
      state: {
        teacherId: teacher.id,
        teacherData: teacher,
      },
    });
  };

  const handleEditTeacher = (teacher) => {
    navigate(`/teachers/edit/${teacher.id}`, {
      state: { teacherData: teacher },
    });
  };

  const updateTeacherStatus = async (teacherId, newStatus) => {
    try {
      const response = await api.patch(`/admin/persons/${teacherId}/status`, {
        is_active: newStatus === "Active",
      });

      if (!response.data.success) {
        throw new Error("Failed to update status");
      }

      return true;
    } catch (err) {
      console.error("Error updating teacher status:", err);
      setError(
        err.response?.data?.message || "Failed to update teacher status"
      );
      return false;
    }
  };

  const handleStatusChange = async (teacherId, newStatus) => {
    try {
      const success = await updateTeacherStatus(teacherId, newStatus);
      if (success) {
        // Update local state
        const updatedTeachers = teachers.map((teacher) =>
          teacher.id === teacherId ? { ...teacher, status: newStatus } : teacher
        );
        setTeachers(updatedTeachers);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error handling status change:", error);
      return false;
    }
  };

  const initializeDataTable = (teachersData) => {
    // Debug the data structure before initializing DataTables
    debugDataStructure(teachersData);

    // Check if we have valid data with required properties
    if (teachersData.length > 0 && !teachersData[0].full_name) {
      console.error("Data missing required properties:", teachersData[0]);
      setError("Data format error: Missing required fields");
      return;
    }

    try {
      const table = $("#teachersTable").DataTable({
        data: teachersData,
        destroy: true,
        columns: [
          {
            title: "ID",
            data: "index",
            className: "text-center",
            width: "60px",
          },
          {
            title: "Full Name",
            data: "full_name",
            render: function (data, type, row) {
              // Safe rendering with fallback
              return data || "Unknown Name";
            },
          },
          {
            title: "Gender",
            data: "gender",
            className: "text-center",
            render: function (data, type, row) {
              return data || "Not specified";
            },
          },
          {
            title: "Email",
            data: "email",
            render: function (data, type, row) {
              return data || "No email";
            },
          },
          {
            title: "Phone",
            data: "phone",
            render: function (data, type, row) {
              return data || "Not provided";
            },
          },
          {
            title: "Status",
            data: "status",
            className: "text-center",
            orderable: false,
            render: function (data, type, row) {
              // For DataTables display, we'll use a placeholder
              // The actual toggle will be handled by React
              if (type === "display") {
                return `
                  <div id="status-toggle-${
                    row.id
                  }" class="status-toggle-container">
                    <div class="d-flex align-items-center justify-content-center">
                      <div class="spinner-border spinner-border-sm text-primary d-none" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                      <div class="form-check form-switch">
                        <input class="form-check-input status-toggle-input" type="checkbox" 
                          ${data === "Active" ? "checked" : ""}
                          data-teacher-id="${row.id}"
                          style="cursor: pointer;"
                        >
                        <label class="form-check-label small fw-medium ${
                          data === "Active" ? "text-success" : "text-danger"
                        }" 
                               style="cursor: pointer;">
                          ${data}
                        </label>
                      </div>
                    </div>
                  </div>
                `;
              }
              return data;
            },
          },
          {
            title: "Class/Grade",
            data: "grade",
            className: "text-center text-nowrap",
            render: function (data, type, row) {
              return data || "Not assigned";
            },
          },
          {
            title: "Actions",
            data: null,
            className: "text-center text-nowrap",
            orderable: false,
            render: function (data, type, row) {
              return `
      <div class="d-flex justify-content-center gap-2">
        <button class="btn btn-sm btn-outline-primary view-btn" 
                data-id="${row.id}" 
                data-name="${encodeURIComponent(row.full_name)}"
                title="View Details">
          <i class="bi bi-eye"></i>
        </button>
      </div>
    `;
            },
          },
        ],
        responsive: true,
        scrollX: false,
        pageLength: 10,
        order: [[0, "asc"]],
        language: {
          emptyTable: "No teachers found",
          search: "Search teachers:",
          loadingRecords: "Loading teachers...",
          zeroRecords: "No matching teachers found",
          info: "Showing _START_ to _END_ of _TOTAL_ teachers",
          infoEmpty: "Showing 0 to 0 of 0 teachers",
          infoFiltered: "(filtered from _MAX_ total teachers)",
        },
        createdRow: function (row, data, dataIndex) {
          // Add any row-specific styling here
          if (data.status === "Inactive") {
            $(row).addClass("table-secondary");
          }
        },
      });

      // Clear previous delegated handlers
      $("#teachersTable tbody").off("click", ".view-btn");
      $("#teachersTable tbody").off("click", ".edit-btn");
      $("#teachersTable tbody").off("click", ".delete-btn");
      $("#teachersTable tbody").off("change", ".status-toggle-input");

      // VIEW: view teacher details
      $("#teachersTable tbody").on("click", ".view-btn", function () {
        const teacherId = $(this).data("id");
        const teacherName = $(this).data("name");
        const teacher = teachersData.find((t) => t.id === teacherId);
        if (teacher) {
          handleViewTeacher(teacher);
        }
      });

      // EDIT: edit teacher
      $("#teachersTable tbody").on("click", ".edit-btn", function () {
        const teacherId = $(this).data("id");
        const teacher = teachersData.find((t) => t.id === teacherId);
        if (teacher) {
          handleEditTeacher(teacher);
        }
      });

      // STATUS TOGGLE: handle status changes
      $("#teachersTable tbody").on(
        "change",
        ".status-toggle-input",
        async function () {
          const teacherId = $(this).data("teacher-id");
          const newStatus = $(this).is(":checked") ? "Active" : "Inactive";
          const $container = $(this).closest(".status-toggle-container");
          const $spinner = $container.find(".spinner-border");
          const $label = $container.find(".form-check-label");

          // Show loading spinner
          $spinner.removeClass("d-none");
          $(this).prop("disabled", true);

          try {
            const success = await handleStatusChange(teacherId, newStatus);

            if (success) {
              // Update label
              $label.text(newStatus);
              $label.removeClass("text-success text-danger");
              $label.addClass(
                newStatus === "Active" ? "text-success" : "text-danger"
              );

              // Update row styling
              const $row = $(this).closest("tr");
              if (newStatus === "Inactive") {
                $row.addClass("table-secondary");
              } else {
                $row.removeClass("table-secondary");
              }
            } else {
              // Revert toggle on error
              $(this).prop("checked", !$(this).is(":checked"));
            }
          } catch (error) {
            console.error("Error updating status:", error);
            // Revert toggle on error
            $(this).prop("checked", !$(this).is(":checked"));
          } finally {
            // Hide loading spinner
            $spinner.addClass("d-none");
            $(this).prop("disabled", false);
          }
        }
      );

      // DELETE: show confirmation modal
      $("#teachersTable tbody").on("click", ".delete-btn", function () {
        const id = $(this).data("id");
        const teacher = teachersData.find((t) => t.id === id);
        if (teacher) handleDeleteClick(teacher);
      });
    } catch (error) {
      console.error("Error initializing DataTable:", error);
      setError(
        "Failed to initialize table. Please check the console for details."
      );
    }
  };

  useEffect(() => {
    if (loading) return;

    if ($.fn.DataTable.isDataTable("#teachersTable")) {
      $("#teachersTable").DataTable().destroy();
    }

    if (teachers.length > 0) {
      initializeDataTable(teachers);
    }

    return () => {
      if ($.fn.DataTable.isDataTable("#teachersTable")) {
        $("#teachersTable").DataTable().destroy();
      }
    };
  }, [loading, teachers]);

  // Add custom CSS for toggle switches
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .form-check-input:checked {
        background-color: #198754;
        border-color: #198754;
      }
      .form-check-input:focus {
        border-color: #86b7fe;
        outline: 0;
        box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
      }
      .form-switch .form-check-input {
        width: 3em;
        height: 1.5em;
        margin-right: 0.5rem;
      }
      .status-toggle-container {
        min-width: 120px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading teachers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Teachers List</h4>
          <p className="text-muted mb-0">Manage all teachers in the system</p>
        </div>
        <button className="btn custom-btn" onClick={handleAddTeacher}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Teacher
        </button>
      </div>

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {successMessage && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage("")}
          ></button>
        </div>
      )}

      <div className="card mt-1 p-3 rounded-3 shadow">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="mb-0">
            {teachers.length === 0
              ? "No teachers"
              : `Showing ${teachers.length} teacher${
                  teachers.length !== 1 ? "s" : ""
                }`}
          </p>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={fetchTeachers}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
        </div>

        {teachers.length === 0 && !loading ? (
          <div className="text-center py-5">
            <i className="bi bi-people display-1 text-muted"></i>
            <h5 className="mt-3 text-muted">No Teachers Found</h5>
            <p className="text-muted">
              Get started by adding your first teacher.
            </p>
            <button className="btn custom-btn mt-2" onClick={handleAddTeacher}>
              <i className="bi bi-plus-circle me-2"></i>
              Add Teacher
            </button>
          </div>
        ) : (
          <table
            id="teachersTable"
            className="table table-striped table-hover custom-data-table w-100"
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {/* {showDeleteModal && teacherToDelete && (
        <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                  Confirm Deletion
                </h5>
                <button type="button" className="btn-close" onClick={handleCancelDelete}></button>
              </div>
              <div className="modal-body">
                <div className="text-center">
                  <div className="mb-3">
                    <i className="bi bi-person-x text-danger" style={{ fontSize: "3rem" }}></i>
                  </div>
                  <h6 className="mb-3">
                    Are you sure you want to delete <strong>{teacherToDelete.full_name}</strong>?
                  </h6>
                  <p className="text-muted small">
                    This action cannot be undone. All information related to this teacher will be permanently removed from the system.
                  </p>
                </div>
              </div>
              <div className="modal-footer justify-content-between">
                <button type="button" className="btn btn-outline-secondary" onClick={handleCancelDelete}>
                  <i className="bi bi-x-circle me-2"></i> Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                  <i className="bi bi-trash me-2"></i> Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Create Teacher Modal */}
      <CreateTeacherModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTeacherCreated={handleTeacherCreated}
      />
    </div>
  );
}
