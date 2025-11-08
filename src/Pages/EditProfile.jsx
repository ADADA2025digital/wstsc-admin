// src/pages/EditProfile.jsx
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
} from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import ButtonGlobal from "../Components/Button";
import InfoCard from "../Components/InfoCard";
import api from "../config/axiosConfig";

const EditProfile = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const [apiMessage, setApiMessage] = useState({ type: "", text: "" });

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
    country: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState({});

  // Fetch current profile data from /profile/person endpoint
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get("/profile/person");

      if (response.data.success) {
        const profileData = response.data.data?.profile || {};
        
        // Map data according to API response structure - data is in profile object
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
          country: address.country || ""
        };
        
        setFormData(mappedData);
        setOriginalData(mappedData);
        
        showMessage("success", "Profile loaded successfully");
      } else {
        throw new Error(response.data.message || "Failed to load profile");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message 
        || error.message 
        || "Failed to load profile data";
      
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        country: formData.country
      };
      
      // Use the correct endpoint and send as JSON (not FormData)
      const response = await api.put("/profile/person", submitData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        showMessage("success", response.data.message || "Profile updated successfully!");
        // Refresh the data to get any server-computed fields
        await fetchProfileData();
        setTimeout(() => navigate(-1), 2000);
      } else {
        throw new Error(response.data.message || "Failed to update profile");
      }

    } catch (error) {
      let errorMessage = "Error updating profile. Please try again.";
      
      // Handle validation errors
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        errorMessage = Object.values(validationErrors).flat().join(', ');
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
    navigate(-1);
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
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
                <button onClick={() => navigate(-1)} className="btn btn-outline-secondary">
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
            {/* {hasChanges && (
              <Badge bg="warning" text="dark" className="ms-2">
                Unsaved Changes
              </Badge>
            )} */}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ButtonGlobal
            onClick={handleCancel}
            className="btn btn-outline-secondary"
            disabled={isSubmitting}
          >
            Back
          </ButtonGlobal>

          <ButtonGlobal
            onClick={handleSubmit}
            className="btn btn-primary"
            disabled={isSubmitting || !hasChanges}
          >
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
            <Tab
              eventKey="personal"
              title="Personal Information"
            >
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
            <Tab
              eventKey="contact"
              title="Contact Information"
            >
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

                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label>City</Form.Label>
                            <Form.Control
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              placeholder="Melbourne"
                            />
                          </Form.Group>
                        </div>

                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label>State</Form.Label>
                            <Form.Control
                              type="text"
                              name="state"
                              value={formData.state}
                              onChange={handleInputChange}
                              placeholder="VIC"
                            />
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

                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label>Country</Form.Label>
                            <Form.Control
                              type="text"
                              name="country"
                              value={formData.country}
                              onChange={handleInputChange}
                              placeholder="Australia"
                            />
                          </Form.Group>
                        </div>
                      </div>
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