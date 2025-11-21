import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import $ from "jquery";
import api from "../../config/axiosConfig";
import Form from "react-bootstrap/Form";
import CreatePersonModal from "../../Components/CreatePersonModal";

if (typeof window !== "undefined") {
  window.$ = $;
  window.jQuery = $;
}

// Create Teacher Modal Component
const CreateTeacherModal = ({ isOpen, onClose, onTeacherCreated }) => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    role_ids: [3],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      role_ids: [3],
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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess("");

    if (!formData.first_name || !formData.last_name || !formData.email) {
      setErrors({ general: "First name, last name, and email are required" });
      setLoading(false);
      return;
    }

    try {
      const response = await api.post("/admin/persons", formData);

      if (response.data.success) {
        const tempPassword = response.data.data.temp_password;
        const teacherData = {
          ...response.data.data.person,
          temp_password: tempPassword,
        };

        if (onTeacherCreated) {
          onTeacherCreated(teacherData);
        }

        setSuccess(`Teacher created successfully! Temporary password: ${tempPassword}`);

        setTimeout(() => {
          onClose();
          resetForm();
        }, 3000);
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

  if (!isOpen) return null;

  return (
    <div className="modal fade show" style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}>
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
            <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {success && (
                <div className="alert alert-success alert-dismissible fade show" role="alert">
                  <i className="bi bi-check-circle me-2"></i>
                  {success}
                  <br />
                  <small className="mt-1 d-block">
                    <strong>Important:</strong> Please provide this temporary password to the teacher.
                  </small>
                </div>
              )}

              {errors.general && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {errors.general}
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

                <div className="col-12 mb-3">
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
                </div>

                <div className="col-12 mt-3">
                  <div className="alert alert-info">
                    <small>
                      <i className="bi bi-info-circle me-2"></i>
                      A temporary password will be automatically generated and shown after creation.
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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
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
        <div className="spinner-border spinner-border-sm text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
      <Form.Check
        type="switch"
        id={`status-toggle-${teacher.id}`}
        label={
          <span className={`fw-medium small ${isActive ? "text-success" : "text-danger"}`}>
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Fetch teachers from backend
  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError("");

      console.log('🚀 Starting fetchTeachers...');
      console.log('📡 Making API call to /admin/teachers');

      const response = await api.get("/admin/teachers");

      console.log('✅ API Response Received:', {
        success: response.data.success,
        message: response.data.message,
        fullResponse: response.data
      });

      if (response.data.success) {
        const teachersData = response.data.data.teachers;

        console.log('📊 Raw Teachers Data from API:', {
          totalTeachers: teachersData?.length,
          teachersArray: teachersData,
          pagination: response.data.data.pagination
        });

        // Log first teacher for structure analysis
        if (teachersData && teachersData.length > 0) {
          console.log('🔍 First Teacher Structure:', teachersData[0]);
          console.log('📋 First Teacher Keys:', Object.keys(teachersData[0]));
        }

        const formattedTeachers = teachersData.map((teacher, index) => {
          const personData = teacher.person || {};
          const addressData = teacher.address || {};
          
          const firstName = personData.first_name || teacher.first_name || "";
          const lastName = personData.last_name || teacher.last_name || "";
          const middleName = personData.middle_name || teacher.middle_name || "";
          
          const fullName = [firstName, middleName, lastName]
            .filter(name => name && name.trim() !== "")
            .join(" ")
            .trim() || teacher.name || "Unknown Name";

          const phone = personData.phone || teacher.phone || "Not provided";
          const status = teacher.is_active ? "Active" : "Inactive";

          const formattedTeacher = {
            index: index + 1,
            id: teacher.person_id, // person_id for internal reference
            user_id: teacher.user_id, // user_id for API calls
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            full_name: fullName,
            gender: personData.gender || addressData.gender || "Not specified",
            date_of_birth: personData.date_of_birth || addressData.date_of_birth,
            nationality: personData.nationality || "Not specified",
            email: personData.email || teacher.email,
            phone: phone,
            status: status,
            grade: "Not assigned",
            originalData: teacher // Store complete original data
          };

          // Log each teacher transformation for debugging
          console.log(`👨‍🏫 Teacher ${index + 1} formatted:`, {
            person_id: teacher.person_id,
            user_id: teacher.user_id,
            name: formattedTeacher.full_name,
            status: formattedTeacher.status,
            is_active: teacher.is_active
          });

          return formattedTeacher;
        });

        console.log('🎉 Final Formatted Teachers:', {
          totalFormatted: formattedTeachers.length,
          formattedTeachers: formattedTeachers
        });

        setTeachers(formattedTeachers);
      } else {
        console.log('❌ API returned success: false', response.data.message);
        setError(response.data.message || "Failed to fetch teachers");
        setTeachers([]);
      }
    } catch (err) {
      console.error('🚨 Error in fetchTeachers:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
        message: err.message
      });
      setError(err.response?.data?.message || "Failed to load teachers");
      setTeachers([]);
    } finally {
      console.log('🏁 fetchTeachers completed');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

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

  const handleAddTeacher = () => {
    setShowCreateModal(true);
  };

  const handleTeacherCreated = (newTeacher) => {
    setSuccessMessage(
      `Teacher ${newTeacher.first_name} ${newTeacher.last_name} created successfully!`
    );
    fetchTeachers();
    setError("");

    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  // UPDATED: Use user_id instead of id for navigation
  const handleViewTeacher = (teacher) => {
    console.log('🔍 View Teacher Clicked:', {
      teacherId: teacher.id, // person_id
      userId: teacher.user_id, // user_id
      teacherName: teacher.full_name
    });
    
    navigate(`/teachers/${teacher.user_id}`, { // Using user_id here
      state: { teacherData: teacher },
    });
  };

  const updateTeacherStatus = async (teacherId, newStatus) => {
    try {
      console.log('📡 Updating teacher status:', {
        teacherId: teacherId, // This is person_id
        newStatus: newStatus
      });
      
      const response = await api.put(`/admin/persons/${teacherId}/status`, {
        is_active: newStatus === "Active",
      });

      if (!response.data.success) {
        throw new Error("Failed to update status");
      }

      return true;
    } catch (err) {
      console.error("Error updating teacher status:", err);
      setError(err.response?.data?.message || "Failed to update teacher status");
      return false;
    }
  };

  const handleStatusChange = async (teacherId, newStatus) => {
    try {
      const success = await updateTeacherStatus(teacherId, newStatus);
      if (success) {
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
            render: function (data) {
              return data || "Unknown Name";
            },
          },
          {
            title: "Gender",
            data: "gender",
            className: "text-center",
            render: function (data) {
              return data || "Not specified";
            },
          },
          {
            title: "Email",
            data: "email",
            render: function (data) {
              return data || "No email";
            },
          },
          {
            title: "Phone",
            data: "phone",
            render: function (data) {
              return data || "Not provided";
            },
          },
          {
            title: "Status",
            data: "status",
            className: "text-center",
            orderable: false,
            render: function (data, type, row) {
              if (type === "display") {
                return `
                  <div id="status-toggle-${row.id}" className="status-toggle-container">
                    <div className="d-flex align-items-center justify-content-center">
                      <div className="form-check form-switch mb-0">
                        <input className="form-check-input status-toggle-input" type="checkbox" 
                          ${data === "Active" ? "checked" : ""}
                          data-teacher-id="${row.id}"
                          style="cursor: pointer;"
                        >
                        <label className="form-check-label small fw-medium ${
                          data === "Active" ? "text-success" : "text-danger"
                        }" 
                               style="cursor: pointer; margin-left: 0.5rem;">
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
            render: function (data) {
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
                <div className="d-flex justify-content-center gap-2">
                  <button className="btn btn-sm btn-outline-primary view-btn" 
                          data-id="${row.id}" 
                          data-user-id="${row.user_id}"
                          title="View Details">
                    <i className="bi bi-eye"></i>
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
        createdRow: function (row, data) {
          if (data.status === "Inactive") {
            $(row).addClass("table-secondary");
          }
        },
      });

      // Event handlers
      $("#teachersTable tbody").on("click", ".view-btn", function () {
        const teacherId = $(this).data("id"); // person_id
        const userId = $(this).data("user-id"); // user_id
        const teacher = teachersData.find((t) => t.id === teacherId);
        
        console.log('👁️ View Button Clicked:', {
          personId: teacherId,
          userId: userId,
          teacher: teacher
        });
        
        if (teacher) {
          handleViewTeacher(teacher);
        }
      });

      $("#teachersTable tbody").on("change", ".status-toggle-input", async function () {
        const teacherId = $(this).data("teacher-id");
        const newStatus = $(this).is(":checked") ? "Active" : "Inactive";
        const $container = $(this).closest(".status-toggle-container");
        const $label = $container.find(".form-check-label");

        $(this).prop("disabled", true);

        try {
          const success = await handleStatusChange(teacherId, newStatus);

          if (success) {
            $label.text(newStatus);
            $label.removeClass("text-success text-danger");
            $label.addClass(newStatus === "Active" ? "text-success" : "text-danger");

            const $row = $(this).closest("tr");
            if (newStatus === "Inactive") {
              $row.addClass("table-secondary");
            } else {
              $row.removeClass("table-secondary");
            }
          } else {
            $(this).prop("checked", !$(this).is(":checked"));
          }
        } catch (error) {
          console.error("Error updating status:", error);
          $(this).prop("checked", !$(this).is(":checked"));
        } finally {
          $(this).prop("disabled", false);
        }
      });
    } catch (error) {
      console.error("Error initializing DataTable:", error);
      setError("Failed to initialize table.");
    }
  };

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
        <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
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
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
          <button type="button" className="btn-close" onClick={() => setSuccessMessage("")}></button>
        </div>
      )}

      <div className="card mt-1 p-3 rounded-3 shadow">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="mb-0">
            {teachers.length === 0
              ? "No teachers"
              : `Showing ${teachers.length} teacher${teachers.length !== 1 ? "s" : ""}`}
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
            <p className="text-muted">Get started by adding your first teacher.</p>
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

      {/* Create Teacher Modal */}
      <CreatePersonModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPersonCreated={handleTeacherCreated}
        personType="teacher"
      />
    </div>
  );
}