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
import Loader from "../../Pages/Loader";

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const studentData = location.state?.studentData;

  const [currentStudent, setCurrentStudent] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(!studentData);
  const [loadingClassrooms, setLoadingClassrooms] = useState(false);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("parents");
  const [userRole, setUserRole] = useState(null);

  // Get user role from localStorage
  useEffect(() => {
    const getUserRole = () => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          const role = parsedUserData.primary_role?.role_name || 
                      parsedUserData.all_roles?.[0]?.role_name || 
                      parsedUserData.role?.role_name || 
                      null;
          setUserRole(role);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    };
    getUserRole();
  }, []);

  // Fetch classrooms data
  const fetchClassrooms = async () => {
    try {
      setLoadingClassrooms(true);
      const response = await api.get("/classrooms");
      console.log("🏫 Classrooms API response:", response.data);
      
      // Extract classrooms array from the response
      let classroomsData = [];
      
      if (response.data.data && Array.isArray(response.data.data.classrooms)) {
        classroomsData = response.data.data.classrooms;
      } else if (Array.isArray(response.data.classrooms)) {
        classroomsData = response.data.classrooms;
      } else if (Array.isArray(response.data.data)) {
        classroomsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        classroomsData = response.data;
      }
      
      console.log("📚 Final classrooms data:", classroomsData);
      setClassrooms(classroomsData);
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      setClassrooms([]);
    } finally {
      setLoadingClassrooms(false);
    }
  };

  // Helper function to get class name from ID
  const getClassName = (classId) => {
    if (!classId || classId === "null" || classId === "undefined") {
      return "Not assigned";
    }
    
    const classroomsArray = Array.isArray(classrooms) ? classrooms : [];
    
    console.log("🔍 Class lookup:", {
      classId,
      classroomsCount: classroomsArray.length,
      classrooms: classroomsArray.map(cls => ({ class_id: cls.class_id, class_name: cls.class_name }))
    });
    
    if (classroomsArray.length === 0) {
      return loadingClassrooms ? "Loading..." : classId;
    }
    
    // Find classroom by class_id (exact match)
    const classroom = classroomsArray.find(cls => {
      return cls.class_id && cls.class_id.toString() === classId.toString();
    });
    
    console.log("✅ Found classroom:", classroom);
    
    // Return class name if found
    if (classroom) {
      return classroom.class_name || classId;
    }
    
    return classId; // Return the ID if no name found
  };

  // Data transformation function for different data structures
  const transformStudentData = (data) => {
    console.log("Transforming student data:", data);

    // If data comes from location state (student list click)
    if (data.studid && data.student_name) {
      const transformedData = {
        student: {
          id: data.studid,
          enrollment_id: data.enrid,
          studid: data.studid,
          name: data.student_name,
          preferred_name: data.preferred_name || "",
          gender: data.gender,
          date_of_birth: data.date_of_birth,
          status: data.status,
          mainstream_school_name: data.mainstream_school,
          enrol_class_in_WSTSC: data.class_grade,
          enrolment_date: data.enrollment_date,
          submitted_at: data.submitted_at,
          approved_at: data.actioned_at,
          approved_by: data.approved_by,
        },
        parents_carers: [],
        emergency_contacts: [],
        classes: data.class_grade ? [{
          class_id: data.class_grade,
          class_name: data.class_grade,
          is_active: true
        }] : [],
        summary: {
          total_classes: data.class_grade ? 1 : 0,
          parent_count: data.parent_count || 0,
          emergency_contact_count: data.has_emergency_contacts ? 1 : 0,
          has_medical_details: data.has_medical_details || false,
        },
      };
      return transformedData;
    }

    // If data comes from the new student details API
    if (data.student_info && data.parent_carers) {
      const transformedParents = data.parent_carers.map((parent, index) => {
        return {
          parent_carer_id: index + 1,
          carer_type: parent.carer_type,
          title: parent.title,
          first_name: parent.first_name,
          last_name: parent.last_name,
          middle_name: parent.middle_name,
          gender: parent.gender,
          relationship_to_student: parent.relationship_to_student,
          country_of_birth: parent.country_of_birth,
          date_of_birth: parent.date_of_birth,
          nationality: parent.nationality,
          email: parent.email,
          mobile_phone: parent.mobile_phone,
          alternative_phone: parent.alternative_phone,
          marital_status: parent.marital_status,
          occupation: parent.occupation,
          address: parent.address ? `${parent.address.street_number} ${parent.address.street_name}, ${parent.address.suburb}, ${parent.address.state} ${parent.address.postal_code}, ${parent.address.country}` : "N/A"
        };
      });

      const transformedEmergencyContacts = data.emergency_contacts.map((contact, index) => {
        return {
          preference: contact.preference === "1" ? "first" : "secondary",
          given_name: contact.given_name,
          family_name: contact.family_name,
          relationship_to_student: contact.relationship,
          mobile_phone: contact.mobile_phone,
          home_phone: contact.home_phone,
          work_phone: contact.work_phone
        };
      });

      const transformedClasses = data.class_assignments.map((classInfo, index) => {
        return {
          class_id: classInfo.class_id,
          class_name: classInfo.class_name,
          class_is_active: classInfo.class_is_active,
          enr_year: classInfo.enr_year,
          is_active: classInfo.is_active,
          assignment_date: classInfo.assignment_date,
          teachers: classInfo.teachers || [],
          teacher_count: classInfo.teacher_count || 0
        };
      });

      const transformedData = {
        student: {
          id: data.student_info.studid,
          enrollment_id: data.student_info.enrid,
          studid: data.student_info.studid,
          name: `${data.student_info.first_given_name || ""} ${data.student_info.family_name || ""}`.trim(),
          preferred_name: data.student_info.preferred_first_name || "",
          gender: data.student_info.gender,
          date_of_birth: data.student_info.date_of_birth,
          status: data.student_info.status,
          mainstream_school_name: data.student_info.mainstream_school_name,
          mainstream_enrollment_year: data.student_info.mainstream_enrollment_year,
          enrol_class_in_WSTSC: data.student_info.enrol_class_in_WSTSC,
          age: data.student_info.age,
          age_at_enrollment: data.student_info.age_at_enrollment,
          enrolment_date: data.student_info.enrolment_date,
          submitted_by: data.submission_info?.submitted_by,
          submitted_at: data.submission_info?.submitted_at,
          approved_by: data.submission_info?.approved_by,
          approved_at: data.submission_info?.approved_at,
          action_reason: data.submission_info?.action_reason
        },
        parents_carers: transformedParents,
        emergency_contacts: transformedEmergencyContacts,
        medical_details: data.medical_details,
        personal_declaration: data.personal_declaration,
        classes: transformedClasses,
        summary: {
          total_classes: data.summary?.class_assignment_count || 0,
          active_class_count: data.summary?.active_class_count || 0,
          parent_count: data.summary?.parent_carer_count || 0,
          emergency_contact_count: data.summary?.emergency_contact_count || 0,
          total_teachers: data.summary?.total_teachers || 0,
          has_medical_details: data.summary?.has_medical_details || false,
          has_personal_declaration: data.summary?.has_personal_declaration || false
        },
      };
      return transformedData;
    }

    // If data comes from parent API (my-enrollments)
    if (data.student && data.parent_carer_1) {
      return {
        student: {
          id: data.student.enrollment_id,
          enrollment_id: data.student.enrollment_id,
          name: `${data.student.first_given_name || ""} ${data.student.family_name || ""}`.trim(),
          preferred_name: data.student.preferred_first_name || "",
          gender: data.student.gender,
          date_of_birth: data.student.date_of_birth,
          status: data.student.status,
          mainstream_school_name: data.student.mainstream_school_name,
          mainstream_enrollment_year: data.student.mainstream_enrollment_year,
          enrol_class_in_WSTSC: data.student.enrol_class_in_WSTSC,
          classroom_info: data.student.classroom_info,
          submitted_by: data.student.submitted_by,
          submitted_at: data.student.submitted_at,
          approved_by: data.student.approved_by,
          approved_at: data.student.approved_at,
        },
        parents_carers: [{
          parent_carer_id: 1,
          title: data.parent_carer_1.title,
          first_name: data.parent_carer_1.first_name,
          last_name: data.parent_carer_1.last_name,
          relationship_to_student: data.parent_carer_1.relationship_to_student,
          email: data.parent_carer_1.email,
          mobile_phone: data.parent_carer_1.mobile_phone,
          alternative_phone: data.parent_carer_1.alternative_phone,
          occupation: data.parent_carer_1.occupation,
          address: `${data.parent_carer_1.street_number} ${data.parent_carer_1.street_name}, ${data.parent_carer_1.suburb}, ${data.parent_carer_1.state} ${data.parent_carer_1.postal_code}`
        }],
        emergency_contacts: [{
          preference: "first",
          given_name: data.first_emergency_contact.given_name,
          family_name: data.first_emergency_contact.family_name,
          relationship_to_student: data.first_emergency_contact.relationship_to_student,
          mobile_phone: data.first_emergency_contact.mobile_phone,
          home_phone: data.first_emergency_contact.home_phone,
          work_phone: data.first_emergency_contact.work_phone
        }],
        medical_details: data.medical_details,
        personal_declaration: data.personal_declaration,
        classes: data.student.classroom_info ? [{
          classroom: {
            class_id: data.student.classroom_info.class_id,
            class_name: data.student.classroom_info.class_name,
            grade_level: data.student.classroom_info.grade_level,
            subject: data.student.classroom_info.subject
          }
        }] : [],
        summary: {
          total_classes: data.student.classroom_info ? 1 : 0,
          parent_count: 1,
          emergency_contact_count: 1,
        },
      };
    }

    // Default return for unknown structures
    return {
      student: data.student || {},
      parents_carers: data.parents_carers || [],
      emergency_contacts: data.emergency_contacts || [],
      classes: data.classes || [],
      summary: data.summary || {},
      medical_details: data.medical_details,
      personal_declaration: data.personal_declaration,
    };
  };

  // Fetch detailed student data
  const fetchDetailedStudentData = async () => {
    try {
      setLoading(true);
      let endpoint = userRole === 'parent' ? `/my-enrollments/${id}` : `/students/${id}`;
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        const transformedData = transformStudentData(response.data.data);
        setCurrentStudent(transformedData);
      } else {
        throw new Error(response.data.message || "Failed to fetch student data");
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Main useEffect
  useEffect(() => {
    if (studentData) {
      const transformedData = transformStudentData(studentData);
      setCurrentStudent(transformedData);
      setLoading(false);

      const hasParents = transformedData.parents_carers && transformedData.parents_carers.length > 0;
      const hasEmergencyContacts = transformedData.emergency_contacts && transformedData.emergency_contacts.length > 0;
      
      if (!hasParents || !hasEmergencyContacts) {
        fetchDetailedStudentData();
      }
    } else if (!studentData && id && userRole !== null) {
      fetchDetailedStudentData();
    } else if (!id) {
      setError("No student ID provided");
      setLoading(false);
    }

    // Fetch classrooms data
    fetchClassrooms();
  }, [id, studentData, userRole]);

  // Data access functions
  const getStudentData = () => currentStudent?.student || {};
  const getParentsData = () => currentStudent?.parents_carers || [];
  const getEmergencyContacts = () => currentStudent?.emergency_contacts || [];
  const getClasses = () => currentStudent?.classes || [];
  const getSummary = () => currentStudent?.summary || {};

  const getStatusVariant = (status) => {
    if (!status) return "secondary";
    switch (status.toLowerCase()) {
      case "approved":
      case "active": return "success";
      case "pending": return "warning";
      case "inactive": return "secondary";
      default: return "info";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    if (!userRole || userRole === 'parent') {
      setUpdateMessage({
        type: 'warning',
        text: 'You do not have permission to change student status.'
      });
      return;
    }

    try {
      setUpdatingStatus(true);
      setUpdateMessage({ type: "", text: "" });

      const response = await api.put(`/students/${id}/status`, {
        status: newStatus,
      });

      if (response.data.success) {
        setCurrentStudent((prev) => ({
          ...prev,
          student: {
            ...prev?.student,
            status: newStatus,
          },
        }));

        setUpdateMessage({
          type: "success",
          text: `Student status updated to ${newStatus} successfully!`,
        });
      } else {
        throw new Error(response.data.message || "Failed to update student status");
      }

      setTimeout(() => {
        setUpdateMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Error updating student status:", error);
      setUpdateMessage({
        type: "danger",
        text: error.response?.data?.message || "Failed to update student status. Please try again.",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle quick status toggle
  const handleQuickStatusToggle = () => {
    if (!userRole || userRole === 'parent') {
      setUpdateMessage({
        type: 'warning',
        text: 'You do not have permission to change student status.'
      });
      return;
    }

    const student = getStudentData();
    const newStatus = student.status === "approved" ? "inactive" : "approved";
    handleStatusChange(newStatus);
  };

  if (loading) {
    return <Loader />;
  }

  if (error || !currentStudent) {
    return (
      <Container fluid className="px-4 py-3">
        <div className="content-header d-flex justify-content-between align-items-center mb-4">
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
              <Button variant="outline-primary" onClick={() => window.location.reload()}>
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

  // Debug logging
  console.log("🎯 Current state before render:", {
    studentClassId: student.enrol_class_in_WSTSC,
    classroomsCount: classrooms.length,
    loadingClassrooms,
    classroomsSample: classrooms.slice(0, 3)
  });

  return (
    <Container fluid className="px-md-4 px-0 py-3">
      {/* Header */}
      <div className="content-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Student Details</h4>
          {/* <p className="text-muted mb-0">
            {student.studid ? `Student ID: ${student.studid}` : 
             student.enrollment_id ? `Enrollment ID: ${student.enrollment_id}` : "Student Details"}
            {userRole === 'parent' && (
              <Badge bg="info" className="ms-2">Parent View</Badge>
            )}
          </p> */}
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
            <i className={`bi bi-${updateMessage.type === "success" ? "check-circle" : "exclamation-triangle"} me-2`}></i>
            <span>{updateMessage.text}</span>
          </div>
        </Alert>
      )}

      <Row>
        <Col lg={8}>
          {/* Student Information Card */}
          <Card className="mb-4">
            <Card.Header className="d-flex flex-md-row flex-column justify-content-between align-items-center">
              <h5 className="mb-0">Student Information</h5>
              {student.status && (
                <div className="content-header d-flex align-items-center gap-3 mt-3 mt-md-0">
                  <span className="text-muted">Status:</span>
                  {userRole && userRole !== 'parent' ? (
                    <Form.Check
                      type="switch"
                      id="student-status-toggle"
                      label={<Badge bg={getStatusVariant(student.status)} className="fs-6">{student.status}</Badge>}
                      checked={student.status === "approved" || student.status === "Active"}
                      onChange={handleQuickStatusToggle}
                      disabled={updatingStatus}
                    />
                  ) : (
                    <Badge bg={getStatusVariant(student.status)} className="fs-6">{student.status}</Badge>
                  )}
                </div>
              )}
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <table borderless>
                    <tbody>
                      <tr>
                        <td className="fw-bold" style={{ width: "140px" }}>Full Name:</td>
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
                      <tr>
                        <td className="fw-bold">Student ID:</td>
                        <td>{student.studid || "N/A"}</td>
                      </tr>
                    </tbody>
                  </table>
                </Col>
                <Col md={6}>
                  <table borderless>
                    <tbody>
                      <tr>
                        <td className="fw-bold" style={{ width: "140px" }}>Enrollment ID:</td>
                        <td>{student.enrollment_id || "N/A"}</td>
                      </tr>
                      {/* {student.status && (
                        <tr>
                          <td className="fw-bold">Status:</td>
                          <td><Badge bg={getStatusVariant(student.status)}>{student.status}</Badge></td>
                        </tr>
                      )} */}
                      <tr>
                        <td className="fw-bold">Mainstream School:</td>
                        <td>{student.mainstream_school_name || "N/A"}</td>
                      </tr>
                    </tbody>
                  </table>
                </Col>
              </Row>
              
              {/* Submission Information */}
              {student.submitted_at && (
                <div className="mt-4 pt-3 border-top">
                  <h6 className="mb-3">Submission Information</h6>
                  <Row>
                    <Col md={6}>
                      <table borderless size="sm">
                        <tbody>
                          <tr>
                            <td className="fw-bold">Submitted At:</td>
                            <td>{formatDate(student.submitted_at)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Col>
                    <Col md={6}>
                      <table borderless size="sm">
                        <tbody>
                          <tr>
                            <td className="fw-bold">Approved At:</td>
                            <td>{formatDate(student.approved_at)}</td>
                          </tr>
                          {student.approved_by && (
                            <tr>
                              <td className="fw-bold">Approved By:</td>
                              <td>{student.approved_by.name || "N/A"}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </Col>
                  </Row>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Tabbed Section for Additional Information */}
          <Card>
            <Card.Header>
              <Tabs activeKey={activeTab} onSelect={(tab) => setActiveTab(tab)} className="mb-0">
                <Tab eventKey="parents" title={<span><i className="bi bi-people me-1"></i>Parent/Guardian</span>} />
                <Tab eventKey="emergency" title={<span><i className="bi bi-telephone me-1"></i>Emergency Contacts</span>} />
                <Tab eventKey="classes" title={<span><i className="bi bi-book me-1"></i>Class Information</span>} />
              </Tabs>
            </Card.Header>
            <Card.Body>
              {/* Parent/Guardian Information Tab */}
              {activeTab === "parents" && (
                <div>
                  {parents_carers && parents_carers.length > 0 ? (
                    parents_carers.map((parent, index) => (
                      <div key={parent.parent_carer_id || index} className={index > 0 ? "mt-4 pt-3 border-top" : ""}>
                        <Row>
                          <Col md={6}>
                            <h6 className="mb-3">
                              {parent.relationship_to_student || "Parent/Guardian"}
                              {parent.carer_type && (
                                <Badge bg={parent.carer_type === 'primary' ? 'primary' : 'secondary'} className="ms-2">
                                  {parent.carer_type}
                                </Badge>
                              )}
                            </h6>
                            <table borderless>
                              <tbody>
                                <tr>
                                  <td className="fw-bold" style={{ width: "120px" }}>Name:</td>
                                  <td>{[parent.title, parent.first_name, parent.middle_name, parent.last_name].filter(Boolean).join(" ") || "N/A"}</td>
                                </tr>
                                <tr>
                                  <td className="fw-bold">Email:</td>
                                  <td>
                                    {parent.email ? (
                                      <a href={`mailto:${parent.email}`} className="text-decoration-none">{parent.email}</a>
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
                            </table>
                          </Col>
                          <Col md={6}>
                            <h6 className="mb-3">&nbsp;</h6>
                            <table borderless>
                              <tbody>
                                <tr>
                                  <td className="fw-bold" style={{ width: "120px" }}>Mobile:</td>
                                  <td>
                                    {parent.mobile_phone ? (
                                      <a href={`tel:${parent.mobile_phone}`} className="text-decoration-none">{parent.mobile_phone}</a>
                                    ) : (
                                      "N/A"
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="fw-bold">Alternative Phone:</td>
                                  <td>{parent.alternative_phone || "N/A"}</td>
                                </tr>
                                {parent.address && parent.address !== "N/A" && (
                                  <tr>
                                    <td className="fw-bold">Address:</td>
                                    <td>{parent.address}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </Col>
                        </Row>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <i className="bi bi-people text-muted" style={{ fontSize: "3rem" }}></i>
                      <p className="text-muted mt-3">No parent/guardian information available.</p>
                      <Button variant="outline-primary" onClick={fetchDetailedStudentData}>
                        Load Detailed Information
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Emergency Contacts Tab */}
              {activeTab === "emergency" && (
                <div>
                  {emergency_contacts && emergency_contacts.length > 0 ? (
                    emergency_contacts.map((contact, index) => (
                      <div key={index} className={index > 0 ? "mt-4 pt-3 border-top" : ""}>
                        <Row>
                          <Col md={6}>
                            <h6 className="mb-3">
                              {contact.preference === "first" ? "Primary" : "Secondary"} Emergency Contact
                              {/* <Badge bg={contact.preference === "first" ? "success" : "info"} className="ms-2">
                                {contact.preference}
                              </Badge> */}
                            </h6>
                            <table borderless>
                              <tbody>
                                <tr>
                                  <td className="fw-bold" style={{ width: "120px" }}>Name:</td>
                                  <td>{[contact.given_name, contact.family_name].filter(Boolean).join(" ") || "N/A"}</td>
                                </tr>
                                <tr>
                                  <td className="fw-bold">Relationship:</td>
                                  <td>{contact.relationship_to_student || "N/A"}</td>
                                </tr>
                              </tbody>
                            </table>
                          </Col>
                          <Col md={6}>
                            <h6 className="mb-3">&nbsp;</h6>
                            <table borderless>
                              <tbody>
                                <tr>
                                  <td className="fw-bold" style={{ width: "120px" }}>Mobile:</td>
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
                            </table>
                          </Col>
                        </Row>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <i className="bi bi-telephone text-muted" style={{ fontSize: "3rem" }}></i>
                      <p className="text-muted mt-3">No emergency contacts available.</p>
                      <Button variant="outline-primary" onClick={fetchDetailedStudentData}>
                        Load Detailed Information
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Class Information Tab */}
              {activeTab === "classes" && (
                <div>
                  {classes && classes.length > 0 ? (
                    <Row>
                      {classes.map((classInfo, index) => (
                        <Col md={6} key={classInfo.class_id || index} className="mb-3">
                          <div className="card h-100">
                            <div className="card-header">
                              <h6 className="mb-0">
                                {loadingClassrooms ? (
                                  <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Loading...
                                  </>
                                ) : (
                                  getClassName(classInfo.class_id) || "Unnamed Class"
                                )}
                              </h6>
                            </div>
                            <div className="card-body">
                              <table borderless size="sm">
                                <tbody>
                                  <tr>
                                    <td className="fw-bold">Class Name:</td>
                                    <td>
                                      {loadingClassrooms ? (
                                        <Spinner animation="border" size="sm" />
                                      ) : (
                                        getClassName(classInfo.class_id)
                                      )}
                                    </td>
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
                              </table>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  ) : (
                    <div className="text-center py-4">
                      <i className="bi bi-book text-muted" style={{ fontSize: "3rem" }}></i>
                      <p className="text-muted mt-3">No class information available.</p>
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Quick Actions & Status - Only for admin users */}
          {/* {userRole && userRole !== 'parent' && (
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
                    <Button variant="outline-warning" onClick={() => handleStatusChange("inactive")} disabled={updatingStatus}>
                      {updatingStatus ? <><Spinner animation="border" size="sm" className="me-2" />Deactivating...</> : <><i className="bi bi-pause-circle me-2"></i>Deactivate Student</>}
                    </Button>
                  )}
                  {student.status === "inactive" && (
                    <Button variant="outline-success" onClick={() => handleStatusChange("approved")} disabled={updatingStatus}>
                      {updatingStatus ? <><Spinner animation="border" size="sm" className="me-2" />Activating...</> : <><i className="bi bi-play-circle me-2"></i>Activate Student</>}
                    </Button>
                  )}
                </div>
              </Card.Body>
            </Card>
          )} */}

          {/* Student Summary */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Student Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="content-header text-center">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                  <i className="bi bi-person-fill text-primary" style={{ fontSize: "2rem" }}></i>
                </div>
                <h5>{student.name || "Student Name"}</h5>
                <p className="text-muted">
                  {student.studid ? `Student ID: ${student.studid}` : student.enrollment_id ? `Enrollment ID: ${student.enrollment_id}` : "Student"}
                </p>
                
                {/* Show actual class name instead of ID */}
                {student.enrol_class_in_WSTSC && (
                  <div className="mb-2">
                    <small className="text-muted">
                      Class: {loadingClassrooms ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Loading...
                        </>
                      ) : (
                        getClassName(student.enrol_class_in_WSTSC)
                      )}
                    </small>
                  </div>
                )}

                {/* {student.status && (
                  <div className="mb-3">
                    <Badge bg={getStatusVariant(student.status)} className="fs-6">{student.status}</Badge>
                  </div>
                )} */}

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
        </Col>
      </Row>
    </Container>
  );
};

export default StudentDetails;