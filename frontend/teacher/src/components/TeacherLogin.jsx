import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginTeacher } from "../api/teacherApi";
import "../styles/login.css";

const TeacherLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!username || !password) {
      setMessage("Please enter both username and password.");
      return;
    }

    try {
      const data = await loginTeacher(username, password);

      if (data.success && data.teacher) {
        localStorage.setItem("teacher", JSON.stringify(data.teacher));
        navigate("/teacher/dashboard");
      } else {
        setMessage(data.message || "Login failed.");
      }
    } catch (err) {
      console.error("Unexpected error during login:", err);
      setMessage("Unexpected error. Check console.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: "400px" }}>
        <h2>Teacher Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login</button>
        </form>
        {message && <p style={{ color: "red", marginTop: "10px" }}>{message}</p>}
        <p style={{ marginTop: "10px" }}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default TeacherLogin;
