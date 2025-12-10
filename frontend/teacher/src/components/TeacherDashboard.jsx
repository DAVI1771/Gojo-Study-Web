import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiFillPicture } from "react-icons/ai";
import { FaHome, FaFileAlt, FaUserGraduate, FaCog, FaSignOutAlt, FaSearch } from "react-icons/fa";
import axios from "axios";

const API_BASE = "http://127.0.0.1:5000/api";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState({
    teacherId: "",
    name: "",
    username: "",
    profileImage: "/default-profile.png",
  });
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [postMedia, setPostMedia] = useState(null);

  useEffect(() => {
    const storedTeacher = localStorage.getItem("teacher");
    if (!storedTeacher) return navigate("/login");
    setTeacher(JSON.parse(storedTeacher));
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/get_posts`);
      const sortedPosts = res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setPosts(sortedPosts);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePost = async () => {
    if (!postText && !postMedia) return alert("Enter message or select media");
    const formData = new FormData();
    formData.append("text", postText);
    formData.append("teacherId", teacher.teacherId);
    if (postMedia) formData.append("post_media", postMedia);

    try {
      await axios.post(`${API_BASE}/create_post`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPostText("");
      setPostMedia(null);
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`${API_BASE}/like_post`, {
        teacherId: teacher.teacherId,
        postId,
      });
      if (res.data.success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.postId === postId
              ? {
                  ...post,
                  likeCount: res.data.likeCount,
                  likes: { ...post.likes, [teacher.teacherId]: res.data.liked ? true : undefined },
                }
              : post
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (postId) => {
    try {
      await axios.delete(`${API_BASE}/delete_post/${postId}`, {
        data: { teacherId: teacher.teacherId },
      });
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = async (postId, currentText) => {
    const newText = prompt("Edit your post:", currentText);
    if (!newText) return;
    try {
      await axios.post(`${API_BASE}/edit_post/${postId}`, {
        teacherId: teacher.teacherId,
        postText: newText,
      });
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("teacher");
    navigate("/login");
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", minHeight: "100vh", background: "#e0e5ec" }}>
      {/* Top Navbar */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "0 20px", height: "60px", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>
        <h2>Teacher Dashboard</h2>
        <div style={{ position: "relative" }}>
          <FaSearch style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
          <input type="text" placeholder="Search..." style={{ padding: "8px 12px 8px 30px", borderRadius: "18px", border: "1px solid #ccc" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={teacher.profileImage} alt="profile" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
          <span>{teacher.name}</span>
        </div>
      </nav>

      <div style={{ display: "flex", marginTop: "80px" }}>
        {/* Sidebar */}
        <div style={{ width: "250px", background: "#fff", padding: "20px", boxShadow: "0 0.6px 2px rgba(0,0,0,0.2)" }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <img src={teacher.profileImage} alt="profile" style={{ width: "100px", height: "100px", borderRadius: "50%", border: "3px solid #4b6cb7", objectFit: "cover" }} />
            <h3>{teacher.name}</h3>
            <p>{teacher.username}</p>
          </div>
          <Link to="/teacher/dashboard" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", background: "#4b6cb7", color: "#fff", borderRadius: "5px", marginBottom: "10px" }}><FaHome /> Home</Link>
          <Link to="/my-posts" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "5px", marginBottom: "10px", background: "#f0f0f0" }}><FaFileAlt /> My Posts</Link>
          <Link to="/students" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "5px", marginBottom: "10px", background: "#f0f0f0" }}><FaUserGraduate /> Students</Link>
          <Link to="/settings" style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "5px", marginBottom: "10px", background: "#f0f0f0" }}><FaCog /> Settings</Link>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", border: "none", borderRadius: "5px", marginTop: "20px", width: "100%", background: "#f44336", color: "#fff", cursor: "pointer" }}><FaSignOutAlt /> Logout</button>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "20px" }}>
          {/* Post Box */}
          <div style={{ background: "#fff", padding: "10px", borderRadius: "10px", marginBottom: "20px" }}>
            <textarea
              placeholder="What's on your mind?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              style={{ width: "100%", borderRadius: "10px", padding: "10px", resize: "none", border: "1px solid #ccc", marginBottom: "10px" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "5px", cursor: "pointer" }}>
                <AiFillPicture style={{ fontSize: "24px", color: "#4caf50" }} />
                <input type="file" onChange={(e) => setPostMedia(e.target.files[0])} accept="image/*,video/*" style={{ display: "none" }} />
              </label>
              <button onClick={handlePost} style={{ padding: "5px 15px" }}>Post</button>
            </div>
          </div>

          {/* Posts */}
          {posts.map((post) => (
            <div key={post.postId} style={{ background: "#fff", padding: "15px", borderRadius: "10px", marginBottom: "15px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <img src={post.adminProfile || "/default-profile.png"} alt="profile" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                <div>
                  <h4>{post.adminName}</h4>
                  <span>{post.time}</span>
                </div>
              </div>
              <p>{post.message}</p>
              {post.postUrl && <img src={post.postUrl} alt="media" style={{ width: "100%", borderRadius: "10px", marginTop: "10px" }} />}
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button onClick={() => handleLike(post.postId)} style={{ cursor: "pointer", border: "none", background: "transparent", color: post.likes?.[teacher.teacherId] ? "red" : "black" }}>👍 {post.likeCount || 0}</button>
                {post.teacherId === teacher.teacherId && (
                  <>
                    <button onClick={() => handleEdit(post.postId, post.message)}>Edit</button>
                    <button onClick={() => handleDelete(post.postId)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
