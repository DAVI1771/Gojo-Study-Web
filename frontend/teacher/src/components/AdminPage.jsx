import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaClipboardCheck,
  FaCog,
  FaSignOutAlt,
  FaBell,
  FaSearch,
  FaHandHoldingMedical, FaChalkboardTeacher, FaFacebookMessenger,
  FaCommentDots
} from "react-icons/fa";
import "../styles/global.css";

// Admin item component
const AdminItem = ({ admin, selected, onClick }) => (
  <div
    onClick={() => onClick(admin)}
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
      transition: "all 0.3s ease"
    }}
  >
    <img
      src={admin.profileImage || "/default-profile.png"}
      alt={admin.name}
      style={{
        width: "50px",
        height: "50px",
        borderRadius: "50%",
        objectFit: "cover",
        border: selected ? "3px solid #4b6cb7" : "3px solid red"
      }}
    />
    <div>
      <h3 style={{ margin: 0 }}>{admin.name}</h3>
      <p style={{ margin: "4px 0", color: "#555" }}>
        {admin.username || admin.email}
      </p>
    </div>
  </div>
);

function AdminPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  const [adminTab, setAdminTab] = useState("details");
  const [adminChatOpen, setAdminChatOpen] = useState(false);

  const [popupMessages, setPopupMessages] = useState([]);
  const [popupInput, setPopupInput] = useState("");

  const [teacherInfo, setTeacherInfo] = useState(null);
 const [teacher, setTeacher] = useState(null);

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

 const handleLogout = () => {
    localStorage.removeItem("teacher"); // or "user", depending on your auth
    navigate("/login");
  };


  // ---------------- FETCH ADMINS ----------------
  useEffect(() => {
    async function fetchAdmins() {
      try {
        setLoading(true);
        const res = await axios.get(
          "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json"
        );

        const users = res.data || {};
        const adminsArray = Object.entries(users)
          .filter(([_, u]) => {
            const role = (u.role || u.userType || "").toLowerCase();
            return role === "admin" || role === "school_admin";
          })
          .map(([key, u]) => ({ adminId: key, ...u }));

        setAdmins(adminsArray);
        setError(adminsArray.length === 0 ? "No admins found" : "");
      } catch (err) {
        console.error(err);
        setError("Failed to fetch admins");
      } finally {
        setLoading(false);
      }
    }

    fetchAdmins();
  }, []);

   // Scroll to bottom whenever messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [popupMessages]);

  // Fetch chat messages whenever selected admin changes
  useEffect(() => {
    if (!selectedAdmin || !teacher) return;

    async function fetchMessages() {
      try {
        const chatKey =
          teacher.userId < selectedAdmin.adminId
            ? `${teacher.userId}_${selectedAdmin.adminId}`
            : `${selectedAdmin.adminId}_${teacher.userId}`;

        const res = await axios.get(
          `https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${chatKey}/messages.json`
        );

        const msgs = Object.values(res.data || {})
          .map((m) => ({
            ...m,
            sender: m.senderId === teacher.userId ? "teacher" : "admin",
          }))
          .sort((a, b) => a.timeStamp - b.timeStamp);

        setPopupMessages(msgs);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setPopupMessages([]);
      }
    }

    fetchMessages();
  }, [selectedAdmin, teacher]);

  // Send message
  const handleSendMessage = async () => {
    if (!popupInput.trim() || !teacher || !selectedAdmin) return;

    const newMessage = {
      senderId: teacher.userId,
      receiverId: selectedAdmin.adminId,
      text: popupInput,
      timeStamp: Date.now(),
      seen: false,
    };

    try {
      const chatKey =
        teacher.userId < selectedAdmin.adminId
          ? `${teacher.userId}_${selectedAdmin.adminId}`
          : `${selectedAdmin.adminId}_${teacher.userId}`;

      await axios.post(
        `https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${chatKey}/messages.json`,
        newMessage
      );

      // Update local state
      setPopupMessages([...popupMessages, { ...newMessage, sender: "teacher" }]);
      setPopupInput("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

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
                    <Link className="sidebar-btn" to="/students">
                      <FaUsers /> Students
                    </Link>
                    <Link className="sidebar-btn" to="/admins"  style={{ backgroundColor: "#4b6cb7", color: "#fff" }}>
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

        {/* MAIN */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "30px" }}>
          <div style={{ width: "30%" }}>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>All Admins</h2>

            {loading && <p>Loading admins...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {admins.map(a => (
                <AdminItem
                  key={a.adminId}
                  admin={a}
                  selected={selectedAdmin?.adminId === a.adminId}
                  onClick={setSelectedAdmin}
                />
              ))}
            </div>
          </div>

          {/* RIGHT SIDEBAR (STUDENT STYLE) */}
          {selectedAdmin && (
            <div style={{ width: "30%", padding: "25px", background: "#fff", boxShadow: "0 0 15px rgba(0,0,0,0.05)", position: "fixed", right: 0, top: "60px", height: "calc(100vh - 60px)" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <div style={{ width: "120px", height: "120px", margin: "0 auto 15px", borderRadius: "50%", overflow: "hidden", border: "4px solid red" }}>
                  <img src={selectedAdmin.profileImage} alt={selectedAdmin.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <h2>{selectedAdmin.name}</h2>
                <p>{selectedAdmin.email}</p>
              </div>

              <div style={{ display: "flex", marginBottom: "15px" }}>
                {["details", "attendance", "performance"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setAdminTab(tab)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      fontWeight: "600",
                      color: adminTab === tab ? "#4b6cb7" : "#777",
                      borderBottom: adminTab === tab ? "3px solid #4b6cb7" : "3px solid transparent"
                    }}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

              {adminTab === "details" && (
                <div>
                  <p><strong>ID:</strong> {selectedAdmin.adminId}</p>
                  <p><strong>Username:</strong> {selectedAdmin.username}</p>
                </div>
              )}
              {adminTab === "attendance" && <p>Attendance data here.</p>}
              {adminTab === "performance" && <p>Performance data here.</p>}

              
              
             {/* Admin Chat Button */}
{!adminChatOpen && selectedAdmin && (
  <div
    onClick={() => setAdminChatOpen(true)}
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
    }}
  >
    <FaCommentDots size={24} />
  </div>
)}

{/* Admin Chat Popup */}
{adminChatOpen && selectedAdmin && teacher && (
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
      <strong>{selectedAdmin.name}</strong>
      <div style={{ display: "flex", gap: "10px" }}>
        {/* Expand */}
        <button
          onClick={() => {
            setAdminChatOpen(false);
            navigate("/all-chat", { state: { user: selectedAdmin } });
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
          onClick={() => setAdminChatOpen(false)}
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

    {/* MESSAGES */}
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
      {popupMessages.length === 0 ? (
        <p style={{ textAlign: "center", color: "#aaa" }}>
          Start chatting with {selectedAdmin.name}
        </p>
      ) : (
        popupMessages.map((m, i) => (
          <div
            key={i}
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
              }}
            >
              {m.text}
            </span>
          </div>
        ))
      )}
      <div ref={messagesEndRef} />
    </div>

    {/* INPUT */}
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
        value={popupInput}
        onChange={(e) => setPopupInput(e.target.value)}
        placeholder="Type a message..."
        style={{
          flex: 1,
          padding: "10px 14px",
          borderRadius: "999px",
          border: "1px solid #ccc",
          outline: "none",
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSendMessage();
        }}
      />
      <button
        onClick={handleSendMessage}
        style={{
          background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
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

export default AdminPage;
