import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "../assets/Styles/Style.css";
import SideBarLink from "./SideBarLink";
import Icon from "./SideBarIcon";
import api from "../config/axiosConfig";

const Sidebar = ({
  isSidebarVisible,
  setIsSidebarVisible,
  collapsed,
  setCollapsed,
  isMobile,
}) => {
  const [activeSection, setActiveSection] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const sidebarRef = useRef(null);

  // Get user data from localStorage and fetch roles
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem("userData"));
        // console.log("User data from localStorage:", userData);

        if (!userData || !userData.role) {
          console.error("No user data or role found in localStorage");
          setDebugInfo("No user data found in localStorage");
          return;
        }

        const userRoleName = userData.role.role_name;
        // console.log("User role from localStorage:", userRoleName);
        setDebugInfo(`User role: ${userRoleName}`);

        // Fetch available roles from API
        const rolesResponse = await api.get("/roles");
        // console.log("Roles API response:", rolesResponse.data);

        if (rolesResponse.data && rolesResponse.data.success) {
          const roles = rolesResponse.data.data;

          // Verify if user's role exists in the system
          const userRoleExists = roles.some(
            (role) => role.role_name === userRoleName
          );
          // console.log("Does user role exist in system?", userRoleExists);

          if (userRoleExists) {
            setUserRole(userRoleName);
            setDebugInfo((prev) => `${prev} | Role verified in system`);
          } else {
            console.error("User role not found in system roles");
            setDebugInfo((prev) => `${prev} | Role NOT found in system`);
          }
        }
      } catch (rolesError) {
        console.error("Error fetching roles:", rolesError);
        setDebugInfo("Error fetching roles from API");
      }
    };

    fetchUserRole();
  }, []);

  const handleToggle = (label) => {
    setActiveSection(activeSection === label ? null : label);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMobile &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        setIsSidebarVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsSidebarVisible, isMobile]);

  const handleItemClick = () => {
    if (isMobile) setIsSidebarVisible(false);
  };

  // Check user roles for conditional rendering
  const isTeacher = userRole === "teacher";
  const isParent = userRole === "parent";
  const isAdmin = userRole === "admin";
  const isRestrictedUser = isTeacher || isParent;

  // Role-based sub-items configuration
  const getSubItems = (section) => {
    // If role is not yet loaded, show all sub-items temporarily
    if (userRole === null) {
      // console.log("Role not loaded yet, showing all sub-items for:", section);
      switch (section) {
        case "enrolment":
          return [
            { label: "View All Enrolments", to: "/enrolments" },
            { label: "Enrol the student", to: "/enrol" },
          ];
        case "teachers":
          return [{ label: "View All Teachers", to: "/teachers" }];
        case "parents":
          return [{ label: "View All Parents", to: "/parents" }];
        case "classroom":
          return [
            { label: "View all classrooms", to: "/classrooms" },
            { label: "View status Classrooms", to: "/classroom-status" },
          ];
        case "students":
          return [
            { label: "View all students", to: "/students" },
          ];
        default:
          return [];
      }
    }

    // console.log(`Getting sub-items for ${section} as ${userRole}`);

    // After role verification, apply restrictions
    switch (section) {
      case "enrolment":
        // Admin should not see "Enrol the student"
        if (isAdmin) {
          return [{ label: "View All Enrolments", to: "/enrolments" }];
        }
        return [
          { label: "View All Enrolments", to: "/enrolments" },
          { label: "Enrol the student", to: "/enrol" },
        ];

      case "teachers":
        // Teachers section: Hidden for both teacher and parent roles
        return isRestrictedUser
          ? []
          : [{ label: "View All Teachers", to: "/teachers" }];

      case "parents": {
        // Parents section: Hidden for both teacher and parent roles
        return isRestrictedUser
          ? []
          : [{ label: "View All Parents", to: "/parents" }];
      }

      case "classroom":
        // Classroom section: For teacher or parent, hide "View status Classrooms"
        if (isRestrictedUser) {
          return [{ label: "View all classrooms", to: "/classrooms" }];
        } else {
          return [
            { label: "View all classrooms", to: "/classrooms" },
            { label: "View status Classrooms", to: "/classroom-status" },
          ];
        }

      case "students":
        // Students section: For teacher or parent, hide "View status Students"
        if (isRestrictedUser) {
          return [{ label: "View all students", to: "/students" }];
        } else {
          return [
            { label: "View all students", to: "/students" },
          ];
        }

      default:
        return [];
    }
  };

  // Check if section should be visible
  const shouldShowSection = (section) => {
    // If role is not yet loaded, show all sections temporarily
    if (userRole === null) {
      // console.log("Role not loaded, showing section:", section);
      return true;
    }

    // console.log(`Checking visibility for ${section} as ${userRole}`);

    switch (section) {
      case "dashboard":
        return true; // Always visible
      case "enrolment":
        return true; // Always visible
      case "teachers":
        // Teachers section: Hidden for both teacher and parent roles
        const showTeachers = !isRestrictedUser;
        // console.log(`Teachers section visible: ${showTeachers}`);
        return showTeachers;
      case "parents":
        // Parents section: Hidden for both teacher and parent roles
        const showParents = !isRestrictedUser;
        // console.log(`Parents section visible: ${showParents}`);
        return showParents;
      case "classroom":
        return true; // Always visible (sub-items are restricted)
      case "students":
        return true; // Always visible (sub-items are restricted)
      default:
        return true;
    }
  };

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar d-flex flex-column text-white position-fixed ${
        collapsed && !isHovered ? "collapsed" : "expanded"
      } ${isSidebarVisible ? "show-sidebar" : "hide-sidebar"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="sidebar-body flex-grow-1 overflow-y-auto px-3 pt-3">
        {/* Dashboard - Always visible */}
        {shouldShowSection("dashboard") && (
          <ul className="nav flex-column">
            <li className="nav-item">
              <Link
                className="nav-link d-flex align-items-center text-white p-0 py-2"
                to="/"
                onClick={() => setActiveSection(null)}
              >
                <div className="d-flex align-items-center flex-grow-1">
                  <Icon type="bi-house" />
                  {!collapsed && <span className="px-3">Dashboard</span>}
                </div>
              </Link>
            </li>
          </ul>
        )}

        {/* Enrolment - Always visible */}
        {shouldShowSection("enrolment") && (
          <ul className="nav flex-column">
            <SideBarLink
              iconType="bi-file-earmark-text"
              label="Enrolment"
              isExpanded={activeSection === "Enrolment"}
              onToggle={() => handleToggle("Enrolment")}
              subItems={getSubItems("enrolment")}
              collapsed={collapsed && !isHovered}
              onItemClick={handleItemClick}
            />
          </ul>
        )}

        {/* Classroom - Always visible, sub-items restricted */}
        {shouldShowSection("classroom") && (
          <ul className="nav flex-column">
            <SideBarLink
              iconType="bi-collection"
              label="Classroom"
              isExpanded={activeSection === "Classroom"}
              onToggle={() => handleToggle("Classroom")}
              subItems={getSubItems("classroom")}
              collapsed={collapsed && !isHovered}
              onItemClick={handleItemClick}
            />
          </ul>
        )}

        {/* Parents - Hidden for teacher and parent roles */}
        {shouldShowSection("parents") && (
          <ul className="nav flex-column">
            <SideBarLink
              iconType="bi-people"
              label="Parents"
              isExpanded={activeSection === "Parents"}
              onToggle={() => handleToggle("Parents")}
              subItems={getSubItems("parents")}
              collapsed={collapsed && !isHovered}
              onItemClick={handleItemClick}
            />
          </ul>
        )}

        {/* Teachers - Hidden for teacher and parent roles */}
        {shouldShowSection("teachers") && (
          <ul className="nav flex-column">
            <SideBarLink
              iconType="bi-person-badge"
              label="Teachers"
              isExpanded={activeSection === "Teachers"}
              onToggle={() => handleToggle("Teachers")}
              subItems={getSubItems("teachers")}
              collapsed={collapsed && !isHovered}
              onItemClick={handleItemClick}
            />
          </ul>
        )}

        {/* Students - Always visible, sub-items restricted */}
        {shouldShowSection("students") && (
          <ul className="nav flex-column">
            <SideBarLink
              iconType="bi-people"
              label="Students"
              isExpanded={activeSection === "Students"}
              onToggle={() => handleToggle("Students")}
              subItems={getSubItems("students")}
              collapsed={collapsed && !isHovered}
              onItemClick={handleItemClick}
            />
          </ul>
        )}
      </div>

      {!collapsed && (
        <div className="sidebar-footer d-flex justify-content-center align-items-center p-3">
          <p className="mb-0" style={{ fontSize: "12px" }}>
            &copy; {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;