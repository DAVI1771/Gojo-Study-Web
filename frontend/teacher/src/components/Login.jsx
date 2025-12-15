import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaFileAlt,
  FaChalkboardTeacher,
  FaCog,
  FaSignOutAlt,
  FaBell,
  FaSearch,
} from "react-icons/fa";
import axios from "axios";

function Students() {
  const navigate = useNavigate();

  // ================= AUTH =================
  const teacher = JSON.parse(localStorage.getItem("teacher"));

  useEffect(() => {
    if (!teacher) {
      navigate("/login");
    }
  }, [teacher, navigate]);

  // ================= STATE =================
  const [students, setStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [sections, setSections] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentChatOpen, setStudentChatOpen] = useState(false);
  const [studentTab, setStudentTab] = useState("details");

  // ================= FETCH STUDENTS =================
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsRes = await axios.get(
          "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Students.json"
        );
        const usersRes = await axios.get(
          "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json"
        );

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

  // ================= FILTER =================
  useEffect(() => {
    if (selectedGrade === "All") {
      setSections([]);
    } else {
      const gradeSections = [
        ...new Set(
          students
            .filter((s) => s.grade === selectedGrade)
            .map((s) => s.section)
        ),
      ];
      setSections(gradeSections);
      setSelectedSection("All");
    }
  }, [selectedGrade, students]);

  const filteredStudents = students.filter((s) => {
    if (selectedGrade !== "All" && s.grade !== selectedGrade) return false;
    if (selectedSection !== "All" && s.section !== selectedSection) return false;
    return true;
  });

  // ================= UI =================
  return (
    <div className="dashboard-page">
      {/* TOP NAVBAR */}
      <nav className="top-navbar">
        <h2>Gojo Dashboard</h2>

        <div className="nav-search">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search Teacher and Student..." />
        </div>

        <div className="nav-right">
          <div className="icon-circle"><FaBell /></div>
          <div className="icon-circle"><FaCog /></div>
          <img
            src={teacher?.profileImage || "/default-profile.png"}
            alt="teacher"
            className="profile-img"
          />
        </div>
      </nav>

      <div className="google-dashboard" style={{ display: "flex" }}>
        {/* SIDEBAR */}
        <div className="google-sidebar">
          <div className="sidebar-profile">
            <div className="sidebar-img-circle">
              <img src={teacher?.profileImage || "/default-profile.png"} alt="profile" />
            </div>
            <h3>{teacher?.name}</h3>
            <p>{teacher?.username}</p>
          </div>

          <div className="sidebar-menu">
            <button className="sidebar-btn" onClick={() => navigate("/dashboard")}>
              <FaHome /> Home
            </button>

            <Link className="sidebar-btn" to="/my-posts">
              <FaFileAlt /> My Posts
            </Link>

            <Link className="sidebar-btn" to="/teachers">
              <FaChalkboardTeacher /> Teachers
            </Link>

            <Link
              className="sidebar-btn"
              to="/students"
              style={{ background: "#4b6cb7", color: "#fff" }}
            >
              <FaChalkboardTeacher /> Students
            </Link>

            <Link className="sidebar-btn" to="/settings">
              <FaCog /> Settings
            </Link>

            <button
              className="sidebar-btn logout-btn"
              onClick={() => {
                localStorage.removeItem("teacher");
                navigate("/login");
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content" style={{ padding: "30px", width: "65%", marginLeft: "180px" }}>
          <h2 style={{ textAlign: "center" }}>Students</h2>

          {/* GRADE FILTER */}
          <div style={{ display: "flex", justifyContent: "center", gap: "12px", marginBottom: "20px" }}>
            {["All", "9", "10", "11", "12"].map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  background: selectedGrade === g ? "#4b6cb7" : "#ddd",
                  color: selectedGrade === g ? "#fff" : "#000",
                }}
              >
                {g === "All" ? "All Grades" : `Grade ${g}`}
              </button>
            ))}
          </div>

          {/* STUDENT LIST */}
          {filteredStudents.map((s) => (
            <div
              key={s.studentId}
              onClick={() => setSelectedStudent(s)}
              style={{
                width: "500px",
                margin: "10px auto",
                padding: "15px",
                display: "flex",
                gap: "20px",
                borderRadius: "12px",
                cursor: "pointer",
                border: "1px solid #ddd",
              }}
            >
              <img
                src={s.profileImage}
                alt={s.name}
                style={{ width: "50px", height: "50px", borderRadius: "50%" }}
              />
              <div>
                <h3>{s.name}</h3>
                <p>Grade {s.grade} - Section {s.section}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Students;
