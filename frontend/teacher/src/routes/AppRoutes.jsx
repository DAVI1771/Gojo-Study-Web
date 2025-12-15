import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../components/Login";
import Register from "../components/Register";
import Dashboard from "../components/Dashboard";
import Students from "../components/Students";

/*
import MyPosts from "../pages/MyPosts";
import Teachers from "../pages/Teachers";
import SettingsPage from "../pages/SettingsPage";
import TeacherChatPage from "../pages/TeacherChatPage";
import StudentChatPage from "../pages/StudentChatPage";
*/

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />

        {/*
        <Route path="/my-posts" element={<MyPosts />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/teacher-chat" element={<TeacherChatPage />} />
        <Route path="/student-chat" element={<StudentChatPage />} />
        */}
      </Routes>
    </Router>
  );
}
