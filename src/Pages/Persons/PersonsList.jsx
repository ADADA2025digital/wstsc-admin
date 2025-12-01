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

  // Clean up expired setup links from localStorage
  const cleanupExpiredLinks = () => {
    try {
      const storedSetupLinks = JSON.parse(localStorage.getItem('person_setup_links') || '{}');
      const now = new Date();
      
      const validLinks = {};
      Object.entries(storedSetupLinks).forEach(([personId, linkData]) => {
        const expiresAt = new Date(linkData.expires_at);
        if (expiresAt > now) {
          validLinks[personId] = linkData;
        }
      });
      
      localStorage.setItem('person_setup_links', JSON.stringify(validLinks));
    } catch (err) {
      console.error("Error cleaning up expired links:", err);
    }
  };

  // Fetch persons from backend
  const fetchPersons = async () => {
    try {
      setLoading(true);
      setError("");

      // Clean up expired links first
      cleanupExpiredLinks();

      console.log("Fetching persons from API...");
      const response = await api.get("/admin/persons");
      console.log("API Response:", response.data);

      if (response.data.success) {
        const personsData = response.data.data.persons || [];
        console.log("Processed persons data:", personsData);

        // Get setup links from localStorage
        const storedSetupLinks = JSON.parse(localStorage.getItem('person_setup_links') || '{}');
        console.log("Stored setup links from localStorage:", storedSetupLinks);

        // Transform API data to match table structure
        const formattedPersons = personsData.map((person, index) => {
          const user = person.user || {};
          const primaryRole = user.primary_role || {};
          const allRoles = user.all_roles || [];
          
          // Use primary role for display
          const displayName = primaryRole.display_name || "Unknown Role";
          const roleName = primaryRole.role_name || "unknown";
          
          // Check if user is inactive (case insensitive)
          const status = user.status || "";
          const isActive = status.toLowerCase() === "active";
          const displayStatus = isActive ? "Active" : "Inactive";

          // Get setup URL from localStorage if available
          const storedLink = storedSetupLinks[person.peid];
          const setup_url = storedLink?.url || person.setup_url || null;

          console.log(`Person ${person.peid}: setup_url = ${setup_url}, isActive = ${isActive}`);

          return {
            index: index + 1,
            id: person.peid, // Use peid as the main ID for API calls
            user_id: user.uid,
            name: user.name || person.full_name || "Unknown Name",
            email: user.email || person.person_email || "No email",
            phone: person.person_phone || "Not provided",
            status: displayStatus,
            isActive: isActive,
            role: displayName,
            role_name: roleName,
            // Store additional role information if needed
            all_roles: allRoles,
            primary_role: primaryRole,
            // Store original data for details page
            originalData: person,
            // Get setup URL from localStorage or API response
            setup_url: setup_url,
            // Track if setup link has been copied
            linkCopied: false,
          };
        });

        console.log("Formatted persons with setup URLs:", formattedPersons);
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
      `Person ${newPerson.person_first_name} ${newPerson.person_last_name} created successfully! Setup link has been sent to their email.`
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

    navigate(`/persons/${encodeURIComponent(person.name)}`, {
      state: {
        personId: person.id,
        personData: person.originalData,
      },
    });
  };

  // Function to copy setup link to clipboard
  const copySetupLink = async (personId, setupUrl, personName) => {
    try {
      console.log(`Copying setup link for ${personName}:`, setupUrl);
      
      if (!setupUrl) {
        setError(`No setup link available for ${personName}.`);
        return false;
      }

      await navigator.clipboard.writeText(setupUrl);
      
      console.log(`Setup link copied to clipboard for person ${personId}`);
      
      // Update the local state to show copied status
      setPersons(prev => prev.map(person => 
        person.id === personId 
          ? { ...person, linkCopied: true }
          : person
      ));

      // Show temporary success message
      setSuccessMessage(`Setup link for ${personName} copied to clipboard!`);
      
      // Reset copied status after 2 seconds
      setTimeout(() => {
        setPersons(prev => prev.map(person => 
          person.id === personId 
            ? { ...person, linkCopied: false }
            : person
        ));
      }, 2000);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

      return true;
    } catch (err) {
      console.error("Failed to copy link: ", err);
      setError("Failed to copy link to clipboard. Please try again.");
      return false;
    }
  };

  // Function to regenerate setup link (if needed)
  const regenerateSetupLink = async (personId, personName) => {
    try {
      setError("");
      
      // For now, we'll show a message since we don't have a regenerate endpoint
      setError(`Setup link regeneration is not available via API. Please contact support for ${personName}.`);
      
      return null;
      
    } catch (err) {
      console.error("Error regenerating setup link:", err);
      setError("Failed to regenerate setup link. Please contact support.");
      return null;
    }
  };

  // Fixed toggle status function
  const updatePersonStatus = async (personId) => {
    try {
      console.log(`Toggling status for person: ${personId}`);
      
      const response = await api.put(
        `/admin/persons/${personId}/toggle-status`,
        {}
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

  // Fixed status change handler
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
            isActive: person.is_active,
            name: person.full_name || p.name,
            email: person.person_email || p.email,
            // Clear setup link if user is activated
            setup_url: person.is_active ? null : p.setup_url
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

  // Fixed render function to use current status properly
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
          <div id="spinner-${row.id}" class="spinner-border spinner-border-sm text-primary ms-2 d-none" role="status">
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
      let rolesToDisplay = data;
      let roleNameForBadge = row.role_name;
      
      if (row.all_roles && row.all_roles.length > 1) {
        const roleNames = row.all_roles.map(role => role.display_name);
        rolesToDisplay = roleNames.join(', ');
        roleNameForBadge = row.primary_role?.role_name || row.role_name;
      }
      
      const roleClass = getRoleBadgeClass(roleNameForBadge);
      return `
        <span class="badge ${roleClass}">${rolesToDisplay}</span>
      `;
    }
    return data;
  };

  // Helper function to get badge class based on role
  const getRoleBadgeClass = (roleName) => {
    switch (roleName) {
      case "admin":
        return "bg-info";
      case "teacher":
        return "bg-primary";
      case "parent":
        return "bg-success";
      case "student":
        return "bg-secondary";
      case "staff":
        return "bg-warning";
      default:
        return "bg-danger";
    }
  };

  // Custom render function for Actions column - SIMPLIFIED VERSION
  const renderActionsColumn = (data, type, row) => {
    if (type === "display") {
      const isInactive = !row.isActive;
      const hasSetupLink = row.setup_url;
      const isLinkCopied = row.linkCopied;
      
      let actionsHtml = `
        <div class="d-flex justify-content-center gap-2 align-items-center">
          <button class="btn btn-sm btn-outline-primary view-btn" 
                  data-id="${row.id}" 
                  title="View Details">
            <i class="bi bi-eye"></i>
          </button>
      `;
      
      // Show copy link button ONLY for inactive users
      if (isInactive) {
        const dropdownId = `dropdown-${row.id}`;
        actionsHtml += `
          <div class="dropdown d-inline-block" id="dropdown-container-${row.id}">
            <button class="btn btn-sm btn-outline-secondary copy-link-btn" 
                    data-id="${row.id}"
                    data-name="${row.name}"
                    data-setup-url="${row.setup_url || ''}"
                    title="${row.setup_url ? 'Copy setup link' : 'No setup link available'}"
                    data-dropdown-id="${dropdownId}"
                    aria-expanded="false">
              ${isLinkCopied ?
                '<i class="bi bi-check-circle text-success"></i>' :
                '<i class="bi bi-link-45deg"></i>'
              }
            </button>
            ${row.setup_url ? `
              <div class="dropdown-menu p-2" 
                   id="${dropdownId}" 
                   style="min-width: 300px; display: none; position: absolute; z-index: 1000; background: white; border: 1px solid #dee2e6; border-radius: 0.375rem; box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);">
                <div class="d-flex flex-column">
                  <small class="text-muted mb-1">Setup Link for ${row.name}:</small>
                  <div class="input-group input-group-sm">
                    <input type="text" 
                           class="form-control form-control-sm" 
                           value="${row.setup_url}" 
                           readonly 
                           style="font-size: 0.75rem;">
                    <button class="btn btn-outline-primary btn-sm copy-dropdown-btn" 
                            data-url="${row.setup_url}"
                            data-person-id="${row.id}"
                            data-person-name="${row.name}">
                      <i class="bi bi-clipboard"></i>
                    </button>
                  </div>
                  <small class="text-muted mt-1">
                    <i class="bi bi-info-circle me-1"></i>
                    Send this link to complete account setup
                  </small>
                </div>
              </div>
            ` : `
              <div class="dropdown-menu p-2" 
                   id="${dropdownId}" 
                   style="min-width: 250px; display: none; position: absolute; z-index: 1000; background: white; border: 1px solid #dee2e6; border-radius: 0.375rem; box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);">
                <div class="d-flex flex-column">
                  <small class="text-muted mb-1">No setup link available</small>
                  <p class="small mb-2">The setup link might have expired or was already used.</p>
                  <button class="btn btn-sm btn-outline-warning regenerate-btn" 
                          data-id="${row.id}"
                          data-name="${row.name}">
                    <i class="bi bi-arrow-repeat me-1"></i>
                    Regenerate Link
                  </button>
                </div>
              </div>
            `}
          </div>
        `;
      }
      
      actionsHtml += `</div>`;
      return actionsHtml;
    }
    return data;
  };

  // Function to handle dropdown toggle
  const toggleDropdown = (dropdownId, button) => {
    console.log("Toggling dropdown:", dropdownId);
    const dropdown = document.getElementById(dropdownId);
    const isExpanded = button.getAttribute('aria-expanded') === 'true';
    
    // Close all other dropdowns
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      if (menu.id !== dropdownId) {
        menu.style.display = 'none';
      }
    });
    
    // Reset all other buttons
    document.querySelectorAll('.copy-link-btn').forEach(btn => {
      if (btn !== button) {
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    
    // Toggle current dropdown
    if (dropdown) {
      if (isExpanded) {
        dropdown.style.display = 'none';
        button.setAttribute('aria-expanded', 'false');
      } else {
        dropdown.style.display = 'block';
        button.setAttribute('aria-expanded', 'true');
        
        // Position dropdown below button
        const rect = button.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const scrollX = window.scrollX || document.documentElement.scrollLeft;
        
        dropdown.style.top = `${rect.bottom + scrollY + 5}px`;
        dropdown.style.left = `${rect.left + scrollX}px`;
      }
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
          menu.style.display = 'none';
        });
        document.querySelectorAll('.copy-link-btn').forEach(btn => {
          btn.setAttribute('aria-expanded', 'false');
        });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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
            render: renderActionsColumn,
          },
        ],
        responsive: true,
        scrollX: true,
        scrollY: '400px',
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
          if (!data.isActive) {
            $(row).addClass("table-secondary");
          }
        },
        columnDefs: [
          {
            targets: [2, 3, 4, 5],
            visible: true,
            className: 'd-none d-md-table-cell',
          },
        ],
      });

      // Status toggle event handler
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
            if (!success) {
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

      // View person details
      $("#personsTable tbody").on("click", ".view-btn", function () {
        const personId = $(this).data("id");
        const person = personsData.find((p) => p.id === personId);
        if (person) {
          handleViewPerson(person);
        }
      });

      // Handle copy link button click - SIMPLIFIED
      $("#personsTable tbody").on("click", ".copy-link-btn", async function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("Copy link button clicked");
        
        const personId = $(this).data("id");
        const personName = $(this).data("name");
        const setupUrl = $(this).data("setup-url");
        const dropdownId = $(this).data("dropdown-id");
        
        console.log("Button data:", { personId, personName, setupUrl, dropdownId });
        
        // Check if dropdown is currently open
        const dropdown = document.getElementById(dropdownId);
        const isDropdownOpen = dropdown && dropdown.style.display === 'block';
        
        if (setupUrl && !isDropdownOpen) {
          console.log("Copying link directly:", setupUrl);
          // If link exists and dropdown is not open, copy it directly
          await copySetupLink(personId, setupUrl, personName);
        } else {
          console.log("Toggling dropdown");
          // Toggle dropdown
          toggleDropdown(dropdownId, this);
        }
      });

      // Handle copy button in dropdown
      $("#personsTable tbody").on("click", ".copy-dropdown-btn", async function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("Copy dropdown button clicked");
        
        const url = $(this).data("url");
        const personId = $(this).data("person-id");
        const personName = $(this).data("person-name");
        
        console.log("Dropdown copy data:", { url, personId, personName });
        
        await copySetupLink(personId, url, personName);
        
        // Close dropdown after copying
        const dropdown = $(this).closest('.dropdown-menu')[0];
        if (dropdown) {
          dropdown.style.display = 'none';
        }
        const button = $(this).closest('.dropdown').find('.copy-link-btn')[0];
        if (button) {
          button.setAttribute('aria-expanded', 'false');
        }
      });

      // Handle regenerate link button
      $("#personsTable tbody").on("click", ".regenerate-btn", async function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        const personId = $(this).data("id");
        const personName = $(this).data("name");
        
        await regenerateSetupLink(personId, personName);
        
        // Close dropdown
        const dropdown = $(this).closest('.dropdown-menu')[0];
        if (dropdown) {
          dropdown.style.display = 'none';
        }
        const button = $(this).closest('.dropdown').find('.copy-link-btn')[0];
        if (button) {
          button.setAttribute('aria-expanded', 'false');
        }
      });

      // Also handle clicks on the link icon itself (the "i" tag inside the button)
      $("#personsTable tbody").on("click", ".copy-link-btn i", async function (e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("Link icon clicked directly");
        
        const button = $(this).closest('.copy-link-btn');
        const personId = button.data("id");
        const personName = button.data("name");
        const setupUrl = button.data("setup-url");
        const dropdownId = button.data("dropdown-id");
        
        if (setupUrl) {
          console.log("Copying from icon click:", setupUrl);
          await copySetupLink(personId, setupUrl, personName);
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
    <div className="container-fluid px-0 px-md-4 py-3">
      <div className="content-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="H4-heading fw-bold">Persons List</h4>
          <p className="text-muted mb-0">Manage all users in the system</p>
          <small className="text-muted">
            <i className="bi bi-info-circle me-1"></i>
            Inactive users have a link icon to copy their setup link
          </small>
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