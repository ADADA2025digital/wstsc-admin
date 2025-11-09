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

const EnrolStudents = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
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

  // Fetch students from API
  const fetchStudents = async (isRefresh = false) => {
    // If user is parent/teacher, don't fetch all students
    if (isRestrictedUser) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log("Fetching students from API...");

      const response = await api.get("/student-enrollment");
      console.log("API Response:", response.data);

      // Extract data from the response structure - CORRECTED CODE
      let studentsData = [];

      if (
        response.data &&
        response.data.students &&
        response.data.students.data &&
        Array.isArray(response.data.students.data)
      ) {
        studentsData = response.data.students.data;
      } else if (
        response.data &&
        response.data.students &&
        Array.isArray(response.data.students)
      ) {
        studentsData = response.data.students;
      } else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        studentsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        studentsData = response.data;
      } else {
        console.warn("Unexpected API response structure:", response.data);
        setError("Unexpected data format received from server");
        return;
      }

      console.log("Extracted students data:", studentsData);

      if (studentsData.length === 0) {
        setStudents([]);
        setLastRefreshTime(new Date());
        return;
      }

      // Filter students for parent role
      const filteredStudents = filterStudentsForParent(studentsData);

      // Format students data for the table
      const formattedStudents = filteredStudents.map((student, index) => {
        const firstParent =
          student.parent_carers && student.parent_carers.length > 0
            ? student.parent_carers[0]
            : {};

        // For this API structure, contact details come from parent_carers
        const contactEmail = firstParent.email || "N/A";
        const contactPhone = firstParent.mobile_phone || "N/A";

        return {
          index: index + 1,
          id: student.enrollment_id || `student-${index + 1}`,
          student_id: `STU${(student.enrollment_id || index + 1)
            .toString()
            .padStart(4, "0")}`,
          full_name: `${student.first_given_name || ""} ${
            student.family_name || ""
          }`.trim(),
          preferred_name: student.preferred_first_name || "",
          gender: student.gender || "",
          date_of_birth: formatDateToMMDDYYYY(student.date_of_birth),
          enrollment_year: student.mainstream_enrollment_year || "",
          overseas_student: student.overseas_student || "No",
          parent_name: firstParent.first_name
            ? `${firstParent.first_name} ${firstParent.last_name}`
            : "N/A",
          contact_email: contactEmail,
          contact_phone: contactPhone,
          raw_data: student,
        };
      });

      console.log("Formatted students:", formattedStudents);
      setStudents(formattedStudents);
      setLastRefreshTime(new Date());
    } catch (err) {
      console.error("Fetch error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack,
      });

      if (err.response?.status === 401) {
        setError("Authentication required. Please check if you need to login.");
      } else if (err.response?.status === 404) {
        setError("Students endpoint not found. Please check the API URL.");
      } else if (
        err.code === "NETWORK_ERROR" ||
        err.message.includes("Network Error")
      ) {
        setError(
          "Network error. Please check if the backend server is running."
        );
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch students"
        );
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
            title: "ID",
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
            title: "Enrollment Year",
            data: "enrollment_year",
            className: "text-center",
          },
          {
            title: "Parent Name",
            data: "parent_name",
          },
          {
            title: "Contact Email",
            data: "contact_email",
          },
          {
            title: "Action",
            className: "text-center",
            width: "80px",
            data: null,
            orderable: false,
            render: function (data, type, row) {
              return `
      <button className="btn btn-outline-primary btn-sm view-btn" data-student-id="${row.id}" title="View Details">
        <i className="bi bi-eye"></i>
      </button>
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

      $("#studentTable").on("click", ".view-icon", function () {
        const studentId = $(this).data("student-id");
        console.log("View button clicked for student:", studentId);
        const student = students.find((s) => s.id === studentId);
        if (student) {
          navigate(`/enrolment/${studentId}`, {
            state: { studentData: student.raw_data },
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
    navigate("/students/add");
  };

  // Show restricted access message for parents/teachers
  if (isRestrictedUser) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="H4-heading fw-bold">Student Enrollment</h4>
          </div>
        </div>

        <Card className="mt-4">
          <Card.Body className="text-center py-5">
            <div className="mb-4">
              <i className="bi bi-info-circle display-4 text-primary"></i>
            </div>
            <p className="text-muted mb-4">
              {userRole === "parent"
                ? "You haven't submitted any enrollment applications yet. Start by submitting a new enrollment form for your child."
                : "Teacher access to student enrollment is limited. Please contact administration for full access."}
            </p>
            {userRole === "parent" && (
              <button
                className="btn btn-outline-primary"
                onClick={() => navigate("/enrol")}
              >
                Student Enrollment
              </button>
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
          <h4 className="H4-heading fw-bold">Student Enrolments</h4>
        </div>

        <div className="d-flex align-items-center gap-3">
          {lastRefreshTime && (
            <p className="mb-0 ">
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </p>
          )}
          <div className="d-flex align-items-center gap-2">
            <ButtonGlobal
              onClick={handleRefresh}
              className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
              disabled={refreshing}
              style={{
                opacity: refreshing ? 0.7 : 1,
              }}
            >
              <i
                className={`bi bi-arrow-clockwise ${refreshing ? "spin" : ""}`}
              />
            </ButtonGlobal>
          </div>
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
              <p className="text-muted">No students found.</p>
              <ButtonGlobal onClick={handleRefresh} text="Refresh" />
            </div>
          ) : (
            <div>
              <p className="mb-3">Showing {students.length} students</p>
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

export default EnrolStudents;