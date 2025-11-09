import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import $ from "jquery";
import api from "../../config/axiosConfig";
import Form from "react-bootstrap/Form";
import CreatePersonModal from "../../Components/CreatePersonModal";

if (typeof window !== "undefined") {
  window.$ = $;
  window.jQuery = $;
}

// Status Toggle Component
const StatusToggle = ({ parent, onStatusChange }) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(parent.status);

  const handleStatusToggle = async () => {
    const newStatus = currentStatus === "Active" ? "Inactive" : "Active";

    setIsUpdatingStatus(true);

    try {
      const success = await onStatusChange(parent.id, newStatus);
      if (success) {
        setCurrentStatus(newStatus);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const isActive = currentStatus === "Active";

  return (
    <div className="d-flex align-items-center justify-content-center gap-2">
      {isUpdatingStatus && (
        <div
          className="spinner-border spinner-border-sm text-primary"
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
      <Form.Check
        type="switch"
        id={`status-toggle-${parent.id}`}
        label={
          <span
            className={`fw-medium small ${
              isActive ? "text-success" : "text-danger"
            }`}
          >
            {currentStatus}
          </span>
        }
        checked={isActive}
        onChange={handleStatusToggle}
        disabled={isUpdatingStatus}
        className="mb-0"
      />
    </div>
  );
};

// Main ParentTable Component
export default function ParentTable() {
  const [loading, setLoading] = useState(true);
  const [parents, setParents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Fetch parents from backend
  const fetchParents = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Fetching parents from API...");
      const response = await api.get("/admin/parents");
      console.log("API Response:", response.data);

      if (response.data.success) {
        // Handle different possible response structures
        let parentsData = response.data.data;

        // If data is nested under a property, extract it
        if (parentsData && parentsData.parents) {
          parentsData = parentsData.parents;
        } else if (parentsData && Array.isArray(parentsData)) {
          // Already an array, use as is
          parentsData = parentsData;
        } else {
          // If data is not in expected format, try to extract from response
          parentsData = response.data.data || response.data.parents || [];
        }

        console.log("Processed parents data:", parentsData);

        // Transform API data to match table structure
        const formattedParents = parentsData.map((parent, index) => {
          // Safely extract properties with fallbacks
          const personData = parent.person || parent;
          const userId = parent.user_id || parent.id;
          const personId = personData.person_id || personData.id || userId;

          // Build full name safely
          const firstName = personData.first_name || "";
          const lastName = personData.last_name || "";
          const middleName = personData.middle_name || "";
          const fullName =
            [firstName, middleName, lastName]
              .filter((name) => name && name.trim() !== "")
              .join(" ")
              .trim() || "Unknown Name";

          // Handle address data
          let addressText = "Address not available";
          if (personData.address) {
            const addr = personData.address;
            addressText = [
              addr.address_line1,
              addr.address_line2,
              addr.city,
              addr.state,
              addr.country,
            ]
              .filter((part) => part && part.trim() !== "")
              .join(", ");
          } else if (personData.primaryAddress) {
            const addr = personData.primaryAddress;
            addressText = [
              addr.address_line1,
              addr.address_line2,
              addr.city,
              addr.state,
              addr.country,
            ]
              .filter((part) => part && part.trim() !== "")
              .join(", ");
          }

          return {
            index: index + 1,
            id: personId,
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName,
            full_name: fullName,
            gender: personData.gender || "Not specified",
            date_of_birth: personData.date_of_birth,
            nationality: personData.nationality || "Not specified",
            email: personData.email || parent.email,
            phone: personData.phone || "Not provided",
            alternate_phone: personData.alternate_phone,
            marital_status: personData.marital_status || "Not specified",
            occupation: personData.occupation || "Parent",
            address: addressText,
            status: personData.is_active ? "Active" : "Inactive",
            grade:
              parent.children?.map((child) => child.name).join(", ") ||
              parent.students?.map((student) => student.name).join(", ") ||
              "No children assigned",
            // Store original data for updates
            originalData: parent,
          };
        });

        console.log("Formatted parents:", formattedParents);
        setParents(formattedParents);
      } else {
        setError(response.data.message || "Failed to fetch parents");
      }
    } catch (err) {
      console.error("Error fetching parents:", err);
      setError(err.response?.data?.message || "Failed to load parents");

      // Fallback to empty array to prevent DataTables errors
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParents();
  }, []);

  // Debug function to check data structure
  const debugDataStructure = (data) => {
    if (data.length > 0) {
      console.log("First parent data structure:", data[0]);
      console.log("Available properties:", Object.keys(data[0]));
    }
  };

  const handleAddParent = () => {
    setShowCreateModal(true);
  };

  const handleParentCreated = (newParent) => {
    // Show success message with parent details
    setSuccessMessage(
      `Parent ${newParent.first_name} ${newParent.last_name} created successfully!`
    );

    // Refresh the parents list
    fetchParents();
    setError(""); // Clear any existing errors

    // Clear success message after 5 seconds
    setTimeout(() => {
      setSuccessMessage("");
    }, 5000);
  };

  const handleViewParent = (parent) => {
    // Use the parent's full name for the route and pass the data in state
    navigate(`/parents/${encodeURIComponent(parent.full_name)}`, {
      state: {
        parentId: parent.id,
        parentData: parent,
      },
    });
  };

  const updateParentStatus = async (parentId, newStatus) => {
    try {
      const response = await api.patch(`/admin/persons/${parentId}/status`, {
        is_active: newStatus === "Active",
      });

      if (!response.data.success) {
        throw new Error("Failed to update status");
      }

      return true;
    } catch (err) {
      console.error("Error updating parent status:", err);
      setError(err.response?.data?.message || "Failed to update parent status");
      return false;
    }
  };

  const handleStatusChange = async (parentId, newStatus) => {
    try {
      const success = await updateParentStatus(parentId, newStatus);
      if (success) {
        // Update local state
        const updatedParents = parents.map((parent) =>
          parent.id === parentId ? { ...parent, status: newStatus } : parent
        );
        setParents(updatedParents);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error handling status change:", error);
      return false;
    }
  };

  const initializeDataTable = (parentsData) => {
    // Debug the data structure before initializing DataTables
    debugDataStructure(parentsData);

    // Check if we have valid data with required properties
    if (parentsData.length > 0 && !parentsData[0].full_name) {
      console.error("Data missing required properties:", parentsData[0]);
      setError("Data format error: Missing required fields");
      return;
    }

    try {
      const table = $("#parentsTable").DataTable({
        data: parentsData,
        destroy: true,
        columns: [
          {
            title: "ID",
            data: "index",
            className: "text-center",
            width: "60px",
          },
          {
            title: "Full Name",
            data: "full_name",
            render: function (data, type, row) {
              // Safe rendering with fallback
              return data || "Unknown Name";
            },
          },
          {
            title: "Gender",
            data: "gender",
            className: "text-center",
            render: function (data, type, row) {
              return data || "Not specified";
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
            title: "Status",
            data: "status",
            className: "text-center",
            orderable: false,
            render: function (data, type, row) {
              // For DataTables display, we'll use a placeholder
              // The actual toggle will be handled by React
              if (type === "display") {
                return `
                  <div id="status-toggle-${
                    row.id
                  }" className="status-toggle-container">
                    <div className="d-flex align-items-center justify-content-center">
                      <div className="spinner-border spinner-border-sm text-primary d-none" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <div className="form-check form-switch">
                        <input className="form-check-input status-toggle-input" type="checkbox" 
                          ${data === "Active" ? "checked" : ""}
                          data-parent-id="${row.id}"
                          style="cursor: pointer;"
                        >
                        <label className="form-check-label small fw-medium ${
                          data === "Active" ? "text-success" : "text-danger"
                        }" 
                               style="cursor: pointer;">
                          ${data}
                        </label>
                      </div>
                    </div>
                  </div>
                `;
              }
              return data;
            },
          },
          {
            title: "Children",
            data: "grade",
            className: "text-center text-nowrap",
            render: function (data, type, row) {
              return data || "No children assigned";
            },
          },
          {
            title: "Actions",
            data: null,
            className: "text-center text-nowrap",
            orderable: false,
            render: function (data, type, row) {
              return `
                <div className="d-flex justify-content-center gap-2">
                  <button className="btn btn-sm btn-outline-primary view-btn" 
                          data-id="${row.id}" 
                          data-name="${encodeURIComponent(row.full_name)}"
                          title="View Details">
                    <i className="bi bi-eye"></i>
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
          emptyTable: "No parents found",
          search: "Search parents:",
          loadingRecords: "Loading parents...",
          zeroRecords: "No matching parents found",
          info: "Showing _START_ to _END_ of _TOTAL_ parents",
          infoEmpty: "Showing 0 to 0 of 0 parents",
          infoFiltered: "(filtered from _MAX_ total parents)",
        },
        createdRow: function (row, data, dataIndex) {
          // Add any row-specific styling here
          if (data.status === "Inactive") {
            $(row).addClass("table-secondary");
          }
        },
      });

      // Clear previous delegated handlers
      $("#parentsTable tbody").off("click", ".view-btn");
      $("#parentsTable tbody").off("change", ".status-toggle-input");

      // VIEW: view parent details
      $("#parentsTable tbody").on("click", ".view-btn", function () {
        const parentId = $(this).data("id");
        const parentName = $(this).data("name");
        const parent = parentsData.find((p) => p.id === parentId);
        if (parent) {
          handleViewParent(parent);
        }
      });

      // STATUS TOGGLE: handle status changes
      $("#parentsTable tbody").on(
        "change",
        ".status-toggle-input",
        async function () {
          const parentId = $(this).data("parent-id");
          const newStatus = $(this).is(":checked") ? "Active" : "Inactive";
          const $container = $(this).closest(".status-toggle-container");
          const $spinner = $container.find(".spinner-border");
          const $label = $container.find(".form-check-label");

          // Show loading spinner
          $spinner.removeClass("d-none");
          $(this).prop("disabled", true);

          try {
            const success = await handleStatusChange(parentId, newStatus);

            if (success) {
              // Update label
              $label.text(newStatus);
              $label.removeClass("text-success text-danger");
              $label.addClass(
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
              // Revert toggle on error
              $(this).prop("checked", !$(this).is(":checked"));
            }
          } catch (error) {
            console.error("Error updating status:", error);
            // Revert toggle on error
            $(this).prop("checked", !$(this).is(":checked"));
          } finally {
            // Hide loading spinner
            $spinner.addClass("d-none");
            $(this).prop("disabled", false);
          }
        }
      );
    } catch (error) {
      console.error("Error initializing DataTable:", error);
      setError(
        "Failed to initialize table. Please check the console for details."
      );
    }
  };

  useEffect(() => {
    if (loading) return;

    if ($.fn.DataTable.isDataTable("#parentsTable")) {
      $("#parentsTable").DataTable().destroy();
    }

    if (parents.length > 0) {
      initializeDataTable(parents);
    }

    return () => {
      if ($.fn.DataTable.isDataTable("#parentsTable")) {
        $("#parentsTable").DataTable().destroy();
      }
    };
  }, [loading, parents]);

  // Add custom CSS for toggle switches
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .form-check-input:checked {
        background-color: #198754;
        border-color: #198754;
      }
      .form-check-input:focus {
        border-color: #86b7fe;
        outline: 0;
        box-shadow: 0 0 0 0.25rem rgba(25, 135, 84, 0.25);
      }
      .form-switch .form-check-input {
        width: 3em;
        height: 1.5em;
        margin-right: 0.5rem;
      }
      .status-toggle-container {
        min-width: 120px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (loading) {
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
            <p className="mt-3">Loading parents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Parents List</h4>
          <p className="text-muted mb-0">Manage all parents in the system</p>
        </div>
        <button className="btn custom-btn" onClick={handleAddParent}>
          <i className="bi bi-plus-circle me-2"></i>
          Add New Parent
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
            {parents.length === 0
              ? "No parents"
              : `Showing ${parents.length} parent${
                  parents.length !== 1 ? "s" : ""
                }`}
          </p>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={fetchParents}
            disabled={loading}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Refresh
          </button>
        </div>

        {parents.length === 0 && !loading ? (
          <div className="text-center py-5">
            <i className="bi bi-people display-1 text-muted"></i>
            <h5 className="mt-3 text-muted">No Parents Found</h5>
            <p className="text-muted">
              Get started by adding your first parent.
            </p>
            <button className="btn custom-btn mt-2" onClick={handleAddParent}>
              <i className="bi bi-plus-circle me-2"></i>
              Add Parent
            </button>
          </div>
        ) : (
          <table
            id="parentsTable"
            className="table table-striped table-hover custom-data-table w-100"
          />
        )}
      </div>

      {/* Create Parent Modal */}
      <CreatePersonModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPersonCreated={handleParentCreated}
        personType="parent"
      />
    </div>
  );
}
