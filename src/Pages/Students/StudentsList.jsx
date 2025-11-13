import React, { useEffect, useState } from "react";
import "../../assets/Styles/Style.css";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import "datatables.net-responsive-dt";
import "datatables.net";
import {
  Breadcrumb,
  Spinner,
  Alert,
  OverlayTrigger,
  Tooltip,
  Figure,
  Card,
  Button,
  Row,
  Col,
  Badge,
} from "react-bootstrap";

import ButtonGlobal from "../../Components/Button";
import { useNavigate } from "react-router-dom";
import api from "../../config/axiosConfig";

import { getCookie, formatDateToMMDDYYYY } from "../../config/utils";

const StudentsList = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const [detailedStudentsData, setDetailedStudentsData] = useState({});
  const navigate = useNavigate();

  // Get user data from localStorage on component mount
  useEffect(() => {
    const userDataFromStorage = localStorage.getItem("userData");
    if (userDataFromStorage) {
      try {
        const parsedUserData = JSON.parse(userDataFromStorage);
        setUserData(parsedUserData);
        setUserRole(parsedUserData.role?.role_name);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Check if user is parent or teacher
  const isRestrictedUser = userRole === "parent" || userRole === "teacher";

  // Fetch detailed student information (for admin role)
  const fetchStudentDetails = async (studentId) => {
    try {
      console.log(`Fetching details for student ${studentId}...`);
      const response = await api.get(
        `/class-students/student/${studentId}/details`
      );

      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(
          response.data?.message || "Failed to fetch student details"
        );
      }
    } catch (err) {
      console.error(`Error fetching details for student ${studentId}:`, err);
      return null;
    }
  };

  // Fetch students based on user role
  const fetchStudents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log("Fetching students from API...");
      console.log("User Role:", userRole);

      let response;

      if (userRole === "parent") {
        // Use my-enrollments API for parent role
        console.log("Using my-enrollments API for parent");
        response = await api.get("/my-enrollments");

        console.log("Parent API Response:", response.data);

        if (response.data && response.data.success) {
          // Check if enrollments array exists in response
          const enrollments = response.data.data?.enrollments || [];

          console.log("Enrollments found:", enrollments.length);

          if (enrollments.length > 0) {
            // Filter only approved enrollments and map to student format
            const approvedStudents = enrollments
              .filter((enrollment) => {
                const student = enrollment.student || {};
                console.log(
                  `Student ${student.enrollment_id} status:`,
                  student.status
                );
                return student.status === "approved";
              })
              .map((enrollment, index) => {
                const student = enrollment.student || {};
                const classroomInfo = student.classroom_info || {};

                console.log(`Processing approved student:`, student);

                // Format student data for parent view
                return {
                  id: student.enrollment_id,
                  student_id: `STU${String(student.enrollment_id).padStart(
                    4,
                    "0"
                  )}`,
                  first_given_name: student.first_given_name || "",
                  family_name: student.family_name || "",
                  preferred_first_name: student.preferred_first_name || "",
                  gender: student.gender || "Unknown",
                  date_of_birth: student.date_of_birth || "",
                  mainstream_enrollment_year:
                    student.mainstream_enrollment_year || "",
                  status: "Active", // Only approved students for parent
                  classroom:
                    classroomInfo.class_name ||
                    student.enrol_class_in_WSTSC ||
                    "N/A",
                  parent_carers: enrollment.parent_carer_1
                    ? [enrollment.parent_carer_1]
                    : [],
                  raw_data: enrollment,
                  detailed_data: enrollment,
                };
              });

            console.log("Approved students:", approvedStudents);

            // Create the formatted array for table
            const formattedStudents = approvedStudents.map((student, index) => {
              const parentCarer =
                student.parent_carers.length > 0
                  ? student.parent_carers[0]
                  : {};
              let parentName = "N/A";

              if (parentCarer.first_name && parentCarer.last_name) {
                parentName = `${parentCarer.first_name} ${parentCarer.last_name}`;
              } else if (parentCarer.full_name) {
                parentName = parentCarer.full_name;
              } else if (parentCarer.name) {
                parentName = parentCarer.name;
              }

              return {
                index: index + 1,
                id: student.id,
                student_id: student.student_id,
                full_name: `${student.first_given_name || ""} ${
                  student.family_name || ""
                }`.trim(),
                preferred_name: student.preferred_first_name || "",
                gender: student.gender || "",
                date_of_birth: formatDateToMMDDYYYY(student.date_of_birth),
                enrollment_year: student.mainstream_enrollment_year || "",
                status: student.status,
                classroom: student.classroom,
                parent_name: parentName,
                raw_data: student.raw_data,
                detailed_data: student.detailed_data,
              };
            });

            console.log("Formatted parent students:", formattedStudents);
            setStudents(formattedStudents);
          } else {
            // No enrollments found or no approved enrollments
            console.log("No enrollments found or no approved enrollments");
            setStudents([]);
          }
        } else {
          throw new Error(
            response.data?.message || "Failed to fetch enrollment data"
          );
        }
      } else {
        // Use class-students API for admin and other roles
        console.log("Using class-students API for admin/other roles");
        response = await api.get("/class-students");

        if (response.data && response.data.success) {
          // Extract class_students array from the response
          const classStudents = response.data.data?.class_students || [];

          console.log("Raw class students data:", classStudents);

          // Create basic student data
          const basicStudentsData = classStudents.map((cs, index) => {
            const student = cs.student || {};
            const classroom = cs.classroom || {};

            return {
              id: student.enrollment_id || cs.student_id,
              student_id: `STU${String(
                student.enrollment_id || cs.student_id
              ).padStart(4, "0")}`,
              first_given_name: student.first_given_name || "",
              family_name: student.family_name || "",
              preferred_first_name: student.preferred_first_name || "",
              gender: student.gender || "Unknown",
              date_of_birth: student.date_of_birth || "",
              mainstream_enrollment_year: cs.enr_year || "",
              status: cs.is_active ? "Active" : "Inactive",
              classroom: classroom.class_name || "N/A",
              parent_carers: student.parent_carers || [],
              raw_class_student: cs,
            };
          });

          console.log("Basic students data:", basicStudentsData);

          // Fetch detailed information for each student
          console.log("Fetching detailed student information...");
          const detailedStudents = await Promise.all(
            basicStudentsData.map(async (student) => {
              try {
                const studentDetails = await fetchStudentDetails(student.id);

                if (studentDetails) {
                  // Merge basic data with detailed data
                  return {
                    ...student,
                    // Override with detailed information if available
                    gender: studentDetails.student?.gender || student.gender,
                    date_of_birth:
                      studentDetails.student?.date_of_birth ||
                      student.date_of_birth,
                    status:
                      studentDetails.student?.status === "approved"
                        ? "Active"
                        : studentDetails.student?.status === "pending"
                        ? "Pending"
                        : studentDetails.student?.status === "rejected"
                        ? "Inactive"
                        : student.status,
                    // Add parent information if available in detailed response
                    parent_carers:
                      studentDetails.parent_carers || student.parent_carers,
                    // Store the complete detailed data
                    detailed_data: studentDetails,
                  };
                }
              } catch (err) {
                console.error(
                  `Error fetching details for student ${student.id}:`,
                  err
                );
              }

              return student;
            })
          );

          console.log("Detailed students data:", detailedStudents);

          // Format students data for the table
          const formattedStudents = detailedStudents.map((student, index) => {
            // Get parent carers from detailed_data if available, otherwise use parent_carers
            const parentCarers =
              student.detailed_data?.parents_carers ||
              student.detailed_data?.parent_carers ||
              student.parent_carers ||
              [];

            console.log(`Student ${student.id} parentCarers:`, parentCarers);

            const firstParent = parentCarers.length > 0 ? parentCarers[0] : {};

            // Comprehensive parent name extraction
            let parentName = "N/A";

            if (firstParent) {
              // Try different possible name field combinations
              if (firstParent.first_name && firstParent.last_name) {
                parentName = `${firstParent.first_name} ${firstParent.last_name}`;
              } else if (firstParent.full_name) {
                parentName = firstParent.full_name;
              } else if (firstParent.name) {
                parentName = firstParent.name;
              } else if (firstParent.first_name) {
                parentName = firstParent.first_name;
              } else if (firstParent.last_name) {
                parentName = firstParent.last_name;
              }

              // If we found a parent but couldn't extract name, mark as "Parent"
              if (parentName === "N/A" && Object.keys(firstParent).length > 0) {
                parentName = "Parent";
              }
            }

            return {
              index: index + 1,
              id: student.id,
              student_id: student.student_id,
              full_name: `${student.first_given_name || ""} ${
                student.family_name || ""
              }`.trim(),
              preferred_name: student.preferred_first_name || "",
              gender: student.gender || "",
              date_of_birth: formatDateToMMDDYYYY(student.date_of_birth),
              enrollment_year: student.mainstream_enrollment_year || "",
              status: student.status || "Unknown",
              classroom: student.classroom || "N/A",
              parent_name: parentName,
              raw_data: student,
              detailed_data: student.detailed_data,
            };
          });

          console.log("Formatted students:", formattedStudents);
          setStudents(formattedStudents);
        } else {
          throw new Error(response.data?.message || "Failed to fetch students");
        }
      }

      setLastRefreshTime(new Date());
    } catch (err) {
      console.error("Fetch error:", err);

      // Handle different error scenarios
      if (err.response) {
        // Server responded with error status
        setError(err.response.data?.message || `Error: ${err.response.status}`);
      } else if (err.request) {
        // Request was made but no response received
        setError("Network error: Unable to connect to server");
      } else {
        // Other errors
        setError(err.message || "Failed to load students data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (userRole) {
      fetchStudents();
    }
  }, [userRole, userData]);

  useEffect(() => {
    if (!loading && students.length > 0 && !isRestrictedUser) {
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
            data: "index",
            className: "text-center",
            width: "50px",
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
                data === "Active"
                  ? "badge bg-success"
                  : data === "Pending"
                  ? "badge bg-warning"
                  : data === "Inactive"
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
              detailedData: student.detailed_data,
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
  }, [students, loading, navigate, isRestrictedUser]);

  const handleRefresh = () => {
    fetchStudents(true);
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
    switch (status) {
      case "Active":
        return "success";
      case "Pending":
        return "warning";
      case "Inactive":
        return "secondary";
      default:
        return "info";
    }
  };

  // Show restricted access message for parents/teachers
  if (isRestrictedUser) {
    return (
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
                  {students.map((student) => {
                    const parentCarer = student.raw_data?.parent_carer_1 || {};
                    const parentName = `${parentCarer.first_name || ""} ${
                      parentCarer.last_name || ""
                    }`.trim();

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
                                      detailedData: student.detailed_data,
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
  }

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <Spinner animation="border" role="status" variant="primary">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Students Management</h4>
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
            <ButtonGlobal onClick={handleRefresh} text="Retry" />
          </div>
        </Alert>
      )}

      {!error && (
        <div className="card mt-1 p-3 rounded-3 shadow">
          {students.length === 0 ? (
            <div className="text-center py-4">
              <i className="bi bi-people display-4 text-muted mb-3"></i>
              <p className="text-muted">No students found.</p>
            </div>
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="mb-0">Showing {students.length} students</p>
              </div>
              {userRole === "parent" ? (
                // Parent view with cards
                <div className="row">
                  {students.map((student) => {
                    const parentCarer = student.raw_data?.parent_carer_1 || {};
                    const parentName = `${parentCarer.first_name || ""} ${
                      parentCarer.last_name || ""
                    }`.trim();

                    return (
                      <div key={student.id} className="col-md-6 col-lg-4 mb-3">
                        <Card>
                          <Card.Body>
                            <h6>{student.full_name}</h6>
                            {student.preferred_name && (
                              <p className="mb-1 text-muted">
                                Preferred: {student.preferred_name}
                              </p>
                            )}
                            <p className="mb-1">
                              Student ID: {student.student_id}
                            </p>
                            <p className="mb-1">Class: {student.classroom}</p>
                            <p className="mb-1">Gender: {student.gender}</p>
                            <p className="mb-1">
                              Date of Birth: {student.date_of_birth}
                            </p>
                            <p className="mb-1">
                              Enrollment Year: {student.enrollment_year}
                            </p>
                            <p className="mb-1">Parent: {parentName}</p>
                            <p className="mb-1">
                              Status:{" "}
                              <span
                                className={`badge ${
                                  student.status === "Active"
                                    ? "bg-success"
                                    : student.status === "Pending"
                                    ? "bg-warning"
                                    : "bg-secondary"
                                }`}
                              >
                                {student.status}
                              </span>
                            </p>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() =>
                                navigate(`/students/${student.id}`, {
                                  state: {
                                    studentData: student.raw_data,
                                    detailedData: student.detailed_data,
                                  },
                                })
                              }
                            >
                              View Details
                            </Button>
                          </Card.Body>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Admin view with DataTable
                <table
                  id="studentTable"
                  className="table table-striped table-hover custom-data-table w-100"
                ></table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentsList;
