import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useEnrolmentForm } from "../../Context/EnrolmentFormContext";

export default function PersonalInfoAndDeclaration({ onNext }) {
  const {
    formData,
    updateFormData,
    getError,
    validateSection,
    submitForm,
    loading,
    error,
    success,
    submissionResult,
    resetForm,
  } = useEnrolmentForm();
  const [sectionError, setSectionError] = useState("");
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const navigate = useNavigate();

  // Enhanced success handler - FIXED VERSION
  useEffect(() => {
    if (success && submissionResult && !hasSubmitted) {
      console.log("✅ Form submitted successfully:", submissionResult);
      
      // Set hasSubmitted to prevent multiple alerts
      setHasSubmitted(true);
      
      Swal.fire({
        title: "Success!",
        text: `Student enrollment submitted successfully and is pending approval.${
          submissionResult.enrollment_id ? ` Enrollment ID: ${submissionResult.enrollment_id}` : ''
        }`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#3085d6",
        showConfirmButton: true,
      }).then((result) => {
        // Reset the form AFTER the user acknowledges the success message
        resetForm();
        setHasSubmitted(false); // Reset the flag
        navigate("/");
      });
    }
  }, [success, submissionResult, navigate, resetForm, hasSubmitted]);

  // Show error alert if there's an error
  useEffect(() => {
    if (error && !loading && !hasSubmitted) {
      Swal.fire({
        title: "Error!",
        text: error,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#d33",
      });
    }
  }, [error, loading, hasSubmitted]);

  // Handle input changes
  const handleInputChange = (section, field, value) => {
    updateFormData(section, field, value);
    if (sectionError) {
      setSectionError("");
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (field, checked) => {
    updateFormData("personal_declaration", field, checked);
    if (sectionError) {
      setSectionError("");
    }
  };

  // Validation functions
  const validateName = (value, isRequired = true) => {
    if (!value || value.toString().trim() === "") {
      return isRequired ? "This field is required" : null;
    }
    if (/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value.toString())) {
      return "Name should not contain numbers or symbols";
    }
    if (value.toString().trim().length < 2) {
      return "Name must be at least 2 characters long";
    }
    if (value.toString().trim().length > 30) {
      return "Name cannot exceed 30 characters";
    }
    return null;
  };

  const validateDate = (value, isRequired = true) => {
    if (!value || value.toString().trim() === "") {
      return isRequired ? "This field is required" : null;
    }
    
    const date = new Date(value);
    const today = new Date();
    
    if (isNaN(date.getTime())) {
      return "Please enter a valid date";
    }
    
    if (date > today) {
      return "Date cannot be in the future";
    }
    
    return null;
  };

  const validateCheckbox = (value, isRequired = true) => {
    if (isRequired && !value) {
      return "This consent is required";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowAllErrors(true);
    setHasSubmitted(false); // Reset submission flag

    // ONLY validate the personal declaration section
    const isPersonalDeclarationValid = validateSection("personal_declaration");

    // Check required fields for personal declaration
    const requiredFields = [
      "first_parent_carer_name",
      "first_parent_carer_name_date",
      "medical_treatment_consent",
    ];

    let hasErrors = false;
    const fieldErrors = {};

    // Validate first parent name
    const firstNameError = validateName(
      formData.personal_declaration?.first_parent_carer_name,
      true
    );
    if (firstNameError) {
      fieldErrors.first_parent_carer_name = firstNameError;
      hasErrors = true;
    }

    // Validate first parent date
    const firstDateError = validateDate(
      formData.personal_declaration?.first_parent_carer_name_date,
      true
    );
    if (firstDateError) {
      fieldErrors.first_parent_carer_name_date = firstDateError;
      hasErrors = true;
    }

    // Validate medical consent
    const medicalConsentError = validateCheckbox(
      formData.personal_declaration?.medical_treatment_consent,
      true
    );
    if (medicalConsentError) {
      fieldErrors.medical_treatment_consent = medicalConsentError;
      hasErrors = true;
    }

    if (!hasErrors && isPersonalDeclarationValid) {
      setSectionError("");
      try {
        console.log("🔄 Starting form submission...");
        await submitForm(true);
        // Success handling is now in the useEffect above
      } catch (err) {
        console.error("❌ Submission error:", err);
        setHasSubmitted(false); // Reset flag on error
        
        if (err.message === "Form validation failed") {
          Swal.fire({
            title: "Incomplete Form",
            text: "There are some validation errors. Please check all sections and try again.",
            icon: "warning",
            confirmButtonText: "OK",
            confirmButtonColor: "#3085d6",
          });
        } else {
          Swal.fire({
            title: "Error!",
            text: err.message || "There was an error submitting the form. Please try again.",
            icon: "error",
            confirmButtonText: "OK",
            confirmButtonColor: "#d33",
          });
        }
      }
    } else {
      const errorMessage = "Please complete all required fields in the personal declaration before submitting the form.";
      setSectionError(errorMessage);

      // Scroll to error message
      setTimeout(() => {
        const errorElement = document.querySelector(".alert-danger");
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  };

  // Safe value getter
  const getFieldValue = (section, field) => {
    const value = formData[section]?.[field];
    if (value === null || value === undefined) {
      return "";
    }
    if (typeof value === "object") {
      return "";
    }
    return String(value);
  };

  // Get field error - combines context errors and local validation
  const getFieldError = (field) => {
    const contextError = getError("personal_declaration", field);
    if (contextError) return contextError;

    if (showAllErrors) {
      switch (field) {
        case "first_parent_carer_name":
          return validateName(getFieldValue("personal_declaration", field), true);
        case "first_parent_carer_name_date":
          return validateDate(getFieldValue("personal_declaration", field), true);
        case "medical_treatment_consent":
          return validateCheckbox(formData.personal_declaration?.[field], true);
        case "second_parent_carer_name":
          if (getFieldValue("personal_declaration", field).trim() !== "") {
            return validateName(getFieldValue("personal_declaration", field), false);
          }
          return null;
        case "second_parent_carer_name_date":
          if (getFieldValue("personal_declaration", field).trim() !== "") {
            return validateDate(getFieldValue("personal_declaration", field), false);
          }
          return null;
        default:
          return null;
      }
    }
    return null;
  };

  // Check if field has error
  const hasError = (field) => {
    return showAllErrors && getFieldError(field);
  };

  return (
    <section className="container bg-light p-3">
      <div className="row">
        <div className="col-md-6">
          <p className="text-muted">
            The personal information collected on this information form is for
            purposes directly related to your child's attendance at a community
            languages school, including the processing of applications for grant
            funding from the NSW Community Languages Schools Program,
            administered by the NSW Department of Education. <br />
            <br />
            Any information provided to the Department of Education and will be
            used, disclosed and stored consistent with the NSW privacy laws.{" "}
            <br />
            <br />
            Certain information is required by the Department of Education to
            meet its obligations in relation to data collection, reporting and
            the payment of grants. <br />
            <br />
            Information may be disclosed to NSW State and Commonwealth
            government agencies and other organisations for the purposes of
            confirming the eligibility of students for grant funding and as
            authorised or required by law. <br />
            <br />
            Information will be stored on a secure electronic database. You may
            access or correct the information by contacting your child's
            community language school. The community language school is
            responsible for advising the NSW Department of Education and of any
            corrections required to the electronic database. If you have a
            concern or complaint about the information collected or how it has
            been used or disclosed you should contact the community language
            school.
          </p>
        </div>

        <div className="col-md-6">
          <h2 className="h4 mb-3">Your consent and declaration</h2>
          <p className="text-muted">
            I have provided information related to the student in this enrolment
            form. <br /> <br />
            I consent to providing information contained on this enrolment form
            to the Department of Education and to confirm the accuracy of the
            information with other organisations that may also hold information
            related to the student named on page 1. <br /> <br />
            I have read the information on this page concerning the collection
            of personal information. <br /> <br />I declare that the information
            provided in this enrolment form is, to the best of my knowledge and
            belief, accurate and complete. <br /> <br />
            Where I have given personal information about other people I have
            done so with their authorisation. <br /> <br />I am aware that if
            information I have given is false or misleading, any decision made
            as a result of this enrolment form may be changed.
          </p>

          {/* Medical Treatment Consent Checkbox - REQUIRED */}
          <div className="mb-4">
            <div className="form-check">
              <input
                className={`form-check-input ${hasError("medical_treatment_consent") ? "is-invalid" : ""}`}
                type="checkbox"
                id="medicalTreatmentConsent"
                checked={
                  formData.personal_declaration?.medical_treatment_consent ||
                  false
                }
                onChange={(e) =>
                  handleCheckboxChange(
                    "medical_treatment_consent",
                    e.target.checked
                  )
                }
              />
              <label
                className="form-check-label fw-bold"
                htmlFor="medicalTreatmentConsent"
              >
                In the event of illness or injury to my child while at school or
                an excursion, or travelling to or from school, I authorise the
                principal or a senior staff member, if/where it is impossible to
                contact me, to consent to emergency medical treatment as is
                necessary by a qualified medical practitioner.
                <span className="text-danger"> *</span>
              </label>
            </div>
            {hasError("medical_treatment_consent") && (
              <div className="text-danger small mt-1">
                {getFieldError("medical_treatment_consent")}
              </div>
            )}
          </div>

          {/* Photo and Video Consent Checkbox - OPTIONAL */}
          <div className="mb-4">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="photoVideoConsent"
                checked={
                  formData.personal_declaration?.photo_video_consent || false
                }
                onChange={(e) =>
                  handleCheckboxChange("photo_video_consent", e.target.checked)
                }
              />
              <label
                className="form-check-label fw-bold"
                htmlFor="photoVideoConsent"
              >
                I/We give permission to use my/our child's photo, video & work
                in any communication of the School in print and or electronic
                form including but not limited to the annual school magazines
                and publications, the school's official Facebook page and the
                School website.
              </label>
            </div>
          </div>

          <div className="row">
            {/* First Parent/Carer - REQUIRED */}
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="firstParentCarerName" className="form-label">
                  Name of first parent/carer{" "}
                  <span className="text-danger">*</span>
                </label>
                <input
                  id="firstParentCarerName"
                  type="text"
                  className={`form-control ${hasError("first_parent_carer_name") ? "is-invalid" : ""}`}
                  value={getFieldValue(
                    "personal_declaration",
                    "first_parent_carer_name"
                  )}
                  onChange={(e) => {
                    handleInputChange(
                      "personal_declaration",
                      "first_parent_carer_name",
                      e.target.value
                    );
                  }}
                  required={true}
                  maxLength={30}
                  placeholder="Enter full name"
                />
                {hasError("first_parent_carer_name") && (
                  <div className="invalid-feedback">
                    {getFieldError("first_parent_carer_name")}
                  </div>
                )}
              </div>
              <p className="small text-muted">
                <i>
                  (at least one of the student's parents/carers must sign the
                  enrolment form)
                </i>
              </p>
            </div>

            {/* First Parent Date */}
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="declarationDate1" className="form-label">
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  id="declarationDate1"
                  type="date"
                  className={`form-control ${hasError("first_parent_carer_name_date") ? "is-invalid" : ""}`}
                  value={getFieldValue(
                    "personal_declaration",
                    "first_parent_carer_name_date"
                  )}
                  onChange={(e) => {
                    handleInputChange(
                      "personal_declaration",
                      "first_parent_carer_name_date",
                      e.target.value
                    );
                  }}
                  required={true}
                  max={new Date().toISOString().split('T')[0]}
                />
                {hasError("first_parent_carer_name_date") && (
                  <div className="invalid-feedback">
                    {getFieldError("first_parent_carer_name_date")}
                  </div>
                )}
              </div>
            </div>

            {/* Second Parent/Carer - OPTIONAL */}
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="secondParentCarerName" className="form-label">
                  Name of second parent/carer (if applicable)
                </label>
                <input
                  id="secondParentCarerName"
                  type="text"
                  className={`form-control ${hasError("second_parent_carer_name") ? "is-invalid" : ""}`}
                  value={getFieldValue(
                    "personal_declaration",
                    "second_parent_carer_name"
                  )}
                  onChange={(e) => {
                    handleInputChange(
                      "personal_declaration",
                      "second_parent_carer_name",
                      e.target.value
                    );
                  }}
                  maxLength={30}
                  placeholder="Enter full name (optional)"
                />
                {hasError("second_parent_carer_name") && (
                  <div className="invalid-feedback">
                    {getFieldError("second_parent_carer_name")}
                  </div>
                )}
              </div>
            </div>

            {/* Second Parent Date - OPTIONAL */}
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="declarationDate2" className="form-label">
                  Date
                </label>
                <input
                  id="declarationDate2"
                  type="date"
                  className={`form-control ${hasError("second_parent_carer_name_date") ? "is-invalid" : ""}`}
                  value={getFieldValue(
                    "personal_declaration",
                    "second_parent_carer_name_date"
                  )}
                  onChange={(e) => {
                    handleInputChange(
                      "personal_declaration",
                      "second_parent_carer_name_date",
                      e.target.value
                    );
                  }}
                  max={new Date().toISOString().split('T')[0]}
                />
                {hasError("second_parent_carer_name_date") && (
                  <div className="invalid-feedback">
                    {getFieldError("second_parent_carer_name_date")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="container py-3 py-lg-5">
          {sectionError && (
            <div className="alert alert-danger" role="alert">
              {sectionError}
            </div>
          )}
          
          <div className="row">
            {loading && (
              <div className="container mb-3">
                <div className="alert alert-info" role="alert">
                  <div className="d-flex align-items-center">
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Submitting form, please wait...
                  </div>
                </div>
              </div>
            )}

            <div className="col-12 d-flex justify-content-center align-items-center z-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="btn globalbutton rounded-0 dark-text fw-bold fs-5 position-relative overflow-hidden"
                disabled={loading}
                style={{ minWidth: '200px' }}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    ></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Enrollment"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}