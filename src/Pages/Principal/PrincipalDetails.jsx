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
  const [activeTab, setActiveTab] = useState("position");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingAllPrincipals, setLoadingAllPrincipals] = useState(true);
  const [error, setError] = useState(null);
  const [errorAllPrincipals, setErrorAllPrincipals] = useState(null);

  // ✅ Current principal
  const [principal, setPrincipal] = useState(null);

  // ✅ All principals list (historical data)
  const [principals, setPrincipals] = useState([]);

  // Transform API data for current principal
  const transformCurrentPrincipalData = (apiData) => {
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
      status: "active", // Current principal is active by default
      date_of_birth: null,
      gender: null,
      address: null,
      join_date: null,
      // Additional API data
      rawData: apiData,
      teacher_id: apiData.teacher?.tid,
      position: apiData.position,
      year: apiData.year,
      nominator: apiData.nominator,
      seconder: apiData.seconder,
    };
  };

  // Transform API data for all principals (if different structure)
  const transformAllPrincipalData = (apiData) => {
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
      status: apiData.status || "active", // Use API status or default
      date_of_birth: null,
      gender: null,
      address: null,
      join_date: apiData.created_at || apiData.assigned_date || null,
      // Additional API data
      rawData: apiData,
      teacher_id: apiData.teacher?.tid,
      position: apiData.position,
      year: apiData.year,
      nominator: apiData.nominator,
      seconder: apiData.seconder,
      // Historical data might have different structure
      end_date: apiData.end_date || null,
      tenure_years: apiData.tenure_years || null,
    };
  };

  // Fetch current principal data
  const fetchCurrentPrincipal = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/principals/current");
      const currentPrincipalData = response.data?.data?.current_principal;

      if (response.data.success && currentPrincipalData) {
        const transformedPrincipal =
          transformCurrentPrincipalData(currentPrincipalData);
        setPrincipal(transformedPrincipal);
      } else {
        setPrincipal(null);
      }
    } catch (err) {
      console.error("Error fetching current principal:", err);
      setError("Failed to fetch current principal data");
      setPrincipal(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all principals (historical data)
  const fetchAllPrincipals = async () => {
    try {
      setLoadingAllPrincipals(true);
      setErrorAllPrincipals(null);

      // Try to fetch all principals from /principals endpoint
      const response = await api.get("/principals");

      if (response.data.success) {
        // Check different possible response structures
        let apiPrincipals = [];

        if (Array.isArray(response.data.data)) {
          apiPrincipals = response.data.data;
        } else if (response.data.data?.principals) {
          apiPrincipals = response.data.data.principals;
        } else if (response.data.data?.all_principals) {
          apiPrincipals = response.data.data.all_principals;
        } else if (response.data.data) {
          // If data is an object with principal records
          apiPrincipals = Object.values(response.data.data);
        }

        const transformedPrincipals = apiPrincipals.map(
          transformAllPrincipalData
        );

        // Sort by year descending (most recent first)
        const sortedPrincipals = transformedPrincipals.sort(
          (a, b) => b.year - a.year
        );
        setPrincipals(sortedPrincipals);
      } else {
        setPrincipals([]);
      }
    } catch (err) {
      console.error("Error fetching all principals:", err);
      setErrorAllPrincipals("Failed to fetch historical principals data");
      setPrincipals([]);
    } finally {
      setLoadingAllPrincipals(false);
    }
  };

  // Fetch both current and all principals
  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchCurrentPrincipal(), fetchAllPrincipals()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const getStatusVariant = (status) => {
    if (!status) return "secondary";

    switch (status.toLowerCase()) {
      case "active":
      case "approved":
        return "success";
      case "inactive":
      case "past":
      case "former":
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
        month: "short",
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

  const getTenureDuration = (startYear, endYear) => {
    if (!startYear) return "N/A";

    if (!endYear || endYear === startYear) {
      return `${startYear} (1 year)`;
    }

    const duration = endYear - startYear + 1;
    return `${startYear} - ${endYear} (${duration} ${
      duration === 1 ? "year" : "years"
    })`;
  };

  if (loading) {
    return <Loader />;
  }

  if (error && !principal) {
    return (
      <Container fluid className="px-4 py-3">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchAllData}>
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
        <Col lg={12}>
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
                          <td className="fw-bold">Academic Year:</td>
                          <td>{principal.year}</td>
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
            </div>
          )}

          {/* Tabbed Section for Additional Information */}
          {/* {principal && (
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

                {activeTab === "personal" && (
                  <div>
                    <Row>
                      <Col md={12}>
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
                    </Row>
                  </div>
                )}

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
          )} */}

          {/* All Principals List - Principal History */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Principal History</h5>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={fetchAllPrincipals}
                disabled={loadingAllPrincipals}
              >
                <i
                  className={`bi ${
                    loadingAllPrincipals
                      ? "bi-arrow-clockwise spin"
                      : "bi-arrow-clockwise"
                  } me-1`}
                ></i>
                Refresh
              </Button>
            </Card.Header>
            <Card.Body>
              {loadingAllPrincipals ? (
                <div className="text-center py-3">
                  <div
                    className="spinner-border spinner-border-sm text-primary"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <span className="ms-2">Loading principals history...</span>
                </div>
              ) : errorAllPrincipals ? (
                <Alert variant="warning" className="mb-0">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {errorAllPrincipals}
                  <Button
                    variant="outline-warning"
                    size="sm"
                    className="ms-2"
                    onClick={fetchAllPrincipals}
                  >
                    Retry
                  </Button>
                </Alert>
              ) : principals.length === 0 ? (
                <Alert variant="info" className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  No historical principal records found.
                </Alert>
              ) : (
                <>
                  <div className="table-responsive custom-data-table">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr>
                          <th>Academic Year</th>
                          <th>Principal Name</th>
                          <th>Position</th>
                          <th>Status</th>
                          <th>Tenure</th>
                          <th>Nominator</th>
                        </tr>
                      </thead>
                      <tbody>
                        {principals.map((p) => {
                          const isCurrentPrincipal =
                            principal && p.id === principal.id;
                          const tenureText = getTenureDuration(
                            p.year,
                            p.end_date || p.year
                          );

                          return (
                            <tr
                              key={p.id}
                              className={
                                isCurrentPrincipal ? "table-success" : ""
                              }
                            >
                              <td>
                                <span className="fw-bold">{p.year}</span>
                                {isCurrentPrincipal && (
                                  <Badge bg="success" className="ms-2">
                                    Current
                                  </Badge>
                                )}
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="me-2">
                                    <i className="bi bi-person-circle"></i>
                                  </div>
                                  <div>
                                    <div className="fw-medium">{p.name}</div>
                                    <small className="text-muted">
                                      {p.email}
                                    </small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <Badge bg="primary" className="fw-normal">
                                  {p.position}
                                </Badge>
                              </td>
                              <td>
                                <Badge bg={getStatusVariant(p.status)}>
                                  {p.status}
                                </Badge>
                              </td>
                              <td>
                                <small>{tenureText}</small>
                                {p.join_date && (
                                  <div className="text-muted">
                                    <small>
                                      Started: {formatDate(p.join_date)}
                                    </small>
                                  </div>
                                )}
                              </td>
                              <td>
                                <small>{p.nominator?.full_name || "N/A"}</small>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* <Col lg={4}>
          {principal && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Current Principal Summary</h5>
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
        </Col> */}
      </Row>
    </Container>
  );
};

// Add CSS for spinning refresh icon
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .bi-arrow-clockwise.spin {
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(style);

export default PrincipalDetails;
