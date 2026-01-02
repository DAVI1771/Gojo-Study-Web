import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaFileAlt, FaChalkboardTeacher, FaCog, FaSignOutAlt, FaSearch, FaBell, FaUsers, FaClipboardCheck, FaStar, FaCheckCircle, FaTimesCircle, FaFacebookMessenger, FaCommentDots } from "react-icons/fa";
import "../styles/global.css";

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
      boxShadow: selected ? "0 6px 15px rgba(75,108,183,0.3)" : "0 4px 10px rgba(0,0,0,0.1)",
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
  const [studentTab, setStudentTab] = useState("details");
  const [studentChatOpen, setStudentChatOpen] = useState(false);
  const [popupMessages, setPopupMessages] = useState([]);
  const [popupInput, setPopupInput] = useState("");
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState("daily");
  const [assignmentsData, setAssignmentsData] = useState({});
  const [teachersData, setTeachersData] = useState({});
  const [usersData, setUsersData] = useState({});
  const [studentMarks, setStudentMarks] = useState({});
  const [teacherNotes, setTeacherNotes] = useState([]);
  const [newTeacherNote, setNewTeacherNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const teacherUserId = teacherInfo?.userId; // ✅ teacher ID from logged-in teacher
  const [marksData, setMarksData] = useState({});
 
  const [teacher, setTeacher] = useState(null);

  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState("");
  const messagesEndRef = useRef(null);


const navigate = useNavigate();

useEffect(() => {
  const storedTeacher = JSON.parse(localStorage.getItem("teacher"));
  if (!storedTeacher) {
    navigate("/login"); // redirect if not logged in
    return;
  }
  setTeacher(storedTeacher);
}, []);


  // ---------------- LOAD TEACHER INFO ----------------
  useEffect(() => {
    const storedTeacher = JSON.parse(localStorage.getItem("teacher"));
    if (!storedTeacher) {
      navigate("/login");
      return;
    }
    setTeacherInfo(storedTeacher);
  }, [navigate]);

  // ---------------- FETCH STUDENTS ----------------
useEffect(() => {
  if (!teacherInfo?.userId) return;

  async function fetchStudents() {
    try {
      setLoading(true);

      const [
        studentsRes,
        usersRes,
        coursesRes,
        assignmentsRes,
        teachersRes,
      ] = await Promise.all([
        axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Students.json"),
        axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json"),
        axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Courses.json"),
        axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/TeacherAssignments.json"),
        axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Teachers.json"),
      ]);

      const teachers = teachersRes.data || {};
      const teacherEntry = Object.entries(teachers)
        .find(([_, t]) => t.userId === teacherInfo.userId);

      if (!teacherEntry) {
        console.warn("Teacher not found in Teachers node");
        setStudents([]);
        return;
      }

      const teacherKey = teacherEntry[0];

      const assignedCourses = Object.values(assignmentsRes.data || {})
        .filter(a => a.teacherId === teacherKey)
        .map(a => a.courseId);

    const students = Object.entries(studentsRes.data || {}).map(
  ([studentId, s]) => {
    const user = Object.values(usersRes.data || {})
      .find(u => u.userId === s.userId);

    return {
      ...s,
      studentId, // ✅ THIS IS THE KEY FIX
      name: user?.name || "Unknown",
      email: user?.email || "",
      profileImage: user?.profileImage || "/default-profile.png",
    };
  }
).filter(s =>
        assignedCourses.some(cid => {
          const c = coursesRes.data?.[cid];
          return c && c.grade === s.grade && c.section === s.section;
        })
      );

      setStudents(students);
      setError("");

    } catch (e) {
      console.error(e);
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  fetchStudents();
}, [teacherInfo]);


useEffect(() => {
  const chatContainer = document.querySelector(".chat-messages");
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}, [popupMessages]);


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



  // ---------------- FETCH attendance ----------------
// Fetch attendance
  // ---------------- FETCH ATTENDANCE ----------------
  useEffect(() => {
  if (!selectedStudent?.studentId) return;

  async function fetchAttendance() {
    setAttendanceLoading(true);

    try {
      const res = await axios.get(
        "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Attendance.json"
      );

      const attendance = [];

      Object.entries(res.data || {}).forEach(([courseId, dates]) => {
        Object.entries(dates || {}).forEach(([date, students]) => {
          const status = students[selectedStudent.studentId]; // ✅ FIXED
          if (!status) return;

          attendance.push({
            courseId,
            date,
            status,
          });
        });
      });

      setAttendanceData(attendance);
    } catch (err) {
      console.error("Attendance fetch error:", err);
      setAttendanceData([]);
    } finally {
      setAttendanceLoading(false);
    }
  }

  fetchAttendance();
}, [selectedStudent]);

const handleLogout = () => {
    localStorage.removeItem("teacher"); // or "user", depending on your auth
    navigate("/login");
  };


// ---------------- FILTERED ATTENDANCE ----------------
  const filteredAttendance = attendanceData.filter(a => {
    const today = new Date();
    const attDate = new Date(a.date);

    if (attendanceFilter === "daily") {
      return attDate.toDateString() === today.toDateString();
    }
    if (attendanceFilter === "weekly") {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return attDate >= weekStart && attDate <= weekEnd;
    }
    if (attendanceFilter === "monthly") {
      return attDate.getMonth() === today.getMonth() && attDate.getFullYear() === today.getFullYear();
    }
    return true;
  });
  
  // ---------------- FETCH PERFORMANCE ----------------
useEffect(() => {
  if (!selectedStudent?.studentId) return;

  async function fetchMarks() {
    try {
      const res = await axios.get(
        "https://ethiostore-17d9f-default-rtdb.firebaseio.com/ClassMarks.json"
      );

      const marks = {};

      Object.entries(res.data || {}).forEach(([courseId, students]) => {
        if (students[selectedStudent.studentId]) { // ✅ FIXED
          marks[courseId] = students[selectedStudent.studentId];
        }
      });

      setStudentMarks(marks);
    } catch (err) {
      console.error("Marks fetch error:", err);
      setStudentMarks({});
    }
  }

  fetchMarks();
}, [selectedStudent]);


const statusColor = status => status === "present" ? "#34a853" : status === "absent" ? "#ea4335" : "#fbbc05";

 // ---------------- teacher note ----------------
useEffect(() => {
  if (!selectedStudent?.userId) return;

  async function fetchTeacherNotes() {
    try {
      const res = await axios.get(
        `https://ethiostore-17d9f-default-rtdb.firebaseio.com/StudentNotes/${selectedStudent?.userId}.json`
      );

      if (!res.data) {
        setTeacherNotes([]);
        return;
      }

      const notesArr = Object.entries(res.data).map(([id, note]) => ({
        id,
        ...note,
      }));

      // newest first
      notesArr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setTeacherNotes(notesArr);
    } catch (err) {
      console.error("Failed to fetch teacher notes", err);
      setTeacherNotes([]);
    }
  }

  fetchTeacherNotes();
}, [selectedStudent]);

 // ---------------- teacher note visible----------------

const saveTeacherNote = async () => {
  if (!newTeacherNote.trim() || !teacherInfo || !selectedStudent) return;

  setSavingNote(true);

  const noteData = {
    teacherId: teacherInfo.userId,
    teacherName: teacherInfo.name,
    note: newTeacherNote.trim(),
    createdAt: new Date().toISOString(),
  };

  try {
    await axios.post(
      `https://ethiostore-17d9f-default-rtdb.firebaseio.com/StudentNotes/${selectedStudent?.userId}.json`,
      noteData
    );

    setTeacherNotes((prev) => [noteData, ...prev]);
    setNewTeacherNote("");
  } catch (err) {
    console.error("Error saving note", err);
  } finally {
    setSavingNote(false);
  }
};

// Scroll chat to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);




 // Fetch messages for the selected student
  useEffect(() => {
    if (!selectedStudent) return;

    const fetchMessages = async () => {
      try {
        const chatKey =
  (teacher?.userId ?? 0) < (selectedStudent?.userId ?? 0)
    ? `${teacher?.userId}_${selectedStudent?.userId}`
    : `${selectedStudent?.userId}_${teacher?.userId}`;


        const res = await axios.get(
          `https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${chatKey}/messages.json`
        );

        const msgs = res.data
          ? Object.entries(res.data).map(([id, msg]) => ({
              messageId: id,
              ...msg,
            }))
          : [];

        // Sort messages by timestamp
        msgs.sort((a, b) => a.timeStamp - b.timeStamp);

        setMessages(msgs);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setMessages([]);
      }
    };

    fetchMessages();

    // Optional: poll every 5 seconds to get new messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedStudent, teacher?.userId]);

  // Send message
  const sendMessage = async (text) => {
    if (!text.trim() || !selectedStudent) return;

    const newMessage = {
      senderId: teacher?.userId,
      receiverId: selectedStudent?.userId,
      text: text.trim(),
      timeStamp: Date.now(),
      seen: false,
    };

    const chatKey =
  (teacher?.userId ?? 0) < (selectedStudent?.userId ?? 0)
    ? `${teacher?.userId}_${selectedStudent?.userId}`
    : `${selectedStudent?.userId}_${teacher?.userId}`;

    try {
      const res = await axios.post(
        `https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${chatKey}/messages.json`,
        newMessage
      );

      // Add message locally
      setMessages((prev) => [
        ...prev,
        { ...newMessage, messageId: res.data.name },
      ]);
      setNewMessageText("");
      scrollToBottom();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };




useEffect(() => {
  const chatContainer = document.querySelector(".chat-messages");
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }
}, [popupMessages]);


const InfoRow = ({ label, value }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      background: "#ffffff",
      padding: "12px 14px",
      borderRadius: "14px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
      transition: "all 0.25s ease",
    }}
  >
    <span
      style={{
        fontSize: "11px",
        color: "#64748b",
        fontWeight: "600",
        marginBottom: "4px",
        textTransform: "uppercase",
        letterSpacing: "0.6px",
      }}
    >
      {label}
    </span>

    <span
      style={{
        fontSize: "15px",
        color: "#0f172a",
        fontWeight: "700",
        wordBreak: "break-word",
      }}
    >
      {value}
    </span>
  </div>
);


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
                <Link className="sidebar-btn" to="/students"   style={{ backgroundColor: "#4b6cb7", color: "#fff" }}>
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
                <Link className="sidebar-btn" to="/attendance">
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
          <div style={{ width: "40%", position: "relative" }}>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>My Students</h2>

            {/* Grades */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
              <button onClick={() => setSelectedGrade("All")} style={{ padding: "8px 15px", borderRadius: "8px", background: selectedGrade === "All" ? "#4b6cb7" : "#ddd", color: selectedGrade === "All" ? "#fff" : "#000", border: "none" }}>All Grades</button>
              {grades.map(g => (
                <button key={g} onClick={() => setSelectedGrade(g)} style={{ padding: "8px 15px", borderRadius: "8px", background: selectedGrade === g ? "#4b6cb7" : "#ddd", color: selectedGrade === g ? "#fff" : "#000", border: "none" }}>Grade {g}</button>
              ))}
            </div>

            {/* Sections */}
            {selectedGrade !== "All" && (
              <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <button onClick={() => setSelectedSection("All")} style={{ padding: "6px 12px", borderRadius: "8px", background: selectedSection === "All" ? "#4b6cb7" : "#ddd", color: selectedSection === "All" ? "#fff" : "#000", border: "none" }}>All Sections</button>
                {sections.map(sec => (
                  <button key={sec} onClick={() => setSelectedSection(sec)} style={{ padding: "6px 12px", borderRadius: "8px", background: selectedSection === sec ? "#4b6cb7" : "#ddd", color: selectedSection === sec ? "#fff" : "#000", border: "none" }}>Section {sec}</button>
                ))}
              </div>
            )}

            {/* Student list */}
            {loading && <p>Loading students...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}
            {!loading && !error && filteredStudents.length === 0 && <p>No students found.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredStudents.map(s => (
                <StudentItem key={s.userId} student={s} selected={selectedStudent?.userId === s.userId} onClick={setSelectedStudent} />
              ))}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
         {/* RIGHT SIDEBAR */}
{selectedStudent && (
  <div
    style={{
      width: "30%",
      background: "#fff",
      boxShadow: "0 0 15px rgba(0,0,0,0.05)",
      position: "fixed",
      right: 0,
      top: "60px",
      height: "calc(100vh - 60px)",
      zIndex: 10,
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
    }}
  >
    {/* Student Info */}
    <div style={{ textAlign: "center", marginBottom: "20px" }}>
      <div
        style={{
          width: "120px",
          height: "120px",
          margin: "0 auto 15px",
          borderRadius: "50%",
          overflow: "hidden",
          border: "4px solid #4b6cb7",
        }}
      >
        <img
          src={selectedStudent.profileImage}
          alt={selectedStudent.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
      <h2 style={{ margin: 0, fontSize: "22px" }}>{selectedStudent.name}</h2>
      <p style={{ color: "#555", margin: "5px 0" }}>{selectedStudent.email}</p>
      <p style={{ color: "#555", margin: "5px 0" }}>
        <strong>Grade:</strong> {selectedStudent.grade}
      </p>
      <p style={{ color: "#555", margin: "5px 0" }}>
        <strong>Section:</strong> {selectedStudent.section}
      </p>
    </div>

    {/* Tabs */}
    <div style={{ display: "flex", marginBottom: "15px" }}>
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
            borderBottom:
              studentTab === tab ? "3px solid #4b6cb7" : "3px solid transparent",
          }}
        >
          {tab.toUpperCase()}
        </button>
      ))}
    </div>

    {/* Tab Content */}
    <div>
      {/* DETAILS TAB */}
     {studentTab === "details" && selectedStudent && (
  <div style={{ padding: "20px", background: "#f8fafc", minHeight: "calc(100vh - 180px)", position: "relative" }}>
    
    {/* Personal Information */}
    <div
  style={{
    background: "linear-gradient(180deg, #ffffff, #f8fafc)",
    borderRadius: "22px",
    padding: "22px",
    marginBottom: "24px",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)",
    border: "1px solid #e5e7eb",
  }}
>
  {/* Header */}
  <div
    style={{
      textAlign: "center",
      marginBottom: "20px",
    }}
  >
    <h2
      style={{
        fontSize: "20px",
        fontWeight: "100",
        color: "#212424ff",
        marginBottom: "4px",
        letterSpacing: "0.3px",
      }}
    >
       Personal & Parent Information
    </h2>
    
  </div>

  {/* Info Grid */}
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "14px 20px",
    }}
  >
    <InfoRow label="Full Name" value={selectedStudent.name} />
    <InfoRow label="Email" value={selectedStudent.email || "N/A"} />

    <InfoRow label="Grade" value={selectedStudent.grade} />
    <InfoRow label="Section" value={selectedStudent.section} />

    <InfoRow label="Age" value={selectedStudent.age || "N/A"} />
    <InfoRow label="Student ID" value={selectedStudent?.userId} />

    <InfoRow
      label="Enrollment Date"
      value={selectedStudent.enrollmentDate || "N/A"}
    />

    <InfoRow
      label="Parent Name"
      value={selectedStudent.parentName || "N/A"}
    />

    <InfoRow
      label="Parent Phone"
      value={selectedStudent.parentPhone || "N/A"}
    />
  </div>
</div>


    {/* Teacher Notes */}
<div
  style={{
    background: "linear-gradient(180deg, #f1f5f9, #ffffff)",
    borderRadius: "20px",
    padding: "20px",
    marginBottom: "24px",
    boxShadow: "0 15px 40px rgba(15, 23, 42, 0.08)",
  }}
>
  {/* Header */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      fontSize: "18px",
      fontWeight: "800",
      color: "#0f172a",
      marginBottom: "18px",
      letterSpacing: "0.4px",
    }}
  >
    📝 Teacher Notes
  </div>

  {/* Input Area */}
  <div
    style={{
      background: "#ffffff",
      borderRadius: "16px",
      padding: "14px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
      marginBottom: "18px",
      transition: "all 0.3s ease",
    }}
  >
    <textarea
      value={newTeacherNote}
      onChange={(e) => setNewTeacherNote(e.target.value)}
      placeholder="Write a note about this student… 😊"
      style={{
        width: "100%",
        minHeight: "75px",
        border: "none",
        outline: "none",
        resize: "none",
        fontSize: "14px",
        color: "#0f172a",
        lineHeight: "1.6",
        background: "transparent",
      }}
    />

    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
      <button
        onClick={saveTeacherNote}
        disabled={savingNote}
        style={{
          padding: "9px 18px",
          borderRadius: "999px",
          border: "none",
          background: "linear-gradient(135deg, #38bdf8, #2563eb)",
          color: "#fff",
          fontWeight: "700",
          fontSize: "13px",
          cursor: "pointer",
          opacity: savingNote ? 0.6 : 1,
          boxShadow: "0 6px 18px rgba(37, 99, 235, 0.4)",
          transition: "all 0.25s ease",
        }}
      >
        {savingNote ? "Saving…" : "Send"}
      </button>
    </div>
  </div>

  {/* Notes List */}
  {teacherNotes.length === 0 ? (
    <div
      style={{
        textAlign: "center",
        color: "#94a3b8",
        fontSize: "14px",
        padding: "12px",
      }}
    >
      No notes yet
    </div>
  ) : (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {teacherNotes.map((n) => {
        const initials = n.teacherName
          ?.split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return (
          <div
            key={n.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
              animation: "fadeIn 0.3s ease",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #60a5fa, #2563eb)",
                color: "#fff",
                fontWeight: "800",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
              }}
            >
              {initials}
            </div>

            {/* Message Bubble */}
            <div
              style={{
                maxWidth: "80%",
                background: "#e0f2fe",
                borderRadius: "16px 16px 16px 6px",
                padding: "12px 14px",
                boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "#0369a1",
                  marginBottom: "4px",
                }}
              >
                {n.teacherName}
              </div>

              <div
                style={{
                  fontSize: "14px",
                  color: "#0f172a",
                  lineHeight: "1.6",
                  whiteSpace: "pre-wrap",
                }}
              >
                {n.note}
              </div>

              <div
                style={{
                  fontSize: "11px",
                  color: "#64748b",
                  marginTop: "6px",
                  textAlign: "right",
                }}
              >
                {new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  )}

  {/* Animation */}
  <style>
    {`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `}
  </style>
</div>




    {/* Achievements */}
    {selectedStudent.achievements && selectedStudent.achievements.length > 0 && (
      <div style={{
        background: "#fff",
        borderRadius: "15px",
        padding: "20px",
        marginBottom: "80px", // extra padding for fixed button
        boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
        transition: "all 0.3s ease"
      }}>
        <h2 style={{ fontSize: "20px", color: "#d946ef", fontWeight: "700", marginBottom: "12px", textAlign: "center" }}>
          Achievements
        </h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
          {selectedStudent.achievements.map((ach, idx) => (
            <div key={idx} style={{
              background: "linear-gradient(135deg, #4b6cb7, #182848)",
              color: "#fff",
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "13px",
              fontWeight: "700",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
            }}>
              {ach}
            </div>
          ))}
        </div>
      </div>
    )}


  </div>
)}


     {/* ATTENDANCE TAB */}
{/* ATTENDANCE TAB */}
{studentTab === "attendance" && selectedStudent && (
  <div style={{ padding: "20px", background: "#f8fafc", minHeight: "calc(100vh - 180px)", position: "relative" }}>

    {/* Daily / Weekly / Monthly Tabs */}
    <div style={{ display: "flex", marginBottom: "20px", gap: "10px" }}>
      {["daily", "weekly", "monthly"].map((tab) => (
        <button
          key={tab}
          onClick={() => setAttendanceFilter(tab)}
          style={{
            flex: 1,
            padding: "10px 0",
            border: "none",
            borderRadius: "12px",
            backgroundColor: attendanceFilter === tab ? "#4b6cb7" : "#e5e7eb",
            color: attendanceFilter === tab ? "#fff" : "#475569",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          {tab.toUpperCase()}
        </button>
      ))}
    </div>

    {/* Attendance Summary with Filter Percentages */}
    {!attendanceLoading && attendanceData.length > 0 && (
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "20px",
        padding: "15px 20px",
        background: "#fff",
        borderRadius: "15px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.08)"
      }}>
        {["daily", "weekly", "monthly"].map((filter) => {
          const today = new Date();
          const filteredData = attendanceData.filter(a => {
            const recordDate = new Date(a.date);
            if (filter === "daily") return recordDate.toDateString() === today.toDateString();
            if (filter === "weekly") {
              const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
              const lastDay = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + 6);
              return recordDate >= firstDay && recordDate <= lastDay;
            }
            if (filter === "monthly") return recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear();
            return true;
          });
          const presentCount = filteredData.filter(a => a.status.toLowerCase() === "present").length;
          const percentage = filteredData.length > 0 ? Math.round((presentCount / filteredData.length) * 100) : 0;

          return (
            <div key={filter}>
              <span style={{ fontSize: "14px", color: "#64748b" }}>{filter.toUpperCase()}</span>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#2563eb" }}>{percentage}%</div>
            </div>
          );
        })}
      </div>
    )}

    {/* Attendance Data */}
    {attendanceLoading && <p style={{ textAlign: "center", color: "#888" }}>Loading attendance...</p>}

    {!attendanceLoading && attendanceData.length === 0 && (
      <p style={{ color: "#888", textAlign: "center" }}>🚫 No attendance records found.</p>
    )}

    {!attendanceLoading &&
      attendanceData
        .filter((a) => {
          const today = new Date();
          const recordDate = new Date(a.date);

          if (attendanceFilter === "daily") {
            return recordDate.toDateString() === today.toDateString();
          } else if (attendanceFilter === "weekly") {
            const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            const lastDayOfWeek = new Date(firstDayOfWeek.getFullYear(), firstDayOfWeek.getMonth(), firstDayOfWeek.getDate() + 6);
            return recordDate >= firstDayOfWeek && recordDate <= lastDayOfWeek;
          } else if (attendanceFilter === "monthly") {
            return recordDate.getMonth() === today.getMonth() && recordDate.getFullYear() === today.getFullYear();
          }
          return true;
        })
        .map((a, index) => (
          <div
            key={index}
            style={{
              marginBottom: "15px",
              padding: "15px 20px",
              borderRadius: "15px",
              background: "#fff",
              boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
            }}
          >
            {/* Subject + Date */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
              <span style={{ fontWeight: "700", fontSize: "16px", color: "#2563eb" }}>{a.subject}</span>
              <span style={{ fontSize: "13px", color: "#64748b" }}>{a.date}</span>
            </div>

            {/* Teacher + Status */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "14px", color: "#374151" }}>👨‍🏫 {a.teacherName}</span>
              <span
                style={{
                  padding: "5px 16px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: "700",
                  backgroundColor: a.status.toLowerCase() === "present" ? "#16a34a" : "#dc2626",
                  color: "#fff",
                }}
              >
                {a.status.toUpperCase()}
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ height: "8px", borderRadius: "12px", background: "#e5e7eb", overflow: "hidden" }}>
              <div
                style={{
                  width: a.status.toLowerCase() === "present" ? "100%" : "0%",
                  height: "100%",
                  background: a.status.toLowerCase() === "present" ? "#16a34a" : "#dc2626",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>
        ))}

  

  </div>
)}



      {/* PERFORMANCE TAB */}
      {studentTab === "performance" && (
        <div
          style={{
            position: "relative",
            paddingBottom: "70px",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
              padding: "20px",
            }}
          >
            {Object.keys(studentMarks).length === 0 ? (
              <>
                <div
                  style={{
                    textAlign: "center",
                    padding: "30px",
                    borderRadius: "18px",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: "16px",
                    fontWeight: "600",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                  }}
                >
                  🚫 No Performance Records
                </div>

                <div
                  style={{
                    textAlign: "center",
                    padding: "30px",
                    borderRadius: "18px",
                    background: "#ffffff",
                    color: "#475569",
                    fontSize: "16px",
                    fontWeight: "600",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                  }}
                >
                  🚫 No Performance Records
                </div>
              </>
            ) : (
              Object.entries(studentMarks).map(([courseId, marks], idx) => {
                const total =
                  (marks.mark20 || 0) + (marks.mark30 || 0) + (marks.mark50 || 0);
                const percentage = Math.min(total, 100);
                const statusColor =
                  percentage >= 75
                    ? "#16a34a"
                    : percentage >= 50
                    ? "#f59e0b"
                    : "#dc2626";

                return (
                  <div
                    key={idx}
                    style={{
                      padding: "18px",
                      borderRadius: "20px",
                      background: "#ffffff",
                      boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
                      color: "#0f172a",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    {/* Course Name */}
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "800",
                        marginBottom: "14px",
                        textTransform: "capitalize",
                        color: "#2563eb",
                      }}
                    >
                      {courseId.replace("course_", "").replace(/_/g, " ")}
                    </div>

                    {/* Score Circle */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <div
                        style={{
                          width: "90px",
                          height: "90px",
                          borderRadius: "50%",
                          background: `conic-gradient(
                          ${statusColor} ${percentage * 3.6}deg,
                          #e5e7eb 0deg
                        )`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "66px",
                            height: "66px",
                            borderRadius: "50%",
                            background: "#ffffff",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: "800",
                              color: statusColor,
                            }}
                          >
                            {total}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>
                            / 100
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Marks Bars */}
                    {[
                      { key: "mark20", label: "Quiz", max: 20, color: "#2563eb" },
                      { key: "mark30", label: "Test", max: 30, color: "#16a34a" },
                      { key: "mark50", label: "Final", max: 50, color: "#ea580c" },
                    ].map(({ key, label, max, color }) => (
                      <div key={key} style={{ marginBottom: "10px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#334155",
                          }}
                        >
                          <span>{label}</span>
                          <span>
                            {marks[key]} / {max}
                          </span>
                        </div>
                        <div
                          style={{
                            height: "6px",
                            borderRadius: "999px",
                            background: "#e5e7eb",
                            marginTop: "5px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${(marks[key] / max) * 100}%`,
                              height: "100%",
                              background: color,
                            }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Status */}
                    <div
                      style={{
                        marginTop: "12px",
                        textAlign: "center",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: statusColor,
                      }}
                    >
                      {percentage >= 75
                        ? "Excellent"
                        : percentage >= 50
                        ? "Good"
                        : "Needs Improvement"}
                    </div>

                    {/* Teacher */}
                    <div
                      style={{
                        marginTop: "6px",
                        textAlign: "center",
                        fontSize: "12px",
                        color: "#64748b",
                      }}
                    >
                      👨‍🏫 {marks.teacherName}
                    </div>
                  </div>
                );
              })
            )}
          </div>

        

        </div>
      )}
    </div>



 {/* Chat Button */}
      {!chatOpen && (
        <div
          onClick={() => setChatOpen(true)}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "50px",
            height: "50px",
            background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            cursor: "pointer",
            zIndex: 1000,
            boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
            transition: "transform 0.2s ease",
          }}
        >
          <FaCommentDots size={24} />
        </div>
      )}

 

   {/* Chat Popup */}
      {chatOpen && selectedStudent && (
        <div
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            width: "360px",
            height: "480px",
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
            zIndex: 2000,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              padding: "14px",
              borderBottom: "1px solid #eee",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#fafafa",
            }}
          >
            <strong>{selectedStudent.name}</strong>

            <div style={{ display: "flex", gap: "10px" }}>
              {/* Expand */}
              <button
                onClick={() => {
                  setChatOpen(false);
                  navigate("/all-chat", { state: { user: selectedStudent } });
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                ⤢
              </button>

              {/* Close */}
              <button
                onClick={() => setChatOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              padding: "12px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              background: "#f9f9f9",
            }}
          >
            {messages.length === 0 ? (
              <p style={{ textAlign: "center", color: "#aaa" }}>
                Start chatting with {selectedStudent.name}
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.messageId}
                  style={{
                    display: "flex",
                    justifyContent:
                      m.senderId === teacher?.userId ? "flex-end" : "flex-start",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "8px 14px",
                      borderRadius: "20px",
                      background:
                        m.senderId === teacher?.userId ? "#4b6cb7" : "#e5e5ea",
                      color: m.senderId === teacher?.userId ? "#fff" : "#000",
                      maxWidth: "70%",
                      wordWrap: "break-word",
                      transition: "all 0.2s",
                    }}
                  >
                    {m.text}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "10px",
              borderTop: "1px solid #eee",
              display: "flex",
              gap: "8px",
              background: "#fff",
            }}
          >
            <input
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "999px",
                border: "1px solid #ccc",
                outline: "none",
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage(newMessageText);
              }}
            />
            <button
              onClick={() => sendMessage(newMessageText)}
              style={{
                background:
                  "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
                border: "none",
                borderRadius: "50%",
                width: "42px",
                height: "42px",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}





  </div>
)}



        </div>
      </div>
    </div>
  );
}

export default StudentsPage;
