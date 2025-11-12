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
  Spinner
} from "react-bootstrap";

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const studentData = location.state?.studentData;

  const [currentStudent, setCurrentStudent] = useState(null);
  const [loading, setLoading] = useState(!studentData);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });

  // If no student data was passed, fetch it using the ID
  useEffect(() => {
    if (!studentData && id) {
      fetchStudentData();
    } else if (studentData) {
      setCurrentStudent(studentData);
      setLoading(false);
    }
  }, [id, studentData]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Replace with your actual API endpoint
      const response = await fetch(`https://urbanviewre.com/wstsc_backend/public/api/class-students/student/${id}`, {
        headers: {
          'Authorization': 'Bearer 22|LzjQUJVwoCbICQGBpypkoiLHF7YQsgnUgT7zvPMmdeb100a6',
          'Accept': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch student data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentStudent(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch student data');
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      setError('Failed to load student data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Safe data access functions
  const getStudentData = () => {
    return currentStudent?.student || {};
  };

  const getParentsData = () => {
    return currentStudent?.parents_carers || [];
  };

  const getEmergencyContacts = () => {
    return currentStudent?.emergency_contacts || [];
  };

  const getClasses = () => {
    return currentStudent?.classes || [];
  };

  const getSummary = () => {
    return currentStudent?.summary || {};
  };

  const getStatusVariant = (status) => {
    if (!status) return "secondary";
    
    switch (status.toLowerCase()) {
      case "approved": 
      case "active": 
        return "success";
      case "pending": 
        return "warning";
      case "inactive": 
        return "secondary";
      default: 
        return "info";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Handle status change via toggle
  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      setUpdateMessage({ type: '', text: '' });

      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update local state
      setCurrentStudent(prev => ({
        ...prev,
        student: {
          ...prev?.student,
          status: newStatus
        }
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
    const student = getStudentData();
    const newStatus = student.status === "approved" ? "inactive" : "approved";
    handleStatusChange(newStatus);
  };

  if (loading) {
    return (
      <Container fluid className="px-4 py-3">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
          <Spinner animation="border" variant="primary" />
          <span className="ms-2">Loading student data...</span>
        </div>
      </Container>
    );
  }

  if (error || !currentStudent) {
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
            <Alert variant="danger">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error || "Student data not found."}
            </Alert>
            <div className="d-flex gap-2 justify-content-center">
              <Button variant="primary" onClick={() => navigate("/students")}>
                Return to Students List
              </Button>
              <Button variant="outline-primary" onClick={fetchStudentData}>
                Try Again
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  const student = getStudentData();
  const parents_carers = getParentsData();
  const emergency_contacts = getEmergencyContacts();
  const classes = getClasses();
  const summary = getSummary();

  return (
    <Container fluid className="px-4 py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Student Details</h4>
          <p className="text-muted mb-0">
            {student.enrollment_id ? `Enrollment ID: ${student.enrollment_id}` : 'Student Details'}
          </p>
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
              {student.status && (
                <div className="d-flex align-items-center gap-3">
                  <span className="text-muted">Status:</span>
                  <Form.Check
                    type="switch"
                    id="student-status-toggle"
                    label={
                      <Badge bg={getStatusVariant(student.status)} className="fs-6">
                        {student.status}
                      </Badge>
                    }
                    checked={student.status === "approved"}
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
                        <td className="fw-bold" style={{ width: '140px' }}>Full Name:</td>
                        <td>{student.name || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Preferred Name:</td>
                        <td>{student.preferred_name || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Gender:</td>
                        <td>{student.gender || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Date of Birth:</td>
                        <td>{formatDate(student.date_of_birth)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td className="fw-bold" style={{ width: '140px' }}>Enrollment ID:</td>
                        <td>{student.enrollment_id || "N/A"}</td>
                      </tr>
                      {student.status && (
                        <tr>
                          <td className="fw-bold">Status:</td>
                          <td>
                            <Badge bg={getStatusVariant(student.status)}>
                              {student.status}
                            </Badge>
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td className="fw-bold">Current Class:</td>
                        <td>
                          {classes.length > 0 ? 
                            classes[0].classroom?.class_name || "N/A" : 
                            "Not assigned"
                          }
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Class ID:</td>
                        <td>
                          {classes.length > 0 ? 
                            classes[0].classroom?.class_id || "N/A" : 
                            "N/A"
                          }
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Parent/Guardian Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Parent/Guardian Information</h5>
            </Card.Header>
            <Card.Body>
              {parents_carers.length > 0 ? (
                parents_carers.map((parent, index) => (
                  <div key={parent.parent_carer_id || index} className={index > 0 ? "mt-4 pt-3 border-top" : ""}>
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">
                          {parent.relationship_to_student || "Parent/Guardian"} 
                          {index === 0 && <Badge bg="primary" className="ms-2">Primary</Badge>}
                        </h6>
                        <Table borderless>
                          <tbody>
                            <tr>
                              <td className="fw-bold" style={{ width: '120px' }}>Name:</td>
                              <td>{[parent.title, parent.first_name, parent.last_name].filter(Boolean).join(' ') || "N/A"}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Email:</td>
                              <td>
                                {parent.email ? (
                                  <a href={`mailto:${parent.email}`} className="text-decoration-none">
                                    {parent.email}
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Occupation:</td>
                              <td>{parent.occupation || "N/A"}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">&nbsp;</h6>
                        <Table borderless>
                          <tbody>
                            <tr>
                              <td className="fw-bold" style={{ width: '120px' }}>Mobile:</td>
                              <td>
                                {parent.mobile_phone ? (
                                  <a href={`tel:${parent.mobile_phone}`} className="text-decoration-none">
                                    {parent.mobile_phone}
                                  </a>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Alternative Phone:</td>
                              <td>{parent.alternative_phone || "N/A"}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Type:</td>
                              <td className="text-capitalize">
                                {parent.parent_type ? parent.parent_type.replace(/_/g, ' ') : "N/A"}
                              </td>
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

          {/* Emergency Contacts */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Emergency Contacts</h5>
            </Card.Header>
            <Card.Body>
              {emergency_contacts.length > 0 ? (
                emergency_contacts.map((contact, index) => (
                  <div key={index} className={index > 0 ? "mt-4 pt-3 border-top" : ""}>
                    <Row>
                      <Col md={6}>
                        <h6 className="mb-3">
                          {contact.preference === 'first' ? 'Primary' : 'Secondary'} Emergency Contact
                          {contact.preference && (
                            <Badge bg={contact.preference === 'first' ? 'success' : 'info'} className="ms-2">
                              {contact.preference}
                            </Badge>
                          )}
                        </h6>
                        <Table borderless>
                          <tbody>
                            <tr>
                              <td className="fw-bold" style={{ width: '120px' }}>Name:</td>
                              <td>{[contact.given_name, contact.family_name].filter(Boolean).join(' ') || "N/A"}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Relationship:</td>
                              <td>{contact.relationship_to_student || "N/A"}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                      <Col md={6}>
                        <h6 className="mb-3">&nbsp;</h6>
                        <Table borderless>
                          <tbody>
                            <tr>
                              <td className="fw-bold" style={{ width: '120px' }}>Mobile:</td>
                              <td>{contact.mobile_phone || "N/A"}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Home Phone:</td>
                              <td>{contact.home_phone || "N/A"}</td>
                            </tr>
                            <tr>
                              <td className="fw-bold">Work Phone:</td>
                              <td>{contact.work_phone || "N/A"}</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </div>
                ))
              ) : (
                <p className="text-muted">No emergency contacts available.</p>
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
                {student.status === "approved" && (
                  <Button 
                    variant="outline-warning"
                    onClick={() => handleStatusChange("inactive")}
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
                {student.status === "inactive" && (
                  <Button 
                    variant="outline-success"
                    onClick={() => handleStatusChange("approved")}
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
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Student Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                     style={{ width: '80px', height: '80px' }}>
                  <i className="bi bi-person-fill text-primary" style={{ fontSize: '2rem' }}></i>
                </div>
                <h5>{student.name || "Student Name"}</h5>
                <p className="text-muted">
                  {student.enrollment_id ? `Enrollment ID: ${student.enrollment_id}` : 'Student'}
                </p>
                
                {student.status && (
                  <div className="mb-3">
                    <Badge bg={getStatusVariant(student.status)} className="fs-6">
                      {student.status}
                    </Badge>
                  </div>
                )}
                
                <div className="d-flex justify-content-around mt-4">
                  <div className="text-center">
                    <div className="fw-bold text-primary">{summary.total_classes || 0}</div>
                    <small className="text-muted">Classes</small>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold text-success">{summary.parent_count || 0}</div>
                    <small className="text-muted">Parents</small>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold text-info">{summary.emergency_contact_count || 0}</div>
                    <small className="text-muted">Emergency Contacts</small>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Class Information */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Class Information</h5>
            </Card.Header>
            <Card.Body>
              {classes.length > 0 ? (
                classes.map((classInfo, index) => (
                  <div key={classInfo.csid || index} className={index > 0 ? "mt-3 pt-3 border-top" : ""}>
                    <h6>{classInfo.classroom?.class_name || "Unnamed Class"}</h6>
                    <Table borderless size="sm">
                      <tbody>
                        <tr>
                          <td className="fw-bold">Class ID:</td>
                          <td>{classInfo.classroom?.class_id || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Enrollment Year:</td>
                          <td>{classInfo.enr_year || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold">Status:</td>
                          <td>
                            <Badge bg={classInfo.is_active ? "success" : "secondary"}>
                              {classInfo.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>
                ))
              ) : (
                <p className="text-muted">No class information available.</p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default StudentDetails;