import React, { useState } from "react"; 
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("username", username);
      formData.append("password", password);
      if (profile) formData.append("profile", profile);

      const res = await fetch("http://127.0.0.1:5000/api/register", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        navigate("/login");
      } else {
        setMessage(data.message || "Registration failed");
      }
    } catch (err) {
      setMessage("Server error, try again.");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        animation: "fadeIn 1s ease-in-out",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          width: "350px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <h2 style={{ marginBottom: "20px", color: "#333" }}>Register</h2>
        {message && (
          <div
            style={{
              background: "#ffdddd",
              color: "#d8000c",
              padding: "10px",
              marginBottom: "15px",
              borderRadius: "5px",
              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column" }}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              transition: "0.3s",
            }}
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              transition: "0.3s",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "12px",
              marginBottom: "15px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              transition: "0.3s",
            }}
          />

          {/* Profile Picture Preview */}
          <div style={{ marginBottom: "15px", textAlign: "center" }}>
            {profile && (
              <img
                src={URL.createObjectURL(profile)}
                alt="Profile Preview"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  marginBottom: "10px",
                  border: "3px solid #6B73FF",
                  transition: "transform 0.3s",
                }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfile(e.target.files[0])}
              style={{
                display: "block",
                margin: "0 auto",
                borderRadius: "8px",
                padding: "6px",
                cursor: "pointer",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: "#6B73FF",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#000DFF")}
            onMouseLeave={(e) => (e.target.style.background = "#6B73FF")}
          >
            Register
          </button>
        </form>

        <p style={{ marginTop: "20px", fontSize: "14px" }}>
          Already have an account? <Link to="/login" style={{ color: "#6B73FF", fontWeight: "bold" }}>Login here</Link>
        </p>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          input:focus {
            border-color: #6B73FF;
            box-shadow: 0 0 8px rgba(107,115,255,0.5);
            outline: none;
          }
          button:active {
            transform: scale(0.98);
          }
        `}
      </style>
    </div>
  );
}

export default Register;
