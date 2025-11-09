import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Row,
  Col,
  Tab,
  Tabs,
} from "react-bootstrap";
import ButtonGlobal from "../../Components/Button";
import InfoCard from "../../Components/InfoCard";
import { formatDateToMMDDYYYY } from "../../config/utils";

const EnrolmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("parents");

  useEffect(() => {
    if (location.state?.studentData) {
      setStudentData(location.state.studentData);
      setLoading(false);
    } else {
      fetchStudentDetails();
    }
  }, [id, location.state]);

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      // API call would go here
      setError("Student data not found. Please go back and try again.");
    } catch (err) {
      setError("Failed to fetch student details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => navigate("/enrolments");
  const handleEdit = () =>
    navigate(`/enrolment/edit/${id}`, { state: { studentData } });

  // Helper function to get parent by type
  const getParentByType = (type) => {
    if (!studentData?.parent_carers) return null;
    return studentData.parent_carers.find(
      (parent) => parent.parent_type === type
    );
  };

  // Helper function to get contact by type
  const getContactByType = (type) => {
    if (!studentData?.contact_details) return null;
    return studentData.contact_details.find(
      (contact) => contact.contact_type === type
    );
  };

  // Helper function to get emergency contact by preference
  const getEmergencyContact = (preference) => {
    if (!studentData?.emergency_contacts) return null;
    return studentData.emergency_contacts.find(
      (contact) => contact.preference === preference
    );
  };

  // Loading state
  if (loading) {
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

  // Get data using helper functions
  const parent1 = getParentByType("living_with_student_1");
  const parent2 = getParentByType("living_with_student_2");
  const firstContact = getContactByType("first_contact");
  const secondContact = getContactByType("second_contact");
  const notLivingParent = getContactByType("not_living_parent");
  const firstEmergency = getEmergencyContact("first");
  const secondEmergency = getEmergencyContact("second");

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Student Enrolment Details</h4>
        </div>

        <div className="d-flex align-items-center gap-2">
                    <ButtonGlobal
            className="btn btn-outline-primary"
          >
            <i className="bi bi-check2-all me-2"></i>
            Accept the Enrolment
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
            <h5 className=" mb-0">
              <i className="bi bi-person-badge me-2"></i>
              Student Information
            </h5>
          </div>
        </div>
        <div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Full Name</span>
                <span className="fs-6 fw-medium">
                  {studentData.first_given_name} {studentData.second_given_name}{" "}
                  {studentData.family_name}
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
                  {studentData.enrollment_year || "—"}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Overseas Student</span>
                <span className="fs-6">
                  <div
                    className={
                      studentData.overseas_student === "Yes"
                        ? "bg-warning badge fs-7"
                        : "bg-success badge fs-7"
                    }
                  >
                    {studentData.overseas_student || "No"}
                  </div>
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Day School</span>
                <span className="fs-6">
                  {studentData.day_school_name || "—"}
                  {studentData.day_school_location &&
                    ` (${studentData.day_school_location})`}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Dates of Attendance</span>
                <span className="fs-6">{studentData.dates_of_attendance}</span>
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
                            <p className="mb-0">{parent1.gender}</p>
                          </div>
                          <div>
                            <span className="small">Relationship</span>
                            <p className="mb-0">
                              {parent1.relationship_to_student}
                            </p>
                          </div>
                          <div>
                            <span className="small">Country of Birth</span>
                            <p className="mb-0">{parent1.country_of_birth}</p>
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
                            <p className="mb-0">{parent2.gender}</p>
                          </div>
                          <div>
                            <span className="small">Relationship</span>
                            <p className="mb-0">
                              {parent2.relationship_to_student}
                            </p>
                          </div>
                          <div>
                            <span className="small">Country of Birth</span>
                            <p className="mb-0">{parent2.country_of_birth}</p>
                          </div>
                        </div>
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Contact Information Tab */}
            <Tab
              eventKey="contacts"
              title={
                <span>
                  <i className="bi bi-telephone me-2"></i>
                  Contact Information
                </span>
              }
            >
              <div className="p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <InfoCard
                      title="Primary Contact"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!firstContact}
                      emptyMessage="No contact information available"
                    >
                      {firstContact && (
                        <div className="d-flex flex-column gap-2">
                          <div>
                            <span className="small">Name</span>
                            <p className="mb-0 fw-medium">
                              {firstContact.parent_name}
                            </p>
                          </div>
                          <div>
                            <span className="small">Email</span>
                            <p className="mb-0 text-truncate">
                              {firstContact.email || "—"}
                            </p>
                          </div>
                          <div className="row">
                            <div className="col-4">
                              <span className="small">Mobile</span>
                              <p className="mb-0">
                                {firstContact.mobile_phone || "—"}
                              </p>
                            </div>
                            <div className="col-4">
                              <span className="small">Home</span>
                              <p className="mb-0">
                                {firstContact.home_phone || "—"}
                              </p>
                            </div>
                            <div className="col-4">
                              <span className="small">Work Phone</span>
                              <p className="mb-0">
                                {firstContact.work_phone || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard
                      title="Secondary Contact"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!secondContact}
                      emptyMessage="No contact information available"
                    >
                      {secondContact && (
                        <div className="d-flex flex-column gap-2">
                          <div>
                            <span className="small">Name</span>
                            <p className="mb-0 fw-medium">
                              {secondContact.parent_name}
                            </p>
                          </div>
                          <div>
                            <span className="small">Email</span>
                            <p className="mb-0 text-truncate">
                              {secondContact.email || "—"}
                            </p>
                          </div>
                          <div className="row">
                            <div className="col-4">
                              <span className="small">Mobile</span>
                              <p className="mb-0">
                                {secondContact.mobile_phone || "—"}
                              </p>
                            </div>
                            <div className="col-4">
                              <span className="small">Home</span>
                              <p className="mb-0">
                                {secondContact.home_phone || "—"}
                              </p>
                            </div>
                            <div className="col-4">
                              <span className="small">Work Phone</span>
                              <p className="mb-0">
                                {secondContact.work_phone || "—"}
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

            {/* Living Details Tab */}
            <Tab
              eventKey="living"
              title={
                <span>
                  <i className="bi bi-house me-2"></i>
                  Living Details
                </span>
              }
            >
              <div className="p-3">
                <Row className="g-3">
                  <Col md={12}>
                    <InfoCard
                      title="Residential & Correspondence Details"
                      className="bg-secondary bg-opacity-10"
                      emptyState={!studentData.parent_living_details}
                      emptyMessage="No living details available"
                    >
                      {studentData.parent_living_details && (
                        <Row className="g-4">
                          <Col md={6}>
                            <div className="d-flex flex-column gap-3">
                              <div>
                                <span className="small">
                                  Correspondence Name
                                </span>
                                <p className="mb-0 fw-medium">
                                  {
                                    studentData.parent_living_details
                                      .correspondence_name
                                  }
                                </p>
                              </div>
                              <div>
                                <span className="small">
                                  Student Residential Address
                                </span>
                                <p className="mb-0">
                                  {studentData.parent_living_details
                                    .is_student_residential_address
                                    ? "Yes"
                                    : "No"}
                                </p>
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="d-flex flex-column gap-3">
                              <div>
                                <span className="small">
                                  Residential Address
                                </span>
                                <p className="mb-0">
                                  {
                                    studentData.parent_living_details
                                      .residential_address
                                  }
                                </p>
                              </div>
                              <div>
                                <span className="small">
                                  Correspondence Address
                                </span>
                                <p className="mb-0">
                                  {
                                    studentData.parent_living_details
                                      .correspondence_address
                                  }
                                </p>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      )}
                    </InfoCard>
                  </Col>

                  {notLivingParent && (
                    <Col md={12}>
                      <InfoCard
                        title="Parent Not Living With Student"
                        className="bg-secondary bg-opacity-10"
                      >
                        <Row className="g-4">
                          <Col md={6}>
                            <div className="d-flex flex-column gap-3">
                              <div>
                                <span className="small">Name</span>
                                <p className="mb-0 fw-medium">
                                  {notLivingParent.parent_name}
                                </p>
                              </div>
                              <div>
                                <span className="small">Relationship</span>
                                <p className="mb-0">
                                  {notLivingParent.relationship_to_student}
                                </p>
                              </div>
                              <div>
                                <span className="small">
                                  Student Resides Here
                                </span>
                                <p className="mb-0">
                                  {notLivingParent.does_student_reside_here
                                    ? "Yes"
                                    : "No"}
                                </p>
                              </div>
                              <div>
                                <span className="small">Gender</span>
                                <p className="mb-0">{notLivingParent.gender}</p>
                              </div>
                            </div>
                          </Col>
                          <Col md={6}>
                            <div className="d-flex flex-column gap-3">
                              <div>
                                <span className="small">Mobile</span>
                                <p className="mb-0">
                                  {notLivingParent.mobile_phone || "—"}
                                </p>
                              </div>
                              <div>
                                <span className="small">Email</span>
                                <p className="mb-0 text-truncate">
                                  {notLivingParent.email || "—"}
                                </p>
                              </div>
                              <div>
                                <span className="small">Address</span>
                                <p className="mb-0">
                                  {notLivingParent.residential_address}
                                </p>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </InfoCard>
                    </Col>
                  )}
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
                          <div>
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
                              <small>
                                Date:{" "}
                                {formatDateToMMDDYYYY(
                                  studentData.personal_declaration
                                    .first_parent_carer_name_date
                                )}
                              </small>
                            )}
                          </div>
                          <div>
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
                              <small>
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