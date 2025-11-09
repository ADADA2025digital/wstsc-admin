import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Spinner,
  Alert,
  Badge,
  Tab,
  Tabs,
  Form,
} from "react-bootstrap";
import ButtonGlobal from "../../Components/Button";
import InfoCard from "../../Components/InfoCard";
import { formatDateToMMDDYYYY } from "../../config/utils";
import api from "../../config/axiosConfig";

const TeacherDetails = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (location.state?.teacherData) {
      const transformedData = transformTeacherData(location.state.teacherData);
      setTeacherData(transformedData);
      setLoading(false);
    } else {
      fetchTeacherDetails();
    }
  }, [name, location.state]);

  const fetchTeacherDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const teacherId = location.state?.teacherId || getTeacherIdFromName(name);
      
      if (!teacherId) {
        setError("Teacher ID not found");
        return;
      }

      const response = await api.get(`/admin/teachers/${teacherId}`);
      
      if (response.data.success) {
        const apiData = response.data.data.teacher;
        const transformedData = transformTeacherData(apiData);
        setTeacherData(transformedData);
        console.log("✅ Fetched and transformed teacher data:", transformedData);
      } else {
        setError(response.data.message || "Failed to fetch teacher details");
      }
    } catch (err) {
      console.error("Error fetching teacher details:", err);
      setError("Failed to fetch teacher details: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Fixed helper function to transform API data
  const transformTeacherData = (apiData) => {
    console.log("🔍 Transforming teacher data:", apiData);
    
    // Use the direct properties from apiData since they're available
    const isActive = apiData.status === "Active";
    
    console.log("✅ Derived is_active from status:", apiData.status, "->", isActive);
    
    return {
      id: apiData.id,
      person_id: apiData.id, // Use teacher ID as person ID for the API call
      first_name: apiData.first_name || "",
      last_name: apiData.last_name || "",
      middle_name: apiData.middle_name || "",
      full_name: apiData.full_name || "",
      gender: apiData.gender || "",
      date_of_birth: apiData.date_of_birth || "",
      nationality: apiData.nationality || "",
      email: apiData.email || "",
      phone: apiData.phone || "",
      alternate_phone: apiData.alternate_phone || "",
      marital_status: apiData.marital_status || "",
      occupation: apiData.occupation || "Teacher",
      address: apiData.address || "",
      status: apiData.status || "Active",
      is_active: isActive, // This is now properly set
      grade: apiData.grade || "Not assigned",
      profile_picture: apiData.profile_picture,
      role: apiData.role,
      addresses: apiData.addresses || [],
      classroom_assignments: apiData.classroom_assignments || []
    };
  };

  const getTeacherIdFromName = (teacherName) => {
    console.log("Need to implement getTeacherIdFromName for:", teacherName);
    return null;
  };

  // Function to toggle teacher status
  const handleStatusToggle = async (newStatus) => {
    if (!teacherData) {
      console.error("No teacher data available");
      return;
    }

    const personId = teacherData.person_id || teacherData.id;

    if (!personId) {
      console.error("No valid person ID found in teacher data");
      alert("Cannot update status: Person ID not available");
      return;
    }

    try {
      setUpdatingStatus(true);
      
      console.log("🔄 Toggling status for person ID:", personId);
      const response = await api.patch(`/admin/persons/${personId}/toggle-status`);
      
      if (response.data.success) {
        const updatedPerson = response.data.data.person;
        
        console.log("✅ Status update response:", updatedPerson);
        
        // Update teacher data with consistent status
        setTeacherData(prevData => ({
          ...prevData,
          status: updatedPerson.status_text,
          is_active: updatedPerson.new_status
        }));
        
        console.log("✅ Status updated successfully to:", updatedPerson.status_text);
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("❌ Error updating teacher status:", err);
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
      
      // Revert the toggle if the API call failed
      setTeacherData(prevData => ({
        ...prevData,
        is_active: !newStatus // Revert to previous state
      }));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBack = () => navigate("/teachers");

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading teacher details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid px-4 py-3">
        <Alert variant="danger" className="mb-4">
          <div className="d-flex align-items-start">
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">Error Loading Teacher</h4>
              <p className="mb-3">{error}</p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Teachers
              </button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // No data state
  if (!teacherData) {
    return (
      <div className="container-fluid px-4 py-3">
        <Alert variant="warning" className="mb-4">
          <div className="d-flex align-items-start">
            <i className="bi bi-info-circle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">No Data Found</h4>
              <p className="mb-3">No teacher data available for {decodeURIComponent(name)}.</p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Teachers
              </button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // Debug current state on render
  console.log("🎯 RENDER - Current teacher status:", {
    is_active: teacherData.is_active,
    status: teacherData.status,
    full_name: teacherData.full_name
  });

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Teacher Details</h4>
          <p className="text-muted mb-0">Viewing details for: {teacherData.full_name}</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ButtonGlobal
            onClick={handleBack}
            className="btn btn-outline-secondary"
          >
            <i className="bi bi-arrow-left me-2" />
            Back to List
          </ButtonGlobal>
        </div>
      </div>

      {/* Teacher Summary Card */}
      <Card className="mb-4 border-0 shadow-sm bg-light">
        <Card.Header className="bg-transparent py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-person-badge me-2"></i>
              Teacher Information
            </h5>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <Form.Check
                  type="switch"
                  id="teacher-status-switch"
                  checked={teacherData.is_active}
                  onChange={(e) => handleStatusToggle(e.target.checked)}
                  disabled={updatingStatus}
                  className="fs-5"
                />
                <span className="fw-medium">
                  {teacherData.is_active ? "Active" : "Inactive"}
                  {updatingStatus && (
                    <Spinner animation="border" size="sm" className="ms-2" />
                  )}
                </span>
              </div>
              <Badge 
                bg={teacherData.is_active ? "success" : "secondary"}
                className="fs-7"
              >
                {teacherData.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="g-4">
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Full Name</span>
                <span className="fs-6 fw-medium">
                  {teacherData.full_name}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Gender</span>
                <span className="fs-6">{teacherData.gender || "—"}</span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Date of Birth</span>
                <span className="fs-6">
                  {formatDateToMMDDYYYY(teacherData.date_of_birth)}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Nationality</span>
                <span className="fs-6">
                  {teacherData.nationality || "—"}
                </span>
              </div>
            </Col>

            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Occupation</span>
                <span className="fs-6">
                  {teacherData.occupation || "—"}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Grade</span>
                <span className="fs-6">
                  {teacherData.grade || "—"}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Marital Status</span>
                <span className="fs-6">
                  {teacherData.marital_status || "—"}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Status</span>
                <span className="fs-6">
                  <Badge 
                    bg={teacherData.is_active ? "success" : "secondary"}
                    className="fs-7"
                  >
                    {teacherData.is_active ? "Active" : "Inactive"}
                  </Badge>
                </span>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Detailed Information Tabs */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="px-3 pt-3 border-bottom"
            fill
          >
            {/* Personal Information Tab */}
            <Tab eventKey="personal" title="Personal Information">
              <div className="p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <InfoCard title="Personal Details" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">First Name</span>
                          <p className="mb-0 fw-medium">{teacherData.first_name}</p>
                        </div>
                        <div>
                          <span className="small">Last Name</span>
                          <p className="mb-0 fw-medium">{teacherData.last_name}</p>
                        </div>
                        <div>
                          <span className="small">Middle Name</span>
                          <p className="mb-0">{teacherData.middle_name || "—"}</p>
                        </div>
                        <div>
                          <span className="small">Gender</span>
                          <p className="mb-0">{teacherData.gender}</p>
                        </div>
                        <div>
                          <span className="small">Date of Birth</span>
                          <p className="mb-0">
                            {formatDateToMMDDYYYY(teacherData.date_of_birth)}
                          </p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard title="Background Information" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Nationality</span>
                          <p className="mb-0 fw-medium">{teacherData.nationality}</p>
                        </div>
                        <div>
                          <span className="small">Marital Status</span>
                          <p className="mb-0">{teacherData.marital_status}</p>
                        </div>
                        <div>
                          <span className="small">Occupation</span>
                          <p className="mb-0">{teacherData.occupation}</p>
                        </div>
                        <div>
                          <span className="small">Grade</span>
                          <p className="mb-0">{teacherData.grade}</p>
                        </div>
                        <div>
                          <span className="small">Status</span>
                          <p className="mb-0">
                            <Badge 
                              bg={teacherData.is_active ? "success" : "secondary"}
                              className="fs-7"
                            >
                              {teacherData.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Contact Information Tab */}
            <Tab eventKey="contacts" title="Contact Information">
              <div className="p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <InfoCard title="Primary Contact" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Email</span>
                          <p className="mb-0 fw-medium text-truncate">
                            {teacherData.email || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Phone</span>
                          <p className="mb-0">{teacherData.phone || "—"}</p>
                        </div>
                        <div>
                          <span className="small">Alternate Phone</span>
                          <p className="mb-0">{teacherData.alternate_phone || "—"}</p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard title="Address Information" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Residential Address</span>
                          <p className="mb-0">{teacherData.address || "—"}</p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Professional Information Tab */}
            <Tab eventKey="professional" title="Professional Information">
              <div className="p-3">
                <Row className="g-3">
                  <Col md={12}>
                    <InfoCard title="Teaching Details" className="bg-light">
                      <Row className="g-4">
                        <Col md={4}>
                          <div className="d-flex flex-column gap-3">
                            <div>
                              <span className="small">Occupation/Position</span>
                              <p className="mb-0 fw-medium">{teacherData.occupation}</p>
                            </div>
                            <div>
                              <span className="small">Grade Level</span>
                              <p className="mb-0">{teacherData.grade}</p>
                            </div>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="d-flex flex-column gap-3">
                            <div>
                              <span className="small">Employment Status</span>
                              <p className="mb-0">
                                <Badge 
                                  bg={teacherData.is_active ? "success" : "secondary"}
                                  className="fs-7"
                                >
                                  {teacherData.is_active ? "Active" : "Inactive"}
                                </Badge>
                              </p>
                            </div>
                            <div>
                              <span className="small">Classroom Assignments</span>
                              <p className="mb-0">
                                {teacherData.classroom_assignments?.length > 0 
                                  ? `${teacherData.classroom_assignments.length} classes`
                                  : "No assignments"}
                              </p>
                            </div>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="d-flex flex-column gap-3">
                            <div>
                              <span className="small">Role</span>
                              <p className="mb-0">
                                {teacherData.role?.display_name || "Teacher"}
                              </p>
                            </div>
                            <div>
                              <span className="small">Teacher ID</span>
                              <p className="mb-0">{teacherData.id}</p>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TeacherDetails;