import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Badge,
  Tab,
  Tabs,
  Form,
  Modal,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import ButtonGlobal from "../../Components/Button";
import InfoCard from "../../Components/InfoCard";
import { formatDateToMMDDYYYY } from "../../config/utils";
import api from "../../config/axiosConfig";

const PersonDetails = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState("personal");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Person data state
  const [personData, setPersonData] = useState(null);

  // Get personId from navigation state or try to extract from URL
  const getPersonId = () => {
    // First try to get from navigation state
    if (location.state?.personId) {
      return location.state.personId;
    }
    
    // If not available in state, you might need to extract from URL or use other methods
    // For now, we'll rely on the state being passed
    console.warn("No personId found in navigation state");
    return null;
  };

  // Fetch person details from API
  const fetchPersonDetails = async (personId) => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching person details for ID:", personId);
      
      // Use the persons list endpoint and filter by peid, or use a specific endpoint if available
      const response = await api.get("/admin/persons");
      
      if (response.data.success) {
        const persons = response.data.data.persons || [];
        const person = persons.find(p => p.peid === personId);
        
        if (person) {
          console.log("Found person:", person);
          transformPersonData(person);
        } else {
          setError("Person not found");
          setPersonData(null);
        }
      } else {
        setError(response.data.message || "Failed to fetch person details");
      }
    } catch (err) {
      console.error("Error fetching person details:", err);
      setError(err.response?.data?.message || "Failed to load person details");
      setPersonData(null);
    } finally {
      setLoading(false);
    }
  };

  // Transform API data to match component structure
  const transformPersonData = (apiData) => {
    const user = apiData.user || {};
    const roleData = user.role || {};
    
    const transformedData = {
      // Basic info
      id: apiData.peid,
      user_id: user.uid,
      person_id: apiData.peid,
      first_name: apiData.person_first_name,
      last_name: apiData.person_last_name,
      middle_name: apiData.person_middle_name,
      full_name: apiData.full_name,
      email: apiData.person_email,
      phone: apiData.person_phone,
      
      // Status
      status: user.status === "active" ? "Active" : "Inactive",
      is_active: apiData.is_active,
      person_status: apiData.person_status,
      
      // Role information
      role: roleData.display_name || "Unknown Role",
      role_name: roleData.role_name || "unknown",
      role_id: roleData.roleid,
      
      // Personal details
      gender: apiData.person_gender,
      dob: apiData.person_dob,
      
      // Timestamps
      created_at: apiData.created_at,
      updated_at: apiData.updated_at,
      last_login: user.last_login,
      
      // Role flags for UI
      has_teacher_role: roleData.role_name === "teacher",
      has_parent_role: roleData.role_name === "parent",
      has_admin_role: roleData.role_name === "admin",
      has_staff_role: roleData.role_name === "staff",
      has_student_role: roleData.role_name === "student",
      
      // Store original API data
      originalData: apiData
    };

    setPersonData(transformedData);
  };

  // Fetch data on component mount
  useEffect(() => {
    const personId = getPersonId();
    if (personId) {
      fetchPersonDetails(personId);
    } else {
      setError("No person ID provided");
      setLoading(false);
    }
  }, [location.state]);

  const handleBack = () => navigate("/persons");

  // Toggle person status
  const handleStatusToggle = async (newStatus) => {
    try {
      const personId = getPersonId();
      if (!personId) {
        setError("No person ID available");
        return;
      }

      console.log(`Toggling status for person: ${personId} to ${newStatus}`);
      
      const response = await api.put(
        `/admin/persons/${personId}/toggle-status`,
        {}
      );

      if (response.data.success) {
        const updatedPerson = response.data.data.person;
        setPersonData(prev => ({
          ...prev,
          is_active: updatedPerson.is_active,
          status: updatedPerson.is_active ? "Active" : "Inactive"
        }));
        setSuccessMessage(`Status updated to ${updatedPerson.is_active ? "Active" : "Inactive"}`);
        
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError(err.response?.data?.message || "Failed to update status");
    }
  };

  // Role management functions
  const handleOpenRoleModal = () => {
    if (!personData) return;
    
    const initialSelectedRoles = [];
    if (personData.has_teacher_role) initialSelectedRoles.push(3);
    if (personData.has_parent_role) initialSelectedRoles.push(4);
    
    setSelectedRoles(initialSelectedRoles);
    setShowRoleModal(true);
  };

  const handleRoleCheckboxChange = (roleId, isChecked) => {
    if (isChecked) {
      setSelectedRoles(prev => [...prev, roleId]);
    } else {
      setSelectedRoles(prev => prev.filter(id => id !== roleId));
    }
  };

  const handleRoleUpdate = async () => {
    try {
      const personId = getPersonId();
      if (!personId) {
        setError("No person ID available");
        return;
      }

      // TODO: Implement API call to update roles
      // This would require a new endpoint like: PUT /admin/persons/{peid}/roles
      console.log("Updating roles for person:", personId, "with roles:", selectedRoles);
      
      // For now, we'll update the local state
      const hasTeacherRole = selectedRoles.includes(3);
      const hasParentRole = selectedRoles.includes(4);
      
      let roleDisplay = "";
      if (hasTeacherRole && hasParentRole) {
        roleDisplay = "Teacher & Parent";
      } else if (hasTeacherRole) {
        roleDisplay = "Teacher";
      } else if (hasParentRole) {
        roleDisplay = "Parent";
      } else {
        roleDisplay = "No Role";
      }

      setPersonData(prevData => ({
        ...prevData,
        role: roleDisplay,
        role_ids: selectedRoles,
        has_teacher_role: hasTeacherRole,
        has_parent_role: hasParentRole
      }));

      setSuccessMessage("Roles updated successfully");
      setShowRoleModal(false);
      
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      
    } catch (err) {
      console.error("Error updating roles:", err);
      setError("Failed to update roles");
    }
  };

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

  // Define editable roles
  const editableRoles = [
    { roleid: 3, role_name: "teacher", display_name: "Teacher" },
    { roleid: 4, role_name: "parent", display_name: "Parent" }
  ];

  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  if (error && !personData) {
    return (
      <div className="container-fluid px-4 py-3">
        <Alert variant="danger" className="d-flex justify-content-between align-items-center">
          <div>
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
          <Button variant="outline-danger" size="sm" onClick={handleBack}>
            <i className="bi bi-arrow-left me-2"></i>
            Back to List
          </Button>
        </Alert>
      </div>
    );
  }

  if (!personData) {
    return (
      <div className="container-fluid px-4 py-3">
        <Alert variant="warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          No person data available
        </Alert>
        <ButtonGlobal onClick={handleBack} className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2" />
          Back to List
        </ButtonGlobal>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Person Details</h4>
          <p className="text-muted mb-0">Viewing details for: {personData.full_name}</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            onClick={() => fetchPersonDetails(getPersonId())}
            disabled={loading}
            className="d-flex align-items-center"
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            Refresh
          </Button>
          <ButtonGlobal
            onClick={handleBack}
            className="btn btn-outline-secondary"
          >
            <i className="bi bi-arrow-left me-2" />
            Back to List
          </ButtonGlobal>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert variant="success" className="mb-3">
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" className="mb-3">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

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
                  className="fs-5"
                />
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
                  {personData.phone || "Not provided"}
                </span>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold text-muted">Role</span>
                <div className="d-flex align-items-center gap-2">
                  <Badge className={getRoleBadgeClass(personData.role_name)}>
                    {personData.role}
                  </Badge>
                  {(personData.has_teacher_role || personData.has_parent_role) && (
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleOpenRoleModal}
                      className="py-0"
                    >
                      <i className="bi bi-pencil"></i>
                    </Button>
                  )}
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold text-muted">User ID</span>
                <span className="fs-6 text-dark">{personData.user_id}</span>
              </div>
            </Col>
            <Col md={4}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold text-muted">Person ID</span>
                <span className="fs-6 text-dark">{personData.person_id}</span>
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
                        {personData.middle_name && (
                          <div>
                            <span className="small text-muted">Middle Name</span>
                            <p className="mb-0 fw-medium text-dark">{personData.middle_name}</p>
                          </div>
                        )}
                        <div>
                          <span className="small text-muted">Gender</span>
                          <p className="mb-0 fw-medium text-dark">{personData.gender || "Not specified"}</p>
                        </div>
                        {personData.dob && (
                          <div>
                            <span className="small text-muted">Date of Birth</span>
                            <p className="mb-0 fw-medium text-dark">
                              {formatDateToMMDDYYYY(personData.dob)}
                            </p>
                          </div>
                        )}
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard title="Role Information" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small text-muted">Current Role</span>
                          <div className="d-flex flex-wrap gap-2 mt-1">
                            <Badge className={getRoleBadgeClass(personData.role_name)}>
                              {personData.role}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="small text-muted">Role ID</span>
                          <p className="mb-0 text-dark">{personData.role_id || "N/A"}</p>
                        </div>
                        {(personData.has_teacher_role || personData.has_parent_role) && (
                          <div>
                            <span className="small text-muted">Actions</span>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleOpenRoleModal}
                            >
                              <i className="bi bi-pencil me-1"></i>
                              Edit Roles
                            </Button>
                          </div>
                        )}
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
                          <p className="mb-0 text-dark">{personData.phone || "Not provided"}</p>
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
          </Tabs>
        </Card.Body>
      </Card>

      {/* Role Update Modal with Checkboxes */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update User Roles</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Select Roles</Form.Label>
              <div className="border rounded p-3 bg-light">
                {editableRoles.map((role) => {
                  const isChecked = selectedRoles.includes(role.roleid);
                  return (
                    <Form.Check
                      key={role.roleid}
                      type="checkbox"
                      id={`role-${role.roleid}`}
                      label={
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="fw-medium">{role.display_name}</span>
                          <Badge bg={role.role_name === "teacher" ? "primary" : "success"} className="fs-7">
                            {role.role_name}
                          </Badge>
                        </div>
                      }
                      checked={isChecked}
                      onChange={(e) => handleRoleCheckboxChange(role.roleid, e.target.checked)}
                      className="mb-2 p-2 rounded hover-bg"
                    />
                  );
                })}
              </div>
              <Form.Text className="text-muted">
                You can assign both Teacher and Parent roles to the same user.
              </Form.Text>
            </Form.Group>
            
            <div className="alert alert-info">
              <small>
                <i className="bi bi-info-circle me-2"></i>
                <strong>Current role:</strong> {personData.role}
                <br />
                Changing roles will affect the user's permissions and access rights.
              </small>
            </div>
            
            {selectedRoles.length > 0 && (
              <div className="alert alert-success">
                <small>
                  <i className="bi bi-check-circle me-2"></i>
                  <strong>Selected roles:</strong> {selectedRoles.map(roleId => {
                    const role = editableRoles.find(r => r.roleid === roleId);
                    return role ? role.display_name : `Role ${roleId}`;
                  }).join(" & ")}
                </small>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowRoleModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRoleUpdate}
            disabled={selectedRoles.length === 0}
          >
            <i className="bi bi-check-lg me-2"></i>
            Update Roles
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PersonDetails;