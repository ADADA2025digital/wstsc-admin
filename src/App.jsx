// src/App.js
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import "./assets/Styles/Style.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RootLayout from "./Pages/layout";
import Home from "./Pages/Home";
import UserAccount from "./Pages/UserAccount";
import Login from "./Pages/Login";
import ForgotPassword from "./Pages/ForgotPassword";
import EnrolStudents from "./Pages/Enrolment/EnrolStudents";
import EnrolmentDetails from "./Pages/Enrolment/EnrolmentDetails";
import TeachersTable from "./Pages/Teachers/Teachers";
import TeacherDetails from "./Pages/Teachers/TeacherDetails";
import ParentTable from "./Pages/Parents/Parents";
import ParentDetails from "./Pages/Parents/ParentDetails";
import EnrolmentForm from "./Pages/Enrolment/EnrolmentForm";
import ClassroomsList from "./Pages/Classroom/Classrooms";
import ClassroomDetails from "./Pages/Classroom/ClassroomDetails";
import ClassroomsStatus from "./Pages/Classroom/ClassroomStatus";
import SetupPassword from "./Components/SetupPassword";
import EditProfile from "./Pages/EditProfile";
import StudentsList from "./Pages/Students/StudentsList";
import StudentDetails from "./Pages/Students/StudentDetails";
import PrincipalDetails from "./Pages/Principal/PrincipalDetails";
import Loader from "./Pages/Loader";
import PersonsList from "./Pages/Persons/PersonsList";
import PersonDetails from "./Pages/Persons/PersonDetails";
import RouteGuard from "./Components/RouteGuard";
import AuthGuard from "./Components/AuthGuard";
import AssignPrincipal from "./Pages/Principal/AssignPrincipal";
import { LoadingProvider } from "./Context/LoadingContext";

function App() {
  return (
    <LoadingProvider>
      <Router>
        
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/setup-password" element={<SetupPassword />} />

          {/* Protected routes with layout */}
          <Route
            path="/"
            element={
              <AuthGuard>
                <RootLayout />
              </AuthGuard>
            }
          >
            {/* Routes that require completed profile */}
            <Route
              index
              element={
                <RouteGuard requireProfileComplete={true}>
                  <Home />
                </RouteGuard>
              }
            />

            <Route
              path="/useraccount"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <UserAccount />
                </RouteGuard>
              }
            />

            <Route
              path="/persons"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <PersonsList />
                </RouteGuard>
              }
            />
            <Route
              path="/persons/:name"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <PersonDetails />
                </RouteGuard>
              }
            />

            <Route
              path="/enrolments"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <EnrolStudents />
                </RouteGuard>
              }
            />
            <Route
              path="/enrolment/:id"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <EnrolmentDetails />
                </RouteGuard>
              }
            />
            <Route
              path="/enrol"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <EnrolmentForm />
                </RouteGuard>
              }
            />

            <Route
              path="/teachers"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <TeachersTable />
                </RouteGuard>
              }
            />
            <Route
              path="/teachers/:id"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <TeacherDetails />
                </RouteGuard>
              }
            />

            <Route
              path="/parents"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <ParentTable />
                </RouteGuard>
              }
            />
            <Route
              path="/parents/:name"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <ParentDetails />
                </RouteGuard>
              }
            />

            <Route
              path="/classrooms"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <ClassroomsList />
                </RouteGuard>
              }
            />
            <Route
              path="/classrooms/:id"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <ClassroomDetails />
                </RouteGuard>
              }
            />
            <Route
              path="/classroom-status"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <ClassroomsStatus />
                </RouteGuard>
              }
            />

            <Route
              path="/students"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <StudentsList />
                </RouteGuard>
              }
            />
            <Route
              path="/students/:id"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <StudentDetails />
                </RouteGuard>
              }
            />

            <Route
              path="/principals"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <PrincipalDetails />
                </RouteGuard>
              }
            />

            <Route
              path="/assign-principal"
              element={
                <RouteGuard requireProfileComplete={true}>
                  <AssignPrincipal />
                </RouteGuard>
              }
            />

            {/* Update profile route - inside layout but doesn't require completed profile */}
            <Route path="update-profile" element={<EditProfile />} />
          </Route>

          {/* Optional: Add a catch-all route for 404 */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </Router>
    </LoadingProvider>
  );
}

export default App;