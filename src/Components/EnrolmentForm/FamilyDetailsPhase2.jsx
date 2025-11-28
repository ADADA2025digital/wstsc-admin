import React, { useState, useEffect } from "react";
import TextInput from "../TextInput.jsx";
import TextArea from "../TextArea.jsx";
import RadioGroup from "../RadioGroup.jsx";
import SelectInput from "../SelectInput.jsx";
import { useEnrolmentForm } from "../../Context/EnrolmentFormContext";
import api from "../../config/axiosConfig.jsx";
import { Country, State, City } from "country-state-city";

export default function FamilyDetailsPhase2({ onNext }) {
  const genderOptions = [
    { value: "Female", label: "Female" },
    { value: "Male", label: "Male" },
    { value: "Others", label: "Others" },
  ];

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

  const maritalStatusOptions = [
    { value: "Single", label: "Single" },
    { value: "Married", label: "Married" },
    { value: "Divorced", label: "Divorced" },
    { value: "Widowed", label: "Widowed" },
    { value: "Separated", label: "Separated" },
    { value: "De facto", label: "De facto" },
  ];

  const addressTypeOptions = [
    { value: "home", label: "Home" },
    { value: "work", label: "Work" },
    { value: "other", label: "Other" },
  ];

  const nationalities = [
    "Afghan",
    "Albanian",
    "Algerian",
    "American",
    "Andorran",
    "Angolan",
    "Anguillan",
    "Argentine",
    "Armenian",
    "Australian",
    "Austrian",
    "Azerbaijani",
    "Bahamian",
    "Bahraini",
    "Bangladeshi",
    "Barbadian",
    "Belarusian",
    "Belgian",
    "Belizean",
    "Beninese",
    "Bermudian",
    "Bhutanese",
    "Bolivian",
    "Botswanan",
    "Brazilian",
    "British",
    "British Virgin Islander",
    "Bruneian",
    "Bulgarian",
    "Burkinan",
    "Burmese",
    "Burundian",
    "Cambodian",
    "Cameroonian",
    "Canadian",
    "Cape Verdean",
    "Cayman Islander",
    "Central African",
    "Chadian",
    "Chilean",
    "Chinese",
    "Citizen of Antigua and Barbuda",
    "Citizen of Bosnia and Herzegovina",
    "Citizen of Guinea-Bissau",
    "Citizen of Kiribati",
    "Citizen of Seychelles",
    "Citizen of the Dominican Republic",
    "Citizen of Vanuatu ",
    "Colombian",
    "Comoran",
    "Congolese (Congo)",
    "Congolese (DRC)",
    "Cook Islander",
    "Costa Rican",
    "Croatian",
    "Cuban",
    "Cymraes",
    "Cymro",
    "Cypriot",
    "Czech",
    "Danish",
    "Djiboutian",
    "Dominican",
    "Dutch",
    "East Timorese",
    "Ecuadorean",
    "Egyptian",
    "Emirati",
    "English",
    "Equatorial Guinean",
    "Eritrean",
    "Estonian",
    "Ethiopian",
    "Faroese",
    "Fijian",
    "Filipino",
    "Finnish",
    "French",
    "Gabonese",
    "Gambian",
    "Georgian",
    "German",
    "Ghanaian",
    "Gibraltarian",
    "Greek",
    "Greenlandic",
    "Grenadian",
    "Guamanian",
    "Guatemalan",
    "Guinean",
    "Guyanese",
    "Haitian",
    "Honduran",
    "Hong Konger",
    "Hungarian",
    "Icelandic",
    "Indian",
    "Indonesian",
    "Iranian",
    "Iraqi",
    "Irish",
    "Israeli",
    "Italian",
    "Ivorian",
    "Jamaican",
    "Japanese",
    "Jordanian",
    "Kazakh",
    "Kenyan",
    "Kittitian",
    "Kosovan",
    "Kuwaiti",
    "Kyrgyz",
    "Lao",
    "Latvian",
    "Lebanese",
    "Liberian",
    "Libyan",
    "Liechtenstein citizen",
    "Lithuanian",
    "Luxembourger",
    "Macanese",
    "Macedonian",
    "Malagasy",
    "Malawian",
    "Malaysian",
    "Maldivian",
    "Malian",
    "Maltese",
    "Marshallese",
    "Martiniquais",
    "Mauritanian",
    "Mauritian",
    "Mexican",
    "Micronesian",
    "Moldovan",
    "Monegasque",
    "Mongolian",
    "Montenegrin",
    "Montserratian",
    "Moroccan",
    "Mosotho",
    "Mozambican",
    "Namibian",
    "Nauruan",
    "Nepalese",
    "New Zealander",
    "Nicaraguan",
    "Nigerian",
    "Nigerien",
    "Niuean",
    "North Korean",
    "Northern Irish",
    "Norwegian",
    "Omani",
    "Pakistani",
    "Palauan",
    "Palestinian",
    "Panamanian",
    "Papua New Guinean",
    "Paraguayan",
    "Peruvian",
    "Pitcairn Islander",
    "Polish",
    "Portuguese",
    "Prydeinig",
    "Puerto Rican",
    "Qatari",
    "Romanian",
    "Russian",
    "Rwandan",
    "Salvadorean",
    "Sammarinese",
    "Samoan",
    "Sao Tomean",
    "Saudi Arabian",
    "Scottish",
    "Senegalese",
    "Serbian",
    "Sierra Leonean",
    "Singaporean",
    "Slovak",
    "Slovenian",
    "Solomon Islander",
    "Somali",
    "South African",
    "South Korean",
    "South Sudanese",
    "Spanish",
    "Sri Lankan",
    "St Helenian",
    "St Lucian",
    "Stateless",
    "Sudanese",
    "Surinamese",
    "Swazi",
    "Swedish",
    "Swiss",
    "Syrian",
    "Taiwanese",
    "Tajik",
    "Tanzanian",
    "Thai",
    "Togolese",
    "Tongan",
    "Trinidadian",
    "Tristanian",
    "Tunisian",
    "Turkish",
    "Turkmen",
    "Turks and Caicos Islander",
    "Tuvaluan",
    "Ugandan",
    "Ukrainian",
    "Uruguayan",
    "Uzbek",
    "Vatican citizen",
    "Venezuelan",
    "Vietnamese",
    "Vincentian",
    "Wallisian",
    "Welsh",
    "Yemeni",
    "Zambian",
    "Zimbabwean",
  ];

  const nationalityOptions = nationalities.map((n) => ({
    value: n,
    label: n,
  }));

  // Get countries from country-state-city
  const countryOptions = Country.getAllCountries().map((country) => ({
    value: country.isoCode,
    label: country.name,
  }));

  // Get Australian states from country-state-city
  const stateOptions = State.getStatesOfCountry("AU").map((state) => ({
    value: state.isoCode,
    label: state.name,
  }));

  const {
    formData,
    updateFormData,
    validateField,
    getError,
    validateSection,
    errors,
  } = useEnrolmentForm();
  const [sectionError, setSectionError] = useState("");
  const [showCarer2, setShowCarer2] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    parent_carer_1: {},
    parent_carer_2: {},
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showProfileUpdateModal, setShowProfileUpdateModal] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // State for dynamic suburb options
  const [suburbOptions, setSuburbOptions] = useState({
    parent_carer_1: [],
    parent_carer_2: [],
  });

  // Improved version of hasOnlyBasicInfo
  const hasOnlyBasicInfo = (profile) => {
    if (!profile) return false;

    const basicFields = ["first_name", "last_name", "email"];
    const importantFields = ["phone", "date_of_birth", "occupation"];

    // Check if basic fields are populated
    const hasBasicInfo = basicFields.every(
      (field) => profile[field] && profile[field].trim() !== ""
    );

    if (!hasBasicInfo) return false;

    // Count how many important fields are missing
    const missingImportantCount = importantFields.filter(
      (field) => !profile[field] || profile[field].toString().trim() === ""
    ).length;

    // Also check if address is substantially complete
    const hasSubstantialAddress =
      profile.address &&
      profile.address.address_line1 &&
      profile.address.city &&
      profile.address.postal_code;

    // If more than 2 important fields are missing OR address is incomplete, show modal
    return missingImportantCount > 2 || !hasSubstantialAddress;
  };

  // Modified fetchProfileData to be reusable
  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/profile/person");

      if (response.data.success && response.data.data.profile) {
        const profileData = response.data.data.profile;
        setProfileData(profileData);

        // Check if user has chosen to not see the modal again
        const dontShowModal =
          localStorage.getItem("dontShowProfileModal") === "true";

        // Check if profile has only basic information
        if (hasOnlyBasicInfo(profileData) && !dontShowModal) {
          setShowProfileUpdateModal(true);
        } else {
          setShowProfileUpdateModal(false);
          autoFillParentData(profileData);
        }
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setShowProfileUpdateModal(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for returning from profile update on component mount
  useEffect(() => {
    const checkReturnFromProfileUpdate = async () => {
      const wasUpdatingProfile = localStorage.getItem("wasUpdatingProfile");
      const urlParams = new URLSearchParams(window.location.search);
      const profileUpdated = urlParams.get("profileUpdated");

      if (wasUpdatingProfile === "true" || profileUpdated === "true") {
        // User just returned from profile update
        localStorage.removeItem("wasUpdatingProfile");

        // Clean URL parameters
        if (profileUpdated) {
          const newUrl =
            window.location.pathname +
            window.location.search.replace(/[?&]profileUpdated=true/, "");
          window.history.replaceState({}, "", newUrl);
        }

        // Refresh profile data
        await fetchProfileData();
      } else {
        // Normal load, fetch profile data
        await fetchProfileData();
      }
    };

    checkReturnFromProfileUpdate();
  }, []);

  // Refresh profile data when component becomes visible (user returns from profile update)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Check if we should refresh (user might have updated profile in another tab)
        const shouldRefresh = localStorage.getItem("shouldRefreshProfile");
        if (shouldRefresh === "true") {
          localStorage.removeItem("shouldRefreshProfile");
          await fetchProfileData();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Load suburbs when state changes for a specific parent
  useEffect(() => {
    const loadSuburbsForParent = (section) => {
      const stateCode = formData[section]?.state;
      const countryCode = "AU"; // Assuming Australia for this form

      if (stateCode) {
        const cities = City.getCitiesOfState(countryCode, stateCode);
        const suburbOptions = cities.map((city) => ({
          value: city.name,
          label: city.name,
        }));

        setSuburbOptions((prev) => ({
          ...prev,
          [section]: suburbOptions,
        }));
      } else {
        setSuburbOptions((prev) => ({
          ...prev,
          [section]: [],
        }));
      }
    };

    loadSuburbsForParent("parent_carer_1");
    if (showCarer2) {
      loadSuburbsForParent("parent_carer_2");
    }
  }, [
    formData.parent_carer_1?.state,
    formData.parent_carer_2?.state,
    showCarer2,
  ]);

  // Function to auto-fill parent data from API response
  const autoFillParentData = (profileData) => {
    // Map API response to form fields for parent_carer_1
    const fieldMappings = {
      // Personal details
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      middle_name: profileData.middle_name,
      gender: profileData.gender
        ? profileData.gender.charAt(0).toUpperCase() +
          profileData.gender.slice(1)
        : "",
      email: profileData.email,
      mobile_phone: profileData.phone,
      alternative_phone: profileData.alternate_phone,
      date_of_birth: profileData.date_of_birth,
      nationality: profileData.nationality,
      marital_status: profileData.marital_status,
      occupation: profileData.occupation,

      // Address details
      street_number: extractStreetNumber(profileData.address?.address_line1),
      street_name: extractStreetName(profileData.address?.address_line1),
      suburb: profileData.address?.city,
      state: mapStateToIsoCode(profileData.address?.state),
      postal_code: profileData.address?.postal_code,
      country: profileData.address?.country || "AU",
      address_type: profileData.address?.address_type || "home",
    };

    // Update form data for parent_carer_1
    Object.entries(fieldMappings).forEach(([field, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        updateFormData("parent_carer_1", field, value);
      }
    });

    // Set relationship based on gender if not already set
    if (!formData.parent_carer_1.relationship_to_student) {
      let relationship = "Guardian"; // default
      if (profileData.gender === "female") {
        relationship = "Mother";
      } else if (profileData.gender === "male") {
        relationship = "Father";
      }
      updateFormData("parent_carer_1", "relationship_to_student", relationship);
    }
  };

  // Helper function to extract street number from address_line1
  const extractStreetNumber = (addressLine) => {
    if (!addressLine) return "";
    const match = addressLine.match(/^(\d+)/);
    return match ? match[1] : "";
  };

  // Helper function to extract street name from address_line1
  const extractStreetName = (addressLine) => {
    if (!addressLine) return "";
    // Remove the street number and trim
    return addressLine.replace(/^\d+\s*/, "").trim();
  };

  // Helper function to map state names to ISO codes
  const mapStateToIsoCode = (stateName) => {
    if (!stateName) return "";

    const stateMap = {
      "New South Wales": "NSW",
      Victoria: "VIC",
      Queensland: "QLD",
      "Western Australia": "WA",
      "South Australia": "SA",
      Tasmania: "TAS",
      "Australian Capital Territory": "ACT",
      "Northern Territory": "NT",
      NSW: "NSW",
      VIC: "VIC",
      QLD: "QLD",
      WA: "WA",
      SA: "SA",
      TAS: "TAS",
      ACT: "ACT",
      NT: "NT",
    };

    return stateMap[stateName] || "";
  };

  const handleInputChange = (section, field, value) => {
    updateFormData(section, field, value);
    if (sectionError) {
      setSectionError("");
    }
  };

  const handleBlur = (section, field) => {
    const value = formData[section]?.[field];
    validateField(section, field, value);

    // Mark field as touched
    setTouchedFields((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: true,
      },
    }));
  };

  // Handle Update Profile action
  const handleUpdateProfile = () => {
    // Set flag to indicate user is going to update profile
    localStorage.setItem("wasUpdatingProfile", "true");
    localStorage.setItem("shouldRefreshProfile", "true");

    // Redirect to profile edit page with return URL
    const returnUrl = encodeURIComponent(
      window.location.href +
        (window.location.search ? "&" : "?") +
        "profileUpdated=true"
    );
    window.location.href = `/update-profile?return=${returnUrl}`;
  };

  // Handle Continue Anyway action
  const handleContinueAnyway = () => {
    if (dontShowAgain) {
      localStorage.setItem("dontShowProfileModal", "true");
    }
    setShowProfileUpdateModal(false);
    // Auto-fill whatever data we have
    if (profileData) {
      autoFillParentData(profileData);
    }
  };

  // Helper function to determine if field should show as required
  const shouldShowRequired = (section, field) => {
    // For carer 1, show required for specific fields
    if (section === "parent_carer_1") {
      const requiredFields = [
        "title",
        "gender",
        "relationship_to_student",
        "first_name",
        "last_name",
        "country_of_birth",
        "date_of_birth",
        "nationality",
        "email",
        "mobile_phone",
        "marital_status",
        "occupation",
        "street_name",
        "state",
        "postal_code",
        // "suburb" REMOVED - now optional
      ];
      return requiredFields.includes(field);
    }

    // For carer 2, never show required since all fields are optional
    return false;
  };

  // Check if a parent section is fully validated (no errors)
  const isParentSectionValid = (section) => {
    // Required fields for carer 1
    const requiredFieldsCarer1 = [
      "title",
      "gender",
      "relationship_to_student",
      "first_name",
      "last_name",
      "country_of_birth",
      "date_of_birth",
      "nationality",
      "email",
      "mobile_phone",
      "marital_status",
      "occupation",
      "street_name",
      "state",
      "postal_code",
      // "suburb" REMOVED - now optional
    ];

    const fieldsToCheck =
      section === "parent_carer_1" ? requiredFieldsCarer1 : [];

    const missingFields = [];
    const isValid = fieldsToCheck.every((field) => {
      const value = formData[section]?.[field];
      const hasValue = value !== null && value !== undefined && value !== "";
      if (!hasValue) {
        missingFields.push(field);
      }
      return hasValue;
    });

    if (!isValid) {
      console.log(`Missing fields in ${section}:`, missingFields);
    }

    return isValid;
  };

  const handleNext = () => {
    // First, validate all visible sections
    let hasParent1Errors = false;
    let hasParent2Errors = false;

    // Debug arrays to track which fields are failing
    const parent1FailedFields = [];

    // Validate parent/carer 1 - only required fields
    const requiredFieldsCarer1 = [
      "title",
      "gender",
      "relationship_to_student",
      "first_name",
      "last_name",
      "country_of_birth",
      "date_of_birth",
      "nationality",
      "email",
      "mobile_phone",
      "marital_status",
      "occupation",
      "street_name",
      "state",
      "postal_code",
      // "suburb" REMOVED - now optional
    ];

    requiredFieldsCarer1.forEach((field) => {
      const value = formData.parent_carer_1[field];
      const isValid = validateField("parent_carer_1", field, value);
      if (!isValid) {
        hasParent1Errors = true;
        parent1FailedFields.push({
          field,
          value,
          error: getError("parent_carer_1", field),
        });
      }
    });

    // Validate optional fields for carer 1 (only if they have values)
    const optionalFieldsCarer1 = ["suburb", "middle_name", "alternative_phone", "address_type", "street_number"];
    optionalFieldsCarer1.forEach((field) => {
      const value = formData.parent_carer_1[field];
      // Only validate if field has value (all fields are optional)
      if (value && value !== "") {
        if (!validateField("parent_carer_1", field, value)) {
          hasParent1Errors = true;
          parent1FailedFields.push({
            field,
            value,
            error: getError("parent_carer_1", field),
          });
        }
      }
    });

    // Validate parent/carer 2 if shown - all fields are optional
    if (showCarer2) {
      const optionalFieldsCarer2 = [
        "title",
        "gender",
        "relationship_to_student",
        "first_name",
        "last_name",
        "country_of_birth",
        "date_of_birth",
        "nationality",
        "email",
        "mobile_phone",
        "marital_status",
        "occupation",
        "street_number",
        "street_name",
        "suburb",
        "state",
        "postal_code",
        "country",
      ];

      optionalFieldsCarer2.forEach((field) => {
        const value = formData.parent_carer_2[field];
        // Only validate if field has value (all fields are optional)
        if (value && value !== "") {
          if (!validateField("parent_carer_2", field, value)) {
            hasParent2Errors = true;
          }
        }
      });
    }

    // Check if sections are complete (have values for required fields)
    const hasParent1Complete = isParentSectionValid("parent_carer_1");
    const hasParent2Complete = showCarer2
      ? Object.keys(formData.parent_carer_2).some(
          (key) =>
            formData.parent_carer_2[key] && formData.parent_carer_2[key] !== ""
        )
      : false;

    console.log("=== DETAILED VALIDATION RESULTS ===");
    console.log("Parent 1 Complete:", hasParent1Complete);
    console.log("Parent 1 Errors:", hasParent1Errors);
    console.log("Parent 1 Failed Fields:", parent1FailedFields);
    console.log("Form Data Parent 1:", formData.parent_carer_1);
    console.log("All Errors:", errors);
    console.log("===================================");

    // User can proceed if at least one parent section is complete AND has no errors
    const canProceed =
      (hasParent1Complete && !hasParent1Errors) ||
      (showCarer2 && hasParent2Complete && !hasParent2Errors);

    if (canProceed) {
      setSectionError("");
      if (onNext) {
        onNext();
      }
    } else {
      // Provide more specific error message
      let errorMessage =
        "Please complete all required fields for Parent/Carer 1";

      if (hasParent1Errors) {
        errorMessage =
          "Please fix the validation errors in Parent/Carer 1 details";

        // Add specific field information if available
        if (parent1FailedFields.length > 0) {
          errorMessage += `\nErrors in: ${parent1FailedFields
            .map((f) => f.field)
            .join(", ")}`;
        }
      } else if (!hasParent1Complete) {
        errorMessage = "Please complete all required fields for Parent/Carer 1";
      }

      setSectionError(errorMessage);
    }
  };

  // Handle checkbox change for showing carer 2
  const handleShowCarer2Change = (checked) => {
    setShowCarer2(checked);
    // Clear any existing errors for carer 2 when hiding the section
    if (!checked) {
      setSectionError("");
    }
  };

  // Show loading state while fetching data
  if (isLoading) {
    return (
      <section className="container bg-light p-3">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading parent details...</span>
          </div>
          <span className="ms-3">Loading parent details...</span>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Profile Update Modal */}
      {showProfileUpdateModal && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
          aria-modal="true"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-check text-primary me-2"></i>
                  Complete Your Profile
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleContinueAnyway}
                ></button>
              </div>

              <div className="modal-body text-center">
                <div className="mb-3">
                  <i
                    className="bi bi-info-circle text-primary"
                    style={{ fontSize: "3rem" }}
                  ></i>
                </div>

                <h6 className="mb-3">Your profile needs more information</h6>

                <p className="text-muted small">
                  We noticed you only have basic information (name and email) in
                  your profile. To complete the enrolment process smoothly, we
                  recommend updating your profile with additional details like
                  phone number, address, date of birth, and other important
                  information.
                </p>

                <div className="alert alert-warning small mt-3" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Note:</strong> A complete profile will auto-fill most
                  of the parent details below.
                </div>

                <div className="form-check text-start mt-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="dontShowAgain"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                  />
                  <label
                    className="form-check-label small"
                    htmlFor="dontShowAgain"
                  >
                    Don't show this message again
                  </label>
                </div>
              </div>

              <div className="modal-footer justify-content-between">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleContinueAnyway}
                >
                  <i className="bi bi-arrow-right-circle me-2"></i> Continue
                  Anyway
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateProfile}
                >
                  <i className="bi bi-person-gear me-2"></i> Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="container bg-light p-3">
        <h2 className="h4 mb-3">
          Parent/Carer 1 with whom this student normally lives
        </h2>

        {/* Personal Details */}
        <div className="row align-items-end gap-4 mb-4">
          <div className="col-md-2">
            <SelectInput
              id="title1"
              label="Title"
              note="(eg Mr/Ms/Mrs/Dr)"
              placeholder="Select title"
              value={formData.parent_carer_1.title}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "title", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "title")}
              error={getError("parent_carer_1", "title")}
              required={shouldShowRequired("parent_carer_1", "title")}
              options={[
                { value: "Mr", label: "Mr" },
                { value: "Ms", label: "Ms" },
                { value: "Mrs", label: "Mrs" },
                { value: "Miss", label: "Miss" },
                { value: "Dr", label: "Dr" },
                { value: "Prof", label: "Prof" },
                { value: "Rev", label: "Rev" },
              ]}
            />
          </div>
          <div className="col-md-3">
            <TextInput
              id="firstname1"
              label="First name"
              value={formData.parent_carer_1.first_name}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "first_name", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "first_name")}
              error={getError("parent_carer_1", "first_name")}
              required={shouldShowRequired("parent_carer_1", "first_name")}
            />
          </div>
          <div className="col-md-3">
            <TextInput
              id="lastname1"
              label="Last name"
              value={formData.parent_carer_1.last_name}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "last_name", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "last_name")}
              error={getError("parent_carer_1", "last_name")}
              required={shouldShowRequired("parent_carer_1", "last_name")}
            />
          </div>
          <div className="col-md-3">
            <TextInput
              id="middlename1"
              label="Middle name"
              value={formData.parent_carer_1.middle_name}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "middle_name", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "middle_name")}
              error={getError("parent_carer_1", "middle_name")}
              required={shouldShowRequired("parent_carer_1", "middle_name")}
            />
          </div>
        </div>

        <div className="row align-items-end gap-4 mb-4">
          <div className="col-md-2">
            <SelectInput
              id="gender1"
              label="Gender"
              placeholder="Select gender"
              value={formData.parent_carer_1.gender || ""}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "gender", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "gender")}
              error={getError("parent_carer_1", "gender")}
              required={shouldShowRequired("parent_carer_1", "gender")}
              options={genderOptions}
            />
          </div>
          <div className="col-md-3">
            <SelectInput
              id="relationshiptostudent1"
              label="Relationship to student"
              placeholder="Select relationship"
              value={formData.parent_carer_1.relationship_to_student || ""}
              onChange={(value) =>
                handleInputChange(
                  "parent_carer_1",
                  "relationship_to_student",
                  value
                )
              }
              onBlur={() =>
                handleBlur("parent_carer_1", "relationship_to_student")
              }
              error={getError("parent_carer_1", "relationship_to_student")}
              required={shouldShowRequired(
                "parent_carer_1",
                "relationship_to_student"
              )}
              options={relationOptions}
            />
          </div>
          <div className="col-md-3">
            <TextInput
              id="dateofbirth1"
              label="Date of Birth"
              type="date"
              value={formData.parent_carer_1.date_of_birth}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "date_of_birth", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "date_of_birth")}
              error={getError("parent_carer_1", "date_of_birth")}
              required={shouldShowRequired("parent_carer_1", "date_of_birth")}
            />
          </div>
          <div className="col-md-3">
            <SelectInput
              id="countryofbirth1"
              label="Country of birth"
              placeholder="Select country"
              value={formData.parent_carer_1.country_of_birth || ""}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "country_of_birth", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "country_of_birth")}
              error={getError("parent_carer_1", "country_of_birth")}
              required={shouldShowRequired(
                "parent_carer_1",
                "country_of_birth"
              )}
              options={countryOptions}
            />
          </div>
        </div>

        <div className="row align-items-end gap-4 mb-4">
          <div className="col-md-2">
            <SelectInput
              id="nationality1"
              label="Nationality"
              placeholder="Select nationality"
              value={formData.parent_carer_1.nationality || ""}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "nationality", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "nationality")}
              error={getError("parent_carer_1", "nationality")}
              required={shouldShowRequired("parent_carer_1", "nationality")}
              options={nationalityOptions}
            />
          </div>
          <div className="col-md-3">
            <TextInput
              id="email1"
              label="Email"
              type="email"
              value={formData.parent_carer_1.email}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "email", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "email")}
              error={getError("parent_carer_1", "email")}
              required={shouldShowRequired("parent_carer_1", "email")}
            />
          </div>
          <div className="col-md-3">
            <TextInput
              id="mobilephone1"
              label="Mobile Phone"
              value={formData.parent_carer_1.mobile_phone}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "mobile_phone", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "mobile_phone")}
              error={getError("parent_carer_1", "mobile_phone")}
              required={shouldShowRequired("parent_carer_1", "mobile_phone")}
            />
          </div>
          <div className="col-md-3">
            <TextInput
              id="altphone1"
              label="Alternative Phone"
              value={formData.parent_carer_1.alternative_phone}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "alternative_phone", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "alternative_phone")}
              error={getError("parent_carer_1", "alternative_phone")}
              required={shouldShowRequired(
                "parent_carer_1",
                "alternative_phone"
              )}
            />
          </div>
        </div>

        <div className="row align-items-end gap-4 mb-4">
          <div className="col-md-2">
            <SelectInput
              id="maritalstatus1"
              label="Marital Status"
              placeholder="Select marital status"
              value={formData.parent_carer_1.marital_status || ""}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "marital_status", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "marital_status")}
              error={getError("parent_carer_1", "marital_status")}
              required={shouldShowRequired("parent_carer_1", "marital_status")}
              options={maritalStatusOptions}
            />
          </div>
          <div className="col-md-3">
            <TextInput
              id="occupation1"
              label="Occupation"
              value={formData.parent_carer_1.occupation}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "occupation", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "occupation")}
              error={getError("parent_carer_1", "occupation")}
              required={shouldShowRequired("parent_carer_1", "occupation")}
            />
          </div>
        </div>

        {/* Address Section for Carer 1 */}
        <h3 className="h5 mb-3 mt-4">Address Details</h3>
        <div className="row align-items-end gap-5 mb-4">
          <div className="col-md-3">
            <SelectInput
              id="addresstype1"
              label="Address Type"
              placeholder="Select address type"
              value={formData.parent_carer_1.address_type || ""}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "address_type", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "address_type")}
              error={getError("parent_carer_1", "address_type")}
              required={shouldShowRequired("parent_carer_1", "address_type")}
              options={addressTypeOptions}
            />
          </div>
          <div className="col-md-3">
            <TextInput
              id="streetnumber1"
              label="Street No"
              value={formData.parent_carer_1.street_number}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "street_number", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "street_number")}
              error={getError("parent_carer_1", "street_number")}
              required={shouldShowRequired("parent_carer_1", "street_number")}
            />
          </div>
          <div className="col-md-3">
            <TextInput
              id="streetname1"
              label="Street Name"
              value={formData.parent_carer_1.street_name}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "street_name", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "street_name")}
              error={getError("parent_carer_1", "street_name")}
              required={shouldShowRequired("parent_carer_1", "street_name")}
            />
          </div>
        </div>

        <div className="row align-items-end gap-5 mb-4">
          <div className="col-md-3">
            <SelectInput
              id="suburb1"
              label="Suburb"
              placeholder="Select suburb"
              value={formData.parent_carer_1.suburb || ""}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "suburb", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "suburb")}
              error={getError("parent_carer_1", "suburb")}
              required={shouldShowRequired("parent_carer_1", "suburb")} // Now false - optional
              options={suburbOptions.parent_carer_1}
            />
          </div>
          <div className="col-md-3">
            <SelectInput
              id="state1"
              label="State"
              placeholder="Select state"
              value={formData.parent_carer_1.state || ""}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "state", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "state")}
              error={getError("parent_carer_1", "state")}
              required={shouldShowRequired("parent_carer_1", "state")}
              options={stateOptions}
            />
          </div>
          <div className="col-md-3">
            <TextInput
              id="postalcode1"
              label="Postal Code"
              value={formData.parent_carer_1.postal_code}
              onChange={(value) =>
                handleInputChange("parent_carer_1", "postal_code", value)
              }
              onBlur={() => handleBlur("parent_carer_1", "postal_code")}
              error={getError("parent_carer_1", "postal_code")}
              required={shouldShowRequired("parent_carer_1", "postal_code")}
            />
          </div>
        </div>

        {/* Show Carer 2 Checkbox */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="showCarer2"
                checked={showCarer2}
                onChange={(e) => handleShowCarer2Change(e.target.checked)}
              />
              <label className="form-check-label fw-bold" htmlFor="showCarer2">
                I wish to add Parent/Carer 2 details
              </label>
            </div>
          </div>
        </div>

        {/* Parent/Carer 2 Section - Conditionally Rendered */}
        {showCarer2 && (
          <>
            <h2 className="h4 mb-3 mt-4">
              B. Parent/Carer 2 with whom this student normally lives
            </h2>

            {/* Personal Details for Carer 2 */}
            <div className="row align-items-end gap-4 mb-4">
              <div className="col-md-2">
                <SelectInput
                  id="title2"
                  label="Title"
                  note="(eg Mr/Ms/Mrs/Dr)"
                  value={formData.parent_carer_2.title}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "title", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "title")}
                  error={getError("parent_carer_2", "title")}
                  required={false}
                  options={[
                    { value: "Mr", label: "Mr" },
                    { value: "Ms", label: "Ms" },
                    { value: "Mrs", label: "Mrs" },
                    { value: "Miss", label: "Miss" },
                    { value: "Dr", label: "Dr" },
                    { value: "Prof", label: "Prof" },
                    { value: "Rev", label: "Rev" },
                  ]}
                  placeholder="Select title"
                />
              </div>
              <div className="col-md-3">
                <TextInput
                  id="firstname2"
                  label="First name"
                  value={formData.parent_carer_2.first_name}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "first_name", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "first_name")}
                  error={getError("parent_carer_2", "first_name")}
                  required={false}
                />
              </div>
              <div className="col-md-3">
                <TextInput
                  id="lastname2"
                  label="Last name"
                  value={formData.parent_carer_2.last_name}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "last_name", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "last_name")}
                  error={getError("parent_carer_2", "last_name")}
                  required={false}
                />
              </div>
              <div className="col-md-3">
                <TextInput
                  id="middlename2"
                  label="Middle name"
                  value={formData.parent_carer_2.middle_name}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "middle_name", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "middle_name")}
                  error={getError("parent_carer_2", "middle_name")}
                  required={false}
                />
              </div>
            </div>

            <div className="row align-items-end gap-4 mb-4">
              <div className="col-md-2">
                <SelectInput
                  id="gender2"
                  label="Gender"
                  placeholder="Select gender"
                  value={formData.parent_carer_2.gender || ""}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "gender", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "gender")}
                  error={getError("parent_carer_2", "gender")}
                  required={false}
                  options={genderOptions}
                />
              </div>
              <div className="col-md-3">
                <SelectInput
                  id="relationshiptostudent2"
                  label="Relationship to student"
                  placeholder="Select relationship"
                  value={formData.parent_carer_2.relationship_to_student || ""}
                  onChange={(value) =>
                    handleInputChange(
                      "parent_carer_2",
                      "relationship_to_student",
                      value
                    )
                  }
                  onBlur={() =>
                    handleBlur("parent_carer_2", "relationship_to_student")
                  }
                  error={getError("parent_carer_2", "relationship_to_student")}
                  options={relationOptions}
                  required={false}
                />
              </div>
              <div className="col-md-3">
                <TextInput
                  id="dateofbirth2"
                  label="Date of Birth"
                  type="date"
                  value={formData.parent_carer_2.date_of_birth}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "date_of_birth", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "date_of_birth")}
                  error={getError("parent_carer_2", "date_of_birth")}
                  required={false}
                />
              </div>
              <div className="col-md-3">
                <SelectInput
                  id="countryofbirth2"
                  label="Country of birth"
                  placeholder="Select country"
                  value={formData.parent_carer_2.country_of_birth || ""}
                  onChange={(value) =>
                    handleInputChange(
                      "parent_carer_2",
                      "country_of_birth",
                      value
                    )
                  }
                  onBlur={() =>
                    handleBlur("parent_carer_2", "country_of_birth")
                  }
                  error={getError("parent_carer_2", "country_of_birth")}
                  required={false}
                  options={countryOptions}
                />
              </div>
            </div>

            <div className="row align-items-end gap-4 mb-4">
              <div className="col-md-2">
                <SelectInput
                  id="nationality2"
                  label="Nationality"
                  placeholder="Select nationality"
                  value={formData.parent_carer_2.nationality || ""}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "nationality", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "nationality")}
                  error={getError("parent_carer_2", "nationality")}
                  required={false}
                  options={nationalityOptions}
                />
              </div>
              <div className="col-md-3">
                <TextInput
                  id="email2"
                  label="Email"
                  type="email"
                  value={formData.parent_carer_2.email}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "email", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "email")}
                  error={getError("parent_carer_2", "email")}
                  required={false}
                />
              </div>
              <div className="col-md-3">
                <TextInput
                  id="mobilephone2"
                  label="Mobile Phone"
                  value={formData.parent_carer_2.mobile_phone}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "mobile_phone", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "mobile_phone")}
                  error={getError("parent_carer_2", "mobile_phone")}
                  required={false}
                />
              </div>
              <div className="col-md-3">
                <TextInput
                  id="altphone2"
                  label="Alternative Phone"
                  value={formData.parent_carer_2.alternative_phone}
                  onChange={(value) =>
                    handleInputChange(
                      "parent_carer_2",
                      "alternative_phone",
                      value
                    )
                  }
                  onBlur={() =>
                    handleBlur("parent_carer_2", "alternative_phone")
                  }
                  error={getError("parent_carer_2", "alternative_phone")}
                  required={false}
                />
              </div>
            </div>

            <div className="row align-items-end gap-4 mb-4">
              <div className="col-md-2">
                <SelectInput
                  id="maritalstatus2"
                  label="Marital Status"
                  placeholder="Select marital status"
                  value={formData.parent_carer_2.marital_status || ""}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "marital_status", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "marital_status")}
                  error={getError("parent_carer_2", "marital_status")}
                  required={false}
                  options={maritalStatusOptions}
                />
              </div>
              <div className="col-md-3">
                <TextInput
                  id="occupation2"
                  label="Occupation"
                  value={formData.parent_carer_2.occupation}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "occupation", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "occupation")}
                  error={getError("parent_carer_2", "occupation")}
                  required={false}
                />
              </div>
            </div>

            {/* Address Section for Carer 2 */}
            <h3 className="h5 mb-3 mt-4">Address Details</h3>
            <div className="row align-items-end gap-5 mb-4">
              <div className="col-md-3">
                <SelectInput
                  id="addresstype2"
                  label="Address Type"
                  placeholder="Select address type"
                  value={formData.parent_carer_2.address_type || ""}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "address_type", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "address_type")}
                  error={getError("parent_carer_2", "address_type")}
                  required={false}
                  options={addressTypeOptions}
                />
              </div>
              <div className="col-md-3">
                <TextInput
                  id="streetnumber2"
                  label="Street No"
                  value={formData.parent_carer_2.street_number}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "street_number", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "street_number")}
                  error={getError("parent_carer_2", "street_number")}
                  required={false}
                />
              </div>
              <div className="col-md-3">
                <TextInput
                  id="streetname2"
                  label="Street Name"
                  value={formData.parent_carer_2.street_name}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "street_name", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "street_name")}
                  error={getError("parent_carer_2", "street_name")}
                  required={false}
                />
              </div>
            </div>

            <div className="row align-items-end gap-5 mb-4">
              <div className="col-md-3">
                <SelectInput
                  id="suburb2"
                  label="Suburb"
                  placeholder="Select suburb"
                  value={formData.parent_carer_2.suburb || ""}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "suburb", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "suburb")}
                  error={getError("parent_carer_2", "suburb")}
                  required={false}
                  options={suburbOptions.parent_carer_2}
                />
              </div>
              <div className="col-md-3">
                <SelectInput
                  id="state2"
                  label="State"
                  placeholder="Select state"
                  value={formData.parent_carer_2.state || ""}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "state", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "state")}
                  error={getError("parent_carer_2", "state")}
                  required={false}
                  options={stateOptions}
                />
              </div>
              <div className="col-md-3">
                <TextInput
                  id="postalcode2"
                  label="Postal Code"
                  value={formData.parent_carer_2.postal_code}
                  onChange={(value) =>
                    handleInputChange("parent_carer_2", "postal_code", value)
                  }
                  onBlur={() => handleBlur("parent_carer_2", "postal_code")}
                  error={getError("parent_carer_2", "postal_code")}
                  required={false}
                />
              </div>
            </div>
          </>
        )}

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
    </>
  );
}