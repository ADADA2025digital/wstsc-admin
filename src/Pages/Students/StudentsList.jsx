import React, { useEffect, useState, useCallback } from "react";
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
import { useUserData } from "../../hooks/useUserData";

const StudentsList = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { userData } = useUserData();
  const navigate = useNavigate();

  const currentRole = userData?.primary_role?.role_name;

  // Format date from API response
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-AU");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  // Get enrollment year from mainstream_enrollment_year
  const getEnrollmentYear = (enrollmentYear) => {
    if (!enrollmentYear) return "N/A";
    const yearMatch = enrollmentYear.match(/\d+/);
    return yearMatch ? yearMatch[0] : enrollmentYear;
  };

  // Extract parent name from student data
  const extractParentName = (student) => {
    if (!student) return "N/A";

    if (student.parent_name) {
      return student.parent_name;
    }

    if (student.parent_carer_1) {
      const parent = student.parent_carer_1;
      if (typeof parent === 'string') {
        return parent;
      } else if (parent && typeof parent === 'object') {
        if (parent.name) return parent.name;
        if (parent.full_name) return parent.full_name;
        if (parent.first_name && parent.last_name) return `${parent.first_name} ${parent.last_name}`;
      }
    }

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

    if (student.parents && Array.isArray(student.parents) && student.parents.length > 0) {
      const primaryParent = student.parents[0];
      if (primaryParent.name) return primaryParent.name;
      if (primaryParent.full_name) return primaryParent.full_name;
      if (primaryParent.first_name && primaryParent.last_name) return `${primaryParent.first_name} ${primaryParent.last_name}`;
    }

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

  // Create a classroom map for quick lookup
  const createClassroomMap = useCallback((classroomsData) => {
    const map = {};
    if (classroomsData && classroomsData.length > 0) {
      classroomsData.forEach(classroom => {
        map[classroom.class_id] = classroom.class_name;
        // Also add lowercase version for case-insensitive matching
        map[classroom.class_id.toLowerCase()] = classroom.class_name;
      });
    }
    console.log("📚 Classroom map created:", map);
    return map;
  }, []);

  // Fetch classrooms data
  const fetchClassrooms = async () => {
    try {
      console.log("📚 Fetching classrooms...");
      const response = await api.get("/classrooms");
      
      if (response.data.success && response.data.data.classrooms) {
        const classroomsData = response.data.data.classrooms;
        setClassrooms(classroomsData);
        console.log(`📚 Loaded ${classroomsData.length} classrooms`);
        
        // Log all classrooms for debugging
        classroomsData.forEach((cls, index) => {
          console.log(`📚 Classroom ${index + 1}: ${cls.class_id} -> "${cls.class_name}"`);
        });
        
        return classroomsData;
      }
      return [];
    } catch (err) {
      console.error("❌ Error fetching classrooms:", err);
      return [];
    }
  };

  // Map student data with classroom names
  const mapStudentsWithClassroomNames = useCallback((studentsData, classroomsData) => {
    if (!studentsData || studentsData.length === 0) return studentsData;
    if (!classroomsData || classroomsData.length === 0) {
      console.warn("⚠️ No classrooms data available for mapping");
      return studentsData;
    }
    
    const classroomMap = createClassroomMap(classroomsData);
    
    return studentsData.map(student => {
      // Get the classroom ID from student data
      const classId = student.raw_data?.class_grade || 
                     student.raw_data?.classroom || 
                     student.raw_data?.class_id ||
                     student.classroom;
      
      console.log(`🔄 Mapping student ${student.full_name}:`, {
        originalClassroom: student.classroom,
        classIdFromRaw: classId,
        hasClassroomMap: !!classroomMap[classId]
      });
      
      let className = student.classroom;
      
      // Try to map if we have a classroom ID
      if (classId && classroomMap[classId]) {
        className = classroomMap[classId];
        console.log(`✅ Mapped "${classId}" to "${className}"`);
      } else if (classId) {
        // Try case-insensitive match
        const lowerClassId = classId.toLowerCase();
        if (classroomMap[lowerClassId]) {
          className = classroomMap[lowerClassId];
          console.log(`✅ Case-insensitive mapped "${classId}" to "${className}"`);
        } else {
          console.log(`❌ No mapping found for "${classId}"`);
        }
      }
      
      return {
        ...student,
        classroom: className
      };
    });
  }, [createClassroomMap]);

  // Fetch students based on user role
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch classrooms first
      console.log("🔄 Step 1: Fetching classrooms...");
      const classroomsData = await fetchClassrooms();
      console.log("✅ Classrooms fetched:", classroomsData?.length || 0);

      console.log(`🔄 Step 2: Fetching students for role: ${currentRole}`);
      let response;
      let rawStudentData = [];

      if (currentRole === "admin") {
        // Admin: Get all students
        response = await api.get("/students");
        console.log("📊 Admin API response received");
        
        if (response.data.success && response.data.data.students) {
          console.log(`📊 Processing ${response.data.data.students.length} students`);
          
          rawStudentData = response.data.data.students.map((student) => {
            const parentName = extractParentName(student);
            
            return {
              id: student.studid,
              student_id: student.studid,
              full_name: student.student_name,
              preferred_name: student.preferred_name || "",
              gender: student.gender?.charAt(0).toUpperCase() + student.gender?.slice(1) || "Not specified",
              date_of_birth: formatDate(student.date_of_birth),
              enrollment_year: getEnrollmentYear(student.mainstream_enrollment_year),
              status: student.status?.charAt(0).toUpperCase() + student.status?.slice(1) || "Unknown",
              // Store the original classroom ID here
              classroom: student.class_grade || student.classroom || student.class_id || "Not assigned",
              parent_name: parentName,
              raw_data: student
            };
          });
        }

      } else if (currentRole === "teacher") {
        // Teacher: Get students from classrooms
        const teacherId = userData?.user_id;
        response = await api.get(`/classroom-teachers/teacher/${teacherId}/classrooms`);
        
        if (response.data.success && response.data.data) {
          const teacherData = response.data.data;
          
          if (teacherData.classrooms && Array.isArray(teacherData.classrooms)) {
            teacherData.classrooms.forEach((classroom) => {
              if (classroom.students && Array.isArray(classroom.students)) {
                classroom.students.forEach((student) => {
                  rawStudentData.push({
                    id: student.student_id || student.id,
                    student_id: student.student_id || student.id,
                    full_name: student.student_name || student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student',
                    preferred_name: student.preferred_name || student.preferred_first_name || "",
                    gender: student.gender?.charAt(0).toUpperCase() + student.gender?.slice(1) || "Not specified",
                    date_of_birth: formatDate(student.date_of_birth),
                    enrollment_year: getEnrollmentYear(student.mainstream_enrollment_year),
                    status: student.status?.charAt(0).toUpperCase() + student.status?.slice(1) || "Unknown",
                    classroom: student.class_grade || student.classroom || student.class_id || "Not assigned",
                    parent_name: extractParentName(student),
                    raw_data: student
                  });
                });
              }
            });
          }
        }

      } else if (currentRole === "parent") {
        // Parent: Get their children
        response = await api.get("/my-enrollments");
        
        if (response.data.success && response.data.data.enrollments) {
          rawStudentData = response.data.data.enrollments.map((enrollment) => {
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
              classroom: student.enrol_class_in_WSTSC || student.class_grade || student.classroom || student.class_id || "Not assigned",
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
        }
      }
      
      console.log(`✅ Step 3: Loaded ${rawStudentData.length} raw students`);
      
      // Now map classroom IDs to names
      console.log("🔄 Step 4: Mapping classroom IDs to names...");
      const mappedStudents = mapStudentsWithClassroomNames(rawStudentData, classroomsData);
      
      console.log("📊 Final student data sample:", mappedStudents[0]);
      
      setStudents(mappedStudents);
      setLastRefreshTime(new Date());
      
    } catch (err) {
      console.error("❌ Error fetching students:", err);
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
    if (currentRole) {
      fetchStudents();
    }
  }, [currentRole]);

  // DataTable initialization for admin
  useEffect(() => {
    if (students.length > 0 && currentRole === "admin") {
      console.log("📊 Initializing DataTable with students:", students);

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
            render: function (data, type, row) {
              // Ensure we're showing the mapped classroom name
              console.log(`📊 DataTable rendering classroom for ${row.full_name}: "${data}"`);
              return data;
            },
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
          console.log("✅ DataTable initialized successfully");
          // Log what's in the table
          const tableData = this.api().rows().data().toArray();
          console.log("📊 DataTable data sample:", tableData.slice(0, 2));
        },
      });

      // View student details
      $("#studentTable").on("click", ".view-btn", function () {
        const studentId = $(this).data("student-id");
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
  }, [students, navigate, currentRole]);

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

  // Get role-specific title and description
  const getRoleSpecificContent = () => {
    switch (currentRole) {
      case "admin":
        return {
          title: "Students Management",
          description: "Manage and view all student information",
          icon: "bi-people",
          emptyTitle: "No Students Found",
          emptyDescription: "No students found in the system."
        };
      case "teacher":
        return {
          title: "My Students",
          description: "View students from your classrooms",
          icon: "bi-person-badge",
          emptyTitle: "No Students Found",
          emptyDescription: "No students are enrolled in your classrooms yet."
        };
      case "parent":
        return {
          title: "My Children",
          description: "View your children's information",
          icon: "bi-people",
          emptyTitle: "No Children Found",
          emptyDescription: "No approved enrollment found for your account."
        };
      default:
        return {
          title: "Students",
          description: "Manage and view student information",
          icon: "bi-people",
          emptyTitle: "No Students Found",
          emptyDescription: "No students found."
        };
    }
  };

  const roleContent = getRoleSpecificContent();

  // Card View for all roles (used for teacher and parent, optional for admin)
  const CardView = () => (
    <div className="container-fluid px-md-4 px-0 py-3">
      {/* Only show header when there are students */}
      {students.length > 0 && (
        <div className="content-header d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="H4-heading fw-bold">{roleContent.title}</h4>
            <p className="text-muted mb-0">
              {roleContent.description}
            </p>
          </div>
          <div className="content-header d-flex align-items-center gap-2">
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
      )}

      {/* Main Content */}
      <Card className="border shadow-sm">
        <Card.Body className="p-4">
          {students.length > 0 ? (
            <>
              {/* Welcome Section */}
              <div className="content-header text-center mb-5">
                <div className="mb-3">
                  <i className={`bi ${roleContent.icon} display-4 text-primary opacity-75`}></i>
                </div>
                <h5 className="fw-semibold mb-2">
                  {roleContent.title} ({students.length})
                </h5>
                <p className="text-muted mb-0">
                  {currentRole === "parent" 
                    ? "You can view your children's information here. Contact the school administration for any updates."
                    : currentRole === "teacher"
                    ? "View and manage students enrolled in your classrooms."
                    : "Manage all student information in the system."
                  }
                </p>
              </div>

              {/* Students Cards Section */}
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
                            <div className="content-header d-flex justify-content-between align-items-start mb-3">
                              <div>
                                <h5 className="fw-bold mb-1">
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
                            <div className="content-header mb-3">
                              <small className="text-muted d-block">
                                Student ID
                              </small>
                              <span className="fw-semibold">
                                {student.student_id}
                              </span>
                            </div>

                            {/* Student Details Grid */}
                            <Row className="g-2 mb-3">
                              <Col sm={6}>
                                <div className="content-header d-flex align-items-center mb-2">
                                  <i className="bi bi-mortarboard-fill text-primary me-2 fs-14px"></i>
                                  <small className="text-muted">Class</small>
                                </div>
                                <span className="fw-semibold d-block">
                                  {student.classroom}
                                </span>
                              </Col>
                              <Col sm={6}>
                                <div className="content-header d-flex align-items-center mb-2">
                                  <i
                                    className={`bi ${getGenderIcon(
                                      student.gender
                                    )} text-primary me-2 fs-14px`}
                                  ></i>
                                  <small className="text-muted">Gender</small>
                                </div>
                                <span className="fw-semibold d-block text-capitalize">
                                  {student.gender || "Not specified"}
                                </span>
                              </Col>
                            </Row>

                            <Row className="g-2 mb-3">
                              <Col sm={6}>
                                <div className="content-header d-flex align-items-center mb-2">
                                  <i className="bi bi-calendar-event text-primary me-2 fs-14px"></i>
                                  <small className="text-muted">
                                    Date of Birth
                                  </small>
                                </div>
                                <span className="fw-semibold d-block">
                                  {student.date_of_birth}
                                </span>
                              </Col>
                              <Col sm={6}>
                                <div className="content-header d-flex align-items-center mb-2">
                                  <i className="bi bi-calendar-check text-primary me-2 fs-14px"></i>
                                  <small className="text-muted">
                                    Enrollment Year
                                  </small>
                                </div>
                                <span className="fw-semibold d-block">
                                  {student.enrollment_year}
                                </span>
                              </Col>
                            </Row>

                            {/* Parent Information (show for admin and teacher) */}
                            {(currentRole === "admin" || currentRole === "teacher") && (
                              <div className="mb-4">
                                <div className="content-header d-flex align-items-center mb-2">
                                  <i className="bi bi-person-badge text-primary me-2 fs-14px"></i>
                                  <small className="text-muted">Parent</small>
                                </div>
                                <span className="fw-semibold d-block">
                                  {parentName}
                                </span>
                              </div>
                            )}

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
            </>
          ) : (
            /* Empty State - Removed "Last updated" time */
            <div className="content-header text-center py-5">
              <div className="mb-4">
                <i className="bi bi-person-x display-4 text-muted opacity-50"></i>
              </div>
              <h6 className="fw-semibold mb-2">
                No Students Found
              </h6>
              <p className="text-muted mb-4">
                No students are enrolled in your classrooms yet.
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

  // Loading state
  if (loading) {
    return <Loader />;
  }

  // Show card view for teacher and parent roles
  if (currentRole === "teacher" || currentRole === "parent") {
    return <CardView />;
  }

  // Admin view with DataTable
  return (
    <div className="container-fluid px-md-4 px-0 py-3">
      <div className="content-header d-flex flex-md-row flex-column justify-content-between align-items-center mb-4">
        <div className="text-center text-md-start">
          <h4 className="H4-heading fw-bold">{roleContent.title}</h4>
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
              <p className="text-muted">{roleContent.emptyDescription}</p>
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