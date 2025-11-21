import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import $ from "jquery";
import api from "../../config/axiosConfig";
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
        const personsData = response.data.data.persons || [];
        console.log("Processed persons data:", personsData);

        // Transform API data to match table structure
        const formattedPersons = personsData.map((person, index) => {
          const user = person.user || {};
          const roleData = user.role || {};
          const displayName = roleData.display_name || "Unknown Role";
          const roleName = roleData.role_name || "unknown";

          return {
            index: index + 1,
            id: person.peid, // Use peid as the main ID for API calls
            user_id: user.uid,
            name: user.name || person.full_name || "Unknown Name",
            email: user.email || person.person_email || "No email",
            phone: person.person_phone || "Not provided",
            status: user.status === "active" ? "Active" : "Inactive",
            role: displayName,
            role_name: roleName,
            // Store original data for details page
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
    setShowCreateModal(false);
    setSuccessMessage(
      `Person ${newPerson.person_first_name} ${newPerson.person_last_name} created successfully!`
    );
    fetchPersons();
    setError("");

    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  const handleViewPerson = (person) => {
    console.log("📍 Navigating to person details:", {
      personId: person.id,
      personName: person.name,
      originalData: person.originalData
    });

    // Ensure we're passing both ID and data
    navigate(`/persons/${encodeURIComponent(person.name)}`, {
      state: {
        personId: person.id, // This should be peid from your API
        personData: person.originalData, // The full original data
      },
    });
  };

  // UPDATED: Fixed toggle status function
  const updatePersonStatus = async (personId) => {
    try {
      console.log(`Toggling status for person: ${personId}`);
      
      // Send empty object or no data since API doesn't require request body
      const response = await api.put(
        `/admin/persons/${personId}/toggle-status`,
        {} // Empty object or remove this parameter entirely
      );

      console.log("Toggle status response:", response.data);

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to update status");
      }

      return response.data;
    } catch (err) {
      console.error("Error updating person status:", err);
      setError(err.response?.data?.message || "Failed to update person status");
      throw err;
    }
  };

  // UPDATED: Fixed status change handler
  const handleStatusChange = async (personId, currentStatus) => {
    try {
      const response = await updatePersonStatus(personId);
      
      if (response && response.data) {
        const { person } = response.data;
        const newStatus = person.is_active ? "Active" : "Inactive";
        
        // Update local state
        const updatedPersons = persons.map((p) =>
          p.id === personId ? { 
            ...p, 
            status: newStatus,
            // Also update other fields if returned in response
            name: person.full_name || p.name,
            email: person.person_email || p.email
          } : p
        );
        
        setPersons(updatedPersons);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error handling status change:", error);
      return false;
    }
  };

  // UPDATED: Fixed render function to use current status properly
  const renderStatusToggle = (data, type, row) => {
    if (type === "display") {
      const isActive = data === "Active";
      return `
        <div class="d-flex align-items-center justify-content-center">
          <div class="form-check form-switch mb-0">
            <input 
              class="form-check-input status-toggle-input" 
              type="checkbox" 
              ${isActive ? "checked" : ""}
              data-person-id="${row.id}"
              data-current-status="${data}"
              style="cursor: pointer;"
            />
            <label class="form-check-label small fw-medium ${
              isActive ? "text-success" : "text-danger"
            }" 
                   style="cursor: pointer; margin-left: 0.5rem;">
              ${data}
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
          if (data.status === "Inactive") {
            $(row).addClass("table-secondary");
          }
        },
      });

      // UPDATED: Fixed status toggle event handler
      $("#personsTable tbody").on(
        "change",
        ".status-toggle-input",
        async function () {
          const personId = $(this).data("person-id");
          const currentStatus = $(this).data("current-status");
          const $label = $(this).siblings("label");
          const $spinner = $(`#spinner-${personId}`);

          // Show loading state
          $(this).prop("disabled", true);
          $spinner.removeClass("d-none");
          const originalText = $label.text();
          $label.text("Updating...");

          try {
            const success = await handleStatusChange(personId, currentStatus);
            if (success) {
              console.log("Status updated successfully");
            } else {
              // Revert checkbox on error
              $(this).prop("checked", !$(this).is(":checked"));
              $label.text(originalText);
            }
          } catch (error) {
            console.error("Error updating status:", error);
            $(this).prop("checked", !$(this).is(":checked"));
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
      setError("Failed to initialize table. Please check the console for details.");
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
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
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
        <div className="alert alert-success alert-dismissible fade show" role="alert">
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