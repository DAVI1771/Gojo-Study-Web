import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaHome, FaCog, FaSignOutAlt, FaUsers, FaClipboardCheck } from "react-icons/fa";
import "../styles/global.css";

function AttendancePage() {
  const teacherId = "-Og0ocvOvNZCR_m2-DCX"; // Replace with current teacherId

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // --- Fetch teacher courses ---
  useEffect(() => {
    async function fetchCourses() {
      const assignmentsRes = await axios.get(
        "https://ethiostore-17d9f-default-rtdb.firebaseio.com/TeacherAssignments.json"
      );
      const assigned = Object.values(assignmentsRes.data || {}).filter(a => a.teacherId === teacherId);

      const coursesRes = await axios.get(
        "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Courses.json"
      );
      const teacherCourses = assigned.map(a => ({ id: a.courseId, ...coursesRes.data[a.courseId] }));
      setCourses(teacherCourses);
      if (teacherCourses.length > 0) setSelectedCourseId(teacherCourses[0].id);
    }
    fetchCourses();
  }, []);

  // --- Fetch students ---
  useEffect(() => {
    async function fetchStudents() {
      if (!selectedCourseId || courses.length === 0) return;

      const selectedCourse = courses.find(c => c.id === selectedCourseId);
      if (!selectedCourse) return;

      const studentsRes = await axios.get(
        "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Students.json"
      );
      const usersRes = await axios.get(
        "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json"
      );

      const filteredStudents = Object.entries(studentsRes.data || {})
        .filter(([id, s]) => s.grade === selectedCourse.grade && s.section === selectedCourse.section)
        .map(([id, s]) => {
          const user = Object.values(usersRes.data || {}).find(u => u.userId === s.userId);
          return {
            studentId: id,
            name: user?.name || "Unknown",
            grade: s.grade,
            section: s.section,
            status: s.status,
          };
        });

      setStudents(filteredStudents);
    }
    fetchStudents();
  }, [selectedCourseId, courses]);

  // --- Fetch existing attendance ---
  useEffect(() => {
    async function fetchAttendance() {
      if (!selectedCourseId) return;
      const snapshot = await axios.get(
        `https://ethiostore-17d9f-default-rtdb.firebaseio.com/Attendance/${selectedCourseId}/${date}.json`
      );
      setAttendance(snapshot.data || {});
    }
    fetchAttendance();
  }, [selectedCourseId, date]);

  const handleMark = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `https://ethiostore-17d9f-default-rtdb.firebaseio.com/Attendance/${selectedCourseId}/${date}.json`,
        attendance
      );
      alert("Attendance saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save attendance");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div style={{ width: "300px", background: "#fff", borderRight: "1px solid #eee", padding: "20px" }}>
        <h3>Teacher Dashboard</h3>
        <Link to="/dashboard" className="sidebar-btn"><FaHome /> Home</Link>
        <Link to="/students" className="sidebar-btn"><FaUsers /> Students</Link>
        <Link to="/marks" className="sidebar-btn"><FaClipboardCheck /> Marks</Link>
        <Link to="/attendance" className="sidebar-btn" style={{ background: "#4b6cb7", color: "#fff" }}>
          <FaUsers /> Attendance
        </Link>
        <Link to="/settings" className="sidebar-btn"><FaCog /> Settings</Link>
        <Link to="/logout" className="sidebar-btn"><FaSignOutAlt /> Logout</Link>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: "50px" }}>
        <h2>Attendance Page</h2>

        {/* Course & Date Selection */}
        <div style={{ marginBottom: "20px" }}>
          <label>
            Select Course:{" "}
            <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}>
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} - Grade {c.grade} Section {c.section}
                </option>
              ))}
            </select>
          </label>
          <label style={{ marginLeft: "20px" }}>
            Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </label>
        </div>

        {/* Attendance Table */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f4f6ff" }}>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Student</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Present</th>
              <th style={{ padding: "10px", border: "1px solid #ddd" }}>Absent</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.studentId}>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>{s.name}</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  <button
                    style={{
                      background: attendance[s.studentId] === "present" ? "green" : "#eee",
                      color: attendance[s.studentId] === "present" ? "#fff" : "#000",
                      padding: "5px 10px",
                      border: "none",
                      borderRadius: "5px",
                    }}
                    onClick={() => handleMark(s.studentId, "present")}
                  >
                    Present
                  </button>
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  <button
                    style={{
                      background: attendance[s.studentId] === "absent" ? "red" : "#eee",
                      color: attendance[s.studentId] === "absent" ? "#fff" : "#000",
                      padding: "5px 10px",
                      border: "none",
                      borderRadius: "5px",
                    }}
                    onClick={() => handleMark(s.studentId, "absent")}
                  >
                    Absent
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          style={{ marginTop: "20px", padding: "10px 20px", borderRadius: "8px", background: "#4b6cb7", color: "#fff", border: "none" }}
          onClick={handleSave}
        >
          Save Attendance
        </button>
      </div>
    </div>
  );
}

export default AttendancePage;
