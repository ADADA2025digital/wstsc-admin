import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Alert,
  Spinner,
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
  const [principal, setPrincipal] = useState(null);

  // Transform API data to match component structure
  const transformPrincipalData = (apiData) => {
    const teacher = apiData.teacher?.person || {};

    return {
      id: apiData.tpid,
      principal_id: `PRIN-${apiData.year}-${String(apiData.tpid).padStart(
        3,
        "0"
      )}`,
      name:
        teacher.full_name ||
        `${teacher.person_first_name} ${teacher.person_last_name}`,
      email: teacher.person_email,
      phone: teacher.person_phone,
      status: apiData.status,
      date_of_birth: null, // Not available in API
      gender: null, // Not available in API
      address: null, // Not available in API
      join_date: apiData.created_at,
      // Additional API data
      rawData: apiData,
      teacher_id: apiData.teacher?.tid,
      position: apiData.position,
      year: apiData.year,
      nominator: apiData.nominator,
      seconder: apiData.seconder,
    };
  };

  // Fetch principal data
  const fetchPrincipal = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/principals");

      if (response.data.success && response.data.data.principals.length > 0) {
        // Use the first principal from the response
        const principalData = response.data.data.principals[0];
        setPrincipal(transformPrincipalData(principalData));
      } else {
        setPrincipal(null); // No principal exists
      }
    } catch (err) {
      console.error("Error fetching principal:", err);
      setError("Failed to fetch principal data");
      setPrincipal(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrincipal();
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
        years_experience: Math.floor(
          (new Date() - new Date(principal.join_date)) /
            (365 * 24 * 60 * 60 * 1000)
        ),
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

  if (error && !principal) {
    return (
      <Container fluid className="px-4 py-3">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={fetchPrincipal}>
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  // No Principal Found - Show Create Button
  if (!principal) {
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
    <Container fluid className="px-4 py-3">
      {/* Header */}
      <div className="content-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Principal Details</h4>
        </div>
        <Button
          variant="outline-primary"
          size="sm"
          as={Link}
          to="/assign-principal"
        >
          <i className="bi bi-plus-circle me-1"></i>
          Update Principal
        </Button>
      </div>

      {error && (
        <Alert variant="warning" className="mb-3">
          {error}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {/* Principal Information Card */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Principal Information</h5>
              {principal.status && (
                <div className="content-header d-flex align-items-center gap-3">
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
                        <td className="fw-bold">Academic Year:</td>
                        <td>{principal.year}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Join Date:</td>
                        <td>{formatDate(principal.join_date)}</td>
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
                    {principal.rawData.nominator?.full_name || "N/A"}
                  </p>
                </Col>
                <Col md={6} className="content-header">
                  <h6 className="mb-2">Seconder</h6>
                  <p className="mb-1">
                    {principal.rawData.seconder?.full_name || "N/A"}
                  </p>
                </Col>
              </Row>
            </div>
          </div>

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
                            <td className="fw-bold">Join Date:</td>
                            <td>{formatDate(principal.join_date)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Col>
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>

          {/* Principal Summary */}
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
                      {summary.total_schools}
                    </div>
                    <small className="text-muted">Schools</small>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold text-success">
                      {summary.years_experience}
                    </div>
                    <small className="text-muted">Years Exp</small>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold text-info">
                      {summary.qualification_count}
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
              <table borderless="true">
                <tbody>
                  <tr>
                    <td className="fw-bold">
                      <i className="bi bi-envelope text-primary me-2"></i>
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
                    <td className="fw-bold">
                      <i className="bi bi-telephone text-primary me-2"></i>
                    </td>
                    <td>
                      <a
                        href={`tel:${principal.phone}`}
                        className="text-decoration-none"
                      >
                        {principal.phone}
                      </a>
                    </td>
                  </tr>
                  {principal.rawData.nominator && (
                    <tr>
                      <td className="fw-bold">
                        <i className="bi bi-person-check text-primary me-2"></i>
                      </td>
                      <td>
                        Nominator: {principal.rawData.nominator.full_name}
                      </td>
                    </tr>
                  )}
                  {principal.rawData.seconder && (
                    <tr>
                      <td className="fw-bold">
                        <i className="bi bi-people text-primary me-2"></i>
                      </td>
                      <td>Seconder: {principal.rawData.seconder.full_name}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PrincipalDetails;
