import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Row, Col, Tab, Tabs, Modal, Button } from "react-bootstrap";
import ButtonGlobal from "../../Components/Button";
import InfoCard from "../../Components/InfoCard";
import { formatDateToMMDDYYYY } from "../../config/utils";
import api from "../../config/axiosConfig";
import Loader from "../../Pages/Loader";
import emailjs from '@emailjs/browser';

// Email.js configuration
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_1gocmzl',
  TEMPLATE_ID: 'template_dpzhb0s',
  REJECTION_TEMPLATE_ID: 'template_1ka5bgl',
  PUBLIC_KEY: 'Ro7uPiRIt-owJl0Nn',
};

// Initialize Email.js
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

// Enhanced date formatting function for DD/MM/YYYY
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

// Enhanced parent name extraction
const getParentName = (parentData) => {
  if (!parentData) return 'Parent/Guardian';
  
  // Try different name combinations
  const firstName = parentData.first_name || parentData.given_name || '';
  const lastName = parentData.last_name || parentData.family_name || '';
  
  const fullName = (firstName + ' ' + lastName).trim();
  
  if (fullName) return fullName;
  
  // Fallback to title + relationship
  const title = parentData.title || '';
  const relationship = parentData.relationship_to_student || '';
  
  if (title && relationship) return `${title} (${relationship})`;
  if (title) return title;
  if (relationship) return relationship;
  
  return 'Parent/Guardian';
};

// Debug EmailJS setup
const debugEmailJSSetup = async () => {
  console.log('🔧 EmailJS Configuration Debug:', {
    serviceId: EMAILJS_CONFIG.SERVICE_ID,
    rejectionTemplateId: EMAILJS_CONFIG.REJECTION_TEMPLATE_ID,
    publicKey: EMAILJS_CONFIG.PUBLIC_KEY?.substring(0, 10) + '...',
  });

  // Test if the template exists by making a simple call
  try {
    const testParams = {
      to_email: 'test@example.com',
      student_name: 'Test Student',
      enrolment_id: 'TEST123',
      rejection_reason: 'Test reason',
      parent_name: 'Test Parent',
      from_name: 'WSTSC Administration',
    };

    console.log('🧪 Testing EmailJS template with params:', testParams);
    
    const testResponse = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.REJECTION_TEMPLATE_ID,
      testParams
    );
    
    console.log('✅ Template test successful:', testResponse);
    return { success: true, response: testResponse };
  } catch (testError) {
    console.error('❌ Template test failed:', {
      status: testError.status,
      text: testError.text,
      details: testError
    });
    return { success: false, error: testError };
  }
};

// Enhanced Email sending function with professional formatting
const sendAcceptanceEmail = async (studentData) => {
  try {
    // Extract email and names from the normalized structure
    const parentEmail = studentData.parent_carer_1?.email;
    const studentName = `${studentData.student.first_given_name} ${studentData.student.family_name}`;
    
    const parentName = getParentName(studentData.parent_carer_1);

    const templateParams = {
      to_email: parentEmail,
      student_name: studentName,
      enrolment_id: studentData.student.enrollment_id || 'N/A',
      enrolment_date: formatDateToDDMMYYYY(studentData.student.enrolment_date) || 'N/A',
      class_name: studentData.student.classroom_info?.class_name || studentData.student.enrol_class_in_WSTSC || 'To be assigned',
      approved_date: new Date().toLocaleDateString('en-AU', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      parent_name: parentName,
      current_year: new Date().getFullYear(),
    };

    console.log('📧 Sending professional acceptance email with params:', templateParams);

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Professional acceptance email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending professional acceptance email:', error);
    return { success: false, error };
  }
};

// Helper function for template switching
const sendRejectionEmailWithTemplate = async (studentData, rejectionReason, templateId) => {
  try {
    const parentEmail = studentData.parent_carer_1?.email;
    const studentName = `${studentData.student.first_given_name} ${studentData.student.family_name}`;
    const parentName = getParentName(studentData.parent_carer_1);

    const templateParams = {
      to_email: parentEmail,
      student_name: studentName,
      enrolment_id: studentData.student.enrollment_id || 'N/A',
      enrolment_date: formatDateToDDMMYYYY(studentData.student.enrolment_date) || 'N/A',
      rejection_date: new Date().toLocaleDateString('en-AU', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      rejection_reason: rejectionReason,
      parent_name: parentName,
      current_year: new Date().getFullYear(),
      from_name: 'WSTSC Administration',
    };

    console.log(`🔧 Attempting to send with template: ${templateId}`, templateParams);

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      templateId,
      templateParams
    );

    return { success: true, response };
  } catch (error) {
    console.error(`❌ Failed with template ${templateId}:`, error);
    return { success: false, error };
  }
};

// Enhanced Rejection Email sending function with professional formatting
const sendRejectionEmail = async (studentData, rejectionReason) => {
  try {
    // Extract email and names from the normalized structure
    const parentEmail = studentData.parent_carer_1?.email;
    const studentName = `${studentData.student.first_given_name} ${studentData.student.family_name}`;
    
    const parentName = getParentName(studentData.parent_carer_1);

    // Validate required fields
    if (!parentEmail) {
      throw new Error('No parent email available');
    }

    if (!EMAILJS_CONFIG.REJECTION_TEMPLATE_ID) {
      throw new Error('Rejection template ID not properly configured');
    }

    // Create template parameters - match EXACTLY what's in your EmailJS template
    const templateParams = {
      to_email: parentEmail,
      student_name: studentName,
      enrolment_id: studentData.student.enrollment_id || 'N/A',
      enrolment_date: formatDateToDDMMYYYY(studentData.student.enrolment_date) || 'N/A',
      rejection_date: new Date().toLocaleDateString('en-AU', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      rejection_reason: rejectionReason,
      parent_name: parentName,
      current_year: new Date().getFullYear(),
      from_name: 'WSTSC Administration',
    };

    console.log('📧 Sending professional rejection email with params:', templateParams);
    console.log('🔧 Using rejection template ID:', EMAILJS_CONFIG.REJECTION_TEMPLATE_ID);

    const response = await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.REJECTION_TEMPLATE_ID,
      templateParams
    );

    console.log('✅ Professional rejection email sent successfully:', response);
    return { success: true, response };
  } catch (error) {
    console.error('❌ Error sending professional rejection email:', error);
    
    // Enhanced error logging
    console.error('🔍 EmailJS Error Analysis:', {
      status: error.status,
      text: error.text,
      serviceId: EMAILJS_CONFIG.SERVICE_ID,
      templateId: EMAILJS_CONFIG.REJECTION_TEMPLATE_ID,
      publicKey: EMAILJS_CONFIG.PUBLIC_KEY?.substring(0, 10) + '...',
      parentEmail: studentData.parent_carer_1?.email,
      hasTemplateId: !!EMAILJS_CONFIG.REJECTION_TEMPLATE_ID
    });
    
    return { 
      success: false, 
      error: {
        message: error.text || error.message,
        status: error.status,
        details: `Service: ${EMAILJS_CONFIG.SERVICE_ID}, Template: ${EMAILJS_CONFIG.REJECTION_TEMPLATE_ID}`
      }
    };
  }
};

const EnrolmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("parents");
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null);
  const [rejectionEmailStatus, setRejectionEmailStatus] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [classroomLoading, setClassroomLoading] = useState(false);

  // Rejection modal states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");

  // Debug EmailJS configuration on component mount
  useEffect(() => {
    console.log('🔧 EmailJS Configuration Debug:', {
      serviceId: EMAILJS_CONFIG.SERVICE_ID,
      acceptanceTemplateId: EMAILJS_CONFIG.TEMPLATE_ID,
      rejectionTemplateId: EMAILJS_CONFIG.REJECTION_TEMPLATE_ID,
      publicKey: EMAILJS_CONFIG.PUBLIC_KEY,
      isRejectionTemplateConfigured: EMAILJS_CONFIG.REJECTION_TEMPLATE_ID !== 'template_rejection'
    });

    // Run debug test
    debugEmailJSSetup().then(result => {
      if (!result.success) {
        console.warn('⚠️ EmailJS template test failed. Rejection emails may not work.');
      }
    });
  }, []);

  // Get user role from localStorage on component mount
  useEffect(() => {
    const getUserRole = () => {
      try {
        const userData = localStorage.getItem("userData");
        if (userData) {
          const parsedUserData = JSON.parse(userData);

          // Check multiple possible locations for role
          let role;
          if (parsedUserData.primary_role?.role_name) {
            role = parsedUserData.primary_role.role_name;
          } else if (parsedUserData.role?.role_name) {
            role = parsedUserData.role.role_name;
          } else if (parsedUserData.role_name) {
            role = parsedUserData.role_name;
          } else {
            role = "parent"; // default fallback
          }

          console.log("👤 User role detected:", role);
          setUserRole(role);
        } else {
          console.warn("⚠️ No user data found in localStorage, defaulting to parent role");
          setUserRole("parent");
        }
      } catch (error) {
        console.error("❌ Error parsing user data from localStorage:", error);
        setUserRole("parent");
      }
    };

    getUserRole();
  }, []);

  // Fetch classrooms list
  const fetchClassrooms = async () => {
    try {
      setClassroomLoading(true);
      console.log("🏫 Fetching classrooms list...");
      
      const response = await api.get("/classrooms");
      console.log("✅ Classrooms API response:", response);
      
      if (response.data.success) {
        const classroomsData = response.data.data.classrooms || response.data.data;
        console.log("📚 Classrooms list:", classroomsData);
        setClassrooms(classroomsData);
      } else {
        console.warn("⚠️ Failed to fetch classrooms:", response.data.message);
      }
    } catch (err) {
      console.error("❌ Error fetching classrooms:", err);
    } finally {
      setClassroomLoading(false);
    }
  };

  // Enhanced normalizeStudentData function with classroom mapping
  const normalizeStudentData = (rawData, classroomsList = []) => {
    console.log("🔄 Normalizing data structure - RAW DATA:", rawData);
    console.log("📚 Available classrooms:", classroomsList);
    
    // Debug classroom information specifically
    console.log("🏫 Classroom data debug:", {
      com_school_enr_grade: rawData.com_school_enr_grade,
      enrol_class_in_WSTSC: rawData.enrol_class_in_WSTSC,
      classroom: rawData.classroom,
      classroom_info: rawData.classroom_info,
    });

    // Find classroom name from classrooms list
    let classroomInfo = null;
    const classroomId = rawData.com_school_enr_grade || rawData.enrol_class_in_WSTSC;
    
    if (classroomId && classroomsList.length > 0) {
      const foundClassroom = classroomsList.find(
        classroom => classroom.class_id === classroomId || classroom.class_code === classroomId
      );
      
      if (foundClassroom) {
        classroomInfo = {
          class_id: foundClassroom.class_id,
          class_name: foundClassroom.class_name || foundClassroom.name || `Class ${classroomId}`,
          class_code: foundClassroom.class_code,
        };
        console.log("🎯 Found classroom:", classroomInfo);
      } else {
        console.warn("⚠️ Classroom not found for ID:", classroomId);
        classroomInfo = {
          class_id: classroomId,
          class_name: `Class ${classroomId}`,
        };
      }
    } else if (classroomId) {
      // If we have classroom ID but no classrooms list yet
      classroomInfo = {
        class_id: classroomId,
        class_name: `Class ${classroomId}`,
      };
      console.log("🎯 Using classroom ID directly:", classroomInfo);
    } else {
      classroomInfo = {
        class_id: null,
        class_name: "Not assigned",
      };
      console.log("⚠️ No classroom data found");
    }

    // If data already has the expected nested structure, return as-is
    if (rawData.student && rawData.parent_carer_1) {
      console.log("✅ Data already in expected structure");
      return rawData;
    }

    // Handle medical details - multiple possible structures
    let medicalDetails = null;

    if (rawData.medical_details) {
      // If medical_details is an object with the expected properties
      if (typeof rawData.medical_details === "object") {
        medicalDetails = {
          asthma: rawData.medical_details.asthma || "No",
          major_illness: rawData.medical_details.major_illness || "No",
          allergies: rawData.medical_details.allergies || "No",
          special_learning_needs: rawData.medical_details.special_learning_needs || "No",
          special_learning_needs_details: rawData.medical_details.special_learning_needs_details || null,
        };
      }
    } else {
      // If medical details are flat on the main object
      medicalDetails = {
        asthma: rawData.asthma || "No",
        major_illness: rawData.major_illness || "No",
        allergies: rawData.allergies || "No",
        special_learning_needs: rawData.special_learning_needs || "No",
        special_learning_needs_details: rawData.special_learning_needs_details || null,
      };
    }

    const normalizedData = {
      student: {
        enrollment_id: rawData.enrollment_id || rawData.enrid,
        family_name: rawData.family_name || rawData.student_family_name,
        first_given_name: rawData.first_given_name || rawData.student_first__name,
        preferred_first_name: rawData.preferred_first_name || rawData.student_preferred_name,
        gender: rawData.gender || rawData.student_gender,
        date_of_birth: rawData.date_of_birth || rawData.student_dob,
        phone_number: rawData.phone_number,
        mainstream_school_name: rawData.mainstream_school_name || rawData.mainstream_school,
        enrolment_date: rawData.enrolment_date || rawData.student_enrolment_date,
        mainstream_enrollment_year: rawData.mainstream_enrollment_year || rawData.mainstream_grade,
        enrol_class_in_WSTSC: rawData.enrol_class_in_WSTSC || rawData.com_school_enr_grade,
        classroom_info: classroomInfo,
        status: rawData.status || rawData.student_status,
        submitted_by: rawData.submitter?.name || "System",
        submitted_at: rawData.submitted_at,
        approved_by: rawData.approved_by || rawData.approver?.name,
        approved_at: rawData.approved_at,
        rejected_by: rawData.rejected_by || rawData.rejecter?.name,
        rejected_at: rawData.rejected_at,
        rejection_reason: rawData.rejection_reason,
      },
      // Use first parent from parent_carers array
      parent_carer_1: rawData.parent_carers?.[0] || null,
      medical_details: medicalDetails,
      // Use first emergency contact from array
      first_emergency_contact: rawData.emergency_contacts?.[0] || null,
      personal_declaration: rawData.personal_declaration || null,
    };

    console.log("📊 FINAL NORMALIZED DATA - Classroom info:", normalizedData.student.classroom_info);
    console.log("👨‍👩‍👧‍👦 Parent data:", normalizedData.parent_carer_1);
    return normalizedData;
  };

  useEffect(() => {
    console.log("useEffect triggered - Checking for student data");

    const initializeData = async () => {
      // First fetch classrooms
      await fetchClassrooms();

      if (location.state?.studentData) {
        console.log("📥 Using student data from location state:", location.state.studentData);
        const normalizedData = normalizeStudentData(location.state.studentData, classrooms);
        setStudentData(normalizedData);
        setLoading(false);
      } else {
        console.log("🔄 No student data in location state, fetching from API");
        fetchStudentDetails();
      }
    };

    initializeData();
  }, [id, location.state, userRole]);

  const fetchStudentDetails = async () => {
    // Wait for userRole to be set
    if (!userRole) {
      console.log("⏳ Waiting for user role to be determined...");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`🔍 Fetching student details for ID: ${id} as ${userRole}`);

      let endpoint;

      // Determine API endpoint based on user role
      if (userRole === "admin") {
        endpoint = `/admin/enrollments/${id}`;
        console.log("🎯 Using admin endpoint:", endpoint);
      } else {
        // For parent, teacher, or any other role
        endpoint = `/my-enrollments/${id}`;
        console.log("🎯 Using parent/teacher endpoint:", endpoint);
      }

      const response = await api.get(endpoint);
      console.log("✅ FULL API Response:", response);

      if (response.data.success) {
        // Map the API response to match your expected structure
        const apiData = response.data.data.enrollment || response.data.data;
        console.log("🎯 Raw API Data for normalization:", apiData);

        const normalizedData = normalizeStudentData(apiData, classrooms);
        console.log("📊 Final normalized data to set state:", normalizedData);
        setStudentData(normalizedData);
      } else {
        throw new Error(response.data.message || "Failed to fetch student details");
      }
    } catch (err) {
      console.error("❌ Error fetching student details:", err);
      setError("Failed to fetch student details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update student data when classrooms are loaded
  useEffect(() => {
    if (studentData && classrooms.length > 0) {
      console.log("🔄 Updating student data with classrooms info");
      const updatedData = normalizeStudentData(
        location.state?.studentData || studentData, 
        classrooms
      );
      setStudentData(updatedData);
    }
  }, [classrooms]);

  const handleBack = () => navigate("/enrolments");

  // Function to handle acceptance email sending
  const sendAcceptanceEmailToParent = async () => {
    try {
      setEmailStatus('sending');
      
      if (!studentData?.parent_carer_1?.email) {
        console.warn("⚠️ No parent email found, skipping email notification");
        setEmailStatus('no_email');
        setTimeout(() => setEmailStatus(null), 3000);
        return { success: false, error: 'No parent email' };
      }

      console.log("📧 Preparing to send acceptance email to:", studentData.parent_carer_1.email);

      // Debug parent data structure
      console.log('🔍 Debug parent data structure:', {
        parent_carer_1: studentData.parent_carer_1,
        firstName: studentData.parent_carer_1?.first_name,
        lastName: studentData.parent_carer_1?.last_name,
        calculatedName: getParentName(studentData.parent_carer_1)
      });

      const emailResult = await sendAcceptanceEmail(studentData);

      if (emailResult.success) {
        console.log("✅ Acceptance email sent successfully to parent");
        setEmailStatus('sent');
        setTimeout(() => setEmailStatus(null), 5000);
        return { success: true };
      } else {
        console.warn("⚠️ Failed to send acceptance email:", emailResult.error);
        setEmailStatus('failed');
        setTimeout(() => setEmailStatus(null), 5000);
        return { success: false, error: emailResult.error };
      }
    } catch (emailError) {
      console.error("❌ Error in email sending process:", emailError);
      setEmailStatus('failed');
      setTimeout(() => setEmailStatus(null), 5000);
      return { success: false, error: emailError.message };
    }
  };

  // Function to handle rejection email sending with fallback
  const sendRejectionEmailToParent = async (rejectionReason) => {
    try {
      setRejectionEmailStatus('sending');
      
      if (!studentData?.parent_carer_1?.email) {
        console.warn("⚠️ No parent email found, skipping rejection notification");
        setRejectionEmailStatus('no_email');
        setTimeout(() => setRejectionEmailStatus(null), 3000);
        return { success: false, error: 'No parent email' };
      }

      console.log("📧 Preparing to send rejection email to:", studentData.parent_carer_1.email);

      // Try primary template first
      const emailResult = await sendRejectionEmail(studentData, rejectionReason);
      
      // If primary template fails, try alternative approach
      if (!emailResult.success) {
        console.warn('🔄 Primary template failed, trying simplified approach...');
        
        // Try with minimal parameters
        const simplifiedResult = await sendRejectionEmailWithTemplate(
          studentData, 
          rejectionReason, 
          EMAILJS_CONFIG.REJECTION_TEMPLATE_ID
        );
        
        if (simplifiedResult.success) {
          console.log("✅ Rejection email sent successfully with simplified approach");
          setRejectionEmailStatus('sent');
          setTimeout(() => setRejectionEmailStatus(null), 5000);
          return { success: true };
        }
      }

      if (emailResult.success) {
        console.log("✅ Rejection email sent successfully to parent");
        setRejectionEmailStatus('sent');
        setTimeout(() => setRejectionEmailStatus(null), 5000);
        return { success: true };
      } else {
        console.warn("⚠️ Failed to send rejection email:", emailResult.error);
        
        let errorMessage = "Failed to send rejection email";
        if (emailResult.error?.status === 400) {
          errorMessage = "Rejection email template configuration issue. Please check EmailJS template settings.";
        } else if (emailResult.error?.message) {
          errorMessage = emailResult.error.message;
        }
        
        setRejectionEmailStatus('failed');
        setTimeout(() => setRejectionEmailStatus(null), 5000);
        return { success: false, error: errorMessage };
      }
    } catch (emailError) {
      console.error("❌ Error in rejection email sending process:", emailError);
      setRejectionEmailStatus('failed');
      setTimeout(() => setRejectionEmailStatus(null), 5000);
      return { success: false, error: emailError.message };
    }
  };

  const handleAcceptEnrolment = async () => {
    if (!id) {
      console.error("❌ No enrolment ID found for acceptance");
      return;
    }

    console.log("✅ Attempting to accept enrolment ID:", id);
    console.log("Current student status:", studentData?.student?.status);

    try {
      setAcceptLoading(true);
      setError(null);
      console.log("🔄 Starting accept enrolment API call...");

      const endpoint = `/admin/enrollments/${id}/approve`;
      console.log("🎯 Using approval endpoint:", endpoint);

      const response = await api.post(
        endpoint,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("✅ Accept enrolment API response:", response);

      if (response.data.success) {
        console.log("🎉 Enrolment accepted successfully!");

        const responseData = response.data.data.enrollment || response.data.data;

        // Update local state first
        setStudentData((prevData) => {
          const updatedData = {
            ...prevData,
            student: {
              ...prevData.student,
              status: "approved",
              approved_by: responseData.approved_by || "Admin",
              approved_at: responseData.approved_at || new Date().toISOString(),
              ...(responseData.enrid && { enrollment_id: responseData.enrid }),
              ...(responseData.student_name && {
                first_given_name: responseData.student_name.split(" ")[0],
                family_name: responseData.student_name.split(" ")[1],
              }),
              ...(responseData.class_name && {
                enrol_class_in_WSTSC: responseData.class_name,
              }),
            },
          };
          return updatedData;
        });

        // Send acceptance email to parent
        await sendAcceptanceEmailToParent();

        setError(null);

        setTimeout(() => {
          console.log("✅ Enrolment approval completed");
        }, 1000);
      } else {
        throw new Error(response.data.message || "Failed to accept enrolment");
      }
    } catch (err) {
      console.error("❌ Error accepting enrolment:", err);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to accept enrolment. Please try again.";

      setError(errorMessage);

      if (err.response) {
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
      }

      // Handle specific HTTP status codes
      if (err.response?.status === 401) {
        console.error("Authentication error - token may be invalid");
      } else if (err.response?.status === 403) {
        console.error("Permission denied - user may not have admin privileges");
      } else if (err.response?.status === 404) {
        console.error("Enrolment not found - ID may be invalid");
      }
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleOpenRejectModal = () => {
    setRejectionReason("");
    setRejectionError("");
    setShowRejectModal(true);
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
    setRejectionReason("");
    setRejectionError("");
  };

  const handleRejectEnrolment = async () => {
    if (!rejectionReason.trim()) {
      setRejectionError("Please provide a reason for rejection");
      return;
    }

    if (!id) {
      console.error("❌ No enrolment ID found for rejection");
      return;
    }

    console.log("❌ Attempting to reject enrolment ID:", id);
    console.log("Rejection reason:", rejectionReason);

    try {
      setRejectLoading(true);
      setRejectionError("");
      console.log("🔄 Starting reject enrolment API call...");

      const endpoint = `/admin/enrollments/${id}/reject`;
      console.log("🎯 Using rejection endpoint:", endpoint);

      let requestBody = {
        rejection_reason: rejectionReason.trim(),
      };

      const response = await api.post(endpoint, requestBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log("✅ Reject enrolment API response:", response);

      if (response.data.success) {
        console.log("🎉 Enrolment rejected successfully!");

        const responseData = response.data.data?.enrollment || response.data.data;

        setStudentData((prevData) => {
          const updatedData = {
            ...prevData,
            student: {
              ...prevData.student,
              status: "rejected",
              rejected_by: responseData.rejected_by || "Admin",
              rejected_at: responseData.rejected_at || new Date().toISOString(),
              rejection_reason: responseData.rejection_reason || rejectionReason.trim(),
              ...(responseData.enrid && { enrollment_id: responseData.enrid }),
              ...(responseData.student_name && {
                first_given_name: responseData.student_name.split(" ")[0],
                family_name: responseData.student_name.split(" ")[1],
              }),
            },
          };
          return updatedData;
        });

        // Send rejection email to parent and handle the result
        const emailResult = await sendRejectionEmailToParent(rejectionReason.trim());
        
        if (!emailResult.success) {
          console.warn("⚠️ Enrolment rejected but email failed:", emailResult.error);
          // Show specific error message for template configuration issues
          if (emailResult.error?.includes('template')) {
            console.error('🔧 Please check EmailJS template configuration for rejection emails');
          }
        }

        handleCloseRejectModal();
        setError(null);

        setTimeout(() => {
          console.log("✅ Enrolment rejection completed");
        }, 1000);
      } else {
        throw new Error(response.data.message || "Failed to reject enrolment");
      }
    } catch (err) {
      console.error("❌ Error rejecting enrolment:", err);

      if (err.response?.status === 422) {
        console.error("🔍 Validation Error Details:");
        console.error("🔍 Error data:", err.response.data);
      }

      const errorMessage =
        err.response?.data?.message ||
        (err.response?.data?.errors && Object.values(err.response.data.errors).flat().join(", ")) ||
        err.message ||
        "Failed to reject enrolment. Please try again.";

      setRejectionError(errorMessage);

      if (err.response?.status === 401) {
        console.error("Authentication error - token may be invalid");
      } else if (err.response?.status === 403) {
        console.error("Permission denied - user may not have admin privileges");
      } else if (err.response?.status === 404) {
        console.error("Enrolment not found - ID may be invalid");
      } else if (err.response?.status === 422) {
        console.error("Validation error - check rejection reason format and length");
      }
    } finally {
      setRejectLoading(false);
    }
  };

  // Show loading while determining user role or loading classrooms
  if (!userRole || classroomLoading) {
    return <Loader />;
  }

  // Loading state
  if (loading) {
    return <Loader />;
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="alert alert-danger mb-4" role="alert">
          <div className="d-flex align-items-start">
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">
                {error.includes("accept") ? "Acceptance Error" : "Error Loading Student"}
              </h4>
              <p className="mb-3">{error}</p>
              {error.includes("Authentication") && (
                <button
                  onClick={() => (window.location.href = "/login")}
                  className="btn btn-warning btn-sm me-2"
                >
                  Re-login
                </button>
              )}
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Students
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!studentData || !studentData.student) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="alert alert-warning mb-4" role="alert">
          <div className="d-flex align-items-start">
            <i className="bi bi-info-circle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">No Data Found</h4>
              <p className="mb-3">No student data available for this ID.</p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Students
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Destructure data from the normalized structure
  const {
    student,
    parent_carer_1,
    medical_details,
    first_emergency_contact,
    personal_declaration,
  } = studentData;

  const isApproved = student?.status === "approved";
  const isRejected = student?.status === "rejected";
  const isPending = student?.status === "pending" || !student?.status;

  // Check if user has permission to approve/reject (only admin)
  const canApproveReject = userRole === "admin";

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Enrolment Details</h4>
          <p className="text-muted mb-0">Enrolment ID: {id}</p>

          {/* Enhanced Email Status Indicators */}
          {emailStatus === 'sending' && (
            <div className="alert alert-info mt-2 py-2 d-flex align-items-center" role="alert">
              <i className="bi bi-envelope me-2 fs-5"></i>
              <div>
                <strong>Sending acceptance notification...</strong>
                <div className="small">Preparing and dispatching professional confirmation email to parent</div>
              </div>
            </div>
          )}
          {emailStatus === 'sent' && (
            <div className="alert alert-success mt-2 py-2 d-flex align-items-center" role="alert">
              <i className="bi bi-check2-all me-2 fs-5"></i>
              <div>
                <strong>Acceptance notification delivered!</strong>
                <div className="small">Professional confirmation email has been successfully sent to the parent</div>
              </div>
            </div>
          )}
          {emailStatus === 'failed' && (
            <div className="alert alert-warning mt-2 py-2 d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle me-2 fs-5"></i>
              <div>
                <strong>Enrolment accepted - Email notification failed</strong>
                <div className="small">The enrolment was approved but we couldn't send the confirmation email. Please notify the parent manually.</div>
              </div>
            </div>
          )}
          {emailStatus === 'no_email' && (
            <div className="alert alert-warning mt-2 py-2 d-flex align-items-center" role="alert">
              <i className="bi bi-info-circle me-2 fs-5"></i>
              <div>
                <strong>Enrolment accepted - No parent email available</strong>
                <div className="small">The enrolment was approved but no parent email was found for automatic notification.</div>
              </div>
            </div>
          )}

          {/* Rejection Email Status Indicators */}
          {rejectionEmailStatus === 'sending' && (
            <div className="alert alert-info mt-2 py-2 d-flex align-items-center" role="alert">
              <i className="bi bi-envelope me-2 fs-5"></i>
              <div>
                <strong>Sending rejection notification...</strong>
                <div className="small">Preparing and dispatching professional rejection email to parent</div>
              </div>
            </div>
          )}
          {rejectionEmailStatus === 'sent' && (
            <div className="alert alert-success mt-2 py-2 d-flex align-items-center" role="alert">
              <i className="bi bi-check2-all me-2 fs-5"></i>
              <div>
                <strong>Rejection notification delivered!</strong>
                <div className="small">Professional rejection email has been successfully sent to the parent</div>
              </div>
            </div>
          )}
          {rejectionEmailStatus === 'failed' && (
            <div className="alert alert-warning mt-2 py-2 d-flex align-items-center" role="alert">
              <i className="bi bi-exclamation-triangle me-2 fs-5"></i>
              <div>
                <strong>Enrolment rejected - Email notification failed</strong>
                <div className="small">
                  The enrolment was rejected but we couldn't send the notification email. 
                  {studentData?.parent_carer_1?.email && (
                    <> Please notify the parent manually at: <strong>{studentData.parent_carer_1.email}</strong></>
                  )}
                </div>
              </div>
            </div>
          )}
          {rejectionEmailStatus === 'no_email' && (
            <div className="alert alert-warning mt-2 py-2 d-flex align-items-center" role="alert">
              <i className="bi bi-info-circle me-2 fs-5"></i>
              <div>
                <strong>Enrolment rejected - No parent email available</strong>
                <div className="small">The enrolment was rejected but no parent email was found for automatic notification.</div>
              </div>
            </div>
          )}

          {/* Success message after approval */}
          {isApproved && (
            <div className="alert alert-success mt-2 py-2" role="alert">
              <i className="bi bi-check2-circle me-2"></i>
              <strong>Enrolment Approved!</strong>
              {student?.approved_by && ` by ${student.approved_by}`}
              {student?.approved_at && ` on ${formatDateToDDMMYYYY(student.approved_at)}`}
            </div>
          )}

          {/* Success message after rejection */}
          {isRejected && (
            <div className="alert alert-danger mt-2 py-2" role="alert">
              <i className="bi bi-x-circle me-2"></i>
              <strong>Enrolment Rejected!</strong>
              {student?.rejected_by && ` by ${student.rejected_by}`}
              {student?.rejected_at && ` on ${formatDateToDDMMYYYY(student.rejected_at)}`}
              {student?.rejection_reason && ` - Reason: ${student.rejection_reason}`}
            </div>
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Only show action buttons for admin users */}
          {canApproveReject && isPending && (
            <>
              <ButtonGlobal
                onClick={handleAcceptEnrolment}
                className="btn btn-primary"
                disabled={acceptLoading}
              >
                {acceptLoading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-all me-2"></i>
                    Accept Enrolment
                  </>
                )}
              </ButtonGlobal>

              <ButtonGlobal
                onClick={handleOpenRejectModal}
                className="btn btn-outline-danger"
                disabled={rejectLoading}
              >
                <i className="bi bi-x-circle me-2" />
                Reject Enrolment
              </ButtonGlobal>
            </>
          )}

          {/* Only show status badges for admin users */}
          {canApproveReject && isApproved && (
            <ButtonGlobal className="btn btn-success" disabled>
              <i className="bi bi-check2-all me-2"></i>
              Enrolment Accepted
            </ButtonGlobal>
          )}

          {canApproveReject && isRejected && (
            <ButtonGlobal className="btn btn-danger" disabled>
              <i className="bi bi-x-circle me-2" />
              Enrolment Rejected
            </ButtonGlobal>
          )}

          <ButtonGlobal onClick={handleBack} className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2" />
            Back to List
          </ButtonGlobal>
        </div>
      </div>

      {/* Student Summary Card */}
      <div className="card mb-4 border-0 shadow-sm bg-secondary bg-opacity-10">
        <div className="card-header bg-transparent py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-person-badge me-2"></i>
              Student Information
            </h5>
            <span className="badge bg-info">ID: {student.enrollment_id || id}</span>
          </div>
        </div>
        <div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Full Name</span>
                <span className="fs-6 fw-medium">{student?.first_given_name} {student?.family_name}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Preferred Name</span>
                <span className="fs-6">{student?.preferred_first_name || "—"}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Gender</span>
                <span className="fs-6">{student?.gender || "—"}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Date of Birth</span>
                <span className="fs-6">{formatDateToDDMMYYYY(student?.date_of_birth)}</span>
              </div>
            </div>

            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Enrollment Year</span>
                <span className="fs-6">{student?.mainstream_enrollment_year || "—"}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Mainstream School</span>
                <span className="fs-6">{student?.mainstream_school_name || "—"}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">WSTSC Class</span>
                <span className="fs-6">
                  {student?.classroom_info?.class_name || `Class ${student?.enrol_class_in_WSTSC || student?.com_school_enr_grade}` || "—"}
                  {!student?.classroom_info?.class_name && !student?.enrol_class_in_WSTSC && !student?.com_school_enr_grade && (
                    <small className="text-danger d-block">No class data found</small>
                  )}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column align-items-start">
                <span className="small fw-semibold">Status</span>
                <span className={`badge ${
                  student?.status === "approved" ? "bg-success" :
                  student?.status === "pending" ? "bg-warning" :
                  student?.status === "rejected" ? "bg-danger" : "bg-secondary"
                }`}>
                  {student?.status ? student.status.toUpperCase() : "—"}
                </span>
              </div>
            </div>

            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Enrolment Date</span>
                <span className="fs-6">{formatDateToDDMMYYYY(student?.enrolment_date)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information Tabs */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="px-3 pt-3 border-bottom" fill>
            {/* Parent/Carer Information Tab */}
            <Tab eventKey="parents" title={<span><i className="bi bi-people me-2"></i>Parent/Carer</span>}>
              <div className="p-3">
                <Row className="g-3">
                  <Col md={12}>
                    <InfoCard title="Parent/Carer Information" className="bg-secondary bg-opacity-10" emptyState={!parent_carer_1} emptyMessage="No parent/carer information available">
                      {parent_carer_1 && (
                        <Row className="g-4">
                          <Col md={4}><div><span className="small">Name</span><p className="mb-0 fw-medium">{parent_carer_1.title} {parent_carer_1.first_name} {parent_carer_1.last_name}</p></div></Col>
                          <Col md={4}><div><span className="small">Gender</span><p className="mb-0">{parent_carer_1.gender || "—"}</p></div></Col>
                          <Col md={4}><div><span className="small">Relationship</span><p className="mb-0">{parent_carer_1.relationship_to_student || "—"}</p></div></Col>
                          <Col md={4}><div><span className="small">Email</span><p className="mb-0">{parent_carer_1.email || "—"}</p></div></Col>
                          <Col md={4}><div><span className="small">Mobile Phone</span><p className="mb-0">{parent_carer_1.mobile_phone || "—"}</p></div></Col>
                          <Col md={4}><div><span className="small">Country of Birth</span><p className="mb-0">{parent_carer_1.country_of_birth || "—"}</p></div></Col>
                          <Col md={4}><div><span className="small">Nationality</span><p className="mb-0">{parent_carer_1.nationality || "—"}</p></div></Col>
                          <Col md={4}><div><span className="small">Occupation</span><p className="mb-0">{parent_carer_1.occupation || "—"}</p></div></Col>
                          <Col md={4}><div><span className="small">Marital Status</span><p className="mb-0">{parent_carer_1.marital_status || "—"}</p></div></Col>
                          <Col md={12}><div><span className="small">Address</span><p className="mb-0">{parent_carer_1.street_number} {parent_carer_1.street_name}, {parent_carer_1.suburb}, {parent_carer_1.state} {parent_carer_1.postal_code}, {parent_carer_1.country}</p></div></Col>
                        </Row>
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Emergency Contacts Tab */}
            <Tab eventKey="emergency" title={<span><i className="bi bi-telephone-plus me-2"></i>Emergency Contact</span>}>
              <div className="p-3">
                <Row className="g-3">
                  <Col md={12}>
                    <InfoCard title="Emergency Contact" className="bg-secondary bg-opacity-10" emptyState={!first_emergency_contact} emptyMessage="No emergency contact information available">
                      {first_emergency_contact && (
                        <Row className="g-4">
                          <Col md={4}><div><span className="small">Name</span><p className="mb-0 fw-medium">{first_emergency_contact.given_name} {first_emergency_contact.family_name}</p></div></Col>
                          <Col md={4}><div><span className="small">Relationship</span><p className="mb-0">{first_emergency_contact.relationship_to_student}</p></div></Col>
                          <Col md={4}><div><span className="small">Mobile Phone</span><p className="mb-0">{first_emergency_contact.mobile_phone || "—"}</p></div></Col>
                          <Col md={4}><div><span className="small">Home Phone</span><p className="mb-0">{first_emergency_contact.home_phone || "—"}</p></div></Col>
                          <Col md={4}><div><span className="small">Work Phone</span><p className="mb-0">{first_emergency_contact.work_phone || "—"}</p></div></Col>
                        </Row>
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Medical Information Tab */}
            <Tab eventKey="medical" title={<span><i className="bi bi-heart-pulse me-2"></i>Medical Information</span>}>
              <div className="p-3">
                <Row>
                  <Col md={12}>
                    <InfoCard title="Medical Details" className="bg-secondary bg-opacity-10" emptyState={!medical_details} emptyMessage="No medical information available">
                      {medical_details && (
                        <Row className="g-4">
                          <Col md={3}>
                            <div>
                              <span className="small">Asthma</span>
                              <p className="mb-0">
                                <span className={`badge ${
                                  medical_details.asthma === "Yes" || medical_details.asthma === true ? "bg-success" : "bg-secondary"
                                }`}>
                                  {medical_details.asthma === true ? "Yes" : medical_details.asthma === false ? "No" : medical_details.asthma || "No"}
                                </span>
                              </p>
                            </div>
                          </Col>
                          <Col md={3}>
                            <div>
                              <span className="small">Major Illness</span>
                              <p className="mb-0">
                                <span className={`badge ${
                                  medical_details.major_illness === "Yes" || medical_details.major_illness === true ? "bg-success" : "bg-secondary"
                                }`}>
                                  {medical_details.major_illness === true ? "Yes" : medical_details.major_illness === false ? "No" : medical_details.major_illness || "No"}
                                </span>
                              </p>
                            </div>
                          </Col>
                          <Col md={3}>
                            <div>
                              <span className="small">Allergies</span>
                              <p className="mb-0">
                                <span className={`badge ${
                                  medical_details.allergies === "Yes" || medical_details.allergies === true ? "bg-success" : "bg-secondary"
                                }`}>
                                  {medical_details.allergies === true ? "Yes" : medical_details.allergies === false ? "No" : medical_details.allergies || "No"}
                                </span>
                              </p>
                            </div>
                          </Col>
                          <Col md={3}>
                            <div>
                              <span className="small">Special Learning Needs</span>
                              <p className="mb-0">
                                <span className={`badge ${
                                  medical_details.special_learning_needs === "Yes" || medical_details.special_learning_needs === true ? "bg-success" : "bg-secondary"
                                }`}>
                                  {medical_details.special_learning_needs === true ? "Yes" : medical_details.special_learning_needs === false ? "No" : medical_details.special_learning_needs || "No"}
                                </span>
                              </p>
                              {medical_details.special_learning_needs_details && (
                                <small className="text-muted">Details: {medical_details.special_learning_needs_details}</small>
                              )}
                            </div>
                          </Col>
                        </Row>
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Personal Declaration Tab */}
            <Tab eventKey="declaration" title={<span><i className="bi bi-file-text me-2"></i>Personal Declaration</span>}>
              <div className="p-3">
                <Row>
                  <Col md={12}>
                    <InfoCard title="Personal Declaration" className="bg-secondary bg-opacity-10" emptyState={!personal_declaration} emptyMessage="No personal declaration information available">
                      {personal_declaration && (
                        <Row className="g-4">
                          <Col md={6}><div className="bg-white rounded p-3"><span className="small">First Parent/Carer Name</span><p className="mb-0 fw-medium">{personal_declaration.first_parent_carer_name}</p>{personal_declaration.first_parent_carer_name_date && (<small className="text-muted">Date: {formatDateToDDMMYYYY(personal_declaration.first_parent_carer_name_date)}</small>)}</div></Col>
                          <Col md={6}><div className="bg-white rounded p-3"><span className="small">Second Parent/Carer Name</span><p className="mb-0 fw-medium">{personal_declaration.second_parent_carer_name || "—"}</p>{personal_declaration.second_parent_carer_name_date && (<small className="text-muted">Date: {formatDateToDDMMYYYY(personal_declaration.second_parent_carer_name_date)}</small>)}</div></Col>
                          <Col md={6}><div className="bg-white rounded p-3"><span className="small">Photo/Video Consent</span><p className="mb-0"><span className={`badge ${personal_declaration.photo_video_consent ? "bg-success" : "bg-danger"}`}>{personal_declaration.photo_video_consent ? "Granted" : "Not Granted"}</span></p></div></Col>
                          <Col md={6}><div className="bg-white rounded p-3"><span className="small">Medical Treatment Consent</span><p className="mb-0"><span className={`badge ${personal_declaration.medical_treatment_consent ? "bg-success" : "bg-danger"}`}>{personal_declaration.medical_treatment_consent ? "Granted" : "Not Granted"}</span></p></div></Col>
                        </Row>
                      )}
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>

      {/* Rejection Confirmation Modal - Only show for admin users */}
      {canApproveReject && (
        <Modal show={showRejectModal} onHide={handleCloseRejectModal} size="md" centered backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title><i className="bi bi-x-circle me-2 text-danger"></i>Reject Enrolment</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="text-center mb-3">
              <div className="mb-3"><i className="bi bi-exclamation-triangle text-warning fs-1"></i></div>
              <h5 className="mb-3">Are you sure you want to reject this enrolment?</h5>
              <p className="text-muted">You are about to reject the enrolment for <strong>{student?.first_given_name} {student?.family_name}</strong>. This action will change the enrolment status to rejected.</p>
            </div>
            <div className="mb-3">
              <label htmlFor="rejectionReason" className="form-label fw-semibold">Reason for Rejection <span className="text-danger">*</span></label>
              <textarea id="rejectionReason" className={`form-control ${rejectionError ? "is-invalid" : ""}`} rows="3" placeholder="Please provide a detailed reason for rejecting this enrolment..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} />
              {rejectionError && <div className="invalid-feedback">{rejectionError}</div>}
              <div className="form-text">Please provide a detailed reason (minimum 10 characters). This reason will be recorded and visible in the enrolment history.</div>
            </div>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between">
            <Button variant="secondary" onClick={handleCloseRejectModal} disabled={rejectLoading}>Cancel</Button>
            <ButtonGlobal onClick={handleRejectEnrolment} className="btn btn-danger" disabled={rejectLoading || !rejectionReason.trim() || rejectionReason.trim().length < 10}>
              {rejectLoading ? (<><div className="spinner-border spinner-border-sm me-2" role="status"></div>Rejecting...</>) : (<><i className="bi bi-x-circle me-2" />Reject Enrolment</>)}
            </ButtonGlobal>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default EnrolmentDetails;