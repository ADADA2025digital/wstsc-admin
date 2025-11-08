import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/axiosConfig";

const STATUS_OPTIONS = ["Active", "Inactive"];

export default function ClassroomsList() {
  const [classrooms, setClassrooms] = useState([]);
  const [query, setQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // create classroom modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClassroom, setNewClassroom] = useState({
    class_name: "",
    is_active: true,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // refresh state
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  const navigate = useNavigate();

  // Get current user info - FIXED: Properly handle nested role object
  const getCurrentUserInfo = () => {
    try {
      const userDataString = localStorage.getItem("userData");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log("🔍 Raw userData from localStorage:", userData);

        // FIX: Properly extract role from nested structure
        let userRole = "unknown";

        // Check for nested role object with role_name
        if (userData.role && userData.role.role_name) {
          userRole = userData.role.role_name;
        }
        // Check for direct role_name
        else if (userData.role_name && typeof userData.role_name === "string") {
          userRole = userData.role_name;
        }
        // Check for nested role object with name
        else if (userData.role && userData.role.name) {
          userRole = userData.role.name;
        }
        // Check for user_role
        else if (userData.user_role && typeof userData.user_role === "string") {
          userRole = userData.user_role;
        }
        // Check for type
        else if (userData.type && typeof userData.type === "string") {
          userRole = userData.type;
        }

        const userId = userData.user_id || userData.id || null;

        console.log("🎯 Extracted user info:", {
          userRole: userRole.toLowerCase(),
          userId,
          rawRole: userData.role,
        });

        return {
          userRole: userRole.toLowerCase(), // Convert to lowercase here
          userId,
          userData,
        };
      }

      return { userRole: "unknown", userId: null, userData: null };
    } catch (error) {
      console.error("Error getting user info:", error);
      return { userRole: "unknown", userId: null, userData: null };
    }
  };

  const { userRole, userId, userData } = getCurrentUserInfo();
  const canCreateClassroom = !["teacher", "parent"].includes(userRole);
  const isParent = userRole === "parent";

  useEffect(() => {
    console.log("🚀 ClassroomsList component mounted");
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async (isRefresh = false) => {
    try {
      console.log("🔄 Starting fetchClassrooms...");

      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      // For all users, use the main classrooms endpoint
      await fetchAllClassrooms();

      setLastRefreshTime(new Date());
      console.log("✅ fetchClassrooms completed successfully");
    } catch (err) {
      console.error("❌ Error in fetchClassrooms:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load classrooms. Please check your connection.";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAllClassrooms = async () => {
    try {
      console.log("📡 Calling all classrooms API: /classrooms");

      // FIX: Add error handling for network issues
      const response = await api.get("/classrooms", {
        timeout: 10000, // 10 second timeout
      });

      console.log("📦 All classrooms API response:", response.data);

      if (response.data.success) {
        // Transform backend data to match frontend structure
        const transformedClassrooms = response.data.data.classrooms.map(
          (cls) => ({
            id: cls.c_id,
            name: cls.class_name,
            code: cls.class_id, // Use the actual class_id from backend
            status: cls.is_active ? "Active" : "Inactive",
            students: 0, // You might need to fetch this separately
            is_active: cls.is_active,
            created_at: cls.created_at,
            updated_at: cls.updated_at,
          })
        );
        console.log("✅ Transformed all classrooms:", transformedClassrooms);
        setClassrooms(transformedClassrooms);
      } else {
        throw new Error(response.data.message || "Failed to fetch classrooms");
      }
    } catch (err) {
      console.error("❌ Error fetching all classrooms:", err);

      // More specific error handling
      if (err.code === "NETWORK_ERROR" || err.message === "Network Error") {
        throw new Error("Network error: Please check your internet connection");
      } else if (err.code === "ECONNABORTED") {
        throw new Error("Request timeout: Please try again");
      } else if (err.response?.status === 401) {
        throw new Error("Authentication failed: Please log in again");
      } else if (err.response?.status === 403) {
        throw new Error(
          "Access denied: You don't have permission to view classrooms"
        );
      } else {
        throw err;
      }
    }
  };

  const filtered = classrooms.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code || "").toLowerCase().includes(q) ||
      (c.status || "").toLowerCase().includes(q)
    );
  });

  console.log("🎨 Current UI state:", {
    userRole,
    userId,
    canCreateClassroom,
    isParent,
    classroomsCount: classrooms.length,
    filteredCount: filtered.length,
  });

  const handleView = (cls) => {
    console.log("👁️ Navigating to classroom with c_id:", cls.id);

    navigate(`/classrooms/${cls.id}`, {
      // cls.id is c_id from backend
      state: { classroom: cls },
    });
  };

  // Refresh function
  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    fetchClassrooms(true);
  };

  // Create Classroom Functions - Only show for admin users
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

  const createClassroom = async () => {
    const className = newClassroom.class_name.trim();
    if (!className) {
      setCreateError("Classroom name is required");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      const createData = {
        class_name: className,
        is_active: newClassroom.is_active,
      };

      const response = await api.post("/classrooms", createData);

      if (response.data.success) {
        // Add new classroom to the list
        const newClass = response.data.data.classroom;
        const transformedClassroom = {
          id: newClass.class_id,
          name: newClass.class_name,
          code: newClass.class_id,
          status: newClassroom.is_active ? "Active" : "Inactive",
          students: 0,
          is_active: newClassroom.is_active,
          created_at: newClass.created_at,
          updated_at: newClass.updated_at,
        };

        setClassrooms((prev) => [transformedClassroom, ...prev]);
        closeCreateModal();
      } else {
        throw new Error(response.data.message || "Failed to create classroom");
      }
    } catch (err) {
      console.error("Error creating classroom:", err);
      setCreateError(
        err.response?.data?.message || "Failed to create classroom"
      );
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

  const confirmDelete = async () => {
    if (!toDelete) return;

    try {
      setDeleting(true);
      setError(null);

      const response = await api.delete(`/classrooms/${toDelete.id}`);

      if (response.data.success) {
        setClassrooms((prev) => prev.filter((c) => c.id !== toDelete.id));
        console.log("Classroom deleted successfully:", response.data.message);
        cancelDelete();
      } else {
        throw new Error(response.data.message || "Failed to delete classroom");
      }
    } catch (err) {
      console.error("Error deleting classroom:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to delete classroom. Please try again.";
      setError(errorMessage);
      cancelDelete();
    } finally {
      setDeleting(false);
    }
  };

  const retryFetch = () => {
    setError(null);
    fetchClassrooms();
  };

  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ minHeight: "400px" }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading classrooms...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !showDeleteModal) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="alert alert-info" role="alert">
          <div className="d-flex align-items-center">
            <i className="bi bi-info-circle-fill me-2"></i>
            <div>
              <h6 className="alert-heading mb-1">Classroom Information</h6>
              <p className="mb-2">{error}</p>
              <div className="mt-2">
                <button
                  className="btn btn-sm btn-outline-info me-2"
                  onClick={retryFetch}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Try Again
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Special view for parents - show enrollment message instead of classrooms
  if (isParent) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="H4-heading fw-bold m-0">
            Classrooms
            <small className="text-muted ms-2 fs-6">(Child's Classrooms)</small>
          </h4>
        </div>

        <div className="card p-5 rounded-3 shadow text-center">
          <div className="card-body py-5">
            <div className="mb-4">
              <i
                className="bi bi-people text-muted"
                style={{ fontSize: "4rem" }}
              ></i>
            </div>
            <h5 className="card-title mb-3">No Classrooms Available</h5>
            <p className="card-text text-muted mb-4">
              Please enroll your students to view their classrooms. Once your
              children are enrolled in classes, you'll be able to see their
              classroom information, schedules, and progress here.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/enrol")}
              >
                <i className="bi bi-person-plus me-2"></i>
                Enroll Students
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={handleRefresh}
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="H4-heading fw-bold m-0">
          Classrooms
          {userRole && (
            <small className="text-muted ms-2 fs-6">
              (
              {userRole === "teacher"
                ? "Available Classrooms"
                : userRole === "parent"
                ? "Child's Classrooms"
                : "All Classrooms"}
              )
            </small>
          )}
        </h4>

        <div className="d-flex gap-3 w-50">
          <div className="input-group">
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

          {/* Only show create button for non-teacher/non-parent users */}
          {canCreateClassroom && (
            <button
              className="btn custom-btn w-50"
              onClick={openCreateModal}
              title="Add Classroom"
            >
              <i className="bi bi-plus-lg me-2" />
              New Classroom
            </button>
          )}
        </div>
      </div>

      <div className="card p-4 rounded-3 shadow">
        <div className="row mb-3">
          <div className="col-md-6">
            <p className="mb-0">
              Showing {filtered.length} of {classrooms.length} classrooms
              {userRole === "teacher" && " available to you"}
            </p>
          </div>
          <div className="col-md-6 d-flex justify-content-end align-items-center gap-3">
            {lastRefreshTime && (
              <p className="mb-0 text-muted small">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={handleRefresh}
              className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
              disabled={refreshing}
              style={{
                width: "40px",
                height: "40px",
                opacity: refreshing ? 0.7 : 1,
              }}
              title="Refresh classrooms"
            >
              <i
                className={`bi bi-arrow-clockwise ${
                  refreshing ? "spinner-border spinner-border-sm" : ""
                }`}
                style={{
                  animation: refreshing ? "spin 1s linear infinite" : "none",
                }}
              />
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <div className="row g-3">
          {filtered.map((cls) => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={cls.id}>
              <div className="card h-100 border shadow-sm">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    {/* Name */}
                    <div className="flex-grow-1 me-2">
                      <h6
                        className="card-title mb-1 text-truncate"
                        title={cls.name}
                      >
                        {cls.name}
                      </h6>
                    </div>

                    {/* Status badge */}
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

                  {/* Actions */}
                  <div className="mt-auto d-flex justify-content-end gap-1">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => handleView(cls)}
                      title="View"
                    >
                      <i className="bi bi-eye" />
                    </button>

                    {/* Only show delete button for admin users */}
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
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && !loading && (
            <div className="col-12">
              <div className="text-center text-muted py-5">
                <i className="bi bi-door-closed" style={{ fontSize: "2rem" }} />
                <p className="mb-0 mt-2">
                  {query
                    ? "No classrooms match your search."
                    : userRole === "teacher"
                    ? "No classrooms available at the moment."
                    : "No classrooms found."}
                </p>
                {userRole === "teacher" && (
                  <div className="mt-3">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={handleRefresh}
                    >
                      <i className="bi bi-arrow-clockwise me-1"></i>
                      Check Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Classroom Modal - Only show for admin users */}
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

      {/* Delete Confirmation Modal - Only show for admin users */}
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

                {/* Loading indicator */}
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

      {/* Add CSS for spinning animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
