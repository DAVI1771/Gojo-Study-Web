import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "../components/Login";
import Register from "../components/Register";
import Dashboard from "../components/Dashboard";
import Students from "../components/Students";
import Marks from "../components/MarksPage";
import Attendance from "../components/AttendancePage";
import TeacherChatPage from "../components/TeacherChatPage"; // ✅ NEW
import AdminPage from "../components/AdminPage"; // ✅ NEW

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard & Pages */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/admins" element={<AdminPage />} /> {/* ✅ Admin Page */}
        <Route path="/marks" element={<Marks />} />
        <Route path="/attendance" element={<Attendance />} />

        {/* Chat */}
        <Route path="/teacher-chat" element={<TeacherChatPage />} />
      </Routes>
    </Router>
  );
}
