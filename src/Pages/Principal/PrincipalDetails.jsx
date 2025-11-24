import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Table,
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

  // Mock data for demonstration (only used when principal exists)
  const schools = principal
    ? [
        {
          school_id: "SCH-001",
          school_name: "Greenwood High School",
          address: "456 Oak Street, Greenwood, GW 67890",
          phone: "+1 (555) 987-6543",
          is_active: true,
          start_date: "2020-01-15",
        },
      ]
    : [];

  const employment_history = principal
    ? [
        {
          id: 1,
          position: principal.position,
          organization: "Greenwood High School",
          start_date: principal.join_date,
          end_date: null,
          description: "Leading academic programs and staff management",
        },
      ]
    : [];

  const qualifications = principal
    ? [
        {
          id: 1,
          degree: "Doctor of Education",
          institution: "University of Education",
          field_of_study: "Educational Leadership",
          year_obtained: "2018",
          grade: "Summa Cum Laude",
        },
      ]
    : [];

  const summary = principal
    ? {
        total_schools: 1,
        years_experience: Math.floor(
          (new Date() - new Date(principal.join_date)) /
            (365 * 24 * 60 * 60 * 1000)
        ),
        qualification_count: 1,
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
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="H4-heading fw-bold">Principal Details</h4>
            <p className="text-muted mb-0">
              No principal found for the current year
            </p>
          </div>
        </div>

        <Row>
          <Col lg={12}>
            <Card>
              <Card.Body className="text-center py-5">
                <i className="bi bi-person-x display-1 text-muted mb-3"></i>
                <h4 className="mb-3">No Principal Assigned</h4>
                <p className="text-muted mb-4">
                  There is currently no principal assigned for the current
                  academic year. Click the button below to assign a principal.
                </p>
                <Link className="btn custom-btn" to="/assign-principal">
                  <i className="bi bi-plus-circle me-2"></i>
                  Assign Principal
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  // Principal Exists - Show Details
  return (
    <Container fluid className="px-4 py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Principal Details</h4>
          <p className="text-muted mb-0">
            Principal ID: {principal.principal_id}
          </p>
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
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Principal Information</h5>
              {principal.status && (
                <div className="d-flex align-items-center gap-3">
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
                  </Table>
                </Col>
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td className="fw-bold" style={{ width: "140px" }}>
                          Principal ID:
                        </td>
                        <td>{principal.principal_id}</td>
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
                        <td className="fw-bold">Academic Year:</td>
                        <td>{principal.year}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Join Date:</td>
                        <td>{formatDate(principal.join_date)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>

              {/* Nominator and Seconder Information */}
              <Row className="mt-3">
                <Col md={6}>
                  <h6 className="mb-2">Nominator</h6>
                  <p className="mb-1">
                    {principal.rawData.nominator?.full_name || "N/A"}
                  </p>
                  <small className="text-muted">
                    PEID: {principal.rawData.nominator?.peid || "N/A"}
                  </small>
                </Col>
                <Col md={6}>
                  <h6 className="mb-2">Seconder</h6>
                  <p className="mb-1">
                    {principal.rawData.seconder?.full_name || "N/A"}
                  </p>
                  <small className="text-muted">
                    PEID: {principal.rawData.seconder?.peid || "N/A"}
                  </small>
                </Col>
              </Row>
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
                      </Table>
                    </Col>
                    <Col md={6}>
                      <h6 className="mb-3">Position Information</h6>
                      <Table borderless>
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
                        <Col md={6} key={school.school_id} className="mb-3">
                          <Card className="h-100">
                            <Card.Header className="bg-light">
                              <h6 className="mb-0">{school.school_name}</h6>
                            </Card.Header>
                            <Card.Body>
                              <Table borderless size="sm">
                                <tbody>
                                  <tr>
                                    <td className="fw-bold">School ID:</td>
                                    <td>{school.school_id}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Address:</td>
                                    <td>{school.address}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Phone:</td>
                                    <td>{school.phone}</td>
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
                          key={job.id}
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
                            <h6 className="mb-1">{job.position}</h6>
                            <p className="mb-1 text-muted">
                              {job.organization}
                            </p>
                            <p className="mb-1 small text-muted">
                              {formatDate(job.start_date)} -{" "}
                              {job.end_date
                                ? formatDate(job.end_date)
                                : "Present"}
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
                        <Col md={6} key={qual.id} className="mb-3">
                          <Card className="h-100">
                            <Card.Header className="bg-light">
                              <h6 className="mb-0">{qual.degree}</h6>
                            </Card.Header>
                            <Card.Body>
                              <Table borderless size="sm">
                                <tbody>
                                  <tr>
                                    <td className="fw-bold">Institution:</td>
                                    <td>{qual.institution}</td>
                                  </tr>
                                  <tr>
                                    <td className="fw-bold">Field:</td>
                                    <td>{qual.field_of_study}</td>
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
                <Button
                  variant="outline-warning"
                  onClick={handleQuickStatusToggle}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-pause-circle me-2"></i>
                      Deactivate Principal
                    </>
                  )}
                </Button>
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
                <h5>{principal.name}</h5>
                <p className="text-muted">
                  Principal ID: {principal.principal_id}
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
              <Table borderless size="sm">
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
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default PrincipalDetails;