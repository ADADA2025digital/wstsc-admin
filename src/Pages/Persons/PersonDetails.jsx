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
  const [roleLoading, setRoleLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Person data state
  const [personData, setPersonData] = useState(null);
  // All available roles state
  const [allRoles, setAllRoles] = useState([]);

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

  // Fetch all available roles from API
  const fetchAllRoles = async () => {
    try {
      setRolesLoading(true);
      console.log("Fetching all roles from API...");

      const response = await api.get("/roles");

      if (response.data.success) {
        const roles = response.data.data || [];
        console.log("All roles fetched:", roles);

        // Filter out staff and student roles as requested
        const filteredRoles = roles.filter(
          (role) => role.role_name !== "staff" && role.role_name !== "student"
        );

        console.log(
          "Filtered roles (excluding staff and student):",
          filteredRoles
        );
        setAllRoles(filteredRoles);
      } else {
        console.error("Failed to fetch roles:", response.data.message);
        setError("Failed to load available roles");
      }
    } catch (err) {
      console.error("Error fetching roles:", err);
      setError(err.response?.data?.message || "Failed to load available roles");
    } finally {
      setRolesLoading(false);
    }
  };

  // Debug function to analyze API response structure
  const debugApiResponse = (apiData) => {
    console.log("=== API RESPONSE STRUCTURE DEBUG ===");
    console.log("Full API Data:", apiData);

    if (apiData.user) {
      console.log("User object keys:", Object.keys(apiData.user));
      console.log("User object:", apiData.user);

      if (apiData.user.all_roles) {
        console.log("all_roles:", apiData.user.all_roles);
      } else {
        console.log("No all_roles found in user object");
      }

      if (apiData.user.primary_role) {
        console.log("primary_role:", apiData.user.primary_role);
      } else {
        console.log("No primary_role found in user object");
      }

      if (apiData.user.roles) {
        console.log("roles:", apiData.user.roles);
      } else {
        console.log("No roles found in user object");
      }
    } else {
      console.log("No user object found in API response");
    }
    console.log("=== END DEBUG ===");
  };

  // Fetch person details from API
  const fetchPersonDetails = async (personId) => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching person details for ID:", personId);

      // Try to use a specific endpoint first, fall back to list endpoint
      try {
        // If your backend has a specific endpoint for single person
        const response = await api.get(`/admin/persons/${personId}`);

        if (response.data.success) {
          console.log("Found person via specific endpoint");
          transformPersonData(response.data.data.person);
        } else {
          setError(response.data.message || "Failed to fetch person details");
        }
      } catch (endpointError) {
        console.log(
          "Specific endpoint failed, trying list endpoint:",
          endpointError
        );

        // Fallback to list endpoint
        const response = await api.get("/admin/persons");

        if (response.data.success) {
          const persons = response.data.data.persons || [];
          const person = persons.find((p) => p.peid === personId);

          if (person) {
            console.log("Found person via list endpoint");
            transformPersonData(person);
          } else {
            setError("Person not found");
            setPersonData(null);
          }
        } else {
          setError(response.data.message || "Failed to fetch person details");
        }
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
    console.log("=== transformPersonData START ===");
    console.log("Full API Data:", apiData);

    // Debug the API response structure
    debugApiResponse(apiData);

    const user = apiData.user || {};

    // CORRECTED: Extract roles from the correct locations in API response
    const allRoles = user.all_roles || []; // This contains all assigned roles
    const primaryRole = user.primary_role || {}; // Primary role object

    console.log("User object:", user);
    console.log("All roles array:", allRoles);
    console.log("Primary role object:", primaryRole);

    // Combine primary role with all roles to get complete role list
    let effectiveRoles = [...allRoles];

    // Add primary role if it's not already in the all_roles array
    if (
      primaryRole &&
      primaryRole.roleid &&
      !effectiveRoles.some((role) => role.roleid === primaryRole.roleid)
    ) {
      effectiveRoles.push(primaryRole);
    }

    console.log("Combined effective roles:", effectiveRoles);

    // If no roles found, try to create from available data
    if (effectiveRoles.length === 0) {
      console.log(
        "No roles found in all_roles or primary_role, checking alternative locations"
      );

      // Fallback: check if there's any role information in other fields
      if (user.role_name || user.role_id) {
        effectiveRoles = [
          {
            roleid: user.role_id || 0,
            role_name: user.role_name || "unknown",
            display_name: user.role_display_name || "Unknown",
          },
        ];
      }
    }

    console.log("Final effective roles to use:", effectiveRoles);

    // Log each role in the effective roles array
    if (effectiveRoles.length > 0) {
      console.log("Detailed roles analysis:");
      effectiveRoles.forEach((role, index) => {
        console.log(`Role ${index + 1}:`, {
          roleid: role.roleid,
          role_name: role.role_name,
          display_name: role.display_name,
          description: role.description,
        });
      });
    } else {
      console.log("No roles found in any format");
    }

    // Determine current roles from the effective roles array
    const hasTeacherRole = effectiveRoles.some(
      (role) =>
        role.role_name === "teacher" ||
        role.roleid === 3 ||
        role.display_name === "Teacher"
    );
    const hasParentRole = effectiveRoles.some(
      (role) =>
        role.role_name === "parent" ||
        role.roleid === 4 ||
        role.display_name === "Parent"
    );
    const hasAdminRole = effectiveRoles.some(
      (role) => role.role_name === "admin"
    );
    const hasStaffRole = effectiveRoles.some(
      (role) => role.role_name === "staff"
    );
    const hasStudentRole = effectiveRoles.some(
      (role) => role.role_name === "student"
    );
    const hasPrincipalRole = effectiveRoles.some(
      (role) => role.role_name === "principal"
    );
    const hasCommitteeRole = effectiveRoles.some(
      (role) => role.role_name === "committee"
    );
    const hasVicePrincipalRole = effectiveRoles.some(
      (role) => role.role_name === "vice_principal"
    );
    const hasVolunteerRole = effectiveRoles.some(
      (role) => role.role_name === "volunteer"
    );

    console.log("Role flags:", {
      hasTeacherRole,
      hasParentRole,
      hasAdminRole,
      hasStaffRole,
      hasStudentRole,
      hasPrincipalRole,
      hasCommitteeRole,
      hasVicePrincipalRole,
      hasVolunteerRole,
    });

    // Get role IDs from the effective roles array
    const roleIds = effectiveRoles.map((role) => role.roleid);
    console.log("Extracted role IDs:", roleIds);

    // Create role display text
    let roleDisplay = "";
    const activeRoles = [];

    if (hasAdminRole) activeRoles.push("Administrator");
    if (hasPrincipalRole) activeRoles.push("Principal");
    if (hasVicePrincipalRole) activeRoles.push("Vice Principal");
    if (hasTeacherRole) activeRoles.push("Teacher");
    if (hasParentRole) activeRoles.push("Parent");
    if (hasCommitteeRole) activeRoles.push("Committee");
    if (hasVolunteerRole) activeRoles.push("Volunteer");
    if (hasStaffRole) activeRoles.push("Staff");
    if (hasStudentRole) activeRoles.push("Student");

    roleDisplay = activeRoles.join(" & ") || "No Role";
    console.log("Role display text:", roleDisplay);

    // Determine primary role name for badge styling
    let primaryRoleName = "unknown";
    if (hasAdminRole) primaryRoleName = "admin";
    else if (hasPrincipalRole) primaryRoleName = "principal";
    else if (hasVicePrincipalRole) primaryRoleName = "vice_principal";
    else if (hasTeacherRole) primaryRoleName = "teacher";
    else if (hasParentRole) primaryRoleName = "parent";
    else if (hasCommitteeRole) primaryRoleName = "committee";
    else if (hasVolunteerRole) primaryRoleName = "volunteer";
    else if (hasStaffRole) primaryRoleName = "staff";
    else if (hasStudentRole) primaryRoleName = "student";

    console.log("Primary role name for styling:", primaryRoleName);

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
      role: roleDisplay,
      role_name: primaryRoleName,
      role_ids: roleIds,

      // Personal details
      gender: apiData.person_gender,
      dob: apiData.person_dob,
      nationality: apiData.person_nationality,
      marital_status: apiData.person_marital_status,
      occupation: apiData.person_occupation,
      alternate_phone: apiData.person_alternate_phone,

      // Timestamps
      created_at: apiData.created_at,
      updated_at: apiData.updated_at,
      last_login: user.last_login,

      // Role flags for UI
      has_teacher_role: hasTeacherRole,
      has_parent_role: hasParentRole,
      has_admin_role: hasAdminRole,
      has_staff_role: hasStaffRole,
      has_student_role: hasStudentRole,
      has_principal_role: hasPrincipalRole,
      has_committee_role: hasCommitteeRole,
      has_vice_principal_role: hasVicePrincipalRole,
      has_volunteer_role: hasVolunteerRole,

      // Store original API data for debugging
      originalData: apiData,
    };

    console.log("Final transformed data:", transformedData);
    console.log("=== transformPersonData END ===");

    setPersonData(transformedData);
  };

  // Fetch data on component mount
  useEffect(() => {
    const personId = getPersonId();
    if (personId) {
      fetchPersonDetails(personId);
      fetchAllRoles(); // Fetch all available roles
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
        setPersonData((prev) => ({
          ...prev,
          is_active: updatedPerson.is_active,
          status: updatedPerson.is_active ? "Active" : "Inactive",
        }));
        setSuccessMessage(
          `Status updated to ${updatedPerson.is_active ? "Active" : "Inactive"}`
        );

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

    console.log("=== handleOpenRoleModal START ===");
    console.log("Current personData:", personData);

    // Get current roles from personData - use role_ids if available
    let initialSelectedRoles = [];

    if (personData.role_ids && personData.role_ids.length > 0) {
      initialSelectedRoles = [...personData.role_ids];
      console.log("Using role_ids from personData:", initialSelectedRoles);
    } else {
      // Fallback: determine from role flags
      console.log("No role_ids found, falling back to role flags");
      if (personData.has_admin_role) initialSelectedRoles.push(1);
      if (personData.has_principal_role) initialSelectedRoles.push(6);
      if (personData.has_vice_principal_role) initialSelectedRoles.push(8);
      if (personData.has_teacher_role) initialSelectedRoles.push(3);
      if (personData.has_parent_role) initialSelectedRoles.push(4);
      if (personData.has_committee_role) initialSelectedRoles.push(7);
      if (personData.has_volunteer_role) initialSelectedRoles.push(9);
    }

    console.log("Initial selected roles for modal:", initialSelectedRoles);
    setSelectedRoles(initialSelectedRoles);
    setShowRoleModal(true);

    console.log("=== handleOpenRoleModal END ===");
  };

  const handleRoleCheckboxChange = (roleId, isChecked) => {
    console.log(`Role checkbox changed: ${roleId}, checked: ${isChecked}`);
    if (isChecked) {
      setSelectedRoles((prev) => [...prev, roleId]);
    } else {
      setSelectedRoles((prev) => prev.filter((id) => id !== roleId));
    }
    console.log("Updated selectedRoles:", selectedRoles);
  };

  const handleRoleUpdate = async () => {
    try {
      const personId = getPersonId();
      if (!personId) {
        setError("No person ID available");
        return;
      }

      setRoleLoading(true);
      setError("");

      console.log("=== handleRoleUpdate START ===");
      console.log("Updating roles for person:", personId);
      console.log("Selected roles to update:", selectedRoles);

      // Make the actual API call to update roles
      const response = await api.put(`/admin/persons/${personId}`, {
        role_id: selectedRoles, // This matches what your backend expects
      });

      console.log("API Response:", response.data);

      if (response.data.success) {
        // Update local state with the response data
        const updatedPerson = response.data.data.person;
        console.log("Updated person data from API:", updatedPerson);

        transformPersonData(updatedPerson); // This will update the state with fresh data

        setSuccessMessage("Roles updated successfully");
        setShowRoleModal(false);

        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } else {
        throw new Error(response.data.message || "Failed to update roles");
      }

      console.log("=== handleRoleUpdate END ===");
    } catch (err) {
      console.error("Error updating roles:", err);
      console.log("Error response:", err.response);
      setError(err.response?.data?.message || "Failed to update roles");
    } finally {
      setRoleLoading(false);
    }
  };

  // Helper function to get badge class based on role
  const getRoleBadgeClass = (roleName) => {
    switch (roleName) {
      case "admin":
        return "bg-danger";
      case "principal":
        return "bg-purple";
      case "vice_principal":
        return "bg-indigo";
      case "teacher":
        return "bg-primary";
      case "staff":
        return "bg-warning";
      case "parent":
        return "bg-success";
      case "student":
        return "bg-info";
      case "committee":
        return "bg-dark";
      case "volunteer":
        return "bg-secondary";
      default:
        return "bg-secondary";
    }
  };

  // Helper function to get role display name from role ID
  const getRoleDisplayName = (roleId) => {
    const role = allRoles.find((r) => r.roleid === roleId);
    return role ? role.display_name : `Role ${roleId}`;
  };

  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
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
        <Alert
          variant="danger"
          className="d-flex justify-content-between align-items-center"
        >
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
        <ButtonGlobal
          onClick={handleBack}
          className="btn btn-outline-secondary"
        >
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
          <p className="text-muted mb-0">
            Viewing details for: {personData.full_name}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <Button
            variant="outline-secondary"
            onClick={() => {
              const personId = getPersonId();
              if (personId) {
                fetchPersonDetails(personId);
                fetchAllRoles();
              }
            }}
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
                <span className="fs-6 text-dark">
                  {personData.email || "—"}
                </span>
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
                          <p className="mb-0 fw-medium text-dark">
                            {personData.first_name}
                          </p>
                        </div>
                        <div>
                          <span className="small text-muted">Last Name</span>
                          <p className="mb-0 fw-medium text-dark">
                            {personData.last_name}
                          </p>
                        </div>
                        {personData.middle_name && (
                          <div>
                            <span className="small text-muted">
                              Middle Name
                            </span>
                            <p className="mb-0 fw-medium text-dark">
                              {personData.middle_name}
                            </p>
                          </div>
                        )}
                        <div>
                          <span className="small text-muted">Gender</span>
                          <p className="mb-0 fw-medium text-dark">
                            {personData.gender || "Not specified"}
                          </p>
                        </div>
                        {personData.dob && (
                          <div>
                            <span className="small text-muted">
                              Date of Birth
                            </span>
                            <p className="mb-0 fw-medium text-dark">
                              {formatDateToMMDDYYYY(personData.dob)}
                            </p>
                          </div>
                        )}
                        {personData.nationality && (
                          <div>
                            <span className="small text-muted">
                              Nationality
                            </span>
                            <p className="mb-0 fw-medium text-dark">
                              {personData.nationality}
                            </p>
                          </div>
                        )}
                        {personData.marital_status && (
                          <div>
                            <span className="small text-muted">
                              Marital Status
                            </span>
                            <p className="mb-0 fw-medium text-dark">
                              {personData.marital_status}
                            </p>
                          </div>
                        )}
                        {personData.occupation && (
                          <div>
                            <span className="small text-muted">Occupation</span>
                            <p className="mb-0 fw-medium text-dark">
                              {personData.occupation}
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
                            <Badge
                              className={getRoleBadgeClass(
                                personData.role_name
                              )}
                            >
                              {personData.role}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="small text-muted">Role Details</span>
                          <div className="small text-muted">
                            {personData.has_admin_role && (
                              <div>• Administrator</div>
                            )}
                            {personData.has_principal_role && (
                              <div>• Principal</div>
                            )}
                            {personData.has_vice_principal_role && (
                              <div>• Vice Principal</div>
                            )}
                            {personData.has_teacher_role && (
                              <div>• Teacher</div>
                            )}
                            {personData.has_parent_role && <div>• Parent</div>}
                            {personData.has_committee_role && (
                              <div>• Committee</div>
                            )}
                            {personData.has_volunteer_role && (
                              <div>• Volunteer</div>
                            )}
                            {personData.has_staff_role && <div>• Staff</div>}
                            {personData.has_student_role && (
                              <div>• Student</div>
                            )}
                            {!personData.has_admin_role &&
                              !personData.has_principal_role &&
                              !personData.has_vice_principal_role &&
                              !personData.has_teacher_role &&
                              !personData.has_parent_role &&
                              !personData.has_committee_role &&
                              !personData.has_volunteer_role &&
                              !personData.has_staff_role &&
                              !personData.has_student_role && (
                                <div>• No roles assigned</div>
                              )}
                          </div>
                        </div>
                        <div className="d-flex gap-3">
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
                          <span className="small text-muted">
                            Email Address
                          </span>
                          <p className="mb-0 fw-medium text-dark text-truncate">
                            {personData.email || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small text-muted">Phone Number</span>
                          <p className="mb-0 text-dark">
                            {personData.phone || "Not provided"}
                          </p>
                        </div>
                        {personData.alternate_phone && (
                          <div>
                            <span className="small text-muted">
                              Alternate Phone
                            </span>
                            <p className="mb-0 text-dark">
                              {personData.alternate_phone}
                            </p>
                          </div>
                        )}
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard title="System Information" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        {personData.created_at && (
                          <div>
                            <span className="small text-muted">
                              Account Created
                            </span>
                            <p className="mb-0 text-dark">
                              {formatDateToMMDDYYYY(personData.created_at)}
                            </p>
                          </div>
                        )}
                        {personData.updated_at && (
                          <div>
                            <span className="small text-muted">
                              Last Updated
                            </span>
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

      {/* Role Update Modal */}
      <Modal
        show={showRoleModal}
        onHide={() => setShowRoleModal(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-badge text-primary me-2"></i>
            Update User Roles
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {rolesLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Loading available roles...</p>
            </div>
          ) : (
            <Form>
              <div className="row">
                <div className="col-12">
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-shield-check me-2"></i>
                    Role Assignment
                  </h6>
                </div>

                <div className="col-12 mb-3">
                  <Form.Label className="form-label">
                    Roles <span className="text-danger">*</span>
                    <small className="text-muted ms-2">
                      (Select one or more roles)
                    </small>
                  </Form.Label>
                  <div
                    className="roles-checkbox-container"
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      border: "1px solid #dee2e6",
                      borderRadius: "0.375rem",
                      padding: "1rem",
                    }}
                  >
                    {allRoles.length > 0 ? (
                      <div className="row">
                        {allRoles.map((role) => {
                          const isChecked = selectedRoles.includes(role.roleid);
                          return (
                            <div key={role.roleid} className="col-md-6 mb-2">
                              <Form.Check
                                type="checkbox"
                                id={`role-${role.roleid}`}
                                label={role.display_name}
                                checked={isChecked}
                                onChange={(e) =>
                                  handleRoleCheckboxChange(
                                    role.roleid,
                                    e.target.checked
                                  )
                                }
                                disabled={roleLoading}
                                className="form-check"
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-muted text-center">
                        No roles available
                      </div>
                    )}
                  </div>
                  {selectedRoles.length > 0 && (
                    <div className="mt-2">
                      <small className="text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        {selectedRoles.length} role(s) selected
                      </small>
                    </div>
                  )}
                </div>

                <div className="col-12 mt-3">
                  <h6 className="text-primary mb-3">
                    <i className="bi bi-info-circle me-2"></i>
                    Current Status
                  </h6>
                  <div className="alert alert-info">
                    <small>
                      <i className="bi bi-person me-2"></i>
                      <strong>User:</strong> {personData.full_name}
                      <br />
                      <i className="bi bi-shield me-2"></i>
                      <strong>Current roles:</strong> {personData.role}
                      <br />
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Changing roles will affect the user's permissions and
                      access rights.
                    </small>
                  </div>
                </div>
              </div>

              {selectedRoles.length > 0 && (
                <div className="alert alert-success mt-3">
                  <small>
                    <i className="bi bi-check-circle me-2"></i>
                    <strong>Selected roles:</strong>{" "}
                    {selectedRoles
                      .map((roleId) => getRoleDisplayName(roleId))
                      .join(", ")}
                  </small>
                </div>
              )}
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowRoleModal(false)}
            disabled={roleLoading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleRoleUpdate}
            disabled={selectedRoles.length === 0 || roleLoading || rolesLoading}
            className="custom-btn"
          >
            {roleLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-lg me-2"></i>
                Update Roles
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add some custom CSS for role badges */}
      <style jsx>{`
        .bg-purple {
          background-color: #6f42c1 !important;
        }
        .bg-indigo {
          background-color: #6610f2 !important;
        }
        .hover-bg:hover {
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default PersonDetails;