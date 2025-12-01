import React, { useState } from "react";
import TextInput from "../TextInput.jsx";
import RadioGroup from "../RadioGroup.jsx";
import SelectInput from "../SelectInput.jsx";
import { useEnrolmentForm } from "../../Context/EnrolmentFormContext.jsx";
import TextArea from "../TextArea.jsx";

export default function MedicalDetails({ onNext }) {
  const { formData, updateFormData, validateField, getError } =
    useEnrolmentForm();
  const [sectionError, setSectionError] = useState("");
  const [showAllErrors, setShowAllErrors] = useState(false);

  const handleInputChange = (section, field, value) => {
    updateFormData(section, field, value);
    if (sectionError) {
      setSectionError("");
    }
  };

  const handleBlur = (section, field) => {
    const value = formData[section][field];
    validateField(section, field, value);
  };

  // Validate all medical details fields and return validation results
  const validateAllMedicalFields = () => {
    const medicalData = formData.medical_details || {};
    let isValid = true;

    // Required radio fields
    const requiredRadioFields = [
      "asthma",
      "major_illness",
      "allergies",
      "special_learning_needs",
    ];

    // Validate each required field
    requiredRadioFields.forEach((field) => {
      const value = medicalData[field];
      if (!value || value === "") {
        validateField("medical_details", field, value);
        isValid = false;
      }
    });

    // If special learning needs is "Yes", validate the details field
    if (medicalData.special_learning_needs === "Yes") {
      if (
        !medicalData.special_learning_needs_details ||
        medicalData.special_learning_needs_details.trim() === ""
      ) {
        validateField(
          "medical_details",
          "special_learning_needs_details",
          medicalData.special_learning_needs_details
        );
        isValid = false;
      }
    }

    return isValid;
  };

  const handleNext = () => {
    // Validate all fields and show individual errors
    const isMedicalValid = validateAllMedicalFields();

    if (isMedicalValid) {
      setSectionError("");
      setShowAllErrors(false);
      if (onNext) {
        onNext();
      }
    } else {
      setShowAllErrors(true);
      setSectionError("Please complete all required fields before proceeding.");
    }
  };

  // Helper function to get error message - shows error if we're showing all errors or if field was touched
  const getFieldError = (section, field) => {
    return showAllErrors ? getError(section, field) : getError(section, field);
  };

  return (
    <section className="container enrol-form bg-light p-3">
      {/* Student Medical Details Section */}
      <div className="row mt-4">
        {/* <h2 className="h4 mb-3">Student Medical Details</h2> */}

        {/* Asthma */}
        <div className="row mb-3">
          <div className="col-12 col-md-4">
            <RadioGroup
              name="asthma"
              label="Does your child suffer from Asthma?"
              value={formData.medical_details?.asthma || ""}
              onChange={(value) =>
                handleInputChange("medical_details", "asthma", value)
              }
              onBlur={() => handleBlur("medical_details", "asthma")}
              error={getFieldError("medical_details", "asthma")}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              required
            />
          </div>
        </div>

        {/* Major Illness or Disability */}
        <div className="row mb-3">
          <div className="col-12 col-md-4">
            <RadioGroup
              name="majorIllness"
              label="Major Illness or disability"
              value={formData.medical_details?.major_illness || ""}
              onChange={(value) =>
                handleInputChange("medical_details", "major_illness", value)
              }
              onBlur={() => handleBlur("medical_details", "major_illness")}
              error={getFieldError("medical_details", "major_illness")}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              required
            />
          </div>
        </div>

        {/* Allergies */}
        <div className="row mb-3">
          <div className="col-12 col-md-4">
            <RadioGroup
              name="allergies"
              label="Allergies"
              value={formData.medical_details?.allergies || ""}
              onChange={(value) =>
                handleInputChange("medical_details", "allergies", value)
              }
              onBlur={() => handleBlur("medical_details", "allergies")}
              error={getFieldError("medical_details", "allergies")}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              required
            />
          </div>
        </div>

        {/* Special Learning Needs - This one keeps the text area */}
        <div className="row mb-3">
          <div className="col-12">
            <RadioGroup
              name="specialLearningNeeds"
              label="Does the student identify as 'Children with special learning needs' at the mainstream school?"
              value={formData.medical_details?.special_learning_needs || ""}
              onChange={(value) =>
                handleInputChange(
                  "medical_details",
                  "special_learning_needs",
                  value
                )
              }
              onBlur={() =>
                handleBlur("medical_details", "special_learning_needs")
              }
              error={getFieldError("medical_details", "special_learning_needs")}
              options={[
                { value: "Yes", label: "Yes" },
                { value: "No", label: "No" },
              ]}
              required
            />
          </div>
          {formData.medical_details?.special_learning_needs === "Yes" && (
            <div className="col-12 mt-2">
              <TextArea
                id="specialLearningNeedsDetails"
                label="If YES, please provide detail of the special need requirement"
                value={
                  formData.medical_details?.special_learning_needs_details || ""
                }
                onChange={(value) =>
                  handleInputChange(
                    "medical_details",
                    "special_learning_needs_details",
                    value
                  )
                }
                onBlur={() =>
                  handleBlur(
                    "medical_details",
                    "special_learning_needs_details"
                  )
                }
                error={getFieldError(
                  "medical_details",
                  "special_learning_needs_details"
                )}
                multiline
                rows={4}
                required
              />
            </div>
          )}
        </div>
      </div>

      {/* Section Error Message above the button */}
      {sectionError && (
        <div className="container py-3">
          <div className="row">
            <div className="col-12">
              <div className="alert alert-danger" role="alert">
                {sectionError}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="container py-3 py-lg-5">
        <div className="row">
          <div className="col-12 d-flex justify-content-center align-items-center z-2">
            <button
              type="button"
              onClick={handleNext}
              className="btn globalbutton rounded-0 dark-text fw-bold fs-5 position-relative overflow-hidden"
            >
              Move to next step
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
