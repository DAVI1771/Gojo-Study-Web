import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaFileAlt, FaChalkboardTeacher, FaCog, FaSignOutAlt, FaBell, FaSearch } from "react-icons/fa";
import axios from "axios";
import "../styles/global.css";

const API_BASE = "http://127.0.0.1:5000/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const storedTeacher = JSON.parse(localStorage.getItem("teacher"));
    if (!storedTeacher) {
      navigate("/login");
      return;
    }
    setTeacher(storedTeacher);
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/get_posts`);
      const mappedPosts = (res.data || []).map((post) => ({
        postId: post.postId,
        adminName: post.adminName || "Admin",
        adminProfile: post.adminProfile || "/default-profile.png",
        message: post.message,
        postUrl: post.postUrl,
        timestamp: post.timestamp || "",
        likeCount: post.likeCount || 0,
      }));
      mappedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setPosts(mappedPosts);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("teacher");
    navigate("/login");
  };

  if (!teacher) return null;

  return (
    <div className="dashboard-page">
      <nav className="top-navbar">
        <h2>Gojo Dashboard</h2>
        <div className="nav-search">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search Teacher and Student..." />
        </div>
        <div className="nav-right">
          <div className="icon-circle"><FaBell /></div>
          <div className="icon-circle"><FaCog /></div>
          <img src={teacher.profileImage || "/default-profile.png"} alt="teacher" className="profile-img" />
        </div>
      </nav>

      <div className="google-dashboard">
        <div className="google-sidebar">
          <div className="sidebar-profile">
            <div className="sidebar-img-circle">
              <img src={teacher.profileImage || "/default-profile.png"} alt="profile" />
            </div>
            <h3>{teacher.name}</h3>
            <p>{teacher.username}</p>
          </div>

          <div className="sidebar-menu">
            <Link className="sidebar-btn" to="/dashboard" style={{ backgroundColor: "#4b6cb7", color: "#fff" }}><FaHome /> Home</Link>
            <Link className="sidebar-btn" to="/my-posts"><FaFileAlt /> My Posts</Link>
            <Link className="sidebar-btn" to="/teachers"><FaChalkboardTeacher /> Teachers</Link>
            <Link className="sidebar-btn" to="/students"><FaChalkboardTeacher /> Students</Link>
            <Link className="sidebar-btn" to="/settings"><FaCog /> Settings</Link>
            <button className="sidebar-btn logout-btn" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
          </div>
        </div>

        <div className="google-main">
          <div className="posts-container">
            {posts.length === 0 && <p>No posts available</p>}
            {posts.map((post) => (
              <div className="post-card" key={post.postId}>
                <div className="post-header">
                  <div className="img-circle">
                    <img src={post.adminProfile} alt={post.adminName} />
                  </div>
                  <div className="post-info">
                    <h4>{post.adminName}</h4>
                    <span>{new Date(post.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <p>{post.message}</p>
                {post.postUrl && <img src={post.postUrl} alt="post media" className="post-media" />}
                <div className="post-actions">
                  <button className="like-button">👍 {post.likeCount}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
