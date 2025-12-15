import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaFileAlt, FaChalkboardTeacher, FaCog, FaSignOutAlt, FaBell, FaSearch } from "react-icons/fa";
import axios from "axios";

// Memoized Student Item
const StudentItem = React.memo(({ student, selected, onClick }) => {
  return (
    <div
      onClick={() => onClick(student)}
      style={{
        width: "500px",
        height: "70px",
        borderRadius: "12px",
        padding: "15px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        cursor: "pointer",
        background: selected ? "#e0e7ff" : "#fff",
        border: selected ? "2px solid #4b6cb7" : "1px solid #ddd",
        boxShadow: selected ? "0 6px 15px rgba(75,108,183,0.3)" : "0 4px 10px rgba(0,0,0,0.1)",
        transition: "all 0.3s ease",
      }}
    >
      <img
        src={student.profileImage}
        alt={student.name}
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          objectFit: "cover",
          border: selected ? "3px solid #4b6cb7" : "3px solid red",
          transition: "all 0.3s ease",
        }}
      />
      <div>
        <h3 style={{ margin: 0 }}>{student.name}</h3>
        <p style={{ margin: "4px 0", color: "#555" }}>
          Grade {student.grade} - Section {student.section}
        </p>
      </div>
    </div>
  );
});

// Sidebar for selected student
const StudentSidebar = React.memo(({ student, studentTab, setStudentTab, setStudentChatOpen }) => {
  return (
    <div
      className="student-info-sidebar"
      style={{
        width: "30%",
        padding: "25px",
        background: "#fff",
        display: student ? "block" : "none",
        boxShadow: "0 0 15px rgba(0,0,0,0.05)",
        position: "fixed",
        right: 0,
        top: "60px",
        height: "calc(100vh - 60px)",
        overflow: "hidden",
        zIndex: 10,
      }}
    >
      {student && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              background: "#becff7ff",
              padding: "25px 10px",
              height: "200px",
              width: "calc(100% + 50px)",
              margin: "-25px -25px 20px",
              textAlign: "center",
              boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                width: "100px",
                height: "100px",
                margin: "-20px auto 15px",
                borderRadius: "50%",
                overflow: "hidden",
                border: "4px solid #4b6cb7",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              }}
            >
              <img
                src={student.profileImage}
                alt={student.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <h2 style={{ margin: "0", fontSize: "22px", marginTop: "-10px", color: "#333" }}>
              {student.name}
            </h2>
            <h2 style={{ margin: "0", fontSize: "16px", color: "#585656ff" }}>
              {student.email || "default.student@example.com"}
            </h2>
          </div>

          <p style={{ color: "#555", fontSize: "16px", margin: "5px 0" }}>
            <strong>Grade:</strong> {student.grade}
          </p>
          <p style={{ color: "#555", fontSize: "16px", margin: "5px 0 20px 0" }}>
            <strong>Section:</strong> {student.section}
          </p>

          {/* Tabs */}
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "15px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              width: "100%",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", borderBottom: "1px solid #eee", marginBottom: "15px" }}>
              {["details", "attendance", "performance"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStudentTab(tab)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontWeight: "600",
                    color: studentTab === tab ? "#4b6cb7" : "#777",
                    borderBottom: studentTab === tab ? "3px solid #4b6cb7" : "3px solid transparent",
                  }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {studentTab === "details" && (
              <div>
                <h4 style={{ marginBottom: "10px", color: "#4b6cb7" }}>Student Details</h4>
                <p style={{ margin: "6px 0", color: "#555" }}>
                  <strong>ID:</strong> {student.studentId}
                </p>
                <p style={{ margin: "6px 0", color: "#555" }}>Additional details can go here.</p>
              </div>
            )}

            {studentTab === "attendance" && (
              <div>
                <h4 style={{ marginBottom: "10px", color: "#4b6cb7" }}>Attendance</h4>
                <p style={{ color: "#555" }}>Student attendance data will be shown here.</p>
              </div>
            )}

            {studentTab === "performance" && (
              <div>
                <h4 style={{ marginBottom: "10px", color: "#4b6cb7" }}>Performance</h4>
                <p style={{ color: "#555" }}>Student performance reports will be displayed here.</p>
              </div>
            )}
          </div>

          {/* Message Button */}
          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
            <button
              style={{
                padding: "10px",
                width: "120px",
                borderRadius: "8px",
                border: "none",
                background: "#4b6cb7",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "0.3s",
                marginTop: "140px",
              }}
              onClick={() => setStudentChatOpen(true)}
            >
              Message
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

function Students() {
  const [students, setStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [sections, setSections] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentChatOpen, setStudentChatOpen] = useState(false);
  const [studentTab, setStudentTab] = useState("details");
  const navigate = useNavigate();

  const teacher = JSON.parse(localStorage.getItem("teacher")) || {};

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

  useEffect(() => {
    if (selectedGrade === "All") {
      setSections([]);
    } else {
      const gradeSections = [
        ...new Set(students.filter((s) => s.grade === selectedGrade).map((s) => s.section)),
      ];
      setSections(gradeSections);
      setSelectedSection("All");
    }
  }, [selectedGrade, students]);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedGrade !== "All" && s.grade !== selectedGrade) return false;
      if (selectedSection !== "All" && s.section !== selectedSection) return false;
      return true;
    });
  }, [students, selectedGrade, selectedSection]);

  return (
    <div className="dashboard-page">
      {/* ---------------- TOP NAVBAR ---------------- */}
      <nav className="top-navbar">
        <h2>Gojo Dashboard</h2>
        <div className="nav-search">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search Teacher and Student..." />
        </div>
        <div className="nav-right">
          <div className="icon-circle">
            <FaBell />
          </div>
          <div className="icon-circle">
            <FaCog />
          </div>
          <img src={teacher.profileImage || "/default-profile.png"} alt="teacher" className="profile-img" />
        </div>
      </nav>

      <div className="google-dashboard" style={{ display: "flex" }}>
        {/* SIDEBAR */}
        <div className="google-sidebar">
          <div className="sidebar-profile">
            <div className="sidebar-img-circle">
              <img src={teacher.profileImage || "/default-profile.png"} alt="profile" />
            </div>
            <h3>{teacher.name}</h3>
            <p>{teacher.username}</p>
          </div>
          <div className="sidebar-menu">
            <Link className="sidebar-btn" to="/dashboard">
              <FaHome /> Home
            </Link>
            <Link className="sidebar-btn" to="/my-posts">
              <FaFileAlt /> My Posts
            </Link>
            <Link className="sidebar-btn" to="/teachers">
              <FaChalkboardTeacher /> Teachers
            </Link>
            <Link className="sidebar-btn" to="/students" style={{ background: "#4b6cb7", color: "#fff" }}>
              <FaChalkboardTeacher /> Students
            </Link>
            <Link className="sidebar-btn" to="/settings">
              <FaCog /> Settings
            </Link>
            <button
              className="sidebar-btn logout-btn"
              onClick={() => {
                localStorage.removeItem("teacher");
                window.location.href = "/login";
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content" style={{ padding: "30px", width: "65%", marginLeft: "180px" }}>
          <h2 style={{ marginBottom: "20px", textAlign: "center" }}>Students</h2>

          {/* Grade Filter */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "25px", gap: "12px" }}>
            {["All", "9", "10", "11", "12"].map((g) => (
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
              {["All", ...sections].map((section) => (
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
              {filteredStudents.map((s) => (
                <StudentItem
                  key={s.studentId}
                  student={s}
                  selected={selectedStudent?.studentId === s.studentId}
                  onClick={setSelectedStudent}
                />
              ))}
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <StudentSidebar
          student={selectedStudent}
          studentTab={studentTab}
          setStudentTab={setStudentTab}
          setStudentChatOpen={setStudentChatOpen}
        />

        {/* CHAT POPUP */}
        {studentChatOpen && selectedStudent && (
          <div
            style={{
              position: "fixed",
              width: "320px",
              background: "#fff",
              borderRadius: "12px",
              boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
              padding: "15px",
              zIndex: 999,
              right: "22px",
              bottom: "6px",
              animation: "fadeIn 0.3s ease",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
              <strong>{selectedStudent.name}</strong>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    setStudentChatOpen(false);
                    navigate("/student-chat", { state: { studentId: selectedStudent.studentId } });
                  }}
                  style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}
                >
                  <img width="30" height="30" src="https://img.icons8.com/ios-glyphs/30/expand--v1.png" alt="expand" />
                </button>
                <button onClick={() => setStudentChatOpen(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
              </div>
            </div>
            <div style={{ height: "260px", overflowY: "auto", padding: "10px" }}>
              <p style={{ color: "#aaa", textAlign: "center" }}>Start a conversation with {selectedStudent.name}...</p>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <input type="text" placeholder="Type a message..." style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} />
              <button style={{ background: "#4b6cb7", padding: "10px 15px", color: "#fff", borderRadius: "8px", border: "none", cursor: "pointer" }}>Send</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Students;
