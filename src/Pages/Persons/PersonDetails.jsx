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
      name: name,
      hasPersonData: !!location.state?.personData,
      hasPersonId: !!location.state?.personId
    });
    
    // Check if we have valid data from navigation
    if (location.state?.personData) {
      console.log("📍 Using location.state.personData:", location.state.personData);
      try {
        const transformedData = transformPersonData(location.state.personData);
        setPersonData(transformedData);
        setLoading(false);
      } catch (error) {
        console.error("❌ Error transforming person data:", error);
        // If transformation fails, try to fetch from API
        fetchPersonDetails();
      }
    } else {
      console.log("🔄 No location state data, fetching from API...");
      fetchPersonDetails();
    }
    
    fetchAvailableRoles();
  }, [name, location.state]);

  const fetchPersonDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const personId = location.state?.personId;
      const personDataFromState = location.state?.personData;

      console.log("🆔 Fetching details with:", {
        personId,
        hasPersonData: !!personDataFromState
      });

      // If we have person data but no ID, try to extract ID from the data
      let actualPersonId = personId;
      if (!actualPersonId && personDataFromState) {
        actualPersonId = personDataFromState.peid || personDataFromState.id;
        console.log("🆔 Extracted personId from data:", actualPersonId);
      }

      if (!actualPersonId) {
        setError("Person ID not found. Please go back and try again.");
        setLoading(false);
        return;
      }

      console.log("🔄 Fetching person details for ID:", actualPersonId);
      
      // Try different endpoints to find the correct one
      const endpoints = [
        `/admin/persons/${actualPersonId}`,
        `/admin/users/${actualPersonId}`,
        `/api/admin/persons/${actualPersonId}`
      ];

      let response = null;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);
          response = await api.get(endpoint);
          console.log(`✅ Success from ${endpoint}:`, response.data);
          break;
        } catch (err) {
          console.log(`❌ Failed for ${endpoint}:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!response && lastError) {
        throw lastError;
      }

      if (response.data.success) {
        const apiData = response.data.data.person || response.data.data.user || response.data.data;
        console.log("📥 API Response data:", apiData);
        
        if (!apiData) {
          throw new Error("No person data found in response");
        }
        
        const transformedData = transformPersonData(apiData);
        setPersonData(transformedData);
        console.log("✅ Transformed person data:", transformedData);
      } else {
        throw new Error(response.data.message || "Failed to fetch person details");
      }
    } catch (err) {
      console.error("❌ Error fetching person details:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch person details";
      setError(errorMsg);
      
      // If we have state data but API failed, at least show what we have
      if (location.state?.personData) {
        console.log("🔄 Falling back to location state data due to API error");
        try {
          const transformedData = transformPersonData(location.state.personData);
          setPersonData(transformedData);
          setError(`API Error: ${errorMsg}. Showing cached data.`);
        } catch (transformError) {
          console.error("❌ Also failed to transform state data:", transformError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch available roles from API
  const fetchAvailableRoles = async () => {
    try {
      console.log("🔄 Fetching available roles...");
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
          break;
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

  // Improved transform function
  const transformPersonData = (apiData) => {
    console.log("🔍 Transforming person data:", apiData);
    
    if (!apiData) {
      throw new Error("No data provided for transformation");
    }

    // Handle different API response structures
    const data = apiData.originalData || apiData;
    const userData = data.user || data;
    
    // Extract name - handle multiple scenarios
    let fullName = "";
    if (data.full_name) {
      fullName = data.full_name;
    } else if (userData.name) {
      fullName = userData.name;
    } else if (data.person_first_name && data.person_last_name) {
      fullName = `${data.person_first_name} ${data.person_last_name}`;
    } else {
      fullName = "Unknown Name";
    }

    // Extract name parts from full name
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : "";
    
    // Determine status
    const status = userData.status || data.status;
    const isActive = status === "active" || data.is_active === true;
    const statusDisplay = isActive ? "Active" : "Inactive";

    // Extract role information
    const roleData = userData?.role || data.primary_role || data.role || {};
    const roleName = roleData.role_name || "unknown";
    const roleDisplay = roleData.display_name || "Unknown Role";
    const roleId = roleData.roleid;

    // Get IDs - try multiple possible fields
    const id = data.peid || userData.uid || data.id || data.user_id;
    
    if (!id) {
      console.warn("⚠️ No ID found in person data:", data);
    }

    const transformed = {
      id: id,
      user_id: userData.uid || id,
      person_id: id,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      email: userData.email || data.person_email || data.email || "",
      phone: data.person_phone || data.phone || "Not provided",
      status: statusDisplay,
      is_active: isActive,
      role: roleDisplay,
      role_name: roleName,
      role_data: roleData,
      role_id: roleId,
      created_at: data.created_at || userData.created_at,
      updated_at: data.updated_at || userData.updated_at,
      last_login: userData.last_login,
      profile_picture: data.profile_picture || userData.profile_picture,
      // Store original for debugging
      _original: data
    };

    console.log("✅ Transformed data:", transformed);
    return transformed;
  };

  // Function to refetch person details
  const refetchPersonDetails = async (personId) => {
    try {
      console.log("🔄 Refetching updated person details for ID:", personId);
      
      let response;
      try {
        response = await api.get(`/admin/persons/${personId}`);
      } catch (err) {
        const formattedId = `P${personId.toString().padStart(5, '0')}`;
        console.log(`🔄 Trying with formatted ID: ${formattedId}`);
        response = await api.get(`/admin/persons/${formattedId}`);
      }
      
      if (response.data.success) {
        const apiData = response.data.data.person;
        const transformedData = transformPersonData(apiData);
        setPersonData(transformedData);
        console.log("✅ Refetched and updated person data:", transformedData);
        return transformedData;
      }
    } catch (err) {
      console.error("❌ Error refetching person details:", err);
      throw err;
    }
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
      const response = await api.put(`/admin/persons/${personId}/toggle-status`, {
        is_active: newStatus
      });
      
      console.log("✅ Status update response:", response);
      
      if (response.data.success) {
        await refetchPersonDetails(personId);
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
        is_active: !newStatus
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
    console.log("🔄 ========== STARTING ROLE UPDATE PROCESS ==========");
    
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
    let formattedPersonId = personId;
    if (typeof personId === 'number' || !personId.startsWith('P')) {
      formattedPersonId = `P${personId.toString().padStart(5, '0')}`;
    }

    console.log("🎯 ROLE UPDATE DETAILS:", {
      originalPersonId: personId,
      formattedPersonId: formattedPersonId,
      selectedRole: selectedRole,
      selectedRoleInt: parseInt(selectedRole),
      personData: personData
    });

    try {
      setUpdatingRole(true);
      
      console.log("🔄 Updating role for person ID:", formattedPersonId, "to role ID:", selectedRole);
      
      const endpoints = [
        `/api/admin/persons/${formattedPersonId}`,
        `/admin/persons/${formattedPersonId}`,
      ];

      console.log("🔍 ENDPOINTS TO TRY:", endpoints);

      let updateResponse = null;
      let lastError = null;
      let successfulEndpoint = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`\n🔍 TRYING ENDPOINT: ${endpoint}`);
          updateResponse = await api.put(endpoint, {
            role_id: parseInt(selectedRole)
          });
          
          successfulEndpoint = endpoint;
          console.log(`✅ SUCCESS from ${endpoint}:`, updateResponse);
          console.log(`✅ RESPONSE DATA:`, updateResponse.data);
          break;
        } catch (err) {
          console.log(`❌ FAILED for ${endpoint}:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!updateResponse && lastError) {
        console.log("💥 ALL ENDPOINTS FAILED. LAST ERROR:", lastError);
        throw lastError;
      }

      if (updateResponse.data.success) {
        console.log("🎉 ROLE UPDATE SUCCESSFUL!");
        console.log("✅ FULL API RESPONSE:", updateResponse.data);
        
        const updatedPersonData = updateResponse.data.data.person;
        
        if (updatedPersonData && updatedPersonData.user) {
          console.log("✅ UPDATED PERSON DATA FROM API:", updatedPersonData);
          
          const transformedData = {
            id: updatedPersonData.user.uid,
            user_id: updatedPersonData.user.uid,
            person_id: updatedPersonData.user.uid,
            first_name: updatedPersonData.first_name,
            last_name: updatedPersonData.last_name,
            full_name: updatedPersonData.full_name,
            email: updatedPersonData.email,
            phone: updatedPersonData.phone,
            status: updatedPersonData.user.status === "active" ? "Active" : "Inactive",
            is_active: updatedPersonData.is_active,
            role: updatedPersonData.user.role.display_name,
            role_name: updatedPersonData.user.role.role_name,
            role_data: updatedPersonData.user.role,
            role_id: updatedPersonData.user.role.roleid,
            created_at: updatedPersonData.created_at,
            updated_at: updatedPersonData.updated_at,
            last_login: updatedPersonData.user.last_login,
          };
          
          setPersonData(transformedData);
          console.log("✅ UI UPDATED WITH FRESH DATA:", transformedData);
        } else {
          console.log("🔄 Using transform function for updated data");
          const transformedData = transformPersonData(updatedPersonData);
          setPersonData(transformedData);
        }
        
        setShowRoleModal(false);
        console.log("✅ ROLE UPDATE COMPLETE - MODAL CLOSED");
        
        const newRoleName = availableRoles.find(r => r.roleid === parseInt(selectedRole))?.display_name;
        alert(`Role updated successfully! User is now ${newRoleName}`);
      } else {
        console.error("❌ API returned success:false", updateResponse.data);
        throw new Error(updateResponse.data.message || "Failed to update role");
      }
    } catch (err) {
      console.error("💥 FINAL ERROR IN ROLE UPDATE:", err);
      
      let errorMessage = "Failed to update role: ";
      if (err.response?.data?.message) {
        errorMessage += err.response.data.message;
      } else if (err.response?.status === 404) {
        errorMessage += `Endpoint not found (404). Please contact support.`;
      } else if (err.response?.status === 500) {
        errorMessage += "Server error. Please try again later.";
      } else {
        errorMessage += err.message;
      }
      
      alert(errorMessage);
    } finally {
      setUpdatingRole(false);
      console.log("========== ROLE UPDATE PROCESS COMPLETE ==========\n");
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
        <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading person details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !personData) {
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

  // Show warning if we're using fallback data
  if (error && personData) {
    return (
      <div className="container-fluid px-4 py-3">
        <Alert variant="warning" className="mb-4">
          <div className="d-flex align-items-start">
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">Partial Data Loaded</h4>
              <p className="mb-3">{error}</p>
              <p className="mb-3">Some data may be outdated.</p>
              <button onClick={fetchPersonDetails} className="btn btn-primary me-2">
                <i className="bi bi-arrow-clockwise me-2"></i>
                Retry Loading
              </button>
              <button onClick={handleBack} className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Persons
              </button>
            </div>
          </div>
        </Alert>
        
        {/* Render the person data we have */}
        {renderPersonDetails()}
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

  // Main render function
  const renderPersonDetails = () => {
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

  return renderPersonDetails();
};

export default PersonDetails;