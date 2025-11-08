import React, { useState } from "react";
import TextInput from "../TextInput.jsx";
import { useEnrolmentForm } from "../../Context/EnrolmentFormContext";
import SelectInput from "../SelectInput.jsx";

export default function FamilyDetailsPhase3({ onNext }) {
  const relationOptions = [
    { value: "Father", label: "Father" },
    { value: "Mother", label: "Mother" },
    { value: "Guardian", label: "Guardian" },
    { value: "Brother", label: "Brother" },
    { value: "Sister", label: "Sister" },
    { value: "Grandfather", label: "Grandfather" },
    { value: "Grandmother", label: "Grandmother" },
    { value: "Uncle", label: "Uncle" },
    { value: "Aunt", label: "Aunt" },
  ];

  const { formData, updateFormData, validateField, getError } =
    useEnrolmentForm();
  const [sectionError, setSectionError] = useState("");

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

  // Check if a contact section is fully filled
  const isContactSectionFilled = (section) => {
    const sectionData = formData[section];

    // For first_contact and second_contact sections
    if (section === "first_contact" || section === "second_contact") {
      const requiredFields = ["parent_name", "mobile_phone", "email"];
      return requiredFields.every(
        (field) =>
          sectionData[field] !== null &&
          sectionData[field] !== undefined &&
          sectionData[field] !== ""
      );
    }

    // For parent_not_living section
    if (section === "parent_not_living") {
      const requiredFields = [
        "title",
        "gender",
        "relationship_to_student",
        "family_name",
        "given_name",
        "mobile_phone",
        "email",
      ];
      return requiredFields.every(
        (field) =>
          sectionData[field] !== null &&
          sectionData[field] !== undefined &&
          sectionData[field] !== ""
      );
    }

    // For emergency contact sections - only first_emergency_contact is required
    if (section === "first_emergency_contact") {
      const requiredFields = [
        "family_name",
        "given_name",
        "relationship_to_student",
        "mobile_phone",
      ];
      // Note: home_phone and work_phone are NOT required
      return requiredFields.every(
        (field) =>
          sectionData[field] !== null &&
          sectionData[field] !== undefined &&
          sectionData[field] !== ""
      );
    }

    // Second emergency contact is optional, so always return true
    if (section === "second_emergency_contact") {
      return true;
    }

    return false;
  };

  // Check if at least one contact section is fully filled
  const isAtLeastOneContactSectionFilled = () => {
    return (
      isContactSectionFilled("first_contact") ||
      isContactSectionFilled("second_contact") ||
      isContactSectionFilled("parent_not_living") ||
      isContactSectionFilled("first_emergency_contact")
      // second_emergency_contact is optional, not included in validation
    );
  };

  const handleNext = () => {
    // Check if at least one contact section is fully filled
    const hasAtLeastOneContactFilled = isAtLeastOneContactSectionFilled();

    if (hasAtLeastOneContactFilled) {
      setSectionError("");
      if (onNext) {
        onNext();
      }
    } else {
      setSectionError(
        "Please complete all fields in at least one contact section (First Contact, Second Contact, Parents not living with student, or First emergency contact) before proceeding to the next step."
      );
    }
  };

  return (
    <section className="container bg-light p-3">
      {/* Section E: Additional emergency contacts */}
      <div className="row mt-4">
        {/* <h2 className="h4 mb-3">E. Additional emergency contacts</h2> */}
        <p>
          <i>
            Please nominate two people over the age of 18 years who may be
            contacted in the event of an emergency if the community language
            school is unable to contact the parents/carers listed in Section C.
            Please ensure that you have discussed with these people their
            willingness to be emergency contacts.{" "}
          </i>
        </p>

        {/* First Emergency Contact - REQUIRED */}
        <h6 className="fw-bold mt-3">CONTACT DETAILS (first preference) *</h6>
        <div className="row">
          <div className="col-md-4">
            <TextInput
              id="firstEmergencyFamilyName"
              label="Family name"
              value={formData.first_emergency_contact.family_name}
              onChange={(value) =>
                handleInputChange(
                  "first_emergency_contact",
                  "family_name",
                  value
                )
              }
              onBlur={() =>
                handleBlur("first_emergency_contact", "family_name")
              }
              error={getError("first_emergency_contact", "family_name")}
              required
            />
          </div>
          <div className="col-md-4">
            <TextInput
              id="firstEmergencyGivenName"
              label="Given name"
              value={formData.first_emergency_contact.given_name}
              onChange={(value) =>
                handleInputChange(
                  "first_emergency_contact",
                  "given_name",
                  value
                )
              }
              onBlur={() => handleBlur("first_emergency_contact", "given_name")}
              error={getError("first_emergency_contact", "given_name")}
              required
            />
          </div>
          <div className="col-md-4">
            <SelectInput
              id="firstEmergencyRelationship"
              label="Relationship to student"
              placeholder="Select relationship"
              value={
                formData.first_emergency_contact.relationship_to_student || ""
              }
              onChange={(value) =>
                handleInputChange(
                  "first_emergency_contact",
                  "relationship_to_student",
                  value
                )
              }
              onBlur={() =>
                handleBlur("first_emergency_contact", "relationship_to_student")
              }
              error={getError(
                "first_emergency_contact",
                "relationship_to_student"
              )}
              required
              options={relationOptions}
            />
          </div>
          <div className="col-md-4">
            <TextInput
              id="firstEmergencyMobile"
              label="Phone number"
              note="(mobile)"
              value={formData.first_emergency_contact.mobile_phone}
              onChange={(value) =>
                handleInputChange(
                  "first_emergency_contact",
                  "mobile_phone",
                  value
                )
              }
              onBlur={() =>
                handleBlur("first_emergency_contact", "mobile_phone")
              }
              error={getError("first_emergency_contact", "mobile_phone")}
              required
            />
          </div>
          <div className="col-md-4">
            <TextInput
              id="firstEmergencyHome"
              label="Phone number"
              note="(home)"
              value={formData.first_emergency_contact.home_phone}
              onChange={(value) =>
                handleInputChange(
                  "first_emergency_contact",
                  "home_phone",
                  value
                )
              }
              onBlur={() => handleBlur("first_emergency_contact", "home_phone")}
              error={getError("first_emergency_contact", "home_phone")}
              // NOT required - optional field
            />
          </div>
          <div className="col-md-4">
            <TextInput
              id="firstEmergencyWork"
              label="Phone number"
              note="(work)"
              value={formData.first_emergency_contact.work_phone}
              onChange={(value) =>
                handleInputChange(
                  "first_emergency_contact",
                  "work_phone",
                  value
                )
              }
              onBlur={() => handleBlur("first_emergency_contact", "work_phone")}
              error={getError("first_emergency_contact", "work_phone")}
              // NOT required - optional field
            />
          </div>
        </div>

        {/* Second Emergency Contact - OPTIONAL */}
        <h6 className="fw-bold mt-3">CONTACT DETAILS (second preference)</h6>
        <div className="row">
          <div className="col-md-4">
            <TextInput
              id="secondEmergencyFamilyName"
              label="Family name"
              value={formData.second_emergency_contact.family_name}
              onChange={(value) =>
                handleInputChange(
                  "second_emergency_contact",
                  "family_name",
                  value
                )
              }
              onBlur={() =>
                handleBlur("second_emergency_contact", "family_name")
              }
              error={getError("second_emergency_contact", "family_name")}
              // NOT required - this entire section is optional
            />
          </div>
          <div className="col-md-4">
            <TextInput
              id="secondEmergencyGivenName"
              label="Given name"
              value={formData.second_emergency_contact.given_name}
              onChange={(value) =>
                handleInputChange(
                  "second_emergency_contact",
                  "given_name",
                  value
                )
              }
              onBlur={() =>
                handleBlur("second_emergency_contact", "given_name")
              }
              error={getError("second_emergency_contact", "given_name")}
              // NOT required - this entire section is optional
            />
          </div>
          <div className="col-md-4">
            <SelectInput
              id="secondEmergencyRelationship"
              label="Relationship to student"
              placeholder="Select relationship"
              value={
                formData.second_emergency_contact.relationship_to_student || ""
              }
              onChange={(value) =>
                handleInputChange(
                  "second_emergency_contact",
                  "relationship_to_student",
                  value
                )
              }
              onBlur={() =>
                handleBlur(
                  "second_emergency_contact",
                  "relationship_to_student"
                )
              }
              error={getError(
                "second_emergency_contact",
                "relationship_to_student"
              )}
              // NOT required - this entire section is optional
              options={relationOptions}
            />
          </div>
          <div className="col-md-4">
            <TextInput
              id="secondEmergencyMobile"
              label="Phone number"
              note="(mobile)"
              value={formData.second_emergency_contact.mobile_phone}
              onChange={(value) =>
                handleInputChange(
                  "second_emergency_contact",
                  "mobile_phone",
                  value
                )
              }
              onBlur={() =>
                handleBlur("second_emergency_contact", "mobile_phone")
              }
              error={getError("second_emergency_contact", "mobile_phone")}
              // NOT required - this entire section is optional
            />
          </div>

          <div className="col-md-4">
            <TextInput
              id="secondEmergencyHome"
              label="Phone number"
              note="(home)"
              value={formData.second_emergency_contact.home_phone}
              onChange={(value) =>
                handleInputChange(
                  "second_emergency_contact",
                  "home_phone",
                  value
                )
              }
              onBlur={() =>
                handleBlur("second_emergency_contact", "home_phone")
              }
              error={getError("second_emergency_contact", "home_phone")}
              // NOT required - this entire section is optional
            />
          </div>
          <div className="col-md-4">
            <TextInput
              id="secondEmergencyWork"
              label="Phone number"
              note="(work)"
              value={formData.second_emergency_contact.work_phone}
              onChange={(value) =>
                handleInputChange(
                  "second_emergency_contact",
                  "work_phone",
                  value
                )
              }
              onBlur={() =>
                handleBlur("second_emergency_contact", "work_phone")
              }
              error={getError("second_emergency_contact", "work_phone")}
              // NOT required - this entire section is optional
            />
          </div>
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