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

const PersonDetails = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [personData, setPersonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (location.state?.personData) {
      console.log("📍 Using location.state.personData:", location.state.personData);
      const transformedData = transformPersonData(location.state.personData);
      setPersonData(transformedData);
      setLoading(false);
    } else {
      fetchPersonDetails();
    }
  }, [name, location.state]);

  const fetchPersonDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const personId = location.state?.personId;
      
      if (!personId) {
        setError("Person ID not found");
        return;
      }

      console.log("🔄 Fetching person details for ID:", personId);
      const response = await api.get(`/admin/users/${personId}`);
      
      if (response.data.success) {
        const apiData = response.data.data.user;
        console.log("📥 API Response data:", apiData);
        const transformedData = transformPersonData(apiData);
        setPersonData(transformedData);
        console.log("✅ Transformed person data:", transformedData);
      } else {
        setError(response.data.message || "Failed to fetch person details");
      }
    } catch (err) {
      console.error("Error fetching person details:", err);
      setError("Failed to fetch person details: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to transform API data
  const transformPersonData = (apiData) => {
    console.log("🔍 Transforming person data:", apiData);
    
    // Use the originalData if available (from PersonsList), otherwise use apiData directly
    const data = apiData.originalData || apiData;
    
    // Extract name parts from full name - handle multiple spaces
    const nameParts = (data.name || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : "";
    
    const isActive = data.status === "active";
    
    console.log("✅ Derived is_active from status:", data.status, "->", isActive);
    
    return {
      id: data.uid || data.id,
      user_id: data.uid || data.user_id,
      person_id: data.uid || data.id,
      first_name: firstName,
      last_name: lastName,
      full_name: data.name || "Unknown Name",
      email: data.email || "",
      phone: data.phone || "Not provided",
      status: data.status === "active" ? "Active" : "Inactive",
      is_active: isActive,
      role: data.primary_role?.display_name || data.role?.display_name || "Unknown Role",
      role_name: data.primary_role?.role_name || data.role?.role_name || "unknown",
      role_data: data.primary_role || data.role || {},
      role_id: data.primary_role?.roleid || data.role?.roleid,
      // Additional fields that might be available
      created_at: data.created_at,
      updated_at: data.updated_at,
      last_login: data.last_login,
      profile_picture: data.profile_picture
    };
  };

  // Function to toggle person status
  const handleStatusToggle = async (newStatus) => {
    if (!personData) {
      console.error("No person data available");
      return;
    }

    const personId = personData.person_id || personData.id;

    if (!personId) {
      console.error("No valid person ID found in person data");
      alert("Cannot update status: Person ID not available");
      return;
    }

    try {
      setUpdatingStatus(true);
      
      console.log("🔄 Toggling status for person ID:", personId, "to:", newStatus);
      const response = await api.patch(`/admin/users/${personId}/toggle-status`, {
        is_active: newStatus
      });
      
      if (response.data.success) {
        // Update person data with new status
        setPersonData(prevData => ({
          ...prevData,
          status: newStatus ? "Active" : "Inactive",
          is_active: newStatus
        }));
        
        console.log("✅ Status updated successfully to:", newStatus ? "Active" : "Inactive");
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("❌ Error updating person status:", err);
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
      
      // Revert the toggle if the API call failed
      setPersonData(prevData => ({
        ...prevData,
        is_active: !newStatus // Revert to previous state
      }));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBack = () => navigate("/persons");

  // Helper function to get badge class based on role
  const getRoleBadgeClass = (roleName) => {
    switch (roleName) {
      case "admin":
        return "bg-danger";
      case "teacher":
        return "bg-primary";
      case "staff":
        return "bg-warning";
      case "parent":
        return "bg-success";
      case "student":
        return "bg-info";
      default:
        return "bg-secondary";
    }
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
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading person details...</p>
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
              <h4 className="alert-heading mb-1">Error Loading Person</h4>
              <p className="mb-3">{error}</p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Persons
              </button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // No data state
  if (!personData) {
    return (
      <div className="container-fluid px-4 py-3">
        <Alert variant="warning" className="mb-4">
          <div className="d-flex align-items-start">
            <i className="bi bi-info-circle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">No Data Found</h4>
              <p className="mb-3">No person data available for {decodeURIComponent(name)}.</p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Persons
              </button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  console.log("🎯 RENDER - Current person data:", personData);

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Person Details</h4>
          <p className="text-muted mb-0">Viewing details for: {personData.full_name}</p>
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

      {/* Person Summary Card */}
      <Card className="mb-4 border-0 shadow-sm bg-light">
        <Card.Header className="bg-transparent py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-person-badge me-2"></i>
              User Information
            </h5>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <Form.Check
                  type="switch"
                  id="person-status-switch"
                  checked={personData.is_active}
                  onChange={(e) => handleStatusToggle(e.target.checked)}
                  disabled={updatingStatus}
                  className="fs-5"
                />
                <span className="fw-medium">
                  {updatingStatus && (
                    <Spinner animation="border" size="sm" className="ms-2" />
                  )}
                </span>
              </div>
              <Badge 
                bg={personData.is_active ? "success" : "secondary"}
                className="fs-7"
              >
                {personData.status}
              </Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="g-4">
            <Col md={4}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold text-muted">Full Name</span>
                <span className="fs-6 fw-medium text-dark">
                  {personData.full_name}
                </span>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold text-muted">Email</span>
                <span className="fs-6 text-dark">{personData.email || "—"}</span>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold text-muted">Phone</span>
                <span className="fs-6 text-dark">
                  {personData.phone}
                </span>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold text-muted">Role</span>
                <span className="fs-6">
                  <Badge className={getRoleBadgeClass(personData.role_name)}>
                    {personData.role}
                  </Badge>
                </span>
              </div>
            </Col>

            <Col md={4}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold text-muted">Status</span>
                <span className="fs-6">
                  <Badge 
                    bg={personData.is_active ? "success" : "secondary"}
                    className="fs-7"
                  >
                    {personData.status}
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
                          <span className="small text-muted">First Name</span>
                          <p className="mb-0 fw-medium text-dark">{personData.first_name}</p>
                        </div>
                        <div>
                          <span className="small text-muted">Last Name</span>
                          <p className="mb-0 fw-medium text-dark">{personData.last_name}</p>
                        </div>
                        <div>
                          <span className="small text-muted">Full Name</span>
                          <p className="mb-0 fw-medium text-dark">{personData.full_name}</p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard title="Account Information" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small text-muted">Role</span>
                          <p className="mb-0">
                            <Badge className={getRoleBadgeClass(personData.role_name)}>
                              {personData.role}
                            </Badge>
                          </p>
                        </div>
                        <div>
                          <span className="small text-muted">Status</span>
                          <p className="mb-0">
                            <Badge 
                              bg={personData.is_active ? "success" : "secondary"}
                              className="fs-7"
                            >
                              {personData.status}
                            </Badge>
                          </p>
                        </div>
                        <div>
                          <span className="small text-muted">Role Name</span>
                          <p className="mb-0 text-dark text-capitalize">{personData.role_name}</p>
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
                    <InfoCard title="Contact Details" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small text-muted">Email Address</span>
                          <p className="mb-0 fw-medium text-dark text-truncate">
                            {personData.email || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small text-muted">Phone Number</span>
                          <p className="mb-0 text-dark">{personData.phone}</p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard title="System Information" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        {personData.created_at && (
                          <div>
                            <span className="small text-muted">Account Created</span>
                            <p className="mb-0 text-dark">
                              {formatDateToMMDDYYYY(personData.created_at)}
                            </p>
                          </div>
                        )}
                        {personData.updated_at && (
                          <div>
                            <span className="small text-muted">Last Updated</span>
                            <p className="mb-0 text-dark">
                              {formatDateToMMDDYYYY(personData.updated_at)}
                            </p>
                          </div>
                        )}
                        {personData.last_login && (
                          <div>
                            <span className="small text-muted">Last Login</span>
                            <p className="mb-0 text-dark">
                              {formatDateToMMDDYYYY(personData.last_login)}
                            </p>
                          </div>
                        )}
                      </div>
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Role Information Tab */}
            <Tab eventKey="role" title="Role Information">
              <div className="p-3">
                <Row className="g-3">
                  <Col md={12}>
                    <InfoCard title="Role Details" className="bg-light">
                      <Row className="g-4">
                        <Col md={4}>
                          <div className="d-flex flex-column">
                            <span className="small text-muted">Display Name</span>
                            <span className="fs-6 fw-medium text-dark">
                              {personData.role}
                            </span>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="d-flex flex-column">
                            <span className="small text-muted">Role Name</span>
                            <span className="fs-6 text-dark text-capitalize">
                              {personData.role_name}
                            </span>
                          </div>
                        </Col>
                      </Row>
                      
                      {personData.role_name === "parent" && (
                        <div className="mt-4 p-3 bg-success bg-opacity-10 rounded">
                          <h6 className="fw-semibold mb-2 text-success">
                            <i className="bi bi-people-fill me-2"></i>
                            Parent Role
                          </h6>
                          <p className="mb-0 small text-dark">
                            This user has parent privileges and can manage their children's accounts, 
                            view class schedules, and communicate with teachers.
                          </p>
                        </div>
                      )}
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

export default PersonDetails;