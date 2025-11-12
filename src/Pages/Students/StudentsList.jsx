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

  // Filter students for parent - only show their own children
  const filterStudentsForParent = (studentsData) => {
    if (userRole !== "parent" || !userData) return studentsData;

    return studentsData.filter((student) => {
      // Check if any parent carer matches the logged-in parent's email
      return student.parent_carers?.some(
        (parent) => parent.email === userData.email
      );
    });
  };

  // Fetch detailed student information
  const fetchStudentDetails = async (studentId) => {
    try {
      console.log(`Fetching details for student ${studentId}...`);
      const response = await api.get(`/class-students/student/${studentId}/details`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data?.message || "Failed to fetch student details");
      }
    } catch (err) {
      console.error(`Error fetching details for student ${studentId}:`, err);
      return null;
    }
  };

  // Fetch students from API
  const fetchStudents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log("Fetching students from API...");

      // Make API call to get all students
      const response = await api.get("/class-students");

      console.log("API Response:", response.data);

      if (response.data && response.data.success) {
        // Extract class_students array from the response
        const classStudents = response.data.data?.class_students || [];

        console.log("Raw class students data:", classStudents);

        // First, create basic student data
        const basicStudentsData = classStudents.map((cs) => {
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

        // Filter students for parent role
        const filteredStudents = filterStudentsForParent(basicStudentsData);

        // Fetch detailed information for each student
        console.log("Fetching detailed student information...");
        const detailedStudents = await Promise.all(
          filteredStudents.map(async (student) => {
            const studentDetails = await fetchStudentDetails(student.id);
            
            if (studentDetails) {
              // Merge basic data with detailed data
              return {
                ...student,
                // Override with detailed information if available
                gender: studentDetails.student?.gender || student.gender,
                date_of_birth: studentDetails.student?.date_of_birth || student.date_of_birth,
                status: studentDetails.student?.status === "approved" ? "Active" : 
                       studentDetails.student?.status === "pending" ? "Pending" : 
                       studentDetails.student?.status === "rejected" ? "Inactive" : student.status,
                // Add parent information if available in detailed response
                parent_carers: studentDetails.parent_carers || student.parent_carers,
                // Store the complete detailed data
                detailed_data: studentDetails,
              };
            }
            
            return student;
          })
        );

        console.log("Detailed students data:", detailedStudents);

        // Format students data for the table
        const formattedStudents = detailedStudents.map((student, index) => {
          const firstParent =
            student.parent_carers && student.parent_carers.length > 0
              ? student.parent_carers[0]
              : {};

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
            parent_name: firstParent.first_name
              ? `${firstParent.first_name} ${firstParent.last_name}`
              : "N/A",
            raw_data: student,
            detailed_data: student.detailed_data,
          };
        });

        console.log("Formatted students:", formattedStudents);
        setStudents(formattedStudents);
        setLastRefreshTime(new Date());
      } else {
        throw new Error(response.data?.message || "Failed to fetch students");
      }
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
    fetchStudents();
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

      // View student details - FIXED EVENT LISTENER
      $("#studentTable").on("click", ".view-btn", function () {
        const studentId = $(this).data("student-id");
        console.log("View button clicked for student:", studentId);
        const student = students.find((s) => s.id === studentId);
        if (student) {
          navigate(`/students/${studentId}`, {
            state: { 
              studentData: student.raw_data,
              detailedData: student.detailed_data 
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

  const handleAddStudent = () => {
    // Navigate to add student page
    navigate("/students/add");
  };

  // Show restricted access message for parents/teachers
  if (isRestrictedUser) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="H4-heading fw-bold">Students</h4>
          </div>
        </div>

        <Card className="mt-4">
          <Card.Body className="text-center py-5">
            <div className="mb-4">
              <i className="bi bi-people display-4 text-primary"></i>
            </div>
            <p className="text-muted mb-4">
              {userRole === "parent"
                ? "You can view your children's information here. Contact the school administration for any updates."
                : "Teacher access to student management is limited. Please contact administration for full access."}
            </p>
            {userRole === "parent" && students.length > 0 && (
              <div className="mt-4">
                <h5>Your Children</h5>
                <div className="row justify-content-center">
                  {students.map((student) => (
                    <div key={student.id} className="col-md-6 col-lg-4 mb-3">
                      <Card>
                        <Card.Body>
                          <h6>{student.full_name}</h6>
                          <p className="mb-1">Class: {student.classroom}</p>
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
                                  detailedData: student.detailed_data 
                                },
                              })
                            }
                          >
                            View Details
                          </Button>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {userRole === "parent" && students.length === 0 && (
              <div className="mt-4">
                <p className="text-muted">
                  No children found associated with your account.
                </p>
                <Button variant="outline-primary" onClick={handleRefresh}>
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
        <Spinner animation="border" role="status">
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
              <ButtonGlobal
                onClick={handleAddStudent}
                text="Add First Student"
                className="btn btn-primary"
              />
            </div>
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="mb-0">Showing {students.length} students</p>
              </div>
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