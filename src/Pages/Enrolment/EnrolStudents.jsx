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

  // Fetch enrollments from appropriate API based on user role
  const fetchStudents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log("Fetching enrollments from API...");
      console.log("User role:", userRole);

      let allEnrollments = [];
      let currentPage = 1;
      let lastPage = 1;

      if (userRole === "admin") {
        // Admin uses the student-enrollment endpoint
        console.log("Admin: Using student-enrollment endpoint");

        const firstResponse = await api.get("/student-enrollment");
        console.log("Admin API Response:", firstResponse.data);

        // Extract data based on the admin API structure
        if (firstResponse.data && firstResponse.data.students) {
          const studentsData = firstResponse.data.students;

          if (studentsData.data && Array.isArray(studentsData.data)) {
            // Data is nested in students.data array
            allEnrollments = studentsData.data;
            console.log(
              "Admin enrollments data from students.data:",
              allEnrollments
            );

            // Handle pagination for admin if needed
            if (studentsData.last_page && studentsData.last_page > 1) {
              lastPage = studentsData.last_page;
              console.log(`Admin has ${lastPage} pages to fetch`);

              // Fetch remaining pages
              const pagePromises = [];
              for (let page = 2; page <= lastPage; page++) {
                pagePromises.push(api.get(`/student-enrollment?page=${page}`));
              }

              if (pagePromises.length > 0) {
                const responses = await Promise.all(pagePromises);
                responses.forEach((response, index) => {
                  if (
                    response.data &&
                    response.data.students &&
                    response.data.students.data
                  ) {
                    allEnrollments = [
                      ...allEnrollments,
                      ...response.data.students.data,
                    ];
                    console.log(
                      `Added ${
                        response.data.students.data.length
                      } enrollments from admin page ${index + 2}`
                    );
                  }
                });
              }
            }
          } else if (Array.isArray(studentsData)) {
            // Direct array response
            allEnrollments = studentsData;
            console.log("Admin enrollments data direct array:", allEnrollments);
          }
        } else if (firstResponse.data && Array.isArray(firstResponse.data)) {
          // Direct array response at root level
          allEnrollments = firstResponse.data;
          console.log("Admin enrollments data root array:", allEnrollments);
        }

        console.log("Final admin enrollments:", allEnrollments);
      } else {
        // Parent/teacher uses the my-enrollments endpoint with pagination
        console.log("Parent/Teacher: Using my-enrollments endpoint");

        // Fetch first page to get pagination info
        const firstResponse = await api.get("/my-enrollments");
        console.log("First page API Response:", firstResponse.data);

        // Extract data based on the API structure
        let enrollmentsData = [];
        let paginationInfo = null;

        if (firstResponse.data && firstResponse.data.data) {
          // API structure with data wrapper
          const responseData = firstResponse.data.data;

          if (
            responseData.enrollments &&
            Array.isArray(responseData.enrollments)
          ) {
            enrollmentsData = responseData.enrollments;
          } else if (Array.isArray(responseData)) {
            // Direct array in data
            enrollmentsData = responseData;
          }

          if (responseData.pagination) {
            paginationInfo = responseData.pagination;
            lastPage = responseData.pagination.last_page || 1;
          }
        } else if (
          firstResponse.data &&
          Array.isArray(firstResponse.data.enrollments)
        ) {
          // Alternative structure
          enrollmentsData = firstResponse.data.enrollments;
          if (firstResponse.data.pagination) {
            paginationInfo = firstResponse.data.pagination;
            lastPage = firstResponse.data.pagination.last_page || 1;
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
            console.log(
              `Processing page ${index + 2} response:`,
              response.data
            );

            let pageData = [];
            if (
              response.data &&
              response.data.data &&
              response.data.data.enrollments
            ) {
              pageData = response.data.data.enrollments;
            } else if (response.data && response.data.enrollments) {
              pageData = response.data.enrollments;
            }

            if (pageData.length > 0) {
              allEnrollments = [...allEnrollments, ...pageData];
              console.log(
                `Added ${pageData.length} enrollments from page ${index + 2}`
              );
            }
          });
        }
      }

      console.log("All enrollments data after processing:", allEnrollments);
      console.log("Total enrollments fetched:", allEnrollments.length);

      if (allEnrollments.length === 0) {
        setStudents([]);
        setLastRefreshTime(new Date());
        return;
      }

      // Format enrollments data for the table
      const formattedStudents = allEnrollments.map((enrollment, index) => {
        // Handle different API response structures
        const student =
          userRole === "admin" ? enrollment : enrollment.student || {};

        let parentName = "N/A";
        let contactEmail = "N/A";
        let contactPhone = "N/A";

        if (userRole === "admin") {
          // Admin API structure - data is in parent_carers array
          const parentCarers = enrollment.parent_carers || [];
          console.log(
            "Admin - Parent carers array:",
            enrollment.enrollment_id,
            parentCarers
          );

          if (parentCarers.length > 0) {
            const primaryParent = parentCarers[0];

            parentName = primaryParent.first_name
              ? `${primaryParent.first_name} ${
                  primaryParent.last_name || ""
                }`.trim()
              : "N/A";

            contactEmail = primaryParent.email || "N/A";
            contactPhone = primaryParent.mobile_phone || "N/A";

            // Fallback to second parent if needed
            if (
              parentCarers.length > 1 &&
              (contactEmail === "N/A" || contactPhone === "N/A")
            ) {
              const secondaryParent = parentCarers[1];
              if (contactEmail === "N/A" && secondaryParent.email) {
                contactEmail = secondaryParent.email;
              }
              if (contactPhone === "N/A" && secondaryParent.mobile_phone) {
                contactPhone = secondaryParent.mobile_phone;
              }
            }
          }
        } else {
          // Parent API structure - data is in parent_carer_1 and parent_carer_2 objects
          const parent1 = enrollment.parent_carer_1 || {};
          const parent2 = enrollment.parent_carer_2 || {};

          console.log("Parent - Parent data:", enrollment.enrollment_id, {
            parent1,
            parent2,
          });

          // Use parent_carer_1 as primary, fallback to parent_carer_2
          const primaryParent = parent1.first_name ? parent1 : parent2;

          parentName = primaryParent.first_name
            ? `${primaryParent.first_name} ${
                primaryParent.last_name || ""
              }`.trim()
            : "N/A";

          contactEmail = parent1.email || parent2.email || "N/A";
          contactPhone = parent1.mobile_phone || parent2.mobile_phone || "N/A";
        }

        // Handle different ID fields based on API structure and role
        const enrollmentId =
          enrollment.enrollment_id ||
          enrollment.id ||
          `enrollment-${index + 1}`;

        return {
          index: index + 1,
          id: enrollmentId,
          full_name: `${student.first_given_name || student.first_name || ""} ${
            student.family_name || student.last_name || ""
          }`.trim(),
          gender: student.gender || "",
          date_of_birth: formatDateToMMDDYYYY(student.date_of_birth),
          enrollment_year:
            student.mainstream_enrollment_year || student.enrollment_year || "",
          overseas_student: student.overseas_student || "No",
          parent_name: parentName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          status: student.status || enrollment.status || "pending",
          raw_data: enrollment,
        };
      });
      console.log("Total formatted students:", formattedStudents.length);
      console.log("Formatted students data:", formattedStudents);
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
    if (userRole) {
      fetchStudents();
    }
  }, [userRole, userData]);

  useEffect(() => {
    if (!loading && students.length > 0) {
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
            title: "Full Name",
            data: "full_name",
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
            title: "Contact Phone",
            data: "contact_phone",
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
              return `<span className="${badgeClass}">${data}</span>`;
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
                <button className="btn btn-outline-primary btn-sm view-btn" data-student-id="${row.id}" title="View Details" style="border: 1px solid #0d6efd; background: transparent; padding: 4px 8px; border-radius: 4px;">
                  <i className="bi bi-eye" style="font-size: 16px; color: #0d6efd;"></i>
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
  }, [students, loading, navigate]);

  const handleRefresh = () => {
    fetchStudents(true);
  };

  const handleAddStudent = () => {
    navigate("/students/add");
  };

  const handleEnrolStudent = () => {
    navigate("/enrol");
  };

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
          {userRole === "parent" && (
            <p className="text-muted mb-0">
              Your submitted enrollment applications
            </p>
          )}
        </div>

        <div className="d-flex align-items-center gap-3">
          {lastRefreshTime && (
            <p className="mb-0 ">
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </p>
          )}
          <div className="d-flex align-items-center gap-2">
            {students.length > 0 && (
              <ButtonGlobal
                onClick={handleRefresh}
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                disabled={refreshing}
                style={{
                  opacity: refreshing ? 0.7 : 1,
                }}
              >
                <i
                  className={`bi bi-arrow-clockwise ${
                    refreshing ? "spin" : ""
                  }`}
                />
              </ButtonGlobal>
            )}
            {userRole === "parent" && students.length > 0 && (
              <ButtonGlobal
                onClick={handleEnrolStudent}
                className="btn btn-primary"
                text="New Enrollment"
              />
            )}
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
            <div className="text-center py-5">
              <div className="mb-4">
                <i
                  className="bi bi-folder-x"
                  style={{ fontSize: "3rem", color: "#6c757d" }}
                ></i>
              </div>
              <h5 className="text-muted mb-3">No Enrolments Found</h5>
              <p className="text-muted mb-4">
                {userRole === "parent"
                  ? "You haven't submitted any enrollment applications yet."
                  : "No student enrollments found in the system."}
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Button
                  onClick={handleEnrolStudent}
                  className="btn-primary px-4 py-2"
                >
                  <i className="bi bi-plus-circle me-1"></i> Enrol Student
                </Button>
                <Button
                  onClick={handleRefresh}
                  variant="outline-secondary"
                  className="px-4 py-2"
                >
                  <i className="bi bi-arrow-clockwise"></i> Refresh
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-3">
                {userRole === "parent"
                  ? `Showing ${students.length} of your enrollment applications`
                  : `Showing ${students.length} enrollments`}
              </p>
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
