import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaFileAlt,
  FaChalkboardTeacher,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaBell, FaClipboardCheck, FaUsers
} from "react-icons/fa";
import "../styles/global.css";

// ---------------- Student Card ----------------
const StudentItem = ({ student, selected, onClick }) => (
  <div
    onClick={() => onClick(student)}
    style={{
      width: "100%",
      borderRadius: "12px",
      padding: "15px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      cursor: "pointer",
      background: selected ? "#e0e7ff" : "#fff",
      border: selected ? "2px solid #4b6cb7" : "1px solid #ddd",
      boxShadow: selected
        ? "0 6px 15px rgba(75,108,183,0.3)"
        : "0 4px 10px rgba(0,0,0,0.1)",
      transition: "all 0.3s ease",
    }}
  >
    <img
      src={student.profileImage || "/default-profile.png"}
      alt={student.name}
      style={{
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        objectFit: "cover",
        border: selected ? "3px solid #4b6cb7" : "3px solid red",
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

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [sections, setSections] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const teacherUserId = "-Og0ocoJTv29t9XHH8_2";

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true);
        const [
          studentsData,
          usersData,
          coursesData,
          teacherAssignmentsData,
          teachersData,
        ] = await Promise.all([
          axios.get(
            "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Students.json"
          ),
          axios.get(
            "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json"
          ),
          axios.get(
            "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Courses.json"
          ),
          axios.get(
            "https://ethiostore-17d9f-default-rtdb.firebaseio.com/TeacherAssignments.json"
          ),
          axios.get(
            "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Teachers.json"
          ),
        ]);

        const teacherEntry = Object.entries(
          teachersData.data || teachersData
        ).find(([_, value]) => value.userId === teacherUserId);

        if (!teacherEntry) throw new Error("Teacher key not found");

        const teacherKey = teacherEntry[0];

        const assignedCourses = Object.values(
          teacherAssignmentsData.data || teacherAssignmentsData
        )
          .filter((a) => a.teacherId === teacherKey)
          .map((a) => a.courseId);

        const filteredStudents = Object.values(
          studentsData.data || studentsData
        )
          .filter((s) =>
            assignedCourses.some((courseId) => {
              const course = (coursesData.data || coursesData)[courseId];
              return (
                course &&
                course.grade === s.grade &&
                course.section === s.section
              );
            })
          )
          .map((s) => {
            const user = Object.values(usersData.data || usersData).find(
              (u) => u.userId === s.userId
            );
            return {
              ...s,
              name: user?.name || "Unknown",
              username: user?.username || "Unknown",
              profileImage: user?.profileImage || "/default-profile.png",
            };
          });

        setStudents(filteredStudents);
        setError("");
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Failed to fetch students. Please try again.");
        setStudents([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, [teacherUserId]);

  useEffect(() => {
    if (selectedGrade === "All") {
      setSections([]);
      setSelectedSection("All");
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

  const grades = [...new Set(students.map((s) => s.grade))].sort();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "300px",
          background: "#fff",
          borderRight: "1px solid #eee",
          padding: "20px",
          boxShadow: "2px 0 12px rgba(0,0,0,0.05)",
          position: "fixed",
          top: "50px",
          left: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <img
            src="/default-profile.png"
            alt="Profile"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              marginBottom: "10px",
            }}
          />
          <h3>Teacher Name</h3>
          <p>@username</p>
        </div>

        <Link className="sidebar-btn" to="/dashboard">
          <FaHome /> Home
        </Link>
        <Link
          className="sidebar-btn"
          to="/students"
          style={{ background: "#4b6cb7", color: "#fff" }}
        >
          <FaUsers /> Students
        </Link>
        <Link
                  className="sidebar-btn"
                  to="/marks"
                  
                ><FaClipboardCheck />
                  Marks
                </Link>
       
         <Link to="/attendance" className="sidebar-btn">
                                              <FaUsers /> Attendance
                                            </Link>
        <Link className="sidebar-btn" to="/settings">
          <FaCog /> Settings
        </Link>
        <Link className="sidebar-btn" to="/logout">
          <FaSignOutAlt /> Logout
        </Link>
      </div>

      {/* Navbar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "60px",
          background: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 30px",
          borderBottom: "1px solid #eee",
          zIndex: 1000,
        }}
      >
        <h2>Students</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FaSearch />
          <FaBell />
          <FaCog />
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          padding: "30px",
          marginLeft: "280px",
          paddingTop: "90px",
        }}
      >
        <div style={{ width: "650px" }}>
          {/* Grades */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "10px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => setSelectedGrade("All")}
              style={{
                padding: "8px 15px",
                borderRadius: "8px",
                background:
                  selectedGrade === "All" ? "#4b6cb7" : "#ddd",
                color: selectedGrade === "All" ? "#fff" : "#000",
                border: "none",
                cursor: "pointer",
              }}
            >
              All Grades
            </button>

            {grades.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGrade(g)}
                style={{
                  padding: "8px 15px",
                  borderRadius: "8px",
                  background:
                    selectedGrade === g ? "#4b6cb7" : "#ddd",
                  color: selectedGrade === g ? "#fff" : "#000",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Grade {g}
              </button>
            ))}
          </div>

          {/* Sections */}
          {selectedGrade !== "All" && sections.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setSelectedSection("All")}
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  background:
                    selectedSection === "All" ? "#4b6cb7" : "#ddd",
                  color: selectedSection === "All" ? "#fff" : "#000",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                All Sections
              </button>

              {sections.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "8px",
                    background:
                      selectedSection === sec ? "#4b6cb7" : "#ddd",
                    color: selectedSection === sec ? "#fff" : "#000",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Section {sec}
                </button>
              ))}
            </div>
          )}

          {/* Student List */}
          {loading && <p>Loading students...</p>}
          {error && <p style={{ color: "red" }}>{error}</p>}
          {!loading && !error && filteredStudents.length === 0 && (
            <p>No students found for this selection.</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredStudents.map((s) => (
              <StudentItem
                key={s.username}
                student={s}
                selected={selectedStudent?.username === s.username}
                onClick={setSelectedStudent}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentsPage;
