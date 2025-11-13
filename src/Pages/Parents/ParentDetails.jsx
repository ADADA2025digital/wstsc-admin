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

const ParentDetails = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [parentData, setParentData] = useState(null);
  const [childrenData, setChildrenData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (location.state?.parentData) {
      const transformedData = transformParentData(location.state.parentData);
      setParentData(transformedData);
      setLoading(false);
      // Fetch children data after parent data is set
      fetchChildrenData(location.state.parentData.user_id);
    } else {
      fetchParentDetails();
    }
  }, [name, location.state]);

  const fetchParentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const parentId = location.state?.parentId || getParentIdFromName(name);
      
      if (!parentId) {
        setError("Parent ID not found");
        return;
      }

      const response = await api.get(`/admin/parents/${parentId}`);
      
      if (response.data.success) {
        const apiData = response.data.data.parent;
        const transformedData = transformParentData(apiData);
        setParentData(transformedData);
        console.log("✅ Fetched and transformed parent data:", transformedData);
        
        // Fetch children data after parent data is set
        fetchChildrenData(apiData.user_id || parentId);
      } else {
        setError(response.data.message || "Failed to fetch parent details");
      }
    } catch (err) {
      console.error("Error fetching parent details:", err);
      setError("Failed to fetch parent details: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Fetch children data from the student-details API
  const fetchChildrenData = async (parentId) => {
    if (!parentId) return;
    
    try {
      setChildrenLoading(true);
      console.log(`Fetching children data for parent ${parentId}...`);
      
      const response = await api.get(`/admin/parent/${parentId}/student-details`);
      
      if (response.data.success) {
        const students = response.data.data.students || [];
        console.log("✅ Fetched children data:", students);
        
        // Transform the children data to match our table structure
        const transformedChildren = students.map(student => {
          const studentInfo = student.student_info;
          const currentClass = student.current_classes?.[0] || {};
          
          return {
            id: studentInfo.enrollment_id,
            enrollment_id: studentInfo.enrollment_id,
            first_name: studentInfo.first_given_name,
            last_name: studentInfo.family_name,
            full_name: `${studentInfo.first_given_name} ${studentInfo.family_name}`,
            preferred_name: studentInfo.preferred_first_name,
            gender: studentInfo.gender,
            date_of_birth: studentInfo.date_of_birth,
            status: studentInfo.status,
            phone_number: studentInfo.phone_number,
            mainstream_school_name: studentInfo.mainstream_school_name,
            enrolment_date: studentInfo.enrolment_date,
            mainstream_enrollment_year: studentInfo.mainstream_enrollment_year,
            class_id: currentClass.class_id,
            class_name: currentClass.class_name,
            is_active: currentClass.is_active,
            teachers: currentClass.teachers || [],
            parent_carers: student.parents_carers || [],
            medical_details: student.medical_details || {},
            emergency_contacts: student.emergency_contacts || [],
            summary: student.summary || {}
          };
        });
        
        setChildrenData(transformedChildren);
      } else {
        console.warn("No children data found or API returned unsuccessful");
        setChildrenData([]);
      }
    } catch (err) {
      console.error("Error fetching children data:", err);
      // Don't set error state for children data - just log it
      setChildrenData([]);
    } finally {
      setChildrenLoading(false);
    }
  };

  // Helper function to transform API data
  const transformParentData = (apiData) => {
    console.log("🔍 Transforming parent data:", apiData);
    
    // Use the direct properties from apiData since they're available
    const isActive = apiData.status === "Active";
    
    console.log("✅ Derived is_active from status:", apiData.status, "->", isActive);
    
    return {
      id: apiData.id,
      user_id: apiData.user_id || apiData.id,
      person_id: apiData.id, // Use parent ID as person ID for the API call
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
      occupation: apiData.occupation || "Parent",
      address: apiData.address || "",
      status: apiData.status || "Active",
      is_active: isActive, // This is now properly set
      profile_picture: apiData.profile_picture,
      role: apiData.role,
      addresses: apiData.addresses || [],
      children: apiData.children || [],
      // Additional fields that might be available
      city: apiData.city || "",
      state: apiData.state || "",
      zip_code: apiData.zip_code || "",
      emergency_contact_name: apiData.emergency_contact_name || "",
      emergency_contact_phone: apiData.emergency_contact_phone || "",
      emergency_contact_relationship: apiData.emergency_contact_relationship || "",
      created_at: apiData.created_at,
      updated_at: apiData.updated_at,
      last_login: apiData.last_login
    };
  };

  const getParentIdFromName = (parentName) => {
    console.log("Need to implement getParentIdFromName for:", parentName);
    return null;
  };

  // Function to toggle parent status
  const handleStatusToggle = async (newStatus) => {
    if (!parentData) {
      console.error("No parent data available");
      return;
    }

    const personId = parentData.person_id || parentData.id;

    if (!personId) {
      console.error("No valid person ID found in parent data");
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
        
        // Update parent data with consistent status
        setParentData(prevData => ({
          ...prevData,
          status: updatedPerson.status_text,
          is_active: updatedPerson.new_status
        }));
        
        console.log("✅ Status updated successfully to:", updatedPerson.status_text);
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("❌ Error updating parent status:", err);
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
      
      // Revert the toggle if the API call failed
      setParentData(prevData => ({
        ...prevData,
        is_active: !newStatus // Revert to previous state
      }));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBack = () => navigate("/parents");

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
            <p className="mt-3 text-muted">Loading parent details...</p>
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
              <h4 className="alert-heading mb-1">Error Loading Parent</h4>
              <p className="mb-3">{error}</p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Parents
              </button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // No data state
  if (!parentData) {
    return (
      <div className="container-fluid px-4 py-3">
        <Alert variant="warning" className="mb-4">
          <div className="d-flex align-items-start">
            <i className="bi bi-info-circle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">No Data Found</h4>
              <p className="mb-3">No parent data available for {decodeURIComponent(name)}.</p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Parents
              </button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // Debug current state on render
  console.log("🎯 RENDER - Current parent status:", {
    is_active: parentData.is_active,
    status: parentData.status,
    full_name: parentData.full_name
  });

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Parent Details</h4>
          <p className="text-muted mb-0">Viewing details for: {parentData.full_name}</p>
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

      {/* Parent Summary Card */}
      <Card className="mb-4 border-0 shadow-sm bg-light">
        <Card.Header className="bg-transparent py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-person-badge me-2"></i>
              Parent Information
            </h5>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <Form.Check
                  type="switch"
                  id="parent-status-switch"
                  checked={parentData.is_active}
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
                bg={parentData.is_active ? "success" : "secondary"}
                className="fs-7"
              >
                {parentData.is_active ? "Active" : "Inactive"}
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
                  {parentData.full_name}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Gender</span>
                <span className="fs-6">{parentData.gender || "—"}</span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Date of Birth</span>
                <span className="fs-6">
                  {formatDateToMMDDYYYY(parentData.date_of_birth)}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Nationality</span>
                <span className="fs-6">
                  {parentData.nationality || "—"}
                </span>
              </div>
            </Col>

            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Occupation</span>
                <span className="fs-6">
                  {parentData.occupation || "—"}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Marital Status</span>
                <span className="fs-6">
                  {parentData.marital_status || "—"}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Status</span>
                <span className="fs-6">
                  <Badge 
                    bg={parentData.is_active ? "success" : "secondary"}
                    className="fs-7"
                  >
                    {parentData.is_active ? "Active" : "Inactive"}
                  </Badge>
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Parent ID</span>
                <span className="fs-6">{parentData.id}</span>
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
                          <p className="mb-0 fw-medium">{parentData.first_name}</p>
                        </div>
                        <div>
                          <span className="small">Last Name</span>
                          <p className="mb-0 fw-medium">{parentData.last_name}</p>
                        </div>
                        <div>
                          <span className="small">Middle Name</span>
                          <p className="mb-0">{parentData.middle_name || "—"}</p>
                        </div>
                        <div>
                          <span className="small">Gender</span>
                          <p className="mb-0">{parentData.gender}</p>
                        </div>
                        <div>
                          <span className="small">Date of Birth</span>
                          <p className="mb-0">
                            {formatDateToMMDDYYYY(parentData.date_of_birth)}
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
                          <p className="mb-0 fw-medium">{parentData.nationality}</p>
                        </div>
                        <div>
                          <span className="small">Marital Status</span>
                          <p className="mb-0">{parentData.marital_status}</p>
                        </div>
                        <div>
                          <span className="small">Occupation</span>
                          <p className="mb-0">{parentData.occupation}</p>
                        </div>
                        <div>
                          <span className="small">Status</span>
                          <p className="mb-0">
                            <Badge 
                              bg={parentData.is_active ? "success" : "secondary"}
                              className="fs-7"
                            >
                              {parentData.is_active ? "Active" : "Inactive"}
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
                            {parentData.email || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Phone</span>
                          <p className="mb-0">{parentData.phone || "—"}</p>
                        </div>
                        <div>
                          <span className="small">Alternate Phone</span>
                          <p className="mb-0">{parentData.alternate_phone || "—"}</p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard title="Address Information" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Residential Address</span>
                          <p className="mb-0">{parentData.address || "—"}</p>
                        </div>
                        {parentData.city && (
                          <div>
                            <span className="small">City</span>
                            <p className="mb-0">{parentData.city}</p>
                          </div>
                        )}
                        {parentData.state && (
                          <div>
                            <span className="small">State</span>
                            <p className="mb-0">{parentData.state}</p>
                          </div>
                        )}
                        {parentData.zip_code && (
                          <div>
                            <span className="small">Zip Code</span>
                            <p className="mb-0">{parentData.zip_code}</p>
                          </div>
                        )}
                      </div>
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Children Information Tab */}
            <Tab eventKey="children" title={
              <div className="d-flex align-items-center">
                Children Information
              </div>
            }>
              <div className="p-3">
                <Row className="g-3">
                  <Col md={12}>
                    <InfoCard title="Associated Children" className="bg-light">
                      {childrenLoading ? (
                        <div className="text-center py-4">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-2 text-muted">Loading children information...</p>
                        </div>
                      ) : childrenData.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Date of Birth</th>
                                <th>Gender</th>
                                <th>Mainstream School</th>
                                <th>Class at WSTSC</th>
                                <th>Enrollment Year</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {childrenData.map((child) => (
                                <tr key={child.enrollment_id}>
                                  <td>
                                    <div>
                                      <strong>{child.full_name}</strong>
                                      {child.preferred_name && (
                                        <div className="small text-muted">
                                          Preferred: {child.preferred_name}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td>{formatDateToMMDDYYYY(child.date_of_birth)}</td>
                                  <td>
                                    <Badge bg="info" className="text-capitalize">
                                      {child.gender}
                                    </Badge>
                                  </td>
                                  <td>{child.mainstream_school_name || "—"}</td>
                                  <td>
                                    {child.class_name ? (
                                      <Badge bg="secondary">
                                        {child.class_name}
                                      </Badge>
                                    ) : (
                                      "—"
                                    )}
                                  </td>
                                  <td>{child.mainstream_enrollment_year || "—"}</td>
                                  <td>
                                    <Badge 
                                      bg={
                                        child.status === 'approved' ? 'success' : 
                                        child.status === 'pending' ? 'warning' : 'secondary'
                                      }
                                      className="text-capitalize"
                                    >
                                      {child.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted">
                          <i className="bi bi-people fs-1 mb-3"></i>
                          <p>No children associated with this parent</p>
                          <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => fetchChildrenData(parentData.user_id)}
                          >
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Refresh Children Data
                          </button>
                        </div>
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Additional Information Tab */}
            <Tab eventKey="additional" title="Additional Information">
              <div className="p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <InfoCard title="System Information" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Created At</span>
                          <p className="mb-0">
                            {parentData.created_at ? formatDateToMMDDYYYY(parentData.created_at) : "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Updated At</span>
                          <p className="mb-0">
                            {parentData.updated_at ? formatDateToMMDDYYYY(parentData.updated_at) : "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Last Login</span>
                          <p className="mb-0">
                            {parentData.last_login ? formatDateToMMDDYYYY(parentData.last_login) : "—"}
                          </p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard title="Emergency Contact" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Emergency Contact Name</span>
                          <p className="mb-0">
                            {parentData.emergency_contact_name || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Emergency Contact Phone</span>
                          <p className="mb-0">
                            {parentData.emergency_contact_phone || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Relationship</span>
                          <p className="mb-0">
                            {parentData.emergency_contact_relationship || "—"}
                          </p>
                        </div>
                      </div>
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

export default ParentDetails;