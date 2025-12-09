import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaHome, FaFileAlt, FaChalkboardTeacher, FaCog, FaSignOutAlt } from "react-icons/fa";
import axios from "axios";

function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("All");

  const admin = JSON.parse(localStorage.getItem("admin")) || {};

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        // Fetch all necessary data
        const teachersRes = await axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Teachers.json");
        const assignmentsRes = await axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/TeacherAssignments.json");
        const coursesRes = await axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Courses.json");
        const usersRes = await axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json");

        const teachersData = teachersRes.data || {};
        const assignmentsData = assignmentsRes.data || {};
        const coursesData = coursesRes.data || {};
        const usersData = usersRes.data || {};

        const teacherList = Object.keys(teachersData).map(teacherId => {
          const teacher = teachersData[teacherId];
          const user = usersData[teacher.userId] || {};

          // Map all courses assigned to this teacher including section
          const gradesSubjects = Object.values(assignmentsData)
            .filter(a => a.teacherId === teacherId)
            .map(a => {
              const course = coursesData[a.courseId];
              return course
                ? { grade: course.grade, subject: course.subject, section: course.section }
                : null;
            })
            .filter(Boolean);

          return {
            teacherId,
            name: user.name || "No Name",
            profileImage: user.profileImage || "/default-profile.png",
            gradesSubjects,
          };
        });

        setTeachers(teacherList);
      } catch (err) {
        console.error("Error fetching teachers:", err);
      }
    };

    fetchTeachers();
  }, []);

  // Filter teachers by selected grade
  const filteredTeachers =
    selectedGrade === "All"
      ? teachers
      : teachers.filter(t => t.gradesSubjects.some(gs => gs.grade === selectedGrade));

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
            <Link className="sidebar-btn" to="/teachers" style={{ background: "#4b6cb7", color: "#fff" }}>
              <FaChalkboardTeacher /> Teachers
            </Link>
            <Link className="sidebar-btn" to="/students" >
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
          <h2 style={{ marginBottom: "10px", textAlign: "center" }}>Teachers</h2>

          {/* Grade Filter */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "25px" }}>
            <div style={{ display: "flex", gap: "12px" }}>
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
                  {g === "All" ? "All Teachers" : `Grade ${g}`}
                </button>
              ))}
            </div>
          </div>

          {/* Teachers List */}
          {filteredTeachers.length === 0 ? (
            <p style={{ textAlign: "center", color: "#555" }}>No teachers found for this grade.</p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
              }}
            >
              {filteredTeachers.map((t) => (
                <div
                  key={t.teacherId}
                  style={{
                    width: "600px",
                    Height: "60px",
                    border: "1px solid #ddd",
                    borderRadius: "12px",
                    padding: "20px",
                    background: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* Horizontal section: Image + Name aligned left */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      justifyContent: "flex-start",
                    }}
                  >
                    <img
                      src={t.profileImage}
                      alt="teacher"
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        border: "3px solid red",
                        objectFit: "cover",
                      }}
                    />
                    <h3 style={{ marginTop: "-30px" }}>{t.name}</h3>
                  </div>

                {/* Subjects listed horizontally with commas */}
<div style={{ marginTop: "-30px", textAlign: "left", marginLeft: "70px" }}>
  {t.gradesSubjects && t.gradesSubjects.length > 0 ? (
    <p style={{ margin: "4px 0", color: "#555" }}>
      {t.gradesSubjects.map(gs => gs.subject).join(", ")}
    </p>
  ) : (
    <p style={{ color: "#555" }}>No assigned courses</p>
  )}
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

export default TeachersPage;
