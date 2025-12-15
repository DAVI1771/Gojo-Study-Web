import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaFileAlt, FaChalkboardTeacher, FaCog, FaSignOutAlt, FaBell, FaFacebookMessenger, FaSearch } from "react-icons/fa";
import axios from "axios";

function Parent() {
  const [parents, setParents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [sections, setSections] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [parentChatOpen, setParentChatOpen] = useState(false);
  const [parentTab, setParentTab] = useState("details");
  const navigate = useNavigate();

  const admin = JSON.parse(localStorage.getItem("admin")) || {};

  // Fetch parents and user data from Firebase
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const parentsRes = await axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Parents.json");
        const usersRes = await axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json");

        const parentsData = parentsRes.data || {};
        const usersData = usersRes.data || {};

        const parentList = Object.keys(parentsData).map((id) => {
          const parent = parentsData[id];
          const user = usersData[parent.userId] || {};
          return {
            parentId: id,
            name: user.name || user.username || "No Name",
            profileImage: user.profileImage || "/default-profile.png",
            grade: parent.grade,
            section: parent.section,
            email: user.email || "default.parent@example.com"
          };
        });

        setParents(parentList);
      } catch (err) {
        console.error("Error fetching parents:", err);
      }
    };

    fetchParents();
  }, []);

  // Update section list based on selected grade
  useEffect(() => {
    if (selectedGrade === "All") {
      setSections([]);
    } else {
      const gradeSections = [...new Set(parents.filter(p => p.grade === selectedGrade).map(p => p.section))];
      setSections(gradeSections);
      setSelectedSection("All");
    }
  }, [selectedGrade, parents]);

  const filteredParents = parents.filter(p => {
    if (selectedGrade !== "All" && p.grade !== selectedGrade) return false;
    if (selectedSection !== "All" && p.section !== selectedSection) return false;
    return true;
  });

  return (
    <div className="dashboard-page">
      {/* TOP NAVBAR */}
      <nav className="top-navbar">
        <h2>Gojo Dashboard</h2>
        <div className="nav-search">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search Teacher and Parent..." />
        </div>
        <div className="nav-right">
          <div className="icon-circle"><FaBell /></div>
          <div className="icon-circle"><FaFacebookMessenger /></div>
          <div className="icon-circle"><FaCog /></div>
          <img src={admin.profileImage || "/default-profile.png"} alt="admin" className="profile-img" />
        </div>
      </nav>

      <div className="google-dashboard" style={{ display: "flex" }}>
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
            <Link className="sidebar-btn" to="/parents" style={{ background: "#4b6cb7", color: "#fff" }}>
              <FaChalkboardTeacher /> Parents
            </Link>
            <Link className="sidebar-btn" to="/settings"><FaCog /> Settings</Link>
            <button className="sidebar-btn logout-btn" onClick={() => { localStorage.removeItem("admin"); window.location.href = "/login"; }}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content" style={{ padding: "30px", width: "65%", marginLeft: "180px" }}>
          <h2 style={{ marginBottom: "20px", textAlign: "center" }}>Parents</h2>

          {/* Grade Filter */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "25px", gap: "12px" }}>
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

          {/* Parents List */}
          {filteredParents.length === 0 ? (
            <p style={{ textAlign: "center", color: "#555" }}>No parents found for this selection.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
              {filteredParents.map(p => (
                <div
                  key={p.parentId}
                  onClick={() => setSelectedParent(p)}
                  style={{
                    width: "500px",
                    height: "70px",
                    borderRadius: "12px",
                    padding: "15px",
                    background: selectedParent?.parentId === p.parentId ? "#e0e7ff" : "#fff",
                    border: selectedParent?.parentId === p.parentId ? "2px solid #4b6cb7" : "1px solid #ddd",
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    boxShadow: selectedParent?.parentId === p.parentId ? "0 6px 15px rgba(75,108,183,0.3)" : "0 4px 10px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                >
                  <img
                    src={p.profileImage}
                    alt={p.name}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: selectedParent?.parentId === p.parentId ? "3px solid #4b6cb7" : "3px solid red",
                      transition: "all 0.3s ease"
                    }}
                  />
                  <div>
                    <h3 style={{ margin: 0 }}>{p.name}</h3>
                    <p style={{ margin: "4px 0", color: "#555" }}>
                      Grade {p.grade} - Section {p.section}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        {selectedParent && (
          <div
            className="parent-info-sidebar"
            style={{
              width: "30%",
              padding: "25px",
              background: "#fff",
              boxShadow: "0 0 15px rgba(0,0,0,0.05)",
              position: "fixed",
              right: 0,
              top: "60px",
              height: "calc(100vh - 60px)",
              overflow: "hidden",
              zIndex: 10
            }}
          >
            {/* Parent Info */}
            <div style={{ textAlign: "center" }}>
              <div style={{ background: "#becff7ff", padding: "25px 10px", height: "200px", width: "calc(100% + 50px)", margin: "-25px -25px 20px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                <div style={{ width: "100px", height: "100px", margin: "-20px auto 15px", borderRadius: "50%", overflow: "hidden", border: "4px solid #4b6cb7", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
                  <img src={selectedParent.profileImage} alt={selectedParent.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <h2 style={{ margin: 0, fontSize: "22px", marginTop: "-10px", color: "#333" }}>{selectedParent.name}</h2>
                <h2 style={{ margin: 0, fontSize: "16px", marginTop: "0", color: "#585656ff" }}>{selectedParent.email}</h2>
              </div>

              <p style={{ color: "#555", fontSize: "16px", margin: "5px 0" }}><strong>Grade:</strong> {selectedParent.grade}</p>
              <p style={{ color: "#555", fontSize: "16px", margin: "5px 0 20px 0" }}><strong>Section:</strong> {selectedParent.section}</p>

              <div style={{ background: "#fff", borderRadius: "10px", padding: "15px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", width: "100%", textAlign: "left" }}>
                <div style={{ display: "flex", borderBottom: "1px solid #eee", marginBottom: "15px" }}>
                  {["details", "children", "performance"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setParentTab(tab)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontWeight: "600",
                        color: parentTab === tab ? "#4b6cb7" : "#777",
                        borderBottom: parentTab === tab ? "3px solid #4b6cb7" : "3px solid transparent",
                      }}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>

                {parentTab === "details" && (
                  <div>
                    <h4 style={{ marginBottom: "10px", color: "#4b6cb7" }}>Parent Details</h4>
                    <p style={{ margin: "6px 0", color: "#555" }}><strong>ID:</strong> {selectedParent.parentId}</p>
                  </div>
                )}

                {parentTab === "children" && (
                  <div>
                    <h4 style={{ marginBottom: "10px", color: "#4b6cb7" }}>Children</h4>
                    <p style={{ color: "#555" }}>Children information will be shown here.</p>
                  </div>
                )}

                {parentTab === "performance" && (
                  <div>
                    <h4 style={{ marginBottom: "10px", color: "#4b6cb7" }}>Performance</h4>
                    <p style={{ color: "#555" }}>Children performance reports will be displayed here.</p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-end" }}>
                <button
                  style={{ padding: "10px", width: "120px", borderRadius: "8px", border: "none", background: "#4b6cb7", color: "#fff", cursor: "pointer", fontWeight: "bold", transition: "0.3s", marginTop: "140px" }}
                  onClick={() => setParentChatOpen(true)}
                >
                  Message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CHAT POPUP */}
        {parentChatOpen && selectedParent && (
          <div style={{ position: "fixed", bottom: "6px", width: "320px", background: "#fff", borderRadius: "12px", boxShadow: "0 8px 25px rgba(0,0,0,0.15)", padding: "15px", zIndex: 999, animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd", paddingBottom: "10px" }}>
              <strong>{selectedParent.name}</strong>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => { setParentChatOpen(false); navigate("/parent-chat", { state: { parentId: selectedParent.parentId } }); }} style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer" }}>
                  <img width="30" height="30" src="https://img.icons8.com/ios-glyphs/30/expand--v1.png" alt="expand" />
                </button>
                <button onClick={() => setParentChatOpen(false)} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>×</button>
              </div>
            </div>
            <div style={{ height: "260px", overflowY: "auto", padding: "10px" }}>
              <p style={{ color: "#aaa", textAlign: "center" }}>Start a conversation with {selectedParent.name}...</p>
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

export default Parent;
