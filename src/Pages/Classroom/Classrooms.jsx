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

  // Student counts state
  const [studentCounts, setStudentCounts] = useState({});
  const [loadingStudentCounts, setLoadingStudentCounts] = useState(false);

  // Teacher counts state
  const [teacherCounts, setTeacherCounts] = useState({});
  const [loadingTeacherCounts, setLoadingTeacherCounts] = useState(false);

  // Parent enrollments state
  const [parentEnrollments, setParentEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);

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
  const isTeacher = userRole === "teacher";

  useEffect(() => {
    console.log("🚀 ClassroomsList component mounted");
    fetchClassrooms();
  }, []);

  // Fetch teacher's assigned classrooms
  const fetchTeacherClassrooms = async () => {
    try {
      console.log("👨‍🏫 Fetching teacher classrooms for user ID:", userId);
      
      if (!userId) {
        throw new Error("User ID not found. Please log in again.");
      }

      const response = await api.get(`/classroom-teachers/teacher/${userId}/classrooms`, {
        timeout: 10000,
      });

      console.log("📦 Teacher classrooms API response:", response.data);

      if (response.data.success) {
        const teacherClassrooms = response.data.data.classrooms || [];
        
        // Transform the API response to match our classroom structure
        const transformedClassrooms = teacherClassrooms.map((assignment) => {
          const classroom = assignment.classroom;
          return {
            id: classroom.class_id, // Using class_id as ID
            name: classroom.class_name,
            code: classroom.class_id,
            status: classroom.is_active ? "Active" : "Inactive",
            students: 0, // Will be updated from student counts
            teachers: 1, // At least this teacher is assigned
            is_active: classroom.is_active,
            assignment_id: assignment.assignment_id,
            assignment_date: assignment.assignment_date,
            end_date: assignment.end_date,
            is_current: assignment.is_current,
            assignment_status: assignment.status,
            created_at: assignment.created_at,
            updated_at: assignment.updated_at,
          };
        });

        console.log("✅ Transformed teacher classrooms:", transformedClassrooms);
        return transformedClassrooms;
      } else {
        throw new Error(response.data.message || "Failed to fetch teacher classrooms");
      }
    } catch (err) {
      console.error("❌ Error fetching teacher classrooms:", err);
      
      if (err.response?.status === 404) {
        console.log("No classrooms assigned to this teacher yet.");
        return [];
      }
      
      throw err;
    }
  };

  // Fetch parent enrollments
  const fetchParentEnrollments = async () => {
    try {
      setLoadingEnrollments(true);
      console.log("📡 Fetching parent enrollments...");

      const response = await api.get("/my-enrollments", {
        timeout: 10000,
      });

      console.log("📦 Parent enrollments API response:", response.data);

      if (response.data.success) {
        const enrollments = response.data.data.enrollments || [];
        console.log("🎯 Parent enrollments:", enrollments);
        setParentEnrollments(enrollments);
        
        // Extract unique classrooms from enrollments
        const assignedClassrooms = extractClassroomsFromEnrollments(enrollments);
        return assignedClassrooms;
      } else {
        console.warn("Failed to fetch parent enrollments:", response.data.message);
        return [];
      }
    } catch (err) {
      console.error("❌ Error fetching parent enrollments:", err);
      setError("Failed to load your child's enrollments. Please try again.");
      return [];
    } finally {
      setLoadingEnrollments(false);
    }
  };

  // Extract classrooms from enrollment data
  const extractClassroomsFromEnrollments = (enrollments) => {
    const classroomsMap = new Map();
    
    enrollments.forEach(enrollment => {
      const student = enrollment.student;
      if (student && student.enrol_class_in_WSTSC) {
        const classCode = student.enrol_class_in_WSTSC;
        const classroomName = student.enrol_class_in_WSTSC; // Using class code as name
        
        if (!classroomsMap.has(classCode)) {
          classroomsMap.set(classCode, {
            id: classCode, // Using class code as ID since we don't have classroom ID
            name: classroomName,
            code: classCode,
            status: student.status === "approved" ? "Active" : "Pending",
            students: 0, // Will be calculated below
            teachers: 0, // Will be updated if teacher data is available
            is_active: student.status === "approved",
            studentInfo: [],
            enrollmentStatus: student.status
          });
        }
        
        // Add student info to the classroom
        const classroom = classroomsMap.get(classCode);
        classroom.studentInfo.push({
          name: `${student.first_given_name} ${student.family_name}`,
          preferredName: student.preferred_first_name,
          enrollmentId: student.enrollment_id,
          status: student.status
        });
        
        // Count only approved students
        if (student.status === "approved") {
          classroom.students += 1;
        }
      }
    });

    return Array.from(classroomsMap.values());
  };

  // Fetch student counts for all classrooms
  const fetchStudentCounts = async () => {
    try {
      setLoadingStudentCounts(true);
      console.log("📡 Fetching student counts for all classrooms...");

      const response = await api.get("/class-students", {
        timeout: 10000,
      });

      console.log("📦 Student counts API response:", response.data);

      if (response.data.success) {
        // Process the class-students data to count students per classroom
        const counts = {};
        
        if (response.data.data.class_students) {
          response.data.data.class_students.forEach((assignment) => {
            const classId = assignment.class_id;
            if (classId) {
              if (!counts[classId]) {
                counts[classId] = 0;
              }
              counts[classId]++;
            }
          });
        }

        console.log("🎯 Student counts per classroom:", counts);
        setStudentCounts(counts);
      } else {
        console.warn("Failed to fetch student counts:", response.data.message);
      }
    } catch (err) {
      console.error("❌ Error fetching student counts:", err);
      // Don't throw error here - we still want to show classrooms even if counts fail
    } finally {
      setLoadingStudentCounts(false);
    }
  };

  // Fetch teacher counts for all classrooms
  const fetchTeacherCounts = async () => {
    try {
      setLoadingTeacherCounts(true);
      console.log("📡 Fetching teacher counts for all classrooms...");

      const response = await api.get("/classroom-teachers", {
        timeout: 10000,
      });

      console.log("📦 Teacher assignments API response:", response.data);

      if (response.data.success) {
        // Process the classroom-teachers data to count teachers per classroom
        const counts = {};
        
        const allAssignments = response.data.data.assignments || [];
        console.log("📋 ALL TEACHER ASSIGNMENTS:", allAssignments);

        allAssignments.forEach((assignment) => {
          // Handle different possible structures for class_id
          const classId = assignment.class_id || assignment.classroom?.class_id;
          
          if (classId) {
            if (!counts[classId]) {
              counts[classId] = 0;
            }
            
            // Only count current/active assignments if needed
            const isActiveAssignment = assignment.is_current !== false && 
                                     assignment.status !== "inactive";
            
            if (isActiveAssignment) {
              counts[classId]++;
            }
          }
        });

        console.log("🎯 Teacher counts per classroom:", counts);
        setTeacherCounts(counts);
      } else {
        console.warn("Failed to fetch teacher counts:", response.data.message);
      }
    } catch (err) {
      console.error("❌ Error fetching teacher counts:", err);
      // Don't throw error here - we still want to show classrooms even if counts fail
    } finally {
      setLoadingTeacherCounts(false);
    }
  };

  const fetchClassrooms = async (isRefresh = false) => {
    try {
      console.log("🔄 Starting fetchClassrooms...");

      if (!isRefresh) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);

      // If user is parent, fetch their enrollments instead of all classrooms
      if (isParent) {
        console.log("👨‍👧 User is parent, fetching enrollments...");
        const assignedClassrooms = await fetchParentEnrollments();
        setClassrooms(assignedClassrooms);
        
        // Also fetch teacher counts for the assigned classrooms
        await fetchTeacherCounts();
      } 
      // If user is teacher, fetch their assigned classrooms
      else if (isTeacher) {
        console.log("👨‍🏫 User is teacher, fetching assigned classrooms...");
        const assignedClassrooms = await fetchTeacherClassrooms();
        setClassrooms(assignedClassrooms);
        
        // Fetch student and teacher counts for the assigned classrooms
        await Promise.all([
          fetchStudentCounts(),
          fetchTeacherCounts()
        ]);
      }
      // For admin users, fetch all classrooms
      else {
        await Promise.all([
          fetchAllClassrooms(),
          fetchStudentCounts(),
          fetchTeacherCounts()
        ]);
      }

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

      const response = await api.get("/classrooms", {
        timeout: 10000,
      });

      console.log("📦 All classrooms API response:", response.data);

      if (response.data.success) {
        // Transform backend data to match frontend structure
        const transformedClassrooms = response.data.data.classrooms.map(
          (cls) => ({
            id: cls.c_id,
            name: cls.class_name,
            code: cls.class_id,
            status: cls.is_active ? "Active" : "Inactive",
            students: 0, // Initialize with 0, will be updated from studentCounts
            teachers: 0, // Initialize with 0, will be updated from teacherCounts
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

  // Update classrooms with student and teacher counts when counts change
  useEffect(() => {
    if (classrooms.length > 0 && (Object.keys(studentCounts).length > 0 || Object.keys(teacherCounts).length > 0)) {
      const updatedClassrooms = classrooms.map(cls => ({
        ...cls,
        students: studentCounts[cls.code] || cls.students || 0,
        teachers: teacherCounts[cls.code] || cls.teachers || 0
      }));
      setClassrooms(updatedClassrooms);
    }
  }, [studentCounts, teacherCounts]);

  const filtered = classrooms.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.code || "").toLowerCase().includes(q) ||
      (c.status || "").toLowerCase().includes(q)
    );
  });

  // Calculate total students and teachers across all classrooms
  const totalStudents = classrooms.reduce((sum, cls) => sum + (cls.students || 0), 0);
  const totalTeachers = classrooms.reduce((sum, cls) => sum + (cls.teachers || 0), 0);

  console.log("🎨 Current UI state:", {
    userRole,
    userId,
    canCreateClassroom,
    isParent,
    isTeacher,
    classroomsCount: classrooms.length,
    filteredCount: filtered.length,
    parentEnrollments: parentEnrollments.length,
    studentCounts,
    teacherCounts,
    totalStudents,
    totalTeachers
  });

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
          teachers: 0,
          is_active: newClassroom.is_active,
          created_at: newClass.created_at,
          updated_at: newClass.updated_at,
        };

        setClassrooms((prev) => [transformedClassroom, ...prev]);
        closeCreateModal();
        
        // Refresh student and teacher counts to include the new classroom
        fetchStudentCounts();
        fetchTeacherCounts();
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
        
        // Refresh student and teacher counts after deletion
        fetchStudentCounts();
        fetchTeacherCounts();
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
            <p className="mt-3 text-muted">
              {isParent 
                ? "Loading your child's classrooms..." 
                : isTeacher
                ? "Loading your assigned classrooms..."
                : "Loading classrooms..."}
            </p>
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

  // Special view for parents - show assigned classrooms from enrollments
  if (isParent) {
    const hasApprovedEnrollments = parentEnrollments.some(
      enrollment => enrollment.student.status === "approved"
    );

    if (!hasApprovedEnrollments && classrooms.length === 0) {
      return (
        <div className="container-fluid px-4 py-3">
          <div className="row align-items-center mb-4">
            <div className="col-md-4">
              <h4 className="H4-heading fw-bold m-0">
                Classrooms
                <small className="text-muted ms-2 fs-6">(Child's Classrooms)</small>
              </h4>
            </div>
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
                {parentEnrollments.length > 0 
                  ? "Your enrollment applications are pending approval. Once approved, your child's classrooms will appear here."
                  : "Please enroll your students to view their classrooms. Once your children are enrolled in classes, you'll be able to see their classroom information, schedules, and progress here."}
              </p>
              <div className="d-flex justify-content-center gap-3">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/enrol")}
                >
                  <i className="bi bi-person-plus me-2"></i>
                  {parentEnrollments.length > 0 ? "View Enrollments" : "Enroll Students"}
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <i className={`bi bi-arrow-clockwise me-2 ${refreshing ? "spinner-border spinner-border-sm" : ""}`}></i>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Parent has approved enrollments - show assigned classrooms
    return (
      <div className="container-fluid px-4 py-3">
        <div className="row align-items-center mb-4">
          <div className="col-md-4">
            <h4 className="H4-heading fw-bold m-0">
              Classrooms
              <small className="text-muted ms-2 fs-6">(Your Child's Classrooms)</small>
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
                disabled={refreshing}
                style={{ minWidth: "100px" }}
              >
                <i className={`bi bi-arrow-clockwise me-2 ${refreshing ? "spinner-border spinner-border-sm" : ""}`}></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="card p-4 rounded-3 shadow">
          <div className="row mb-3">
            <div className="col-md-6">
              <p className="mb-0">
                Showing {filtered.length} of {classrooms.length} assigned classrooms
              </p>
            </div>
            <div className="col-md-6 d-flex justify-content-end align-items-center gap-3">
              {lastRefreshTime && (
                <p className="mb-0 text-muted small">
                  Last updated: {lastRefreshTime.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Cards grid for parent's assigned classrooms */}
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
                      {cls.studentInfo && cls.studentInfo.length > 0 && (
                        <div className="mt-2 p-2 bg-light rounded">
                          <small>
                            <i className="bi bi-person me-1"></i>
                            Your {cls.studentInfo.length > 1 ? 'Children' : 'Child'}:{" "}
                            {cls.studentInfo.map((student, index) => (
                              <span key={student.enrollmentId}>
                                {student.preferredName || student.name}
                                {student.status !== 'approved' && (
                                  <span className="badge bg-warning ms-1">Pending</span>
                                )}
                                {index < cls.studentInfo.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </small>
                        </div>
                      )}
                    </div>

                    {/* REMOVED: Actions section for parent users - No View button */}
                    {/* Parent users can only see classroom information, no actions */}
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

  // Non-parent user view (admin, teacher, etc.)
  return (
    <div className="container-fluid px-4 py-3">
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

            {/* Only show create button for non-teacher/non-parent users */}
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
              disabled={refreshing || loadingStudentCounts || loadingTeacherCounts}
              style={{
                width: "40px",
                height: "40px",
                opacity: (refreshing || loadingStudentCounts || loadingTeacherCounts) ? 0.7 : 1,
              }}
              title="Refresh classrooms"
            >
              <i
                className={`bi bi-arrow-clockwise ${
                  (refreshing || loadingStudentCounts || loadingTeacherCounts) ? "spinner-border spinner-border-sm" : ""
                }`}
                style={{
                  animation: (refreshing || loadingStudentCounts || loadingTeacherCounts) ? "spin 1s linear infinite" : "none",
                }}
              />
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
          <div className="col-md-6 d-flex justify-content-end align-items-center gap-3">
            {lastRefreshTime && (
              <p className="mb-0 text-muted small">
                Last updated: {lastRefreshTime.toLocaleTimeString()}
              </p>
            )}
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
                    <div>
                      <i className="bi bi-person-badge me-1" /> Teachers:{" "}
                      <strong>{cls.teachers || 0}</strong>
                    </div>
                    {cls.assignment_date && isTeacher && (
                      <div
                        className="text-truncate"
                        title={`Assigned: ${new Date(
                          cls.assignment_date
                        ).toLocaleDateString()}`}
                      >
                        <i className="bi bi-calendar-check me-1" /> Assigned:{" "}
                        {new Date(cls.assignment_date).toLocaleDateString()}
                      </div>
                    )}
                    {cls.created_at && !isTeacher && (
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
                  )}
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
                    ? "No classrooms assigned to you at the moment."
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

      {/* Rest of the modals remain the same */}
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