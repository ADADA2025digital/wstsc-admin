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
  Form,
  InputGroup,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import api from "../../config/axiosConfig";

const AssignPrincipal = () => {
  const navigate = useNavigate();

  // Persons (for nominator / seconder)
  const [persons, setPersons] = useState([]);
  const [loadingPersons, setLoadingPersons] = useState(true);

  // Teachers (available for principal)
  const [teachers, setTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  // UI / state
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
    status: "active",
  });

  // 🔹 Helper to safely extract a role object from a person
  const getPersonRole = (person) => {
    if (!person) return null;
    return (
      person.user?.role ||
      person.user?.primary_role || // fallback if not normalized
      person.role ||
      (Array.isArray(person.roles) ? person.roles[0] : null) ||
      null
    );
  };

  const getPersonRoleDisplayName = (person) => {
    const role = getPersonRole(person);
    return (
      role?.display_name ||
      role?.role_name ||
      role?.name ||
      person?.position_display_name ||
      "No Role"
    );
  };

  const getPersonRoleName = (person) => {
    const role = getPersonRole(person);
    return role?.role_name || role?.display_name || role?.name || "";
  };

  // 🔹 Get available persons for nominator/seconder (excluding selected teacher and already selected persons)
  const getAvailablePersons = (excludePeid = null) => {
    return persons.filter((person) => {
      // Exclude the selected teacher
      if (selectedTeacher) {
        const isSelectedTeacher = 
          person.peid === selectedTeacher.peid ||
          person.uid === selectedTeacher.uid ||
          (selectedTeacher.tid && 
           (person.user?.uid === selectedTeacher.uid || 
            person.originalData?.tid === selectedTeacher.tid));
        
        if (isSelectedTeacher) return false;
      }

      // Exclude specific person if provided (for seconder to exclude nominator)
      if (excludePeid && person.peid === excludePeid) {
        return false;
      }

      return true;
    });
  };

  // 🔹 Fetch all persons for nominator & seconder
  const fetchPersons = async () => {
    try {
      setLoadingPersons(true);
      setError(null);
      console.log("🟡 Fetching persons from /admin/persons...");

      const response = await api.get("/admin/persons");
      console.log("✅ Persons API response:", response);

      if (response.data.success) {
        const allPersons = response.data.data.persons || [];
        console.log(`📊 Persons loaded: ${allPersons.length}`);
        console.log("📋 Raw persons data:", allPersons);

        // Normalize to add user.role from user.primary_role
        const transformedPersons = allPersons.map((p) => {
          const primaryRole = p.user?.primary_role || null;

          return {
            ...p,
            user: {
              ...(p.user || {}),
              role: primaryRole
                ? {
                    roleid: primaryRole.roleid ?? primaryRole.id ?? null,
                    role_name:
                      primaryRole.role_name ?? primaryRole.name ?? "user",
                    display_name:
                      primaryRole.display_name ??
                      primaryRole.role_name ??
                      primaryRole.name ??
                      "User",
                  }
                : null,
            },
          };
        });

        console.log("📋 Transformed persons:", transformedPersons);
        setPersons(transformedPersons);
      } else {
        console.error("❌ Persons API returned success: false", response.data);
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

  // 🔹 Fetch available teachers from the dedicated API endpoint
  const fetchTeachers = async () => {
    try {
      setLoadingTeachers(true);
      setError(null);
      console.log(
        "🟡 Starting to fetch teachers from /classroom-teachers/available-teachers..."
      );

      const response = await api.get("/classroom-teachers/available-teachers");
      console.log("✅ Teachers API response:", response);

      if (response.data.success) {
        const teachersData = response.data.data.teachers || [];
        console.log(`👨‍🏫 Teachers loaded: ${teachersData.length}`);
        console.log("📋 Raw teachers data:", teachersData);

        // Transform the teacher data to match our expected format
        const transformedTeachers = teachersData.map((teacher) => ({
          // Primary identifiers
          tid: teacher.tid,
          uid: teacher.uid,
          peid: teacher.person?.peid || `T${teacher.tid}`,

          // Personal information
          person_first_name:
            teacher.person?.first_name || teacher.name?.split(" ")[0] || "",
          person_last_name:
            teacher.person?.last_name ||
            teacher.name?.split(" ").slice(1).join(" ") ||
            "",
          full_name: teacher.person?.full_name || teacher.name || "",
          person_email: teacher.person?.email || teacher.email || "",
          person_phone: teacher.person?.phone || teacher.phone || "",

          // Status and position
          person_status: teacher.person?.status || teacher.status || "active",
          position: teacher.position,
          position_display_name: teacher.position_display_name,

          // Role information
          user: {
            uid: teacher.uid,
            role: teacher.role || {
              roleid: teacher.role?.roleid,
              role_name: teacher.role?.role_name || "teacher",
              display_name: teacher.role?.display_name || "Teacher",
            },
          },

          // Additional data
          profile_picture: teacher.profile_picture,
          photo_url: teacher.photo_url || teacher.person?.photo_url,

          // Keep original data for reference
          originalData: teacher,
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

  // 🔹 Load teachers and persons
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchTeachers(), fetchPersons()]);
      } catch (e) {
        console.error("❌ Error in loadData:", e);
        setError("Failed to load required data");
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔹 Reset nominator and seconder when selected teacher changes
  useEffect(() => {
    if (selectedTeacher) {
      // Clear nominator if they match the selected teacher
      if (nominator && (
          nominator.peid === selectedTeacher.peid ||
          nominator.uid === selectedTeacher.uid ||
          (selectedTeacher.tid && nominator.originalData?.tid === selectedTeacher.tid)
      )) {
        console.log("🔄 Clearing nominator because it matches selected teacher");
        setNominator(null);
      }
      
      // Clear seconder if they match the selected teacher
      if (seconder && (
          seconder.peid === selectedTeacher.peid ||
          seconder.uid === selectedTeacher.uid ||
          (selectedTeacher.tid && seconder.originalData?.tid === selectedTeacher.tid)
      )) {
        console.log("🔄 Clearing seconder because it matches selected teacher");
        setSeconder(null);
      }
    }
  }, [selectedTeacher, nominator, seconder]);

  // Filter teachers based on search term
  const filteredTeachers = teachers.filter((teacher) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      teacher.full_name?.toLowerCase().includes(searchLower) ||
      teacher.person_email?.toLowerCase().includes(searchLower) ||
      teacher.peid?.toLowerCase().includes(searchLower) ||
      teacher.position_display_name?.toLowerCase().includes(searchLower)
    );
  });

  // Handle teacher selection
  const handleTeacherSelect = (teacher) => {
    console.log("🎯 Teacher selected:", {
      tid: teacher.tid,
      peid: teacher.peid,
      full_name: teacher.full_name,
      position: teacher.position,
      user_id: teacher.uid,
    });
    setSelectedTeacher(teacher);
    setSuccessMessage("");
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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

    // 🔹 Additional validation: Ensure nominator/seconder are not the selected teacher
    if (nominator.peid === selectedTeacher.peid || nominator.uid === selectedTeacher.uid) {
      setError("Nominator cannot be the same as the selected teacher");
      console.groupEnd();
      return;
    }

    if (seconder.peid === selectedTeacher.peid || seconder.uid === selectedTeacher.uid) {
      setError("Seconder cannot be the same as the selected teacher");
      console.groupEnd();
      return;
    }

    // 🔹 Ensure nominator and seconder are different
    if (nominator.peid === seconder.peid) {
      setError("Nominator and seconder must be different persons");
      console.groupEnd();
      return;
    }

    try {
      setAssigningPrincipal(true);
      setError("");

      const submissionData = {
        // 🔴 Backend validation expects `tid`
        tid: Number(selectedTeacher.tid),
        // Keep teacher_id too if your controller uses it
        teacher_id: Number(selectedTeacher.tid),

        position: String(formData.position).trim(),
        year: Number(formData.year),
        nominated_by: String(nominator.peid).trim(),
        seconded_by: String(seconder.peid).trim(),
        status: String(formData.status).trim(),
      };

      console.log("📤 Prepared submission data:", submissionData);

      console.log("👥 Selected individuals:", {
        teacher: {
          name: selectedTeacher.full_name,
          tid: selectedTeacher.tid,
          peid: selectedTeacher.peid,
          current_position: selectedTeacher.position,
        },
        nominator: {
          name: nominator.full_name,
          peid: nominator.peid,
        },
        seconder: {
          name: seconder.full_name,
          peid: seconder.peid,
        },
      });

      console.log("🌐 Making POST request to /principals...");
      const response = await api.post("/principals", submissionData);

      console.log("✅ API Response received:", response);

      if (response.data.success) {
        console.log("🎉 Principal assigned successfully!");
        setSuccessMessage("Principal assigned successfully!");
        setTimeout(() => {
          navigate("/principals");
        }, 2000);
      } else {
        console.warn("⚠️ API returned success: false", response.data);
        setError(
          `Assignment failed: ${response.data.message || "Unknown error"}`
        );
      }
    } catch (err) {
      console.error("❌ Error assigning principal:", err);

      if (err.response) {
        if (err.response.status === 422) {
          if (err.response.data.errors) {
            const errorMessages = Object.entries(err.response.data.errors)
              .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
              .join("; ");
            setError(`Validation failed: ${errorMessages}`);
          } else {
            setError(
              "Data validation failed. Please check all fields and try again."
            );
          }
        } else if (err.response.data.message) {
          setError(`Server error: ${err.response.data.message}`);
        } else {
          setError(`Request failed with status ${err.response.status}`);
        }
      } else if (err.request) {
        setError("Network error: Please check your connection and try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
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
        return "success";
      case "teacher":
        return "success";
      case "parent":
        return "warning";
      case "principal":
        return "primary";
      case "committee":
        return "info";
      default:
        return "secondary";
    }
  };

  // Get role display name (for teachers)
  const getRoleDisplayName = (person) => {
    if (!person?.user || !person.user.role)
      return person.position_display_name || "No Role";

    return (
      person.user.role.display_name ||
      person.position_display_name ||
      person.user.role.role_name ||
      "Unknown Role"
    );
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

  // Reset selection
  const handleResetSelection = () => {
    setSelectedTeacher(null);
    setNominator(null);
    setSeconder(null);
    setSearchTerm("");
    setError("");
    setSuccessMessage("");
  };

  // Handle nominator selection (from persons state)
  const handleNominatorSelect = (e) => {
    const selectedPeid = e.target.value;
    const selectedPerson = persons.find((p) => p.peid === selectedPeid);
    setNominator(selectedPerson || null);
    
    // If seconder is the same as new nominator, clear seconder
    if (seconder && selectedPeid === seconder.peid) {
      setSeconder(null);
    }
  };

  // Handle seconder selection (from persons state)
  const handleSeconderSelect = (e) => {
    const selectedPeid = e.target.value;
    const selectedPerson = persons.find((p) => p.peid === selectedPeid);
    setSeconder(selectedPerson || null);
    
    // If nominator is the same as new seconder, clear nominator
    if (nominator && selectedPeid === nominator.peid) {
      setNominator(null);
    }
  };

  const isLoadingTeachersList = loadingTeachers;
  const isLoadingPersonsList = loadingPersons;

  const isLoading = isLoadingTeachersList || isLoadingPersonsList;

  // Check if nominator is same as selected teacher
  const isNominatorSameAsTeacher = nominator && selectedTeacher && 
    (nominator.peid === selectedTeacher.peid || nominator.uid === selectedTeacher.uid);

  // Check if seconder is same as selected teacher
  const isSeconderSameAsTeacher = seconder && selectedTeacher && 
    (seconder.peid === selectedTeacher.peid || seconder.uid === selectedTeacher.uid);

  // Check if nominator and seconder are same person
  const areNominatorAndSeconderSame = nominator && seconder && nominator.peid === seconder.peid;

  return (
    <Container fluid className="px-0 px-md-4 py-3">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="content-header d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
            <div>
              <h2 className="h4 fw-bold">Assign Principal</h2>
              <p className="text-muted mb-0">
                Select a teacher to assign as principal and choose nominators
              </p>
            </div>
            <Button variant="outline-secondary" as={Link} to="/principals">
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
            <Card.Header className="content-header d-flex flex-column flex-md-row justify-content-between align-items-center">
              <div>
                <h5 className="mb-0">
                  <i className="bi bi-person-badge me-2"></i>
                  Available Teachers
                </h5>
              </div>
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
                    placeholder="Search teachers by name, email..."
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
              {isLoadingTeachersList ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-3 text-muted">Loading teachers...</p>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-person-x display-6 text-muted mb-3"></i>
                  <h5 className="text-muted">
                    {searchTerm ? "No teachers found" : "No Teachers Available"}
                  </h5>
                  <p className="text-muted">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "There are no available teachers in the system."}
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
                <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="bg-light">
                        <tr>
                          <th width="60px" className="text-center">
                            Select
                          </th>
                          <th>Teacher Details</th>
                          <th>Contact</th>
                          <th>Position</th>
                          <th>Role</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTeachers.map((teacher) => (
                          <tr
                            key={teacher.tid}
                            onClick={() => handleTeacherSelect(teacher)}
                            style={{
                              cursor: "pointer",
                              backgroundColor:
                                selectedTeacher?.tid === teacher.tid
                                  ? "#e3f2fd"
                                  : "transparent",
                              borderLeft:
                                selectedTeacher?.tid === teacher.tid
                                  ? "4px solid #0d6efd"
                                  : "4px solid transparent",
                            }}
                            className="align-middle"
                          >
                            <td className="text-center">
                              <Form.Check
                                type="radio"
                                name="selectedTeacher"
                                checked={selectedTeacher?.tid === teacher.tid}
                                onChange={() => handleTeacherSelect(teacher)}
                              />
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                {teacher.photo_url ? (
                                  <img
                                    src={teacher.photo_url}
                                    alt={teacher.full_name}
                                    className="rounded-circle me-3"
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      objectFit: "cover",
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white me-3"
                                    style={{ width: "40px", height: "40px" }}
                                  >
                                    <i className="bi bi-person-fill"></i>
                                  </div>
                                )}
                                <div>
                                  <h6 className="mb-1 fw-bold">
                                    {teacher.full_name}
                                  </h6>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>
                                <div className="mb-1">
                                  <i className="bi bi-envelope text-muted me-1"></i>
                                  <small>
                                    {teacher.person_email || "No email"}
                                  </small>
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
                              <Badge
                                bg={
                                  teacher.position === "principal"
                                    ? "primary"
                                    : "info"
                                }
                              >
                                {teacher.position_display_name ||
                                  teacher.position ||
                                  "Teacher"}
                              </Badge>
                            </td>
                            <td>
                              <Badge
                                bg={getRoleVariant(
                                  teacher.user?.role?.role_name
                                )}
                              >
                                {getRoleDisplayName(teacher)}
                              </Badge>
                            </td>
                            <td>
                              <Badge
                                bg={getStatusVariant(teacher.person_status)}
                              >
                                {teacher.person_status || "Unknown"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Nominator and Seconder Selection Card */}
          {selectedTeacher && (
            <Card>
              <Card.Header className="content-header">
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
                        disabled={isLoadingPersonsList || !selectedTeacher}
                      >
                        <option value="">
                          {isLoadingPersonsList
                            ? "Loading persons..."
                            : !selectedTeacher
                            ? "Select a teacher first"
                            : "Choose a nominator..."}
                        </option>
                        {!isLoadingPersonsList &&
                          selectedTeacher &&
                          getAvailablePersons().map((person) => (
                            <option key={person.peid} value={person.peid}>
                              {person.full_name} ({getPersonRoleDisplayName(person)})
                            </option>
                          ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Person who is nominating this teacher as principal
                      </Form.Text>
                    </Form.Group>
                    
                    {isNominatorSameAsTeacher && (
                      <Alert variant="danger" className="mt-2 py-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Nominator cannot be the same as the selected teacher
                      </Alert>
                    )}

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
                              <Badge
                                bg={getRoleVariant(
                                  getPersonRoleName(nominator)
                                )}
                              >
                                {getPersonRoleDisplayName(nominator)}
                              </Badge>
                            </div>
                            <small className="text-muted">
                              {nominator.person_email}
                            </small>
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
                        disabled={isLoadingPersonsList || !selectedTeacher}
                      >
                        <option value="">
                          {isLoadingPersonsList
                            ? "Loading persons..."
                            : !selectedTeacher
                            ? "Select a teacher first"
                            : "Choose a seconder..."}
                        </option>
                        {!isLoadingPersonsList &&
                          selectedTeacher &&
                          getAvailablePersons(nominator?.peid).map((person) => (
                            <option key={person.peid} value={person.peid}>
                              {person.full_name} ({getPersonRoleDisplayName(person)})
                            </option>
                          ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Person who is seconding this nomination
                      </Form.Text>
                    </Form.Group>
                    
                    {isSeconderSameAsTeacher && (
                      <Alert variant="danger" className="mt-2 py-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Seconder cannot be the same as the selected teacher
                      </Alert>
                    )}

                    {areNominatorAndSeconderSame && (
                      <Alert variant="warning" className="mt-2 py-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Nominator and seconder should be different persons
                      </Alert>
                    )}

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
                              <Badge
                                bg={getRoleVariant(getPersonRoleName(seconder))}
                              >
                                {getPersonRoleDisplayName(seconder)}
                              </Badge>
                            </div>
                            <small className="text-muted">
                              {seconder.person_email}
                            </small>
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
            <Card.Header>
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
                      {selectedTeacher.photo_url ? (
                        <img
                          src={selectedTeacher.photo_url}
                          alt={selectedTeacher.full_name}
                          className="rounded-circle mb-2"
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div
                          className="bg-success rounded-circle d-inline-flex align-items-center justify-content-center text-white mb-2"
                          style={{ width: "60px", height: "60px" }}
                        >
                          <i className="bi bi-person-fill fs-4"></i>
                        </div>
                      )}
                      <h6 className="mb-1">{selectedTeacher.full_name}</h6>
                      <Badge
                        bg={getRoleVariant(
                          selectedTeacher.user?.role?.role_name
                        )}
                      >
                        {getRoleDisplayName(selectedTeacher)}
                      </Badge>
                    </div>
                    <table className="table table-sm">
                      <tbody>
                        <tr>
                          <td className="fw-bold text-muted">Email:</td>
                          <td>{selectedTeacher.person_email || "No email"}</td>
                        </tr>
                        <tr>
                          <td className="fw-bold text-muted">
                            Current Position:
                          </td>
                          <td>
                            <Badge
                              bg={
                                selectedTeacher.position === "principal"
                                  ? "primary"
                                  : "info"
                              }
                            >
                              {selectedTeacher.position_display_name ||
                                selectedTeacher.position}
                            </Badge>
                          </td>
                        </tr>
                        {/* <tr>
                          <td className="fw-bold text-muted">Status:</td>
                          <td>
                            <Badge
                              bg={getStatusVariant(
                                selectedTeacher.person_status
                              )}
                            >
                              {selectedTeacher.person_status || "Unknown"}
                            </Badge>
                          </td>
                        </tr> */}
                      </tbody>
                    </table>
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
                      disabled={
                        assigningPrincipal ||
                        !selectedTeacher ||
                        !nominator ||
                        !seconder ||
                        isNominatorSameAsTeacher ||
                        isSeconderSameAsTeacher ||
                        areNominatorAndSeconderSame
                      }
                    >
                      {assigningPrincipal ? (
                        <>
                          <Spinner
                            animation="border"
                            size="sm"
                            className="me-2"
                          />
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
                  
                  {/* Validation Summary */}
                  {(isNominatorSameAsTeacher || isSeconderSameAsTeacher || areNominatorAndSeconderSame) && (
                    <Alert variant="warning" className="mt-3">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <strong>Validation Issues:</strong>
                      <ul className="mb-0 mt-1">
                        {isNominatorSameAsTeacher && <li>Nominator cannot be the selected teacher</li>}
                        {isSeconderSameAsTeacher && <li>Seconder cannot be the selected teacher</li>}
                        {areNominatorAndSeconderSame && <li>Nominator and seconder must be different persons</li>}
                      </ul>
                    </Alert>
                  )}
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="bi bi-person-badge display-6 text-muted mb-3"></i>
                  <h5 className="text-muted">No Teacher Selected</h5>
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