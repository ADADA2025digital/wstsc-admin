import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Alert,
  Tabs,
  Tab,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../config/axiosConfig";
import Loader from "../../Pages/Loader";

const PrincipalDetails = () => {
  const [activeTab, setActiveTab] = useState("personal");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Current principal
  const [principal, setPrincipal] = useState(null);

  // ✅ All principals list
  const [principals, setPrincipals] = useState([]);

  // Transform API data to match component structure
  const transformPrincipalData = (apiData) => {
    const teacher = apiData.teacher?.person || {};

    return {
      id: apiData.tpid,
      principal_id: `PRIN-${apiData.year}-${String(apiData.tpid).padStart(
        3,
        "0"
      )}`,
      name: teacher.full_name || "N/A",
      email: teacher.person_email || "N/A",
      phone: teacher.person_phone || "N/A",
      status: "active", // Default to active for current principal
      date_of_birth: null,
      gender: null,
      address: null,
      join_date: null, // Not available in API
      // Additional API data
      rawData: apiData,
      teacher_id: apiData.teacher?.tid,
      position: apiData.position,
      year: apiData.year,
      nominator: apiData.nominator,
      seconder: apiData.seconder,
    };
  };

  // Fetch current principal data
  const fetchCurrentPrincipal = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current principal
      const response = await api.get("/principals/current");
      const currentPrincipalData = response.data?.data?.current_principal;

      if (response.data.success && currentPrincipalData) {
        // Transform current principal data
        const transformedPrincipal = transformPrincipalData(currentPrincipalData);
        setPrincipal(transformedPrincipal);

        // Also fetch all principals for the list (if you have a separate endpoint)
        // If not, you can still use the current principal as the only one
        // and set principals array with just this one
        try {
          const allPrincipalsResponse = await api.get("/principals");
          const apiPrincipals = allPrincipalsResponse.data?.data?.principals || [];
          
          if (allPrincipalsResponse.data.success) {
            const transformedPrincipals = apiPrincipals.map(transformPrincipalData);
            setPrincipals(transformedPrincipals);
          } else {
            // If no all principals endpoint, use current principal as the only one
            setPrincipals([transformedPrincipal]);
          }
        } catch (allErr) {
          console.warn("Could not fetch all principals, using current only:", allErr);
          setPrincipals([transformedPrincipal]);
        }
      } else {
        setPrincipal(null);
        setPrincipals([]);
      }
    } catch (err) {
      console.error("Error fetching principal:", err);
      setError("Failed to fetch principal data");
      setPrincipal(null);
      setPrincipals([]);
    } finally {
      setLoading(false);
    }
  };

  // Alternative simpler approach if you only want current principal and have no all principals endpoint
  const fetchPrincipalSimple = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/principals/current");
      const currentPrincipalData = response.data?.data?.current_principal;

      if (response.data.success && currentPrincipalData) {
        // Transform current principal data
        const transformedPrincipal = transformPrincipalData(currentPrincipalData);
        setPrincipal(transformedPrincipal);
        setPrincipals([transformedPrincipal]); // Set principals with just current
      } else {
        setPrincipal(null);
        setPrincipals([]);
      }
    } catch (err) {
      console.error("Error fetching principal:", err);
      setError("Failed to fetch principal data");
      setPrincipal(null);
      setPrincipals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Use the simpler approach first
    fetchPrincipalSimple();
  }, []);

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

  const handleQuickStatusToggle = () => {
    setUpdatingStatus(true);
    // Simulate API call delay
    setTimeout(() => {
      setUpdatingStatus(false);
    }, 1000);
  };

  const summary = principal
    ? {
        total_schools: 0,
        years_experience: 0, // Calculate if you have join_date
        qualification_count: 0,
      }
    : {
        total_schools: 0,
        years_experience: 0,
        qualification_count: 0,
      };

  if (loading) {
    return <Loader />;
  }

  if (error && principals.length === 0) {
    return (
      <Container fluid className="px-4 py-3">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchPrincipalSimple}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  // No Principal Found - Show Create Button
  if (!principal && principals.length === 0) {
    return (
      <Container fluid className="px-4 py-3">
        {/* Header */}
        <div className="content-header d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="H4-heading fw-bold">Principal Details</h4>
            <p className="text-muted mb-0">
              No principal found for the current year
            </p>
          </div>
        </div>

        <Row>
          <Col lg={12}>
            <div className="card">
              <div className="card-body text-center py-5">
                <i className="bi bi-person-x display-1 mb-3"></i>
                <h4 className="mb-3">No Principal Assigned</h4>
                <p className="mb-4">
                  There is currently no principal assigned for the current
                  academic year. Click the button below to assign a principal.
                </p>
                <Link className="btn custom-btn" to="/assign-principal">
                  <i className="bi bi-plus-circle me-2"></i>
                  Assign Principal
                </Link>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  // Principal Exists - Show Details
  return (
    <Container fluid className="px-0 px-md-4 py-3">
      {/* Header */}
      <div className="content-header d-flex flex-md-row flex-column justify-content-between align-items-center mb-4">
        <div className="mb-3 mb-md-0">
          <h4 className="H4-heading fw-bold">Principal Details</h4>
          <p className="text-muted mb-0">
            Current principal details and historical list of all principals.
          </p>
        </div>
        <Button
          variant="outline-primary"
          size="sm"
          as={Link}
          to="/assign-principal"
        >
          <i className="bi bi-plus-circle me-1"></i>
          Update / Assign Principal
        </Button>
      </div>

      {error && (
        <Alert variant="warning" className="mb-3">
          {error}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {/* Current Principal Information Card */}
          {principal && (
            <div className="card mb-4">
              <div className="card-header d-flex flex-column flex-md-row justify-content-between align-items-center">
                <h5 className="mb-0">Current Principal Information</h5>
                {principal.status && (
                  <div className="content-header d-flex align-items-center justify-content-center justify-content-md-end gap-3 w-100">
                    <span className="text-muted">Status:</span>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="principal-status-toggle"
                        checked={principal.status === "active"}
                        onChange={handleQuickStatusToggle}
                        disabled={updatingStatus}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="principal-status-toggle"
                      >
                        <Badge
                          bg={getStatusVariant(principal.status)}
                          className="fs-6"
                        >
                          {principal.status}
                        </Badge>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <div className="card-body">
                <Row>
                  <Col md={6}>
                    <table borderless="true">
                      <tbody>
                        <tr>
                          <td className="fw-bold" style={{ width: "140px" }}>
                            Full Name:
                          </td>
                          <td>{principal.name}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Email:</td>
                          <td>
                            <a
                              href={`mailto:${principal.email}`}
                              className="text-decoration-none"
                            >
                              {principal.email}
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Phone:</td>
                          <td>
                            <a
                              href={`tel:${principal.phone}`}
                              className="text-decoration-none"
                            >
                              {principal.phone}
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Position:</td>
                          <td>{principal.position}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Col>
                  <Col md={6}>
                    <table borderless="true">
                      <tbody>
                        <tr>
                          <td className="fw-bold">Status:</td>
                          <td>
                            <Badge bg={getStatusVariant(principal.status)}>
                              {principal.status}
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Academic Year:</td>
                          <td>{principal.year}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Teacher ID:</td>
                          <td>{principal.teacher_id || "N/A"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </Col>
                </Row>

                {/* Nominator and Seconder Information */}
                <Row className="mt-3">
                  <Col md={6} className="content-header">
                    <h6 className="mb-2">Nominator</h6>
                    <p className="mb-1">
                      {principal.nominator?.full_name || "N/A"}
                    </p>
                    {principal.nominator?.peid && (
                      <small className="text-muted">
                        ID: {principal.nominator.peid}
                      </small>
                    )}
                  </Col>
                  <Col md={6} className="content-header">
                    <h6 className="mb-2">Seconder</h6>
                    <p className="mb-1">
                      {principal.seconder?.full_name || "N/A"}
                    </p>
                    {principal.seconder?.peid && (
                      <small className="text-muted">
                        ID: {principal.seconder.peid}
                      </small>
                    )}
                  </Col>
                </Row>
              </div>
            </div>
          )}

          {/* Tabbed Section for Additional Information */}
          {principal && (
            <Card className="mb-4">
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
                    eventKey="position"
                    title={
                      <span>
                        <i className="bi bi-briefcase me-1"></i>
                        Position Details
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
                        <table borderless="true">
                          <tbody>
                            <tr>
                              <td className="fw-bold" style={{ width: "120px" }}>
                                Email:
                              </td>
                              <td>
                                <a
                                  href={`mailto:${principal.email}`}
                                  className="text-decoration-none"
                                >
                                  {principal.email}
                                </a>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Phone:</td>
                              <td>
                                <a
                                  href={`tel:${principal.phone}`}
                                  className="text-decoration-none"
                                >
                                  {principal.phone}
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">Teacher Information</h6>
                        <table borderless="true">
                          <tbody>
                            <tr>
                              <td className="fw-bold" style={{ width: "120px" }}>
                                Teacher ID:
                              </td>
                              <td>{principal.teacher_id || "N/A"}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Person ID:</td>
                              <td>
                                {principal.rawData.teacher?.person?.peid || "N/A"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Position Details Tab */}
                {activeTab === "position" && (
                  <div>
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">Position Information</h6>
                        <table borderless="true">
                          <tbody>
                            <tr>
                              <td className="fw-bold" style={{ width: "120px" }}>
                                Position:
                              </td>
                              <td>{principal.position}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Academic Year:</td>
                              <td>{principal.year}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Principal ID:</td>
                              <td>{principal.principal_id}</td>
                            </tr>
                          </tbody>
                        </table>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">Appointment Details</h6>
                        <table borderless="true">
                          <tbody>
                            <tr>
                              <td className="fw-bold" style={{ width: "120px" }}>
                                Nominator:
                              </td>
                              <td>{principal.nominator?.full_name || "N/A"}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Seconder:</td>
                              <td>{principal.seconder?.full_name || "N/A"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </Col>
                    </Row>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* All Principals List */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Principal History</h5>
            </Card.Header>
            <Card.Body>
              {principals.length === 0 ? (
                <p className="text-muted mb-0">No principals found.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Name</th>
                        <th>Position</th>
                        <th>Status</th>
                        <th>Nominator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {principals.map((p) => (
                        <tr
                          key={p.id}
                          className={
                            principal && p.id === principal.id
                              ? "table-primary"
                              : ""
                          }
                        >
                          <td>{p.year}</td>
                          <td>{p.name}</td>
                          <td>{p.position}</td>
                          <td>
                            <Badge bg={getStatusVariant(p.status)}>
                              {p.status}
                            </Badge>
                          </td>
                          <td>{p.nominator?.full_name || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {principal && (
                <small className="text-muted">
                  Highlighted row indicates the current principal.
                </small>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Principal Summary */}
          {principal && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Principal Summary</h5>
              </Card.Header>
              <Card.Body>
                <div className="content-header text-center">
                  <div
                    className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <i
                      className="bi bi-person-badge-fill text-primary"
                      style={{ fontSize: "2rem" }}
                    ></i>
                  </div>
                  <h5>{principal.name}</h5>
                  <p className="m-0">{principal.email}</p>
                  <p>{principal.phone}</p>

                  <div className="mb-3">
                    <Badge
                      bg={getStatusVariant(principal.status)}
                      className="fs-6"
                    >
                      {principal.status}
                    </Badge>
                  </div>

                  <div className="d-flex justify-content-around mt-4">
                    <div className="text-center">
                      <div className="fw-bold text-primary">
                        {principal.year}
                      </div>
                      <small className="text-muted">Academic Year</small>
                    </div>
                    <div className="text-center">
                      <div className="fw-bold text-success">
                        {principal.position}
                      </div>
                      <small className="text-muted">Position</small>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Quick Actions */}
          {principal && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button
                    variant="outline-primary"
                    as={Link}
                    to={`/edit-principal/${principal.id}`}
                  >
                    <i className="bi bi-pencil me-2"></i>
                    Edit Principal Details
                  </Button>
                  <Button
                    variant="outline-success"
                    onClick={handleQuickStatusToggle}
                    disabled={updatingStatus}
                  >
                    <i className="bi bi-toggle-on me-2"></i>
                    {updatingStatus ? "Updating..." : "Toggle Status"}
                  </Button>
                  <Button variant="outline-info" as={Link} to="/reports">
                    <i className="bi bi-file-earmark-text me-2"></i>
                    Generate Report
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default PrincipalDetails;