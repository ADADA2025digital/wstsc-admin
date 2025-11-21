import React, { useEffect, useState } from "react";
import "../../assets/Styles/Style.css";
import $ from "jquery";
import "datatables.net-dt/css/dataTables.dataTables.min.css";
import "datatables.net-responsive-dt";
import "datatables.net";
import {
  Breadcrumb,
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
import Loader from "../../Pages/Loader"; 

const EnrolStudents = () => {
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  console.log("🔄 Component mounted - Current state:", {
    loading,
    studentsCount: students.length,
    userRole,
    userData: !!userData,
    error
  });

  // Get user data from localStorage on component mount
  useEffect(() => {
    console.log("🔍 useEffect - Getting user data from localStorage");
    const userDataFromStorage = localStorage.getItem("userData");
    console.log("📦 User data from storage:", userDataFromStorage ? "exists" : "null");
    
    if (userDataFromStorage) {
      try {
        const parsedUserData = JSON.parse(userDataFromStorage);
        console.log("👤 FULL Parsed user data:", parsedUserData);
        
        // FIXED: Access primary_role.role_name instead of role.role_name
        const userRole = parsedUserData.primary_role?.role_name;
        console.log("🎭 Extracted user role:", userRole);
        
        setUserData(parsedUserData);
        setUserRole(userRole);
        
        console.log("✅ User role set to:", userRole);
      } catch (error) {
        console.error("❌ Error parsing user data:", error);
      }
    } else {
      console.log("❌ No user data found in localStorage");
    }
  }, []);

  // Fetch enrollments from appropriate API based on user role
  const fetchStudents = async (isRefresh = false) => {
    console.log("📡 fetchStudents called - isRefresh:", isRefresh);
    console.log("👤 Current userRole:", userRole);
    
    try {
      if (isRefresh) {
        console.log("🔄 Setting refreshing to true");
        setRefreshing(true);
      } else {
        console.log("⏳ Setting loading to true");
        setLoading(true);
      }
      setError(null);

      console.log("🌐 Fetching enrollments from API...");
      console.log("🎭 User role:", userRole);

      let allEnrollments = [];
      let currentPage = 1;
      let lastPage = 1;

      if (userRole === "admin") {
        console.log("🛠️ Admin: Using student-enrollment endpoint");

        const response = await api.get("/student-enrollment");
        console.log("👑 Admin API Response:", response.data);

        // Extract data based on the admin API structure
        if (response.data && response.data.students) {
          const studentsData = response.data.students;
          
          // Admin response has paginated structure with data array
          if (studentsData.data && Array.isArray(studentsData.data)) {
            allEnrollments = studentsData.data;
            console.log("👑 Admin enrollments from students.data:", allEnrollments);
            
            // Handle pagination for admin
            if (studentsData.last_page && studentsData.last_page > 1) {
              lastPage = studentsData.last_page;
              console.log(`📄 Admin has ${lastPage} pages to fetch`);

              const pagePromises = [];
              for (let page = 2; page <= lastPage; page++) {
                pagePromises.push(api.get(`/student-enrollment?page=${page}`));
              }

              if (pagePromises.length > 0) {
                console.log(`📥 Fetching ${pagePromises.length} additional admin pages`);
                const responses = await Promise.all(pagePromises);
                responses.forEach((response, index) => {
                  if (response.data && response.data.students && response.data.students.data) {
                    allEnrollments = [
                      ...allEnrollments,
                      ...response.data.students.data,
                    ];
                    console.log(
                      `✅ Added ${response.data.students.data.length} enrollments from admin page ${index + 2}`
                    );
                  }
                });
              }
            }
          }
        }
      } else {
        // Parent/teacher uses the my-enrollments endpoint
        console.log("👨‍👩‍👧‍👦 Parent/Teacher: Using my-enrollments endpoint");

        const response = await api.get("/my-enrollments");
        console.log("👪 Parent API Response:", response.data);

        // Parent response structure: response.data.enrollments
        if (response.data && response.data.data && response.data.data.enrollments) {
          allEnrollments = response.data.data.enrollments;
          console.log("👪 Parent enrollments from data.enrollments:", allEnrollments);
          
          // Handle pagination for parent if needed
          if (response.data.data.pagination && response.data.data.pagination.last_page > 1) {
            lastPage = response.data.data.pagination.last_page;
            console.log(`📄 Parent has ${lastPage} pages to fetch`);
            
            const pagePromises = [];
            for (let page = 2; page <= lastPage; page++) {
              pagePromises.push(api.get(`/my-enrollments?page=${page}`));
            }

            if (pagePromises.length > 0) {
              console.log(`📥 Fetching ${pagePromises.length} additional parent pages`);
              const responses = await Promise.all(pagePromises);
              responses.forEach((response, index) => {
                if (response.data && response.data.data && response.data.data.enrollments) {
                  allEnrollments = [
                    ...allEnrollments,
                    ...response.data.data.enrollments,
                  ];
                  console.log(
                    `✅ Added ${response.data.data.enrollments.length} enrollments from parent page ${index + 2}`
                  );
                }
              });
            }
          }
        } else {
          console.log("❌ No enrollments found in parent API response structure");
        }
      }

      console.log("📊 All enrollments data after processing:", allEnrollments);
      console.log("🎯 Total enrollments fetched:", allEnrollments.length);

      if (allEnrollments.length === 0) {
        console.log("📭 No enrollments found, setting empty state");
        setStudents([]);
        setLastRefreshTime(new Date());
        return;
      }

      // Format enrollments data for the table - CORRECTED VERSION
      const formattedStudents = allEnrollments.map((enrollment, index) => {
        console.log(`🔍 Processing enrollment ${index}:`, enrollment);

        let studentData = {};
        let parentData = {};
        let enrollmentId = "";

        if (userRole === "admin") {
          // Admin structure: enrollment is the student object with parent_carers array
          studentData = enrollment;
          parentData = {
            parent_carers: enrollment.parent_carers || []
          };
          enrollmentId = enrollment.enrollment_id || enrollment.enrid || `admin-${index + 1}`;
        } else {
          // Parent structure: enrollment has student, parent_carer_1, parent_carer_2 objects
          studentData = enrollment.student || {};
          parentData = {
            parent_carer_1: enrollment.parent_carer_1 || {},
            parent_carer_2: enrollment.parent_carer_2 || {}
          };
          enrollmentId = studentData.enrollment_id || `parent-${index + 1}`;
        }

        // Extract parent information based on role
        let parentName = "N/A";
        let contactEmail = "N/A";
        let contactPhone = "N/A";

        if (userRole === "admin") {
          // Admin: Use first parent from parent_carers array
          const parentCarers = parentData.parent_carers || [];
          if (parentCarers.length > 0) {
            const primaryParent = parentCarers[0];
            parentName = `${primaryParent.first_name || primaryParent.carer_first_name || ""} ${
              primaryParent.last_name || primaryParent.carer_last_name || ""
            }`.trim() || "N/A";
            contactEmail = primaryParent.email || primaryParent.carer_email || "N/A";
            contactPhone = primaryParent.mobile_phone || primaryParent.carer_mobile_phone || "N/A";
          }
        } else {
          // Parent: Use parent_carer_1 as primary, fallback to parent_carer_2
          const parent1 = parentData.parent_carer_1 || {};
          const parent2 = parentData.parent_carer_2 || {};
          
          const primaryParent = parent1.first_name ? parent1 : parent2;
          parentName = `${primaryParent.first_name || ""} ${primaryParent.last_name || ""}`.trim() || "N/A";
          contactEmail = parent1.email || parent2.email || "N/A";
          contactPhone = parent1.mobile_phone || parent2.mobile_phone || "N/A";
        }

        // Extract student information
        const fullName = `${studentData.first_given_name || studentData.student_first__name || studentData.first_name || ""} ${
          studentData.family_name || studentData.student_family_name || studentData.last_name || ""
        }`.trim();

        const gender = studentData.gender || studentData.student_gender || "";
        
        const dateOfBirth = formatDateToMMDDYYYY(
          studentData.date_of_birth || studentData.student_dob
        );

        const enrollmentYear = studentData.mainstream_enrollment_year || 
                             studentData.mainstream_grade || 
                             studentData.enrollment_year || "";

        const status = studentData.status || studentData.student_status || "pending";

        const formattedStudent = {
          index: index + 1,
          id: enrollmentId,
          full_name: fullName || "Unknown Student",
          gender: gender,
          date_of_birth: dateOfBirth,
          enrollment_year: enrollmentYear,
          overseas_student: studentData.overseas_student || "No",
          parent_name: parentName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          status: status,
          raw_data: enrollment,
        };

        console.log(`✅ Formatted student ${index}:`, formattedStudent);
        return formattedStudent;
      });

      console.log("🎉 Final formatted students:", formattedStudents);
      setStudents(formattedStudents);
      setLastRefreshTime(new Date());
      console.log("✅ State updated with students and refresh time");

    } catch (err) {
      console.error("❌ Fetch error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        stack: err.stack,
      });

      if (err.response?.status === 401) {
        setError("Authentication required. Please check if you need to login.");
      } else if (err.response?.status === 404) {
        setError("Enrollments endpoint not found. Please check the API URL.");
      } else if (err.code === "NETWORK_ERROR" || err.message.includes("Network Error")) {
        setError("Network error. Please check if the backend server is running.");
      } else if (err.response?.status === 500) {
        setError("Server error. Please try again later.");
      } else {
        setError(
          err.response?.data?.message || err.message || "Failed to fetch enrollments"
        );
      }
    } finally {
      console.log("🏁 fetchStudents finally block - setting loading/refreshing to false");
      setLoading(false);
      setRefreshing(false);
      console.log("✅ Final state after fetch:", {
        loading: false,
        refreshing: false,
        studentsCount: students.length,
        error
      });
    }
  };

  useEffect(() => {
    console.log("🔍 useEffect - userRole changed:", userRole);
    console.log("📊 Current state:", { userRole, userData: !!userData, loading });
    
    if (userRole) {
      console.log("🚀 userRole is available, calling fetchStudents");
      fetchStudents();
    } else {
      console.log("⏸️ userRole not available yet, waiting...");
    }
  }, [userRole, userData]);

  useEffect(() => {
    console.log("🔍 useEffect - DataTable initialization check");
    console.log("📊 Conditions:", {
      loading,
      studentsCount: students.length,
      hasDataTable: $.fn.DataTable.isDataTable("#studentTable")
    });

    if (!loading && students.length > 0) {
      console.log("✅ Initializing DataTable - loading false and students exist");
      console.log("📋 Students data:", students);

      // Destroy existing DataTable if it exists
      if ($.fn.DataTable.isDataTable("#studentTable")) {
        console.log("🗑️ Destroying existing DataTable");
        $("#studentTable").DataTable().destroy();
        $("#studentTable").empty();
      }

      // Initialize DataTable
      console.log("🆕 Creating new DataTable");
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
          console.log("✅ DataTable initialized successfully");
        },
      });

      // Corrected click event - using .view-btn instead of .view-icon
      $("#studentTable").on("click", ".view-btn", function () {
        const studentId = $(this).data("student-id");
        console.log("👁️ View button clicked for enrollment:", studentId);
        const student = students.find((s) => s.id === studentId);
        if (student) {
          console.log("🚀 Navigating to enrollment details:", studentId);
          navigate(`/enrolment/${studentId}`, {
            state: { studentData: student.raw_data },
          });
        } else {
          console.log("❌ Student not found for ID:", studentId);
        }
      });

      return () => {
        console.log("🧹 Cleanup: Destroying DataTable");
        if ($.fn.DataTable.isDataTable("#studentTable")) {
          table.destroy();
        }
      };
    } else {
      console.log("⏸️ Skipping DataTable init - conditions not met:", {
        loading,
        studentsCount: students.length
      });
    }
  }, [students, loading, navigate]);

  const handleRefresh = () => {
    console.log("🔄 Manual refresh triggered");
    fetchStudents(true);
  };

  const handleAddStudent = () => {
    console.log("➕ Add Student clicked");
    navigate("/students/add");
  };

  const handleEnrolStudent = () => {
    console.log("🎓 Enrol Student clicked");
    navigate("/enrol");
  };

  console.log("🎨 Rendering component - Current state:", {
    loading,
    refreshing,
    studentsCount: students.length,
    error: !!error,
    userRole
  });

  if (loading) {
    console.log("🌀 Rendering custom Loader component");
    return <Loader />;
  }

  console.log("📄 Rendering main content");
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
              <button
                onClick={handleEnrolStudent}
                className="btn custom-btn"
              >New Enrollment
              </button>
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