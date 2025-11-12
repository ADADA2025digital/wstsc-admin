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

  useEffect(() => {
    console.log("useEffect triggered - Checking for student data");

    if (location.state?.studentData) {
      console.log("📥 Using student data from location state:", location.state.studentData);
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

      // Updated API endpoint based on your reference
      const response = await api.get(`/my-enrollments/${id}`);
      console.log("✅ API Response:", response);
      console.log("📊 Response Data:", response.data);
      
      if (response.data.success) {
        // Map the API response to match your expected structure
        const apiData = response.data.data.enrollment;
        console.log("🎯 Mapped Student Data:", apiData);
        
        setStudentData(apiData);
      } else {
        throw new Error(response.data.message || "Failed to fetch student details");
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
        classroom_info: studentData.student?.classroom_info
      });
    }
  }, [studentData]);

  const handleBack = () => navigate("/enrolments");

  const handleAcceptEnrolment = async () => {
    if (!id) {
      console.error("❌ No enrolment ID found for acceptance");
      alert("No enrolment ID found");
      return;
    }

    console.log("✅ Attempting to accept enrolment ID:", id);
    console.log("Current student status:", studentData?.student?.status);

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

      // Updated API endpoint for approval
      const response = await api.post(`/my-enrollments/${id}/approve`);

      console.log("✅ Accept enrolment API response:", response);

      if (response.data.success) {
        console.log("🎉 Enrolment accepted successfully!");

        // Update local state to reflect the approved status
        setStudentData((prevData) => {
          const updatedData = {
            ...prevData,
            student: {
              ...prevData.student,
              status: "approved",
              // Update with API response data if available
              ...response.data.data.enrollment?.student
            }
          };
          console.log("🔄 Updated student data:", updatedData);
          return updatedData;
        });

        alert("Enrolment accepted successfully!");
      } else {
        throw new Error(response.data.message || "Failed to accept enrolment");
      }
    } catch (err) {
      console.error("❌ Error accepting enrolment:", err);
      alert(
        `Failed to accept enrolment: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setAcceptLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
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
  if (!studentData) {
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

  // Destructure data from the API response structure
  const { 
    student, 
    parent_carer_1, 
    medical_details, 
    first_emergency_contact, 
    personal_declaration 
  } = studentData;

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Enrolment Details</h4>
          <p className="text-muted mb-0">Enrolment ID: {id}</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ButtonGlobal
            onClick={handleAcceptEnrolment}
            className="btn btn-success"
            disabled={acceptLoading || student?.status === "approved"}
          >
            {acceptLoading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                Processing...
              </>
            ) : (
              <>
                <i className="bi bi-check2-all me-2"></i>
                {student?.status === "approved" ? "Enrolment Accepted" : "Accept the Enrolment"}
              </>
            )}
          </ButtonGlobal>
          <ButtonGlobal onClick={handleBack} className="btn btn-outline-secondary">
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
                  {student?.classroom_info?.class_name || student?.enrol_class_in_WSTSC || "—"}
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
                  {student?.status || "—"}
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
            <Tab eventKey="parents" title={<span><i className="bi bi-people me-2"></i>Parent/Carer</span>}>
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
                                {parent_carer_1.title} {parent_carer_1.first_name} {parent_carer_1.last_name}
                              </p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Gender</span>
                              <p className="mb-0">{parent_carer_1.gender || "—"}</p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Relationship</span>
                              <p className="mb-0">{parent_carer_1.relationship_to_student || "—"}</p>
                            </div>
                          </Col>
                          
                          <Col md={4}>
                            <div>
                              <span className="small">Email</span>
                              <p className="mb-0">{parent_carer_1.email || "—"}</p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Mobile Phone</span>
                              <p className="mb-0">{parent_carer_1.mobile_phone || "—"}</p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Country of Birth</span>
                              <p className="mb-0">{parent_carer_1.country_of_birth || "—"}</p>
                            </div>
                          </Col>
                          
                          <Col md={4}>
                            <div>
                              <span className="small">Nationality</span>
                              <p className="mb-0">{parent_carer_1.nationality || "—"}</p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Occupation</span>
                              <p className="mb-0">{parent_carer_1.occupation || "—"}</p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Marital Status</span>
                              <p className="mb-0">{parent_carer_1.marital_status || "—"}</p>
                            </div>
                          </Col>
                          
                          <Col md={12}>
                            <div>
                              <span className="small">Address</span>
                              <p className="mb-0">
                                {parent_carer_1.street_number} {parent_carer_1.street_name}, {parent_carer_1.suburb}, {parent_carer_1.state} {parent_carer_1.postal_code}, {parent_carer_1.country}
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
            <Tab eventKey="emergency" title={<span><i className="bi bi-telephone-plus me-2"></i>Emergency Contact</span>}>
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
                                {first_emergency_contact.given_name} {first_emergency_contact.family_name}
                              </p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Relationship</span>
                              <p className="mb-0">{first_emergency_contact.relationship_to_student}</p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Mobile Phone</span>
                              <p className="mb-0">{first_emergency_contact.mobile_phone || "—"}</p>
                            </div>
                          </Col>
                          
                          <Col md={4}>
                            <div>
                              <span className="small">Home Phone</span>
                              <p className="mb-0">{first_emergency_contact.home_phone || "—"}</p>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div>
                              <span className="small">Work Phone</span>
                              <p className="mb-0">{first_emergency_contact.work_phone || "—"}</p>
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
            <Tab eventKey="medical" title={<span><i className="bi bi-heart-pulse me-2"></i>Medical Information</span>}>
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
                                <span className={`badge ${medical_details.asthma === "Yes" ? "bg-warning" : "bg-success"}`}>
                                  {medical_details.asthma}
                                </span>
                              </p>
                            </div>
                          </Col>

                          <Col md={3}>
                            <div>
                              <span className="small">Major Illness</span>
                              <p className="mb-0">
                                <span className={`badge ${medical_details.major_illness === "Yes" ? "bg-warning" : "bg-success"}`}>
                                  {medical_details.major_illness}
                                </span>
                              </p>
                            </div>
                          </Col>

                          <Col md={3}>
                            <div>
                              <span className="small">Allergies</span>
                              <p className="mb-0">
                                <span className={`badge ${medical_details.allergies === "Yes" ? "bg-warning" : "bg-success"}`}>
                                  {medical_details.allergies}
                                </span>
                              </p>
                            </div>
                          </Col>

                          <Col md={3}>
                            <div>
                              <span className="small">Special Learning Needs</span>
                              <p className="mb-0">
                                <span className={`badge ${medical_details.special_learning_needs === "Yes" ? "bg-danger" : "bg-success"}`}>
                                  {medical_details.special_learning_needs}
                                </span>
                              </p>
                              {medical_details.special_learning_needs_details && (
                                <small className="text-muted">
                                  Details: {medical_details.special_learning_needs_details}
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
            <Tab eventKey="declaration" title={<span><i className="bi bi-file-text me-2"></i>Personal Declaration</span>}>
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
                              <span className="small">First Parent/Carer Name</span>
                              <p className="mb-0 fw-medium">{personal_declaration.first_parent_carer_name}</p>
                              {personal_declaration.first_parent_carer_name_date && (
                                <small className="text-muted">
                                  Date: {formatDateToMMDDYYYY(personal_declaration.first_parent_carer_name_date)}
                                </small>
                              )}
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="bg-white rounded p-3">
                              <span className="small">Second Parent/Carer Name</span>
                              <p className="mb-0 fw-medium">{personal_declaration.second_parent_carer_name}</p>
                              {personal_declaration.second_parent_carer_name_date && (
                                <small className="text-muted">
                                  Date: {formatDateToMMDDYYYY(personal_declaration.second_parent_carer_name_date)}
                                </small>
                              )}
                            </div>
                          </Col>
                          
                          <Col md={6}>
                            <div className="bg-white rounded p-3">
                              <span className="small">Photo/Video Consent</span>
                              <p className="mb-0">
                                <span className={`badge ${personal_declaration.photo_video_consent ? "bg-success" : "bg-danger"}`}>
                                  {personal_declaration.photo_video_consent ? "Granted" : "Not Granted"}
                                </span>
                              </p>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="bg-white rounded p-3">
                              <span className="small">Medical Treatment Consent</span>
                              <p className="mb-0">
                                <span className={`badge ${personal_declaration.medical_treatment_consent ? "bg-success" : "bg-danger"}`}>
                                  {personal_declaration.medical_treatment_consent ? "Granted" : "Not Granted"}
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
    </div>
  );
};

export default EnrolmentDetails;