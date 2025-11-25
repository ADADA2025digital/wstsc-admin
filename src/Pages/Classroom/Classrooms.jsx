import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/axiosConfig";
import Loader from "../../Pages/Loader";

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

  // Function to fetch student count for a classroom
  const fetchClassroomStudentCount = async (classId) => {
    try {
      const response = await api.get(`/class-students/class/${classId}`);
      return response.data.data.summary.total_students;
    } catch (error) {
      console.error(`Error fetching student count for class ${classId}:`, error);
      return 0; // Return 0 as fallback
    }
  };

  // Function to get teacher ID for the current user
  const getTeacherId = async () => {
    try {
      console.log("Fetching teacher data for user ID:", userId);
      
      // Try multiple possible endpoints to get teacher ID
      let teacherId = null;
      
      // Option 1: Try the teachers/user/{userId} endpoint
      try {
        const teacherResponse = await api.get(`/teachers/user/${userId}`);
        console.log("Teacher response:", teacherResponse.data);
        
        // Try different possible paths for teacher ID
        teacherId = teacherResponse.data.data?.tid || 
                   teacherResponse.data.data?.teacher_id ||
                   teacherResponse.data.data?.id;
        
        if (teacherId) {
          console.log("Found teacher ID via /teachers/user endpoint:", teacherId);
          return teacherId;
        }
      } catch (error) {
        console.warn("Failed to get teacher ID via /teachers/user endpoint:", error);
      }
      
      // Option 2: Try to get teacher profile directly
      try {
        const profileResponse = await api.get(`/teachers`);
        console.log("Teachers list response:", profileResponse.data);
        
        // Look for the teacher record that matches the current user
        const teachers = profileResponse.data.data?.teachers || profileResponse.data.data || [];
        const currentTeacher = teachers.find(teacher => 
          teacher.user_id === userId || teacher.uid === userId
        );
        
        if (currentTeacher) {
          teacherId = currentTeacher.tid || currentTeacher.teacher_id || currentTeacher.id;
          console.log("Found teacher ID via /teachers endpoint:", teacherId);
          return teacherId;
        }
      } catch (error) {
        console.warn("Failed to get teacher ID via /teachers endpoint:", error);
      }
      
      // Option 3: Try user profile to see if teacher ID is there
      try {
        const userResponse = await api.get(`/users/${userId}`);
        console.log("User profile response:", userResponse.data);
        
        teacherId = userResponse.data.data?.teacher_id || 
                   userResponse.data.data?.tid;
        
        if (teacherId) {
          console.log("Found teacher ID via user profile:", teacherId);
          return teacherId;
        }
      } catch (error) {
        console.warn("Failed to get teacher ID via user profile:", error);
      }
      
      console.warn("Could not find teacher ID for user:", userId);
      return null;
      
    } catch (error) {
      console.error("Error getting teacher ID:", error);
      return null;
    }
  };

  // Fetch classrooms based on user role
  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      
      if (userRole === "admin") {
        // Admin: Get all classrooms
        response = await api.get("/classrooms");
        const classroomsData = await Promise.all(
          response.data.data.classrooms.map(async (cls) => {
            // Fetch accurate student count for each classroom
            let studentCount = cls.current_students_count || 0;
            
            try {
              const accurateCount = await fetchClassroomStudentCount(cls.class_id);
              studentCount = accurateCount;
            } catch (error) {
              console.warn(`Could not fetch accurate student count for class ${cls.class_id}:`, error);
              // Use the existing count as fallback
            }
            
            return {
              id: cls.c_id,
              c_id: cls.c_id,
              name: cls.class_name,
              code: cls.class_id,
              status: cls.is_active ? "Active" : "Inactive",
              students: studentCount,
              teachers: cls.current_teachers_count || 0,
              is_active: cls.is_active,
              created_at: cls.created_at,
            };
          })
        );
        setClassrooms(classroomsData);
      } else if (userRole === "teacher") {
        // Teacher: Get teacher-specific classrooms
        console.log("Fetching teacher classrooms for user ID:", userId);
        
        // First, get the teacher ID
        const teacherId = await getTeacherId();
        
        if (teacherId) {
          console.log("Using teacher ID:", teacherId);
          
          try {
            // Use the classroom-teachers endpoint with the correct teacher ID
            response = await api.get(`/classroom-teachers/teacher/${teacherId}/classrooms`);
            console.log("Teacher classrooms response:", response.data);
            
            // Map the response data and fetch student counts
            const classroomsData = await Promise.all(
              response.data.data.classrooms.map(async (item) => {
                const classroom = item.classroom || item;
                
                // Fetch accurate student count
                let studentCount = classroom.current_students_count || 0;
                try {
                  const accurateCount = await fetchClassroomStudentCount(classroom.class_id);
                  studentCount = accurateCount;
                } catch (error) {
                  console.warn(`Could not fetch accurate student count for class ${classroom.class_id}:`, error);
                }
                
                return {
                  id: classroom.c_id || classroom.class_id,
                  c_id: classroom.c_id || classroom.class_id,
                  name: classroom.class_name,
                  code: classroom.class_id,
                  status: classroom.is_active ? "Active" : "Inactive",
                  students: studentCount,
                  teachers: classroom.current_teachers_count || 1,
                  is_active: classroom.is_active,
                  created_at: classroom.created_at,
                };
              })
            );
            
            console.log("Mapped teacher classrooms:", classroomsData);
            setClassrooms(classroomsData);
          } catch (classroomError) {
            console.error("Error fetching teacher classrooms:", classroomError);
            
            // Fallback: Try alternative endpoint
            try {
              console.log("Trying alternative endpoint: /classroom-teachers");
              const altResponse = await api.get("/classroom-teachers");
              console.log("Alternative endpoint response:", altResponse.data);
              
              // Filter classrooms for this teacher
              const allClassrooms = altResponse.data.data?.classroom_teachers || altResponse.data.data || [];
              const teacherClassrooms = allClassrooms.filter(item => 
                item.teacher_id === teacherId || item.tid === teacherId
              );
              
              const classroomsData = await Promise.all(
                teacherClassrooms.map(async (item) => {
                  const classroom = item.classroom || item;
                  
                  // Fetch accurate student count
                  let studentCount = classroom.current_students_count || 0;
                  try {
                    const accurateCount = await fetchClassroomStudentCount(classroom.class_id);
                    studentCount = accurateCount;
                  } catch (error) {
                    console.warn(`Could not fetch accurate student count for class ${classroom.class_id}:`, error);
                  }
                  
                  return {
                    id: classroom.c_id || classroom.class_id,
                    c_id: classroom.c_id || classroom.class_id,
                    name: classroom.class_name,
                    code: classroom.class_id,
                    status: classroom.is_active ? "Active" : "Inactive",
                    students: studentCount,
                    teachers: classroom.current_teachers_count || 1,
                    is_active: classroom.is_active,
                    created_at: classroom.created_at,
                  };
                })
              );
              
              setClassrooms(classroomsData);
            } catch (altError) {
              console.error("Alternative endpoint also failed:", altError);
              setClassrooms([]);
              setError("Unable to load your classrooms. Please contact administrator.");
            }
          }
        } else {
          console.warn("Teacher ID not found for user:", userId);
          setClassrooms([]);
          setError("Teacher profile not found. Please contact administrator.");
        }
      } else {
        // Parent: Get parent's children classrooms using the my-enrollments endpoint
        try {
          console.log("Fetching parent enrollments for user ID:", userId);
          
          // Use the my-enrollments endpoint as shown in your API
          response = await api.get("/my-enrollments");
          console.log("Parent enrollments response:", response.data);
          
          // Extract classrooms from enrollments
          const enrollments = response.data.data?.enrollments || [];
          
          // Create a map to avoid duplicate classrooms (same class code)
          const classroomMap = new Map();
          
          enrollments.forEach(enrollment => {
            const classInfo = enrollment.student;
            
            if (classInfo?.enrol_class_in_WSTSC && classInfo?.status === "approved") {
              const classCode = classInfo.enrol_class_in_WSTSC;
              
              // If we haven't seen this classroom before, add it
              if (!classroomMap.has(classCode)) {
                classroomMap.set(classCode, {
                  id: classCode,
                  c_id: classCode,
                  name: `${classCode} Classroom`,
                  code: classCode,
                  status: "Active",
                  students: 0,
                  teachers: 1,
                  is_active: true,
                  created_at: classInfo.enrolment_date || classInfo.submitted_at,
                  students_info: []
                });
              }
              
              // Add student info to the classroom
              const classroom = classroomMap.get(classCode);
              classroom.students_info.push({
                student_id: classInfo.student_id,
                first_name: classInfo.first_given_name,
                preferred_name: classInfo.preferred_first_name,
                family_name: classInfo.family_name,
                gender: classInfo.gender,
                date_of_birth: classInfo.date_of_birth,
                mainstream_school: classInfo.mainstream_school_name,
                enrollment_year: classInfo.mainstream_enrollment_year,
                enrollment_status: classInfo.status
              });
            }
          });
          
          // Convert map to array and update student counts
          const classroomsData = Array.from(classroomMap.values()).map(classroom => ({
            ...classroom,
            students: classroom.students_info.length
          }));
          
          console.log("Mapped parent classrooms:", classroomsData);
          setClassrooms(classroomsData);
          
        } catch (parentError) {
          console.error("Error fetching parent enrollments:", parentError);
          
          if (parentError.response?.status === 404) {
            console.log("Parent enrollments endpoint returned 404, no enrollments found");
            setClassrooms([]);
          } else if (parentError.response?.status === 401) {
            setError("Authentication failed. Please log in again.");
          } else {
            setError("Failed to load your children's classrooms. Please try again.");
          }
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

  // Handle view for both parent and admin - navigate to same path
  const handleView = async (cls) => {
    console.log("👁️ Navigating to classroom:", cls);
    
    // For all user roles, fetch the most up-to-date student count before navigating
    let accurateStudentCount = cls.students;
    try {
      const classId = cls.code || cls.id;
      accurateStudentCount = await fetchClassroomStudentCount(classId);
    } catch (error) {
      console.warn("Could not fetch updated student count, using cached value");
    }
    
    const classroomWithUpdatedCount = {
      ...cls,
      students: accurateStudentCount
    };
    
    if (isParent) {
      console.log("👨‍👧 Parent viewing classroom with code:", cls.code);
      navigate(`/classrooms/${cls.code}`, {
        state: { 
          classroom: classroomWithUpdatedCount,
          userRole: userRole
        },
      });
    } else {
      console.log("👨‍💼 Admin/Teacher viewing classroom with id:", cls.id);
      navigate(`/classrooms/${cls.id}`, {
        state: { 
          classroom: classroomWithUpdatedCount,
          userRole: userRole
        },
      });
    }
  };

  // ... Rest of the code remains the same (create, delete, modal functions)
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

  const createClassroom = async () => {
    const className = newClassroom.class_name.trim();
    if (!className) {
      setCreateError("Classroom name is required");
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const response = await api.post("/classrooms", {
        class_name: className,
        is_active: newClassroom.is_active,
      });

      if (response.data.success) {
        console.log("Classroom created successfully:", response.data.data);
        await fetchClassrooms();
        closeCreateModal();
        setSuccessMessage(`Classroom "${className}" created successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.data.message || "Failed to create classroom");
      }
    } catch (err) {
      console.error("Error creating classroom:", err);
      if (err.response) {
        const errorMessage = err.response.data?.message || 
                           err.response.data?.error || 
                           "Failed to create classroom";
        setCreateError(errorMessage);
      } else if (err.request) {
        setCreateError("Network error: Unable to connect to server");
      } else {
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

  const confirmDelete = async () => {
    if (!toDelete) return;

    setDeleting(true);

    try {
      const classroomId = toDelete.c_id || toDelete.id;
      
      if (!classroomId) {
        throw new Error("Classroom ID not found");
      }

      const response = await api.delete(`/classrooms/${classroomId}`);
      
      if (response.data.success) {
        console.log("Classroom deleted successfully:", response.data.data);
        await fetchClassrooms();
        setSuccessMessage(`Classroom "${toDelete.name}" deleted successfully!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.data.message || "Failed to delete classroom");
      }
      
      cancelDelete();
    } catch (err) {
      console.error("Error deleting classroom:", err);
      let errorMessage = "Failed to delete classroom. Please try again.";
      
      if (err.response) {
        errorMessage = err.response.data?.message || 
                      err.response.data?.error || 
                      errorMessage;
      } else if (err.request) {
        errorMessage = "Network error: Unable to connect to server";
      } else {
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
    return <Loader />;
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

  // ... Rest of the JSX rendering code remains the same
  // Teacher view
  if (isTeacher) {
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
                (Your Assigned Classrooms)
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
                  placeholder="Search your classrooms..."
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
                {totalStudents > 0 && (
                  <span className="text-muted ms-2">
                    • Total Students: <strong>{totalStudents}</strong>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Cards grid for teacher's assigned classrooms */}
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
                        <i className="bi bi-people me-1" /> Students:{" "}
                        <strong>{cls.students}</strong>
                      </div>
                      {cls.teachers > 0 && (
                        <div>
                          <i className="bi bi-person-badge me-1" /> Teachers:{" "}
                          <strong>{cls.teachers}</strong>
                        </div>
                      )}
                    </div>

                    {/* View button for teacher */}
                    <div className="mt-auto d-flex justify-content-end">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleView(cls)}
                        title="View Classroom"
                      >
                        <i className="bi bi-eye me-1" /> View
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
                      : "No classrooms assigned to you at the moment."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ... Rest of the JSX for parent and admin views remains the same
  // Parent view
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
                Showing {filtered.length} of {classrooms.length} classrooms with your children
                {totalStudents > 0 && (
                  <span className="text-muted ms-2">
                    • Total Children: <strong>{totalStudents}</strong>
                  </span>
                )}
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
                        <small className="text-muted">
                          Class Code: {cls.code}
                        </small>
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
                      <div className="mb-2">
                        <i className="bi bi-people me-1" /> 
                        <strong>Your Children in this Class:</strong>
                      </div>
                      {cls.students_info?.map((student, index) => (
                        <div key={index} className="mb-1">
                          <i className="bi bi-person me-1" />
                          {student.preferred_name || student.first_name} {student.family_name}
                          {student.enrollment_year && (
                            <small className="text-muted ms-1">
                              ({student.enrollment_year})
                            </small>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* View button for parent */}
                    <div className="mt-auto d-flex justify-content-end">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleView(cls)}
                        title="View Classroom Details"
                      >
                        <i className="bi bi-eye me-1" /> View
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
                    className="bi bi-backpack"
                    style={{ fontSize: "2rem" }}
                  />
                  <p className="mb-0 mt-2">
                    {query
                      ? "No classrooms match your search."
                      : "No classroom enrollments found for your children."}
                  </p>
                  <small className="text-muted">
                    {!query && "If you recently enrolled your children, please check back later for updates."}
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Admin view (same as before)
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
                  (All Classrooms)
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

                    {/* Actions - Show for admin users only */}
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