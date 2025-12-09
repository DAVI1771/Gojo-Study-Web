import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/login", {
        username,
        password,
      });

      if (res.data.success) {
        localStorage.setItem(
          "admin",
          JSON.stringify({
            adminId: res.data.adminId,
            name: res.data.name,
            username: res.data.username,
            profileImage: res.data.profileImage || "/default-profile.png",
          })
        );

        navigate("/dashboard");
      } else {
        alert(res.data.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("Login failed! Check console for details.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #4b6cb7 0%, #182848 100%)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        animation: "fadeIn 1s ease-in-out",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
          width: "350px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <h2
          style={{
            marginBottom: "25px",
            color: "#333",
            fontSize: "28px",
            fontWeight: "bold",
          }}
        >
          Login
        </h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            padding: "12px",
            marginBottom: "15px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            width: "100%",
            transition: "0.3s",
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            width: "100%",
            transition: "0.3s",
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: "#4b6cb7",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
            width: "100%",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => (e.target.style.background = "#182848")}
          onMouseLeave={(e) => (e.target.style.background = "#4b6cb7")}
        >
          Login
        </button>

        <p style={{ marginTop: "15px", fontSize: "14px", color: "#555" }}>
          I don’t have an account?{" "}
          <a
            href="/register"
            style={{ color: "#4b6cb7", fontWeight: "bold", textDecoration: "none" }}
          >
            Register
          </a>
        </p>
      </div>

      {/* Inline Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          input:focus {
            border-color: #4b6cb7;
            box-shadow: 0 0 10px rgba(75,108,183,0.5);
            outline: none;
          }
          button:active {
            transform: scale(0.97);
          }
        `}
      </style>
    </div>
  );
}

export default Login;
