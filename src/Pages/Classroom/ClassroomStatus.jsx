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
import ButtonGlobal from "../../Components/Button";
import Loader from "../../Pages/Loader";
import { formatDateToMMDDYYYY } from "../../config/utils";
import api from "../../config/axiosConfig";

const ClassroomsStatus = () => {
  const navigate = useNavigate();
  const [activeClassrooms, setActiveClassrooms] = useState([]);
  const [inactiveClassrooms, setInactiveClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [updatingStatus, setUpdatingStatus] = useState(null); // Track which classroom is being updated

  // Create modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [newClassroom, setNewClassroom] = useState({
    class_name: "",
    is_active: true,
  });

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      setError(null);

      const activeResponse = await api.get("/classrooms/active");
      const activeData = activeResponse.data;

      const inactiveResponse = await api.get("/classrooms/inactive/list");
      const inactiveData = inactiveResponse.data;

      setActiveClassrooms(activeData.data.classrooms || []);
      setInactiveClassrooms(inactiveData.data.classrooms || []);
    } catch (err) {
      console.error("Error fetching classrooms:", err);
      setError(
        `Failed to load classrooms: ${
          err.response?.data?.message || err.message
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Create modal functions
  const openCreateModal = () => {
    setShowCreateModal(true);
    setCreateError("");
    setNewClassroom({
      class_name: "",
      is_active: true,
    });
  };

  const closeCreateModal = () => {
    if (!creating) {
      setShowCreateModal(false);
      setCreateError("");
    }
  };

  const handleCreateChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewClassroom((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const createClassroom = async () => {
    if (!newClassroom.class_name.trim()) {
      setCreateError("Classroom name is required");
      return;
    }

    try {
      setCreating(true);
      setCreateError("");

      const response = await api.post("/classrooms", {
        class_name: newClassroom.class_name.trim(),
        is_active: newClassroom.is_active,
      });

      if (response.data.success) {
        closeCreateModal();
        fetchClassrooms(); // Refresh the list

        // Show success message
        setError(null);
        setTimeout(() => {
          // You could show a success toast here instead
          console.log("Classroom created successfully");
        }, 100);
      } else {
        throw new Error(response.data.message || "Failed to create classroom");
      }
    } catch (err) {
      console.error("Error creating classroom:", err);
      setCreateError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create classroom"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleViewClassroom = (classroom) => {
    navigate(`/classrooms/${classroom.class_id}`, {
      state: { classroomData: classroom },
    });
  };

  const handleToggleStatus = async (classroom) => {
    try {
      setUpdatingStatus(classroom.class_id);

      // Use PATCH request to toggle status - using c_id in the URL
      const response = await api.put(
        `/classrooms/${classroom.c_id}/toggle-status`
      );

      if (response.data.success) {
        // Refresh the classrooms list to get updated data
        fetchClassrooms();

        // Optional: Show success message
        console.log(
          "Classroom status updated successfully:",
          response.data.data.classroom
        );
      } else {
        throw new Error(
          response.data.message || "Failed to toggle classroom status"
        );
      }
    } catch (err) {
      setError(
        "Failed to toggle classroom status: " +
          (err.response?.data?.message || err.message)
      );
      console.error("Error toggling classroom status:", err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Loading state - UPDATED TO USE CUSTOM LOADER
  if (loading) {
    return <Loader />;
  }

  const ClassroomTable = ({ classrooms, isActive }) => (
    <Card className="border-0 shadow-sm">
      <Card.Header className="bg-transparent py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i
              className={`bi bi-${
                isActive ? "check-circle" : "pause-circle"
              } me-2`}
            ></i>
            {isActive ? "Active" : "Inactive"} Classrooms
            <Badge bg="secondary" className="ms-2 fs-7">
              {classrooms.length}
            </Badge>
          </h5>
          <ButtonGlobal
            onClick={openCreateModal}
            className="btn btn-primary"
          >
            <i className="bi bi-plus-circle me-2" />
            Create Classroom
          </ButtonGlobal>
        </div>
      </Card.Header>
      <Card.Body className="p-0">
        {classrooms.length > 0 ? (
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">Class Name</th>
                <th>Status</th>
                <th>Created Date</th>
                <th>Last Updated</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classrooms.map((classroom) => (
                <tr key={classroom.class_id}>
                  <td className="ps-4">
                    <div className="d-flex align-items-center">
                      <i className="bi bi-house-door-fill text-primary me-3"></i>
                      <div>
                        <h6 className="mb-0 fw-semibold">
                          {classroom.class_name}
                        </h6>
                        <small className="text-muted">
                          ID: {classroom.class_id} | C_ID: {classroom.c_id}
                        </small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Form.Check
                      type="switch"
                      id={`status-toggle-${classroom.class_id}`}
                      label={
                        <span className="fw-medium">
                          {classroom.is_active ? "Active" : "Inactive"}
                        </span>
                      }
                      checked={classroom.is_active}
                      onChange={() => handleToggleStatus(classroom)}
                      disabled={updatingStatus === classroom.class_id}
                      className="mb-0"
                    />
                    {updatingStatus === classroom.class_id && (
                      <Spinner animation="border" size="sm" className="ms-2" />
                    )}
                  </td>
                  <td>
                    <small className="text-muted">
                      {formatDateToMMDDYYYY(classroom.created_at)}
                    </small>
                  </td>
                  <td>
                    <small className="text-muted">
                      {formatDateToMMDDYYYY(classroom.updated_at)}
                    </small>
                  </td>
                  <td className="text-center">
                    <div className="d-flex justify-content-center gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleViewClassroom(classroom)}
                        title="View Details"
                        disabled={updatingStatus === classroom.class_id}
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
            <i className="bi bi-house-door display-1 text-muted"></i>
            <h5 className="mt-3 text-muted">
              No {isActive ? "Active" : "Inactive"} Classrooms
            </h5>
            <p className="text-muted mb-4">
              {isActive
                ? "There are no active classrooms at the moment."
                : "There are no inactive classrooms at the moment."}
            </p>
            <ButtonGlobal
              onClick={openCreateModal}
              className="btn btn-primary"
            >
              <i className="bi bi-plus-circle me-2" />
              Create Classroom
            </ButtonGlobal>
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
          <h4 className="fw-bold mb-1">Classroom Management</h4>
          <p className="text-muted mb-0">
            Manage all classrooms and their activation status
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ButtonGlobal
            onClick={fetchClassrooms}
            className="btn btn-outline-secondary"
          >
            <i className="bi bi-arrow-clockwise me-2" />
            Refresh
          </ButtonGlobal>
          <ButtonGlobal
            onClick={openCreateModal}
            className="btn btn-primary"
          >
            <i className="bi bi-plus-circle me-2" />
            Create Classroom
          </ButtonGlobal>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <div className="d-flex align-items-start">
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div className="flex-grow-1">
              <h6 className="alert-heading mb-1">Error Loading Classrooms</h6>
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
        <Col md={6}>
          <Card className="border-0 bg-success bg-opacity-10">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-success mb-1">
                    Active Classrooms
                  </h6>
                  <h3 className="fw-bold text-success mb-0">
                    {activeClassrooms.length}
                  </h3>
                  <small className="text-muted">
                    Currently active and available
                  </small>
                </div>
                <div className="flex-shrink-0">
                  <i className="bi bi-check-circle-fill text-success fs-1"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="border-0 bg-secondary bg-opacity-10">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <h6 className="card-title text-secondary mb-1">
                    Inactive Classrooms
                  </h6>
                  <h3 className="fw-bold text-secondary mb-0">
                    {inactiveClassrooms.length}
                  </h3>
                  <small className="text-muted">Currently deactivated</small>
                </div>
                <div className="flex-shrink-0">
                  <i className="bi bi-pause-circle-fill text-secondary fs-1"></i>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Classroom Tabs */}
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
                  Active Classrooms
                  <Badge bg="success" className="ms-2 fs-7">
                    {activeClassrooms.length}
                  </Badge>
                </span>
              }
            >
              <div className="p-3">
                <ClassroomTable classrooms={activeClassrooms} isActive={true} />
              </div>
            </Tab>

            <Tab
              eventKey="inactive"
              title={
                <span>
                  <i className="bi bi-pause-circle me-2"></i>
                  Inactive Classrooms
                  <Badge bg="secondary" className="ms-2 fs-7">
                    {inactiveClassrooms.length}
                  </Badge>
                </span>
              }
            >
              <div className="p-3">
                <ClassroomTable
                  classrooms={inactiveClassrooms}
                  isActive={false}
                />
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle text-primary me-2"></i>
                  Create New Classroom
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeCreateModal}
                  disabled={creating}
                ></button>
              </div>
              <div className="modal-body">
                {createError && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {createError}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="class_name" className="form-label">
                    Classroom Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="class_name"
                    name="class_name"
                    value={newClassroom.class_name}
                    onChange={handleCreateChange}
                    placeholder="Enter classroom name"
                    disabled={creating}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        createClassroom();
                      }
                    }}
                  />
                </div>

                <div className="mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={newClassroom.is_active}
                      onChange={handleCreateChange}
                      disabled={creating}
                    />
                    <label className="form-check-label" htmlFor="is_active">
                      Active Classroom
                    </label>
                  </div>
                  <div className="form-text">
                    Active classrooms are available for student enrollment and
                    scheduling.
                  </div>
                </div>
              </div>
              <div className="modal-footer justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={closeCreateModal}
                  disabled={creating}
                >
                  <i className="bi bi-x-circle me-2"></i> Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={createClassroom}
                  disabled={creating || !newClassroom.class_name.trim()}
                >
                  {creating ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      >
                        <span className="visually-hidden">Creating...</span>
                      </span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2 me-2"></i> Create Classroom
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomsStatus;