// src/pages/AssignPrincipal.js
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
  Form,
  InputGroup,
  Breadcrumb
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import api from "../../config/axiosConfig";

const AssignPrincipal = () => {
  const navigate = useNavigate();
  const [persons, setPersons] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingPersons, setLoadingPersons] = useState(true);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [nominator, setNominator] = useState(null);
  const [seconder, setSeconder] = useState(null);
  const [assigningPrincipal, setAssigningPrincipal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    position: "Principal",
    year: new Date().getFullYear(),
    status: "active"
  });

  // Fetch all persons from the API (for nominator/seconder selection)
  const fetchPersons = async () => {
    try {
      setError(null);
      console.log("🟡 Starting to fetch persons from /admin/persons...");
      
      const response = await api.get("/admin/persons");
      console.log("✅ Persons API response:", response);
      
      if (response.data.success) {
        const allPersons = response.data.data.persons || [];
        console.log(`📊 Total persons loaded: ${allPersons.length}`);
        setPersons(allPersons);
      } else {
        console.error("❌ API returned success: false", response.data);
        setError("Failed to fetch persons");
        setPersons([]);
      }
    } catch (err) {
      console.error("❌ Error fetching persons:", err);
      setError("Failed to load persons data");
      setPersons([]);
    } finally {
      setLoadingPersons(false);
    }
  };

  // Fetch available teachers from the dedicated API endpoint
  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      setError(null);
      console.log("🟡 Starting to fetch teachers from /classroom-teachers/available-teachers...");
      
      const response = await api.get("/classroom-teachers/available-teachers");
      console.log("✅ Teachers API response:", response);
      
      if (response.data.success) {
        const teachersData = response.data.data.teachers || [];
        console.log(`👨‍🏫 Teachers loaded: ${teachersData.length}`);
        
        // Transform the teacher data to match our expected format
        const transformedTeachers = teachersData.map(teacher => ({
          // Map the API response to our expected person structure
          peid: teacher.person?.peid || `T${teacher.tid}`,
          person_first_name: teacher.person?.first_name || teacher.name?.split(' ')[0] || '',
          person_last_name: teacher.person?.last_name || teacher.name?.split(' ').slice(1).join(' ') || '',
          full_name: teacher.person?.full_name || teacher.name || '',
          person_email: teacher.person?.email || teacher.email || '',
          person_phone: teacher.person?.phone || teacher.phone || '',
          person_status: teacher.status || 'active',
          person_dob: null, // Not provided in the API
          user: {
            uid: teacher.uid,
            last_login: null, // Not provided in the API
            role: teacher.role || {
              roleid: teacher.role?.roleid,
              role_name: teacher.role?.role_name || 'teacher',
              display_name: teacher.role?.display_name || 'Teacher'
            }
          },
          // Keep original data for reference
          originalData: teacher
        }));

        console.log("📋 Transformed teachers:", transformedTeachers);
        setTeachers(transformedTeachers);
      } else {
        console.error("❌ Teachers API returned success: false", response.data);
        setError("Failed to fetch teachers");
        setTeachers([]);
      }
    } catch (err) {
      console.error("❌ Error fetching teachers:", err);
      setError("Failed to load teachers data");
      setTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Load both persons and teachers
  const loadData = async () => {
    setLoadingPersons(true);
    setLoadingTeachers(true);
    
    try {
      await Promise.all([
        fetchPersons(),
        fetchTeachers()
      ]);
    } catch (error) {
      console.error("❌ Error loading data:", error);
      setError("Failed to load required data");
    }
  };

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(teacher => {
    const searchLower = searchTerm.toLowerCase();
    return (
      teacher.full_name?.toLowerCase().includes(searchLower) ||
      teacher.person_email?.toLowerCase().includes(searchLower) ||
      teacher.peid?.toLowerCase().includes(searchLower)
    );
  });

  // Handle teacher selection
  const handleTeacherSelect = (teacher) => {
    console.log("🎯 Teacher selected:", {
      peid: teacher.peid,
      full_name: teacher.full_name,
      user_id: teacher.user?.uid,
      role: teacher.user?.role,
      originalData: teacher.originalData
    });
    setSelectedTeacher(teacher);
    setSuccessMessage("");
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleAssignPrincipal = async () => {
    console.group("🚀 Starting Principal Assignment");
    
    if (!selectedTeacher) {
      console.error("❌ No teacher selected");
      setError("Please select a teacher to assign as principal");
      console.groupEnd();
      return;
    }

    if (!nominator) {
      console.error("❌ No nominator selected");
      setError("Please select a nominator");
      console.groupEnd();
      return;
    }

    if (!seconder) {
      console.error("❌ No seconder selected");
      setError("Please select a seconder");
      console.groupEnd();
      return;
    }

    // Validate data before sending
    console.log("🔍 Validating data before submission...");
    
    if (!selectedTeacher.user?.uid) {
      console.error("❌ Invalid teacher: Missing user ID", selectedTeacher);
      setError("Invalid teacher selection: Missing user ID");
      console.groupEnd();
      return;
    }

    if (!nominator.peid) {
      console.error("❌ Invalid nominator: Missing PEID", nominator);
      setError("Invalid nominator selection: Missing PEID");
      console.groupEnd();
      return;
    }

    if (!seconder.peid) {
      console.error("❌ Invalid seconder: Missing PEID", seconder);
      setError("Invalid seconder selection: Missing PEID");
      console.groupEnd();
      return;
    }

    try {
      setAssigningPrincipal(true);
      setError("");

      // Use teacher_id from the original API data
      const submissionData = {
        teacher_id: Number(selectedTeacher.originalData?.tid || selectedTeacher.user.uid),
        position: String(formData.position).trim(),
        year: Number(formData.year),
        nominated_by: String(nominator.peid).trim(),
        seconded_by: String(seconder.peid).trim(),
        status: String(formData.status).trim()
      };

      console.log("📤 Prepared submission data:", submissionData);
      console.log("🔍 Data type check:", {
        teacher_id_type: typeof submissionData.teacher_id,
        year_type: typeof submissionData.year,
        nominated_by_type: typeof submissionData.nominated_by,
        seconded_by_type: typeof submissionData.seconded_by
      });

      console.log("👥 Selected individuals:", {
        teacher: {
          name: selectedTeacher.full_name,
          peid: selectedTeacher.peid,
          user_id: selectedTeacher.user?.uid,
          teacher_id: selectedTeacher.originalData?.tid,
          email: selectedTeacher.person_email
        },
        nominator: {
          name: nominator.full_name,
          peid: nominator.peid,
          role: nominator.user?.role?.role_name
        },
        seconder: {
          name: seconder.full_name,
          peid: seconder.peid,
          role: seconder.user?.role?.role_name
        }
      });

      console.log("🌐 Making POST request to /principals...");
      const response = await api.post("/principals", submissionData);
      
      console.log("✅ API Response received:", response);
      console.log("📊 Response data:", response.data);
      
      if (response.data.success) {
        console.log("🎉 Principal assigned successfully!");
        setSuccessMessage("Principal assigned successfully!");
        setTimeout(() => {
          navigate("/principals");
        }, 2000);
      } else {
        console.warn("⚠️ API returned success: false", response.data);
        setError(`Assignment failed: ${response.data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("❌ Error assigning principal:", err);
      
      // Detailed error logging
      console.group("🔍 Detailed Error Analysis");
      
      if (err.response) {
        // Server responded with error status
        console.error("📡 Server Response Error:");
        console.error("Status:", err.response.status);
        console.error("Response Data:", err.response.data);
        
        if (err.response.status === 422) {
          console.error("🛑 422 Validation Error Details:");
          if (err.response.data.errors) {
            console.error("Validation Errors:", err.response.data.errors);
            
            // Show specific field errors
            if (err.response.data.errors.tid) {
              console.error("🔍 TID Error:", err.response.data.errors.tid);
              setError(`Teacher validation error: ${err.response.data.errors.tid[0]}`);
            } else if (err.response.data.errors.teacher_id) {
              console.error("🔍 Teacher ID Error:", err.response.data.errors.teacher_id);
              setError(`Teacher validation error: ${err.response.data.errors.teacher_id[0]}`);
            } else {
              const errorMessages = Object.entries(err.response.data.errors)
                .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
                .join('; ');
              setError(`Validation failed: ${errorMessages}`);
            }
          } else if (err.response.data.message) {
            setError(`Validation error: ${err.response.data.message}`);
          } else {
            setError("Data validation failed. Please check all fields and try again.");
          }
        } else if (err.response.data.message) {
          setError(`Server error: ${err.response.data.message}`);
        } else {
          setError(`Request failed with status ${err.response.status}`);
        }
      } else if (err.request) {
        // Request was made but no response received
        console.error("🌐 Network Error - No response received");
        setError("Network error: Please check your connection and try again.");
      } else {
        // Something else happened
        console.error("⚡ Unexpected Error:", err.message);
        setError("An unexpected error occurred. Please try again.");
      }
      
      console.groupEnd();
    } finally {
      setAssigningPrincipal(false);
      console.groupEnd();
    }
  };

  // Get role badge variant
  const getRoleVariant = (roleName) => {
    if (!roleName) return "secondary";
    
    switch (roleName.toLowerCase()) {
      case "admin":
        return "danger";
      case "teacher":
        return "success";
      case "staff":
        return "info";
      case "parent":
        return "warning";
      default:
        return "secondary";
    }
  };

  // Get role display name
  const getRoleDisplayName = (person) => {
    if (!person.user || !person.user.role) return "No Role";
    
    return person.user.role.display_name || 
           person.user.role.role_name || 
           "Unknown Role";
  };

  // Get status variant
  const getStatusVariant = (status) => {
    if (!status) return "secondary";
    
    switch (status.toLowerCase()) {
      case "active":
        return "success";
      case "inactive":
        return "secondary";
      case "pending":
        return "warning";
      default:
        return "info";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Reset selection
  const handleResetSelection = () => {
    setSelectedTeacher(null);
    setNominator(null);
    setSeconder(null);
    setSearchTerm("");
    setError("");
    setSuccessMessage("");
  };

  // Handle nominator selection
  const handleNominatorSelect = (e) => {
    const selectedPeid = e.target.value;
    const selectedPerson = persons.find(p => p.peid === selectedPeid);
    setNominator(selectedPerson || null);
  };

  // Handle seconder selection
  const handleSeconderSelect = (e) => {
    const selectedPeid = e.target.value;
    const selectedPerson = persons.find(p => p.peid === selectedPeid);
    setSeconder(selectedPerson || null);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Log when selections change
  useEffect(() => {
    console.log("🔄 Selection state updated:", {
      selectedTeacher: selectedTeacher ? selectedTeacher.full_name : "None",
      nominator: nominator ? nominator.full_name : "None", 
      seconder: seconder ? seconder.full_name : "None"
    });
  }, [selectedTeacher, nominator, seconder]);

  const isLoading = loadingPersons || loadingTeachers;

  return (
    <Container fluid className="px-4 py-3">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h4 fw-bold">Assign Principal</h2>
              <p className="text-muted mb-0">
                Select a teacher to assign as principal and choose nominators
              </p>
            </div>
            <Button
              variant="outline-secondary"
              as={Link}
              to="/principals"
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back to Principal Details
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success" className="mb-4">
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {/* Search and Teachers List Card */}
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <i className="bi bi-person-badge me-2"></i>
                Available Teachers ({teachers.length})
              </h5>
              <small className="text-muted">
                {filteredTeachers.length} teachers match your search
              </small>
            </Card.Header>
            <Card.Body>
              {/* Search Bar */}
              <div className="mb-4">
                <InputGroup>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search teachers by name, email, or PEID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => setSearchTerm("")}
                    >
                      <i className="bi bi-x"></i>
                    </Button>
                  )}
                </InputGroup>
              </div>

              {/* Teachers List */}
              {isLoading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" size="lg" />
                  <p className="mt-3 text-muted">Loading teachers...</p>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-person-x display-1 text-muted mb-3"></i>
                  <h5 className="text-muted">
                    {searchTerm ? "No teachers found" : "No Teachers Available"}
                  </h5>
                  <p className="text-muted">
                    {searchTerm 
                      ? "Try adjusting your search terms" 
                      : "There are no available teachers in the system."
                    }
                  </p>
                  {searchTerm && (
                    <Button
                      variant="outline-primary"
                      onClick={() => setSearchTerm("")}
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th width="60px" className="text-center">Select</th>
                        <th>Teacher Details</th>
                        <th>Contact</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Teacher ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTeachers.map((teacher) => (
                        <tr
                          key={teacher.peid}
                          onClick={() => handleTeacherSelect(teacher)}
                          style={{
                            cursor: "pointer",
                            backgroundColor: selectedTeacher?.peid === teacher.peid ? "#e3f2fd" : "transparent",
                            borderLeft: selectedTeacher?.peid === teacher.peid ? "4px solid #0d6efd" : "4px solid transparent"
                          }}
                          className="align-middle"
                        >
                          <td className="text-center">
                            <Form.Check
                              type="radio"
                              name="selectedTeacher"
                              checked={selectedTeacher?.peid === teacher.peid}
                              onChange={() => handleTeacherSelect(teacher)}
                            />
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div
                                className="bg-success rounded-circle d-flex align-items-center justify-content-center text-white me-3"
                                style={{ width: "40px", height: "40px" }}
                              >
                                <i className="bi bi-person-fill"></i>
                              </div>
                              <div>
                                <h6 className="mb-1">{teacher.full_name}</h6>
                                <div className="d-flex flex-wrap gap-1">
                                  <Badge bg="primary" className="fs-7">
                                    {teacher.peid}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="mb-1">
                                <i className="bi bi-envelope text-muted me-1"></i>
                                <small>{teacher.person_email || "No email"}</small>
                              </div>
                              {teacher.person_phone && (
                                <div>
                                  <i className="bi bi-telephone text-muted me-1"></i>
                                  <small>{teacher.person_phone}</small>
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge bg={getRoleVariant(teacher.user?.role?.role_name)}>
                              {getRoleDisplayName(teacher)}
                            </Badge>
                          </td>
                          <td>
                            <Badge bg={getStatusVariant(teacher.person_status)}>
                              {teacher.person_status || "Unknown"}
                            </Badge>
                          </td>
                          <td>
                            <div className="text-center">
                              <small className="text-muted d-block">
                                TID: {teacher.originalData?.tid || "N/A"}
                              </small>
                              <small className="text-muted">
                                UID: {teacher.user?.uid || "N/A"}
                              </small>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Nominator and Seconder Selection Card */}
          {selectedTeacher && (
            <Card>
              <Card.Header className="bg-light">
                <h5 className="mb-0">
                  <i className="bi bi-people me-2"></i>
                  Nomination Details
                </h5>
                <small className="text-muted">
                  Select nominator and seconder for the principal appointment
                </small>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nominator *</Form.Label>
                      <Form.Select
                        value={nominator?.peid || ""}
                        onChange={handleNominatorSelect}
                        required
                      >
                        <option value="">Choose a nominator...</option>
                        {persons.map((person) => (
                          <option key={person.peid} value={person.peid}>
                            {person.full_name} - {getRoleDisplayName(person)}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Person who is nominating this teacher as principal
                      </Form.Text>
                    </Form.Group>
                    {nominator && (
                      <div className="bg-light p-3 rounded">
                        <h6 className="mb-2">Selected Nominator:</h6>
                        <div className="d-flex align-items-center">
                          <div
                            className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white me-3"
                            style={{ width: "40px", height: "40px" }}
                          >
                            <i className="bi bi-person-fill"></i>
                          </div>
                          <div>
                            <strong>{nominator.full_name}</strong>
                            <div>
                              <Badge bg={getRoleVariant(nominator.user?.role?.role_name)}>
                                {getRoleDisplayName(nominator)}
                              </Badge>
                            </div>
                            <small className="text-muted">{nominator.person_email}</small>
                          </div>
                        </div>
                      </div>
                    )}
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Seconder *</Form.Label>
                      <Form.Select
                        value={seconder?.peid || ""}
                        onChange={handleSeconderSelect}
                        required
                      >
                        <option value="">Choose a seconder...</option>
                        {persons.map((person) => (
                          <option key={person.peid} value={person.peid}>
                            {person.full_name} - {getRoleDisplayName(person)}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Person who is seconding this nomination
                      </Form.Text>
                    </Form.Group>
                    {seconder && (
                      <div className="bg-light p-3 rounded">
                        <h6 className="mb-2">Selected Seconder:</h6>
                        <div className="d-flex align-items-center">
                          <div
                            className="bg-info rounded-circle d-flex align-items-center justify-content-center text-white me-3"
                            style={{ width: "40px", height: "40px" }}
                          >
                            <i className="bi bi-person-fill"></i>
                          </div>
                          <div>
                            <strong>{seconder.full_name}</strong>
                            <div>
                              <Badge bg={getRoleVariant(seconder.user?.role?.role_name)}>
                                {getRoleDisplayName(seconder)}
                              </Badge>
                            </div>
                            <small className="text-muted">{seconder.person_email}</small>
                          </div>
                        </div>
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col lg={4}>
          {/* Assignment Details Card */}
          <Card className="sticky-top" style={{ top: "20px" }}>
            <Card.Header className="bg-light">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                Assignment Details
              </h5>
            </Card.Header>
            <Card.Body>
              {selectedTeacher ? (
                <>
                  {/* Selected Teacher Info */}
                  <div className="mb-4">
                    <h6 className="border-bottom pb-2 mb-3">
                      <i className="bi bi-person-check me-2"></i>
                      Selected Teacher
                    </h6>
                    <div className="text-center mb-3">
                      <div
                        className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center text-white mb-2"
                        style={{ width: "60px", height: "60px" }}
                      >
                        <i className="bi bi-person-fill fs-4"></i>
                      </div>
                      <h6 className="mb-1">{selectedTeacher.full_name}</h6>
                      <Badge bg={getRoleVariant(selectedTeacher.user?.role?.role_name)}>
                        {getRoleDisplayName(selectedTeacher)}
                      </Badge>
                    </div>
                    <Table borderless size="sm">
                      <tbody>
                        <tr>
                          <td className="fw-bold text-muted" width="40%">PEID:</td>
                          <td>{selectedTeacher.peid}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-muted">Email:</td>
                          <td>{selectedTeacher.person_email || "No email"}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-muted">Status:</td>
                          <td>
                            <Badge bg={getStatusVariant(selectedTeacher.person_status)}>
                              {selectedTeacher.person_status || "Unknown"}
                            </Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-muted">Teacher ID:</td>
                          <td>{selectedTeacher.originalData?.tid || "N/A"}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-muted">User ID:</td>
                          <td>{selectedTeacher.user?.uid || "N/A"}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </div>

                  {/* Assignment Form */}
                  <div className="mb-4">
                    <h6 className="border-bottom pb-2 mb-3">
                      <i className="bi bi-pencil me-2"></i>
                      Appointment Details
                    </h6>
                    <Form>
                      <Form.Group className="mb-3">
                        <Form.Label>Position *</Form.Label>
                        <Form.Control
                          type="text"
                          name="position"
                          value={formData.position}
                          onChange={handleInputChange}
                          required
                        />
                      </Form.Group>

                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Academic Year *</Form.Label>
                            <Form.Control
                              type="number"
                              name="year"
                              value={formData.year}
                              onChange={handleInputChange}
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Status *</Form.Label>
                            <Form.Select
                              name="status"
                              value={formData.status}
                              onChange={handleInputChange}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="pending">Pending</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Form>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-grid gap-2 mt-4">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleAssignPrincipal}
                      disabled={assigningPrincipal || !selectedTeacher || !nominator || !seconder}
                    >
                      {assigningPrincipal ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Assigning Principal...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Assign as Principal
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={handleResetSelection}
                      disabled={assigningPrincipal}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Reset Selection
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-person-badge display-1"></i>
                  <h5 className="mt-3">No Teacher Selected</h5>
                  <p>
                    Please select a teacher from the list to assign as principal
                  </p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AssignPrincipal;