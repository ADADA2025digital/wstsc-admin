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
      // Check if parent_carer_1 or parent_carer_2 email matches logged-in parent's email
      return (
        student.parent_carer_1?.email === userData.email ||
        student.parent_carer_2?.email === userData.email
      );
    });
  };

  // Fetch enrollments from API with pagination support
  const fetchStudents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log("Fetching enrollments from API...");

      let allEnrollments = [];
      let currentPage = 1;
      let lastPage = 1;

      // Fetch first page to get pagination info
      const firstResponse = await api.get("/my-enrollments");
      console.log("First page API Response:", firstResponse.data);

      // Extract data based on the new API structure
      let enrollmentsData = [];
      let paginationInfo = null;

      if (firstResponse.data && firstResponse.data.data) {
        // New API structure
        const responseData = firstResponse.data.data;

        if (
          responseData.enrollments &&
          Array.isArray(responseData.enrollments)
        ) {
          enrollmentsData = responseData.enrollments;
        }

        if (responseData.pagination) {
          paginationInfo = responseData.pagination;
          lastPage = responseData.pagination.last_page || 1;
        }
      }

      console.log("First page enrollments data:", enrollmentsData);
      console.log("Pagination info:", paginationInfo);
      console.log("Total pages:", lastPage);

      allEnrollments = [...enrollmentsData];

      // Fetch remaining pages if any
      if (lastPage > 1) {
        console.log(`Fetching additional ${lastPage - 1} pages...`);

        const pagePromises = [];
        for (let page = 2; page <= lastPage; page++) {
          pagePromises.push(api.get(`/my-enrollments?page=${page}`));
        }

        const responses = await Promise.all(pagePromises);

        responses.forEach((response, index) => {
          console.log(`Processing page ${index + 2} response:`, response.data);

          let pageData = [];
          if (
            response.data &&
            response.data.data &&
            response.data.data.enrollments
          ) {
            pageData = response.data.data.enrollments;
          }

          if (pageData.length > 0) {
            allEnrollments = [...allEnrollments, ...pageData];
            console.log(
              `Added ${pageData.length} enrollments from page ${index + 2}`
            );
          }
        });
      }

      console.log("All enrollments data after pagination:", allEnrollments);
      console.log("Total enrollments fetched:", allEnrollments.length);

      if (allEnrollments.length === 0) {
        setStudents([]);
        setLastRefreshTime(new Date());
        return;
      }

      // Filter enrollments for parent role
      const filteredEnrollments = filterStudentsForParent(allEnrollments);

      // Format enrollments data for the table
      const formattedStudents = filteredEnrollments.map((enrollment, index) => {
        const student = enrollment.student || {};
        const parent1 = enrollment.parent_carer_1 || {};
        const parent2 = enrollment.parent_carer_2 || {};

        // Determine which parent to use for contact info
        const primaryParent = parent1.first_name ? parent1 : parent2;

        // Get contact email - check both parents
        const contactEmail = parent1.email || parent2.email || "N/A";

        // Get contact phone - check both parents
        const contactPhone =
          parent1.mobile_phone || parent2.mobile_phone || "N/A";

        // Format parent name
        const parentName = primaryParent.first_name
          ? `${primaryParent.first_name} ${primaryParent.last_name}`
          : "N/A";

        return {
          index: index + 1,
          id: student.enrollment_id || `enrollment-${index + 1}`,
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
          parent_name: parentName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          status: student.status || "pending",
          raw_data: enrollment, // Store the entire enrollment object
        };
      });

      console.log("Total formatted students:", formattedStudents.length);
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
        setError("Enrollments endpoint not found. Please check the API URL.");
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
            "Failed to fetch enrollments"
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
            title: "Status",
            data: "status",
            className: "text-center",
            width: "100px",
            render: function (data, type, row) {
              let badgeClass = "badge ";
              switch (data) {
                case "approved":
                  badgeClass += "bg-success";
                  break;
                case "rejected":
                  badgeClass += "bg-danger";
                  break;
                case "pending":
                  badgeClass += "bg-warning";
                  break;
                default:
                  badgeClass += "bg-secondary";
              }
              return `<span class="${badgeClass}">${data}</span>`;
            },
          },
          {
            title: "Action",
            className: "text-center",
            width: "80px",
            data: null,
            orderable: false,
            render: function (data, type, row) {
              return `
                <button class="btn btn-outline-primary btn-sm view-btn" data-student-id="${row.id}" title="View Details" style="border: 1px solid #0d6efd; background: transparent; padding: 4px 8px; border-radius: 4px;">
                  <i class="bi bi-eye" style="font-size: 16px; color: #0d6efd;"></i>
                </button>
              `;
            },
          },
        ],
        responsive: false,
        scrollX: true,
        language: {
          emptyTable: "No enrollments found",
          search: "Search enrollments:",
        },
        order: [[0, "asc"]],
        pageLength: 10,
        lengthMenu: [10, 25, 50, 100],
        initComplete: function () {
          console.log("DataTable initialized successfully");
        },
      });

      // Corrected click event - using .view-btn instead of .view-icon
      $("#studentTable").on("click", ".view-btn", function () {
        const studentId = $(this).data("student-id");
        console.log("View button clicked for enrollment:", studentId);
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
          <h4 className="H4-heading fw-bold">Enrolments</h4>
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
          <Alert.Heading>Error Loading Enrollments</Alert.Heading>
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
              <p className="text-muted">No enrollments found.</p>
              <ButtonGlobal onClick={handleRefresh} text="Refresh" />
            </div>
          ) : (
            <div>
              <p className="mb-3">Showing {students.length} enrollments</p>
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
