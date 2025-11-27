import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Col,
  Row,
  Tab,
  Tabs,
  Alert,
  Form,
  Image,
} from "react-bootstrap";
import ButtonGlobal from "../Components/Button";
import InfoCard from "../Components/InfoCard";
import SelectInput from "../Components/SelectInput";
import { Country, State, City } from "country-state-city";
import api from "../config/axiosConfig";
import Cookies from "js-cookie";
import { toast } from "react-toastify";

// Nationalities array
const nationalities = [
  "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", 
  "Anguillan", "Argentine", "Armenian", "Australian", "Austrian", "Azerbaijani",
  "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Belarusian", "Belgian",
  "Belizean", "Beninese", "Bermudian", "Bhutanese", "Bolivian", "Botswanan",
  "Brazilian", "British", "British Virgin Islander", "Bruneian", "Bulgarian",
  "Burkinan", "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian",
  "Cape Verdean", "Cayman Islander", "Central African", "Chadian", "Chilean",
  "Chinese", "Citizen of Antigua and Barbuda", "Citizen of Bosnia and Herzegovina",
  "Citizen of Guinea-Bissau", "Citizen of Kiribati", "Citizen of Seychelles",
  "Citizen of the Dominican Republic", "Citizen of Vanuatu", "Colombian",
  "Comoran", "Congolese (Congo)", "Congolese (DRC)", "Cook Islander", "Costa Rican",
  "Croatian", "Cuban", "Cymraes", "Cymro", "Cypriot", "Czech", "Danish",
  "Djiboutian", "Dominican", "Dutch", "East Timorese", "Ecuadorean", "Egyptian",
  "Emirati", "English", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian",
  "Faroese", "Fijian", "Filipino", "Finnish", "French", "Gabonese", "Gambian",
  "Georgian", "German", "Ghanaian", "Gibraltarian", "Greek", "Greenlandic",
  "Grenadian", "Guamanian", "Guatemalan", "Guinean", "Guyanese", "Haitian",
  "Honduran", "Hong Konger", "Hungarian", "Icelandic", "Indian", "Indonesian",
  "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican",
  "Japanese", "Jordanian", "Kazakh", "Kenyan", "Kittitian", "Kosovan", "Kuwaiti",
  "Kyrgyz", "Lao", "Latvian", "Lebanese", "Liberian", "Libyan", "Liechtenstein citizen",
  "Lithuanian", "Luxembourger", "Macanese", "Macedonian", "Malagasy", "Malawian",
  "Malaysian", "Maldivian", "Malian", "Maltese", "Marshallese", "Martiniquais",
  "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monegasque",
  "Mongolian", "Montenegrin", "Montserratian", "Moroccan", "Mosotho", "Mozambican",
  "Namibian", "Nauruan", "Nepalese", "New Zealander", "Nicaraguan", "Nigerian",
  "Nigerien", "Niuean", "North Korean", "Northern Irish", "Norwegian", "Omani",
  "Pakistani", "Palauan", "Palestinian", "Panamanian", "Papua New Guinean",
  "Paraguayan", "Peruvian", "Pitcairn Islander", "Polish", "Portuguese", "Prydeinig",
  "Puerto Rican", "Qatari", "Romanian", "Russian", "Rwandan", "Salvadorean",
  "Sammarinese", "Samoan", "Sao Tomean", "Saudi Arabian", "Scottish", "Senegalese",
  "Serbian", "Sierra Leonean", "Singaporean", "Slovak", "Slovenian", "Solomon Islander",
  "Somali", "South African", "South Korean", "South Sudanese", "Spanish", "Sri Lankan",
  "St Helenian", "St Lucian", "Stateless", "Sudanese", "Surinamese", "Swazi",
  "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese",
  "Tongan", "Trinidadian", "Tristanian", "Tunisian", "Turkish", "Turkmen",
  "Turks and Caicos Islander", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan",
  "Uzbek", "Vatican citizen", "Venezuelan", "Vietnamese", "Vincentian", "Wallisian",
  "Welsh", "Yemeni", "Zambian", "Zimbabwean",
];

const EditProfile = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [apiMessage, setApiMessage] = useState({ type: "", text: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationAlert, setValidationAlert] = useState({
    show: false,
    message: "",
  });

  // Location data states
  const [countriesList, setCountriesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    middle_name: "",
    phone: "",
    alternate_phone: "",
    email: "",
    gender: "",
    date_of_birth: "",
    nationality: "",
    marital_status: "",
    occupation: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    address_type: "home",
  });

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Check authentication when component mounts
  useEffect(() => {
    const token = Cookies.get('token');
    const authenticated = localStorage.getItem('authenticated');
    
    console.log('EditProfile - Auth check:', {
      token: !!token,
      authenticated
    });

    if (!token || authenticated !== 'true') {
      console.log('EditProfile: No auth, redirecting to login');
      navigate('/login');
      return;
    }
    
    // If user_status is already active, they might be coming here directly
    const userStatus = localStorage.getItem('user_status');
    if (userStatus === 'active') {
      console.log('EditProfile: Profile already completed, redirecting to home');
      navigate('/');
      return;
    }

    fetchUserProfile();
    initializeCountries();
  }, [navigate]);

  // Update states when country changes
  useEffect(() => {
    if (formData.country) {
      loadStates(formData.country);
    } else {
      setStatesList([]);
      setCitiesList([]);
    }
  }, [formData.country]);

  // Update cities when state changes
  useEffect(() => {
    if (formData.country && formData.state) {
      loadCities(formData.country, formData.state);
    } else {
      setCitiesList([]);
    }
  }, [formData.country, formData.state]);

  // Clear field errors when form data changes
  useEffect(() => {
    setFieldErrors({});
    setValidationAlert({ show: false, message: "" });
  }, [formData]);

  // Fetch user profile from API using axios
  const fetchUserProfile = async () => {
    setIsLoadingProfile(true);
    try {
      const response = await api.get("/profile/person");

      if (response.data.success && response.data.data.profile) {
        const profile = response.data.data.profile;

        // Map API response to form data
        const mappedData = {
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          middle_name: profile.middle_name || "",
          phone: profile.phone || "",
          alternate_phone: profile.alternate_phone || "",
          email: profile.email || "",
          gender: profile.gender || "",
          date_of_birth: profile.date_of_birth || "",
          nationality: profile.nationality || "",
          marital_status: profile.marital_status || "",
          occupation: profile.occupation || "",
          address_line1: profile.address?.address_line1 || "",
          city: profile.address?.city || "",
          state: profile.address?.state || "",
          postal_code: profile.address?.postal_code || "",
          country: profile.address?.country || "",
          address_type: profile.address?.address_type || "home",
        };

        setFormData(mappedData);
        setOriginalData(mappedData);

        // Set profile picture if available
        if (profile.photo_url) {
          setProfilePicture(profile.photo_url);
          setProfilePicturePreview(profile.photo_url);
        }
      } else {
        throw new Error(response.data.message || "Failed to load profile");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      showMessage(
        "danger",
        `Error loading profile: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Initialize countries list using country-state-city
  const initializeCountries = () => {
    try {
      const countriesData = Country.getAllCountries();

      const formattedCountries = countriesData.map((country) => ({
        value: country.isoCode,
        label: country.name,
      }));

      formattedCountries.sort((a, b) => a.label.localeCompare(b.label));

      setCountriesList(formattedCountries);
    } catch (error) {
      console.error("Error loading countries:", error);
      // Fallback to some common countries
      setCountriesList([
        { value: "US", label: "United States" },
        { value: "AU", label: "Australia" },
        { value: "CA", label: "Canada" },
        { value: "GB", label: "United Kingdom" },
        { value: "IN", label: "India" },
        { value: "CN", label: "China" },
        { value: "JP", label: "Japan" },
        { value: "DE", label: "Germany" },
        { value: "FR", label: "France" },
      ]);
    }
  };

  // Load states for selected country using country-state-city
  const loadStates = (countryCode) => {
    try {
      const statesData = State.getStatesOfCountry(countryCode);

      const formattedStates = statesData.map((state) => ({
        value: state.isoCode,
        label: state.name,
      }));

      formattedStates.sort((a, b) => a.label.localeCompare(b.label));

      setStatesList(formattedStates);

      // Clear city if country changes and state is no longer valid
      if (
        formData.state &&
        !formattedStates.find((state) => state.value === formData.state)
      ) {
        setFormData((prev) => ({
          ...prev,
          state: "",
          city: "",
        }));
      }
    } catch (error) {
      console.error("Error loading states:", error);
      setStatesList([]);
    }
  };

  // Load cities for selected state using country-state-city
  const loadCities = (countryCode, stateCode) => {
    try {
      const citiesData = City.getCitiesOfState(countryCode, stateCode);

      const formattedCities = citiesData.map((city) => ({
        value: city.name,
        label: city.name,
      }));

      // Remove duplicates and sort
      const uniqueCities = formattedCities.filter(
        (city, index, self) =>
          index === self.findIndex((c) => c.value === city.value)
      );

      uniqueCities.sort((a, b) => a.label.localeCompare(b.label));

      setCitiesList(uniqueCities);

      // Clear city if state changes and city is no longer valid
      if (
        formData.city &&
        !uniqueCities.find((city) => city.value === formData.city)
      ) {
        setFormData((prev) => ({
          ...prev,
          city: "",
        }));
      }
    } catch (error) {
      console.error("Error loading cities:", error);
      setCitiesList([]);
    }
  };

  const showMessage = (type, text, duration = 5000) => {
    setApiMessage({ type, text });
    if (duration > 0) {
      setTimeout(() => setApiMessage({ type: "", text: "" }), duration);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle select input changes
  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle profile picture selection
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        showMessage(
          "warning",
          "Please select a valid image file (JPEG, PNG, GIF)"
        );
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showMessage("warning", "Image size should be less than 5MB");
        return;
      }

      setProfilePictureFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicturePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload profile picture using axios
  const handleProfilePictureUpload = async () => {
    if (!profilePictureFile) {
      showMessage("warning", "Please select a picture to upload");
      return;
    }

    setIsUploadingPicture(true);

    try {
      const formData = new FormData();
      formData.append("profile_picture", profilePictureFile);

      const response = await api.post("/profile/picture", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        showMessage(
          "success",
          response.data.message || "Profile picture updated successfully!"
        );

        // Update the profile picture with the new URL from response
        const newPhotoUrl = response.data.data?.profile?.photo_url;
        if (newPhotoUrl) {
          setProfilePicture(newPhotoUrl);
          setProfilePicturePreview(newPhotoUrl);
        }

        // Clear the file input but DON'T refresh the entire form data
        setProfilePictureFile(null);

        // Update originalData with the new photo URL to prevent false "unsaved changes"
        if (newPhotoUrl) {
          setOriginalData((prev) => ({
            ...prev,
            // No form fields to update, just the photo URL in state
          }));
        }
      } else {
        throw new Error(
          response.data.message || "Failed to upload profile picture"
        );
      }
    } catch (error) {
      let errorMessage = "Error uploading profile picture. Please try again.";

      // Handle validation errors
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        errorMessage = Object.values(validationErrors).flat().join(", ");
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showMessage("danger", errorMessage);
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Remove profile picture preview
  const handleRemovePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(profilePicture); // Reset to current profile picture
  };

  // Submit form using axios - FIXED VERSION
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.phone) {
      showMessage("warning", "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        phone: formData.phone,
        nationality: formData.nationality,
        alternate_phone: formData.alternate_phone,
        marital_status: formData.marital_status,
        occupation: formData.occupation,
        address_line1: formData.address_line1,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        country: formData.country,
        address_type: formData.address_type,
      };

      console.log("Sending update data:", updateData);

      const response = await api.put("/profile/update", updateData);

      if (response.data.success) {
        showMessage(
          "success",
          response.data.message || "Profile updated successfully!"
        );
        setOriginalData({ ...formData });

        // CRITICAL: Set user_status to "active" in localStorage
        localStorage.setItem("user_status", "active");

        // Update userData in localStorage with completed profile info
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const updatedUserData = {
          ...userData,
          profile_completed: true,
          // Update profile fields in userData for consistency
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          name: `${formData.first_name} ${formData.last_name}`.trim()
        };
        localStorage.setItem("userData", JSON.stringify(updatedUserData));

        console.log('✅ EditProfile - Profile completed, user_status set to ACTIVE');
        console.log('Updated userData:', updatedUserData);

        toast.success("Profile completed successfully! Redirecting...");

        // Use a slightly longer timeout to ensure everything is committed
        setTimeout(() => {
          console.log('🔄 EditProfile - Final auth status before navigation:', {
            user_status: localStorage.getItem('user_status'),
            userData: JSON.parse(localStorage.getItem('userData') || '{}'),
            token: !!Cookies.get('token')
          });
          
          // Use window.location for a hard redirect to ensure clean state
          window.location.href = "/";
        }, 1500);
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);

      let errorMessage = "Error updating profile. Please try again.";

      // Handle validation errors (422 status)
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        if (validationErrors) {
          // Set field-specific errors
          setFieldErrors(validationErrors);

          // Extract all validation error messages for the alert
          errorMessage = Object.values(validationErrors)
            .flat()
            .map((error) => (typeof error === "string" ? error : String(error)))
            .join(", ");

          // Show validation alert without timer
          setValidationAlert({
            show: true,
            message: errorMessage,
          });
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
          showMessage("danger", errorMessage);
        }
      }
      // Handle other API errors
      else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        showMessage("danger", errorMessage);
      } else if (error.message) {
        errorMessage = error.message;
        showMessage("danger", errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setProfilePictureFile(null);
    setProfilePicturePreview(profilePicture);
    setFieldErrors({});
    setValidationAlert({ show: false, message: "" });
    navigate(-1);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  // Helper function to get field error
  const getFieldError = (fieldName) => {
    return fieldErrors[fieldName] ? fieldErrors[fieldName][0] : null;
  };

  // Show loading state
  if (isLoadingProfile) {
    return (
      <div className="container-fluid px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      {/* API Message Alert (with timer) */}
      {apiMessage.text && (
        <Alert
          variant={apiMessage.type}
          className="mb-3"
          dismissible
          onClose={() => setApiMessage({ type: "", text: "" })}
        >
          {apiMessage.text}
        </Alert>
      )}

      {/* Validation Error Alert (without timer) */}
      {validationAlert.show && (
        <Alert
          variant="danger"
          className="mb-3"
          dismissible
          onClose={() => setValidationAlert({ show: false, message: "" })}
        >
          <Alert.Heading>Please fix the following errors:</Alert.Heading>
          {validationAlert.message}
        </Alert>
      )}

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Edit Profile</h4>
          <p className="text-muted mb-0">
            Update your personal information and preferences
            {hasChanges && (
              <Badge bg="warning" text="dark" className="ms-2">
                Unsaved Changes
              </Badge>
            )}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ButtonGlobal
            onClick={handleCancel}
            className="btn btn-outline-secondary"
            disabled={isSubmitting}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back
          </ButtonGlobal>

          <ButtonGlobal
            onClick={handleSubmit}
            className="btn custom-btn"
            disabled={isSubmitting || !hasChanges}
          >
            <i className="bi bi-floppy me-1"></i>{" "}
            {isSubmitting ? "Saving..." : "Save Changes"}
          </ButtonGlobal>

          {/* Temporary debug button - remove after testing */}
          <ButtonGlobal
            onClick={() => {
              localStorage.setItem("user_status", "active");
              const userData = JSON.parse(localStorage.getItem("userData") || "{}");
              localStorage.setItem("userData", JSON.stringify({
                ...userData,
                profile_completed: true
              }));
              toast.success("Manual status set to active!");
            }}
            className="btn btn-warning"
          >
            <i className="bi bi-bug me-1"></i>
            Debug: Set Status Active
          </ButtonGlobal>
        </div>
      </div>

      {/* Main Form */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="px-3 pt-3 border-bottom"
            fill
          >
            {/* Personal Information Tab */}
            <Tab eventKey="personal" title="Personal Information">
              <div className="p-4">
                <form onSubmit={handleSubmit}>
                  <Row className="g-4">
                    <Col md={6}>
                      <InfoCard title="Basic Information" className="bg-white">
                        <div className="row g-3">
                          <div className="col-12">
                            <Form.Group>
                              <Form.Label>First Name *</Form.Label>
                              <Form.Control
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter your first name"
                                className={`rounded-0 ${
                                  getFieldError("first_name")
                                    ? "is-invalid"
                                    : ""
                                }`}
                              />
                              {getFieldError("first_name") && (
                                <Form.Control.Feedback type="invalid">
                                  {getFieldError("first_name")}
                                </Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </div>

                          <div className="col-12">
                            <Form.Group>
                              <Form.Label>Middle Name</Form.Label>
                              <Form.Control
                                type="text"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleInputChange}
                                placeholder="Enter your middle name"
                                className={`rounded-0 ${
                                  getFieldError("middle_name")
                                    ? "is-invalid"
                                    : ""
                                }`}
                              />
                              {getFieldError("middle_name") && (
                                <Form.Control.Feedback type="invalid">
                                  {getFieldError("middle_name")}
                                </Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </div>

                          <div className="col-12">
                            <Form.Group>
                              <Form.Label>Last Name *</Form.Label>
                              <Form.Control
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                required
                                placeholder="Enter your last name"
                                className={`rounded-0 ${
                                  getFieldError("last_name") ? "is-invalid" : ""
                                }`}
                              />
                              {getFieldError("last_name") && (
                                <Form.Control.Feedback type="invalid">
                                  {getFieldError("last_name")}
                                </Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </div>

                          <div className="col-12">
                            <Form.Group>
                              <Form.Label>Email</Form.Label>
                              <Form.Control
                                type="email"
                                value={formData.email}
                                disabled
                                placeholder="No email available"
                                className="rounded-0"
                              />
                              <Form.Text className="text-muted">
                                Email cannot be changed
                              </Form.Text>
                            </Form.Group>
                          </div>
                        </div>
                      </InfoCard>
                    </Col>

                    <Col md={6}>
                      <InfoCard title="Personal Details" className="bg-white">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Gender</Form.Label>
                              <Form.Select
                                name="gender"
                                value={formData.gender}
                                onChange={handleInputChange}
                                className={`rounded-0 ${
                                  getFieldError("gender") ? "is-invalid" : ""
                                }`}
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </Form.Select>
                              {getFieldError("gender") && (
                                <Form.Control.Feedback type="invalid">
                                  {getFieldError("gender")}
                                </Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </div>

                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Date of Birth</Form.Label>
                              <Form.Control
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleInputChange}
                                className={`rounded-0 ${
                                  getFieldError("date_of_birth")
                                    ? "is-invalid"
                                    : ""
                                }`}
                              />
                              {getFieldError("date_of_birth") && (
                                <Form.Control.Feedback type="invalid">
                                  {getFieldError("date_of_birth")}
                                </Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </div>

                          <div className="col-12">
                            <Form.Group>
                              <Form.Label>Nationality</Form.Label>
                              <Form.Select
                                name="nationality"
                                value={formData.nationality}
                                onChange={handleInputChange}
                                className={`rounded-0 ${
                                  getFieldError("nationality")
                                    ? "is-invalid"
                                    : ""
                                }`}
                              >
                                <option value="">
                                  Select your nationality
                                </option>
                                {nationalities.map((nationality) => (
                                  <option key={nationality} value={nationality}>
                                    {nationality}
                                  </option>
                                ))}
                              </Form.Select>
                              {getFieldError("nationality") && (
                                <Form.Control.Feedback type="invalid">
                                  {getFieldError("nationality")}
                                </Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </div>

                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Marital Status</Form.Label>
                              <Form.Select
                                name="marital_status"
                                value={formData.marital_status}
                                onChange={handleInputChange}
                                className={`rounded-0 ${
                                  getFieldError("marital_status")
                                    ? "is-invalid"
                                    : ""
                                }`}
                              >
                                <option value="">Select Status</option>
                                <option value="single">Single</option>
                                <option value="married">Married</option>
                                <option value="divorced">Divorced</option>
                                <option value="widowed">Widowed</option>
                              </Form.Select>
                              {getFieldError("marital_status") && (
                                <Form.Control.Feedback type="invalid">
                                  {getFieldError("marital_status")}
                                </Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </div>

                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Occupation</Form.Label>
                              <Form.Control
                                type="text"
                                name="occupation"
                                value={formData.occupation}
                                onChange={handleInputChange}
                                placeholder="e.g., Senior Developer"
                                className={`rounded-0 ${
                                  getFieldError("occupation")
                                    ? "is-invalid"
                                    : ""
                                }`}
                              />
                              {getFieldError("occupation") && (
                                <Form.Control.Feedback type="invalid">
                                  {getFieldError("occupation")}
                                </Form.Control.Feedback>
                              )}
                            </Form.Group>
                          </div>
                        </div>
                      </InfoCard>
                    </Col>
                  </Row>
                </form>
              </div>
            </Tab>

            {/* Contact Information Tab */}
            <Tab eventKey="contact" title="Contact Information">
              <div className="p-4">
                <Row className="g-4">
                  <Col md={6}>
                    <InfoCard title="Phone Numbers" className="bg-white">
                      <div className="row g-3">
                        <div className="col-12">
                          <Form.Group>
                            <Form.Label>Primary Phone *</Form.Label>
                            <Form.Control
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              required
                              placeholder="+61412345678"
                              className={`rounded-0 ${
                                getFieldError("phone") ? "is-invalid" : ""
                              }`}
                            />
                            {getFieldError("phone") && (
                              <Form.Control.Feedback type="invalid">
                                {getFieldError("phone")}
                              </Form.Control.Feedback>
                            )}
                          </Form.Group>
                        </div>

                        <div className="col-12">
                          <Form.Group>
                            <Form.Label>Alternate Phone</Form.Label>
                            <Form.Control
                              type="tel"
                              name="alternate_phone"
                              value={formData.alternate_phone}
                              onChange={handleInputChange}
                              placeholder="+61298765432"
                              className={`rounded-0 ${
                                getFieldError("alternate_phone")
                                  ? "is-invalid"
                                  : ""
                              }`}
                            />
                            {getFieldError("alternate_phone") && (
                              <Form.Control.Feedback type="invalid">
                                {getFieldError("alternate_phone")}
                              </Form.Control.Feedback>
                            )}
                          </Form.Group>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard title="Address Information" className="bg-white">
                      <div className="row g-3">
                        <div className="col-12">
                          <Form.Group>
                            <Form.Label>Address Line 1</Form.Label>
                            <Form.Control
                              type="text"
                              name="address_line1"
                              value={formData.address_line1}
                              onChange={handleInputChange}
                              placeholder="456 Collins Street"
                              className={`rounded-0 ${
                                getFieldError("address_line1")
                                  ? "is-invalid"
                                  : ""
                              }`}
                            />
                            {getFieldError("address_line1") && (
                              <Form.Control.Feedback type="invalid">
                                {getFieldError("address_line1")}
                              </Form.Control.Feedback>
                            )}
                          </Form.Group>
                        </div>

                        {/* Country and State/Province in one row */}
                        <div className="col-md-6">
                          <SelectInput
                            id="country"
                            label="Country"
                            value={formData.country}
                            onChange={(value) =>
                              handleSelectChange("country", value)
                            }
                            placeholder="Select Country"
                            options={countriesList}
                            className={`rounded-0 ${
                              getFieldError("country") ? "is-invalid" : ""
                            }`}
                            isInvalid={!!getFieldError("country")}
                            errorMessage={getFieldError("country")}
                          />
                        </div>

                        <div className="col-md-6">
                          <SelectInput
                            id="state"
                            label="State/Province"
                            value={formData.state}
                            onChange={(value) =>
                              handleSelectChange("state", value)
                            }
                            placeholder={
                              statesList.length > 0
                                ? "Select State"
                                : "Select Country First"
                            }
                            options={statesList}
                            disabled={!formData.country}
                            className={`rounded-0 ${
                              getFieldError("state") ? "is-invalid" : ""
                            }`}
                            isInvalid={!!getFieldError("state")}
                            errorMessage={getFieldError("state")}
                          />
                        </div>

                        {/* City and Postal Code in one row */}
                        <div className="col-md-6">
                          <SelectInput
                            id="city"
                            label="City/Suburb"
                            value={formData.city}
                            onChange={(value) =>
                              handleSelectChange("city", value)
                            }
                            placeholder={
                              citiesList.length > 0
                                ? "Select City"
                                : "Select State First"
                            }
                            options={citiesList}
                            disabled={!formData.state}
                            className={`rounded-0 ${
                              getFieldError("city") ? "is-invalid" : ""
                            }`}
                            isInvalid={!!getFieldError("city")}
                            errorMessage={getFieldError("city")}
                          />
                        </div>

                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label>Postal Code</Form.Label>
                            <Form.Control
                              type="text"
                              name="postal_code"
                              value={formData.postal_code}
                              onChange={handleInputChange}
                              className={`rounded-0 ${
                                getFieldError("postal_code") ? "is-invalid" : ""
                              }`}
                              placeholder="3000"
                            />
                            {getFieldError("postal_code") && (
                              <Form.Control.Feedback type="invalid">
                                {getFieldError("postal_code")}
                              </Form.Control.Feedback>
                            )}
                          </Form.Group>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Profile Picture Tab */}
            <Tab eventKey="picture" title="Profile Picture">
              <div className="p-4">
                <Row className="g-4">
                  <Col md={12}>
                    <InfoCard title="Profile Picture" className="bg-white">
                      <Row className="align-items-center">
                        {/* Left Side - Profile Picture Preview */}
                        <Col md={6} className="text-center">
                          <div className="mb-4">
                            {profilePicturePreview ? (
                              <Image
                                src={profilePicturePreview}
                                alt="Profile preview"
                                roundedCircle
                                style={{
                                  width: "200px",
                                  height: "200px",
                                  objectFit: "cover",
                                  border: "3px solid #dee2e6",
                                }}
                              />
                            ) : (
                              <div
                                className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto"
                                style={{
                                  width: "200px",
                                  height: "200px",
                                  border: "3px dashed #dee2e6",
                                }}
                              >
                                <i className="bi bi-person fs-1 text-muted"></i>
                              </div>
                            )}
                          </div>
                        </Col>

                        {/* Right Side - Form Controls */}
                        <Col md={6}>
                          {/* File Input */}
                          <Form.Group className="mb-3">
                            <Form.Label className="d-block text-start">
                              Choose a new profile picture
                            </Form.Label>
                            <Form.Control
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePictureChange}
                              style={{ maxWidth: "100%" }}
                              className="rounded-0 w-100"
                            />
                            <Form.Text className="text-muted d-block text-start">
                              Supported formats: JPEG, PNG, GIF. Max size: 5MB
                            </Form.Text>
                          </Form.Group>

                          {/* Action Buttons */}
                          <div className="d-flex gap-2 justify-content-start">
                            <ButtonGlobal
                              onClick={handleProfilePictureUpload}
                              className="btn custom-btn"
                              disabled={
                                !profilePictureFile || isUploadingPicture
                              }
                            >
                              <i className="bi bi-upload me-1"></i>
                              {isUploadingPicture
                                ? "Uploading..."
                                : "Upload Picture"}
                            </ButtonGlobal>

                            {profilePictureFile && (
                              <ButtonGlobal
                                onClick={handleRemovePicture}
                                className="btn btn-outline-secondary"
                                disabled={isUploadingPicture}
                              >
                                <i className="bi bi-x me-1"></i>
                                Cancel
                              </ButtonGlobal>
                            )}
                          </div>

                          {/* Current Picture Info */}
                          {profilePicture && !profilePictureFile && (
                            <div className="mt-3">
                              <p className="text-muted small mb-0 text-start">
                                Current profile picture is active
                              </p>
                            </div>
                          )}
                        </Col>
                      </Row>
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;