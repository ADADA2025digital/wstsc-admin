import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Badge,
  Tab,
  Tabs,
  Table,
  Form,
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import ButtonGlobal from "../../Components/Button";
import { formatDateToMMDDYYYY } from "../../config/utils";
import api from "../../config/axiosConfig";

const StudentsStatus = () => {
  const navigate = useNavigate();
  const [activeStudents, setActiveStudents] = useState([]);
  const [inactiveStudents, setInactiveStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Create modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newStudent, setNewStudent] = useState({
    first_given_name: "",
    family_name: "",
    preferred_first_name: "",
    gender: "",
    date_of_birth: "",
    status: "Active",
  });

  // Seed data for demonstration
  const seedStudents = [
    {
      id: 1,
      student_id: "STU0001",
      first_given_name: "Emma",
      family_name: "Johnson",
      preferred_first_name: "Emma",
      gender: "Female",
      date_of_birth: "2015-03-15",
      status: "Active",
      enrollment_year: "2023",
      classroom: "Grade 2A",
      created_at: "2023-01-15",
      updated_at: "2024-01-10",
      parent_carers: [
        {
          first_name: "Sarah",
          last_name: "Johnson",
          email: "sarah.johnson@email.com",
        }
      ]
    },
    {
      id: 2,
      student_id: "STU0002",
      first_given_name: "Liam",
      family_name: "Smith",
      preferred_first_name: "Liam",
      gender: "Male",
      date_of_birth: "2016-07-22",
      status: "Pending",
      enrollment_year: "2024",
      classroom: "Grade 1B",
      created_at: "2024-01-08",
      updated_at: "2024-01-08",
      parent_carers: [
        {
          first_name: "Michael",
          last_name: "Smith",
          email: "michael.smith@email.com",
        }
      ]
    },
    {
      id: 3,
      student_id: "STU0003",
      first_given_name: "Olivia",
      family_name: "Brown",
      preferred_first_name: "Liv",
      gender: "Female",
      date_of_birth: "2015-11-08",
      status: "Active",
      enrollment_year: "2023",
      classroom: "Grade 2A",
      created_at: "2023-01-20",
      updated_at: "2024-01-05",
      parent_carers: [
        {
          first_name: "Jennifer",
          last_name: "Brown",
          email: "jennifer.brown@email.com",
        }
      ]
    },
    {
      id: 4,
      student_id: "STU0004",
      first_given_name: "Noah",
      family_name: "Wilson",
      preferred_first_name: "Noah",
      gender: "Male",
      date_of_birth: "2016-02-14",
      status: "Inactive",
      enrollment_year: "2024",
      classroom: "Grade 1B",
      created_at: "2024-01-10",
      updated_at: "2024-01-12",
      parent_carers: [
        {
          first_name: "David",
          last_name: "Wilson",
          email: "david.wilson@email.com",
        }
      ]
    },
    {
      id: 5,
      student_id: "STU0005",
      first_given_name: "Ava",
      family_name: "Taylor",
      preferred_first_name: "Ava",
      gender: "Female",
      date_of_birth: "2015-09-30",
      status: "Active",
      enrollment_year: "2023",
      classroom: "Grade 2B",
      created_at: "2023-02-01",
      updated_at: "2024-01-08",
      parent_carers: [
        {
          first_name: "Amanda",
          last_name: "Taylor",
          email: "amanda.taylor@email.com",
        }
      ]
    },
    {
      id: 6,
      student_id: "STU0006",
      first_given_name: "Lucas",
      family_name: "Anderson",
      preferred_first_name: "Luke",
      gender: "Male",
      date_of_birth: "2016-04-18",
      status: "Pending",
      enrollment_year: "2024",
      classroom: "Grade 1A",
      created_at: "2024-01-15",
      updated_at: "2024-01-15",
      parent_carers: [
        {
          first_name: "Robert",
          last_name: "Anderson",
          email: "robert.anderson@email.com",
        }
      ]
    }
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call with seed data
      await new Promise(resolve => setTimeout(resolve, 1000));

      const activeStudents = seedStudents.filter(student => student.status === "Active");
      const inactiveStudents = seedStudents.filter(student => student.status === "Inactive");
      const pendingStudents = seedStudents.filter(student => student.status === "Pending");

      setActiveStudents(activeStudents);
      setInactiveStudents(inactiveStudents);
      setPendingStudents(pendingStudents);

    } catch (err) {
      console.error("Error fetching students:", err);
      setError(
        `Failed to load students: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const createStudent = async () => {
    if (!newStudent.first_given_name.trim() || !newStudent.family_name.trim()) {
      setCreateError("First name and family name are required");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Generate new student ID
      const newId = seedStudents.length + 1;
      const newStudentId = `STU${newId.toString().padStart(4, "0")}`;

      const studentToAdd = {
        id: newId,
        student_id: newStudentId,
        first_given_name: newStudent.first_given_name.trim(),
        family_name: newStudent.family_name.trim(),
        preferred_first_name: newStudent.preferred_first_name.trim() || newStudent.first_given_name.trim(),
        gender: newStudent.gender,
        date_of_birth: newStudent.date_of_birth,
        status: newStudent.status,
        enrollment_year: new Date().getFullYear().toString(),
        classroom: "Not assigned",
        created_at: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString().split('T')[0],
        parent_carers: []
      };

      // Add to appropriate list based on status
      if (newStudent.status === "Active") {
        setActiveStudents(prev => [...prev, studentToAdd]);
      } else if (newStudent.status === "Inactive") {
        setInactiveStudents(prev => [...prev, studentToAdd]);
      } else {
        setPendingStudents(prev => [...prev, studentToAdd]);
      }

      closeCreateModal();

      // Show success message
      setError(null);
      setTimeout(() => {
        console.log("Student created successfully");
      }, 100);

    } catch (err) {
      console.error("Error creating student:", err);
      setCreateError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create student"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleViewStudent = (student) => {
    navigate(`/students/${student.id}`, {
      state: { studentData: student },
    });
  };

  const handleStatusChange = async (student, newStatus) => {
    try {
      setUpdatingStatus(student.id);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Update student status locally
      const updatedStudent = {
        ...student,
        status: newStatus,
        updated_at: new Date().toISOString().split('T')[0]
      };

      // Remove from current lists
      setActiveStudents(prev => prev.filter(s => s.id !== student.id));
      setInactiveStudents(prev => prev.filter(s => s.id !== student.id));
      setPendingStudents(prev => prev.filter(s => s.id !== student.id));

      // Add to appropriate list
      if (newStatus === "Active") {
        setActiveStudents(prev => [...prev, updatedStudent]);
      } else if (newStatus === "Inactive") {
        setInactiveStudents(prev => [...prev, updatedStudent]);
      } else {
        setPendingStudents(prev => [...prev, updatedStudent]);
      }

      console.log("Student status updated successfully:", updatedStudent);
    } catch (err) {
      setError(
        "Failed to update student status: " +
          (err.response?.data?.message || err.message)
      );
      console.error("Error updating student status:", err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return <Badge bg="success">Active</Badge>;
      case "Inactive":
        return <Badge bg="secondary">Inactive</Badge>;
      case "Pending":
        return <Badge bg="warning">Pending</Badge>;
      default:
        return <Badge bg="info">{status}</Badge>;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <div className="text-center">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3 text-muted">Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  const StudentTable = ({ students, statusType }) => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-transparent py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i
              className={`bi bi-${
                statusType === "active" ? "check-circle" : 
                statusType === "inactive" ? "pause-circle" : "clock"
              } me-2`}
            ></i>
            {statusType === "active" ? "Active" : 
             statusType === "inactive" ? "Inactive" : "Pending"} Students
            <Badge bg="secondary" className="ms-2 fs-7">
              {students.length}
            </Badge>
          </h5>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {students.length > 0 ? (
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">Student Information</th>
                <th>Status</th>
                <th>Classroom</th>
                <th>Enrollment Year</th>
                <th>Last Updated</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="ps-4">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-person-fill text-primary me-3 fs-5"></i>
                      <div>
                        <h6 className="mb-0 fw-semibold">
                          {student.first_given_name} {student.family_name}
                        </h6>
                        <small className="text-muted d-block">
                          ID: {student.student_id}
                        </small>
                        <small className="text-muted">
                          {student.preferred_first_name && `Preferred: ${student.preferred_first_name}`}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={student.status}
                      onChange={(e) => handleStatusChange(student, e.target.value)}
                      disabled={updatingStatus === student.id}
                      style={{ width: "120px" }}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Pending">Pending</option>
                    </Form.Select>
                  </td>
                  <td>
                    <span className="fw-medium">{student.classroom}</span>
                  </td>
                  <td>
                    <Badge bg="outline-primary" className="text-dark border">
                      {student.enrollment_year}
                    </Badge>
                  </td>
                  <td>
                    <small className="text-muted">
                      {formatDateToMMDDYYYY(student.updated_at)}
                    </small>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewStudent(student)}
                        title="View Details"
                      >
                        <i className="bi bi-eye"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <div className="text-center py-5">
            <i className="bi bi-person display-1 text-muted"></i>
            <h5 className="mt-3 text-muted">
              No {statusType === "active" ? "Active" : 
                  statusType === "inactive" ? "Inactive" : "Pending"} Students
            </h5>
            <p className="text-muted mb-4">
              {statusType === "active" 
                ? "There are no active students at the moment." 
                : statusType === "inactive"
                ? "There are no inactive students at the moment."
                : "There are no pending student applications."}
            </p>
            {statusType === "pending" && (
              <Button variant="primary" onClick={openCreateModal}>
                <i className="bi bi-plus-circle me-2"></i>
                Add New Student
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Student Management</h4>
          <p className="text-muted mb-0">
            Manage all students and their enrollment status
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ButtonGlobal
            onClick={fetchStudents}
            className="btn btn-outline-secondary"
          >
            <i className="bi bi-arrow-clockwise me-2" />
            Refresh
          </ButtonGlobal>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <div className="d-flex align-items-start">
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div className="flex-grow-1">
              <h6 className="alert-heading mb-1">Error Loading Students</h6>
              <p className="mb-2">{error}</p>
              <small>Please check your connection and try again.</small>
            </div>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => setError(null)}
            >
              <i className="bi bi-x"></i>
            </Button>
          </div>
        </Alert>
      )}

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 bg-success bg-opacity-10">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-success mb-1">
                    Active Students
                  </h6>
                  <h3 className="fw-bold text-success mb-0">
                    {activeStudents.length}
                  </h3>
                  <small className="text-muted">
                    Currently enrolled and active
                  </small>
                </div>
                <div className="flex-shrink-0">
                  <i className="bi bi-check-circle-fill text-success fs-1"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 bg-warning bg-opacity-10">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-warning mb-1">
                    Pending Students
                  </h6>
                  <h3 className="fw-bold text-warning mb-0">
                    {pendingStudents.length}
                  </h3>
                  <small className="text-muted">
                    Awaiting approval
                  </small>
                </div>
                <div className="flex-shrink-0">
                  <i className="bi bi-clock-fill text-warning fs-1"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 bg-secondary bg-opacity-10">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-secondary mb-1">
                    Inactive Students
                  </h6>
                  <h3 className="fw-bold text-secondary mb-0">
                    {inactiveStudents.length}
                  </h3>
                  <small className="text-muted">
                    Not currently enrolled
                  </small>
                </div>
                <div className="flex-shrink-0">
                  <i className="bi bi-pause-circle-fill text-secondary fs-1"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Student Tabs */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="px-3 pt-3 border-bottom"
            fill
          >
            <Tab
              eventKey="active"
              title={
                <span>
                  <i className="bi bi-check-circle me-2"></i>
                  Active Students
                  <Badge bg="success" className="ms-2 fs-7">
                    {activeStudents.length}
                  </Badge>
                </span>
              }
            >
              <div className="p-3">
                <StudentTable students={activeStudents} statusType="active" />
              </div>
            </Tab>

            <Tab
              eventKey="pending"
              title={
                <span>
                  <i className="bi bi-clock me-2"></i>
                  Pending Students
                  <Badge bg="warning" className="ms-2 fs-7">
                    {pendingStudents.length}
                  </Badge>
                </span>
              }
            >
              <div className="p-3">
                <StudentTable students={pendingStudents} statusType="pending" />
              </div>
            </Tab>

            <Tab
              eventKey="inactive"
              title={
                <span>
                  <i className="bi bi-pause-circle me-2"></i>
                  Inactive Students
                  <Badge bg="secondary" className="ms-2 fs-7">
                    {inactiveStudents.length}
                  </Badge>
                </span>
              }
            >
              <div className="p-3">
                <StudentTable students={inactiveStudents} statusType="inactive" />
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
};

export default StudentsStatus;