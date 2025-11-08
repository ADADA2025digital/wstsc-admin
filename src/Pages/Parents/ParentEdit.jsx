import React, { useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Form, Row, Col, Button, Alert, Badge } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

// If you keep seed in a separate module, import it.
// For demo, you can duplicate or import from a shared file.
const seedTeachers = [
  { id: 1, first_name: "Kumar", last_name: "Sivam", middle_name: "Raj", full_name: "Kumar Raj Sivam", gender: "Male", date_of_birth: "1985-03-21", nationality: "Sri Lankan", email: "kumar.sivam@example.com", phone: "0771234567", alternate_phone: "0712345678", marital_status: "Married", occupation: "Science Teacher", address: "Jaffna, Sri Lanka", status: "Active", grade: "Grade 10" },
  { id: 2, first_name: "Tharani", last_name: "Sivapalan", middle_name: "Kala", full_name: "Tharani Kala Sivapalan", gender: "Female", date_of_birth: "1990-07-15", nationality: "Sri Lankan", email: "tharani.siva@example.com", phone: "0772345678", alternate_phone: "0713456789", marital_status: "Married", occupation: "Mathematics Teacher", address: "Kilinochchi, Sri Lanka", status: "Active", grade: "Grade 9" },
  { id: 3, first_name: "Rajesh", last_name: "Kugan", middle_name: "", full_name: "Rajesh Kugan", gender: "Male", date_of_birth: "1988-09-05", nationality: "Sri Lankan", email: "rajesh.kugan@example.com", phone: "0755678901", alternate_phone: "0724567890", marital_status: "Single", occupation: "English Teacher", address: "Mannar, Sri Lanka", status: "Inactive", grade: "Grade 8" },
  { id: 4, first_name: "Bavani", last_name: "Nadarajah", middle_name: "R.", full_name: "Bavani R. Nadarajah", gender: "Female", date_of_birth: "1992-04-12", nationality: "Sri Lankan", email: "bavani.nadarajah@example.com", phone: "0761239876", alternate_phone: "0723459876", marital_status: "Married", occupation: "History Teacher", address: "Vavuniya, Sri Lanka", status: "Active", grade: "Grade 11" },
  { id: 5, first_name: "Sujan", last_name: "Thevakumar", middle_name: "", full_name: "Sujan Thevakumar", gender: "Male", date_of_birth: "1987-10-02", nationality: "Sri Lankan", email: "sujan.theva@example.com", phone: "0779876543", alternate_phone: "0716549876", marital_status: "Married", occupation: "ICT Teacher", address: "Jaffna, Sri Lanka", status: "Active", grade: "Grade 12" },
  { id: 6, first_name: "Anuja", last_name: "Sivasubramaniam", middle_name: "", full_name: "Anuja Sivasubramaniam", gender: "Female", date_of_birth: "1995-11-23", nationality: "Sri Lankan", email: "anuja.siva@example.com", phone: "0754321098", alternate_phone: "0729876543", marital_status: "Single", occupation: "Art Teacher", address: "Kilinochchi, Sri Lanka", status: "Active", grade: "Grade 7" },
  { id: 7, first_name: "Viknesh", last_name: "Niranjan", middle_name: "Thiru", full_name: "Viknesh Thiru Niranjan", gender: "Male", date_of_birth: "1984-05-19", nationality: "Sri Lankan", email: "viknesh.niranjan@example.com", phone: "0772233445", alternate_phone: "0711122334", marital_status: "Married", occupation: "Music Teacher", address: "Mannar, Sri Lanka", status: "Inactive", grade: "Grade 6" },
  { id: 8, first_name: "Mathi", last_name: "Thileepan", middle_name: "K.", full_name: "Mathi K. Thileepan", gender: "Female", date_of_birth: "1989-02-27", nationality: "Sri Lankan", email: "mathi.thileepan@example.com", phone: "0785566778", alternate_phone: "0729988776", marital_status: "Single", occupation: "Tamil Teacher", address: "Vavuniya, Sri Lanka", status: "Active", grade: "Grade 10" },
  { id: 9, first_name: "Nimalan", last_name: "Suthakaran", middle_name: "", full_name: "Nimalan Suthakaran", gender: "Male", date_of_birth: "1991-01-09", nationality: "Sri Lankan", email: "nimalan.sutha@example.com", phone: "0762233445", alternate_phone: "0713344556", marital_status: "Married", occupation: "Physical Education Teacher", address: "Kilinochchi, Sri Lanka", status: "Active", grade: "Grade 9" },
  { id: 10, first_name: "Renu", last_name: "Jeganathan", middle_name: "", full_name: "Renu Jeganathan", gender: "Female", date_of_birth: "1993-06-14", nationality: "Sri Lankan", email: "renu.jeganathan@example.com", phone: "0759988776", alternate_phone: "0714455667", marital_status: "Married", occupation: "Biology Teacher", address: "Jaffna, Sri Lanka", status: "Active", grade: "Grade 13" },
];

const TeacherEdit = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const decodedName = decodeURIComponent(name || "");
  const initialFromState = location.state?.teacherData || null;

  const initialTeacher = useMemo(() => {
    if (initialFromState) return initialFromState;
    return seedTeachers.find(t => t.full_name === decodedName) || null;
  }, [decodedName, initialFromState]);

  const [form, setForm] = useState(() =>
    initialTeacher || {
      first_name: "",
      last_name: "",
      middle_name: "",
      full_name: "",
      gender: "",
      date_of_birth: "",
      nationality: "",
      email: "",
      phone: "",
      alternate_phone: "",
      marital_status: "",
      occupation: "",
      address: "",
      status: "Active",
      grade: "",
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialTeacher) {
      setError(`Could not find teacher: ${decodedName}`);
    }
  }, [initialTeacher, decodedName]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: value,
      ...(name === "first_name" || name === "last_name" || name === "middle_name"
        ? { full_name: [name === "first_name" ? value : f.first_name, name === "middle_name" ? value : f.middle_name, name === "last_name" ? value : f.last_name].filter(Boolean).join(" ").replace(/\s+/g, " ").trim() }
        : {}),
    }));
  };

  const validate = () => {
    if (!form.first_name?.trim()) return "First name is required";
    if (!form.last_name?.trim()) return "Last name is required";
    if (!form.full_name?.trim()) return "Full name is required";
    if (!form.email?.trim()) return "Email is required";
    return "";
  };

  const onCancel = () => {
    navigate(`/teachers/${encodeURIComponent(decodedName)}`);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    try {
      setError("");
      setSaving(true);
      // TODO: call API to persist changes
      await new Promise((r) => setTimeout(r, 500)); // mock

      // Navigate back to details with updated data
      navigate(`/teachers/${encodeURIComponent(form.full_name)}`, {
        state: { teacherData: form },
        replace: true,
      });
    } catch (err) {
      setError(err?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Edit Teacher</h4>
          <p className="text-muted mb-0">Editing: {decodedName}</p>
        </div>
        <Badge bg={form.status === "Active" ? "success" : "danger"}>{form.status || "Inactive"}</Badge>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          <i className="bi bi-exclamation-triangle me-2" />
          {error}
        </Alert>
      )}

      <form onSubmit={onSubmit}>
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-transparent py-3">
            <h5 className="mb-0">
              <i className="bi bi-person-lines-fill me-2"></i>
              Personal Information
            </h5>
          </div>
          <div className="card-body">
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>First Name</Form.Label>
                <Form.Control name="first_name" value={form.first_name || ""} onChange={onChange} required />
              </Col>
              <Col md={4}>
                <Form.Label>Middle Name</Form.Label>
                <Form.Control name="middle_name" value={form.middle_name || ""} onChange={onChange} />
              </Col>
              <Col md={4}>
                <Form.Label>Last Name</Form.Label>
                <Form.Control name="last_name" value={form.last_name || ""} onChange={onChange} required />
              </Col>
              <Col md={4}>
                <Form.Label>Full Name</Form.Label>
                <Form.Control name="full_name" value={form.full_name || ""} onChange={onChange} required />
              </Col>
              <Col md={4}>
                <Form.Label>Gender</Form.Label>
                <Form.Select name="gender" value={form.gender || ""} onChange={onChange}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </Form.Select>
              </Col>
              <Col md={4}>
                <Form.Label>Date of Birth</Form.Label>
                <Form.Control type="date" name="date_of_birth" value={form.date_of_birth || ""} onChange={onChange} />
              </Col>
            </Row>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-transparent py-3">
            <h5 className="mb-0">
              <i className="bi bi-telephone me-2"></i>
              Contact & Background
            </h5>
          </div>
          <div className="card-body">
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" name="email" value={form.email || ""} onChange={onChange} required />
              </Col>
              <Col md={4}>
                <Form.Label>Phone</Form.Label>
                <Form.Control name="phone" value={form.phone || ""} onChange={onChange} />
              </Col>
              <Col md={4}>
                <Form.Label>Alternate Phone</Form.Label>
                <Form.Control name="alternate_phone" value={form.alternate_phone || ""} onChange={onChange} />
              </Col>
              <Col md={4}>
                <Form.Label>Nationality</Form.Label>
                <Form.Control name="nationality" value={form.nationality || ""} onChange={onChange} />
              </Col>
              <Col md={4}>
                <Form.Label>Marital Status</Form.Label>
                <Form.Select name="marital_status" value={form.marital_status || ""} onChange={onChange}>
                  <option value="">Select</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Other</option>
                </Form.Select>
              </Col>
              <Col md={12}>
                <Form.Label>Address</Form.Label>
                <Form.Control as="textarea" rows={2} name="address" value={form.address || ""} onChange={onChange} />
              </Col>
            </Row>
          </div>
        </div>

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-header bg-transparent py-3">
            <h5 className="mb-0">
              <i className="bi bi-briefcase me-2"></i>
              Professional
            </h5>
          </div>
          <div className="card-body">
            <Row className="g-3">
              <Col md={4}>
                <Form.Label>Occupation</Form.Label>
                <Form.Control name="occupation" value={form.occupation || ""} onChange={onChange} />
              </Col>
              <Col md={4}>
                <Form.Label>Grade</Form.Label>
                <Form.Control name="grade" value={form.grade || ""} onChange={onChange} />
              </Col>
              <Col md={4}>
                <Form.Label>Status</Form.Label>
                <Form.Select name="status" value={form.status || ""} onChange={onChange}>
                  <option>Active</option>
                  <option>Inactive</option>
                </Form.Select>
              </Col>
            </Row>
          </div>
        </div>

        <div className="d-flex justify-content-between">
          <Button variant="outline-secondary" onClick={onCancel}>
            <i className="bi bi-arrow-left me-2" />
            Back
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-save me-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TeacherEdit;
