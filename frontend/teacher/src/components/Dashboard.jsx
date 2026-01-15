import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaChalkboardTeacher,
  FaCog,
  FaSignOutAlt,
  FaBell,
  FaSearch,
  FaClipboardCheck,
  FaUsers,
  FaRegHeart,
  FaHeart,
  FaFacebookMessenger,
} from "react-icons/fa";
import axios from "axios";
import "../styles/global.css";

const API_BASE = "http://127.0.0.1:5000/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);

  // Refs for posts
  const postRefs = useRef({});

  // Load teacher and posts on mount
  useEffect(() => {
    const storedTeacher = JSON.parse(localStorage.getItem("teacher"));
    if (!storedTeacher) {
      navigate("/login");
      return;
    }
    setTeacher(storedTeacher);
    fetchPosts();
  }, []);

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/get_posts`);
      const postsData = res.data || [];

      const mappedPosts = postsData.map((post) => {
        const likesObj = post.likes || {};
        const likesArray = Object.keys(likesObj); // teacherIds who liked
        return { ...post, likes: likesArray };
      });

      // Sort newest first
      mappedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setPosts(mappedPosts);

      // Set notifications using last 5 posts
      const latestNotifications = mappedPosts.slice(0, 5).map((post) => ({
        id: post.postId,
        title: post.message?.substring(0, 50) || "Untitled post",
        adminName: post.adminName || "Admin",
        adminProfile: post.adminProfile || "/default-profile.png",
      }));
      setNotifications(latestNotifications);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  // Like/unlike post
  const handleLikePost = async (postId) => {
    if (!teacher) return;
    try {
      const res = await axios.post(`${API_BASE}/like_post`, {
        postId,
        teacherId: teacher.userId,
      });

      if (res.data.success) {
        const updatedPosts = posts.map((post) => {
          if (post.postId === postId) {
            const likesSet = new Set(post.likes);
            if (res.data.liked) likesSet.add(teacher.userId);
            else likesSet.delete(teacher.userId);

            return {
              ...post,
              likes: Array.from(likesSet),
              likeCount: res.data.likeCount,
            };
          }
          return post;
        });
        setPosts(updatedPosts);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // Handle notification click
  const handleNotificationClick = (postId, index) => {
    setHighlightedPostId(postId);

    // Scroll post into view
    const postElement = postRefs.current[postId];
    if (postElement) {
      postElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Remove from notifications
    const updatedNotifications = [...notifications];
    updatedNotifications.splice(index, 1);
    setNotifications(updatedNotifications);

    setShowNotifications(false);

    // Remove highlight after 3 seconds
    setTimeout(() => setHighlightedPostId(null), 3000);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("teacher");
    navigate("/login");
  };

  if (!teacher) return null;

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
          {/* Notification Button */}
          <div className="icon-circle">
            <div
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ cursor: "pointer", position: "relative" }}
            >
              <FaBell size={24} />
              {notifications.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    background: "red",
                    color: "white",
                    borderRadius: "50%",
                    width: 18,
                    height: 18,
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {notifications.length}
                </span>
              )}
            </div>

            {/* Notification Popup */}
            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  top: 30,
                  right: 0,
                  width: 300,
                  maxHeight: 400,
                  overflowY: "auto",
                  background: "#fff",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                  borderRadius: 8,
                  zIndex: 100,
                }}
              >
                {notifications.length > 0 ? (
                  notifications.map((post, index) => (
                    <div
                      key={post.id || index}
                      onClick={() => handleNotificationClick(post.id, index)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 15px",
                        borderBottom: "1px solid #eee",
                        cursor: "pointer",
                      }}
                    >
                      <img
                        src={post.adminProfile}
                        alt={post.adminName}
                        style={{
                          width: 35,
                          height: 35,
                          borderRadius: "50%",
                          marginRight: 10,
                        }}
                      />
                      <div>
                        <strong>{post.adminName}</strong>
                        <p style={{ margin: 0, fontSize: 12 }}>{post.title}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: 15 }}>No notifications</div>
                )}
              </div>
            )}
          </div>

          <div className="icon-circle">
            <FaFacebookMessenger />
          </div>
          <div className="icon-circle" to="/settings">
            <FaCog />
          </div>
          <img
            src={teacher.profileImage || "/default-profile.png"}
            alt="teacher"
            className="profile-img"
          />
        </div>
      </nav>

      <div className="google-dashboard">
        {/* Sidebar */}
        <div className="google-sidebar">
          <div className="sidebar-profile">
            <div className="sidebar-img-circle">
              <img
                src={teacher.profileImage || "/default-profile.png"}
                alt="profile"
              />
            </div>
            <h3>{teacher.name}</h3>
            <p>{teacher.username}</p>
          </div>

          <div className="sidebar-menu">
            <Link
              className="sidebar-btn"
              to="/dashboard"
              style={{ backgroundColor: "#4b6cb7", color: "#fff" }}
            >
              <FaHome /> Home
            </Link>
          
            <Link className="sidebar-btn" to="/students">
              <FaUsers /> Students
            </Link>
            <Link className="sidebar-btn" to="/admins">
              <FaUsers /> Admins
            </Link>
            <Link className="sidebar-btn" to="/parents">
              <FaChalkboardTeacher /> Parents
            </Link>
            <Link className="sidebar-btn" to="/marks">
              <FaClipboardCheck /> Marks
            </Link>
            <Link className="sidebar-btn" to="/attendance">
              <FaUsers /> Attendance
            </Link>
             <Link className="sidebar-btn" to="/schedule" >
                                 <FaUsers /> Schedule
                               </Link>
            <Link className="sidebar-btn" to="/settings">
              <FaCog /> Settings
            </Link>
            <button className="sidebar-btn logout-btn" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="google-main">
          <div className="posts-container">
            {posts.length === 0 && <p>No posts available</p>}

            {posts.map((post) => (
              <div
                className="post-card"
                key={post.postId}
                ref={(el) => (postRefs.current[post.postId] = el)}
                style={{
  border: highlightedPostId === post.postId ? " #4b6cb7" : "",
  backgroundColor: highlightedPostId === post.postId ? "#fff9c4" : "#fff",
  transition: "background-color 0.5s",
  padding: "10px",
  marginBottom: "10px",
  
}}

              >
                <div className="post-header" style={{ display: "flex", alignItems: "center" }}>
                  <div className="img-circle">
                    <img
                      src={post.adminProfile || "/default-profile.png"}
                      alt={post.adminName || "Admin"}
                      style={{ width: 40, height: 40, borderRadius: "50%", marginRight: 10 }}
                    />
                  </div>
                  <div className="post-info">
                    <h4>{post.adminName || "Admin"}</h4>
                    <span>
                      {post.timestamp
                        ? new Date(post.timestamp).toLocaleString()
                        : ""}
                    </span>
                  </div>
                </div>
                <p>{post.message}</p>
                {post.postUrl && (
                  <img src={post.postUrl} alt="post media" className="post-media" />
                )}

                <div className="like-button">
                  <button
                    onClick={() => handleLikePost(post.postId)}
                    className="admin-like-btn"
                    style={{
                      color: post.likes.includes(teacher.userId) ? "#e0245e" : "#555",
                    }}
                  >
                    <span className="like-left">
                      {post.likes.includes(teacher.userId) ? <FaHeart /> : <FaRegHeart />}
                      {post.likes.includes(teacher.userId) ? "Liked" : "Like"}
                    </span>
                    <span className="like-count">{post.likeCount || 0}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
