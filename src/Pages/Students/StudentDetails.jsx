import React, { useState } from "react";
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
  Spinner
} from "react-bootstrap";

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const studentData = location.state?.studentData;

  const [currentStudent, setCurrentStudent] = useState(studentData);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

  // If no student data in location state, you might want to fetch it by ID
  // For now, we'll use the passed data or show a message
  if (!currentStudent) {
    return (
      <Container fluid className="px-4 py-3">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="H4-heading fw-bold">Student Details</h4>
          </div>
          <Button variant="outline-secondary" onClick={() => navigate("/students")}>
            Back to Students
          </Button>
        </div>
        <Card>
          <Card.Body className="text-center py-5">
            <p className="text-muted">Student data not found.</p>
            <Button variant="primary" onClick={() => navigate("/students")}>
              Return to Students List
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case "Active": return "success";
      case "Pending": return "warning";
      case "Inactive": return "secondary";
      default: return "info";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle status change via toggle
  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      setUpdateMessage({ type: '', text: '' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state
      setCurrentStudent(prev => ({
        ...prev,
        status: newStatus,
        updated_at: new Date().toISOString().split('T')[0]
      }));

      setUpdateMessage({ 
        type: 'success', 
        text: `Student status updated to ${newStatus} successfully!` 
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setUpdateMessage({ type: '', text: '' });
      }, 3000);

    } catch (error) {
      console.error("Error updating student status:", error);
      setUpdateMessage({ 
        type: 'danger', 
        text: 'Failed to update student status. Please try again.' 
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle quick status toggle
  const handleQuickStatusToggle = () => {
    const newStatus = currentStudent.status === "Active" ? "Inactive" : "Active";
    handleStatusChange(newStatus);
  };

  return (
    <Container fluid className="px-4 py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Student Details</h4>
          <p className="text-muted mb-0">Student ID: {currentStudent.student_id}</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={() => navigate("/students")}>
            <i className="bi bi-arrow-left me-2"></i>
            Back to Students
          </Button>
        </div>
      </div>

      {/* Status Update Message */}
      {updateMessage.text && (
        <Alert variant={updateMessage.type} className="mb-4">
          <div className="d-flex align-items-center">
            <i className={`bi bi-${updateMessage.type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
            <span>{updateMessage.text}</span>
          </div>
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {/* Student Information Card */}
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Student Information</h5>
              <div className="d-flex align-items-center gap-3">
                <span className="text-muted">Status:</span>
                <Form.Check
                  type="switch"
                  id="student-status-toggle"
                  label={
                    <Badge bg={getStatusVariant(currentStudent.status)} className="fs-6">
                      {currentStudent.status}
                    </Badge>
                  }
                  checked={currentStudent.status === "Active"}
                  onChange={handleQuickStatusToggle}
                  disabled={updatingStatus}
                />
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td className="fw-bold" style={{ width: '140px' }}>Full Name:</td>
                        <td>{currentStudent.first_given_name} {currentStudent.family_name}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Preferred Name:</td>
                        <td>{currentStudent.preferred_first_name}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Gender:</td>
                        <td>{currentStudent.gender}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Date of Birth:</td>
                        <td>{formatDate(currentStudent.date_of_birth)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td className="fw-bold" style={{ width: '140px' }}>Enrollment Year:</td>
                        <td>{currentStudent.mainstream_enrollment_year}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Status:</td>
                        <td>
                          <Badge bg={getStatusVariant(currentStudent.status)}>
                            {currentStudent.status}
                          </Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Classroom:</td>
                        <td>{currentStudent.classroom || "Not assigned"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Overseas Student:</td>
                        <td>{currentStudent.overseas_student}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Parent/Guardian Information */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Parent/Guardian Information</h5>
            </Card.Header>
            <Card.Body>
              {currentStudent.parent_carers && currentStudent.parent_carers.length > 0 ? (
                currentStudent.parent_carers.map((parent, index) => (
                  <div key={index} className={index > 0 ? "mt-4 pt-3 border-top" : ""}>
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">
                          Parent {index + 1} {index === 0 && <Badge bg="primary">Primary</Badge>}
                        </h6>
                        <Table borderless>
                          <tbody>
                            <tr>
                              <td className="fw-bold" style={{ width: '120px' }}>Name:</td>
                              <td>{parent.first_name} {parent.last_name}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Email:</td>
                              <td>
                                <a href={`mailto:${parent.email}`} className="text-decoration-none">
                                  {parent.email}
                                </a>
                              </td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">&nbsp;</h6>
                        <Table borderless>
                          <tbody>
                            <tr>
                              <td className="fw-bold" style={{ width: '120px' }}>Phone:</td>
                              <td>
                                <a href={`tel:${parent.mobile_phone}`} className="text-decoration-none">
                                  {parent.mobile_phone}
                                </a>
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Relationship:</td>
                              <td>Parent</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </div>
                ))
              ) : (
                <p className="text-muted">No parent/guardian information available.</p>
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
                  Send Message to Parent
                </Button>
                <Button variant="outline-success">
                  <i className="bi bi-file-text me-2"></i>
                  Generate Report
                </Button>
                <Button variant="outline-info">
                  <i className="bi bi-calendar me-2"></i>
                  View Attendance
                </Button>
                {currentStudent.status === "Active" && (
                  <Button 
                    variant="outline-warning"
                    onClick={() => handleStatusChange("Inactive")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Deactivating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-pause-circle me-2"></i>
                        Deactivate Student
                      </>
                    )}
                  </Button>
                )}
                {currentStudent.status === "Inactive" && (
                  <Button 
                    variant="outline-success"
                    onClick={() => handleStatusChange("Active")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Activating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play-circle me-2"></i>
                        Activate Student
                      </>
                    )}
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Student Summary */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Student Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-person-fill text-primary" style={{ fontSize: '2rem' }}></i>
                </div>
                <h5>{currentStudent.first_given_name} {currentStudent.family_name}</h5>
                <p className="text-muted">{currentStudent.student_id}</p>
                
                <div className="mb-3">
                  <Badge bg={getStatusVariant(currentStudent.status)} className="fs-6">
                    {currentStudent.status}
                  </Badge>
                </div>
                
                <div className="d-flex justify-content-around mt-4">
                  <div className="text-center">
                    <div className="fw-bold text-primary">95%</div>
                    <small className="text-muted">Attendance</small>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold text-success">A</div>
                    <small className="text-muted">Grade Avg</small>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold text-info">12</div>
                    <small className="text-muted">Subjects</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentDetails;