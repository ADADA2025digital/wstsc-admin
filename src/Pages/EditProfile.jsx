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
import api from "../config/axiosConfig";
import { Country, State, City } from "country-state-city";

const EditProfile = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [apiMessage, setApiMessage] = useState({ type: "", text: "" });

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
    suburb: "",
  });

  // Profile picture state
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState("");
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState({});

  // Initialize countries on component mount
  useEffect(() => {
    initializeCountries();
  }, []);

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

  // Initialize countries list
  const initializeCountries = () => {
    try {
      const countriesData = Country.getAllCountries();
      
      const formattedCountries = countriesData.map(country => ({
        value: country.isoCode,
        label: country.name
      }));

      formattedCountries.sort((a, b) => a.label.localeCompare(b.label));
      
      setCountriesList(formattedCountries);
    } catch (error) {
      console.error("Error loading countries:", error);
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

  // Load states for selected country
  const loadStates = (countryCode) => {
    try {
      const statesData = State.getStatesOfCountry(countryCode);
      
      const formattedStates = statesData.map(state => ({
        value: state.isoCode,
        label: state.name
      }));

      formattedStates.sort((a, b) => a.label.localeCompare(b.label));
      
      setStatesList(formattedStates);
      
      // Clear city and state if country changes and state is no longer valid
      if (formData.state && !formattedStates.find(state => state.value === formData.state)) {
        setFormData(prev => ({
          ...prev,
          state: "",
          city: "",
          suburb: ""
        }));
      }
    } catch (error) {
      console.error("Error loading states:", error);
      setStatesList([]);
    }
  };

  // Load cities for selected state
  const loadCities = (countryCode, stateCode) => {
    try {
      const citiesData = City.getCitiesOfState(countryCode, stateCode);
      
      const formattedCities = citiesData.map(city => ({
        value: city.name,
        label: city.name
      }));

      // Remove duplicates and sort
      const uniqueCities = formattedCities.filter((city, index, self) =>
        index === self.findIndex(c => c.value === city.value)
      );
      
      uniqueCities.sort((a, b) => a.label.localeCompare(b.label));
      
      setCitiesList(uniqueCities);
      
      // Clear city if state changes and city is no longer valid
      if (formData.city && !uniqueCities.find(city => city.value === formData.city)) {
        setFormData(prev => ({
          ...prev,
          city: "",
          suburb: ""
        }));
      }
    } catch (error) {
      console.error("Error loading cities:", error);
      setCitiesList([]);
    }
  };

  // Fetch current profile data from /profile/person endpoint
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/profile/person");

      if (response.data.success) {
        const profileData = response.data.data?.profile || {};
        const address = profileData.address || {};

        const mappedData = {
          first_name: profileData.first_name || "",
          last_name: profileData.last_name || "",
          middle_name: profileData.middle_name || "",
          phone: profileData.phone || "",
          alternate_phone: profileData.alternate_phone || "",
          email: profileData.email || "",
          gender: profileData.gender || "",
          date_of_birth: profileData.date_of_birth || "",
          nationality: profileData.nationality || "",
          marital_status: profileData.marital_status || "",
          occupation: profileData.occupation || "",
          address_line1: address.address_line1 || "",
          city: address.city || "",
          state: address.state || "",
          postal_code: address.postal_code || "",
          country: address.country || "",
          suburb: address.suburb || "",
        };

        setFormData(mappedData);
        setOriginalData(mappedData);

        // Load states and cities based on saved country/state
        if (mappedData.country) {
          loadStates(mappedData.country);
          if (mappedData.state) {
            loadCities(mappedData.country, mappedData.state);
          }
        }

        // Set profile picture if available
        if (profileData.photo_url) {
          setProfilePicture(profileData.photo_url);
          setProfilePicturePreview(profileData.photo_url);
        }
      } else {
        throw new Error(response.data.message || "Failed to load profile");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to load profile data";

      setError(errorMessage);
      showMessage("danger", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const showMessage = (type, text, duration = 5000) => {
    setApiMessage({ type, text });
    setTimeout(() => setApiMessage({ type: "", text: "" }), duration);
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

  // Upload profile picture
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.first_name || !formData.last_name || !formData.phone) {
      showMessage("warning", "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data matching the API request body structure exactly
      const submitData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        postal_code: formData.postal_code,
        middle_name: formData.middle_name,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        nationality: formData.nationality,
        alternate_phone: formData.alternate_phone,
        marital_status: formData.marital_status,
        occupation: formData.occupation,
        address_line1: formData.address_line1,
        country: formData.country,
        suburb: formData.suburb,
      };

      // Use the correct endpoint and send as JSON (not FormData)
      const response = await api.put("/profile/person", submitData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        showMessage(
          "success",
          response.data.message || "Profile updated successfully!"
        );
        // Refresh the data to get any server-computed fields but preserve current form state
        const updatedProfileData = response.data.data?.profile || {};
        const updatedAddress = updatedProfileData.address || {};

        // Update originalData with the new values to reset the comparison baseline
        setOriginalData((prev) => ({
          ...prev,
          first_name: updatedProfileData.first_name || prev.first_name,
          last_name: updatedProfileData.last_name || prev.last_name,
          middle_name: updatedProfileData.middle_name || prev.middle_name,
          phone: updatedProfileData.phone || prev.phone,
          alternate_phone:
            updatedProfileData.alternate_phone || prev.alternate_phone,
          gender: updatedProfileData.gender || prev.gender,
          date_of_birth: updatedProfileData.date_of_birth || prev.date_of_birth,
          nationality: updatedProfileData.nationality || prev.nationality,
          marital_status:
            updatedProfileData.marital_status || prev.marital_status,
          occupation: updatedProfileData.occupation || prev.occupation,
          address_line1: updatedAddress.address_line1 || prev.address_line1,
          city: updatedAddress.city || prev.city,
          state: updatedAddress.state || prev.state,
          postal_code: updatedAddress.postal_code || prev.postal_code,
          country: updatedAddress.country || prev.country,
          suburb: updatedAddress.suburb || prev.suburb,
        }));

        // Also update profile picture if it changed
        if (
          updatedProfileData.photo_url &&
          updatedProfileData.photo_url !== profilePicture
        ) {
          setProfilePicture(updatedProfileData.photo_url);
          setProfilePicturePreview(updatedProfileData.photo_url);
        }

        setTimeout(() => navigate(-1), 2000);
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      let errorMessage = "Error updating profile. Please try again.";

      // Handle validation errors
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        errorMessage = Object.values(validationErrors).flat().join(", ");
        showMessage("warning", `Validation errors: ${errorMessage}`);
        return;
      }

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showMessage("danger", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setProfilePictureFile(null);
    setProfilePicturePreview(profilePicture);
    navigate(-1);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <div className="text-center">
            <p className="text-muted">Loading profile details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="alert alert-danger mb-4" role="alert">
          <div className="d-flex align-items-start">
            <div>
              <h4 className="alert-heading mb-1">Error Loading Profile</h4>
              <p className="mb-3">{error}</p>
              <div className="d-flex gap-2">
                <button onClick={fetchProfileData} className="btn btn-primary">
                  Try Again
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="btn btn-outline-secondary"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      {/* API Message Alert */}
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
            className="btn btn-primary"
            disabled={isSubmitting || !hasChanges}
          >
            <i className="bi bi-floppy me-1"></i>{" "}
            {isSubmitting ? "Saving..." : "Save Changes"}
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
                              />
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
                              />
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
                              />
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
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </Form.Select>
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
                              />
                            </Form.Group>
                          </div>

                          <div className="col-12">
                            <Form.Group>
                              <Form.Label>Nationality</Form.Label>
                              <Form.Control
                                type="text"
                                name="nationality"
                                value={formData.nationality}
                                onChange={handleInputChange}
                                placeholder="e.g., Australian"
                              />
                            </Form.Group>
                          </div>

                          <div className="col-md-6">
                            <Form.Group>
                              <Form.Label>Marital Status</Form.Label>
                              <Form.Select
                                name="marital_status"
                                value={formData.marital_status}
                                onChange={handleInputChange}
                              >
                                <option value="">Select Status</option>
                                <option value="single">Single</option>
                                <option value="married">Married</option>
                                <option value="divorced">Divorced</option>
                                <option value="widowed">Widowed</option>
                              </Form.Select>
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
                              />
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
                            />
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
                            />
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
                            />
                          </Form.Group>
                        </div>

                        {/* Country Select */}
                        <div className="col-12">
                          <SelectInput
                            id="country"
                            label="Country"
                            value={formData.country}
                            onChange={(value) => handleSelectChange("country", value)}
                            placeholder="Select Country"
                            options={countriesList}
                          />
                        </div>

                        {/* State/Province Select */}
                        <div className="col-md-6">
                          <SelectInput
                            id="state"
                            label="State/Province"
                            value={formData.state}
                            onChange={(value) => handleSelectChange("state", value)}
                            placeholder={statesList.length > 0 ? "Select State" : "Select Country First"}
                            options={statesList}
                            disabled={!formData.country}
                          />
                        </div>

                        {/* City Select */}
                        <div className="col-md-6">
                          <SelectInput
                            id="city"
                            label="City"
                            value={formData.city}
                            onChange={(value) => handleSelectChange("city", value)}
                            placeholder={citiesList.length > 0 ? "Select City" : "Select State First"}
                            options={citiesList}
                            disabled={!formData.state}
                          />
                        </div>

                        {/* Suburb Input */}
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label>Suburb</Form.Label>
                            <Form.Control
                              type="text"
                              name="suburb"
                              value={formData.suburb}
                              onChange={handleInputChange}
                              placeholder="Enter suburb"
                              disabled={!formData.city}
                            />
                            <Form.Text className="text-muted">
                              Enter your local suburb/area
                            </Form.Text>
                          </Form.Group>
                        </div>

                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label>Postal Code</Form.Label>
                            <Form.Control
                              type="text"
                              name="postal_code"
                              value={formData.postal_code}
                              onChange={handleInputChange}
                              placeholder="3000"
                            />
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
                              className="w-100"
                              style={{ maxWidth: "100%" }}
                            />
                            <Form.Text className="text-muted d-block text-start">
                              Supported formats: JPEG, PNG, GIF. Max size: 5MB
                            </Form.Text>
                          </Form.Group>

                          {/* Action Buttons */}
                          <div className="d-flex gap-2 justify-content-start">
                            <ButtonGlobal
                              onClick={handleProfilePictureUpload}
                              className="btn btn-primary"
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