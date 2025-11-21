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
  const [loading, setLoading] = useState(!studentData);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateMessage, setUpdateMessage] = useState({ type: "", text: "" });
  const [activeTab, setActiveTab] = useState("parents");
  const [userRole, setUserRole] = useState(null);

  // Get user role from localStorage - FIXED: Check primary_role.role_name
  useEffect(() => {
    const getUserRole = () => {
      try {
        const userData = localStorage.getItem('userData');
        console.log("🔍 Raw userData from localStorage:", userData);
        if (userData) {
          const parsedUserData = JSON.parse(userData);
          console.log("👤 Parsed user data from localStorage:", parsedUserData);
          
          // FIX: Check both primary_role.role_name and all_roles[0].role_name
          const role = parsedUserData.primary_role?.role_name || 
                      parsedUserData.all_roles?.[0]?.role_name || 
                      parsedUserData.role?.role_name || 
                      null;
          
          console.log("🎭 User role detected:", role);
          setUserRole(role);
          return role;
        } else {
          console.log("❌ No userData found in localStorage");
        }
      } catch (error) {
        console.error("❌ Error parsing user data from localStorage:", error);
      }
      return null;
    };

    getUserRole();
  }, []);

  // Debug logs for initial props
  console.log("🔍 StudentDetails Component Mounted:", {
    id,
    hasStudentData: !!studentData,
    studentDataFromLocation: studentData,
    locationState: location.state,
    userRole,
  });

  // Data transformation function for different data structures
  const transformStudentData = (data) => {
    console.log("🔄 Starting data transformation with raw data:", data);

    // If data comes from location state (student list click)
    if (data.studid && data.student_name) {
      console.log("📦 Found location state data structure");
      
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
          // Submission info
          submitted_at: data.submitted_at,
          approved_at: data.actioned_at,
          approved_by: data.approved_by,
        },
        parents_carers: [], // Will need to fetch this separately
        emergency_contacts: [], // Will need to fetch this separately
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

      console.log("🎯 Transformed location state data:", transformedData);
      return transformedData;
    }

    // If data comes from the new student details API
    if (data.student_info && data.parent_carers) {
      console.log("📦 Found new student API data structure");
      
      // Transform parent/carer data
      const transformedParents = data.parent_carers.map((parent, index) => {
        const transformedParent = {
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
        return transformedParent;
      });

      // Transform emergency contacts
      const transformedEmergencyContacts = data.emergency_contacts.map((contact, index) => {
        const transformedContact = {
          preference: contact.preference === "1" ? "first" : "secondary",
          given_name: contact.given_name,
          family_name: contact.family_name,
          relationship_to_student: contact.relationship,
          mobile_phone: contact.mobile_phone,
          home_phone: contact.home_phone,
          work_phone: contact.work_phone
        };
        return transformedContact;
      });

      // Transform class assignments
      const transformedClasses = data.class_assignments.map((classInfo, index) => {
        const transformedClass = {
          class_id: classInfo.class_id,
          class_name: classInfo.class_name,
          class_is_active: classInfo.class_is_active,
          enr_year: classInfo.enr_year,
          is_active: classInfo.is_active,
          assignment_date: classInfo.assignment_date,
          teachers: classInfo.teachers || [],
          teacher_count: classInfo.teacher_count || 0
        };
        return transformedClass;
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
          // Submission info
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

      console.log("🎯 Final transformed data:", transformedData);
      return transformedData;
    }

    // If data comes from parent API (my-enrollments)
    if (data.student && data.parent_carer_1) {
      console.log("📦 Found parent API data structure");
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

    // If data is already in the expected format
    console.log("📦 Data already in expected format or unknown structure:", data);
    
    // FIX: Ensure the returned data has all required properties
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

  // Fetch detailed student data when we only have basic info from location state
  const fetchDetailedStudentData = async () => {
    try {
      console.log("📡 Fetching detailed student data for:", id);
      setLoading(true);
      
      let endpoint;
      if (userRole === 'parent') {
        endpoint = `/my-enrollments/${id}`;
      } else {
        endpoint = `/students/${id}`;
      }
      
      console.log("🎯 Using endpoint:", endpoint);
      const response = await api.get(endpoint);
      console.log("📥 Detailed API response:", response);
      
      if (response.data.success) {
        const transformedData = transformStudentData(response.data.data);
        console.log("🔄 Transformed detailed data:", transformedData);
        setCurrentStudent(transformedData);
      } else {
        throw new Error(response.data.message || "Failed to fetch detailed student data");
      }
    } catch (error) {
      console.error("💥 Error fetching detailed student data:", error);
      // Don't set error here - we'll still show the basic info
      console.log("⚠️ Will display basic student info only");
    } finally {
      setLoading(false);
    }
  };

  // If no student data was passed, fetch it using the ID
  useEffect(() => {
    console.log("🔄 useEffect triggered:", {
      hasStudentData: !!studentData,
      id,
      loading,
      userRole,
    });

    if (studentData) {
      console.log("✅ Using student data from location state:", studentData);

      // First, transform the basic data we have from location state
      const transformedData = transformStudentData(studentData);
      console.log("📦 Transformed basic student data from location:", transformedData);

      setCurrentStudent(transformedData);
      setLoading(false);

      // FIX: Added safe length checks
      const hasParents = transformedData.parents_carers && transformedData.parents_carers.length > 0;
      const hasEmergencyContacts = transformedData.emergency_contacts && transformedData.emergency_contacts.length > 0;
      
      // Then fetch detailed data if we're missing parent/emergency contact info
      if (!hasParents || !hasEmergencyContacts) {
        console.log("🔍 Missing detailed info, fetching complete data...");
        fetchDetailedStudentData();
      }
    } else if (!studentData && id && userRole !== null) {
      console.log("📡 No location data, fetching student data from API...");
      fetchDetailedStudentData();
    } else if (!id) {
      console.log("❌ No student ID available");
      setError("No student ID provided");
      setLoading(false);
    }
  }, [id, studentData, userRole]);

  // Safe data access functions with debug logs
  const getStudentData = () => {
    const student = currentStudent?.student || {};
    console.log("👤 getStudentData result:", student);
    return student;
  };

  const getParentsData = () => {
    const parents = currentStudent?.parents_carers || [];
    console.log("👪 getParentsData result:", parents);
    return parents;
  };

  const getEmergencyContacts = () => {
    const contacts = currentStudent?.emergency_contacts || [];
    console.log("🚨 getEmergencyContacts result:", contacts);
    return contacts;
  };

  const getClasses = () => {
    const classes = currentStudent?.classes || [];
    console.log("🏫 getClasses result:", classes);
    return classes;
  };

  const getSummary = () => {
    const summary = currentStudent?.summary || {};
    console.log("📊 getSummary result:", summary);
    return summary;
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
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Handle status change via toggle - Only for admin users
  const handleStatusChange = async (newStatus) => {
    if (!userRole || userRole === 'parent') {
      setUpdateMessage({
        type: 'warning',
        text: 'You do not have permission to change student status.'
      });
      return;
    }

    try {
      console.log("🔄 Changing student status to:", newStatus);
      setUpdatingStatus(true);
      setUpdateMessage({ type: "", text: "" });

      const response = await api.put(`/students/${id}/status`, {
        status: newStatus,
      });

      console.log("📥 Status update response:", response.data);

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
      console.error("💥 Error updating student status:", error);
      setUpdateMessage({
        type: "danger",
        text: error.response?.data?.message || "Failed to update student status. Please try again.",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle quick status toggle - Only for admin users
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

  // Debug current state before render
  console.log("🎯 Current Component State before render:", {
    loading,
    error,
    currentStudent,
    hasStudentData: !!currentStudent,
    userRole,
  });

  if (loading) {
    return <Loader />;
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

  console.log("🎨 Rendering student details with data:", {
    student,
    parentsCount: parents_carers.length,
    emergencyContactsCount: emergency_contacts.length,
    classesCount: classes.length,
    summary,
    userRole,
  });

  return (
    <Container fluid className="px-4 py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Student Details</h4>
          <p className="text-muted mb-0">
            {student.studid ? `Student ID: ${student.studid}` : 
             student.enrollment_id ? `Enrollment ID: ${student.enrollment_id}` : "Student Details"}
            {userRole === 'parent' && (
              <Badge bg="info" className="ms-2">Parent View</Badge>
            )}
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
            <i className={`bi bi-${updateMessage.type === "success" ? "check-circle" : "exclamation-triangle"} me-2`}></i>
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
                  <Table borderless>
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
                  </Table>
                </Col>
                <Col md={6}>
                  <Table borderless>
                    <tbody>
                      <tr>
                        <td className="fw-bold" style={{ width: "140px" }}>Enrollment ID:</td>
                        <td>{student.enrollment_id || "N/A"}</td>
                      </tr>
                      {student.status && (
                        <tr>
                          <td className="fw-bold">Status:</td>
                          <td><Badge bg={getStatusVariant(student.status)}>{student.status}</Badge></td>
                        </tr>
                      )}
                      <tr>
                        <td className="fw-bold">Mainstream School:</td>
                        <td>{student.mainstream_school_name || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">WSTSC Class:</td>
                        <td>{student.enrol_class_in_WSTSC || "Not assigned"}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
              
              {/* Submission Information */}
              {student.submitted_at && (
                <div className="mt-4 pt-3 border-top">
                  <h6 className="mb-3">Submission Information</h6>
                  <Row>
                    <Col md={6}>
                      <Table borderless size="sm">
                        <tbody>
                          <tr>
                            <td className="fw-bold">Submitted At:</td>
                            <td>{formatDate(student.submitted_at)}</td>
                          </tr>
                        </tbody>
                      </Table>
                    </Col>
                    <Col md={6}>
                      <Table borderless size="sm">
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
                      </Table>
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
                            <Table borderless>
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
                            </Table>
                          </Col>
                          <Col md={6}>
                            <h6 className="mb-3">&nbsp;</h6>
                            <Table borderless>
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
                            </Table>
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
                              <Badge bg={contact.preference === "first" ? "success" : "info"} className="ms-2">
                                {contact.preference}
                              </Badge>
                            </h6>
                            <Table borderless>
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
                            </Table>
                          </Col>
                          <Col md={6}>
                            <h6 className="mb-3">&nbsp;</h6>
                            <Table borderless>
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
                            </Table>
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
                          <Card className="h-100">
                            <Card.Header className="bg-light">
                              <h6 className="mb-0">{classInfo.class_name || "Unnamed Class"}</h6>
                            </Card.Header>
                            <Card.Body>
                              <Table borderless size="sm">
                                <tbody>
                                  <tr>
                                    <td className="fw-bold">Class ID:</td>
                                    <td>{classInfo.class_id || "N/A"}</td>
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
                            </Card.Body>
                          </Card>
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
          {userRole && userRole !== 'parent' && (
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
          )}

          {/* Student Summary */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Student Summary</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "80px", height: "80px" }}>
                  <i className="bi bi-person-fill text-primary" style={{ fontSize: "2rem" }}></i>
                </div>
                <h5>{student.name || "Student Name"}</h5>
                <p className="text-muted">
                  {student.studid ? `Student ID: ${student.studid}` : student.enrollment_id ? `Enrollment ID: ${student.enrollment_id}` : "Student"}
                </p>

                {student.status && (
                  <div className="mb-3">
                    <Badge bg={getStatusVariant(student.status)} className="fs-6">{student.status}</Badge>
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
        </Col>
      </Row>
    </Container>
  );
};

export default StudentDetails;