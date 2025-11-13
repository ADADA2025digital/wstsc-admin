import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Row, Col, Tab, Tabs, Modal, Button } from "react-bootstrap";
import ButtonGlobal from "../../Components/Button";
import InfoCard from "../../Components/InfoCard";
import { formatDateToMMDDYYYY } from "../../config/utils";
import api from "../../config/axiosConfig";

const EnrolmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("parents");
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Rejection modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  // Get user role from localStorage on component mount
  useEffect(() => {
    const getUserRole = () => {
      try {
        const userData = localStorage.getItem("userData");
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          const role = parsedUserData.role?.role_name || "parent";
          console.log("👤 User role detected:", role);
          setUserRole(role);
        } else {
          console.warn(
            "⚠️ No user data found in localStorage, defaulting to parent role"
          );
          setUserRole("parent");
        }
      } catch (error) {
        console.error("❌ Error parsing user data from localStorage:", error);
        setUserRole("parent");
      }
    };

    getUserRole();
  }, []);

  // Normalize data structure to match component expectations
  const normalizeStudentData = (rawData) => {
    console.log("🔄 Normalizing data structure:", rawData);

    // If data already has the expected nested structure, return as-is
    if (rawData.student && rawData.parent_carer_1) {
      console.log("✅ Data already in expected structure");
      return rawData;
    }

    // If data is flat (from location state), convert to nested structure
    const normalizedData = {
      student: {
        enrollment_id: rawData.enrollment_id,
        family_name: rawData.family_name,
        first_given_name: rawData.first_given_name,
        preferred_first_name: rawData.preferred_first_name,
        gender: rawData.gender,
        date_of_birth: rawData.date_of_birth,
        phone_number: rawData.phone_number,
        mainstream_school_name: rawData.mainstream_school_name,
        enrolment_date: rawData.enrolment_date,
        mainstream_enrollment_year: rawData.mainstream_enrollment_year,
        enrol_class_in_WSTSC: rawData.enrol_class_in_WSTSC,
        classroom_info: rawData.classroom || {
          class_id: rawData.enrol_class_in_WSTSC,
          class_name: rawData.classroom?.class_name || "Not assigned",
        },
        status: rawData.status,
        submitted_by: rawData.submitter?.name || "System",
        submitted_at: rawData.submitted_at,
        approved_by: rawData.approved_by || rawData.approver?.name,
        approved_at: rawData.approved_at,
        rejected_by: rawData.rejected_by || rawData.rejecter?.name,
        rejected_at: rawData.rejected_at,
        rejection_reason: rawData.rejection_reason,
      },
      // Use first parent from parent_carers array
      parent_carer_1: rawData.parent_carers?.[0] || null,
      medical_details: rawData.medical_details || null,
      // Use first emergency contact from array
      first_emergency_contact: rawData.emergency_contacts?.[0] || null,
      personal_declaration: rawData.personal_declaration || null,
    };

    console.log("🎯 Normalized data:", normalizedData);
    return normalizedData;
  };

  useEffect(() => {
    console.log("useEffect triggered - Checking for student data");

    if (location.state?.studentData) {
      console.log(
        "📥 Using student data from location state:",
        location.state.studentData
      );
      const normalizedData = normalizeStudentData(location.state.studentData);
      setStudentData(normalizedData);
      setLoading(false);
    } else {
      console.log("🔄 No student data in location state, fetching from API");
      fetchStudentDetails();
    }
  }, [id, location.state, userRole]);

  const fetchStudentDetails = async () => {
    // Wait for userRole to be set
    if (!userRole) {
      console.log("⏳ Waiting for user role to be determined...");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`🔍 Fetching student details for ID: ${id} as ${userRole}`);

      let endpoint;

      // Determine API endpoint based on user role
      if (userRole === "admin") {
        endpoint = `/admin/enrollments/${id}`;
        console.log("🎯 Using admin endpoint:", endpoint);
      } else {
        // For parent, teacher, or any other role
        endpoint = `/my-enrollments/${id}`;
        console.log("🎯 Using parent/teacher endpoint:", endpoint);
      }

      const response = await api.get(endpoint);
      console.log("✅ API Response:", response);
      console.log("📊 Response Data:", response.data);

      if (response.data.success) {
        // Map the API response to match your expected structure
        const apiData = response.data.data.enrollment || response.data.data;
        console.log("🎯 Raw API Data:", apiData);

        const normalizedData = normalizeStudentData(apiData);
        setStudentData(normalizedData);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch student details"
        );
      }
    } catch (err) {
      console.error("❌ Error fetching student details:", err);
      setError("Failed to fetch student details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Console log when studentData changes
  useEffect(() => {
    if (studentData) {
      console.log("🎯 Student Data State Updated:", studentData);
      console.log("📋 Student Data Structure:", {
        student: studentData.student,
        parent_carer_1: studentData.parent_carer_1,
        medical_details: studentData.medical_details,
        first_emergency_contact: studentData.first_emergency_contact,
        personal_declaration: studentData.personal_declaration,
        classroom_info: studentData.student?.classroom_info,
      });
    }
  }, [studentData]);

  const handleBack = () => navigate("/enrolments");

  const handleAcceptEnrolment = async () => {
    if (!id) {
      console.error("❌ No enrolment ID found for acceptance");
      return;
    }

    console.log("✅ Attempting to accept enrolment ID:", id);
    console.log("Current student status:", studentData?.student?.status);

    try {
      setAcceptLoading(true);
      console.log("🔄 Starting accept enrolment API call...");

      // Determine endpoint based on user role for approval as well
      let endpoint;
      if (userRole === "admin") {
        endpoint = `/admin/enrollments/${id}/approve`;
      } else {
        endpoint = `/my-enrollments/${id}/approve`;
      }

      console.log("🎯 Using approval endpoint:", endpoint);

      const response = await api.post(endpoint);

      console.log("✅ Accept enrolment API response:", response);
      console.log("📊 Response data:", response.data);

      if (response.data.success) {
        console.log("🎉 Enrolment accepted successfully!");

        // Update local state with the complete API response data
        setStudentData((prevData) => {
          const updatedData = {
            ...prevData,
            student: {
              ...prevData.student,
              status: "approved",
              approved_by: response.data.data?.approved_by || "Admin User",
              approved_at:
                response.data.data?.approved_at || new Date().toISOString(),
            },
          };
          console.log("🔄 Updated student data:", updatedData);
          return updatedData;
        });
      } else {
        throw new Error(response.data.message || "Failed to accept enrolment");
      }
    } catch (err) {
      console.error("❌ Error accepting enrolment:", err);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to accept enrolment. Please try again.";

      setError(errorMessage);

      if (err.response) {
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
      }
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleOpenRejectModal = () => {
    setRejectionReason("");
    setRejectionError("");
    setShowRejectModal(true);
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason("");
    setRejectionError("");
  };

  const handleRejectEnrolment = async () => {
    if (!rejectionReason.trim()) {
      setRejectionError("Please provide a reason for rejection");
      return;
    }

    if (!id) {
      console.error("❌ No enrolment ID found for rejection");
      return;
    }

    console.log("❌ Attempting to reject enrolment ID:", id);
    console.log("Rejection reason:", rejectionReason);

    try {
      setRejectLoading(true);
      setRejectionError("");
      console.log("🔄 Starting reject enrolment API call...");

      // Determine endpoint based on user role for rejection as well
      let endpoint;
      if (userRole === "admin") {
        endpoint = `/admin/enrollments/${id}/reject`;
      } else {
        endpoint = `/my-enrollments/${id}/reject`;
      }

      console.log("🎯 Using rejection endpoint:", endpoint);

      // Make the POST request to reject the enrolment
      const response = await api.post(endpoint, {
        rejection_reason: rejectionReason.trim(),
      });

      console.log("✅ Reject enrolment API response:", response);
      console.log("📊 Response data:", response.data);

      if (response.data.success) {
        console.log("🎉 Enrolment rejected successfully!");

        // Update local state with the complete API response data
        setStudentData((prevData) => {
          const updatedData = {
            ...prevData,
            student: {
              ...prevData.student,
              status: "rejected",
              rejected_by: response.data.data?.rejected_by || "Admin User",
              rejected_at:
                response.data.data?.rejected_at || new Date().toISOString(),
              rejection_reason: rejectionReason.trim(),
            },
          };
          console.log("🔄 Updated student data after rejection:", updatedData);
          return updatedData;
        });

        // Close the modal
        handleCloseRejectModal();
      } else {
        throw new Error(response.data.message || "Failed to reject enrolment");
      }
    } catch (err) {
      console.error("❌ Error rejecting enrolment:", err);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to reject enrolment. Please try again.";

      setRejectionError(errorMessage);

      if (err.response) {
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
      }
    } finally {
      setRejectLoading(false);
    }
  };

  // Show loading while determining user role
  if (!userRole) {
    return (
      <div className="container-fluid px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted">Loading user information...</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted">Loading student details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="alert alert-danger mb-4" role="alert">
          <div className="d-flex align-items-start">
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">Error Loading Student</h4>
              <p className="mb-3">{error}</p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Students
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!studentData || !studentData.student) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="alert alert-warning mb-4" role="alert">
          <div className="d-flex align-items-start">
            <i className="bi bi-info-circle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">No Data Found</h4>
              <p className="mb-3">No student data available for this ID.</p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Students
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Destructure data from the normalized structure
  const {
    student,
    parent_carer_1,
    medical_details,
    first_emergency_contact,
    personal_declaration,
  } = studentData;

  const isApproved = student?.status === "approved";
  const isRejected = student?.status === "rejected";
  const isPending = student?.status === "pending" || !student?.status;

  // Check if user has permission to approve/reject (only admin)
  const canApproveReject = userRole === "admin";

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Enrolment Details</h4>
          <p className="text-muted mb-0">Enrolment ID: {id}</p>

          {/* Only show approval/rejection info for admin users */}
          {canApproveReject && (
            <>
              {student?.approved_by && student?.approved_at && (
                <p className="text-muted small mb-0">
                  Approved by {student.approved_by} on{" "}
                  {formatDateToMMDDYYYY(student.approved_at)}
                </p>
              )}
              {student?.rejected_by && student?.rejected_at && (
                <p className="text-danger small mb-0">
                  Rejected by {student.rejected_by} on{" "}
                  {formatDateToMMDDYYYY(student.rejected_at)}
                  {student.rejection_reason &&
                    ` - Reason: ${student.rejection_reason}`}
                </p>
              )}
            </>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Only show action buttons for admin users */}
          {canApproveReject && isPending && (
            <>
              <ButtonGlobal
                onClick={handleAcceptEnrolment}
                className="btn btn-primary"
                disabled={acceptLoading}
              >
                {acceptLoading ? (
                  <>
                    <div
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-all me-2"></i>
                    Accept Enrolment
                  </>
                )}
              </ButtonGlobal>

              <ButtonGlobal
                onClick={handleOpenRejectModal}
                className="btn btn-outline-danger"
                disabled={rejectLoading}
              >
                <i className="bi bi-x-circle me-2" />
                Reject Enrolment
              </ButtonGlobal>
            </>
          )}

          {/* Only show status badges for admin users */}
          {canApproveReject && isApproved && (
            <ButtonGlobal className="btn btn-success" disabled>
              <i className="bi bi-check2-all me-2"></i>
              Enrolment Accepted
            </ButtonGlobal>
          )}

          {canApproveReject && isRejected && (
            <ButtonGlobal className="btn btn-danger" disabled>
              <i className="bi bi-x-circle me-2" />
              Enrolment Rejected
            </ButtonGlobal>
          )}

          <ButtonGlobal
            onClick={handleBack}
            className="btn btn-outline-secondary"
          >
            <i className="bi bi-arrow-left me-2" />
            Back to List
          </ButtonGlobal>
        </div>
      </div>

      {/* Student Summary Card */}
      <div className="card mb-4 border-0 shadow-sm bg-secondary bg-opacity-10">
        <div className="card-header bg-transparent py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-person-badge me-2"></i>
              Student Information
            </h5>
            <span className="badge bg-info">
              ID: {student.enrollment_id || id}
            </span>
          </div>
        </div>
        <div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Full Name</span>
                <span className="fs-6 fw-medium">
                  {student?.first_given_name} {student?.family_name}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Preferred Name</span>
                <span className="fs-6">
                  {student?.preferred_first_name || "—"}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Gender</span>
                <span className="fs-6">{student?.gender || "—"}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Date of Birth</span>
                <span className="fs-6">
                  {formatDateToMMDDYYYY(student?.date_of_birth)}
                </span>
              </div>
            </div>

            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Enrollment Year</span>
                <span className="fs-6">
                  {student?.mainstream_enrollment_year || "—"}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Mainstream School</span>
                <span className="fs-6">
                  {student?.mainstream_school_name || "—"}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">WSTSC Class</span>
                <span className="fs-6">
                  {student?.classroom_info?.class_name ||
                    student?.enrol_class_in_WSTSC ||
                    "—"}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column align-items-start">
                <span className="small fw-semibold">Status</span>
                <span
                  className={`badge ${
                    student?.status === "approved"
                      ? "bg-success"
                      : student?.status === "pending"
                      ? "bg-warning"
                      : student?.status === "rejected"
                      ? "bg-danger"
                      : "bg-secondary"
                  }`}
                >
                  {student?.status ? student.status.toUpperCase() : "—"}
                </span>
              </div>
            </div>

            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Enrolment Date</span>
                <span className="fs-6">
                  {formatDateToMMDDYYYY(student?.enrolment_date)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="px-3 pt-3 border-bottom"
            fill
          >
            {/* Parent/Carer Information Tab */}
            <Tab
              eventKey="parents"
              title={
                <span>
                  <i className="bi bi-people me-2"></i>Parent/Carer
                </span>
              }
            >
              <div className="p-3">
                <Row className="g-3">
                  <Col md={12}>
                    <InfoCard
                      title="Parent/Carer Information"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!parent_carer_1}
                      emptyMessage="No parent/carer information available"
                    >
                      {parent_carer_1 && (
                        <Row className="g-4">
                          <Col md={4}>
                            <div>
                              <span className="small">Name</span>
                              <p className="mb-0 fw-medium">
                                {parent_carer_1.title}{" "}
                                {parent_carer_1.first_name}{" "}
                                {parent_carer_1.last_name}
                              </p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Gender</span>
                              <p className="mb-0">
                                {parent_carer_1.gender || "—"}
                              </p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Relationship</span>
                              <p className="mb-0">
                                {parent_carer_1.relationship_to_student || "—"}
                              </p>
                            </div>
                          </Col>

                          <Col md={4}>
                            <div>
                              <span className="small">Email</span>
                              <p className="mb-0">
                                {parent_carer_1.email || "—"}
                              </p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Mobile Phone</span>
                              <p className="mb-0">
                                {parent_carer_1.mobile_phone || "—"}
                              </p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Country of Birth</span>
                              <p className="mb-0">
                                {parent_carer_1.country_of_birth || "—"}
                              </p>
                            </div>
                          </Col>

                          <Col md={4}>
                            <div>
                              <span className="small">Nationality</span>
                              <p className="mb-0">
                                {parent_carer_1.nationality || "—"}
                              </p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Occupation</span>
                              <p className="mb-0">
                                {parent_carer_1.occupation || "—"}
                              </p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Marital Status</span>
                              <p className="mb-0">
                                {parent_carer_1.marital_status || "—"}
                              </p>
                            </div>
                          </Col>

                          <Col md={12}>
                            <div>
                              <span className="small">Address</span>
                              <p className="mb-0">
                                {parent_carer_1.street_number}{" "}
                                {parent_carer_1.street_name},{" "}
                                {parent_carer_1.suburb}, {parent_carer_1.state}{" "}
                                {parent_carer_1.postal_code},{" "}
                                {parent_carer_1.country}
                              </p>
                            </div>
                          </Col>
                        </Row>
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Emergency Contacts Tab */}
            <Tab
              eventKey="emergency"
              title={
                <span>
                  <i className="bi bi-telephone-plus me-2"></i>Emergency Contact
                </span>
              }
            >
              <div className="p-3">
                <Row className="g-3">
                  <Col md={12}>
                    <InfoCard
                      title="Emergency Contact"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!first_emergency_contact}
                      emptyMessage="No emergency contact information available"
                    >
                      {first_emergency_contact && (
                        <Row className="g-4">
                          <Col md={4}>
                            <div>
                              <span className="small">Name</span>
                              <p className="mb-0 fw-medium">
                                {first_emergency_contact.given_name}{" "}
                                {first_emergency_contact.family_name}
                              </p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Relationship</span>
                              <p className="mb-0">
                                {
                                  first_emergency_contact.relationship_to_student
                                }
                              </p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Mobile Phone</span>
                              <p className="mb-0">
                                {first_emergency_contact.mobile_phone || "—"}
                              </p>
                            </div>
                          </Col>

                          <Col md={4}>
                            <div>
                              <span className="small">Home Phone</span>
                              <p className="mb-0">
                                {first_emergency_contact.home_phone || "—"}
                              </p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Work Phone</span>
                              <p className="mb-0">
                                {first_emergency_contact.work_phone || "—"}
                              </p>
                            </div>
                          </Col>
                        </Row>
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Medical Information Tab */}
            <Tab
              eventKey="medical"
              title={
                <span>
                  <i className="bi bi-heart-pulse me-2"></i>Medical Information
                </span>
              }
            >
              <div className="p-3">
                <Row>
                  <Col md={12}>
                    <InfoCard
                      title="Medical Details"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!medical_details}
                      emptyMessage="No medical information available"
                    >
                      {medical_details && (
                        <Row className="g-4">
                          <Col md={3}>
                            <div>
                              <span className="small">Asthma</span>
                              <p className="mb-0">
                                <span
                                  className={`badge ${
                                    medical_details.asthma === "Yes"
                                      ? "bg-warning"
                                      : "bg-success"
                                  }`}
                                >
                                  {medical_details.asthma}
                                </span>
                              </p>
                            </div>
                          </Col>

                          <Col md={3}>
                            <div>
                              <span className="small">Major Illness</span>
                              <p className="mb-0">
                                <span
                                  className={`badge ${
                                    medical_details.major_illness === "Yes"
                                      ? "bg-warning"
                                      : "bg-success"
                                  }`}
                                >
                                  {medical_details.major_illness}
                                </span>
                              </p>
                            </div>
                          </Col>

                          <Col md={3}>
                            <div>
                              <span className="small">Allergies</span>
                              <p className="mb-0">
                                <span
                                  className={`badge ${
                                    medical_details.allergies === "Yes"
                                      ? "bg-warning"
                                      : "bg-success"
                                  }`}
                                >
                                  {medical_details.allergies}
                                </span>
                              </p>
                            </div>
                          </Col>

                          <Col md={3}>
                            <div>
                              <span className="small">
                                Special Learning Needs
                              </span>
                              <p className="mb-0">
                                <span
                                  className={`badge ${
                                    medical_details.special_learning_needs ===
                                    "Yes"
                                      ? "bg-danger"
                                      : "bg-success"
                                  }`}
                                >
                                  {medical_details.special_learning_needs}
                                </span>
                              </p>
                              {medical_details.special_learning_needs_details && (
                                <small className="text-muted">
                                  Details:{" "}
                                  {
                                    medical_details.special_learning_needs_details
                                  }
                                </small>
                              )}
                            </div>
                          </Col>
                        </Row>
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Personal Declaration Tab */}
            <Tab
              eventKey="declaration"
              title={
                <span>
                  <i className="bi bi-file-text me-2"></i>Personal Declaration
                </span>
              }
            >
              <div className="p-3">
                <Row>
                  <Col md={12}>
                    <InfoCard
                      title="Personal Declaration"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!personal_declaration}
                      emptyMessage="No personal declaration information available"
                    >
                      {personal_declaration && (
                        <Row className="g-4">
                          <Col md={6}>
                            <div className="bg-white rounded p-3">
                              <span className="small">
                                First Parent/Carer Name
                              </span>
                              <p className="mb-0 fw-medium">
                                {personal_declaration.first_parent_carer_name}
                              </p>
                              {personal_declaration.first_parent_carer_name_date && (
                                <small className="text-muted">
                                  Date:{" "}
                                  {formatDateToMMDDYYYY(
                                    personal_declaration.first_parent_carer_name_date
                                  )}
                                </small>
                              )}
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="bg-white rounded p-3">
                              <span className="small">
                                Second Parent/Carer Name
                              </span>
                              <p className="mb-0 fw-medium">
                                {personal_declaration.second_parent_carer_name ||
                                  "—"}
                              </p>
                              {personal_declaration.second_parent_carer_name_date && (
                                <small className="text-muted">
                                  Date:{" "}
                                  {formatDateToMMDDYYYY(
                                    personal_declaration.second_parent_carer_name_date
                                  )}
                                </small>
                              )}
                            </div>
                          </Col>

                          <Col md={6}>
                            <div className="bg-white rounded p-3">
                              <span className="small">Photo/Video Consent</span>
                              <p className="mb-0">
                                <span
                                  className={`badge ${
                                    personal_declaration.photo_video_consent
                                      ? "bg-success"
                                      : "bg-danger"
                                  }`}
                                >
                                  {personal_declaration.photo_video_consent
                                    ? "Granted"
                                    : "Not Granted"}
                                </span>
                              </p>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="bg-white rounded p-3">
                              <span className="small">
                                Medical Treatment Consent
                              </span>
                              <p className="mb-0">
                                <span
                                  className={`badge ${
                                    personal_declaration.medical_treatment_consent
                                      ? "bg-success"
                                      : "bg-danger"
                                  }`}
                                >
                                  {personal_declaration.medical_treatment_consent
                                    ? "Granted"
                                    : "Not Granted"}
                                </span>
                              </p>
                            </div>
                          </Col>
                        </Row>
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>

      {/* Rejection Confirmation Modal - Only show for admin users */}
      {canApproveReject && (
        <Modal
          show={showRejectModal}
          onHide={handleCloseRejectModal}
          size="md"
          centered
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              <i className="bi bi-x-circle me-2 text-danger"></i>
              Reject Enrolment
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center mb-3">
              <div className="mb-3">
                <i className="bi bi-exclamation-triangle text-warning fs-1"></i>
              </div>
              <h5 className="mb-3">
                Are you sure you want to reject this enrolment?
              </h5>
              <p className="text-muted">
                You are about to reject the enrolment for{" "}
                <strong>
                  {student?.first_given_name} {student?.family_name}
                </strong>
                . This action will change the enrolment status to rejected.
              </p>
            </div>

            <div className="mb-3">
              <label
                htmlFor="rejectionReason"
                className="form-label fw-semibold"
              >
                Reason for Rejection <span className="text-danger">*</span>
              </label>
              <textarea
                id="rejectionReason"
                className={`form-control ${rejectionError ? "is-invalid" : ""}`}
                rows="3"
                placeholder="Please provide a reason for rejecting this enrolment..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
              {rejectionError && (
                <div className="invalid-feedback">{rejectionError}</div>
              )}
              <div className="form-text">
                This reason will be recorded and visible in the enrolment
                history.
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between">
            <Button
              variant="secondary"
              onClick={handleCloseRejectModal}
              disabled={rejectLoading}
            >
              Cancel
            </Button>
            <ButtonGlobal
              onClick={handleRejectEnrolment}
              className="btn btn-danger"
              disabled={rejectLoading}
            >
              {rejectLoading ? (
                <>
                  <div
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  ></div>
                  Rejecting...
                </>
              ) : (
                <>
                  <i className="bi bi-x-circle me-2" />
                  Reject Enrolment
                </>
              )}
            </ButtonGlobal>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default EnrolmentDetails;
