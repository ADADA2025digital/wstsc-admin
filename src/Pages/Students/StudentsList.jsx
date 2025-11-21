import React, { useEffect, useState } from "react";
import "../../assets/Styles/Style.css";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import "datatables.net-responsive-dt";
import "datatables.net";
import {
  Spinner,
  Alert,
  Card,
  Button,
  Row,
  Col,
  Badge,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../config/axiosConfig";
import Loader from "../../Pages/Loader";

const StudentsList = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  // Get user data from localStorage
  useEffect(() => {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      try {
        const userData = JSON.parse(userDataString);
        setUserData(userData);
        
        // Get role from primary_role
        if (userData.primary_role && userData.primary_role.role_name) {
          setUserRole(userData.primary_role.role_name);
        } else {
          console.warn("No primary role found in user data");
          setUserRole("parent"); // Default to parent if no role found
        }
      } catch (error) {
        console.error("Error parsing user data from localStorage:", error);
        setUserRole("parent"); // Default to parent if error
      }
    } else {
      console.warn("No user data found in localStorage");
      setUserRole("parent"); // Default to parent if no user data
    }
  }, []);

  // Format date from API response
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-AU"); // Australian date format
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  // Get enrollment year from mainstream_enrollment_year
  const getEnrollmentYear = (enrollmentYear) => {
    if (!enrollmentYear) return "N/A";
    // Extract year from string like "Year 8"
    const yearMatch = enrollmentYear.match(/\d+/);
    return yearMatch ? yearMatch[0] : enrollmentYear;
  };

  // Extract parent name from student data
  const extractParentName = (student) => {
    if (!student) return "N/A";

    // Method 1: Direct parent name field
    if (student.parent_name) {
      return student.parent_name;
    }

    // Method 2: Parent carer object
    if (student.parent_carer_1) {
      const parent = student.parent_carer_1;
      if (typeof parent === 'string') {
        return parent;
      } else if (parent && typeof parent === 'object') {
        if (parent.name) return parent.name;
        if (parent.full_name) return parent.full_name;
        if (parent.first_name && parent.last_name) return `${parent.first_name} ${parent.last_name}`;
        if (parent.firstName && parent.lastName) return `${parent.firstName} ${parent.lastName}`;
      }
    }

    // Method 3: Approved by field
    if (student.approved_by) {
      const approvedBy = student.approved_by;
      if (typeof approvedBy === 'string') {
        return approvedBy;
      } else if (approvedBy && typeof approvedBy === 'object') {
        if (approvedBy.name) return approvedBy.name;
        if (approvedBy.full_name) return approvedBy.full_name;
        if (approvedBy.first_name && approvedBy.last_name) return `${approvedBy.first_name} ${approvedBy.last_name}`;
      }
    }

    // Method 4: Parents array
    if (student.parents && Array.isArray(student.parents) && student.parents.length > 0) {
      const primaryParent = student.parents[0];
      if (primaryParent.name) return primaryParent.name;
      if (primaryParent.full_name) return primaryParent.full_name;
      if (primaryParent.first_name && primaryParent.last_name) return `${primaryParent.first_name} ${primaryParent.last_name}`;
    }

    // Method 5: Primary parent field
    if (student.primary_parent) {
      const primaryParent = student.primary_parent;
      if (typeof primaryParent === 'string') {
        return primaryParent;
      } else if (primaryParent && typeof primaryParent === 'object') {
        if (primaryParent.name) return primaryParent.name;
        if (primaryParent.full_name) return primaryParent.full_name;
        if (primaryParent.first_name && primaryParent.last_name) return `${primaryParent.first_name} ${primaryParent.last_name}`;
      }
    }

    // Method 6: Emergency contact as fallback
    if (student.emergency_contact) {
      const emergencyContact = student.emergency_contact;
      if (typeof emergencyContact === 'string') {
        return emergencyContact;
      } else if (emergencyContact && typeof emergencyContact === 'object') {
        if (emergencyContact.name) return emergencyContact.name;
        if (emergencyContact.full_name) return emergencyContact.full_name;
        if (emergencyContact.first_name && emergencyContact.last_name) return `${emergencyContact.first_name} ${emergencyContact.last_name}`;
      }
    }

    return "N/A";
  };

  // Fetch students based on user role
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      
      if (userRole === "admin") {
        // Admin: Get all students
        response = await api.get("/students");
        console.log("Admin students response:", response.data);
        
        if (response.data.success && response.data.data.students) {
          // Debug: Check the structure of the first student to find parent fields
          if (response.data.data.students.length > 0) {
            const firstStudent = response.data.data.students[0];
            console.log("=== DEBUG FIRST STUDENT ===");
            console.log("Student ID:", firstStudent.studid);
            console.log("Student Name:", firstStudent.student_name);
            
            // Find all keys that might contain parent info
            const parentRelatedKeys = Object.keys(firstStudent).filter(key => 
              key.toLowerCase().includes('parent') || 
              key.toLowerCase().includes('carer') ||
              key.toLowerCase().includes('approved') ||
              key.toLowerCase().includes('emergency')
            );
            
            console.log("Parent-related keys:", parentRelatedKeys);
            
            // Log the values of parent-related keys
            parentRelatedKeys.forEach(key => {
              console.log(`Key "${key}":`, firstStudent[key]);
            });
            console.log("=== END DEBUG ===");
          }
          
          const formattedStudents = response.data.data.students.map((student, index) => {
            const parentName = extractParentName(student);
            
            console.log(`Student ${student.studid} - Parent Name:`, parentName);
            
            return {
              id: student.studid,
              student_id: student.studid,
              full_name: student.student_name,
              preferred_name: student.preferred_name || "",
              gender: student.gender?.charAt(0).toUpperCase() + student.gender?.slice(1) || "Not specified",
              date_of_birth: formatDate(student.date_of_birth),
              enrollment_year: getEnrollmentYear(student.mainstream_enrollment_year),
              status: student.status?.charAt(0).toUpperCase() + student.status?.slice(1) || "Unknown",
              classroom: student.class_grade || "Not assigned",
              parent_name: parentName,
              raw_data: student
            };
          });
          setStudents(formattedStudents);
        }
      } else {
        // Parent: Get their children
        response = await api.get("/my-enrollments");
        console.log("Parent enrollments response:", response.data);
        
        if (response.data.success && response.data.data.enrollments) {
          const formattedStudents = response.data.data.enrollments.map((enrollment, index) => {
            const student = enrollment.student;
            const parent = enrollment.parent_carer_1;
            
            const parentName = parent ? `${parent.first_name} ${parent.last_name}` : "N/A";
            
            return {
              id: student.student_id,
              student_id: student.student_id,
              full_name: `${student.first_given_name} ${student.family_name}`,
              preferred_name: student.preferred_first_name || "",
              gender: student.gender?.charAt(0).toUpperCase() + student.gender?.slice(1) || "Not specified",
              date_of_birth: formatDate(student.date_of_birth),
              enrollment_year: getEnrollmentYear(student.mainstream_enrollment_year),
              status: student.status?.charAt(0).toUpperCase() + student.status?.slice(1) || "Unknown",
              classroom: student.enrol_class_in_WSTSC || "Not assigned",
              parent_name: parentName,
              raw_data: {
                ...student,
                parent_carer_1: parent,
                medical_details: enrollment.medical_details,
                first_emergency_contact: enrollment.first_emergency_contact,
                personal_declaration: enrollment.personal_declaration
              }
            };
          });
          setStudents(formattedStudents);
        }
      }
      
      setLastRefreshTime(new Date());
    } catch (err) {
      console.error("Error fetching students:", err);
      setError(
        err.response?.data?.message || 
        err.message || 
        "Failed to load students. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (userRole) {
      fetchStudents();
    }
  }, [userRole]);

  // DataTable initialization
  useEffect(() => {
    if (students.length > 0 && userRole === "admin") {
      console.log("Initializing DataTable with students:", students);

      // Destroy existing DataTable if it exists
      if ($.fn.DataTable.isDataTable("#studentTable")) {
        $("#studentTable").DataTable().destroy();
        $("#studentTable").empty();
      }

      // Initialize DataTable
      const table = $("#studentTable").DataTable({
        data: students,
        destroy: true,
        columns: [
          {
            title: "#",
            data: null,
            className: "text-center",
            width: "50px",
            render: function (data, type, row, meta) {
              return meta.row + 1;
            },
          },
          {
            title: "Student ID",
            data: "student_id",
            className: "text-center",
          },
          {
            title: "Full Name",
            data: "full_name",
          },
          {
            title: "Preferred Name",
            data: "preferred_name",
          },
          {
            title: "Gender",
            data: "gender",
            className: "dt-head-left",
          },
          {
            title: "Date of Birth",
            data: "date_of_birth",
            className: "text-center",
          },
          {
            title: "Status",
            data: "status",
            className: "text-center",
            render: function (data, type, row) {
              const statusClass =
                data === "Active" || data === "Approved"
                  ? "badge bg-success"
                  : data === "Pending"
                  ? "badge bg-warning"
                  : data === "Inactive" || data === "Rejected"
                  ? "badge bg-secondary"
                  : "badge bg-info";

              return `<span class="${statusClass}">${data}</span>`;
            },
          },
          {
            title: "Classroom",
            data: "classroom",
            className: "text-center",
          },
          {
            title: "Parent Name",
            data: "parent_name",
          },
          {
            title: "Actions",
            className: "text-center",
            width: "100px",
            data: null,
            orderable: false,
            render: function (data, type, row) {
              return `
                <div class="d-flex justify-content-center gap-2">
                  <button class="btn btn-sm btn-outline-primary view-btn" 
                          data-student-id="${row.id}" 
                          title="View Details">
                    <i class="bi bi-eye"></i>
                  </button>
                </div>
              `;
            },
          },
        ],
        responsive: false,
        scrollX: true,
        language: {
          emptyTable: "No students found",
          search: "Search students:",
        },
        order: [[0, "asc"]],
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        initComplete: function () {
          console.log("DataTable initialized successfully");
        },
      });

      // View student details
      $("#studentTable").on("click", ".view-btn", function () {
        const studentId = $(this).data("student-id");
        console.log("View button clicked for student:", studentId);
        const student = students.find((s) => s.id === studentId);
        if (student) {
          navigate(`/students/${studentId}`, {
            state: {
              studentData: student.raw_data,
            },
          });
        }
      });

      return () => {
        if ($.fn.DataTable.isDataTable("#studentTable")) {
          table.destroy();
        }
      };
    }
  }, [students, navigate, userRole]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStudents().finally(() => {
      setRefreshing(false);
    });
  };

  // Get gender icon
  const getGenderIcon = (gender) => {
    switch (gender?.toLowerCase()) {
      case "male":
        return "bi-gender-male text-primary";
      case "female":
        return "bi-gender-female text-pink";
      default:
        return "bi-gender-ambiguous text-secondary";
    }
  };

  // Get status variant for badge
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "approved":
        return "success";
      case "pending":
        return "warning";
      case "inactive":
      case "rejected":
        return "secondary";
      default:
        return "info";
    }
  };

  // Parent/Teacher View with Cards
  const ParentTeacherView = () => (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold text-dark">Students</h4>
          <p className="text-muted mb-0">
            Manage and view student information
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {lastRefreshTime && (
            <small className="text-muted">
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </small>
          )}
          <button
            onClick={handleRefresh}
            className={`btn btn-outline-secondary btn-sm d-flex align-items-center ${
              refreshing ? "opacity-75" : ""
            }`}
            disabled={refreshing}
          >
            <i
              className={`bi bi-arrow-clockwise me-1 ${
                refreshing ? "spin" : ""
              }`}
            ></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Main Content */}
      <Card className="border shadow-sm">
        <Card.Body className="p-4">
          {/* Welcome Section */}
          <div className="text-center mb-5">
            <div className="mb-3">
              <i className="bi bi-people display-4 text-primary opacity-75"></i>
            </div>
            <h5 className="fw-semibold text-dark mb-2">
              Your Children's Information ({students.length})
            </h5>
            <p className="text-muted mb-0">
              You can view your children's information here. Contact the
              school administration for any updates.
            </p>
          </div>

          {/* Students Cards Section */}
          {students.length > 0 ? (
            <div>
              <Row className="g-4">
                {students.map((student, index) => {
                  const parentCarer = student.raw_data?.parent_carer_1 || {};
                  const parentName = student.parent_name || `${parentCarer.first_name || ""} ${
                    parentCarer.last_name || ""
                  }`.trim() || "N/A";

                  return (
                    <Col key={student.id} xl={4} lg={6} md={6} sm={12}>
                      <Card className="h-100 border shadow-sm hover-shadow transition-all">
                        <Card.Body className="p-4">
                          {/* Student Header */}
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h5 className="fw-bold text-dark mb-1">
                                {student.full_name}
                              </h5>
                              {student.preferred_name && (
                                <small className="text-muted">
                                  Preferred: {student.preferred_name}
                                </small>
                              )}
                            </div>
                            <Badge
                              bg={getStatusVariant(student.status)}
                              className="fs-12px"
                            >
                              {student.status}
                            </Badge>
                          </div>

                          {/* Student ID */}
                          <div className="mb-3">
                            <small className="text-muted d-block">
                              Student ID
                            </small>
                            <span className="fw-semibold text-dark">
                              {student.student_id}
                            </span>
                          </div>

                          {/* Student Details Grid */}
                          <Row className="g-2 mb-3">
                            <Col sm={6}>
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-mortarboard-fill text-primary me-2 fs-14px"></i>
                                <small className="text-muted">Class</small>
                              </div>
                              <span className="fw-semibold text-dark d-block">
                                {student.classroom}
                              </span>
                            </Col>
                            <Col sm={6}>
                              <div className="d-flex align-items-center mb-2">
                                <i
                                  className={`bi ${getGenderIcon(
                                    student.gender
                                  )} text-primary me-2 fs-14px`}
                                ></i>
                                <small className="text-muted">Gender</small>
                              </div>
                              <span className="fw-semibold text-dark d-block text-capitalize">
                                {student.gender || "Not specified"}
                              </span>
                            </Col>
                          </Row>

                          <Row className="g-2 mb-3">
                            <Col sm={6}>
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-calendar-event text-primary me-2 fs-14px"></i>
                                <small className="text-muted">
                                  Date of Birth
                                </small>
                              </div>
                              <span className="fw-semibold text-dark d-block">
                                {student.date_of_birth}
                              </span>
                            </Col>
                            <Col sm={6}>
                              <div className="d-flex align-items-center mb-2">
                                <i className="bi bi-calendar-check text-primary me-2 fs-14px"></i>
                                <small className="text-muted">
                                  Enrollment Year
                                </small>
                              </div>
                              <span className="fw-semibold text-dark d-block">
                                {student.enrollment_year}
                              </span>
                            </Col>
                          </Row>

                          {/* Parent Information */}
                          <div className="mb-4">
                            <div className="d-flex align-items-center mb-2">
                              <i className="bi bi-person-badge text-primary me-2 fs-14px"></i>
                              <small className="text-muted">Parent</small>
                            </div>
                            <span className="fw-semibold text-dark d-block">
                              {parentName}
                            </span>
                          </div>

                          {/* Action Button */}
                          <div className="d-flex justify-content-end">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="fw-semibold p-2"
                              onClick={() =>
                                navigate(`/students/${student.id}`, {
                                  state: {
                                    studentData: student.raw_data,
                                  },
                                })
                              }
                            >
                              <i className="bi bi-eye me-1"></i>
                              View Full Details
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="bi bi-person-x display-4 text-muted opacity-50"></i>
              </div>
              <h6 className="fw-semibold text-dark mb-2">
                No Children Found
              </h6>
              <p className="text-muted mb-4">
                No approved enrollment found for your account.
              </p>
              <Button
                variant="outline-primary"
                onClick={handleRefresh}
                className="px-4"
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );

  // Loading state - UPDATED TO USE CUSTOM LOADER
  if (loading) {
    return <Loader />;
  }

  // Show parent/teacher view for non-admin users
  if (userRole !== "admin") {
    return <ParentTeacherView />;
  }

  // Admin view with DataTable
  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Students Management</h4>
          {userData && (
            <p className="text-muted mb-0">
              Welcome, {userData.name} ({userData.primary_role?.display_name})
            </p>
          )}
        </div>

        <div className="d-flex align-items-center gap-3">
          {lastRefreshTime && (
            <p className="mb-0 text-muted">
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </p>
          )}

          <button
            onClick={handleRefresh}
            className={`btn btn-outline-secondary d-flex align-items-center justify-content-center ${
              refreshing ? "opacity-75" : ""
            }`}
            disabled={refreshing}
          >
            <i
              className={`bi bi-arrow-clockwise ${refreshing ? "spin" : ""}`}
            ></i>
          </button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <Alert.Heading>Error Loading Students</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2 mt-3">
            <Button onClick={handleRefresh}>Retry</Button>
          </div>
        </Alert>
      )}

      {!error && (
        <div className="card mt-1 p-3 rounded-3 shadow">
          {students.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-people display-4 text-muted mb-3"></i>
              <p className="text-muted">No students found.</p>
              <Button onClick={handleRefresh} variant="outline-primary">
                <i className="bi bi-arrow-clockwise me-2"></i>
                Refresh
              </Button>
            </div>
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="mb-0">Showing {students.length} students</p>
              </div>
              
              {/* Admin view with DataTable */}
              <table
                id="studentTable"
                className="table table-striped table-hover custom-data-table w-100"
              ></table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentsList;