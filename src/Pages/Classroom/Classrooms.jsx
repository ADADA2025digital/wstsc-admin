import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/axiosConfig";

const STATUS_OPTIONS = ["Active", "Inactive"];

export default function ClassroomsList() {
  const navigate = useNavigate();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [query, setQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Create classroom modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassroom, setNewClassroom] = useState({
    class_name: "",
    is_active: true,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Success message state
  const [successMessage, setSuccessMessage] = useState(null);

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const userData = localStorage.getItem("userData");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  };

  const userData = getUserData();
  const userRole = userData?.primary_role?.role_name || "parent";
  const canCreateClassroom = userRole === "admin";
  const isParent = userRole === "parent";
  const isTeacher = userRole === "teacher";
  const userId = userData?.uid;

  // Fetch classrooms based on user role
  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      
      if (userRole === "admin") {
        // Admin: Get all classrooms
        response = await api.get("/classrooms");
        const classroomsData = response.data.data.classrooms.map(cls => ({
          id: cls.c_id,
          c_id: cls.c_id, // Keep original c_id for consistency
          name: cls.class_name,
          code: cls.class_id,
          status: cls.is_active ? "Active" : "Inactive",
          students: cls.current_students_count || 0,
          teachers: cls.current_teachers_count || 0,
          is_active: cls.is_active,
          created_at: cls.created_at,
        }));
        setClassrooms(classroomsData);
      } else if (userRole === "teacher") {
        // Teacher: Get teacher-specific classrooms
        const teacherResponse = await api.get(`/teachers/user/${userId}`);
        const teacherId = teacherResponse.data.data.tid;
        
        if (teacherId) {
          response = await api.get(`/classroom-teachers/teacher/${teacherId}/classrooms`);
          const classroomsData = response.data.data.classrooms.map(item => ({
            id: item.classroom.class_id,
            c_id: item.classroom.class_id,
            name: item.classroom.class_name,
            code: item.classroom.class_id,
            status: item.classroom.is_active ? "Active" : "Inactive",
            students: 0,
            teachers: 1,
            is_active: item.classroom.is_active,
            created_at: item.created_at,
          }));
          setClassrooms(classroomsData);
        } else {
          throw new Error("Teacher ID not found");
        }
      } else {
        // Parent: Get parent's classrooms
        try {
          response = await api.get(`/parent-classrooms/user/${userId}`);
          const classroomsData = response.data.data.classrooms.map(cls => ({
            id: cls.c_id,
            c_id: cls.c_id,
            name: cls.class_name,
            code: cls.class_id,
            status: cls.is_active ? "Active" : "Inactive",
            students: cls.current_students_count || 0,
            teachers: cls.current_teachers_count || 0,
            is_active: cls.is_active,
            created_at: cls.created_at,
          }));
          setClassrooms(classroomsData);
        } catch (parentError) {
          console.log("Parent classrooms endpoint not implemented yet");
          setClassrooms([]);
        }
      }
    } catch (err) {
      console.error("Error fetching classrooms:", err);
      setError("Failed to load classrooms. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassrooms();
  }, [userRole, userId]);

  const filtered = classrooms.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code || "").toLowerCase().includes(q) ||
      (c.status || "").toLowerCase().includes(q)
    );
  });

  // Calculate total students and teachers
  const totalStudents = classrooms.reduce(
    (sum, cls) => sum + (cls.students || 0),
    0
  );
  const totalTeachers = classrooms.reduce(
    (sum, cls) => sum + (cls.teachers || 0),
    0
  );

  // FIXED: Handle view for both parent and admin - navigate to same path
  const handleView = (cls) => {
    console.log("👁️ Navigating to classroom:", cls);
    
    // For parent users, we need to find the actual classroom ID from the classrooms list
    // since parent uses class code as ID but admin uses c_id
    if (isParent) {
      // Try to find the actual classroom by code to get the proper ID
      // This assumes you have a way to map class codes to classroom IDs
      // If not, you might need to adjust your backend or data structure
      console.log("👨‍👧 Parent viewing classroom with code:", cls.code);
      
      // Navigate with the classroom code as ID for now
      // You might need to adjust this based on your actual classroom ID structure
      navigate(`/classrooms/${cls.code}`, {
        state: { 
          classroom: cls,
          userRole: userRole // Pass user role to the classroom detail page
        },
      });
    } else {
      // For admin/teacher users, use the regular ID
      console.log("👨‍💼 Admin/Teacher viewing classroom with id:", cls.id);
      navigate(`/classrooms/${cls.id}`, {
        state: { 
          classroom: cls,
          userRole: userRole // Pass user role to the classroom detail page
        },
      });
    }
  };

  // Create Classroom Functions
  const openCreateModal = () => {
    setShowCreateModal(true);
    setNewClassroom({
      class_name: "",
      is_active: true,
    });
    setCreateError(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewClassroom({
      class_name: "",
      is_active: true,
    });
    setCreateError(null);
    setCreating(false);
  };

  const handleCreateChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewClassroom((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Updated createClassroom function based on API response
  const createClassroom = async () => {
    const className = newClassroom.class_name.trim();
    if (!className) {
      setCreateError("Classroom name is required");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      // Create classroom API call - using the exact format from your API
      const response = await api.post("/classrooms", {
        class_name: className,
        is_active: newClassroom.is_active,
      });

      // Check if the response matches the expected format
      if (response.data.success) {
        console.log("Classroom created successfully:", response.data.data);
        
        // Refresh the classrooms list
        await fetchClassrooms();
        closeCreateModal();
        
        // Show success message
        setSuccessMessage(`Classroom "${className}" created successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.data.message || "Failed to create classroom");
      }
    } catch (err) {
      console.error("Error creating classroom:", err);
      
      // Enhanced error handling
      if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data?.message || 
                           err.response.data?.error || 
                           "Failed to create classroom";
        setCreateError(errorMessage);
        
        // Log detailed error for debugging
        console.error("Server error response:", err.response.data);
      } else if (err.request) {
        // Request was made but no response received
        setCreateError("Network error: Unable to connect to server");
      } else {
        // Something else happened
        setCreateError(err.message || "An unexpected error occurred");
      }
    } finally {
      setCreating(false);
    }
  };

  const askDelete = (cls) => {
    setToDelete(cls);
    setShowDeleteModal(true);
  };

  const cancelDelete = () => {
    setToDelete(null);
    setShowDeleteModal(false);
    setDeleting(false);
  };

  // Improved delete function with better error handling
  const confirmDelete = async () => {
    if (!toDelete) return;

    setDeleting(true);

    try {
      // Use c_id for deletion (as shown in API response)
      const classroomId = toDelete.c_id || toDelete.id;
      
      if (!classroomId) {
        throw new Error("Classroom ID not found");
      }

      // Delete classroom API call
      const response = await api.delete(`/classrooms/${classroomId}`);
      
      // Check if deletion was successful
      if (response.data.success) {
        console.log("Classroom deleted successfully:", response.data.data);
        
        // Refresh the classrooms list
        await fetchClassrooms();
        
        // Show success message
        setSuccessMessage(`Classroom "${toDelete.name}" deleted successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.data.message || "Failed to delete classroom");
      }
      
      cancelDelete();
    } catch (err) {
      console.error("Error deleting classroom:", err);
      
      // Enhanced error handling
      let errorMessage = "Failed to delete classroom. Please try again.";
      
      if (err.response) {
        // Server responded with error status
        errorMessage = err.response.data?.message || 
                      err.response.data?.error || 
                      errorMessage;
        
        // Log detailed error for debugging
        console.error("Server error response:", err.response.data);
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "Network error: Unable to connect to server";
      } else {
        // Something else happened
        errorMessage = err.message || errorMessage;
      }
      
      alert(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleRefresh = () => {
    fetchClassrooms();
  };

  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading classrooms...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
          <button className="btn btn-sm btn-outline-danger ms-3" onClick={fetchClassrooms}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Parent view - simplified classroom cards without actions
  if (isParent) {
    return (
      <div className="container-fluid px-4 py-3">
        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccessMessage(null)}
            ></button>
          </div>
        )}

        <div className="row align-items-center mb-4">
          <div className="col-md-4">
            <h4 className="H4-heading fw-bold m-0">
              Classrooms
              <small className="text-muted ms-2 fs-6">
                (Your Child's Classrooms)
              </small>
            </h4>
          </div>

          <div className="col-md-8">
            <div className="d-flex gap-3 align-items-center">
              <div className="input-group flex-grow-1">
                <span className="input-group-text">
                  <i className="bi bi-search" />
                </span>
                <input
                  className="form-control"
                  placeholder="Search classrooms..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <button
                className="btn btn-outline-secondary flex-shrink-0"
                onClick={handleRefresh}
                style={{ minWidth: "100px" }}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="card p-4 rounded-3 shadow">
          <div className="row mb-3">
            <div className="col-md-6">
              <p className="mb-0">
                Showing {filtered.length} of {classrooms.length} assigned
                classrooms
              </p>
            </div>
          </div>

          {/* Cards grid for parent's assigned classrooms */}
          <div className="row g-3">
            {filtered.map((cls) => (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={cls.id}>
                <div className="card h-100 border shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="flex-grow-1 me-2">
                        <h6
                          className="card-title mb-1 text-truncate"
                          title={cls.name}
                        >
                          {cls.name}
                        </h6>
                      </div>
                      <span
                        className={`badge ${
                          cls.is_active ? "bg-success" : "bg-warning"
                        }`}
                        title="Status"
                      >
                        {cls.is_active ? "Active" : "Pending"}
                      </span>
                    </div>

                    <div className="text-muted small mb-3">
                      <div>
                        <i className="bi bi-hash me-1" /> Code:{" "}
                        <strong>{cls.code}</strong>
                      </div>
                      <div>
                        <i className="bi bi-people me-1" /> Your Children:{" "}
                        <strong>{cls.students}</strong>
                      </div>
                      {cls.teachers > 0 && (
                        <div>
                          <i className="bi bi-person-badge me-1" /> Teachers:{" "}
                          <strong>{cls.teachers}</strong>
                        </div>
                      )}
                    </div>

                    {/* Add view button for parents */}
                    <div className="mt-auto d-flex justify-content-end gap-1 pt-2">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleView(cls)}
                        title="View Classroom Details"
                      >
                        <i className="bi bi-eye me-1" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-12">
                <div className="text-center text-muted py-5">
                  <i
                    className="bi bi-door-closed"
                    style={{ fontSize: "2rem" }}
                  />
                  <p className="mb-0 mt-2">
                    {query
                      ? "No classrooms match your search."
                      : "No assigned classrooms found."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin/Teacher view
  return (
    <>
      <div className="container-fluid px-4 py-3">
        {/* Success Message */}
        {successMessage && (
          <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            {successMessage}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccessMessage(null)}
            ></button>
          </div>
        )}

        <div className="row align-items-center mb-4">
          <div className="col-md-4">
            <h4 className="H4-heading fw-bold m-0">
              Classrooms
              {userRole && (
                <small className="ms-2 fs-6">
                  (
                  {userRole === "teacher"
                    ? "Your Assigned Classrooms"
                    : userRole === "parent"
                    ? "Child's Classrooms"
                    : "All Classrooms"}
                  )
                </small>
              )}
            </h4>
          </div>

          <div className="col-md-8">
            <div className="d-flex gap-3 align-items-center">
              <div className="input-group flex-grow-1">
                <span className="input-group-text">
                  <i className="bi bi-search" />
                </span>
                <input
                  className="form-control"
                  placeholder="Search by name, code, status"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {canCreateClassroom && (
                <button
                  className="btn custom-btn flex-shrink-0"
                  onClick={openCreateModal}
                  title="Add Classroom"
                  style={{ minWidth: "150px" }}
                >
                  <i className="bi bi-plus-lg me-2" />
                  New Classroom
                </button>
              )}

              <button
                onClick={handleRefresh}
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "40px",
                  height: "40px",
                }}
                title="Refresh classrooms"
              >
                <i className="bi bi-arrow-clockwise" />
              </button>
            </div>
          </div>
        </div>

        <div className="card p-4 rounded-3 shadow">
          <div className="row mb-3">
            <div className="col-md-6">
              <p className="mb-0">
                Showing {filtered.length} of {classrooms.length} classrooms
                {userRole === "teacher" && " assigned to you"}
                {totalStudents > 0 && (
                  <span className="text-muted ms-2">
                    • Total Students: <strong>{totalStudents}</strong>
                  </span>
                )}
                {totalTeachers > 0 && (
                  <span className="text-muted ms-2">
                    • Total Teachers: <strong>{totalTeachers}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Cards grid */}
          <div className="row g-3">
            {filtered.map((cls) => (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={cls.id}>
                <div className="card h-100 border shadow-sm">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="flex-grow-1 me-2">
                        <h6
                          className="card-title mb-1 text-truncate"
                          title={cls.name}
                        >
                          {cls.name}
                        </h6>
                      </div>
                      <span
                        className={`badge ${
                          cls.is_active ? "bg-success" : "bg-secondary"
                        }`}
                        title="Status"
                      >
                        {cls.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="text-muted small mb-3">
                      <div>
                        <i className="bi bi-hash me-1" /> Code:{" "}
                        <strong>{cls.code}</strong>
                      </div>
                      <div>
                        <i className="bi bi-people me-1" /> Students:{" "}
                        <strong>{cls.students}</strong>
                      </div>
                      <div>
                        <i className="bi bi-person-badge me-1" /> Teachers:{" "}
                        <strong>{cls.teachers || 0}</strong>
                      </div>
                      {cls.created_at && (
                        <div
                          className="text-truncate"
                          title={`Created: ${new Date(
                            cls.created_at
                          ).toLocaleDateString()}`}
                        >
                          <i className="bi bi-calendar me-1" /> Created:{" "}
                          {new Date(cls.created_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    {/* Actions - Show for admin users only, remove for teacher users */}
                    {!isTeacher && (
                      <div className="mt-auto d-flex justify-content-end gap-1">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleView(cls)}
                          title="View"
                        >
                          <i className="bi bi-eye" />
                        </button>

                        {canCreateClassroom && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => askDelete(cls)}
                            title="Delete"
                          >
                            <i className="bi bi-trash" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-12">
                <div className="text-center text-muted py-5">
                  <i
                    className="bi bi-door-closed"
                    style={{ fontSize: "2rem" }}
                  />
                  <p className="mb-0 mt-2">
                    {query
                      ? "No classrooms match your search."
                      : userRole === "teacher"
                      ? "No classrooms assigned to you at the moment."
                      : "No classrooms found."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Classroom Modal */}
        {canCreateClassroom && showCreateModal && (
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-plus-circle text-primary me-2"></i>
                    Create New Classroom
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closeCreateModal}
                    disabled={creating}
                  ></button>
                </div>
                <div className="modal-body">
                  {createError && (
                    <div className="alert alert-danger" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {createError}
                    </div>
                  )}

                  <div className="mb-3">
                    <label htmlFor="class_name" className="form-label">
                      Classroom Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="class_name"
                      name="class_name"
                      value={newClassroom.class_name}
                      onChange={handleCreateChange}
                      placeholder="Enter classroom name"
                      disabled={creating}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          createClassroom();
                        }
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={newClassroom.is_active}
                        onChange={handleCreateChange}
                        disabled={creating}
                      />
                      <label className="form-check-label" htmlFor="is_active">
                        Active Classroom
                      </label>
                    </div>
                    <div className="form-text">
                      Active classrooms are available for student enrollment and
                      scheduling.
                    </div>
                  </div>
                </div>
                <div className="modal-footer justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={closeCreateModal}
                    disabled={creating}
                  >
                    <i className="bi bi-x-circle me-2"></i> Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={createClassroom}
                    disabled={creating || !newClassroom.class_name.trim()}
                  >
                    {creating ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        >
                          <span className="visually-hidden">Creating...</span>
                        </span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2 me-2"></i> Create Classroom
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {canCreateClassroom && showDeleteModal && toDelete && (
          <div
            className="modal fade show"
            style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                    Confirm Deletion
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={cancelDelete}
                    disabled={deleting}
                  ></button>
                </div>
                <div className="modal-body text-center">
                  <div className="mb-3">
                    <i
                      className="bi bi-door-open text-danger"
                      style={{ fontSize: "3rem" }}
                    ></i>
                  </div>
                  <h6 className="mb-3">
                    Delete classroom <strong>"{toDelete.name}"</strong>?
                  </h6>
                  <p className="text-muted small">
                    This action cannot be undone. All associated data will be
                    permanently removed.
                  </p>

                  {deleting && (
                    <div className="mt-3">
                      <div
                        className="spinner-border spinner-border-sm text-primary me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Deleting...</span>
                      </div>
                      <span className="text-muted">Deleting classroom...</span>
                    </div>
                  )}
                </div>
                <div className="modal-footer justify-content-between">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={cancelDelete}
                    disabled={deleting}
                  >
                    <i className="bi bi-x-circle me-2"></i> Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        >
                          <span className="visually-hidden">Deleting...</span>
                        </span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash me-2"></i> Yes, Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add CSS for spinning animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </>
  );
}