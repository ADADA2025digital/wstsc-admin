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
import Loader from "../../Pages/Loader";
import api from "../../config/axiosConfig.jsx";

const EDITABLE_ROLES = ["admin", "principal", "vice_principal", "volunteer"];

// Date formatting function for DD/MM/YYYY
const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return '—';
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '—';
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '—';
  }
};

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

  // Status toggle loading state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Get user role from localStorage
  const getUserRole = () => {
    try {
      const userData = localStorage.getItem("userData");
      
      if (userData) {
        const parsed = JSON.parse(userData);
        const role = parsed.primary_role?.role_name;
        console.log("🎯 EXTRACTED ROLE:", role);
        return role || "student";
      }
      return "student";
    } catch (error) {
      console.error("Error getting user role:", error);
      return "student";
    }
  };

  const userRole = getUserRole();
  const canEdit = EDITABLE_ROLES.includes(userRole);

  console.log("🔐 PERMISSIONS CHECK:", {
    userRole,
    canEdit,
    isAdmin: userRole === "admin"
  });

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

  // Fetch assigned teachers - CORRECTED VERSION
  const fetchAssignedTeachers = async (classroomClassId) => {
    try {
      console.log(
        "👨‍🏫 START: Fetching assigned teachers for classroom:",
        classroomClassId
      );

      // Use the correct endpoint from your API response
      const response = await api.get(`/classroom-teachers/classroom/${classroomClassId}/teachers`);
      
      console.log("📦 TEACHERS API RESPONSE:", response.data);

      if (response.data && response.data.success) {
        const responseData = response.data.data;
        console.log("📋 FULL RESPONSE DATA:", responseData);

        // Extract teachers from the correct response structure
        const teachersList = responseData.teachers || [];
        console.log("🎯 TEACHERS LIST FROM API:", teachersList);

        const teachers = teachersList.map((assignment) => {
          const teacher = assignment.teacher;
          const teacherData = {
            id: teacher.tid,
            name: teacher.name || teacher.person?.full_name || "Unknown Teacher",
            email: teacher.email,
            assignmentId: assignment.crtid,
            assignmentDate: assignment.crtid_date,
            endDate: assignment.end_date,
            isCurrent: assignment.is_current,
            status: assignment.status,
            // Include additional teacher details
            phone: teacher.phone,
            profilePicture: teacher.photo_url,
            position: teacher.position_display_name,
            rawTeacherData: teacher,
            rawAssignmentData: assignment
          };
          console.log("👤 PROCESSED TEACHER DATA:", teacherData);
          return teacherData;
        });

        console.log("✅ FINAL ASSIGNED TEACHERS LIST:", teachers);
        setAssignedTeachers(teachers);
        
        // Also update the classroom data if needed
        if (responseData.classroom) {
          console.log("🏫 UPDATED CLASSROOM DATA FROM TEACHERS API:", responseData.classroom);
        }
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
      showMessage(
        "danger",
        "Failed to load teachers: " +
          (error.response?.data?.message || error.message)
      );
      setAssignedTeachers([]);
    }
  };

  // Fetch class students using the correct endpoint from your API
  const fetchClassStudents = async (classId) => {
    try {
      setLoadingStudents(true);
      console.log("👨‍🎓 START: Fetching students for class:", classId);
      console.log("🌐 Using endpoint: /class-students/class/", classId);

      // Use the correct endpoint from your API example
      const response = await api.get(`/class-students/class/${classId}`);
      console.log("📦 CLASS STUDENTS API RESPONSE:", response.data);

      if (response.data && response.data.success) {
        const responseData = response.data.data;
        console.log("📋 FULL RESPONSE DATA:", responseData);

        // Extract students from the correct response structure
        const studentsList = responseData.students || [];
        console.log("🎯 STUDENTS LIST FROM API:", studentsList);

        // Map the student data to a more usable format
        const mappedStudents = studentsList.map((enrollment, index) => {
          const student = enrollment.student || {};
          
          return {
            id: enrollment.csid || enrollment.enrid || index,
            csid: enrollment.csid,
            enrid: enrollment.enrid,
            studid: enrollment.studid,
            classId: enrollment.class_id,
            
            // Student personal details
            firstName: student.first_name,
            familyName: student.family_name,
            preferredName: student.preferred_name,
            fullName: student.full_name || `${student.first_name || ''} ${student.family_name || ''}`.trim(),
            
            // Demographic information
            gender: student.gender,
            dateOfBirth: student.date_of_birth,
            
            // Enrollment details
            enrollmentYear: enrollment.enr_year,
            isActive: enrollment.is_active,
            
            // Timestamps
            createdAt: enrollment.created_at,
            updatedAt: enrollment.updated_at,
            
            rawData: enrollment,
            rawStudentData: student
          };
        });

        console.log("✅ MAPPED STUDENTS FOR CLASS:", mappedStudents);
        setStudents(mappedStudents);
        
        // Also update the student count from the API summary if available
        const totalStudents = responseData.summary?.total_students || mappedStudents.length;
        console.log("📊 TOTAL STUDENTS COUNT:", totalStudents);
        
      } else {
        console.error("❌ CLASS STUDENTS API FAILED:", response.data);
        setStudents([]);
      }
    } catch (error) {
      console.error("💥 ERROR fetching class students:", error);
      console.error("Error response:", error.response?.data);
      showMessage(
        "danger",
        "Failed to load students: " +
          (error.response?.data?.message || error.message)
      );
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Fetch available teachers
  const fetchAvailableTeachers = async () => {
    try {
      setLoadingTeachers(true);
      console.log("🔍 ========== FETCH AVAILABLE TEACHERS DEBUG START ==========");
      console.log("🔍 START: Fetching available teachers from API");
      console.log("🌐 API Endpoint: /classroom-teachers/available-teachers");

      const response = await api.get("/classroom-teachers/available-teachers");
      
      console.log("📦 AVAILABLE TEACHERS API RESPONSE:", response);
      console.log("📊 Response Status:", response.status);
      console.log("📋 Response Data:", response.data);

      if (response.data && response.data.success) {
        const teachers = response.data.data.teachers || [];
        console.log("✅ RAW AVAILABLE TEACHERS LIST FROM API:", teachers);
        console.log("📊 Number of teachers received:", teachers.length);
        
        // Log each teacher's structure for debugging
        console.log("👥 DETAILED TEACHER STRUCTURES:");
        teachers.forEach((teacher, index) => {
          console.log(`👤 Teacher ${index + 1}:`, {
            uid: teacher.uid,
            user_id: teacher.user_id,
            tid: teacher.tid,
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone,
            profile_picture: teacher.profile_picture,
            photo_url: teacher.photo_url,
            role: teacher.role,
            person: teacher.person
          });
        });
        
        // Map the API response to match your frontend expectations
        const mappedTeachers = teachers.map(teacher => {
          // Try different possible ID fields - PRIORITIZE tid since that's what's used in assignments
          const teacherId = teacher.tid || teacher.user_id || teacher.uid;
          console.log(`🆔 Teacher ${teacher.name}: tid=${teacher.tid}, user_id=${teacher.user_id}, uid=${teacher.uid}, using=${teacherId}`);
          
          return {
            user_id: teacherId,
            tid: teacher.tid,
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone,
            profile_picture: teacher.profile_picture,
            photo_url: teacher.photo_url,
            role: teacher.role,
            person: teacher.person
          };
        });
        
        console.log("🗺️ MAPPED AVAILABLE TEACHERS LIST:", mappedTeachers);
        console.log("📊 Number of mapped teachers:", mappedTeachers.length);
        
        setAvailableTeachers(mappedTeachers);
        console.log("✅ Available teachers state updated successfully");
      } else {
        console.error("❌ AVAILABLE TEACHERS API FAILED - Response not successful:", response.data);
        console.error("❌ Response success flag:", response.data?.success);
        console.error("❌ Response message:", response.data?.message);
        showMessage("danger", "Failed to load available teachers");
        setAvailableTeachers([]);
      }
    } catch (error) {
      console.error("💥 ERROR fetching available teachers:", error);
      console.error("🚨 Error name:", error.name);
      console.error("🚨 Error message:", error.message);
      console.error("🚨 Error code:", error.code);
      console.error("🚨 Error response:", error.response);
      console.error("🚨 Error response data:", error.response?.data);
      console.error("🚨 Error response status:", error.response?.status);
      
      showMessage(
        "danger",
        "Failed to load available teachers: " +
          (error.response?.data?.message || error.message)
      );
      setAvailableTeachers([]);
    } finally {
      setLoadingTeachers(false);
      console.log("⏳ Loading teachers state set to false");
      console.log("🔚 ========== FETCH AVAILABLE TEACHERS DEBUG END ==========");
    }
  };

  // Toggle classroom status using PATCH method
  const toggleClassroomStatus = async () => {
    if (!classroom?.id || !canEdit) {
      console.log("🚫 CANNOT TOGGLE: Missing classroom ID or edit permissions", {
        classroomId: classroom?.id,
        canEdit,
        userRole
      });
      showMessage("warning", "You don't have permission to update classroom status");
      return;
    }

    console.log("🔄 ========== TOGGLE CLASSROOM STATUS DEBUG START ==========");
    console.log("🎯 TOGGLE STATUS INITIATED for Classroom:", {
      classroomId: classroom.id,
      classroomName: classroom.name,
      currentStatus: classroom.isActive,
      currentStatusText: classroom.status,
      expectedNewStatus: !classroom.isActive
    });

    setUpdatingStatus(true);
    
    try {
      console.log("🚀 SENDING PATCH REQUEST to:", `/classrooms/${classroom.id}/toggle-status`);

      const response = await api.put(
        `/classrooms/${classroom.id}/toggle-status`,
        {}
      );
      
      console.log("📦 TOGGLE STATUS API RESPONSE:", response.data);

      if (response.data && response.data.success) {
        console.log("✅ TOGGLE STATUS SUCCESSFUL");
        
        // Extract data from response
        const updatedClassroom = response.data.data.classroom;
        const previousStatus = response.data.data.previous_status;
        const newStatus = response.data.data.new_status;
        const statusText = response.data.data.status_text;
        
        console.log("🔄 STATUS CHANGE DETAILS:", {
          previousStatus,
          newStatus,
          statusText,
          previousStatusText: previousStatus ? 'Active' : 'Inactive',
          newStatusText: newStatus ? 'Active' : 'Inactive',
          updatedClassroomData: updatedClassroom
        });

        // Update the classroom state with the exact data from API response
        const updated = {
          ...classroom,
          status: statusText || (updatedClassroom.is_active ? "Active" : "Inactive"),
          isActive: updatedClassroom.is_active,
          name: updatedClassroom.class_name,
          classId: updatedClassroom.class_id,
          rawData: updatedClassroom,
        };
        
        console.log("🗂️ UPDATED CLASSROOM STATE:", updated);
        setClassroom(updated);
        
        showMessage("success", response.data.message || "Classroom status updated successfully");
        console.log("🎉 STATUS TOGGLE COMPLETED SUCCESSFULLY");
        
      } else {
        console.error("❌ TOGGLE STATUS API FAILED - Response not successful");
        throw new Error(response.data?.message || "API response indicated failure");
      }
      
    } catch (error) {
      console.error("💥 TOGGLE STATUS FAILED - ERROR CAUGHT:");
      console.error("🚨 ERROR OBJECT:", error);
      
      let errorMessage = "Failed to update classroom status";
      
      if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to update classroom status.";
      } else if (error.response?.status === 404) {
        errorMessage = "Classroom not found. It may have been deleted.";
      } else if (error.response?.status === 405) {
        errorMessage = "PATCH method not allowed for this endpoint.";
      } else if (error.code === 'ERR_NETWORK') {
        errorMessage = "Network error. Please check your connection.";
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Please try again.";
      } else {
        errorMessage = error.response?.data?.message || error.message || "Failed to update classroom status";
      }
      
      showMessage("danger", errorMessage);
      
    } finally {
      setUpdatingStatus(false);
      console.log("🔚 ========== TOGGLE CLASSROOM STATUS DEBUG END ==========");
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
    console.log("👥 AVAILABLE TEACHERS STATE UPDATED:", availableTeachers);
  }, [availableTeachers]);

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

  // Update classroom name
  const handleUpdateClassroom = async () => {
    if (!canEdit || !editedClassName.trim() || !classroom?.id) return;

    console.log("📤 UPDATING CLASSROOM - Payload:", {
      classroom_id: classroom.id,
      class_name: editedClassName.trim(),
    });

    setEditingClassroom(true);
    try {
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
    console.log("🔐 User can edit:", canEdit);
    console.log("🏫 Current classroom:", classroom);
    
    setShowAssignTeacherModal(true);
    setSelectedTeacher("");
    setAssignmentDate(new Date().toISOString().split("T")[0]);
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
    setEndDate(oneYearFromNow.toISOString().split("T")[0]);
    setNotes("");
    
    console.log("🔄 Calling fetchAvailableTeachers...");
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
    
    console.log("🔍 ========== ASSIGN TEACHER DEBUG START ==========");
    console.log("📤 ASSIGNING TEACHER - Debug Info:", {
      canEdit,
      selectedTeacher,
      teacherId,
      assignmentDate,
      endDate,
      notes,
      classroomClassId: classroom.classId,
      availableTeachersCount: availableTeachers.length,
      availableTeachers: availableTeachers.map(t => ({ id: t.user_id, name: t.name, email: t.email }))
    });

    // Find the selected teacher in availableTeachers for debugging
    const selectedTeacherData = availableTeachers.find(t => t.user_id === teacherId);
    console.log("👤 SELECTED TEACHER DATA:", selectedTeacherData);

    setAssigningTeacher(true);
    try {
      // CORRECTED PAYLOAD - Try using tid if available, otherwise use user_id
      const teacherIdToUse = selectedTeacherData?.tid || teacherId;
      
      const payload = {
        class_id: classroom.classId,
        teacher_id: teacherIdToUse,
        crtid_date: assignmentDate,
        end_date: endDate || null,
        notes: notes || "",
      };
      
      console.log("🚀 SENDING POST REQUEST to /classroom-teachers");
      console.log("📦 CORRECTED PAYLOAD:", JSON.stringify(payload, null, 2));
      console.log("🔑 Teacher ID being used:", teacherIdToUse);
      
      const response = await api.post("/classroom-teachers", payload);
      console.log("✅ ASSIGN TEACHER API SUCCESS RESPONSE:", response.data);

      if (response.data.success) {
        console.log("🎉 Teacher assignment successful!");
        showMessage("success", "Teacher assigned successfully");
        console.log("🔄 Refetching assigned teachers after assignment");
        await fetchAssignedTeachers(classroom.classId);
        handleCloseAssignTeacherModal();
      } else {
        console.error("❌ ASSIGN TEACHER API FAILED - Response not successful");
        console.error("Response data:", response.data);
        throw new Error(response.data.message || "Failed to assign teacher");
      }
    } catch (error) {
      console.error("💥 ERROR assigning teacher:", error);
      
      if (error.response?.data?.errors) {
        const errorMessages = Object.values(error.response.data.errors).flat();
        const fullErrorMessage = errorMessages.join(", ");
        console.error("📝 FINAL ERROR MESSAGE TO USER:", fullErrorMessage);
        showMessage("danger", fullErrorMessage);
      } else {
        const errorMsg = error.response?.data?.message || error.message || "Failed to assign teacher";
        console.error("📝 FINAL ERROR MESSAGE TO USER:", errorMsg);
        showMessage("danger", errorMsg);
      }
    } finally {
      setAssigningTeacher(false);
      console.log("🔚 ========== ASSIGN TEACHER DEBUG END ==========");
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
      // Use crtid instead of assignment_id
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
    return <Loader />;
  }

  if (error) {
    console.log("❌ RENDERING ERROR STATE:", error);
    return (
      <div className="container-fluid px-md-4 px-0 py-3">
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
      <div className="container-fluid px-md-4 px-0 py-3">
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

  // Get student count from API summary or fallback to array length
  const studentCount = classroom.rawData?.summary?.total_students || students.length;
  const teacherCount = assignedTeachers.length;
  const isActive = classroom.isActive;

  console.log("🎯 RENDERING CLASSROOM DETAILS:", {
    classroom,
    studentCount,
    teacherCount,
    isActive,
    canEdit,
    userRole,
    availableTeachersCount: availableTeachers.length
  });

  return (
    <div className="container-fluid px-md-4 px-0 py-3">
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
      <div className="content-header d-flex flex-md-row flex-column justify-content-start justify-content-md-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Classroom Details</h4>
          <p className="text-muted mb-0">
            Viewing: <strong>{classroom.name}</strong>
            <span className="mx-2">•</span>
            <span className="text-monospace">{classroom.code}</span>
          </p>
        </div>

        <div className="d-flex flex-md-row flex-column align-items-center gap-3 mt-3 mt-md-0">
          {/* Buttons Section */}
          <div className="d-flex align-items-center gap-2">
            <ButtonGlobal
              onClick={handleBack}
              className="btn btn-outline-secondary"
            >
              <i className="bi bi-arrow-left me-2" />
              Back to List
            </ButtonGlobal>

            {/* Edit Button - ONLY FOR ADMINS */}
            {canEdit && (
              <ButtonGlobal
                onClick={handleOpenEditModal}
                className="btn custom-btn"
              >
                <i className="bi bi-pencil me-2" />
                Edit Classroom
              </ButtonGlobal>
            )}
          </div>
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

            {/* Status toggle in card header - ONLY FOR ADMINS */}
            {canEdit && (
              <div className="d-flex align-items-center gap-2">
                <Form.Check
                  type="switch"
                  id="status-toggle"
                  label={<span className="fw-medium">{classroom.status}</span>}
                  checked={isActive}
                  onChange={toggleClassroomStatus}
                  disabled={updatingStatus}
                  className="mb-0"
                />
                {updatingStatus && (
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                )}
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
                                    {formatDateToDDMMYYYY(teacher.assignmentDate)}
                                    {teacher.endDate &&
                                      ` - ${formatDateToDDMMYYYY(teacher.endDate)}`}
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
                              ? "Go to the Teachers tab to assign teachers to this classroom."
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
                  className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3"
                >
                  <h5 className="mb-0">
                    Teachers Assigned to {classroom.name}
                  </h5>

                  {/* Assign Teacher Button - MOVED TO TEACHERS TAB */}
                  {canEdit && (
                    <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
                      {/* Conditionally show Assign Teacher button or inactive message */}
                      {classroom.isActive ? (
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
                    </div>
                  )}
                </div>

                <InfoCard title="" className="bg-secondary bg-opacity-10">
                  {assignedTeachers.length ? (
                    <div 
                      className="list-group list-group-flush scrollable-container"
                    >
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
                                {formatDateToDDMMYYYY(teacher.assignmentDate)}
                                {teacher.endDate &&
                                  ` - ${formatDateToDDMMYYYY(teacher.endDate)}`}
                              </p>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Badge
                              bg={teacher.isCurrent ? "success" : "warning"}
                            >
                              {teacher.isCurrent ? "Current" : "Past"}
                            </Badge>
                            {/* Remove teacher button - ONLY FOR ADMINS */}
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

            {/* Students Tab */}
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
                  {/* Refresh button - ONLY FOR ADMINS */}
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
                    <div 
                      className="list-group list-group-flush scrollable-container"
                    >
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
                                {student.preferredName && student.studid && ' • '}
                                {student.studid && `ID: ${student.studid}`}
                              </p>
                              <p className="mb-0 text-muted small">
                                DOB: {student.dateOfBirth ? 
                                  formatDateToDDMMYYYY(student.dateOfBirth) : 
                                  'N/A'
                                }
                                {student.enrollmentYear && ` • Enrollment: ${student.enrollmentYear}`}
                              </p>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Badge 
                              bg={
                                student.gender === 'female' ? 'info' : 
                                student.gender === 'male' ? 'primary' : 'secondary'
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
        <Modal.Footer className="d-flex justify-content-between">
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
                onChange={(e) => {
                  console.log("🎯 Teacher selected:", e.target.value);
                  setSelectedTeacher(e.target.value);
                }}
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
              {!loadingTeachers && availableTeachers.length > 0 && (
                <div className="mt-2">
                  <small className="text-success">
                    Found {availableTeachers.length} available teacher(s)
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
        <Modal.Footer className="d-flex justify-content-between">
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

      {/* Add CSS for scrollable container */}
      <style>
        {`
          .scrollable-container {
            max-height: calc(3 * 80px); /* Show exactly 3 items (approx 80px each) */
            overflow-y: auto;
            border: 1px solid #e9ecef;
            border-radius: 0.375rem;
          }
          
          .scrollable-container::-webkit-scrollbar {
            width: 6px;
          }
          
          .scrollable-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }
          
          .scrollable-container::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 3px;
          }
          
          .scrollable-container::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8;
          }
          
          /* Ensure list group items have consistent height */
          .list-group-item {
            min-height: 80px;
            display: flex;
            align-items: center;
          }
        `}
      </style>
    </div>
  );
}