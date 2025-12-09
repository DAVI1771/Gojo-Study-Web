import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaHome, FaFileAlt, FaChalkboardTeacher, FaCog, FaSignOutAlt } from "react-icons/fa";
import axios from "axios";

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [sections, setSections] = useState([]);

  const admin = JSON.parse(localStorage.getItem("admin")) || {};

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsRes = await axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Students.json");
        const usersRes = await axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json");

        const studentsData = studentsRes.data || {};
        const usersData = usersRes.data || {};

        const studentList = Object.keys(studentsData).map((id) => {
          const student = studentsData[id];
          const user = usersData[student.userId] || {};
          return {
            studentId: id,
            name: user.name || user.username || "No Name",
            profileImage: user.profileImage || "/default-profile.png",
            grade: student.grade,
            section: student.section,
          };
        });

        setStudents(studentList);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    fetchStudents();
  }, []);

  // Get all unique sections for the selected grade
  useEffect(() => {
    if (selectedGrade === "All") {
      setSections([]);
    } else {
      const gradeSections = [
        ...new Set(students.filter(s => s.grade === selectedGrade).map(s => s.section))
      ];
      setSections(gradeSections);
      setSelectedSection("All");
    }
  }, [selectedGrade, students]);

  const filteredStudents = students.filter(s => {
    if (selectedGrade !== "All" && s.grade !== selectedGrade) return false;
    if (selectedSection !== "All" && s.section !== selectedSection) return false;
    return true;
  });

  return (
    <div className="dashboard-page">
      {/* NAVBAR */}
      <nav className="top-navbar">
        <h2>Gojo Dashboard</h2>
        <div className="nav-right">
          <img src={admin.profileImage || "/default-profile.png"} alt="admin" />
          <span>{admin.name}</span>
        </div>
      </nav>

      <div className="google-dashboard">
        {/* SIDEBAR */}
        <div className="google-sidebar">
          <div className="sidebar-profile">
            <div className="sidebar-img-circle">
              <img src={admin.profileImage || "/default-profile.png"} alt="profile" />
            </div>
            <h3>{admin.name}</h3>
            <p>{admin.username}</p>
          </div>
          <div className="sidebar-menu">
            <Link className="sidebar-btn" to="/dashboard"><FaHome /> Home</Link>
            <Link className="sidebar-btn" to="/my-posts"><FaFileAlt /> My Posts</Link>
            <Link className="sidebar-btn" to="/teachers"><FaChalkboardTeacher /> Teachers</Link>
            <Link className="sidebar-btn" to="/students" style={{ background: "#4b6cb7", color: "#fff" }}>
              <FaChalkboardTeacher /> Students
            </Link>
             <Link className="sidebar-btn" to="/settings" >
                          <FaCog /> Settings
                        </Link>
            <button
              className="sidebar-btn logout-btn"
              onClick={() => {
                localStorage.removeItem("admin");
                window.location.href = "/login";
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content" style={{ padding: "30px", width: "100%" }}>
          <h2 style={{ marginBottom: "20px", textAlign: "center" }}>Students</h2>

          {/* Grade Filter */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "15px", gap: "12px" }}>
            {["All", "9", "10", "11", "12"].map(g => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: selectedGrade === g ? "#4b6cb7" : "#ddd",
                  color: selectedGrade === g ? "#fff" : "#000",
                  cursor: "pointer",
                  border: "none",
                }}
              >
                {g === "All" ? "All Grades" : `Grade ${g}`}
              </button>
            ))}
          </div>

          {/* Section Filter */}
          {selectedGrade !== "All" && sections.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "25px", gap: "12px" }}>
              {["All", ...sections].map(section => (
                <button
                  key={section}
                  onClick={() => setSelectedSection(section)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    background: selectedSection === section ? "#4b6cb7" : "#ddd",
                    color: selectedSection === section ? "#fff" : "#000",
                    cursor: "pointer",
                    border: "none",
                  }}
                >
                  {section === "All" ? "All Sections" : `Section ${section}`}
                </button>
              ))}
            </div>
          )}

          {/* Students List */}
          {filteredStudents.length === 0 ? (
            <p style={{ textAlign: "center", color: "#555" }}>No students found for this selection.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "15px" }}>
              {filteredStudents.map(s => (
                <div
                  key={s.studentId}
                  style={{
                    width: "600px",
                    height: "70px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    padding: "15px",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  <img
                    src={s.profileImage}
                    alt={s.name}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid red",
                    }}
                  />
                  <div>
                    <h3 style={{ margin: 0 }}>{s.name}</h3>
                    <p style={{ margin: "4px 0", color: "#555" }}>
                      Grade {s.grade} - Section {s.section}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentsPage;
