// src/App.js
import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";
import "./assets/Styles/Style.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Cookies from "js-cookie";
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

// Temporary debug component
const AuthDebugger = () => {
  React.useEffect(() => {
    const debugInfo = {
      'Token': !!Cookies.get('token'),
      'Authenticated': localStorage.getItem('authenticated'),
      'User Status': localStorage.getItem('user_status'),
      'User Data': localStorage.getItem('userData') ? 'Exists' : 'Missing',
      'Profile Completed': localStorage.getItem('userData') ? 
        JSON.parse(localStorage.getItem('userData')).profile_completed : 'N/A'
    };
    
    console.log('=== AUTH DEBUG INFO ===');
    Object.entries(debugInfo).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.log('========================');
  }, []);

  return null;
};

// Status Debugger Component
const StatusDebugger = () => {
  const [debugInfo, setDebugInfo] = React.useState({});

  React.useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        'Token': !!Cookies.get('token'),
        'Authenticated': localStorage.getItem('authenticated'),
        'User Status': localStorage.getItem('user_status'),
        'User Data': localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')) : 'Missing',
        'Profile Completed': localStorage.getItem('userData') ? 
          JSON.parse(localStorage.getItem('userData')).profile_completed : 'N/A'
      });
    };

    updateDebugInfo();
    
    // Update on storage changes
    const handleStorageChange = () => updateDebugInfo();
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 10, right: 10, background: 'white', padding: '10px', border: '1px solid #ccc', zIndex: 9999, fontSize: '12px', maxWidth: '300px' }}>
      <h6>Auth Debug Info:</h6>
      <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
};

function App() {
  return (
    <LoadingProvider>
      <Router>
        <AuthDebugger />
        {/* Uncomment the line below for debugging */}
        {/* <StatusDebugger /> */}
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