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

// Main ParentTable Component
export default function ParentTable() {
  const [loading, setLoading] = useState(true);
  const [parents, setParents] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();

  // Function to fetch children for a specific parent
  const fetchChildrenForParent = async (parentId) => {
    try {
      console.log(`Fetching children for parent ${parentId}...`);
      const response = await api.get(
        `/admin/parent/${parentId}/student-details`
      );

      if (response.data.success) {
        const students = response.data.data.students || [];
        const childrenNames = students.map((student) => {
          const studentInfo = student.student_info;
          return `${studentInfo.first_given_name} ${studentInfo.family_name}`;
        });

        console.log(
          `Found ${childrenNames.length} children for parent ${parentId}:`,
          childrenNames
        );
        return childrenNames;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching children for parent ${parentId}:`, error);
      // Don't throw error here, just return empty array
      return [];
    }
  };

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
        const formattedParents = await Promise.all(
          parentsData.map(async (parent, index) => {
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

            // Fetch children names for this parent
            const childrenNames = await fetchChildrenForParent(userId);

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
                childrenNames.length > 0
                  ? childrenNames.join(", ")
                  : "No children assigned",
              children_count: childrenNames.length,
              // Store original data for updates
              originalData: parent,
            };
          })
        );

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
      const response = await api.patch(
        `/admin/persons/${parentId}/toggle-status`,
        {
          is_active: newStatus === "Active",
        }
      );

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
      setError("Failed to update parent status");
      return false;
    }
  };

  // Function to refresh children data for a specific parent
  const refreshChildrenData = async (parentId) => {
    try {
      const childrenNames = await fetchChildrenForParent(parentId);

      // Update the specific parent with new children data
      const updatedParents = parents.map((parent) =>
        parent.user_id === parentId
          ? {
              ...parent,
              grade:
                childrenNames.length > 0
                  ? childrenNames.join(", ")
                  : "No children assigned",
              children_count: childrenNames.length,
            }
          : parent
      );

      setParents(updatedParents);
      return childrenNames;
    } catch (error) {
      console.error(`Error refreshing children for parent ${parentId}:`, error);
      return [];
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
              data-parent-id="${row.id}"
              style="cursor: pointer;"
            >
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

  // Custom render function for Children column with refresh button
  const renderChildrenColumn = (data, type, row) => {
    if (type === "display") {
      return `
        <div class="d-flex align-items-center justify-content-between">
          <span class="children-text">${data}</span>
        </div>
      `;
    }
    return data;
  };

  const initializeDataTable = (parentsData) => {
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
            render: renderStatusToggle,
          },
          {
            title: "Children",
            data: "grade",
            className: "text-center text-nowrap",
            orderable: false,
            render: renderChildrenColumn,
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

      // Handle status toggle events
      $("#parentsTable tbody").on(
        "change",
        ".status-toggle-input",
        async function () {
          const parentId = $(this).data("parent-id");
          const isChecked = $(this).is(":checked");
          const newStatus = isChecked ? "Active" : "Inactive";
          const $label = $(this).siblings("label");
          const $spinner = $(`#spinner-${parentId}`);

          // Show loading state
          $(this).prop("disabled", true);
          $spinner.removeClass("d-none");
          const originalText = $label.text();
          $label.text("Updating...");

          try {
            const success = await handleStatusChange(parentId, newStatus);
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

      // Handle refresh children button click
      $("#parentsTable tbody").on(
        "click",
        ".refresh-children-btn",
        async function () {
          const parentId = $(this).data("parent-id");
          const $btn = $(this);
          const $icon = $btn.find("i");
          const $childrenText = $btn.siblings(".children-text");

          // Show loading state
          $btn.prop("disabled", true);
          $icon
            .removeClass("bi-arrow-clockwise")
            .addClass("spinner-border spinner-border-sm");

          try {
            const childrenNames = await refreshChildrenData(parentId);
            $childrenText.text(
              childrenNames.length > 0
                ? childrenNames.join(", ")
                : "No children assigned"
            );

            // Show success feedback
            $btn.removeClass("btn-outline-secondary").addClass("btn-success");
            setTimeout(() => {
              $btn.removeClass("btn-success").addClass("btn-outline-secondary");
            }, 1000);
          } catch (error) {
            console.error("Error refreshing children:", error);
            // Show error feedback
            $btn.removeClass("btn-outline-secondary").addClass("btn-danger");
            setTimeout(() => {
              $btn.removeClass("btn-danger").addClass("btn-outline-secondary");
            }, 1000);
          } finally {
            // Restore button state
            $btn.prop("disabled", false);
            $icon
              .removeClass("spinner-border spinner-border-sm")
              .addClass("bi-arrow-clockwise");
          }
        }
      );

      // VIEW: view parent details
      $("#parentsTable tbody").on("click", ".view-btn", function () {
        const parentId = $(this).data("id");
        const parent = parentsData.find((p) => p.id === parentId);
        if (parent) {
          handleViewParent(parent);
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

  // Add custom CSS for toggle switches and ensure Bootstrap Icons are loaded
  useEffect(() => {
    // Add Bootstrap Icons if not already present
    if (!document.querySelector('link[href*="bootstrap-icons"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href =
        "https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css";
      document.head.appendChild(link);
    }

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
      }
      .status-toggle-container {
        min-width: 120px;
      }
      .bi::before {
        display: inline-block;
      }
      .table-secondary {
        background-color: rgba(0, 0, 0, 0.02) !important;
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
            Refresh All
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