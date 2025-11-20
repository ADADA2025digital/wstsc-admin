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
  Modal,
  Button,
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
  const [updatingRole, setUpdatingRole] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);

  useEffect(() => {
    console.log("🔍 useEffect triggered", {
      locationState: location.state,
      name: name
    });
    
    if (location.state?.personData) {
      console.log("📍 Using location.state.personData:", location.state.personData);
      const transformedData = transformPersonData(location.state.personData);
      setPersonData(transformedData);
      setLoading(false);
    } else {
      fetchPersonDetails();
    }
    // Fetch available roles when component mounts
    fetchAvailableRoles();
  }, [name, location.state]);

  const fetchPersonDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const personId = location.state?.personId;
      
      console.log("🆔 Person ID from location state:", personId);

      if (!personId) {
        setError("Person ID not found");
        return;
      }

      console.log("🔄 Fetching person details for ID:", personId);
      const response = await api.get(`/admin/users/${personId}`);
      console.log("📥 Person details API response:", response);
      
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
      console.error("❌ Error fetching person details:", err);
      console.error("❌ Error details:", {
        message: err.message,
        response: err.response,
        config: err.config
      });
      setError("Failed to fetch person details: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch available roles from API
  const fetchAvailableRoles = async () => {
    try {
      console.log("🔄 Fetching available roles...");
      // Try different possible endpoints for roles
      const endpoints = [
        '/admin/roles',
        '/api/admin/roles',
        '/roles'
      ];

      let rolesResponse = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Trying roles endpoint: ${endpoint}`);
          rolesResponse = await api.get(endpoint);
          console.log(`✅ Roles API response from ${endpoint}:`, rolesResponse);
          break; // If successful, break the loop
        } catch (err) {
          console.log(`❌ Failed to fetch from ${endpoint}:`, err.message);
          continue;
        }
      }

      if (rolesResponse && rolesResponse.data.success) {
        const roles = rolesResponse.data.data.roles || rolesResponse.data.data;
        console.log("✅ Available roles:", roles);
        setAvailableRoles(roles);
      } else {
        // If no roles endpoint is available, use default roles
        console.log("⚠️ Using default roles as fallback");
        const defaultRoles = [
          { roleid: 1, role_name: "admin", display_name: "Admin" },
          { roleid: 2, role_name: "staff", display_name: "Staff" },
          { roleid: 3, role_name: "teacher", display_name: "Teacher" },
          { roleid: 4, role_name: "parent", display_name: "Parent" },
          { roleid: 5, role_name: "student", display_name: "Student" }
        ];
        setAvailableRoles(defaultRoles);
      }
    } catch (err) {
      console.error("❌ Error fetching roles:", err);
      console.error("❌ Roles error details:", {
        message: err.message,
        response: err.response,
        config: err.config
      });
      // Use default roles as fallback
      const defaultRoles = [
        { roleid: 1, role_name: "admin", display_name: "Admin" },
        { roleid: 2, role_name: "staff", display_name: "Staff" },
        { roleid: 3, role_name: "teacher", display_name: "Teacher" },
        { roleid: 4, role_name: "parent", display_name: "Parent" },
        { roleid: 5, role_name: "student", display_name: "Student" }
      ];
      setAvailableRoles(defaultRoles);
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
      console.error("❌ No person data available");
      return;
    }

    const personId = personData.person_id || personData.id;

    if (!personId) {
      console.error("❌ No valid person ID found in person data");
      alert("Cannot update status: Person ID not available");
      return;
    }

    try {
      setUpdatingStatus(true);
      
      console.log("🔄 Toggling status for person ID:", personId, "to:", newStatus);
      const response = await api.patch(`/admin/users/${personId}/toggle-status`, {
        is_active: newStatus
      });
      
      console.log("✅ Status update response:", response);
      
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
      console.error("❌ Status update error details:", {
        message: err.message,
        response: err.response,
        config: err.config
      });
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

  // Function to open role update modal
  const handleOpenRoleModal = () => {
    console.log("📝 Opening role modal, current role_id:", personData.role_id);
    setSelectedRole(personData.role_id?.toString() || "");
    setShowRoleModal(true);
  };

  // Function to update user role
  const handleRoleUpdate = async () => {
    console.log("🔄 Starting role update process...");
    
    if (!personData) {
      console.error("❌ No person data available");
      return;
    }

    if (!selectedRole) {
      console.error("❌ No role selected");
      alert("Please select a role");
      return;
    }

    const personId = personData.person_id || personData.id;

    if (!personId) {
      console.error("❌ No valid person ID found in person data");
      alert("Cannot update role: Person ID not available");
      return;
    }

    console.log("🎯 Role update details:", {
      personId: personId,
      selectedRole: selectedRole,
      selectedRoleInt: parseInt(selectedRole),
      availableRoles: availableRoles
    });

    try {
      setUpdatingRole(true);
      
      console.log("🔄 Updating role for person ID:", personId, "to role ID:", selectedRole);
      
      // Try different possible endpoints for role update
      const endpoints = [
        `/admin/persons/${personId}`,
        `/api/admin/persons/${personId}`,
        `/admin/users/${personId}/role`,
        `/api/admin/users/${personId}/role`
      ];

      let updateResponse = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Trying role update endpoint: ${endpoint}`);
          updateResponse = await api.put(endpoint, {
            role_id: parseInt(selectedRole)
          });
          console.log(`✅ Role update successful from ${endpoint}:`, updateResponse);
          break; // If successful, break the loop
        } catch (err) {
          console.log(`❌ Failed to update role via ${endpoint}:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!updateResponse && lastError) {
        throw lastError;
      }

      if (updateResponse.data.success) {
        // Find the selected role details
        const selectedRoleData = availableRoles.find(role => role.roleid === parseInt(selectedRole));
        console.log("✅ Selected role data:", selectedRoleData);
        
        // Update person data with new role
        setPersonData(prevData => ({
          ...prevData,
          role: selectedRoleData?.display_name || "Unknown Role",
          role_name: selectedRoleData?.role_name || "unknown",
          role_id: parseInt(selectedRole),
          role_data: selectedRoleData || {}
        }));
        
        setShowRoleModal(false);
        console.log("✅ Role updated successfully to:", selectedRoleData?.display_name);
        
        // Show success message
        alert("Role updated successfully!");
      } else {
        throw new Error(updateResponse.data.message || "Failed to update role");
      }
    } catch (err) {
      console.error("❌ Error updating role:", err);
      console.error("❌ Role update error details:", {
        message: err.message,
        response: err.response,
        config: err.config,
        endpoint: err.config?.url
      });
      alert("Failed to update role: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingRole(false);
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
  console.log("🎯 Available roles:", availableRoles);

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
                <div className="d-flex align-items-center gap-2">
                  <Badge className={getRoleBadgeClass(personData.role_name)}>
                    {personData.role}
                  </Badge>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={handleOpenRoleModal}
                    className="py-0"
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>
                </div>
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
                          <div className="d-flex align-items-center gap-2">
                            <Badge className={getRoleBadgeClass(personData.role_name)}>
                              {personData.role}
                            </Badge>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={handleOpenRoleModal}
                            >
                              <i className="bi bi-pencil me-1"></i>
                              Change
                            </Button>
                          </div>
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
                        <div>
                          <span className="small text-muted">Role ID</span>
                          <p className="mb-0 text-dark">{personData.role_id}</p>
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
                        <Col md={4}>
                          <div className="d-flex flex-column">
                            <span className="small text-muted">Role ID</span>
                            <span className="fs-6 text-dark">{personData.role_id}</span>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="d-flex flex-column">
                            <span className="small text-muted">Actions</span>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={handleOpenRoleModal}
                            >
                              <i className="bi bi-pencil me-1"></i>
                              Update Role
                            </Button>
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

      {/* Role Update Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Role</Form.Label>
              <Form.Select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="">Choose a role...</option>
                {availableRoles.map((role) => (
                  <option key={role.roleid} value={role.roleid}>
                    {role.display_name} ({role.role_name}) - ID: {role.roleid}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <div className="alert alert-info">
              <small>
                <i className="bi bi-info-circle me-2"></i>
                Changing the role will affect the user's permissions and access rights.
                Current role: {personData.role} (ID: {personData.role_id})
              </small>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowRoleModal(false)}
            disabled={updatingRole}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleRoleUpdate}
            disabled={!selectedRole || updatingRole}
          >
            {updatingRole ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Update Role
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PersonDetails;