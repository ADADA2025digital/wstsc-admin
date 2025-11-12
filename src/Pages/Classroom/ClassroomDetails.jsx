import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Badge,
  Col,
  Row,
  Tab,
  Tabs,
  Alert,
  Form,
  Modal,
  Button,
} from "react-bootstrap";
import ButtonGlobal from "../../Components/Button";
import InfoCard, { EmptyState } from "../../Components/InfoCard";
import api from "../../config/axiosConfig.jsx";

const EDITABLE_ROLES = ["admin", "principal", "vice_principal", "volunteer"];

export default function ClassroomDetails() {
  const params = useParams();
  const navigate = useNavigate();

  console.log("🎬 ClassroomDetails Component RENDERED");
  console.log("📝 ALL URL Parameters:", params);

  const classroomId = params.id;
  console.log("🔍 Classroom ID from URL:", classroomId);

  const [classroom, setClassroom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [apiMessage, setApiMessage] = useState({ type: "", text: "" });
  const [assignedTeachers, setAssignedTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Edit classroom modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState(false);
  const [editedClassName, setEditedClassName] = useState("");

  // Remove teacher modal state
  const [showRemoveTeacherModal, setShowRemoveTeacherModal] = useState(false);
  const [removingTeacher, setRemovingTeacher] = useState(false);
  const [teacherToRemove, setTeacherToRemove] = useState(null);

  // Teacher assignment modal state
  const [showAssignTeacherModal, setShowAssignTeacherModal] = useState(false);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [assigningTeacher, setAssigningTeacher] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [assignmentDate, setAssignmentDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  // Get user role from localStorage
  const getUserRole = () => {
    try {
      const userData = localStorage.getItem("userData");
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed.role?.role_name || parsed.role || "student";
      }
      return "student";
    } catch (error) {
      console.error("Error getting user role:", error);
      return "student";
    }
  };

  const userRole = getUserRole();
  const canEdit = EDITABLE_ROLES.includes(userRole);

  // Fetch classroom by ID
  const fetchClassroomById = async (classroomId) => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 START: Fetching classroom by ID:", classroomId);

      const response = await api.get(`/classrooms/${classroomId}`);
      console.log("📦 CLASSROOM DETAILS API RESPONSE:", response.data);

      if (response.data && response.data.success) {
        const classroomData = response.data.data.classroom;
        console.log("🏫 RAW CLASSROOM DATA FROM API:", classroomData);

        const mappedClassroom = {
          id: classroomData.c_id,
          classId: classroomData.class_id,
          name: classroomData.class_name,
          code: classroomData.class_code || classroomData.class_id,
          status: classroomData.is_active ? "Active" : "Inactive",
          isActive: classroomData.is_active,
          rawData: classroomData,
        };

        console.log("🗺️ MAPPED CLASSROOM DATA:", mappedClassroom);
        setClassroom(mappedClassroom);

        console.log(
          "🔗 Now fetching teachers for classroom ID:",
          classroomData.class_id
        );
        await fetchAssignedTeachers(classroomData.class_id);
        
        // Fetch students when classroom data is loaded
        console.log(
          "👨‍🎓 Now fetching students for classroom ID:",
          classroomData.class_id
        );
        await fetchClassStudents(classroomData.class_id);
      } else {
        console.error("❌ CLASSROOM DETAILS API FAILED");
        setError("Failed to load classroom details.");
      }
    } catch (error) {
      console.error("💥 ERROR fetching classroom details:", error);
      console.error("Error details:", error.response?.data);
      setError(
        "Failed to load classroom details: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch assigned teachers
  const fetchAssignedTeachers = async (classroomClassId) => {
    try {
      console.log(
        "👨‍🏫 START: Fetching assigned teachers for classroom:",
        classroomClassId
      );

      const response = await api.get("/classroom-teachers");
      console.log("📦 RAW API RESPONSE - Teacher Assignments:", response.data);

      if (response.data && response.data.success) {
        const allAssignments = response.data.data.assignments || [];
        console.log("📋 ALL ASSIGNMENTS FROM API:", allAssignments);

        // Filter assignments for this specific classroom
        const classroomAssignments = allAssignments.filter((assignment) => {
          const matchesClassId = assignment.class_id === classroomClassId;
          const matchesClassroomClassId =
            assignment.classroom?.class_id === classroomClassId;
          const matches = matchesClassId || matchesClassroomClassId;

          console.log(`🔍 FILTERING - Assignment:`, {
            assignmentClassId: assignment.class_id,
            assignmentClassroomClassId: assignment.classroom?.class_id,
            ourClassroomId: classroomClassId,
            matches: matches,
          });

          return matches;
        });

        console.log("🎯 FILTERED CLASSROOM ASSIGNMENTS:", classroomAssignments);

        const teachers = classroomAssignments.map((assignment) => {
          const teacher = assignment.teacher;
          const teacherData = {
            id: teacher.user_id,
            name:
              teacher.name || teacher.person?.full_name || "Unknown Teacher",
            email: teacher.email,
            assignmentId: assignment.assignment_id,
            assignmentDate: assignment.assignment_date,
            endDate: assignment.end_date,
            isCurrent: assignment.is_current,
            status: assignment.status,
          };
          console.log("👤 PROCESSED TEACHER DATA:", teacherData);
          return teacherData;
        });

        console.log("✅ FINAL ASSIGNED TEACHERS LIST:", teachers);
        setAssignedTeachers(teachers);
      } else {
        console.error(
          "❌ TEACHERS API RESPONSE NOT SUCCESSFUL:",
          response.data
        );
        setAssignedTeachers([]);
      }
    } catch (error) {
      console.error("💥 ERROR fetching assigned teachers:", error);
      console.error("Error response data:", error.response?.data);
      setAssignedTeachers([]);
    }
  };

  // Fetch class students
  const fetchClassStudents = async (classId) => {
    try {
      setLoadingStudents(true);
      console.log("👨‍🎓 START: Fetching students for class:", classId);

      const response = await api.get(`/class-students/class/${classId}`);
      console.log("📦 CLASS STUDENTS API RESPONSE:", response.data);

      if (response.data && response.data.success) {
        const studentsData = response.data.data.students || [];
        console.log("🎯 RAW STUDENTS DATA:", studentsData);

        // Map the student data to a more usable format
        const mappedStudents = studentsData.map((studentData, index) => {
          const student = studentData.student || {};
          return {
            id: studentData.csid || student.enrollment_id || index,
            enrollmentId: student.enrollment_id,
            csid: studentData.csid,
            studentId: studentData.student_id,
            firstName: student.first_given_name,
            familyName: student.family_name,
            preferredName: student.preferred_first_name,
            fullName: `${student.first_given_name || ''} ${student.family_name || ''}`.trim(),
            gender: student.gender,
            dateOfBirth: student.date_of_birth,
            enrollmentYear: studentData.enr_year,
            isActive: studentData.is_active,
            rawData: studentData
          };
        });

        console.log("✅ MAPPED STUDENTS:", mappedStudents);
        setStudents(mappedStudents);
      } else {
        console.error("❌ CLASS STUDENTS API FAILED:", response.data);
        setStudents([]);
      }
    } catch (error) {
      console.error("💥 ERROR fetching class students:", error);
      console.error("Error response:", error.response?.data);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch available teachers using the correct API endpoint
  const fetchAvailableTeachers = async () => {
    try {
      setLoadingTeachers(true);
      console.log("🔍 START: Fetching available teachers from API");

      const response = await api.get("/classroom-teachers/available-teachers");
      console.log("📦 AVAILABLE TEACHERS API RESPONSE:", response.data);

      if (response.data && response.data.success) {
        const teachers = response.data.data.teachers || [];
        console.log("✅ AVAILABLE TEACHERS LIST:", teachers);
        setAvailableTeachers(teachers);
      } else {
        console.error("❌ AVAILABLE TEACHERS API FAILED:", response.data);
        showMessage("danger", "Failed to load available teachers");
        setAvailableTeachers([]);
      }
    } catch (error) {
      console.error("💥 ERROR fetching available teachers:", error);
      console.error("Error response:", error.response?.data);
      showMessage(
        "danger",
        "Failed to load available teachers: " +
          (error.response?.data?.message || error.message)
      );
      setAvailableTeachers([]);
    } finally {
      setLoadingTeachers(false);
    }
  };

  useEffect(() => {
    console.log("🚀 useEffect TRIGGERED - Fetching classroom data from API");
    console.log("🔍 Classroom ID from params:", classroomId);

    if (classroomId) {
      fetchClassroomById(classroomId);
    } else {
      console.error("❌ NO CLASSROOM ID FOUND IN URL PARAMS");
      setError("No classroom ID provided in URL");
      setLoading(false);
    }
  }, [classroomId]);

  // Monitor state changes for debugging
  useEffect(() => {
    console.log("🔄 CLASSROOM STATE UPDATED:", classroom);
  }, [classroom]);

  useEffect(() => {
    console.log("👨‍🏫 ASSIGNED TEACHERS STATE UPDATED:", assignedTeachers);
  }, [assignedTeachers]);

  useEffect(() => {
    console.log("👨‍🎓 STUDENTS STATE UPDATED:", students);
  }, [students]);

  useEffect(() => {
    console.log("⏳ LOADING STATE:", loading);
  }, [loading]);

  useEffect(() => {
    console.log("❌ ERROR STATE:", error);
  }, [error]);

  const handleBack = () => navigate("/classrooms");

  const showMessage = (type, text, duration = 5000) => {
    console.log(`💬 SHOWING MESSAGE: ${type} - ${text}`);
    setApiMessage({ type, text });
    setTimeout(() => setApiMessage({ type: "", text: "" }), duration);
  };

  // Open edit classroom modal
  const handleOpenEditModal = () => {
    if (!canEdit) return;
    console.log("📝 OPENING EDIT CLASSROOM MODAL");
    setShowEditModal(true);
    setEditedClassName(classroom.name);
  };

  // Close edit classroom modal
  const handleCloseEditModal = () => {
    console.log("❌ CLOSING EDIT CLASSROOM MODAL");
    setShowEditModal(false);
    setEditedClassName("");
  };

  // Update classroom name - CORRECTED API CALL
  const handleUpdateClassroom = async () => {
    if (!canEdit || !editedClassName.trim() || !classroom?.id) return;

    console.log("📤 UPDATING CLASSROOM - Payload:", {
      classroom_id: classroom.id,
      class_name: editedClassName.trim(),
    });

    setEditingClassroom(true);
    try {
      // Correct payload structure based on your API
      const payload = {
        class_name: editedClassName.trim(),
      };

      console.log("🚀 SENDING PUT REQUEST to:", `/classrooms/${classroom.id}`);
      console.log("📦 PAYLOAD:", payload);

      const response = await api.put(`/classrooms/${classroom.id}`, payload);
      console.log("📦 UPDATE CLASSROOM API RESPONSE:", response.data);

      if (response.data && response.data.success) {
        showMessage("success", "Classroom updated successfully");

        // Update the classroom state with the new data from response
        const updatedClassroomData = response.data.data.classroom;
        console.log(
          "🔄 UPDATED CLASSROOM DATA FROM API:",
          updatedClassroomData
        );

        const updatedClassroom = {
          ...classroom,
          id: updatedClassroomData.c_id,
          classId: updatedClassroomData.class_id,
          name: updatedClassroomData.class_name,
          code:
            updatedClassroomData.class_code || updatedClassroomData.class_id,
          status: updatedClassroomData.is_active ? "Active" : "Inactive",
          isActive: updatedClassroomData.is_active,
          rawData: updatedClassroomData,
        };

        console.log("✅ UPDATED CLASSROOM STATE:", updatedClassroom);
        setClassroom(updatedClassroom);

        handleCloseEditModal();
      } else {
        throw new Error(response.data?.message || "Failed to update classroom");
      }
    } catch (error) {
      console.error("💥 ERROR updating classroom:", error);
      console.error("Error response:", error.response?.data);
      showMessage(
        "danger",
        error.response?.data?.message ||
          error.message ||
          "Failed to update classroom"
      );
    } finally {
      setEditingClassroom(false);
    }
  };

  // Open assign teacher modal
  const handleOpenAssignTeacherModal = () => {
    if (!canEdit) return;
    console.log("📋 OPENING ASSIGN TEACHER MODAL");
    setShowAssignTeacherModal(true);
    setSelectedTeacher("");
    setAssignmentDate(new Date().toISOString().split("T")[0]);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    setEndDate(oneYearFromNow.toISOString().split("T")[0]);
    setNotes("");
    fetchAvailableTeachers();
  };

  // Close assign teacher modal
  const handleCloseAssignTeacherModal = () => {
    console.log("❌ CLOSING ASSIGN TEACHER MODAL");
    setShowAssignTeacherModal(false);
    setSelectedTeacher("");
    setAssignmentDate("");
    setEndDate("");
    setNotes("");
  };

  // Assign teacher
  const handleAssignTeacher = async () => {
    if (!canEdit || !selectedTeacher || !assignmentDate || !classroom?.classId)
      return;

    const teacherId = parseInt(selectedTeacher);
    console.log("📤 ASSIGNING TEACHER - Payload:", {
      class_id: classroom.classId,
      teacher_id: teacherId,
      assignment_date: assignmentDate,
      end_date: endDate || null,
      notes: notes || "",
    });

    setAssigningTeacher(true);
    try {
      const payload = {
        class_id: classroom.classId,
        teacher_id: teacherId,
        assignment_date: assignmentDate,
        end_date: endDate || null,
        notes: notes || "",
      };
      const response = await api.post("/classroom-teachers", payload);
      console.log("📦 ASSIGN TEACHER API RESPONSE:", response.data);

      if (response.data.success) {
        showMessage("success", "Teacher assigned successfully");
        await fetchAssignedTeachers(classroom.classId);
        handleCloseAssignTeacherModal();
      } else {
        throw new Error(response.data.message || "Failed to assign teacher");
      }
    } catch (error) {
      console.error("💥 ERROR assigning teacher:", error);
      console.error("Error response:", error.response?.data);
      showMessage(
        "danger",
        error.response?.data?.message ||
          error.message ||
          "Failed to assign teacher"
      );
    } finally {
      setAssigningTeacher(false);
    }
  };

  // Toggle classroom status
  const toggleClassroomStatus = async () => {
    if (!classroom?.id || !canEdit) {
      console.log("🚫 CANNOT TOGGLE: Missing classroom ID or edit permissions");
      return;
    }

    console.log("🔄 TOGGLING CLASSROOM STATUS for ID:", classroom.id);

    try {
      const response = await api.patch(
        `/classrooms/${classroom.id}/toggle-status`
      );
      console.log("📦 TOGGLE STATUS API RESPONSE:", response.data);

      if (response.data.success) {
        const updatedClassroom = response.data.data.classroom;
        const updated = {
          ...classroom,
          status: updatedClassroom.is_active ? "Active" : "Inactive",
          isActive: updatedClassroom.is_active,
          name: updatedClassroom.class_name,
          rawData: updatedClassroom,
        };
        setClassroom(updated);
        showMessage("success", "Classroom status updated successfully");
      }
    } catch (error) {
      console.error("💥 ERROR toggling classroom status:", error);
      console.error("Error response:", error.response?.data);
      showMessage(
        "danger",
        error.response?.data?.message || "Failed to update classroom status"
      );
    }
  };

  // Open remove teacher confirmation modal
  const handleOpenRemoveTeacherModal = (assignmentId, teacherName) => {
    if (!canEdit) return;

    console.log("📝 OPENING REMOVE TEACHER MODAL:", {
      assignmentId,
      teacherName,
    });

    setTeacherToRemove({
      assignmentId,
      teacherName,
    });
    setShowRemoveTeacherModal(true);
  };

  // Close remove teacher modal
  const handleCloseRemoveTeacherModal = () => {
    console.log("❌ CLOSING REMOVE TEACHER MODAL");
    setShowRemoveTeacherModal(false);
    setTeacherToRemove(null);
    setRemovingTeacher(false);
  };

  // Remove teacher assignment
  const handleRemoveTeacher = async () => {
    if (!canEdit || !teacherToRemove) return;

    console.log("🗑️ REMOVING TEACHER ASSIGNMENT:", teacherToRemove);

    setRemovingTeacher(true);
    try {
      const response = await api.delete(
        `/classroom-teachers/${teacherToRemove.assignmentId}`
      );
      console.log("📦 REMOVE TEACHER API RESPONSE:", response.data);

      if (response.data.success) {
        showMessage("success", "Teacher removed successfully");
        await fetchAssignedTeachers(classroom.classId);
        handleCloseRemoveTeacherModal();
      } else {
        throw new Error(response.data.message || "Failed to remove teacher");
      }
    } catch (error) {
      console.error("💥 ERROR removing teacher:", error);
      console.error("Error response:", error.response?.data);
      showMessage(
        "danger",
        error.response?.data?.message || "Failed to remove teacher"
      );
    } finally {
      setRemovingTeacher(false);
    }
  };

  // Refresh students data
  const refreshStudents = async () => {
    if (classroom?.classId) {
      await fetchClassStudents(classroom.classId);
    }
  };

  if (loading) {
    console.log("⏳ RENDERING LOADING STATE");
    return (
      <div className="container-fluid px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-3 text-muted">Loading classroom details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    console.log("❌ RENDERING ERROR STATE:", error);
    return (
      <div className="container-fluid px-4 py-3">
        <Alert variant="danger">
          <div className="d-flex align-items-start">
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">Error Loading Classroom</h4>
              <p className="mb-3">{error}</p>
              <div className="mb-3">
                <small className="text-muted">
                  URL Parameters: {JSON.stringify(params)}
                  <br />
                  Classroom ID: {classroomId || "Not found"}
                </small>
              </div>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Classrooms
              </button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  if (!classroom) {
    console.log("⚠️ RENDERING NO DATA STATE");
    return (
      <div className="container-fluid px-4 py-3">
        <Alert variant="warning">
          <div className="d-flex align-items-start">
            <i className="bi bi-info-circle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">No Data Found</h4>
              <p className="mb-3">No classroom data available.</p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Classrooms
              </button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  const studentCount = students.length;
  const teacherCount = assignedTeachers.length;
  const isActive = classroom.isActive;

  console.log("🎯 RENDERING CLASSROOM DETAILS:", {
    classroom,
    studentCount,
    teacherCount,
    isActive,
  });

  return (
    <div className="container-fluid px-4 py-3">
      {/* API Message Alert */}
      {apiMessage.text && (
        <Alert
          variant={apiMessage.type}
          dismissible
          onClose={() => setApiMessage({ type: "", text: "" })}
        >
          {apiMessage.text}
        </Alert>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Classroom Details</h4>
          <p className="text-muted mb-0">
            Viewing: <strong>{classroom.name}</strong>
            <span className="mx-2">•</span>
            <span className="text-monospace">{classroom.code}</span>
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

          {canEdit && (
            <>
              <ButtonGlobal
                onClick={handleOpenEditModal}
                className="btn btn-outline-primary"
              >
                <i className="bi bi-pencil me-2" />
                Edit Classroom
              </ButtonGlobal>

              {/* Conditionally show Assign Teacher button or inactive message */}
              {isActive ? (
                <ButtonGlobal
                  onClick={handleOpenAssignTeacherModal}
                  className="btn btn-primary"
                >
                  <i className="bi bi-person-plus me-2" />
                  Assign Teacher
                </ButtonGlobal>
              ) : (
                <div className="text-muted small text-center">
                  <i className="bi bi-exclamation-circle me-1" />
                  Class is inactive
                  <br />
                  <small>Cannot assign teachers</small>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Summary Card */}
      <div className="card mb-4 border-0 shadow-sm bg-secondary bg-opacity-10">
        <div className="card-header bg-transparent py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-door-closed me-2"></i>
              Classroom Information
            </h5>

            {canEdit && (
              <div className="d-flex align-items-center gap-2">
                <Form.Check
                  type="switch"
                  id="status-toggle"
                  label={<span className="fw-medium">{classroom.status}</span>}
                  checked={isActive}
                  onChange={toggleClassroomStatus}
                  className="mb-0"
                />
              </div>
            )}
          </div>
        </div>

        <div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Classroom Name</span>
                <span className="fs-6 fw-medium">{classroom.name}</span>
              </div>
            </div>

            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Code</span>
                <span className="fs-6">{classroom.code}</span>
              </div>
            </div>

            <div className="col-md-3">
              <div className="d-flex flex-column align-items-center gap-2">
                <span className="small fw-semibold">Status</span>
                <Badge bg={isActive ? "success" : "danger"} className="fs-7">
                  {classroom.status}
                </Badge>
              </div>
            </div>

            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Students Count</span>
                <span className="fs-6 fw-medium">{studentCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="px-3 pt-3 border-bottom"
            fill
          >
            {/* Overview Tab */}
            <Tab
              eventKey="overview"
              title={
                <span>
                  <i className="bi bi-grid-1x2 me-2"></i>
                  Overview
                </span>
              }
            >
              <div className="p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <InfoCard
                      title="Classroom Summary"
                      className="bg-secondary bg-opacity-10"
                    >
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Name</span>
                          <p className="mb-0 fw-medium">{classroom.name}</p>
                        </div>
                        <div>
                          <span className="small">Code</span>
                          <p className="mb-0">{classroom.code}</p>
                        </div>
                        <div>
                          <span className="small">Status</span>{" "}
                          <Badge
                            bg={isActive ? "success" : "danger"}
                            className="fs-7"
                          >
                            {classroom.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="small">Students</span>
                          <p className="mb-0">{studentCount}</p>
                        </div>
                        <div>
                          <span className="small">Teachers</span>
                          <p className="mb-0">{teacherCount}</p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard
                      title={`Teachers for ${classroom.name}`}
                      className="bg-secondary bg-opacity-10"
                    >
                      {assignedTeachers.length ? (
                        <div className="list-group list-group-flush">
                          {assignedTeachers.map((teacher, index) => (
                            <div
                              key={teacher.assignmentId || index}
                              className="list-group-item d-flex justify-content-between align-items-center"
                            >
                              <div className="d-flex align-items-center">
                                <i
                                  className="bi bi-person-circle me-3 text-primary fs-5"
                                ></i>
                                <div>
                                  <h6
                                    className="mb-0 fw-semibold"
                                  >
                                    {teacher.name}
                                  </h6>
                                  <small className="text-muted">
                                    {teacher.email}
                                  </small>
                                  <br />
                                  <small className="text-muted">
                                    Assigned:{" "}
                                    {new Date(
                                      teacher.assignmentDate
                                    ).toLocaleDateString()}
                                    {teacher.endDate &&
                                      ` - ${new Date(
                                        teacher.endDate
                                      ).toLocaleDateString()}`}
                                  </small>
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-2">
                                <Badge
                                  bg={teacher.isCurrent ? "success" : "warning"}
                                >
                                  {teacher.isCurrent ? "Current" : "Past"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          title="No teachers assigned"
                          subtitle={
                            isActive && canEdit
                              ? "Click the 'Assign Teacher' button to add teachers to this classroom."
                              : "No teachers are currently assigned to this classroom."
                          }
                          icon="bi bi-person-x"
                        />
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Teachers Tab */}
            <Tab
              eventKey="teachers"
              title={
                <span>
                  <i className="bi bi-person-lines-fill me-2"></i>
                  Teachers ({teacherCount})
                </span>
              }
            >
              <div className="p-3">
                <div
                  className="d-flex justify-content-between align-items-center mb-3"
                >
                  <h5 className="mb-0">
                    Teachers Assigned to {classroom.name}
                  </h5>
                </div>

                <InfoCard title="" className="bg-secondary bg-opacity-10">
                  {assignedTeachers.length ? (
                    <div className="list-group list-group-flush">
                      {assignedTeachers.map((teacher, index) => (
                        <div
                          key={teacher.assignmentId || index}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div className="d-flex align-items-center">
                            <i className="bi bi-person-circle me-3 text-primary fs-5"></i>
                            <div>
                              <h6 className="mb-0 fw-semibold">{teacher.name}</h6>
                              <p className="mb-1 text-muted small">
                                {teacher.email}
                              </p>
                              <p className="mb-0 text-muted small">
                                Assignment:{" "}
                                {new Date(
                                  teacher.assignmentDate
                                ).toLocaleDateString()}
                                {teacher.endDate &&
                                  ` - ${new Date(
                                    teacher.endDate
                                  ).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Badge
                              bg={teacher.isCurrent ? "success" : "warning"}
                            >
                              {teacher.isCurrent ? "Current" : "Past"}
                            </Badge>
                            {canEdit && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() =>
                                  handleOpenRemoveTeacherModal(
                                    teacher.assignmentId,
                                    teacher.name
                                  )
                                }
                              >
                                <i className="bi bi-x-lg"></i>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No teachers assigned"
                      subtitle={
                        isActive && canEdit
                          ? "Click the 'Assign Teacher' button to add teachers."
                          : !isActive && canEdit
                          ? "Classroom is inactive. Activate it to assign teachers."
                          : "No teachers are currently assigned."
                      }
                      icon="bi bi-person-x"
                    />
                  )}
                </InfoCard>
              </div>
            </Tab>

            {/* Students Tab - Updated to match Teachers tab UI */}
            <Tab
              eventKey="students"
              title={
                <span>
                  <i className="bi bi-people me-2"></i>
                  Students ({studentCount})
                  {loadingStudents && (
                    <span className="ms-1 spinner-border spinner-border-sm text-primary"></span>
                  )}
                </span>
              }
            >
              <div className="p-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Students in {classroom.name}</h5>
                  {canEdit && (
                    <ButtonGlobal
                      onClick={refreshStudents}
                      className="btn btn-outline-primary btn-sm"
                      disabled={loadingStudents}
                    >
                      <i className={`bi bi-arrow-clockwise ${loadingStudents ? 'spinner-border spinner-border-sm' : ''} me-2`} />
                      Refresh
                    </ButtonGlobal>
                  )}
                </div>

                <InfoCard title="" className="bg-secondary bg-opacity-10">
                  {loadingStudents ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status"></div>
                      <p className="mt-2 text-muted">Loading students...</p>
                    </div>
                  ) : students.length > 0 ? (
                    <div className="list-group list-group-flush">
                      {students.map((student, index) => (
                        <div
                          key={student.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div className="d-flex align-items-center">
                            <i className="bi bi-person-circle me-3 text-success fs-5"></i>
                            <div>
                              <h6 className="mb-0 fw-semibold">{student.fullName}</h6>
                              <p className="mb-1 text-muted small">
                                {student.preferredName && `Preferred: ${student.preferredName}`}
                                {student.preferredName && student.enrollmentId && ' • '}
                                {student.enrollmentId && `ID: ${student.enrollmentId}`}
                              </p>
                              <p className="mb-0 text-muted small">
                                DOB: {student.dateOfBirth ? 
                                  new Date(student.dateOfBirth).toLocaleDateString() : 
                                  'N/A'
                                }
                                {student.enrollmentYear && ` • Enrollment: ${student.enrollmentYear}`}
                              </p>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Badge 
                              bg={
                                student.gender === 'Female' ? 'info' : 
                                student.gender === 'Male' ? 'primary' : 'secondary'
                              }
                              className="fs-7"
                            >
                              {student.gender}
                            </Badge>
                            <Badge 
                              bg={student.isActive ? 'success' : 'secondary'}
                              className="fs-7"
                            >
                              {student.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    
                    </div>
                  ) : (
                    <EmptyState
                      title="No students found"
                      subtitle="There are no students currently enrolled in this classroom."
                      icon="bi bi-person-plus"
                    />
                  )}
                </InfoCard>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>

      {/* Edit Classroom Modal - Centered */}
      <Modal
        show={showEditModal}
        onHide={handleCloseEditModal}
        size="md"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-pencil me-2"></i>
            Edit Classroom
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                Classroom Name <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={editedClassName}
                onChange={(e) => setEditedClassName(e.target.value)}
                placeholder="Enter classroom name"
                disabled={editingClassroom}
                autoFocus
              />
              <Form.Text className="text-muted">
                Current classroom code: <strong>{classroom.code}</strong>
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseEditModal}
            disabled={editingClassroom}
          >
            Cancel
          </Button>
          <ButtonGlobal
            onClick={handleUpdateClassroom}
            className="btn btn-primary"
            disabled={
              !editedClassName.trim() ||
              editedClassName === classroom.name ||
              editingClassroom
            }
          >
            {editingClassroom ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></div>
                Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check2 me-2" />
                Update Classroom
              </>
            )}
          </ButtonGlobal>
        </Modal.Footer>
      </Modal>

      {/* Assign Teacher Modal - Centered */}
      <Modal
        show={showAssignTeacherModal}
        onHide={handleCloseAssignTeacherModal}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-plus me-2"></i>
            Assign Teacher to {classroom.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                Select Teacher <span className="text-danger">*</span>
              </Form.Label>
              <Form.Select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                disabled={loadingTeachers || assigningTeacher}
              >
                <option value="">Choose a teacher...</option>
                {availableTeachers.map((teacher) => (
                  <option key={teacher.user_id} value={teacher.user_id}>
                    {teacher.name} - {teacher.email}
                  </option>
                ))}
              </Form.Select>
              {loadingTeachers && (
                <div className="mt-2">
                  <div
                    className="spinner-border spinner-border-sm text-primary me-2"
                    role="status"
                  ></div>
                  <small className="text-muted">
                    Loading available teachers...
                  </small>
                </div>
              )}
              {!loadingTeachers && availableTeachers.length === 0 && (
                <div className="mt-2">
                  <small className="text-warning">
                    No available teachers found.
                  </small>
                </div>
              )}
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Assignment Date <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="date"
                    value={assignmentDate}
                    onChange={(e) => setAssignmentDate(e.target.value)}
                    disabled={assigningTeacher}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date (Optional)</Form.Label>
                  <Form.Control
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    disabled={assigningTeacher}
                  />
                  <Form.Text className="text-muted">
                    Leave empty for ongoing assignment
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Notes (Optional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this assignment..."
                disabled={assigningTeacher}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleCloseAssignTeacherModal}
            disabled={assigningTeacher}
          >
            Cancel
          </Button>
          <ButtonGlobal
            onClick={handleAssignTeacher}
            className="btn btn-primary"
            disabled={!selectedTeacher || !assignmentDate || assigningTeacher}
          >
            {assigningTeacher ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></div>
                Assigning...
              </>
            ) : (
              <>
                <i className="bi bi-check2 me-2" />
                Assign Teacher
              </>
            )}
          </ButtonGlobal>
        </Modal.Footer>
      </Modal>

      {/* Remove Teacher Confirmation Modal */}
      <Modal
        show={showRemoveTeacherModal}
        onHide={handleCloseRemoveTeacherModal}
        size="md"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="bi bi-person-dash me-2 text-danger"></i>
            Remove Teacher
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {teacherToRemove && (
            <div className="text-center">
              <div className="mb-4">
                <i className="bi bi-exclamation-triangle text-warning fs-1"></i>
              </div>
              <h5 className="mb-3">
                Are you sure you want to remove this teacher?
              </h5>
              <p className="text-muted">
                You are about to remove{" "}
                <strong>{teacherToRemove.teacherName}</strong> from{" "}
                <strong>{classroom.name}</strong>. This action cannot be undone.
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            variant="secondary"
            onClick={handleCloseRemoveTeacherModal}
            disabled={removingTeacher}
          >
            Cancel
          </Button>
          <ButtonGlobal
            onClick={handleRemoveTeacher}
            className="btn btn-danger"
            disabled={removingTeacher}
          >
            {removingTeacher ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                ></div>
                Removing...
              </>
            ) : (
              <>
                <i className="bi bi-person-x me-2" />
                Remove Teacher
              </>
            )}
          </ButtonGlobal>
        </Modal.Footer>
      </Modal>
    </div>
  );
}