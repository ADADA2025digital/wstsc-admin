import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import $ from "jquery";
import api from "../../config/axiosConfig";
import Form from "react-bootstrap/Form";
import CreatePersonModal from "../../Components/CreatePersonModal";
import Loader from "../Loader";

if (typeof window !== "undefined") {
  window.$ = $;
  window.jQuery = $;
}

// Main PersonsList Component
export default function PersonsList() {
  const [loading, setLoading] = useState(true);
  const [persons, setPersons] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Fetch persons from backend
  const fetchPersons = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching persons from API...");
      const response = await api.get("/admin/persons");
      console.log("API Response:", response.data);

      if (response.data.success) {
        // CORRECTED: Use 'persons' instead of 'users'
        const personsData = response.data.data.persons || [];
        console.log("Processed persons data:", personsData);

        // Transform API data to match table structure
        const formattedPersons = personsData.map((person, index) => {
          // Safely extract properties with fallbacks
          const user = person.user || {};
          const roleData = user.role || {};
          const displayName = roleData.display_name || "Unknown Role";
          const roleName = roleData.role_name || "unknown";

          return {
            index: index + 1,
            id: user.uid || person.peid, // Use peid as fallback ID
            user_id: user.uid,
            name: user.name || person.full_name || "Unknown Name",
            email: user.email || person.person_email || "No email",
            phone: person.person_phone || "Not provided",
            status: user.status === "active" ? "Active" : "Inactive",
            role: displayName,
            role_name: roleName,
            // Store original data for updates
            originalData: person,
          };
        });

        console.log("Formatted persons:", formattedPersons);
        setPersons(formattedPersons);
      } else {
        setError(response.data.message || "Failed to fetch persons");
      }
    } catch (err) {
      console.error("Error fetching persons:", err);
      setError(err.response?.data?.message || "Failed to load persons");

      // Fallback to empty array to prevent DataTables errors
      setPersons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersons();
  }, []);

  const handleAddPerson = () => {
    setShowCreateModal(true);
  };

  const handlePersonCreated = (newPerson) => {
    // Close the modal FIRST
    setShowCreateModal(false);

    // Show success message with person details
    setSuccessMessage(
      `Person ${newPerson.person_first_name} ${newPerson.person_last_name} created successfully!`
    );

    // Refresh the persons list
    fetchPersons();
    setError(""); // Clear any existing errors

    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  // In the handleViewPerson function, update the navigate call:
  const handleViewPerson = (person) => {
    // Navigate to person details page using name parameter
    navigate(`/persons/${encodeURIComponent(person.name)}`, {
      state: {
        personId: person.id,
        personData: person.originalData, // Pass the original person data
      },
    });
  };

  const updatePersonStatus = async (personId, newStatus) => {
    try {
      const response = await api.patch(
        `/admin/persons/${personId}/toggle-status`,
        {
          is_active: newStatus === "Active",
        }
      );

      if (!response.data.success) {
        throw new Error("Failed to update status");
      }

      return true;
    } catch (err) {
      console.error("Error updating person status:", err);
      setError(err.response?.data?.message || "Failed to update person status");
      return false;
    }
  };

  const handleStatusChange = async (personId, newStatus) => {
    try {
      const success = await updatePersonStatus(personId, newStatus);
      if (success) {
        // Update local state
        const updatedPersons = persons.map((person) =>
          person.id === personId ? { ...person, status: newStatus } : person
        );
        setPersons(updatedPersons);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error handling status change:", error);
      setError("Failed to update person status");
      return false;
    }
  };

  // Custom render function for Status column
  const renderStatusToggle = (data, type, row) => {
    if (type === "display") {
      const isActive = row.status === "Active";
      return `
        <div class="d-flex align-items-center justify-content-center">
          <div class="form-check form-switch mb-0">
            <input 
              class="form-check-input status-toggle-input" 
              type="checkbox" 
              ${isActive ? "checked" : ""}
              data-person-id="${row.id}"
              style="cursor: pointer;"
            />
            <label class="form-check-label small fw-medium ${
              isActive ? "text-success" : "text-danger"
            }" 
                   style="cursor: pointer; margin-left: 0.5rem;">
              ${row.status}
            </label>
          </div>
          <div id="spinner-${
            row.id
          }" class="spinner-border spinner-border-sm text-primary ms-2 d-none" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      `;
    }
    return data;
  };

  // Custom render function for Role column with badge styling
  const renderRoleColumn = (data, type, row) => {
    if (type === "display") {
      const roleClass = getRoleBadgeClass(row.role_name);
      return `
        <span class="badge ${roleClass}">${data}</span>
      `;
    }
    return data;
  };

  // Helper function to get badge class based on role
  const getRoleBadgeClass = (roleName) => {
    switch (roleName) {
      case "admin":
        return "bg-danger";
      case "teacher":
        return "bg-primary";
      case "parent":
        return "bg-success";
      case "student":
        return "bg-info";
      case "staff":
        return "bg-warning";
      default:
        return "bg-secondary";
    }
  };

  const initializeDataTable = (personsData) => {
    try {
      const table = $("#personsTable").DataTable({
        data: personsData,
        destroy: true,
        columns: [
          {
            title: "ID",
            data: "index",
            className: "text-center",
            width: "60px",
          },
          {
            title: "Name",
            data: "name",
            render: function (data, type, row) {
              return data || "Unknown Name";
            },
          },
          {
            title: "Email",
            data: "email",
            render: function (data, type, row) {
              return data || "No email";
            },
          },
          {
            title: "Phone",
            data: "phone",
            render: function (data, type, row) {
              return data || "Not provided";
            },
          },
          {
            title: "Role",
            data: "role",
            className: "text-center",
            render: renderRoleColumn,
          },
          {
            title: "Status",
            data: "status",
            className: "text-center",
            orderable: false,
            render: renderStatusToggle,
          },
          {
            title: "Actions",
            data: null,
            className: "text-center text-nowrap",
            orderable: false,
            render: function (data, type, row) {
              return `
                <div class="d-flex justify-content-center gap-2">
                  <button class="btn btn-sm btn-outline-primary view-btn" 
                          data-id="${row.id}" 
                          title="View Details">
                    <i class="bi bi-eye"></i>
                  </button>
                </div>
              `;
            },
          },
        ],
        responsive: true,
        scrollX: false,
        pageLength: 10,
        order: [[0, "asc"]],
        language: {
          emptyTable: "No persons found",
          search: "Search persons:",
          loadingRecords: "Loading persons...",
          zeroRecords: "No matching persons found",
          info: "Showing _START_ to _END_ of _TOTAL_ persons",
          infoEmpty: "Showing 0 to 0 of 0 persons",
          infoFiltered: "(filtered from _MAX_ total persons)",
        },
        createdRow: function (row, data, dataIndex) {
          // Add row-specific styling
          if (data.status === "Inactive") {
            $(row).addClass("table-secondary");
          }
        },
      });

      // Handle status toggle events
      $("#personsTable tbody").on(
        "change",
        ".status-toggle-input",
        async function () {
          const personId = $(this).data("person-id");
          const isChecked = $(this).is(":checked");
          const newStatus = isChecked ? "Active" : "Inactive";
          const $label = $(this).siblings("label");
          const $spinner = $(`#spinner-${personId}`);

          // Show loading state
          $(this).prop("disabled", true);
          $spinner.removeClass("d-none");
          const originalText = $label.text();
          $label.text("Updating...");

          try {
            const success = await handleStatusChange(personId, newStatus);
            if (success) {
              $label.text(newStatus);
              $label
                .removeClass("text-success text-danger")
                .addClass(
                  newStatus === "Active" ? "text-success" : "text-danger"
                );

              // Update row styling
              const $row = $(this).closest("tr");
              if (newStatus === "Inactive") {
                $row.addClass("table-secondary");
              } else {
                $row.removeClass("table-secondary");
              }
            } else {
              // Revert on error
              $(this).prop("checked", !isChecked);
              $label.text(originalText);
            }
          } catch (error) {
            console.error("Error updating status:", error);
            $(this).prop("checked", !isChecked);
            $label.text(originalText);
          } finally {
            $(this).prop("disabled", false);
            $spinner.addClass("d-none");
          }
        }
      );

      // VIEW: view person details
      $("#personsTable tbody").on("click", ".view-btn", function () {
        const personId = $(this).data("id");
        const person = personsData.find((p) => p.id === personId);
        if (person) {
          handleViewPerson(person);
        }
      });
    } catch (error) {
      console.error("Error initializing DataTable:", error);
      setError(
        "Failed to initialize table. Please check the console for details."
      );
    }
  };

  useEffect(() => {
    if (loading) return;

    if ($.fn.DataTable.isDataTable("#personsTable")) {
      $("#personsTable").DataTable().destroy();
    }

    if (persons.length > 0) {
      initializeDataTable(persons);
    }

    return () => {
      if ($.fn.DataTable.isDataTable("#personsTable")) {
        $("#personsTable").DataTable().destroy();
      }
    };
  }, [loading, persons]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Persons List</h4>
          <p className="text-muted mb-0">Manage all users in the system</p>
        </div>
        <button className="btn custom-btn" onClick={handleAddPerson}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Person
        </button>
      </div>

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {successMessage && (
        <div
          className="alert alert-success alert-dismissible fade show"
          role="alert"
        >
          <i className="bi bi-check-circle me-2"></i>
          {successMessage}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccessMessage("")}
          ></button>
        </div>
      )}

      <div className="card mt-1 p-3 rounded-3 shadow">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <p className="mb-0">
            {persons.length === 0
              ? "No persons"
              : `Showing ${persons.length} person${
                  persons.length !== 1 ? "s" : ""
                }`}
          </p>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={fetchPersons}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh All
          </button>
        </div>

        {persons.length === 0 && !loading ? (
          <div className="text-center py-5">
            <i className="bi bi-people display-1 text-muted"></i>
            <h5 className="mt-3 text-muted">No Persons Found</h5>
            <p className="text-muted">
              Get started by adding your first person.
            </p>
            <button className="btn custom-btn mt-2" onClick={handleAddPerson}>
              <i className="bi bi-plus-circle me-2"></i>
              Add Person
            </button>
          </div>
        ) : (
          <table
            id="personsTable"
            className="table table-striped table-hover custom-data-table w-100"
          />
        )}
      </div>

      {/* Create Person Modal */}
      <CreatePersonModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPersonCreated={handlePersonCreated}
      />
    </div>
  );
}