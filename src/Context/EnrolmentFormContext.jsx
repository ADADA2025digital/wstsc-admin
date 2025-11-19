import React, { createContext, useContext, useState } from "react";
import api from "../config/axiosConfig";

const EnrolmentFormContext = createContext();

export const useEnrolmentForm = () => {
  const context = useContext(EnrolmentFormContext);
  if (!context) {
    throw new Error(
      "useEnrolmentForm must be used within an EnrolmentFormProvider"
    );
  }
  return context;
};

export const EnrolmentFormProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    student: {
      family_name: "",
      first_given_name: "",
      second_given_name: "",
      preferred_first_name: "",
      gender: "",
      date_of_birth: "",
      enrollment_year: "",
      overseas_student: null,
      community_school_name: "",
      day_school_location: "",
      day_school_location_optional: "",
      enrolment_date: "",
      day_school_name: "",
      attendance_from: "",
      attendance_to: "",
      phone_number: "",
      mainstream_school_name: "",
      mainstream_enrollment_year: "",
      enrol_class_in_WSTSC: "",
    },
    parent_carer_1: {
      title: "",
      gender: "",
      relationship_to_student: "",
      first_name: "",
      last_name: "",
      middle_name: "",
      country_of_birth: "",
      date_of_birth: "",
      nationality: "",
      email: "",
      mobile_phone: "",
      alternative_phone: "",
      marital_status: "",
      occupation: "",
      street_number: "",
      street_name: "",
      suburb: "",
      state: "",
      postal_code: "",
      country: "",
      address_type: "",
    },
    parent_carer_2: {
      title: "",
      gender: "",
      relationship_to_student: "",
      first_name: "",
      last_name: "",
      middle_name: "",
      country_of_birth: "",
      date_of_birth: "",
      nationality: "",
      email: "",
      mobile_phone: "",
      alternative_phone: "",
      marital_status: "",
      occupation: "",
      street_number: "",
      street_name: "",
      suburb: "",
      state: "",
      postal_code: "",
      country: "",
      address_type: "",
    },
    parent_living_details: {
      correspondence_name: "",
      residential_address: "",
      is_student_residential_address: null,
      correspondence_address: "",
    },
    first_contact: {
      parent_name: "",
      mobile_phone: "",
      home_phone: "",
      work_phone: "",
      email: "",
    },
    second_contact: {
      parent_name: "",
      mobile_phone: "",
      home_phone: "",
      work_phone: "",
      email: "",
    },
    parent_not_living: {
      title: "",
      gender: "",
      relationship_to_student: "",
      family_name: "",
      given_name: "",
      mobile_phone: "",
      home_phone: "",
      work_phone: "",
      email: "",
      residential_address: "",
      does_student_reside_here: false,
      correspondence_address: "",
    },
    first_emergency_contact: {
      family_name: "",
      given_name: "",
      relationship_to_student: "",
      mobile_phone: "",
      home_phone: "",
      work_phone: "",
    },
    second_emergency_contact: {
      family_name: "",
      given_name: "",
      relationship_to_student: "",
      mobile_phone: "",
      home_phone: "",
      work_phone: "",
    },
    personal_declaration: {
      first_parent_carer_name: "",
      first_parent_carer_name_date: "",
      second_parent_carer_name: "",
      second_parent_carer_name_date: "",
      photo_video_consent: false,
      medical_treatment_consent: false,
    },
    medical_details: {
      asthma: "",
      major_illness: "",
      allergies: "",
      special_learning_needs: "",
      special_learning_needs_details: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [submissionResult, setSubmissionResult] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const updateFormData = (section, field, value) => {
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      };

      return newFormData;
    });

    if (errors[section]?.[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[section]) {
          delete newErrors[section][field];
        }
        return newErrors;
      });
    }
  };

  // Enhanced validation with strict date validation
  const getValidationRules = (section, field) => {
    const optionalFields = {
      student: [
        "attendance_to", "second_given_name", "preferred_first_name",
"phone_number",
        "overseas_student", "community_school_name",
"day_school_location", "day_school_name",
        "day_school_location_optional", "attendance_from",
"attendance_to", "enrollment_year",
      ],
      parent_carer_1: ["middle_name", "alternative_phone",
"address_type", "street_number"],
      parent_carer_2: [
        "title", "gender", "relationship_to_student", "first_name",
"last_name", "middle_name",
        "country_of_birth", "date_of_birth", "nationality", "email",
"mobile_phone", "alternative_phone",
        "marital_status", "occupation", "street_number",
"street_name", "suburb", "state", "postal_code",
        "country", "address_type",
      ],
      personal_declaration: [
        "second_parent_carer_name",
        "second_parent_carer_name_date",
        "photo_video_consent", // Added photo_video_consent as optional
      ],
      first_contact: ["home_phone", "work_phone"],
      second_contact: ["home_phone", "work_phone"],
      parent_not_living: ["home_phone", "work_phone"],
      first_emergency_contact: ["home_phone", "work_phone"],
      second_emergency_contact: [
        "family_name", "given_name", "relationship_to_student",
"mobile_phone", "home_phone", "work_phone",
      ],
      medical_details: [
        "asthma", "major_illness", "allergies",
"special_learning_needs", "special_learning_needs_details",
      ],
      parent_living_details: ["correspondence_address"],
    };

    const isOptional = optionalFields[section]?.includes(field);
    const rules = { required: !isOptional };

    switch (field) {
      case "first_name":
      case "last_name":
      case "family_name":
      case "first_given_name":
      case "given_name":
      case "parent_name":
      case "first_parent_carer_name":
      case "second_parent_carer_name":
      case "correspondence_name":
        return {
          ...rules,
          pattern: /^[A-Za-z\s'-]+$/,
          message: "Must contain only letters (2-30 characters)",
          invalidChars: /[0-9@#$%^&*()_+=\-[\]{};:"\\|,.<>?/~`]/,
          minLength: 2,
          maxLength: 30,
        };

      case "preferred_first_name":
      case "second_given_name":
      case "middle_name":
        return {
          ...rules,
          pattern: /^[A-Za-z\s'-]*$/,
          message: "Must contain only letters (max 30 characters)",
          invalidChars: /[0-9@#$%^&*()_+=\-[\]{};:"\\|,.<>?/~`]/,
          minLength: 2,
          maxLength: 30,
        };

      case "street_name":
        return {
          ...rules,
          pattern: /^[A-Za-z0-9\s'-]+$/,
          message: "Street name must be valid (2-50 characters)",
          minLength: 2,
          maxLength: 50,
        };

      case "suburb":
        return {
          ...rules,
          pattern: /^[A-Za-z\s'-]+$/,
          message: "Suburb must contain only letters (2-30 characters)",
          minLength: 2,
          maxLength: 30,
        };

      case "postal_code":
        return {
          ...rules,
          pattern: /^[A-Za-z0-9\s-]{3,10}$/,
          message: "Must be a valid postal code (3-10 characters)",
          minLength: 3,
          maxLength: 10,
        };

      case "street_number":
        return {
          ...rules,
          pattern: /^[A-Za-z0-9\s\/-]*$/,
          message: "Street number (max 10 characters)",
          maxLength: 10,
        };

      case "mainstream_school_name":
        return {
          ...rules,
          pattern: /^[A-Za-z\s]{2,}$/,
          message: "Must contain at least 2 letters (max 50 characters)",
          minLength: 2,
          maxLength: 50,
        };

      case "community_school_name":
      case "day_school_location":
      case "day_school_name":
      case "day_school_location_optional":
        return {
          ...rules,
          pattern: /^[A-Za-z\s]{2,}$/,
          message: "Must contain at least 2 letters (max 50 characters)",
          minLength: 2,
          maxLength: 50,
        };

      case "title":
      case "relationship_to_student":
      case "country_of_birth":
      case "nationality":
      case "marital_status":
      case "occupation":
      case "city":
      case "state":
      case "country":
      case "address_type":
        return {
          ...rules,
          pattern: /^[A-Za-z\s]{2,}$/,
          message: "Must contain at least 2 letters (max 30 characters)",
          minLength: 2,
          maxLength: 30,
        };

      case "mobile_phone":
        return {
          ...rules,
          pattern: /^[0-9+\-\s()]{8,}$/,
          message: "Must be a valid phone number (8-15 digits)",
          minLength: 8,
          maxLength: 15,
        };

      case "home_phone":
      case "work_phone":
      case "alternative_phone":
      case "phone_number":
        return {
          ...rules,
          pattern: /^[0-9+\-\s()]{8,}$/,
          message: "Must be a valid phone number (8-15 digits)",
          minLength: 8,
          maxLength: 15,
        };

      case "email":
        return {
          ...rules,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: "Please enter a valid email address",
          maxLength: 100,
        };

      case "residential_address":
      case "correspondence_address":
      case "address":
        return {
          ...rules,
          pattern: /^[A-Za-z0-9\s,.-]{5,}$/,
          message: "Must be a valid address (5-100 characters)",
          minLength: 5,
          maxLength: 100,
        };

      // STRICT DATE VALIDATION
      case "date_of_birth":
        return {
          ...rules,
          isPastDate: true,
          message: "Date of birth must be a valid past date",
          validateDate: (value) => {
            const date = new Date(value);
            const today = new Date();
            // Check if date is valid and in the past
            return !isNaN(date.getTime()) && date < today;
          }
        };

      case "enrolment_date":
        return {
          ...rules,
          message: "This field is required",
          validateDate: (value) => {
            const date = new Date(value);
            const today = new Date();
            return !isNaN(date.getTime()) && date <= today;
          }
        };

      case "first_parent_carer_name_date":
      case "second_parent_carer_name_date":
        return {
          ...rules,
          message: "This field is required",
          validateDate: (value) => {
            const date = new Date(value);
            const today = new Date();
            return !isNaN(date.getTime()) && date <= today;
          }
        };

      case "mainstream_enrollment_year":
      case "enrol_class_in_WSTSC":
      case "enrollment_year":
        return { ...rules, message: "This field is required" };

      case "attendance_from":
      case "attendance_to":
        return {
          ...rules,
          isMonthYear: true,
          message: "Please select a valid month and year",
        };

      case "gender":
        return { ...rules, message: "This field is required" };

      case "overseas_student":
      case "is_student_residential_address":
      case "does_student_reside_here":
        return {
          ...rules,
          isBoolean: true,
          message: "This field is required",
          validateBoolean: (value) => value !== null && value !== undefined,
        };

      // Photo video consent is now optional
      case "photo_video_consent":
        return {
          required: false, // Made optional
          isBoolean: true,
          message: "",
          validateBoolean: (value) => value !== null && value !== undefined,
        };

      // Medical treatment consent remains required
      case "medical_treatment_consent":
        return {
          ...rules,
          isBoolean: true,
          message: "This field is required",
          validateBoolean: (value) => value !== null && value !== undefined,
        };

      case "asthma":
      case "major_illness":
      case "allergies":
      case "special_learning_needs":
        return { ...rules, message: "", maxLength: 20 };

      case "special_learning_needs_details":
        return { ...rules, message: "", maxLength: 200 };

      default:
        return rules;
    }
  };

  const validateField = (section, field, value) => {
    const rules = getValidationRules(section, field);
    let isValid = true;
    let errorMessage = "";

    if (!rules.required && (value === null || value === undefined ||
value === "")) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (newErrors[section]) {
          delete newErrors[section][field];
        }
        return newErrors;
      });
      return true;
    }

    // Enhanced boolean validation
    if (rules.validateBoolean) {
      if (!rules.validateBoolean(value)) {
        errorMessage = rules.message;
        isValid = false;
      }
    }
    // Enhanced date validation
    else if (rules.validateDate && value) {
      if (!rules.validateDate(value)) {
        errorMessage = rules.message;
        isValid = false;
      }
    }
    // Required field validation
    else if (rules.required && (value === null || value === undefined
|| value === "")) {
      errorMessage = "This field is required";
      isValid = false;
    } else if (value) {
      // Pattern validation
      if (rules.pattern && !rules.pattern.test(value)) {
        errorMessage = rules.message;
        isValid = false;
      }

      if (rules.invalidChars && rules.invalidChars.test(value)) {
        errorMessage = "Cannot contain numbers or special symbols";
        isValid = false;
      }

      // Length validation
      if (rules.minLength && value.length < rules.minLength) {
        errorMessage = `Must be at least ${rules.minLength} characters`;
        isValid = false;
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errorMessage = `Cannot exceed ${rules.maxLength} characters`;
        isValid = false;
      }

      // Past date validation
      if (rules.isPastDate && value) {
        const date = new Date(value);
        const today = new Date();
        if (isNaN(date.getTime()) || date >= today) {
          errorMessage = rules.message;
          isValid = false;
        }
      }

      if (rules.isMonthYear && !value.match(/^\d{4}-\d{2}$/)) {
        errorMessage = rules.message;
        isValid = false;
      }

      // Attendance date validation
      if (field === "attendance_to" && value &&
formData.student.attendance_from) {
        const fromDate = new Date(formData.student.attendance_from + "-01");
        const toDate = new Date(value + "-01");
        if (toDate <= fromDate) {
          errorMessage = "End date must be after start date";
          isValid = false;
        }
      }
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      if (!newErrors[section]) {
        newErrors[section] = {};
      }
      if (!isValid) {
        newErrors[section][field] = errorMessage;
      } else {
        delete newErrors[section][field];
      }
      return newErrors;
    });

    return isValid;
  };

  const validateSection = (section) => {
    let hasErrors = false;
    const sectionData = formData[section];
    const newErrors = { ...errors };

    if (!newErrors[section]) {
      newErrors[section] = {};
    }

    const optionalFields = {
      student: [
        "attendance_to", "second_given_name", "preferred_first_name",
"phone_number",
        "overseas_student", "community_school_name",
"day_school_location", "day_school_name",
        "day_school_location_optional", "attendance_from",
"attendance_to", "enrollment_year",
      ],
      parent_carer_1: ["middle_name", "alternative_phone",
"address_type", "street_number"],
      parent_carer_2: [
        "title", "gender", "relationship_to_student", "first_name",
"last_name", "middle_name",
        "country_of_birth", "date_of_birth", "nationality", "email",
"mobile_phone", "alternative_phone",
        "marital_status", "occupation", "street_number",
"street_name", "suburb", "state", "postal_code",
        "country", "address_type",
      ],
      personal_declaration: [
        "second_parent_carer_name",
        "second_parent_carer_name_date",
        "photo_video_consent", // Added photo_video_consent as optional
      ],
      first_contact: ["home_phone", "work_phone"],
      second_contact: ["home_phone", "work_phone"],
      parent_not_living: ["home_phone", "work_phone"],
      first_emergency_contact: ["home_phone", "work_phone"],
      second_emergency_contact: [
        "family_name", "given_name", "relationship_to_student",
"mobile_phone", "home_phone", "work_phone",
      ],
      medical_details: [
        "asthma", "major_illness", "allergies",
"special_learning_needs", "special_learning_needs_details",
      ],
      parent_living_details: ["correspondence_address"],
    };

    Object.keys(sectionData).forEach((field) => {
      if (optionalFields[section]?.includes(field) &&
          (sectionData[field] === null || sectionData[field] ===
undefined || sectionData[field] === "")) {
        if (newErrors[section]?.[field]) {
          delete newErrors[section][field];
        }
        return;
      }

      if (!validateField(section, field, sectionData[field])) {
        hasErrors = true;
      }
    });

    // Special validations
    if (section === "student") {
      if (formData.student.attendance_from && formData.student.attendance_to) {
        if (!validateField("student", "attendance_to",
formData.student.attendance_to)) {
          hasErrors = true;
        }
      }
    }

    if (section === "parent_living_details") {
      if (formData.parent_living_details.is_student_residential_address
=== false) {
        if (!validateField("parent_living_details",
"correspondence_address",
formData.parent_living_details.correspondence_address)) {
          hasErrors = true;
        }
      }
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const validateForm = (personalDeclarationOnly = false) => {
    let hasErrors = false;
    setError(null);

    if (personalDeclarationOnly) {
      if (!validateSection("personal_declaration")) {
        hasErrors = true;
      }
    } else {
      const sections = [
        "student", "parent_carer_1", "parent_carer_2", "parent_living_details",
        "first_contact", "second_contact", "parent_not_living",
"first_emergency_contact",
        "second_emergency_contact", "personal_declaration", "medical_details",
      ];

      sections.forEach((section) => {
        if (!validateSection(section)) {
          hasErrors = true;
        }
      });
    }

    return !hasErrors;
  };

  // FIXED Data sanitization function - No aggressive date adjustments
  const sanitizeData = (data) => {
  const sanitized = JSON.parse(JSON.stringify(data));
  const today = new Date();

  console.log("🔧 Starting data sanitization...");

  // Helper function to ensure valid dates without aggressive adjustments
  const ensureValidDate = (dateString, fieldName) => {
    if (!dateString) {
      console.log(`⚠️  ${fieldName}: Empty date`);
      return dateString;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.log(`❌ ${fieldName}: Invalid date format - ${dateString}`);
      // For invalid dates, return today's date as fallback
      return today.toISOString().split('T')[0];
    }

    console.log(`✅ ${fieldName}: Valid date - ${dateString}`);
    return dateString;
  };

  // Sanitize dates in nested structure
  if (sanitized.student) {
    console.log("🎓 Sanitizing student dates...");
    sanitized.student.date_of_birth =
ensureValidDate(sanitized.student.date_of_birth, 'student.dob');
    sanitized.student.enrolment_date =
ensureValidDate(sanitized.student.enrolment_date,
'student.enrolment');
  }

  if (sanitized.parent_carer_1) {
    console.log("👨‍👩‍👧 Sanitizing parent 1 dates...");
    sanitized.parent_carer_1.date_of_birth =
ensureValidDate(sanitized.parent_carer_1.date_of_birth,
'parent1.dob');
  }

  if (sanitized.parent_carer_2 && sanitized.parent_carer_2.date_of_birth) {
    console.log("👨‍👩‍👧 Sanitizing parent 2 dates...");
    sanitized.parent_carer_2.date_of_birth =
ensureValidDate(sanitized.parent_carer_2.date_of_birth,
'parent2.dob');
  }

  if (sanitized.personal_declaration) {
    console.log("📝 Sanitizing declaration dates...");
    sanitized.personal_declaration.first_parent_carer_name_date =
ensureValidDate(
      sanitized.personal_declaration.first_parent_carer_name_date,
      'declaration.date1'
    );
    sanitized.personal_declaration.second_parent_carer_name_date =
ensureValidDate(
      sanitized.personal_declaration.second_parent_carer_name_date,
      'declaration.date2'
    );
  }

  // Enhanced string sanitization with length limits for nested structure
  const sanitizeStrings = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
      const fullPath = path ? `${path}.${key}` : key;

      if (typeof obj[key] === 'string') {
        const original = obj[key];
        obj[key] = obj[key].trim();

        // Apply field-specific length limits
        if (fullPath.includes('email')) {
          obj[key] = obj[key].substring(0, 100);
        } else if (fullPath.includes('name') ||
fullPath.includes('given_name') || fullPath.includes('family_name')) {
          obj[key] = obj[key].substring(0, 30);
        } else if (fullPath.includes('school_name') ||
fullPath.includes('occupation') || fullPath.includes('street_name')) {
          obj[key] = obj[key].substring(0, 50);
        } else if (fullPath.includes('suburb') ||
fullPath.includes('country')) {
          obj[key] = obj[key].substring(0, 30);
        } else {
          obj[key] = obj[key].substring(0, 100);
        }

        // Remove any potentially dangerous characters
        obj[key] = obj[key].replace(/[<>{}]/g, '');

        if (original !== obj[key]) {
          console.log(`✂️  ${fullPath}: Trimmed from "${original}" to
"${obj[key]}"`);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null &&
!(obj[key] instanceof Date) && !Array.isArray(obj[key])) {
        sanitizeStrings(obj[key], fullPath);
      }
    });
  };

  console.log("🔤 Sanitizing strings...");
  sanitizeStrings(sanitized);

  console.log("✅ Sanitization complete");
  return sanitized;
};

  const submitForm = async (personalDeclarationOnly = false) => {
  console.log("🔄 Starting form submission process...");

  if (!validateForm(personalDeclarationOnly)) {
    console.error("❌ Form validation failed");
    if (!error) {
      setError("Please complete all required fields before submitting the form.");
    }
    throw new Error("Form validation failed");
  }

  console.log("✅ Form validation passed");

  setLoading(true);
  setError(null);
  setSuccess(false);
  setSubmissionResult(null);
  setDebugInfo(null);

  try {
    // FIXED: Restructure data to match backend expectations - use nested objects
    const submissionData = {
      student: {
        family_name: formData.student.family_name?.trim().substring(0, 30) || "",
        first_given_name:
formData.student.first_given_name?.trim().substring(0, 30) || "",
        preferred_first_name:
formData.student.preferred_first_name?.trim().substring(0, 30) || "",
        gender: formData.student.gender?.toLowerCase() || "",
        date_of_birth: formData.student.date_of_birth || "",
        phone_number: formData.student.phone_number || "",
        mainstream_school_name:
formData.student.mainstream_school_name?.trim().substring(0, 50) ||
"",
        enrolment_date: formData.student.enrolment_date || "",
        mainstream_enrollment_year:
formData.student.mainstream_enrollment_year || "",
        enrol_class_in_WSTSC: formData.student.enrol_class_in_WSTSC || "",
        // Optional fields
        second_given_name:
formData.student.second_given_name?.trim().substring(0, 30) || "",
        overseas_student: Boolean(formData.student.overseas_student),
        community_school_name:
formData.student.community_school_name?.trim().substring(0, 50) || "",
        day_school_name:
formData.student.day_school_name?.trim().substring(0, 50) || "",
      },
      parent_carer_1: formData.parent_carer_1.first_name ? {
        title: formData.parent_carer_1.title || "",
        gender: formData.parent_carer_1.gender?.toLowerCase() || "",
        relationship_to_student:
formData.parent_carer_1.relationship_to_student || "",
        first_name:
formData.parent_carer_1.first_name?.trim().substring(0, 30) || "",
        last_name:
formData.parent_carer_1.last_name?.trim().substring(0, 30) || "",
        middle_name:
formData.parent_carer_1.middle_name?.trim().substring(0, 30) || "",
        country_of_birth:
formData.parent_carer_1.country_of_birth?.trim().substring(0, 30) ||
"",
        date_of_birth: formData.parent_carer_1.date_of_birth || "",
        nationality:
formData.parent_carer_1.nationality?.trim().substring(0, 30) || "",
        email: formData.parent_carer_1.email?.trim().substring(0, 100) || "",
        mobile_phone: formData.parent_carer_1.mobile_phone || "",
        alternative_phone: formData.parent_carer_1.alternative_phone || "",
        marital_status:
formData.parent_carer_1.marital_status?.toLowerCase() || "",
        occupation:
formData.parent_carer_1.occupation?.trim().substring(0, 50) || "",
        address_type: formData.parent_carer_1.address_type || "",
        street_number: formData.parent_carer_1.street_number || "",
        street_name:
formData.parent_carer_1.street_name?.trim().substring(0, 50) || "",
        suburb: formData.parent_carer_1.suburb?.trim().substring(0, 30) || "",
        state: formData.parent_carer_1.state || "",
        postal_code: formData.parent_carer_1.postal_code || "",
        country: formData.parent_carer_1.country || "Australia",
      } : undefined,
      parent_carer_2: formData.parent_carer_2.first_name ? {
        title: formData.parent_carer_2.title || "",
        gender: formData.parent_carer_2.gender?.toLowerCase() || "",
        relationship_to_student:
formData.parent_carer_2.relationship_to_student || "",
        first_name:
formData.parent_carer_2.first_name?.trim().substring(0, 30) || "",
        last_name:
formData.parent_carer_2.last_name?.trim().substring(0, 30) || "",
        middle_name:
formData.parent_carer_2.middle_name?.trim().substring(0, 30) || "",
        country_of_birth:
formData.parent_carer_2.country_of_birth?.trim().substring(0, 30) ||
"",
        date_of_birth: formData.parent_carer_2.date_of_birth || "",
        nationality:
formData.parent_carer_2.nationality?.trim().substring(0, 30) || "",
        email: formData.parent_carer_2.email?.trim().substring(0, 100) || "",
        mobile_phone: formData.parent_carer_2.mobile_phone || "",
        alternative_phone: formData.parent_carer_2.alternative_phone || "",
        marital_status:
formData.parent_carer_2.marital_status?.toLowerCase() || "",
        occupation:
formData.parent_carer_2.occupation?.trim().substring(0, 50) || "",
        address_type: formData.parent_carer_2.address_type || "",
        street_number: formData.parent_carer_2.street_number || "",
        street_name:
formData.parent_carer_2.street_name?.trim().substring(0, 50) || "",
        suburb: formData.parent_carer_2.suburb?.trim().substring(0, 30) || "",
        state: formData.parent_carer_2.state || "",
        postal_code: formData.parent_carer_2.postal_code || "",
        country: formData.parent_carer_2.country || "Australia",
      } : undefined,
      first_emergency_contact: formData.first_emergency_contact.family_name ? {
        family_name:
formData.first_emergency_contact.family_name?.trim().substring(0, 30)
|| "",
        given_name:
formData.first_emergency_contact.given_name?.trim().substring(0, 30)
|| "",
        relationship_to_student:
formData.first_emergency_contact.relationship_to_student || "",
        mobile_phone: formData.first_emergency_contact.mobile_phone || "",
        home_phone: formData.first_emergency_contact.home_phone || "",
        work_phone: formData.first_emergency_contact.work_phone || "",
      } : undefined,
      second_emergency_contact:
formData.second_emergency_contact.family_name ? {
        family_name:
formData.second_emergency_contact.family_name?.trim().substring(0, 30)
|| "",
        given_name:
formData.second_emergency_contact.given_name?.trim().substring(0, 30)
|| "",
        relationship_to_student:
formData.second_emergency_contact.relationship_to_student || "",
        mobile_phone: formData.second_emergency_contact.mobile_phone || "",
        home_phone: formData.second_emergency_contact.home_phone || "",
        work_phone: formData.second_emergency_contact.work_phone || "",
      } : undefined,
      personal_declaration: {
        first_parent_carer_name:
formData.personal_declaration.first_parent_carer_name?.trim().substring(0,
60) || "",
        first_parent_carer_name_date:
formData.personal_declaration.first_parent_carer_name_date || "",
        second_parent_carer_name:
formData.personal_declaration.second_parent_carer_name?.trim().substring(0,
60) || "",
        second_parent_carer_name_date:
formData.personal_declaration.second_parent_carer_name_date || "",
        photo_video_consent:
Boolean(formData.personal_declaration.photo_video_consent),
        medical_treatment_consent:
Boolean(formData.personal_declaration.medical_treatment_consent),
      },
      medical_details: {
        asthma: formData.medical_details.asthma || "",
        major_illness: formData.medical_details.major_illness || "",
        allergies: formData.medical_details.allergies || "",
        special_learning_needs:
formData.medical_details.special_learning_needs || "",
        special_learning_needs_details:
formData.medical_details.special_learning_needs_details || "",
      },
    };

    // Remove undefined objects to avoid sending empty data
    Object.keys(submissionData).forEach(key => {
      if (submissionData[key] === undefined) {
        delete submissionData[key];
      }
    });

    // Apply enhanced sanitization
    const sanitizedData = sanitizeData(submissionData);

    console.log("📤 FINAL SANITIZED SUBMISSION DATA:",
JSON.stringify(sanitizedData, null, 2));

    // Enhanced required fields validation
    const criticalFields = [
      { field: 'family_name', name: 'Family Name', value:
sanitizedData.student.family_name },
      { field: 'first_given_name', name: 'First Given Name', value:
sanitizedData.student.first_given_name },
      { field: 'gender', name: 'Gender', value: sanitizedData.student.gender },
      { field: 'date_of_birth', name: 'Date of Birth', value:
sanitizedData.student.date_of_birth },
      { field: 'mainstream_school_name', name: 'Mainstream School Name', value: sanitizedData.student.mainstream_school_name },
      { field: 'enrolment_date', name: 'Enrolment Date', value: sanitizedData.student.enrolment_date },
      { field: 'mainstream_enrollment_year', name: 'Mainstream Enrollment Year', value: sanitizedData.student.mainstream_enrollment_year },
      { field: 'enrol_class_in_WSTSC', name: 'Enrol Class in WSTSC', value: sanitizedData.student.enrol_class_in_WSTSC },
    ];

    let allCriticalFieldsValid = true;
    criticalFields.forEach(({ field, name, value }) => {
      if (!value || value.toString().trim() === '') {
        console.error(`❌ Critical field empty: ${name}`);
        allCriticalFieldsValid = false;
      } else {
        console.log(`✅ Critical field filled: ${name} = "${value}"`);
      }
    });

    if (!allCriticalFieldsValid) {
      throw new Error("Critical required fields are missing. Please check the form.");
    }

    console.log("🚀 Making API request to /student-enrollment...");

    const response = await api.post("/student-enrollment", sanitizedData);

    console.log("✅ Submission successful:", response.data);

    // Set both success and submission result
    setSuccess(true);
    setSubmissionResult(response.data);

    // Return the successful response
    return response.data;

  } catch (err) {
    console.error("❌ FULL SUBMISSION ERROR:");
    console.error("Error:", err.message);
    console.error("Response:", err.response?.data);
    console.error("Status:", err.response?.status);

    const debugData = {
      timestamp: new Date().toISOString(),
      error: {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      },
      request: {
        url: err.config?.url,
        data: err.config?.data ? JSON.parse(err.config.data) : null,
      }
    };

    setDebugInfo(debugData);

    let errorMessage = "Failed to store student enrollment data";

    if (err.response) {
      const { status, data } = err.response;

      if (status === 500) {
        if (data?.error?.includes('SQLSTATE[23000]')) {
          errorMessage = "Database error: Invalid data provided. Please check all fields and try again.";
        } else if (data?.message) {
          errorMessage = `Server error: ${data.message}`;
        } else {
          errorMessage = "Server error: Please try again later.";
        }
      } else if (status === 422) {
        errorMessage = data.message || "Validation failed";
        if (data.errors) {
          const validationErrors = Object.values(data.errors).flat().join(', ');
          errorMessage = validationErrors;
        }
      } else if (status === 400) {
        errorMessage = data.message || "Bad request - please check your input data";
      }
    }

    setError(errorMessage);
    throw new Error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  const submitTestData = async () => {
  console.log("🧪 Testing with guaranteed valid data...");

  const testData = {
    student: {
      family_name: "Smith",
      first_given_name: "John",
      gender: "male",
      date_of_birth: "2015-06-15",
      mainstream_school_name: "Primary School",
      enrolment_date: "2024-01-30",
      mainstream_enrollment_year: "Year 4",
      enrol_class_in_WSTSC: "GRADE1B_8225",
      overseas_student: false,
    },
    parent_carer_1: {
      title: "Mr",
      gender: "male",
      relationship_to_student: "Father",
      first_name: "Michael",
      last_name: "Smith",
      country_of_birth: "Australia",
      date_of_birth: "1980-03-20",
      nationality: "Australian",
      email: "michael.smith@example.com",
      mobile_phone: "0412345678",
      marital_status: "married",
      occupation: "Engineer",
      street_name: "Main Street",
      suburb: "Melbourne",
      state: "Victoria",
      postal_code: "3000",
      country: "Australia",
    },
    first_emergency_contact: {
      family_name: "Johnson",
      given_name: "Robert",
      relationship_to_student: "Uncle",
      mobile_phone: "0412345679",
    },
    personal_declaration: {
      first_parent_carer_name: "Michael Smith",
      first_parent_carer_name_date: "2024-01-30",
      photo_video_consent: false, // Now optional, can be false
      medical_treatment_consent: true, // Still required
    },
    medical_details: {
      asthma: "No",
      major_illness: "No",
      allergies: "No",
      special_learning_needs: "No",
    },
  };

  console.log("🧪 Test data:", JSON.stringify(testData, null, 2));

  try {
    const response = await api.post("/student-enrollment", testData);
    console.log("✅ Test submission successful:", response.data);
    return response.data;
  } catch (err) {
    console.error("❌ Test submission failed:", err.response?.data ||
err.message);
    throw err;
  }
};

  const clearError = (section, field) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (newErrors[section]) {
        delete newErrors[section][field];
      }
      return newErrors;
    });
  };

  const getError = (section, field) => {
    return errors[section]?.[field] || "";
  };

  const resetForm = () => {
    setFormData({
      student: {
        family_name: "",
        first_given_name: "",
        second_given_name: "",
        preferred_first_name: "",
        gender: "",
        date_of_birth: "",
        enrollment_year: "",
        overseas_student: null,
        community_school_name: "",
        day_school_location: "",
        day_school_location_optional: "",
        enrolment_date: "",
        day_school_name: "",
        attendance_from: "",
        attendance_to: "",
        phone_number: "",
        mainstream_school_name: "",
        mainstream_enrollment_year: "",
        enrol_class_in_WSTSC: "",
      },
      parent_carer_1: {
        title: "",
        gender: "",
        relationship_to_student: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        country_of_birth: "",
        date_of_birth: "",
        nationality: "",
        email: "",
        mobile_phone: "",
        alternative_phone: "",
        marital_status: "",
        occupation: "",
        street_number: "",
        street_name: "",
        suburb: "",
        state: "",
        postal_code: "",
        country: "",
        address_type: "",
      },
      parent_carer_2: {
        title: "",
        gender: "",
        relationship_to_student: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        country_of_birth: "",
        date_of_birth: "",
        nationality: "",
        email: "",
        mobile_phone: "",
        alternative_phone: "",
        marital_status: "",
        occupation: "",
        street_number: "",
        street_name: "",
        suburb: "",
        state: "",
        postal_code: "",
        country: "",
        address_type: "",
      },
      parent_living_details: {
        correspondence_name: "",
        residential_address: "",
        is_student_residential_address: null,
        correspondence_address: "",
      },
      first_contact: {
        parent_name: "",
        mobile_phone: "",
        home_phone: "",
        work_phone: "",
        email: "",
      },
      second_contact: {
        parent_name: "",
        mobile_phone: "",
        home_phone: "",
        work_phone: "",
        email: "",
      },
      parent_not_living: {
        title: "",
        gender: "",
        relationship_to_student: "",
        family_name: "",
        given_name: "",
        mobile_phone: "",
        home_phone: "",
        work_phone: "",
        email: "",
        residential_address: "",
        does_student_reside_here: false,
        correspondence_address: "",
      },
      first_emergency_contact: {
        family_name: "",
        given_name: "",
        relationship_to_student: "",
        mobile_phone: "",
        home_phone: "",
        work_phone: "",
      },
      second_emergency_contact: {
        family_name: "",
        given_name: "",
        relationship_to_student: "",
        mobile_phone: "",
        home_phone: "",
        work_phone: "",
      },
      personal_declaration: {
        first_parent_carer_name: "",
        first_parent_carer_name_date: "",
        second_parent_carer_name: "",
        second_parent_carer_name_date: "",
        photo_video_consent: false,
        medical_treatment_consent: false,
      },
      medical_details: {
        asthma: "",
        major_illness: "",
        allergies: "",
        special_learning_needs: "",
        special_learning_needs_details: "",
      },
    });
    setErrors({});
    setError(null);
    setSuccess(false);
    setSubmissionResult(null);
    setDebugInfo(null);
  };

  const value = {
    formData,
    updateFormData,
    submitForm,
    submitTestData,
    loading,
    error,
    success,
    errors,
    setErrors,
    validateField,
    validateForm,
    validateSection,
    clearError,
    getError,
    resetForm,
    resetSuccess: () => setSuccess(false),
    resetError: () => setError(null),
    submissionResult,
    debugInfo,
  };

  return (
    <EnrolmentFormContext.Provider value={value}>
      {children}
    </EnrolmentFormContext.Provider>
  );
};