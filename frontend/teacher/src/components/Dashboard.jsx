import React, { useEffect, useState } from "react";
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
  FaFacebookMessenger
} from "react-icons/fa";
import axios from "axios";
import "../styles/global.css";

const API_BASE = "http://127.0.0.1:5000/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [posts, setPosts] = useState([]);

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

  // Fetch posts with admin info included
  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/get_posts`);
      const postsData = res.data || [];

      // Convert likes object to array for easy handling
      const mappedPosts = postsData.map((post) => {
        const likesObj = post.likes || {};
        const likesArray = Object.keys(likesObj); // teacherIds who liked
        return { ...post, likes: likesArray };
      });

      // Sort posts by newest first
      mappedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setPosts(mappedPosts);
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
          <div className="icon-circle"><FaBell /></div>
          <div className="icon-circle"><FaFacebookMessenger /></div>
          <div className="icon-circle"><FaCog /></div>
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
            <Link className="sidebar-btn" to="/notes">
              <FaClipboardCheck /> Notes
            </Link>
            <Link className="sidebar-btn" to="/students">
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

        {/* Main Content */}
        <div className="google-main">
          <div className="posts-container">
            {posts.length === 0 && <p>No posts available</p>}

            {posts.map((post) => (
              <div className="post-card" key={post.postId}>
                {/* Post Header */}
                <div className="post-header">
                  <div className="img-circle">
                    <img
                      src={post.adminProfile || "/default-profile.png"}
                      alt={post.adminName || "Admin"}
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

                {/* Post Content */}
                <p>{post.message}</p>
                {post.postUrl && (
                  <img src={post.postUrl} alt="post media" className="post-media" />
                )}

                {/* Like Button */}
                <div className="like-button">
  <button
    onClick={() => handleLikePost(post.postId)}
    className="admin-like-btn"
    style={{
      color: post.likes.includes(teacher.userId) ? "#e0245e" : "#555",
    }}
  >
    {/* LEFT */}
    <span className="like-left">
      {post.likes.includes(teacher.userId) ? (
        <FaHeart className="liked-icon" />
      ) : (
        <FaRegHeart />
      )}
      {post.likes.includes(teacher.userId) ? "Liked" : "Like"}
    </span>

    {/* RIGHT */}
    <span className="like-count">
      {post.likeCount || 0}
    </span>
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
