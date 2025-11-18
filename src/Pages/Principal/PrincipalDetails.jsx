import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Table,
  Form,
  Alert,
  Spinner,
  Tabs,
  Tab,
} from "react-bootstrap";
import api from "../../config/axiosConfig";

const PrincipalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const principalData = location.state?.principalData;

  const [currentPrincipal, setCurrentPrincipal] = useState(null);
  const [loading, setLoading] = useState(!principalData);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("personal");
  const [userRole, setUserRole] = useState(null);

  // Get user role from localStorage
  useEffect(() => {
    const getUserRole = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          console.log("👤 User data from localStorage:", parsedUserData);
          setUserRole(parsedUserData.role?.role_name || null);
          return parsedUserData.role?.role_name;
        }
      } catch (error) {
        console.error("❌ Error parsing user data from localStorage:", error);
      }
      return null;
    };

    getUserRole();
  }, []);

  // Debug logs for initial props
  console.log("🔍 PrincipalDetails Component Mounted:", {
    id,
    hasPrincipalData: !!principalData,
    principalDataFromLocation: principalData,
    locationState: location.state,
    userRole,
  });

  // Data transformation function
  const transformPrincipalData = (data) => {
    console.log("🔄 Transforming principal data structure...", data);

    // If data comes from detailed_data endpoint (nested structure)
    if (data.detailed_data) {
      const detailed = data.detailed_data;
      console.log("📦 Found detailed_data, extracting...", detailed);

      return {
        principal: {
          id: data.id,
          principal_id: data.principal_id,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          email: data.email,
          phone: data.phone,
          status: data.status,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          address: data.address,
          ...(detailed.principal || {}),
        },
        schools: detailed.schools || [],
        employment_history: detailed.employment_history || [],
        qualifications: detailed.qualifications || [],
        summary: {
          total_schools: detailed.schools?.length || 0,
          years_experience: detailed.years_experience || 0,
          qualification_count: detailed.qualifications?.length || 0,
        },
      };
    }

    // If data is from principals list (direct structure)
    if (data.principal_id || data.id) {
      console.log("📦 Using direct principal data structure");
      return {
        principal: {
          id: data.id,
          principal_id: data.principal_id,
          name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
          email: data.email,
          phone: data.phone,
          status: data.status,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          address: data.address,
          join_date: data.join_date,
          ...data,
        },
        schools: data.schools || [],
        employment_history: data.employment_history || [],
        qualifications: data.qualifications || [],
        summary: {
          total_schools: data.schools?.length || 0,
          years_experience: data.years_experience || 0,
          qualification_count: data.qualifications?.length || 0,
        },
      };
    }

    // If data is already in the expected format
    console.log("📦 Data already in expected format");
    return data;
  };

  // Fetch principal data
  const fetchPrincipalData = async () => {
    try {
      console.log("🚀 Starting API call to fetch principal data for ID:", id);
      console.log("👤 User role:", userRole);
      
      setLoading(true);
      setError(null);

      // Use the principals API endpoint
      console.log("🎯 Using principals API endpoint");
      const response = await api.get(`/principals/${id}`);
      
      if (response.data.success) {
        console.log("✅ Principal data fetched successfully");
        const transformedData = transformPrincipalData(response.data.data);
        console.log("🔄 Transformed principal data:", transformedData);
        setCurrentPrincipal(transformedData);
      } else {
        throw new Error(response.data.message || "Failed to fetch principal data");
      }

    } catch (error) {
      console.error("💥 Error fetching principal data:", {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      setError("Failed to load principal data. Please try again.");
    } finally {
      console.log("🏁 API call completed, setting loading to false");
      setLoading(false);
    }
  };

  // If no principal data was passed, fetch it using the ID
  useEffect(() => {
    console.log("🔄 useEffect triggered:", {
      hasPrincipalData: !!principalData,
      id,
      loading,
      userRole,
    });

    if (!principalData && id) {
      console.log("📡 Fetching principal data from API...");
      fetchPrincipalData();
    } else if (principalData) {
      console.log("✅ Using principal data from location state");

      // Transform the data to match expected format
      const transformedData = transformPrincipalData(principalData);
      console.log("📦 Transformed principal data:", transformedData);

      setCurrentPrincipal(transformedData);
      setLoading(false);
    } else if (!id) {
      console.log("❌ No principal ID available");
      setError("No principal ID provided");
      setLoading(false);
    }
  }, [id, principalData, userRole]);

  // Safe data access functions with debug logs
  const getPrincipalData = () => {
    const principal = currentPrincipal?.principal || {};
    console.log("👤 getPrincipalData:", principal);
    return principal;
  };

  const getSchoolsData = () => {
    const schools = currentPrincipal?.schools || [];
    console.log("🏫 getSchoolsData:", schools);
    return schools;
  };

  const getEmploymentHistory = () => {
    const history = currentPrincipal?.employment_history || [];
    console.log("📈 getEmploymentHistory:", history);
    return history;
  };

  const getQualifications = () => {
    const qualifications = currentPrincipal?.qualifications || [];
    console.log("🎓 getQualifications:", qualifications);
    return qualifications;
  };

  const getSummary = () => {
    const summary = currentPrincipal?.summary || {};
    console.log("📊 getSummary:", summary);
    return summary;
  };

  const getStatusVariant = (status) => {
    if (!status) return "secondary";

    switch (status.toLowerCase()) {
      case "active":
      case "approved":
        return "success";
      case "inactive":
        return "secondary";
      case "pending":
        return "warning";
      case "on leave":
        return "info";
      default:
        return "info";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Handle status change via toggle
  const handleStatusChange = async (newStatus) => {
    try {
      console.log("🔄 Changing principal status to:", newStatus);
      setUpdatingStatus(true);
      setUpdateMessage({ type: "", text: "" });

      const response = await api.put(`/principals/${id}/status`, {
        status: newStatus,
      });

      console.log("📥 Status update response:", response.data);

      if (response.data.success) {
        // Update local state
        setCurrentPrincipal((prev) => ({
          ...prev,
          principal: {
            ...prev?.principal,
            status: newStatus,
          },
        }));

        console.log("✅ Principal status updated successfully");
        setUpdateMessage({
          type: "success",
          text: `Principal status updated to ${newStatus} successfully!`,
        });
      } else {
        throw new Error(
          response.data.message || "Failed to update principal status"
        );
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("💥 Error updating principal status:", {
        error,
        message: error.message,
        response: error.response?.data,
      });
      setUpdateMessage({
        type: "danger",
        text:
          error.response?.data?.message ||
          "Failed to update principal status. Please try again.",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle quick status toggle
  const handleQuickStatusToggle = () => {
    const principal = getPrincipalData();
    console.log("🔀 Quick status toggle:", {
      currentStatus: principal.status,
      newStatus: principal.status === "active" ? "inactive" : "active",
    });
    const newStatus = principal.status === "active" ? "inactive" : "active";
    handleStatusChange(newStatus);
  };

  // Handle refresh
  const handleRefresh = () => {
    console.log("🔄 Refreshing principal data...");
    fetchPrincipalData();
  };

  // Handle add new principal
  const handleAddPrincipal = () => {
    console.log("➕ Navigating to add principal page...");
    navigate("/principals/add");
  };

  // Debug current state before render
  console.log("🎯 Current Component State:", {
    loading,
    error,
    currentPrincipal,
    hasPrincipalData: !!currentPrincipal,
    userRole,
  });

  if (loading) {
    console.log("⏳ Rendering loading state...");
    return (
      <Container fluid className="px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <Spinner animation="border" variant="primary" />
          <span className="ms-2">Loading principal data...</span>
        </div>
      </Container>
    );
  }

  if (error || !currentPrincipal) {
    console.log("❌ Rendering error state:", {
      error,
      hasCurrentPrincipal: !!currentPrincipal,
    });
    
    return (
      <Container fluid className="px-4 py-3">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="H4-heading fw-bold">Principal Details</h4>
          </div>
        </div>

        {/* No Principal Found Card */}
        <div className="card mt-1 p-3 rounded-3 shadow">
          <div className="text-center py-5">
            <div className="mb-4">
              <i
                className="bi bi-folder-x"
                style={{ fontSize: "3rem", color: "#6c757d" }}
              ></i>
            </div>
            <h5 className="text-muted mb-3">No Principal Found</h5>
            <div className="d-flex justify-content-center gap-3">
              {userRole === "admin" && (
                <button
                  onClick={handleAddPrincipal}
                  className="btn custom-btn px-4 py-2"
                >
                  <i className="bi bi-plus-circle me-1"></i> Add New Principal
                </button>
              )}
              <Button
                onClick={handleRefresh}
                variant="outline-secondary"
                className="px-4 py-2"
              >
                <i className="bi bi-arrow-clockwise"></i> Refresh
              </Button>
            </div>
          </div>
        </div>
      </Container>
    );
  }

  const principal = getPrincipalData();
  const schools = getSchoolsData();
  const employment_history = getEmploymentHistory();
  const qualifications = getQualifications();
  const summary = getSummary();

  console.log("🎨 Rendering principal details with data:", {
    principal,
    schoolsCount: schools.length,
    employmentHistoryCount: employment_history.length,
    qualificationsCount: qualifications.length,
    summary,
    userRole,
  });

  return (
    <Container fluid className="px-4 py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Principal Details</h4>
          <p className="text-muted mb-0">
            {principal.principal_id
              ? `Principal ID: ${principal.principal_id}`
              : "Principal Details"}
          </p>
        </div>
      </div>

      {/* Status Update Message */}
      {updateMessage.text && (
        <Alert variant={updateMessage.type} className="mb-4">
          <div className="d-flex align-items-center">
            <i
              className={`bi bi-${
                updateMessage.type === "success"
                  ? "check-circle"
                  : updateMessage.type === "warning"
                  ? "exclamation-triangle"
                  : "exclamation-triangle"
              } me-2`}
            ></i>
            <span>{updateMessage.text}</span>
          </div>
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {/* Principal Information Card */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Principal Information</h5>
              {principal.status && (
                <div className="d-flex align-items-center gap-3">
                  <span className="text-muted">Status:</span>
                  <Form.Check
                    type="switch"
                    id="principal-status-toggle"
                    label={
                      <Badge
                        bg={getStatusVariant(principal.status)}
                        className="fs-6"
                      >
                        {principal.status}
                      </Badge>
                    }
                    checked={
                      principal.status === "active" ||
                      principal.status === "approved"
                    }
                    onChange={handleQuickStatusToggle}
                    disabled={updatingStatus}
                  />
                </div>
              )}
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td className="fw-bold" style={{ width: "140px" }}>
                          Full Name:
                        </td>
                        <td>{principal.name || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Email:</td>
                        <td>
                          {principal.email ? (
                            <a
                              href={`mailto:${principal.email}`}
                              className="text-decoration-none"
                            >
                              {principal.email}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Phone:</td>
                        <td>
                          {principal.phone ? (
                            <a
                              href={`tel:${principal.phone}`}
                              className="text-decoration-none"
                            >
                              {principal.phone}
                            </a>
                          ) : (
                            "N/A"
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Gender:</td>
                        <td>{principal.gender || "N/A"}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td className="fw-bold" style={{ width: "140px" }}>
                          Principal ID:
                        </td>
                        <td>{principal.principal_id || "N/A"}</td>
                      </tr>
                      {principal.status && (
                        <tr>
                          <td className="fw-bold">Status:</td>
                          <td>
                            <Badge bg={getStatusVariant(principal.status)}>
                              {principal.status}
                            </Badge>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="fw-bold">Date of Birth:</td>
                        <td>{formatDate(principal.date_of_birth)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Join Date:</td>
                        <td>{formatDate(principal.join_date)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
              {principal.address && (
                <Row className="mt-3">
                  <Col>
                    <Table borderless>
                      <tbody>
                        <tr>
                          <td className="fw-bold" style={{ width: "140px" }}>
                            Address:
                          </td>
                          <td>{principal.address}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>

          {/* Tabbed Section for Additional Information */}
          <Card>
            <Card.Header>
              <Tabs
                activeKey={activeTab}
                onSelect={(tab) => setActiveTab(tab)}
                className="mb-0"
              >
                <Tab
                  eventKey="personal"
                  title={
                    <span>
                      <i className="bi bi-person me-1"></i>
                      Personal Details
                    </span>
                  }
                />
                <Tab
                  eventKey="schools"
                  title={
                    <span>
                      <i className="bi bi-building me-1"></i>
                      Schools
                    </span>
                  }
                />
                <Tab
                  eventKey="employment"
                  title={
                    <span>
                      <i className="bi bi-briefcase me-1"></i>
                      Employment History
                    </span>
                  }
                />
                <Tab
                  eventKey="qualifications"
                  title={
                    <span>
                      <i className="bi bi-award me-1"></i>
                      Qualifications
                    </span>
                  }
                />
              </Tabs>
            </Card.Header>
            <Card.Body>
              {/* Personal Details Tab */}
              {activeTab === "personal" && (
                <div>
                  <Row>
                    <Col md={6}>
                      <h6 className="mb-3">Contact Information</h6>
                      <Table borderless>
                        <tbody>
                          <tr>
                            <td className="fw-bold" style={{ width: "120px" }}>
                              Email:
                            </td>
                            <td>
                              {principal.email ? (
                                <a
                                  href={`mailto:${principal.email}`}
                                  className="text-decoration-none"
                                >
                                  {principal.email}
                                </a>
                              ) : (
                                "N/A"
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Phone:</td>
                            <td>
                              {principal.phone ? (
                                <a
                                  href={`tel:${principal.phone}`}
                                  className="text-decoration-none"
                                >
                                  {principal.phone}
                                </a>
                              ) : (
                                "N/A"
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Address:</td>
                            <td>{principal.address || "N/A"}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-3">Personal Information</h6>
                      <Table borderless>
                        <tbody>
                          <tr>
                            <td className="fw-bold" style={{ width: "120px" }}>
                              Gender:
                            </td>
                            <td>{principal.gender || "N/A"}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Date of Birth:</td>
                            <td>{formatDate(principal.date_of_birth)}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Join Date:</td>
                            <td>{formatDate(principal.join_date)}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                  </Row>
                </div>
              )}

              {/* Schools Tab */}
              {activeTab === "schools" && (
                <div>
                  {schools.length > 0 ? (
                    <Row>
                      {schools.map((school, index) => (
                        <Col
                          md={6}
                          key={school.school_id || index}
                          className="mb-3"
                        >
                          <Card className="h-100">
                            <Card.Header className="bg-light">
                              <h6 className="mb-0">
                                {school.school_name || "Unnamed School"}
                              </h6>
                            </Card.Header>
                            <Card.Body>
                              <Table borderless size="sm">
                                <tbody>
                                  <tr>
                                    <td className="fw-bold">School ID:</td>
                                    <td>{school.school_id || "N/A"}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Address:</td>
                                    <td>{school.address || "N/A"}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Phone:</td>
                                    <td>{school.phone || "N/A"}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Status:</td>
                                    <td>
                                      <Badge
                                        bg={
                                          school.is_active
                                            ? "success"
                                            : "secondary"
                                        }
                                      >
                                        {school.is_active
                                          ? "Active"
                                          : "Inactive"}
                                      </Badge>
                                    </td>
                                  </tr>
                                  {school.start_date && (
                                    <tr>
                                      <td className="fw-bold">Start Date:</td>
                                      <td>{formatDate(school.start_date)}</td>
                                    </tr>
                                  )}
                                </tbody>
                              </Table>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div className="text-center py-4">
                      <i
                        className="bi bi-building text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                      <p className="text-muted mt-3">
                        No school information available.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Employment History Tab */}
              {activeTab === "employment" && (
                <div>
                  {employment_history.length > 0 ? (
                    <div className="timeline">
                      {employment_history.map((job, index) => (
                        <div
                          key={job.id || index}
                          className={`d-flex ${index > 0 ? "mt-4" : ""}`}
                        >
                          <div className="flex-shrink-0">
                            <div
                              className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white"
                              style={{ width: "40px", height: "40px" }}
                            >
                              <i className="bi bi-briefcase"></i>
                            </div>
                          </div>
                          <div className="flex-grow-1 ms-3 pb-3 border-bottom">
                            <h6 className="mb-1">{job.position || "N/A"}</h6>
                            <p className="mb-1 text-muted">
                              {job.organization || "N/A"}
                            </p>
                            <p className="mb-1 small text-muted">
                              {formatDate(job.start_date)} -{" "}
                              {job.end_date ? formatDate(job.end_date) : "Present"}
                            </p>
                            {job.description && (
                              <p className="mb-0 small">{job.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <i
                        className="bi bi-briefcase text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                      <p className="text-muted mt-3">
                        No employment history available.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Qualifications Tab */}
              {activeTab === "qualifications" && (
                <div>
                  {qualifications.length > 0 ? (
                    <Row>
                      {qualifications.map((qual, index) => (
                        <Col
                          md={6}
                          key={qual.id || index}
                          className="mb-3"
                        >
                          <Card className="h-100">
                            <Card.Header className="bg-light">
                              <h6 className="mb-0">
                                {qual.degree || qual.certification || "Qualification"}
                              </h6>
                            </Card.Header>
                            <Card.Body>
                              <Table borderless size="sm">
                                <tbody>
                                  <tr>
                                    <td className="fw-bold">Institution:</td>
                                    <td>{qual.institution || "N/A"}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Field:</td>
                                    <td>{qual.field_of_study || "N/A"}</td>
                                  </tr>
                                  {qual.year_obtained && (
                                    <tr>
                                      <td className="fw-bold">Year:</td>
                                      <td>{qual.year_obtained}</td>
                                    </tr>
                                  )}
                                  {qual.grade && (
                                    <tr>
                                      <td className="fw-bold">Grade:</td>
                                      <td>{qual.grade}</td>
                                    </tr>
                                  )}
                                </tbody>
                              </Table>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div className="text-center py-4">
                      <i
                        className="bi bi-award text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                      <p className="text-muted mt-3">
                        No qualifications available.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Quick Actions & Status */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary">
                  <i className="bi bi-envelope me-2"></i>
                  Send Message
                </Button>
                <Button variant="outline-success">
                  <i className="bi bi-file-text me-2"></i>
                  Generate Report
                </Button>
                <Button variant="outline-info">
                  <i className="bi bi-calendar me-2"></i>
                  View Schedule
                </Button>
                {(principal.status === "active" ||
                  principal.status === "approved") && (
                  <Button
                    variant="outline-warning"
                    onClick={() => handleStatusChange("inactive")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Deactivating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-pause-circle me-2"></i>
                        Deactivate Principal
                      </>
                    )}
                  </Button>
                )}
                {(principal.status === "inactive" ||
                  principal.status === "Inactive") && (
                  <Button
                    variant="outline-success"
                    onClick={() => handleStatusChange("active")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <>
                        <Spinner
                          animation="border"
                          size="sm"
                          className="me-2"
                        />
                        Activating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play-circle me-2"></i>
                        Activate Principal
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Principal Summary */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Principal Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div
                  className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: "80px", height: "80px" }}
                >
                  <i
                    className="bi bi-person-badge-fill text-primary"
                    style={{ fontSize: "2rem" }}
                  ></i>
                </div>
                <h5>{principal.name || "Principal Name"}</h5>
                <p className="text-muted">
                  {principal.principal_id
                    ? `Principal ID: ${principal.principal_id}`
                    : "Principal"}
                </p>

                {principal.status && (
                  <div className="mb-3">
                    <Badge
                      bg={getStatusVariant(principal.status)}
                      className="fs-6"
                    >
                      {principal.status}
                    </Badge>
                  </div>
                )}

                <div className="d-flex justify-content-around mt-4">
                  <div className="text-center">
                    <div className="fw-bold text-primary">
                      {summary.total_schools || 0}
                    </div>
                    <small className="text-muted">Schools</small>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold text-success">
                      {summary.years_experience || 0}
                    </div>
                    <small className="text-muted">Years Exp</small>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold text-info">
                      {summary.qualification_count || 0}
                    </div>
                    <small className="text-muted">Qualifications</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Contact Information */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Contact Information</h5>
            </Card.Header>
            <Card.Body>
              <Table borderless size="sm">
                <tbody>
                  <tr>
                    <td className="fw-bold">
                      <i className="bi bi-envelope text-primary me-2"></i>
                    </td>
                    <td>
                      {principal.email ? (
                        <a
                          href={`mailto:${principal.email}`}
                          className="text-decoration-none"
                        >
                          {principal.email}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-bold">
                      <i className="bi bi-telephone text-primary me-2"></i>
                    </td>
                    <td>
                      {principal.phone ? (
                        <a
                          href={`tel:${principal.phone}`}
                          className="text-decoration-none"
                        >
                          {principal.phone}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="fw-bold">
                      <i className="bi bi-geo-alt text-primary me-2"></i>
                    </td>
                    <td>{principal.address || "N/A"}</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PrincipalDetails;