import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaCog, FaSignOutAlt, FaSave, FaBell, FaSearch, FaClipboardCheck, FaUsers, FaChalkboardTeacher, FaFacebookMessenger } from "react-icons/fa";
import "../styles/global.css";

function AttendancePage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [sections, setSections] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);
  
  
    // Load teacher from localStorage on mount
    useEffect(() => {
      const storedTeacher = JSON.parse(localStorage.getItem("teacher"));
      if (storedTeacher) {
        setTeacher(storedTeacher);
      }
    }, []);
  
   const teacherUserId = teacher?.userId;
    

    // ---------------- LOAD LOGGED-IN TEACHER ----------------
    useEffect(() => {
      const storedTeacher = JSON.parse(localStorage.getItem("teacher"));
      if (!storedTeacher) {
        navigate("/login");
        return;
      }
      setTeacherInfo(storedTeacher);
    }, [navigate]);
  
    
   const handleLogout = () => {
      localStorage.removeItem("teacher"); // or "user", depending on your auth
      navigate("/login");
    };
  // ---------------- FETCH COURSES ----------------
  useEffect(() => {
    if (!teacherInfo) return;

    const fetchCourses = async () => {
      try {
        const [assignmentsRes, coursesRes, teachersRes] = await Promise.all([
          axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/TeacherAssignments.json"),
          axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Courses.json"),
          axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Teachers.json")
        ]);

        const assignmentsData = assignmentsRes.data || {};
        const coursesData = coursesRes.data || {};
        const teachersData = teachersRes.data || {};

        const teacherEntry = Object.entries(teachersData)
          .find(([key, value]) => value.userId === teacherInfo.userId);
        if (!teacherEntry) return;

        const teacherKey = teacherEntry[0];

        const assigned = Object.values(assignmentsData).filter(
          a => a.teacherId === teacherKey
        );

        const teacherCourses = Object.entries(coursesData)
          .filter(([courseKey, course]) => assigned.some(a => a.courseId === courseKey))
          .map(([courseKey, course]) => ({ id: courseKey, ...course }));

        setCourses(teacherCourses);
        setSelectedCourse(teacherCourses[0] || null);
      } catch (err) {
        console.error("Error fetching courses:", err);
      }
    };

    fetchCourses();
  }, [teacherInfo]);

  // ---------------- FETCH STUDENTS ----------------
  useEffect(() => {
    if (!teacherUserId) return;

    const fetchStudents = async () => {
      try {
        setLoading(true);

        const [studentsDataRes, usersDataRes, coursesDataRes, teacherAssignmentsRes, teachersDataRes] =
          await Promise.all([
            axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Students.json"),
            axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json"),
            axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Courses.json"),
            axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/TeacherAssignments.json"),
            axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Teachers.json")
          ]);

        const studentsData = studentsDataRes.data || {};
        const usersData = usersDataRes.data || {};
        const coursesData = coursesDataRes.data || {};
        const teacherAssignmentsData = teacherAssignmentsRes.data || {};
        const teachersData = teachersDataRes.data || {};

        const teacherEntry = Object.entries(teachersData)
          .find(([_, t]) => t.userId === teacherUserId);
        if (!teacherEntry) throw new Error("Teacher not found");

        const teacherKey = teacherEntry[0];

        const assignedCourses = Object.values(teacherAssignmentsData)
          .filter(a => a.teacherId === teacherKey)
          .map(a => a.courseId);

        const filteredStudents = Object.entries(studentsData)
          .filter(([studentKey, s]) => 
            assignedCourses.some(courseId => {
              const course = coursesData[courseId];
              return course && course.grade === s.grade && course.section === s.section;
            })
          )
          .map(([studentKey, s]) => {
            const user = Object.values(usersData).find(u => u.userId === s.userId);
            return {
              studentId: studentKey, // <-- Firebase key as studentId
              ...s,
              name: user?.name || "Unknown",
              profileImage: user?.profileImage || "/default-profile.png"
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
    };

    fetchStudents();
  }, [teacherUserId]);

  // ---------------- FETCH ATTENDANCE ----------------
  useEffect(() => {
    if (!selectedCourse) return;

    const fetchAttendance = async () => {
      try {
        const res = await axios.get(
          `https://ethiostore-17d9f-default-rtdb.firebaseio.com/Attendance/${selectedCourse.id}/${date}.json`
        );
        setAttendance(res.data || {});
      } catch (err) {
        console.error("Error fetching attendance:", err);
        setAttendance({});
      }
    };

    fetchAttendance();
  }, [selectedCourse, date]);

  // ---------------- MARK ATTENDANCE ----------------
  const handleMark = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedCourse) {
      alert("Please select a course");
      return;
    }

    try {
      await axios.put(
        `https://ethiostore-17d9f-default-rtdb.firebaseio.com/Attendance/${selectedCourse.id}/${date}.json`,
        attendance
      );
      alert("Attendance saved successfully!");
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert("Failed to save attendance");
    }
  };

  // ---------------- FILTER GRADES & SECTIONS ----------------
  useEffect(() => {
    if (selectedGrade === "All") {
      setSections([]);
      setSelectedSection("All");
    } else {
      const gradeSections = [...new Set(students.filter(s => s.grade === selectedGrade).map(s => s.section))];
      setSections(gradeSections);
      setSelectedSection("All");
    }
  }, [selectedGrade, students]);

  const filteredStudents = students.filter(s => {
    if (selectedGrade !== "All" && s.grade !== selectedGrade) return false;
    if (selectedSection !== "All" && s.section !== selectedSection) return false;
    return true;
  });

  const grades = [...new Set(students.map(s => s.grade))].sort();

  // ---------------- RENDER ----------------
  return (
   <div className="dashboard-page">
             {/* Top Navbar */}
             <nav className="top-navbar">
               <h2>Gojo Dashboard</h2>
               <div className="nav-search">
                 <FaSearch className="search-icon" />
                 <input type="text" placeholder="Search Teacher and Student..." />
               </div>
               <div className="nav-right">
                 <div className="icon-circle"><FaBell /></div>
                 <div className="icon-circle"><FaFacebookMessenger /></div>
                 <div className="icon-circle"><FaCog /></div>
                 
   
         <img src={teacher?.profileImage || "/default-profile.png"} />
   
               </div>
             </nav>
       
             <div className="google-dashboard">
               {/* Sidebar */}
               <div className="google-sidebar">
             {teacher && (
     <div className="sidebar-profile">
       <div className="sidebar-img-circle">
         <img src={teacher.profileImage || "/default-profile.png"} alt="profile" />
       </div>
       <h3>{teacher.name}</h3>
       <p>{teacher.username}</p>
     </div>
   )}
   
                 <div className="sidebar-menu">
                   <Link
                     className="sidebar-btn"
                     to="/dashboard"
                   
                   >
                     <FaHome /> Home
                   </Link>
                   <Link className="sidebar-btn" to="/notes">
                     <FaClipboardCheck /> Notes
                   </Link>
                   <Link className="sidebar-btn" to="/students"   >
                     <FaUsers /> Students
                   </Link>
                   <Link className="sidebar-btn" to="/admins">
                     <FaUsers /> Admins
                   </Link>
                   <Link
                     className="sidebar-btn"
                     to="/parents"
                     
                   >
                     <FaChalkboardTeacher /> Parents
                   </Link>
                   <Link className="sidebar-btn" to="/marks">
                     <FaClipboardCheck /> Marks
                   </Link>
                   <Link className="sidebar-btn" to="/attendance" style={{ backgroundColor: "#4b6cb7", color: "#fff" }}>
                     <FaUsers /> Attendance
                   </Link>
                   <Link className="sidebar-btn" to="/settings">
                     <FaCog /> Settings
                   </Link>
                   <button className="sidebar-btn logout-btn" onClick={handleLogout}>
                     <FaSignOutAlt /> Logout
                   </button>
                 </div>
               </div>
       

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "30px" }}>
          <div style={{ width: "80%", position: "relative", marginLeft: "500px" }}>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Attendance</h2>

            {/* Course Selection */}
            <div style={{ marginBottom: "15px" }}>
              <label>
                Select Course:{" "}
                <select
                  value={selectedCourse?.id || ""}
                  onChange={e => {
                    const course = courses.find(c => c.id === e.target.value);
                    setSelectedCourse(course || null);
                  }}
                  style={{ padding: "6px 10px", borderRadius: "5px" }}
                >
                  <option value="">-- Select Course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} - Grade {c.grade} Section {c.section}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Grades & Sections */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
              <button onClick={() => setSelectedGrade("All")} style={{ padding: "8px 15px", borderRadius: "8px", background: selectedGrade === "All" ? "#4b6cb7" : "#ddd", color: selectedGrade === "All" ? "#fff" : "#000", border: "none" }}>All Grades</button>
              {grades.map(g => (
                <button key={g} onClick={() => setSelectedGrade(g)} style={{ padding: "8px 15px", borderRadius: "8px", background: selectedGrade === g ? "#4b6cb7" : "#ddd", color: selectedGrade === g ? "#fff" : "#000", border: "none" }}>Grade {g}</button>
              ))}
            </div>

            {selectedGrade !== "All" && sections.length > 0 && (
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <button onClick={() => setSelectedSection("All")} style={{ padding: "6px 12px", borderRadius: "8px", background: selectedSection === "All" ? "#4b6cb7" : "#ddd", color: selectedSection === "All" ? "#fff" : "#000", border: "none" }}>All Sections</button>
                {sections.map(sec => (
                  <button key={sec} onClick={() => setSelectedSection(sec)} style={{ padding: "6px 12px", borderRadius: "8px", background: selectedSection === sec ? "#4b6cb7" : "#ddd", color: selectedSection === sec ? "#fff" : "#000", border: "none" }}>Section {sec}</button>
                ))}
              </div>
            )}

            {/* Date Selection */}
            <div style={{ marginBottom: "15px" }}>
              <label>Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
            </div>

            {/* Attendance Table */}
            {loading ? <p>Loading students...</p> :
              error ? <p style={{ color: "red" }}>{error}</p> :
              <table style={{ width: "50%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f4f6ff" }}>
                    <th style={{ padding: "10px", border: "1px solid #ddd" }}>Student</th>
                    <th style={{ padding: "10px", border: "1px solid #ddd" }}>Present</th>
                    <th style={{ padding: "10px", border: "1px solid #ddd" }}>Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => (
                    <tr key={s.studentId}>
                      <td style={{ padding: "10px", border: "1px solid #ddd", display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "35px", height: "35px", borderRadius: "50%", overflow: "hidden", border: "2px solid #e61d03" }}>
                          <img src={s.profileImage || "/default-profile.png"} alt={s.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <span>{s.name}</span>
                      </td>
                      <td style={{ padding: "10px", width: "100px", border: "1px solid #ddd" }}>
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
                      <td style={{ padding: "10px", width: "100px", border: "1px solid #ddd" }}>
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
            }

            <button
              style={{ marginTop: "20px", padding: "10px 20px", borderRadius: "8px", background: "#4b6cb7", color: "#fff", border: "none" }}
              onClick={handleSave}
            >
              Save Attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendancePage;
