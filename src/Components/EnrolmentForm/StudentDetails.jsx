import React, { useEffect, useState } from "react";
import TextInput from "../TextInput.jsx";
import { useEnrolmentForm } from "../../Context/EnrolmentFormContext";
import SelectInput from "../SelectInput.jsx";
import api from "../../config/axiosConfig"; // Import your axios instance

export default function StudentDetails({ onNext }) {
  const {
    formData,
    updateFormData,
    validateField,
    getError,
    validateSection,
    errors,
  } = useEnrolmentForm();

  const [gradeOptions, setGradeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (section, field, value) => {
    updateFormData(section, field, value);
  };

  const handleBlur = (section, field) => {
    const value = formData[section][field];
    validateField(section, field, value);
  };

  const handleNext = () => {
    console.log("Current form data:", formData.student);
    const isValid = validateSection("student");
    console.log("Validation result:", isValid);
    console.log("Current errors:", errors.student);

    if (isValid && onNext) {
      onNext();
    } else {
      console.log("Validation failed, errors:", errors.student);
    }
  };

  // Fetch active classrooms from API using axios
  const fetchActiveClassrooms = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/classrooms/active");

      // Axios automatically parses JSON and handles status codes
      const result = response.data;

      if (result.success && result.data && result.data.classrooms) {
        // Transform API data to match SelectInput options format
        const classroomOptions = result.data.classrooms.map((classroom) => ({
          value: classroom.class_id, // Using class_id as value
          label: `${classroom.class_name}`, // Using class_name as display label with class_id
        }));

        setGradeOptions(classroomOptions);
        console.log("Fetched classrooms:", classroomOptions);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (err) {
      console.error("Error fetching classrooms:", err);
      setError(`Failed to load grade options: ${err.message}`);
      // Fallback to empty options if API fails
      setGradeOptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveClassrooms();
  }, []);

  const genderOptions = [
    { value: "Female", label: "Female" },
    { value: "Male", label: "Male" },
    { value: "Others", label: "Others" },
  ];

  // For mainstream school year, you might want to keep the original grade options
  const mainstreamGradeOptions = [
    { value: "Preschool", label: "Preschool" },
    { value: "Kindergarten", label: "Kindergarten" },
    { value: "Year 1", label: "Year 1" },
    { value: "Year 2", label: "Year 2" },
    { value: "Year 3", label: "Year 3" },
    { value: "Year 4", label: "Year 4" },
    { value: "Year 5", label: "Year 5" },
    { value: "Year 6", label: "Year 6" },
    { value: "Year 7", label: "Year 7" },
    { value: "Year 8", label: "Year 8" },
    { value: "Year 9", label: "Year 9" },
    { value: "Year 10", label: "Year 10" },
    { value: "Year 11", label: "Year 11" },
    { value: "Year 12", label: "Year 12" },
  ];

  return (
    <section className="container bg-light p-3">
      {/* Loading and Error States */}
      {/* {loading && (
        <div className="alert alert-info">Loading grade options...</div>
      )} */}

      {error && <div className="alert alert-warning">{error}</div>}

      {/* Personal Information */}
      <div className="row">
        <div className="col-md-4">
          <TextInput
            id="studentFamilyName"
            label="Family name / Surname"
            value={formData.student.family_name}
            onChange={(value) =>
              handleInputChange("student", "family_name", value)
            }
            onBlur={() => handleBlur("student", "family_name")}
            error={getError("student", "family_name")}
            required
          />
        </div>
        <div className="col-md-4">
          <TextInput
            id="studentFirstName"
            label="Given name"
            value={formData.student.first_given_name}
            onChange={(value) =>
              handleInputChange("student", "first_given_name", value)
            }
            onBlur={() => handleBlur("student", "first_given_name")}
            error={getError("student", "first_given_name")}
            required
          />
        </div>
        <div className="col-md-4">
          <TextInput
            id="studentPreferredName"
            label="Preferred name"
            value={formData.student.preferred_first_name}
            onChange={(value) =>
              handleInputChange("student", "preferred_first_name", value)
            }
            onBlur={() => handleBlur("student", "preferred_first_name")}
            error={getError("student", "preferred_first_name")}
          />
        </div>
      </div>

      {/* Date of Birth, Gender, and Phone Number */}
      <div className="row align-items-end">
        <div className="col-md-4">
          <TextInput
            id="dob"
            label="Date of birth"
            type="date"
            value={formData.student.date_of_birth}
            onChange={(value) =>
              handleInputChange("student", "date_of_birth", value)
            }
            onBlur={() => handleBlur("student", "date_of_birth")}
            error={getError("student", "date_of_birth")}
            required
          />
        </div>
        <div className="col-md-4">
          <SelectInput
            id="gender"
            label="Gender"
            placeholder="Select gender"
            value={formData.student.gender || ""}
            onChange={(value) => handleInputChange("student", "gender", value)}
            onBlur={() => handleBlur("student", "gender")}
            error={getError("student", "gender")}
            required
            options={genderOptions}
          />
        </div>
        <div className="col-md-4">
          <TextInput
            id="studentPhoneNumber"
            label="Student Phone Number"
            type="tel"
            value={formData.student.phone_number || ""}
            onChange={(value) =>
              handleInputChange("student", "phone_number", value)
            }
            onBlur={() => handleBlur("student", "phone_number")}
            error={getError("student", "phone_number")}
          />
        </div>
      </div>

      {/* School Information */}
      <div className="row align-items-end">
        <div className="col-md-4">
          <TextInput
            id="mainstreamSchoolName"
            label="Mainstream School Name"
            value={formData.student.mainstream_school_name || ""}
            onChange={(value) =>
              handleInputChange("student", "mainstream_school_name", value)
            }
            onBlur={() => handleBlur("student", "mainstream_school_name")}
            error={getError("student", "mainstream_school_name")}
            // Removed required prop to make it optional
          />
        </div>
        <div className="col-md-4">
          <TextInput
            id="enrolmentDate"
            label="Date of enrolment at Mainstream School"
            type="date"
            value={formData.student.enrolment_date}
            onChange={(value) =>
              handleInputChange("student", "enrolment_date", value)
            }
            onBlur={() => handleBlur("student", "enrolment_date")}
            error={getError("student", "enrolment_date")}
            // Removed required prop to make it optional
          />
        </div>
        <div className="col-md-4">
          <SelectInput
            id="mainstreamSchoolYear"
            label="Class enrolled in Mainstream School"
            placeholder="Select grade level"
            value={formData.student.mainstream_enrollment_year || ""}
            onChange={(value) =>
              handleInputChange("student", "mainstream_enrollment_year", value)
            }
            onBlur={() => handleBlur("student", "mainstream_enrollment_year")}
            error={getError("student", "mainstream_enrollment_year")}
            // Removed required prop to make it optional
            options={mainstreamGradeOptions}
          />
        </div>
        <div className="col-md-4">
          <SelectInput
            id="gradewstsc"
            label="Grade enrolled in WSTSC"
            placeholder={loading ? "Loading options..." : "Select grade level"}
            value={formData.student.enrol_class_in_WSTSC || ""}
            onChange={(value) =>
              handleInputChange("student", "enrol_class_in_WSTSC", value)
            }
            onBlur={() => handleBlur("student", "enrol_class_in_WSTSC")}
            error={getError("student", "enrol_class_in_WSTSC")}
            required // Keep this required
            options={gradeOptions}
            disabled={loading}
          />
          {loading && (
            <small className="text-muted">
              Loading available classrooms...
            </small>
          )}
          {error && (
            <small className="text-warning">
              Note: Using limited options due to loading error
            </small>
          )}
        </div>
      </div>

      {/* Next Button */}
      <div className="container py-3 py-lg-5">
        <div className="row">
          <div
            className="col-12 d-flex justify-content-center
align-items-center z-2"
          >
            <button
              type="button"
              onClick={handleNext}
              className="btn globalbutton rounded-0 dark-text fw-bold
fs-5 position-relative overflow-hidden"
              disabled={loading}
            >
              {loading ? "Loading..." : "Move to next step"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
