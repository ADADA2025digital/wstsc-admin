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
import ResetPassword from "./Pages/ResetPassword";
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
import StudentsStatus from "./Pages/Students/StudentsStatus";
import StudentDetails from "./Pages/Students/StudentDetails";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/setup-password" element={<SetupPassword />} />

        {/* Protected routes */}
        <Route path="/" element={<RootLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/useraccount" element={<UserAccount />} />
          <Route path="/edit-profile" element={<EditProfile />} />

          <Route path="/enrolments" element={<EnrolStudents />} />
          <Route path="/enrolment/:id" element={<EnrolmentDetails />} />
          <Route path="/enrol" element={<EnrolmentForm />} />

          <Route path="/teachers" element={<TeachersTable />} />
          <Route path="/teachers/:id" element={<TeacherDetails />} />

          <Route path="/parents" element={<ParentTable />} />
          <Route path="/parents/:name" element={<ParentDetails />} />

          <Route path="/classrooms" element={<ClassroomsList />} />
          <Route path="/classrooms/:id" element={<ClassroomDetails />} />
          <Route path="/classroom-status" element={<ClassroomsStatus />} />

          <Route path="/students" element={<StudentsList />} />
          <Route path="/students/:id" element={<StudentDetails />} />
          <Route path="/student-status" element={<StudentsStatus />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
