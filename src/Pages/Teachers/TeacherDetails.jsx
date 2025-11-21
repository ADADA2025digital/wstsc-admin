import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Spinner,
  Alert,
  Badge,
  Tab,
  Tabs,
  Form,
  Table,
} from "react-bootstrap";
import ButtonGlobal from "../../Components/Button";
import InfoCard from "../../Components/InfoCard";
import { formatDateToMMDDYYYY } from "../../config/utils";
import api from "../../config/axiosConfig";

const TeacherDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [classroomAssignments, setClassroomAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);

  useEffect(() => {
    if (location.state?.teacherData) {
      // If data is passed via state, use it and fetch classroom assignments
      const transformedData = transformTeacherData(location.state.teacherData);
      setTeacherData(transformedData);
      setLoading(false);
      // Fetch classroom assignments to get assigned class
      fetchClassroomAssignments(id);
    } else {
      // Fetch both teacher details and classroom assignments
      fetchTeacherDetails();
    }
  }, [id]);

  // Fetch teacher details using user_id
  const fetchTeacherDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!id) {
        setError("Teacher User ID not found in URL");
        return;
      }

      console.log("🔄 Fetching teacher details for User ID:", id);

      const response = await api.get(`/admin/teachers/${id}`);

      if (response.data.success) {
        const apiData = response.data.data.teacher;
        console.log("✅ Raw API data:", apiData);

        // Fetch classroom assignments first to get grade information
        await fetchClassroomAssignments(id);

        // Transform data with classroom information
        const transformedData = transformTeacherData(apiData);
        setTeacherData(transformedData);

        console.log("✅ Transformed teacher data:", transformedData);
      } else {
        setError(response.data.message || "Failed to fetch teacher details");
      }
    } catch (err) {
      console.error("❌ Error fetching teacher details:", err);
      setError(
        "Failed to fetch teacher details: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Extract grade from classroom assignments
  const getGradeFromClassrooms = (assignments) => {
    if (!assignments || assignments.length === 0) {
      return "Not assigned";
    }

    // Get current assignments first
    const currentAssignments = assignments.filter(
      (assignment) =>
        assignment.is_current === true || assignment.status === "active"
    );

    // If there are current assignments, use the first one
    if (currentAssignments.length > 0) {
      const classroom = currentAssignments[0].classroom;
      return classroom?.class_name || "Not assigned";
    }

    // Otherwise use the first assignment
    const firstAssignment = assignments[0];
    const classroom = firstAssignment.classroom;
    return classroom?.class_name || "Not assigned";
  };

  // Fetch classroom assignments using user_id
  const fetchClassroomAssignments = async (userId) => {
    try {
      setLoadingAssignments(true);
      console.log(
        "🔄 Fetching classroom assignments for teacher User ID:",
        userId
      );

      const response = await api.get(
        `/classroom-teachers/teacher/${userId}/classrooms`
      );

      if (response.data.success) {
        const assignments = response.data.data.classrooms || [];
        console.log("✅ Classroom assignments:", assignments);
        setClassroomAssignments(assignments);

        // Update teacher data with classroom information
        if (assignments.length > 0) {
          const assignedClass = getGradeFromClassrooms(assignments);
          console.log("✅ Updating assigned class to:", assignedClass);

          setTeacherData((prevData) => {
            if (!prevData) return prevData;
            return {
              ...prevData,
              grade: assignedClass,
            };
          });
        }

        return assignments;
      } else {
        console.log("❌ No classroom assignments found or API returned error");
        setClassroomAssignments([]);
        return [];
      }
    } catch (err) {
      console.error("❌ Error fetching classroom assignments:", err);
      setClassroomAssignments([]);
      return [];
    } finally {
      setLoadingAssignments(false);
    }
  };

  // Transform API data to consistent format
  const transformTeacherData = (apiData) => {
    console.log("🔍 Transforming teacher data:", apiData);

    if (!apiData) {
      console.error("No API data provided to transform");
      return null;
    }

    // Extract data from the nested structure
    const personData = apiData.person || {};
    const addressData = apiData.address || {};
    const roleData = apiData.role || {};

    // Build full name from components
    const firstName = apiData.first_name || personData.first_name || "";
    const lastName = apiData.last_name || personData.last_name || "";
    const middleName = apiData.middle_name || personData.middle_name || "";
    const fullName =
      [firstName, middleName, lastName]
        .filter((name) => name && name.trim() !== "")
        .join(" ")
        .trim() ||
      apiData.name ||
      "Unknown Name";

    // Debug: Check the actual status fields in API data
    console.log("🔍 Status check - API data:", {
      apiDataIsActive: apiData.is_active,
      apiDataStatus: apiData.status,
      personDataIsActive: personData.is_active,
      originalData: apiData.originalData
    });

    // Determine status - check multiple possible fields
    let isActive = false;
    let statusText = "Inactive";

    // Check various possible fields for status with proper fallbacks
    if (apiData.is_active !== undefined) {
      isActive = Boolean(apiData.is_active);
    } else if (apiData.status !== undefined) {
      isActive = apiData.status === "active" || apiData.status === "Active";
    } else if (personData.is_active !== undefined) {
      isActive = Boolean(personData.is_active);
    } else if (apiData.originalData?.is_active !== undefined) {
      isActive = Boolean(apiData.originalData.is_active);
    } else if (apiData.status === "Active") {
      // Direct check for string status
      isActive = true;
    }

    statusText = isActive ? "Active" : "Inactive";

    console.log("🔍 Final status determination:", {
      isActive,
      statusText
    });

    // Extract person_id from various possible locations
    const personId = apiData.person_id || personData.person_id || apiData.originalData?.person_id;

    console.log("🔍 Extracted person_id:", personId);

    // Initially set grade as "Not assigned" - will be updated by fetchClassroomAssignments
    const grade = "Not assigned";

    return {
      // IDs - using user_id as primary identifier
      id: apiData.user_id,
      user_id: apiData.user_id,
      person_id: personId, // Now properly extracted

      // Personal Information
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName,
      full_name: fullName,
      gender: personData.gender || addressData.gender || "Not specified",
      date_of_birth:
        personData.date_of_birth || addressData.date_of_birth || null,
      nationality: personData.nationality || "Not specified",

      // Contact Information
      email: apiData.email || personData.email || "",
      phone: apiData.phone || personData.phone || "Not provided",
      alternate_phone: personData.alternate_phone || "Not provided",

      // Professional Information
      marital_status: personData.marital_status || "Not specified",
      occupation: personData.occupation || "Teacher",
      grade: grade, // Initially "Not assigned", will be updated by classroom assignments

      // Status - CORRECTED
      status: statusText,
      is_active: isActive,

      // Additional data
      profile_picture: apiData.profile_picture || personData.photo_url,
      role: roleData,

      // Address information
      address: addressData.full_name
        ? `${addressData.full_name}`
        : "Address not specified",

      // Store original data for reference
      original_data: apiData,
    };
  };

  // Function to toggle teacher status - tries multiple ID options
  const handleStatusToggle = async (newStatus) => {
    if (!teacherData) {
      console.error("No teacher data available");
      return;
    }

    // Debug: Check what IDs we have available
    console.log("🔄 Status toggle - Available IDs:", {
      user_id: teacherData.user_id,
      person_id: teacherData.person_id,
      id: teacherData.id
    });

    // Try different ID options in order of preference
    let targetId = null;
    let idType = "";

    if (teacherData.person_id) {
      targetId = teacherData.person_id;
      idType = "person_id";
    } else if (teacherData.user_id) {
      targetId = teacherData.user_id;
      idType = "user_id";
    } else if (teacherData.id) {
      targetId = teacherData.id;
      idType = "id";
    }

    if (!targetId) {
      console.error("No valid ID found in teacher data");
      alert("Cannot update status: No valid ID available");
      return;
    }

    try {
      setUpdatingStatus(true);

      console.log(`🔄 Toggling status using ${idType}:`, targetId);

      // Try different API endpoints based on available ID
      let response;
      
      if (idType === "person_id") {
        // Use person_id endpoint
        response = await api.put(
          `/admin/persons/${targetId}/toggle-status`
        );
      } else {
        // Use user_id endpoint (fallback)
        response = await api.put(
          `/admin/teachers/${targetId}/toggle-status`
        );
      }

      if (response.data.success) {
        const updatedData = response.data.data.teacher || response.data.data.person || response.data.data;
        
        console.log("✅ Status update response:", updatedData);

        // Update teacher data with new status
        setTeacherData((prevData) => ({
          ...prevData,
          status: updatedData.is_active ? "Active" : "Inactive",
          is_active: updatedData.is_active,
        }));

        console.log("✅ Status updated successfully");
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (err) {
      console.error("❌ Error updating teacher status:", err);
      
      // If the first attempt failed, try alternative endpoint
      if (idType === "person_id" && teacherData.user_id) {
        console.log("🔄 Trying alternative endpoint with user_id...");
        try {
          const altResponse = await api.put(
            `/admin/teachers/${teacherData.user_id}/toggle-status`
          );
          
          if (altResponse.data.success) {
            const updatedData = altResponse.data.data.teacher || altResponse.data.data;
            setTeacherData((prevData) => ({
              ...prevData,
              status: updatedData.is_active ? "Active" : "Inactive",
              is_active: updatedData.is_active,
            }));
            console.log("✅ Status updated successfully via alternative endpoint");
            return;
          }
        } catch (altErr) {
          console.error("❌ Alternative endpoint also failed:", altErr);
        }
      }
      
      alert(
        "Failed to update status: " +
          (err.response?.data?.message || err.message)
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleBack = () => navigate("/teachers");

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
            <p className="mt-3 text-muted">Loading teacher details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid px-4 py-3">
        <Alert variant="danger" className="mb-4">
          <div className="d-flex align-items-start">
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">Error Loading Teacher</h4>
              <p className="mb-3">{error}</p>
              <div className="d-flex gap-2">
                <button onClick={handleBack} className="btn btn-primary">
                  <i className="bi bi-arrow-left me-2"></i>
                  Back to Teachers
                </button>
                <button
                  onClick={fetchTeacherDetails}
                  className="btn btn-outline-primary"
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Retry
                </button>
              </div>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // No data state
  if (!teacherData) {
    return (
      <div className="container-fluid px-4 py-3">
        <Alert variant="warning" className="mb-4">
          <div className="d-flex align-items-start">
            <i className="bi bi-info-circle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">No Data Found</h4>
              <p className="mb-3">
                No teacher data available for User ID: {id}.
              </p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Teachers
              </button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Teacher Details</h4>
          <p className="text-muted mb-0">
            Viewing details for: <strong>{teacherData.full_name}</strong>
            <span className="ms-2 text-muted">
              (User ID: {teacherData.user_id})
            </span>
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ButtonGlobal
            onClick={handleBack}
            className="btn btn-outline-secondary"
          >
            <i className="bi bi-arrow-left me-2" />
            Back to List
          </ButtonGlobal>
        </div>
      </div>

      {/* Teacher Summary Card */}
      <Card className="mb-4 border-0 shadow-sm bg-light">
        <Card.Header className="bg-transparent py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-person-badge me-2"></i>
              Teacher Information
            </h5>
            <div className="d-flex align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <Form.Check
                  type="switch"
                  id="teacher-status-switch"
                  checked={teacherData.is_active}
                  onChange={(e) => handleStatusToggle(e.target.checked)}
                  disabled={updatingStatus}
                  className="fs-5"
                />
                <span className="fw-medium">
                  {teacherData.is_active ? "Active" : "Inactive"}
                  {updatingStatus && (
                    <Spinner animation="border" size="sm" className="ms-2" />
                  )}
                </span>
              </div>
              <Badge
                bg={teacherData.is_active ? "success" : "secondary"}
                className="fs-7"
              >
                {teacherData.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-4">
          <Row className="g-4">
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Full Name</span>
                <span className="fs-6 fw-medium">{teacherData.full_name}</span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Gender</span>
                <span className="fs-6">{teacherData.gender || "—"}</span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Date of Birth</span>
                <span className="fs-6">
                  {formatDateToMMDDYYYY(teacherData.date_of_birth)}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Nationality</span>
                <span className="fs-6">{teacherData.nationality || "—"}</span>
              </div>
            </Col>

            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Occupation</span>
                <span className="fs-6">{teacherData.occupation || "—"}</span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Assigned Class</span>
                <span className="fs-6 fw-medium">
                  {teacherData.grade || "—"}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Marital Status</span>
                <span className="fs-6">
                  {teacherData.marital_status || "—"}
                </span>
              </div>
            </Col>
            <Col md={3}>
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Status</span>
                <span className="fs-6">
                  <Badge
                    bg={teacherData.is_active ? "success" : "secondary"}
                    className="fs-7"
                  >
                    {teacherData.is_active ? "Active" : "Inactive"}
                  </Badge>
                </span>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Detailed Information Tabs */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="px-3 pt-3 border-bottom"
            fill
          >
            {/* Personal Information Tab */}
            <Tab eventKey="personal" title="Personal Information">
              <div className="p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <InfoCard title="Personal Details" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">First Name</span>
                          <p className="mb-0 fw-medium">
                            {teacherData.first_name}
                          </p>
                        </div>
                        <div>
                          <span className="small">Last Name</span>
                          <p className="mb-0 fw-medium">
                            {teacherData.last_name}
                          </p>
                        </div>
                        <div>
                          <span className="small">Middle Name</span>
                          <p className="mb-0">
                            {teacherData.middle_name || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Gender</span>
                          <p className="mb-0">{teacherData.gender || "—"}</p>
                        </div>
                        <div>
                          <span className="small">Date of Birth</span>
                          <p className="mb-0">
                            {formatDateToMMDDYYYY(teacherData.date_of_birth)}
                          </p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard
                      title="Background Information"
                      className="bg-light"
                    >
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Nationality</span>
                          <p className="mb-0 fw-medium">
                            {teacherData.nationality || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Marital Status</span>
                          <p className="mb-0">
                            {teacherData.marital_status || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Occupation</span>
                          <p className="mb-0">
                            {teacherData.occupation || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Assigned Class</span>
                          <p className="mb-0 fw-medium">
                            {teacherData.grade || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Status</span>
                          <p className="mb-0">
                            <Badge
                              bg={
                                teacherData.is_active ? "success" : "secondary"
                              }
                              className="fs-7"
                            >
                              {teacherData.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Contact Information Tab */}
            <Tab eventKey="contacts" title="Contact Information">
              <div className="p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <InfoCard title="Primary Contact" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Email</span>
                          <p className="mb-0 fw-medium text-truncate">
                            {teacherData.email || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Phone</span>
                          <p className="mb-0">{teacherData.phone || "—"}</p>
                        </div>
                        <div>
                          <span className="small">Alternate Phone</span>
                          <p className="mb-0">
                            {teacherData.alternate_phone || "—"}
                          </p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard title="Address Information" className="bg-light">
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Residential Address</span>
                          <p className="mb-0">{teacherData.address || "—"}</p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Professional Information Tab */}
            <Tab eventKey="professional" title="Professional Information">
              <div className="p-3">
                <Row className="g-3">
                  <Col md={12}>
                    <InfoCard title="Teaching Details" className="bg-light">
                      <Row className="g-4">
                        <Col md={4}>
                          <div className="d-flex flex-column gap-3">
                            <div>
                              <span className="small">Occupation/Position</span>
                              <p className="mb-0 fw-medium">
                                {teacherData.occupation || "—"}
                              </p>
                            </div>
                            <div>
                              <span className="small">Assigned Class</span>
                              <p className="mb-0 fw-medium">
                                {teacherData.grade || "—"}
                              </p>
                            </div>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="d-flex flex-column gap-3">
                            <div>
                              <span className="small">Employment Status</span>
                              <p className="mb-0">
                                <Badge
                                  bg={
                                    teacherData.is_active
                                      ? "success"
                                      : "secondary"
                                  }
                                  className="fs-7"
                                >
                                  {teacherData.is_active
                                    ? "Active"
                                    : "Inactive"}
                                </Badge>
                              </p>
                            </div>
                            <div>
                              <span className="small">Role</span>
                              <p className="mb-0">
                                {teacherData.role?.display_name || "Teacher"}
                              </p>
                            </div>
                          </div>
                        </Col>
                        <Col md={4}>
                          <div className="d-flex flex-column gap-3">
                            <div>
                              <span className="small">User ID</span>
                              <p className="mb-0 fw-medium">
                                {teacherData.user_id}
                              </p>
                            </div>
                            <div>
                              <span className="small">Person ID</span>
                              <p className="mb-0">
                                {teacherData.person_id || "Not available"}
                              </p>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </InfoCard>
                  </Col>
                </Row>

                {/* Classroom Assignments Section */}
                <Row className="g-3 mt-3">
                  <Col md={12}>
                    <InfoCard
                      title="Classroom Assignments"
                      className="bg-light"
                    >
                      {loadingAssignments ? (
                        <div className="text-center py-4">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-2 text-muted">
                            Loading classroom assignments...
                          </p>
                        </div>
                      ) : classroomAssignments.length > 0 ? (
                        <div>
                          <div className="mb-3">
                            <Badge bg="info" className="fs-6">
                              {classroomAssignments.length} Classroom
                              {classroomAssignments.length !== 1 ? "s" : ""}{" "}
                              Assigned
                            </Badge>
                          </div>
                          <Table responsive striped hover>
                            <thead>
                              <tr>
                                <th>Class Name</th>
                                <th>Class ID</th>
                                <th>Assignment Date</th>
                                <th>End Date</th>
                                <th>Status</th>
                                <th>Current Assignment</th>
                              </tr>
                            </thead>
                            <tbody>
                              {classroomAssignments.map((assignment) => (
                                <tr key={assignment.assignment_id}>
                                  <td className="fw-medium">
                                    {assignment.classroom?.class_name || "N/A"}
                                  </td>
                                  <td>
                                    <code>{assignment.class_id}</code>
                                  </td>
                                  <td>
                                    {formatDateToMMDDYYYY(
                                      assignment.assignment_date
                                    )}
                                  </td>
                                  <td>
                                    {assignment.end_date
                                      ? formatDateToMMDDYYYY(
                                          assignment.end_date
                                        )
                                      : "—"}
                                  </td>
                                  <td>
                                    <Badge
                                      bg={
                                        assignment.status === "active"
                                          ? "success"
                                          : "secondary"
                                      }
                                    >
                                      {assignment.status || "unknown"}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge
                                      bg={
                                        assignment.is_current
                                          ? "primary"
                                          : "outline-secondary"
                                      }
                                    >
                                      {assignment.is_current ? "Yes" : "No"}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <i className="bi bi-inbox display-4 text-muted"></i>
                          <p className="mt-3 text-muted">
                            No classroom assignments found
                          </p>
                          <small className="text-muted">
                            This teacher is not currently assigned to any
                            classrooms.
                          </small>
                        </div>
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TeacherDetails;