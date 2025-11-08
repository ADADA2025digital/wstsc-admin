import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useEnrolmentForm } from "../../Context/EnrolmentFormContext";

export default function PersonalInfoAndDeclaration() {
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
  } = useEnrolmentForm();
  const [sectionError, setSectionError] = useState("");
  const [showAllErrors, setShowAllErrors] = useState(false);
  const navigate = useNavigate();

  // Simple direct input change handler
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

  // Enhanced success handler
  useEffect(() => {
    if (success && submissionResult) {
      console.log("✅ Form submitted successfully:", submissionResult);
      
      const alert = Swal.fire({
        title: "Success!",
        text: `Student enrollment submitted successfully and is pending approval. Enrollment ID: ${submissionResult.enrollment_id}`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#3085d6",
        timer: 5000,
        timerProgressBar: true,
        showConfirmButton: true,
      });

      alert.then((result) => {
        navigate("/");
      });
    }
  }, [success, submissionResult, navigate]);

  // Show error alert if there's an error
  useEffect(() => {
    if (error && !loading) {
      Swal.fire({
        title: "Error!",
        text: error,
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#d33",
      });
    }
  }, [error, loading]);

  // Simple validation functions
  const validateName = (value, isRequired = true) => {
    if (!value || value.toString().trim() === "") {
      return isRequired ? "This field is required" : null;
    }
    if (/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value.toString())) {
      return "Name should not contain numbers or symbols";
    }
    return null;
  };

  const validateDate = (value, isRequired = true) => {
    if (!value || value.toString().trim() === "") {
      return isRequired ? "This field is required" : null;
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

    // ONLY validate the personal declaration section
    const isPersonalDeclarationValid = validateSection("personal_declaration");

    // Check required fields for personal declaration (only first parent required)
    const requiredFields = [
      "first_parent_carer_name",
      "first_parent_carer_name_date",
      "photo_video_consent",
      "medical_treatment_consent",
    ];
    const missingFields = requiredFields.filter(
      (field) =>
        !formData.personal_declaration?.[field] ||
        formData.personal_declaration[field]?.toString().trim() === ""
    );

    if (isPersonalDeclarationValid && missingFields.length === 0) {
      setSectionError("");
      try {
        console.log("🔄 Starting form submission...");
        await submitForm(true);
        // Success handling is now in the useEffect above
      } catch (err) {
        console.error("❌ Submission error:", err);
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
      const errorMessage =
        "Please complete all required fields in the personal declaration before submitting the form.";
      setSectionError(errorMessage);

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

          {/* Medical Treatment Consent Checkbox */}
          <div className="mb-4">
            <div className="form-check">
              <input
                className="form-check-input"
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
              </label>
            </div>
            {showAllErrors &&
              validateCheckbox(
                formData.personal_declaration?.medical_treatment_consent,
                true
              ) && (
                <div className="text-danger small mt-1">
                  {validateCheckbox(
                    formData.personal_declaration?.medical_treatment_consent,
                    true
                  )}
                </div>
              )}
          </div>

          {/* Photo and Video Consent Checkbox */}
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
            {showAllErrors &&
              validateCheckbox(
                formData.personal_declaration?.photo_video_consent,
                true
              ) && (
                <div className="text-danger small mt-1">
                  {validateCheckbox(
                    formData.personal_declaration?.photo_video_consent,
                    true
                  )}
                </div>
              )}
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
                  className={`form-control ${
                    showAllErrors &&
                    (getError(
                      "personal_declaration",
                      "first_parent_carer_name"
                    ) ||
                      validateName(
                        getFieldValue(
                          "personal_declaration",
                          "first_parent_carer_name"
                        ),
                        true
                      ))
                      ? "is-invalid"
                      : ""
                  }`}
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
                />
                {showAllErrors &&
                  (getError(
                    "personal_declaration",
                    "first_parent_carer_name"
                  ) ||
                    validateName(
                      getFieldValue(
                        "personal_declaration",
                        "first_parent_carer_name"
                      ),
                      true
                    )) && (
                    <div className="invalid-feedback">
                      {getError(
                        "personal_declaration",
                        "first_parent_carer_name"
                      ) ||
                        validateName(
                          getFieldValue(
                            "personal_declaration",
                            "first_parent_carer_name"
                          ),
                          true
                        )}
                    </div>
                  )}
              </div>
              <p className="small">
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
                  className={`form-control ${
                    showAllErrors &&
                    (getError(
                      "personal_declaration",
                      "first_parent_carer_name_date"
                    ) ||
                      validateDate(
                        getFieldValue(
                          "personal_declaration",
                          "first_parent_carer_name_date"
                        ),
                        true
                      ))
                      ? "is-invalid"
                      : ""
                  }`}
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
                />
                {showAllErrors &&
                  (getError(
                    "personal_declaration",
                    "first_parent_carer_name_date"
                  ) ||
                    validateDate(
                      getFieldValue(
                        "personal_declaration",
                        "first_parent_carer_name_date"
                      ),
                      true
                    )) && (
                    <div className="invalid-feedback">
                      {getError(
                        "personal_declaration",
                        "first_parent_carer_name_date"
                      ) ||
                        validateDate(
                          getFieldValue(
                            "personal_declaration",
                            "first_parent_carer_name_date"
                          ),
                          true
                        )}
                    </div>
                  )}
              </div>
            </div>

            {/* Second Parent/Carer - OPTIONAL (No validation) */}
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="secondParentCarerName" className="form-label">
                  Name of second parent/carer (if applicable)
                </label>
                <input
                  id="secondParentCarerName"
                  type="text"
                  className="form-control"
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
                />
                {/* No validation errors shown for optional field */}
              </div>
            </div>

            {/* Second Parent Date - OPTIONAL (No validation) */}
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="declarationDate2" className="form-label">
                  Date
                </label>
                <input
                  id="declarationDate2"
                  type="date"
                  className="form-control"
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
                />
                {/* No validation errors shown for optional field */}
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
              <div className="container">
                <div className="alert alert-info" role="alert">
                  Submitting form, please wait...
                </div>
              </div>
            )}

            <div className="col-12 d-flex justify-content-center align-items-center z-2">
              <button
                type="button"
                onClick={handleSubmit}
                className="btn globalbutton rounded-0 dark-text fw-bold fs-5 position-relative overflow-hidden"
                disabled={loading}
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