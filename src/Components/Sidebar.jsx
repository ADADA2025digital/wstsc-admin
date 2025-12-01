import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import "../assets/Styles/Style.css";
import SideBarLink from "./SideBarLink";
import Icon from "./SideBarIcon";
import api from "../config/axiosConfig";
import { useUserData } from "../hooks/useUserData";

const Sidebar = ({
  isSidebarVisible,
  setIsSidebarVisible,
  collapsed,
  setCollapsed,
  isMobile,
}) => {
  const [activeSection, setActiveSection] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const { userData } = useUserData();
  const sidebarRef = useRef(null);

  // Get user role from userData
  const userRole = userData?.primary_role?.role_name || null;

  // Monitor user role changes
  useEffect(() => {
    if (userRole) {
      console.log("🔄 Sidebar: User role updated to:", userRole);
    }
  }, [userRole]);

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

  // Helper function to add /dashboard prefix to routes
  const dashboardRoute = (path) => {
    // If path already starts with /dashboard, return as is
    if (path.startsWith("/dashboard")) {
      return path;
    }
    // If path is just "/", return "/dashboard"
    if (path === "/") {
      return "/dashboard";
    }
    // Otherwise add /dashboard prefix
    return `/dashboard${path.startsWith("/") ? path : "/" + path}`;
  };

  // Check user roles for conditional rendering
  const isTeacher = userRole === "teacher";
  const isParent = userRole === "parent";
  const isAdmin = userRole === "admin";

  // Role-based sub-items configuration
  const getSubItems = (section) => {
    // If role is not yet loaded, return empty array (sections will be hidden until role is loaded)
    if (userRole === null) {
      return [];
    }

    // console.log(`🔄 Sidebar: Getting sub-items for ${section} as ${userRole}`);

    switch (section) {
      case "enrolment":
        // Admin: hide "Enrol the student"
        if (isAdmin) {
          return [{ label: "View All", to: dashboardRoute("/enrolments") }];
        }
        // Parent: show all enrolment sub-items
        if (isParent) {
          return [
            { label: "View All", to: dashboardRoute("/enrolments") },
            { label: "Enrol student", to: dashboardRoute("/enrol") },
          ];
        }
        return [];

      case "classroom":
        // For teacher or parent, hide "View status Classrooms"
        if (isTeacher || isParent) {
          return [
            { label: "View all classrooms", to: dashboardRoute("/classrooms") },
          ];
        }
        // Admin sees all classroom sub-items
        if (isAdmin) {
          return [
            { label: "View all classrooms", to: dashboardRoute("/classrooms") },
            {
              label: "View Classrooms status",
              to: dashboardRoute("/classroom-status"),
            },
          ];
        }
        return [];

      case "students":
        // All roles that can see students get the same sub-items
        if (isAdmin || isTeacher || isParent) {
          return [
            { label: "View all students", to: dashboardRoute("/students") },
          ];
        }
        return [];

      case "persons":
        // Only admin can see persons
        if (isAdmin) {
          return [
            { label: "View all persons", to: dashboardRoute("/persons") },
          ];
        }
        return [];

      case "principal":
        // Only admin can see principal management
        if (isAdmin) {
          return [
            { label: "View All Principals", to: dashboardRoute("/principals") },
          ];
        }
        return [];

      default:
        return [];
    }
  };

  // Check if section should be visible
  const shouldShowSection = (section) => {
    // If role is not yet loaded, hide all sections except dashboard
    if (userRole === null) {
      return section === "dashboard";
    }

    // console.log(`🔄 Sidebar: Checking visibility for ${section} as ${userRole}`);

    switch (section) {
      case "dashboard":
        return true; // Always visible for all users

      case "enrolment":
        // Show for admin and parent, hide for teacher
        return isAdmin || isParent;

      case "classroom":
        // Show for admin, teacher, and parent
        return isAdmin || isTeacher || isParent;

      case "students":
        // Show for admin, teacher, and parent
        return isAdmin || isTeacher || isParent;

      case "persons":
        // Show only for admin
        return isAdmin;

      case "principal":
        // Show only for admin
        return isAdmin;

      default:
        return false;
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
        {/* Dashboard - Always visible for all users */}
        {shouldShowSection("dashboard") && (
          <ul className="nav flex-column">
            <li className="nav-item">
              <Link
                className="nav-link d-flex align-items-center text-white p-0 py-2"
                to={dashboardRoute("/")}
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

        {/* Enrolment - Show for admin and parent, hide for teacher */}
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

        {/* Classroom - Show for admin, teacher, and parent */}
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

        {/* Persons - Show only for admin */}
        {shouldShowSection("persons") && (
          <ul className="nav flex-column">
            <SideBarLink
              iconType="bi-person-badge"
              label="Persons"
              isExpanded={activeSection === "Persons"}
              onToggle={() => handleToggle("Persons")}
              subItems={getSubItems("persons")}
              collapsed={collapsed && !isHovered}
              onItemClick={handleItemClick}
            />
          </ul>
        )}

        {/* Students - Show for admin, teacher, and parent */}
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

        {/* Principal - Show only for admin */}
        {shouldShowSection("principal") && (
          <ul className="nav flex-column">
            <SideBarLink
              iconType="bi-person-gear"
              label="Principal"
              isExpanded={activeSection === "Principal"}
              onToggle={() => handleToggle("Principal")}
              subItems={getSubItems("principal")}
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
