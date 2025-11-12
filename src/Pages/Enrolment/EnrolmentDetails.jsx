import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Row, Col, Tab, Tabs } from "react-bootstrap";
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

  // Console log initial props
  console.log("EnrolmentDetails Component Props:", {
    id,
    locationState: location.state,
    hasStudentDataInState: !!location.state?.studentData,
  });

  useEffect(() => {
    console.log("useEffect triggered - Checking for student data");

    if (location.state?.studentData) {
      console.log(
        "📥 Using student data from location state:",
        location.state.studentData
      );
      setStudentData(location.state.studentData);
      setLoading(false);
    } else {
      console.log("🔄 No student data in location state, fetching from API");
      fetchStudentDetails();
    }
  }, [id, location.state]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`🔍 Fetching student details for ID: ${id}`);

      // API call using your axios instance
      const response = await api.get(`/admin/enrollments/${id}`);
      console.log("✅ API Response:", response);
      console.log("📊 Response Data:", response.data);
      console.log("🎯 Student Data:", response.data.data);

      if (response.data.success) {
        setStudentData(response.data.data);
      } else {
        throw new Error(
          response.data.message || "Failed to fetch student details"
        );
      }
    } catch (err) {
      console.error("❌ Error fetching student details:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response,
        stack: err.stack,
      });
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
        basicInfo: {
          name: `${studentData.first_given_name} ${studentData.family_name}`,
          status: studentData.status,
          preferredName: studentData.preferred_first_name,
          gender: studentData.gender,
          dateOfBirth: studentData.date_of_birth,
          enrollmentYear: studentData.mainstream_enrollment_year,
          schoolName: studentData.mainstream_school_name,
          class: studentData.enrol_class_in_WSTSC,
          classroom: studentData.classroom,
        },
        hasParents: !!studentData.parent_carers,
        parentCount: studentData.parent_carers?.length || 0,
        hasEmergencyContacts: !!studentData.emergency_contacts,
        emergencyContactCount: studentData.emergency_contacts?.length || 0,
        hasMedicalDetails: !!studentData.medical_details,
        hasPersonalDeclaration: !!studentData.personal_declaration,
        hasSubmitter: !!studentData.submitter,
      });

      // Log specific data arrays for debugging
      if (studentData.parent_carers) {
        console.log("👨‍👩‍👧 Parent/Carers Array:", studentData.parent_carers);
        studentData.parent_carers.forEach((parent, index) => {
          console.log(`Parent ${index + 1}:`, {
            type: parent.parent_type,
            name: `${parent.given_name} ${parent.family_name}`,
            relationship: parent.relationship_to_student,
            email: parent.email,
            phone: parent.phone_number,
          });
        });
      }

      if (studentData.emergency_contacts) {
        console.log(
          "🚨 Emergency Contacts Array:",
          studentData.emergency_contacts
        );
        studentData.emergency_contacts.forEach((contact, index) => {
          console.log(`Emergency Contact ${index + 1}:`, {
            preference: contact.preference,
            name: `${contact.given_name} ${contact.family_name}`,
            relationship: contact.relationship_to_student,
            phones: {
              mobile: contact.mobile_phone,
              home: contact.home_phone,
              work: contact.work_phone,
            },
          });
        });
      }

      if (studentData.medical_details) {
        console.log("🏥 Medical Details:", studentData.medical_details);
      }

      if (studentData.personal_declaration) {
        console.log(
          "📝 Personal Declaration:",
          studentData.personal_declaration
        );
      }

      if (studentData.classroom) {
        console.log("🏫 Classroom Details:", studentData.classroom);
      }

      if (studentData.submitter) {
        console.log("👤 Submitted By:", studentData.submitter);
      }
    }
  }, [studentData]);

  const handleBack = () => navigate("/enrolments");

  const handleEdit = () => {
    console.log("✏️ Navigating to edit page with student data:", studentData);
    navigate(`/enrolment/edit/${id}`, { state: { studentData } });
  };

  // Accept Enrolment API Integration using your axios instance
  const handleAcceptEnrolment = async () => {
    if (!id) {
      console.error("❌ No enrolment ID found for acceptance");
      alert("No enrolment ID found");
      return;
    }

    console.log("✅ Attempting to accept enrolment ID:", id);
    console.log("Current student status:", studentData?.status);

    // Confirmation dialog
    const isConfirmed = window.confirm(
      "Are you sure you want to accept this enrolment? This action cannot be undone."
    );

    if (!isConfirmed) {
      console.log("❌ Enrolment acceptance cancelled by user");
      return;
    }

    try {
      setAcceptLoading(true);
      console.log("🔄 Starting accept enrolment API call...");

      // Using your axios instance
      const response = await api.post(`/admin/enrollments/${id}/approve`);

      console.log("✅ Accept enrolment API response:", response);
      console.log("📊 Response data:", response.data);

      if (response.data.success) {
        console.log("🎉 Enrolment accepted successfully!");

        // Update local state to reflect the approved status
        setStudentData((prevData) => {
          const updatedData = {
            ...prevData,
            status: "approved",
            // Update with API response data
            ...response.data.data.enrollment,
          };
          console.log("🔄 Updated student data:", updatedData);
          return updatedData;
        });

        // Show success message
        alert("Enrolment accepted successfully!");
      } else {
        console.warn("⚠️ API returned success: false", response.data);
        throw new Error(response.data.message || "Failed to accept enrolment");
      }
    } catch (err) {
      console.error("❌ Error accepting enrolment:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response,
        status: err.response?.status,
        data: err.response?.data,
      });

      // User-friendly error messages
      if (err.response?.status === 401) {
        console.warn("🔐 Authentication error - session may have expired");
        alert(
          "Authentication failed. Your session may have expired. Please log in again."
        );
      } else if (
        err.message.includes("Network Error") ||
        err.message.includes("timeout")
      ) {
        console.warn("🌐 Network error detected");
        alert(
          "Network error. Please check your internet connection and try again."
        );
      } else {
        console.warn("🚨 Other error occurred");
        alert(
          `Failed to accept enrolment: ${
            err.response?.data?.message || err.message
          }`
        );
      }
    } finally {
      setAcceptLoading(false);
      console.log("🏁 Accept enrolment process completed");
    }
  };

  // Helper function to get parent by type - UPDATED based on actual data structure
  const getParentByType = (type) => {
    if (!studentData?.parent_carers) {
      console.log(`👨‍👩‍👧 No parent_carers data available for type: ${type}`);
      return null;
    }
    const parent = studentData.parent_carers.find(
      (parent) => parent.parent_type === type
    );
    console.log(`🔍 Parent lookup - type: ${type}, found:`, parent);
    return parent;
  };

  // Helper function to get emergency contact by preference
  const getEmergencyContact = (preference) => {
    if (!studentData?.emergency_contacts) {
      console.log(
        `🚨 No emergency_contacts data available for preference: ${preference}`
      );
      return null;
    }
    const contact = studentData.emergency_contacts.find(
      (contact) => contact.preference === preference
    );
    console.log(
      `🔍 Emergency contact lookup - preference: ${preference}, found:`,
      contact
    );
    return contact;
  };

  // Console log helper function results when data is available
  useEffect(() => {
    if (studentData) {
      console.log("🔧 Helper Function Results:", {
        parent1: getParentByType("living_with_student_1"),
        parent2: getParentByType("living_with_student_2"),
        firstEmergency: getEmergencyContact("first"),
        secondEmergency: getEmergencyContact("second"),
      });
    }
  }, [studentData]);

  // Loading state
  if (loading) {
    console.log("⏳ Rendering loading state...");
    return (
      <div className="container-fluid px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <div className="text-center">
            <div
              className="spinner-border text-primary"
              role="status"
              aria-hidden="true"
            ></div>
            <p className="mt-3 text-muted">Loading student details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.log("❌ Rendering error state:", error);
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
  if (!studentData) {
    console.log("📭 Rendering no data state");
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

  // Get data using helper functions
  console.log("🎯 Final data processing before render");
  const parent1 = getParentByType("living_with_student_1");
  const parent2 = getParentByType("living_with_student_2");
  const firstEmergency = getEmergencyContact("first");
  const secondEmergency = getEmergencyContact("second");

  console.log("📊 Final data for rendering:", {
    parent1,
    parent2,
    firstEmergency,
    secondEmergency,
  });

  console.log("🚀 Rendering main component with student data");

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Student Enrolment Details</h4>
          <p className="text-muted mb-0">Enrolment ID: {id}</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ButtonGlobal
            onClick={handleAcceptEnrolment}
            className="btn btn-success"
            disabled={acceptLoading || studentData.status === "approved"}
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
                {studentData.status === "approved"
                  ? "Enrolment Accepted"
                  : "Accept the Enrolment"}
              </>
            )}
          </ButtonGlobal>
          <ButtonGlobal onClick={handleEdit} className="btn btn-primary">
            <i className="bi bi-pencil me-2" />
            Edit Enrolment
          </ButtonGlobal>
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
            <span className="badge bg-info">ID: {id}</span>
          </div>
        </div>
        <div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Full Name</span>
                <span className="fs-6 fw-medium">
                  {studentData.first_given_name} {studentData.family_name}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Preferred Name</span>
                <span className="fs-6">
                  {studentData.preferred_first_name || "—"}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Gender</span>
                <span className="fs-6">{studentData.gender || "—"}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Date of Birth</span>
                <span className="fs-6">
                  {formatDateToMMDDYYYY(studentData.date_of_birth)}
                </span>
              </div>
            </div>

            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Enrollment Year</span>
                <span className="fs-6">
                  {studentData.mainstream_enrollment_year || "—"}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Mainstream School</span>
                <span className="fs-6">
                  {studentData.mainstream_school_name || "—"}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">WSTSC Class</span>
                <span className="fs-6">
                  {studentData.classroom.class_name || "—"}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column align-items-start">
                <span className="small fw-semibold">Status</span>
                <span
                  className={`badge ${
                    studentData.status === "approved"
                      ? "bg-success"
                      : studentData.status === "pending"
                      ? "bg-warning"
                      : studentData.status === "rejected"
                      ? "bg-danger"
                      : "bg-secondary"
                  }`}
                >
                  {studentData.status}
                </span>
              </div>
            </div>

            {/* Additional fields from your data */}
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Enrolment Date</span>
                <span className="fs-6">
                  {formatDateToMMDDYYYY(studentData.enrolment_date)}
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
                  <i className="bi bi-people me-2"></i>
                  Parents/Carers
                </span>
              }
            >
              <div className="p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <InfoCard
                      title="Parent/Carer 1"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!parent1}
                      emptyMessage="No parent/carer information available"
                    >
                      {parent1 && (
                        <div className="d-flex flex-column gap-2">
                          <div>
                            <span className="small">Name</span>
                            <p className="mb-0 fw-medium">
                              {parent1.title} {parent1.given_name}{" "}
                              {parent1.family_name}
                            </p>
                          </div>
                          <div>
                            <span className="small">Gender</span>
                            <p className="mb-0">{parent1.gender || "—"}</p>
                          </div>
                          <div>
                            <span className="small">Relationship</span>
                            <p className="mb-0">
                              {parent1.relationship_to_student || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="small">Email</span>
                            <p className="mb-0">{parent1.email || "—"}</p>
                          </div>
                          <div>
                            <span className="small">Phone</span>
                            <p className="mb-0">
                              {parent1.phone_number || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="small">Country of Birth</span>
                            <p className="mb-0">
                              {parent1.country_of_birth || "—"}
                            </p>
                          </div>
                        </div>
                      )}
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard
                      title="Parent/Carer 2"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!parent2}
                      emptyMessage="No parent/carer information available"
                    >
                      {parent2 && (
                        <div className="d-flex flex-column gap-2">
                          <div>
                            <span className="small">Name</span>
                            <p className="mb-0 fw-medium">
                              {parent2.title} {parent2.given_name}{" "}
                              {parent2.family_name}
                            </p>
                          </div>
                          <div>
                            <span className="small">Gender</span>
                            <p className="mb-0">{parent2.gender || "—"}</p>
                          </div>
                          <div>
                            <span className="small">Relationship</span>
                            <p className="mb-0">
                              {parent2.relationship_to_student || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="small">Email</span>
                            <p className="mb-0">{parent2.email || "—"}</p>
                          </div>
                          <div>
                            <span className="small">Phone</span>
                            <p className="mb-0">
                              {parent2.phone_number || "—"}
                            </p>
                          </div>
                          <div>
                            <span className="small">Country of Birth</span>
                            <p className="mb-0">
                              {parent2.country_of_birth || "—"}
                            </p>
                          </div>
                        </div>
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
                  <i className="bi bi-telephone-plus me-2"></i>
                  Emergency Contacts
                </span>
              }
            >
              <div className="p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <InfoCard
                      title="First Emergency Contact"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!firstEmergency}
                      emptyMessage="No emergency contact information available"
                    >
                      {firstEmergency && (
                        <div className="d-flex flex-column gap-2">
                          <div>
                            <span className="small">Name</span>
                            <p className="mb-0 fw-medium">
                              {firstEmergency.given_name}{" "}
                              {firstEmergency.family_name}
                            </p>
                          </div>
                          <div>
                            <span className="small">Relationship</span>
                            <p className="mb-0">
                              {firstEmergency.relationship_to_student}
                            </p>
                          </div>
                          <div className="row">
                            <div className="col-4">
                              <span className="small">Mobile</span>
                              <p className="mb-0">
                                {firstEmergency.mobile_phone || "—"}
                              </p>
                            </div>
                            <div className="col-4">
                              <span className="small">Home</span>
                              <p className="mb-0">
                                {firstEmergency.home_phone || "—"}
                              </p>
                            </div>
                            <div className="col-4">
                              <span className="small">Work</span>
                              <p className="mb-0">
                                {firstEmergency.work_phone || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard
                      title="Second Emergency Contact"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!secondEmergency}
                      emptyMessage="No emergency contact information available"
                    >
                      {secondEmergency && (
                        <div className="d-flex flex-column gap-2">
                          <div>
                            <span className="small">Name</span>
                            <p className="mb-0 fw-medium">
                              {secondEmergency.given_name}{" "}
                              {secondEmergency.family_name}
                            </p>
                          </div>
                          <div>
                            <span className="small">Relationship</span>
                            <p className="mb-0">
                              {secondEmergency.relationship_to_student}
                            </p>
                          </div>
                          <div className="row">
                            <div className="col-4">
                              <span className="small">Mobile</span>
                              <p className="mb-0">
                                {secondEmergency.mobile_phone || "—"}
                              </p>
                            </div>
                            <div className="col-4">
                              <span className="small">Home</span>
                              <p className="mb-0">
                                {secondEmergency.home_phone || "—"}
                              </p>
                            </div>
                            <div className="col-4">
                              <span className="small">Work</span>
                              <p className="mb-0">
                                {secondEmergency.work_phone || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
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
                  <i className="bi bi-heart-pulse me-2"></i>
                  Medical Information
                </span>
              }
            >
              <div className="p-3">
                <Row>
                  <Col md={12}>
                    <InfoCard
                      title="Medical Details"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!studentData.medical_details}
                      emptyMessage="No medical information available"
                    >
                      {studentData.medical_details && (
                        <Row className="g-4">
                          <Col md={3}>
                            <div>
                              <span className="small">Asthma</span>
                              <p className="mb-0">
                                <span
                                  className={`badge ${
                                    studentData.medical_details.asthma === "Yes"
                                      ? "bg-warning"
                                      : "bg-success"
                                  }`}
                                >
                                  {studentData.medical_details.asthma}
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
                                    studentData.medical_details
                                      .major_illness === "Yes"
                                      ? "bg-warning"
                                      : "bg-success"
                                  }`}
                                >
                                  {studentData.medical_details.major_illness}
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
                                    studentData.medical_details.allergies ===
                                    "Yes"
                                      ? "bg-warning"
                                      : "bg-success"
                                  }`}
                                >
                                  {studentData.medical_details.allergies}
                                </span>
                              </p>
                              {studentData.medical_details
                                .allergies_details && (
                                <small className="text-muted">
                                  Details:{" "}
                                  {
                                    studentData.medical_details
                                      .allergies_details
                                  }
                                </small>
                              )}
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
                                    studentData.medical_details
                                      .special_learning_needs === "Yes"
                                      ? "bg-danger"
                                      : "bg-success"
                                  }`}
                                >
                                  {
                                    studentData.medical_details
                                      .special_learning_needs
                                  }
                                </span>
                              </p>

                              {studentData.medical_details
                                .special_learning_needs_details && (
                                <small className="text-muted">
                                  Details:{" "}
                                  {
                                    studentData.medical_details
                                      .special_learning_needs_details
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
                  <i className="bi bi-file-text me-2"></i>
                  Personal Declaration
                </span>
              }
            >
              <div className="p-3">
                <Row>
                  <Col md={12}>
                    <InfoCard
                      title="Personal Declaration"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!studentData.personal_declaration}
                      emptyMessage="No personal declaration information available"
                    >
                      {studentData.personal_declaration && (
                        <div className="d-flex flex-column gap-3">
                          <div className="bg-white rounded p-2">
                            <span className="small">
                              First Parent/Carer Name
                            </span>
                            <p className="mb-0 fw-medium">
                              {
                                studentData.personal_declaration
                                  .first_parent_carer_name
                              }
                            </p>
                            {studentData.personal_declaration
                              .first_parent_carer_name_date && (
                              <small className="text-muted">
                                Date:{" "}
                                {formatDateToMMDDYYYY(
                                  studentData.personal_declaration
                                    .first_parent_carer_name_date
                                )}
                              </small>
                            )}
                          </div>
                          <div className="bg-white rounded p-2">
                            <span className="small">
                              Second Parent/Carer Name
                            </span>
                            <p className="mb-0 fw-medium">
                              {
                                studentData.personal_declaration
                                  .second_parent_carer_name
                              }
                            </p>
                            {studentData.personal_declaration
                              .second_parent_carer_name_date && (
                              <small className="text-muted">
                                Date:{" "}
                                {formatDateToMMDDYYYY(
                                  studentData.personal_declaration
                                    .second_parent_carer_name_date
                                )}
                              </small>
                            )}
                          </div>
                        </div>
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnrolmentDetails;
