import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Breadcrumb,
  Card,
  Row,
  Col,
  Button,
  Spinner,
  Alert,
  Badge,
  Tab,
  Tabs,
  Container,
} from "react-bootstrap";
import ButtonGlobal from "../../Components/Button";
import InfoCard, { EmptyState } from "../../Components/InfoCard";
import { formatDateToMMDDYYYY } from "../../config/utils";

const ParentDetails = () => {
  const { name } = useParams(); // Using name parameter
  const navigate = useNavigate();
  const location = useLocation();
  const [parentData, setParentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");

  useEffect(() => {
    console.log("ParentDetails mounted with name:", name);
    console.log("Location state:", location.state);
    
    if (location.state?.parentData) {
      console.log("Using parent data from location state");
      setParentData(location.state.parentData);
      setLoading(false);
    } else {
      console.log("Fetching parent details from API");
      fetchParentDetails();
    }
  }, [name, location.state]);

  const fetchParentDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Fetching parent data for name:", name);
      
      // API call to fetch parent data by name
      // You'll need to implement this endpoint on your backend
      const response = await fetch(`/api/parents/name/${encodeURIComponent(name)}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch parent data: ${response.status} ${response.statusText}`);
      }
      
      const parent = await response.json();
      console.log("Fetched parent data:", parent);
      
      if (parent) {
        setParentData(parent);
      } else {
        setError("Parent data not found. Please go back and try again.");
      }
    } catch (err) {
      console.error("Error fetching parent details:", err);
      setError("Failed to fetch parent details: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    console.log("Navigating back to parents list");
    navigate("/parents");
  };

  const handleEdit = () => {
    console.log("Navigating to edit page for:", name);
    navigate(`/parents/edit/${encodeURIComponent(name)}`, { state: { parentData } });
  };

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid px-4 py-3">
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "50vh" }}
        >
          <div className="text-center">
            <div
              className="spinner-border text-primary"
              role="status"
              aria-hidden="true"
            ></div>
            <p className="mt-3 text-muted">Loading parent details...</p>
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
            <i className="bi bi-exclamation-triangle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">Error Loading Parent</h4>
              <p className="mb-3">{error}</p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Parents
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!parentData) {
    return (
      <div className="container-fluid px-4 py-3">
        <div className="alert alert-warning mb-4" role="alert">
          <div className="d-flex align-items-start">
            <i className="bi bi-info-circle-fill me-3 fs-4"></i>
            <div>
              <h4 className="alert-heading mb-1">No Data Found</h4>
              <p className="mb-3">No parent data available for: {name}.</p>
              <button onClick={handleBack} className="btn btn-primary">
                <i className="bi bi-arrow-left me-2"></i>
                Back to Parents
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Parent Details</h4>
          <p className="text-muted mb-0">Viewing details for: {parentData.full_name}</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <ButtonGlobal
            onClick={handleBack}
            className="btn btn-outline-secondary"
          >
            <i className="bi bi-arrow-left me-2" />
            Back to List
          </ButtonGlobal>
          <ButtonGlobal
            onClick={handleEdit}
            className="btn btn-primary"
          >
            <i className="bi bi-pencil-square me-2" />
            Edit Parent
          </ButtonGlobal>
        </div>
      </div>

      {/* Parent Summary Card */}
      <div className="card mb-4 border-0 shadow-sm bg-secondary bg-opacity-10">
        <div className="card-header bg-transparent py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="bi bi-person-badge me-2"></i>
              Parent Information
            </h5>
            <Badge 
              bg={parentData.status === "Active" ? "success" : "danger"}
              className="fs-7"
            >
              {parentData.status}
            </Badge>
          </div>
        </div>
        <div className="card-body p-4">
          <div className="row g-4">
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Full Name</span>
                <span className="fs-6 fw-medium">
                  {parentData.full_name}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Gender</span>
                <span className="fs-6">{parentData.gender || "—"}</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Date of Birth</span>
                <span className="fs-6">
                  {formatDateToMMDDYYYY(parentData.date_of_birth)}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Nationality</span>
                <span className="fs-6">
                  {parentData.nationality || "—"}
                </span>
              </div>
            </div>

            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Occupation</span>
                <span className="fs-6">
                  {parentData.occupation || "—"}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Marital Status</span>
                <span className="fs-6">
                  {parentData.marital_status || "—"}
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="d-flex flex-column">
                <span className="small fw-semibold">Status</span>
                <span className="fs-6">
                  <Badge 
                    bg={parentData.status === "Active" ? "success" : "danger"}
                    className="fs-7"
                  >
                    {parentData.status}
                  </Badge>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information Tabs */}
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
              title={
                <span>
                  <i className="bi bi-person me-2"></i>
                  Personal Information
                </span>
              }
            >
              <div className="p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <InfoCard
                      title="Personal Details"
                      className="bg-secondary bg-opacity-10"
                    >
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">First Name</span>
                          <p className="mb-0 fw-medium">
                            {parentData.first_name}
                          </p>
                        </div>
                        <div>
                          <span className="small">Last Name</span>
                          <p className="mb-0 fw-medium">
                            {parentData.last_name}
                          </p>
                        </div>
                        <div>
                          <span className="small">Middle Name</span>
                          <p className="mb-0">
                            {parentData.middle_name || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Gender</span>
                          <p className="mb-0">{parentData.gender}</p>
                        </div>
                        <div>
                          <span className="small">Date of Birth</span>
                          <p className="mb-0">
                            {formatDateToMMDDYYYY(parentData.date_of_birth)}
                          </p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard
                      title="Background Information"
                      className="bg-secondary bg-opacity-10"
                    >
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Nationality</span>
                          <p className="mb-0 fw-medium">
                            {parentData.nationality}
                          </p>
                        </div>
                        <div>
                          <span className="small">Marital Status</span>
                          <p className="mb-0">
                            {parentData.marital_status}
                          </p>
                        </div>
                        <div>
                          <span className="small">Occupation</span>
                          <p className="mb-0">
                            {parentData.occupation}
                          </p>
                        </div>
                        <div>
                          <span className="small">Status</span>
                          <p className="mb-0">
                            <Badge 
                              bg={parentData.status === "Active" ? "success" : "danger"}
                              className="fs-7"
                            >
                              {parentData.status}
                            </Badge>
                          </p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Contact Information Tab */}
            <Tab
              eventKey="contacts"
              title={
                <span>
                  <i className="bi bi-telephone me-2"></i>
                  Contact Information
                </span>
              }
            >
              <div className="p-3">
                <Row className="g-3">
                  <Col md={6}>
                    <InfoCard
                      title="Primary Contact"
                      className="bg-secondary bg-opacity-10"
                    >
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Email</span>
                          <p className="mb-0 fw-medium text-truncate">
                            {parentData.email || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Phone</span>
                          <p className="mb-0">
                            {parentData.phone || "—"}
                          </p>
                        </div>
                        <div>
                          <span className="small">Alternate Phone</span>
                          <p className="mb-0">
                            {parentData.alternate_phone || "—"}
                          </p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>

                  <Col md={6}>
                    <InfoCard
                      title="Address Information"
                      className="bg-secondary bg-opacity-10"
                    >
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <span className="small">Residential Address</span>
                          <p className="mb-0">
                            {parentData.address || "—"}
                          </p>
                        </div>
                      </div>
                    </InfoCard>
                  </Col>
                </Row>
              </div>
            </Tab>

            {/* Children Information Tab */}
            <Tab
              eventKey="children"
              title={
                <span>
                  <i className="bi bi-people me-2"></i>
                  Children Information
                </span>
              }
            >
              <div className="p-3">
                <Row className="g-3">
                  <Col md={12}>
                    <InfoCard
                      title="Associated Children"
                      className="bg-secondary bg-opacity-10"
                    >
                      {parentData.children && parentData.children.length > 0 ? (
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Grade</th>
                                <th>Class</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parentData.children.map((child) => (
                                <tr key={child.id}>
                                  <td>{child.full_name}</td>
                                  <td>{child.grade}</td>
                                  <td>{child.class || "—"}</td>
                                  <td>
                                    <Badge bg={child.status === "Active" ? "success" : "secondary"}>
                                      {child.status}
                                    </Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <EmptyState
                          message="No children associated with this parent"
                          className="py-4"
                        />
                      )}
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

export default ParentDetails;