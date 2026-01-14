import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaFileAlt,
  FaChalkboardTeacher,
  FaCog,
  FaSignOutAlt,
  FaBell,
  FaFacebookMessenger,
  FaSearch,
  FaCalendarAlt,
} from "react-icons/fa";
import { AiFillPicture } from "react-icons/ai";
import "../styles/global.css";

function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [postText, setPostText] = useState("");
  const [postMedia, setPostMedia] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [unreadTeachers, setUnreadTeachers] = useState({});
  const [popupMessages, setPopupMessages] = useState([]);
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherChatOpen, setTeacherChatOpen] = useState(false);
  const [unreadSenders, setUnreadSenders] = useState([]);
  const [postNotifications, setPostNotifications] = useState([]);
  const [showPostDropdown, setShowPostDropdown] = useState(false);

  // loading states for edit/delete
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const navigate = useNavigate();

  // Read admin from localStorage
  let admin = {};
  try {
    admin = JSON.parse(localStorage.getItem("admin")) || {};
  } catch (e) {
    admin = {};
  }
  const adminId = admin?.userId || null;

  // Extract token if present in admin object (common field names)
  const token =
    admin?.token ||
    admin?.accessToken ||
    admin?.idToken ||
    admin?.apiKey ||
    null;

  // Attach auth headers globally (helps backend requiring Authorization)
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      axios.defaults.headers.common["x-access-token"] = token;
      console.log("[AUTH] Attached token to axios defaults");
    } else {
      // ensure headers removed if no token
      delete axios.defaults.headers.common["Authorization"];
      delete axios.defaults.headers.common["x-access-token"];
      console.log("[AUTH] No token found in admin object");
    }
  }, [token]);

  console.log("AdminId used for fetch:", adminId);

  // ---------------- FETCH POST NOTIFICATIONS ----------------
  const fetchPostNotifications = async () => {
    if (!adminId) return;
    try {
      const res = await axios.get(
        `http://127.0.0.1:5000/api/get_post_notifications/${adminId}`
      );
      const notifications = (res.data || []).map((n, index) => ({
        ...n,
        notificationId: n.notificationId || n.id || `notification-${index}-${Date.now()}`,
      }));
      setPostNotifications(notifications);
    } catch (err) {
      console.error("Post notification fetch failed", err.response?.data || err);
    }
  };

  useEffect(() => {
    fetchPostNotifications();
    const interval = setInterval(fetchPostNotifications, 5000);
    return () => clearInterval(interval);
  }, [adminId]);

  const handleNotificationClick = async (notification) => {
    if (!notification?.notificationId) return;
    try {
      await axios.post("http://127.0.0.1:5000/api/mark_post_notification_read", {
        notificationId: notification.notificationId,
      });
      setPostNotifications((prev) =>
        prev.filter((n) => n.notificationId !== notification.notificationId)
      );
      setShowPostDropdown(false);
      navigate("/dashboard", { state: { postId: notification.postId } });
    } catch (err) {
      console.error("Mark notification read failed", err.response?.data || err);
    }
  };

  // ---------------- FETCH MY POSTS ----------------
  const fetchMyPosts = async () => {
    if (!adminId) return;
    try {
      const res = await axios.get(
        `http://127.0.0.1:5000/api/get_my_posts/${adminId}`
      );
      // Normalize server response
      const postsArray = Array.isArray(res.data)
        ? res.data
        : Object.entries(res.data || {}).map(([key, post]) => ({
            postId: key,
            ...post,
          }));

      const mappedPosts = postsArray
        .map((p) => {
          const parsedTime = p.time ? new Date(p.time) : new Date();
          return {
            postId: p.postId || p.id || String(p?.postId || ""),
            message: p.message || p.postText || "",
            postUrl: p.postUrl || p.mediaUrl || null,
            time: parsedTime.toLocaleString(),
            parsedTime,
            edited: p.edited || false,
            likeCount: p.likeCount || 0,
            likes: p.likes || {},
            adminId: p.adminId || adminId,
          };
        })
        .sort((a, b) => b.parsedTime - a.parsedTime);

      setPosts(mappedPosts);
      console.log("Mapped posts:", mappedPosts);
    } catch (err) {
      console.error("Error fetching posts:", err.response?.data || err);
    }
  };

  useEffect(() => {
    if (!adminId) {
      console.error("Admin ID missing:", admin);
      return;
    }
    fetchMyPosts();
    const interval = setInterval(fetchMyPosts, 10000);
    return () => clearInterval(interval);
  }, [adminId]);

  // ---------------- CREATE POST ----------------
  const handlePost = async () => {
    if (!postText && !postMedia) return;
    try {
      const formData = new FormData();
      formData.append("adminId", adminId);
      formData.append("postText", postText);
      if (postMedia) formData.append("postMedia", postMedia);

      await axios.post("http://127.0.0.1:5000/api/create_post", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setPostText("");
      setPostMedia(null);
      fetchMyPosts();
    } catch (err) {
      console.error("Error creating post:", err.response?.data || err);
      alert("Create post failed: " + (err.response?.data?.message || err.message || "See console"));
    }
  };

  // ---------------- EDIT POST ----------------
  const handleEdit = (postId, currentContent) => {
    setEditingPostId(postId);
    setEditedContent(currentContent || "");
  };

  const saveEdit = async (postId) => {
    if (!postId) return;
    if (!adminId) {
      console.error("No adminId available for edit");
      return;
    }

    const trimmed = (editedContent || "").trim();
    if (trimmed.length === 0) {
      alert("Post content cannot be empty.");
      return;
    }

    setSavingId(postId);

    const url = `http://127.0.0.1:5000/api/edit_post/${postId}`;
    const payload = { adminId, postText: trimmed, message: trimmed };

    // Prefer Authorization header if token exists
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-access-token"] = token;
    }

    try {
      console.log("[EDIT] URL:", url);
      console.log("[EDIT] Payload:", payload);
      console.log("[EDIT] Headers:", headers);

      // Backend in your logs expected POST with auth — try POST
      const res = await axios.post(url, payload, { headers });
      console.log("[EDIT] Response:", res.status, res.data);

      // If backend returns success:false, throw to be caught below
      if (res.data && res.data.success === false) {
        throw new Error(res.data.message || "Edit failed on backend");
      }

      // Update UI optimistically
      setPosts((prev) =>
        prev.map((post) =>
          post.postId === postId ? { ...post, message: trimmed, edited: true } : post
        )
      );

      setEditingPostId(null);
      setEditedContent("");
      console.log("[EDIT] Success for postId:", postId);
    } catch (err) {
      // Provide enough info for debugging
      console.error(
        "[EDIT] Error:",
        err.response?.status,
        err.response?.data || err.message || err
      );

      // If 403, likely auth token missing/invalid
      if (err.response?.status === 403) {
        alert("Edit forbidden (403). Check authentication token. See console for details.");
      } else {
        alert("Edit failed: " + (err.response?.data?.message || err.message || "See console"));
      }
    } finally {
      setSavingId(null);
    }
  };

  // ---------------- DELETE POST ----------------
  const handleDelete = async (postId) => {
    if (!postId) {
      console.error("postId missing");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    if (!adminId) {
      console.error("No adminId available for delete");
      return;
    }

    setDeletingId(postId);

    const url = `http://127.0.0.1:5000/api/delete_post/${postId}`;
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
      headers["x-access-token"] = token;
    }

    try {
      console.log("[DELETE] URL:", url, "adminId:", adminId);
      console.log("[DELETE] Headers:", headers);

      // Many backends use POST for "soft" delete endpoints — try POST first
      try {
        const rPost = await axios.post(url, { adminId }, { headers });
        console.log("[DELETE] POST response:", rPost.status, rPost.data);
        if (rPost.data && rPost.data.success === false) {
          throw new Error(rPost.data.message || "delete returned success:false");
        }
      } catch (postErr) {
        console.warn(
          "[DELETE] POST failed or not supported:",
          postErr.response?.status,
          postErr.response?.data || postErr.message
        );

        // Try DELETE with body (axios uses { data: ... })
        try {
          const rDelBody = await axios.delete(url, { data: { adminId }, headers });
          console.log("[DELETE] DELETE(body) response:", rDelBody.status, rDelBody.data);
          if (rDelBody.data && rDelBody.data.success === false)
            throw new Error(rDelBody.data.message || "delete returned success:false");
        } catch (delBodyErr) {
          console.warn(
            "[DELETE] DELETE(body) failed:",
            delBodyErr.response?.status,
            delBodyErr.response?.data || delBodyErr.message
          );

          // Final fallback: DELETE with query param
          const rDelParam = await axios.delete(url, { params: { adminId }, headers });
          console.log("[DELETE] DELETE(params) response:", rDelParam.status, rDelParam.data);
          if (rDelParam.data && rDelParam.data.success === false)
            throw new Error(rDelParam.data.message || "delete returned success:false");
        }
      }

      // Remove from UI on success
      setPosts((prev) => prev.filter((p) => p.postId !== postId));
      console.log("[DELETE] Success, removed postId:", postId);
    } catch (err) {
      console.error("[DELETE] Final error:", err.response?.status, err.response?.data || err.message || err);
      if (err.response?.status === 403) {
        alert("Delete forbidden (403). Check authentication token. See console for details.");
      } else {
        alert("Delete failed: " + (err.response?.data?.message || err.message || "See console"));
      }
    } finally {
      setDeletingId(null);
    }
  };

  // ---------------- LIKE POST ----------------
  const handleLike = async (postId) => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/like_post", {
        adminId,
        postId,
      });
      if (res.data.success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.postId === postId
              ? {
                  ...post,
                  likeCount: res.data.likeCount,
                  likes: {
                    ...post.likes,
                    [adminId]: res.data.liked ? true : undefined,
                  },
                }
              : post
          )
        );
      }
    } catch (err) {
      console.error("Error liking post:", err.response?.data || err);
    }
  };

  // ---------------- UNREAD MESSAGES / TEACHERS FETCH (kept as your original logic) ----------------
  const fetchUnreadMessages = async () => {
    if (!admin.userId) return;

    const senders = {};
    try {
      const usersRes = await axios.get(
        "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json"
      );
      const usersData = usersRes.data || {};

      const findUserByUserId = (userId) => {
        return Object.values(usersData).find((u) => u.userId === userId);
      };

      const getUnreadCount = async (userId) => {
        const key1 = `${admin.userId}_${userId}`;
        const key2 = `${userId}_${admin.userId}`;

        const [r1, r2] = await Promise.all([
          axios.get(`https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${key1}/messages.json`),
          axios.get(`https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${key2}/messages.json`),
        ]);

        const msgs = [...Object.values(r1.data || {}), ...Object.values(r2.data || {})];

        return msgs.filter((m) => m.receiverId === admin.userId && !m.seen).length;
      };

      // Teachers
      const teachersRes = await axios.get(
        "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Teachers.json"
      );
      for (const k in teachersRes.data || {}) {
        const t = teachersRes.data[k];
        const unread = await getUnreadCount(t.userId);
        if (unread > 0) {
          const user = findUserByUserId(t.userId);
          senders[t.userId] = {
            type: "teacher",
            name: user?.name || "Teacher",
            profileImage: user?.profileImage || "/default-profile.png",
            count: unread,
          };
        }
      }

      // Students
      const studentsRes = await axios.get(
        "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Students.json"
      );
      for (const k in studentsRes.data || {}) {
        const s = studentsRes.data[k];
        const unread = await getUnreadCount(s.userId);
        if (unread > 0) {
          const user = findUserByUserId(s.userId);
          senders[s.userId] = {
            type: "student",
            name: user?.name || s.name || "Student",
            profileImage: user?.profileImage || s.profileImage || "/default-profile.png",
            count: unread,
          };
        }
      }

      // Parents
      const parentsRes = await axios.get(
        "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Parents.json"
      );
      for (const k in parentsRes.data || {}) {
        const p = parentsRes.data[k];
        const unread = await getUnreadCount(p.userId);
        if (unread > 0) {
          const user = findUserByUserId(p.userId);
          senders[p.userId] = {
            type: "parent",
            name: user?.name || p.name || "Parent",
            profileImage: user?.profileImage || p.profileImage || "/default-profile.png",
            count: unread,
          };
        }
      }

      setUnreadSenders(senders);
    } catch (err) {
      console.error("Unread fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 5000);
    return () => clearInterval(interval);
  }, [admin.userId]);

  useEffect(() => {
    const fetchTeachersAndUnread = async () => {
      try {
        const [teachersRes, usersRes] = await Promise.all([
          axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Teachers.json"),
          axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json"),
        ]);

        const teachersData = teachersRes.data || {};
        const usersData = usersRes.data || {};

        const teacherList = Object.keys(teachersData).map((tid) => {
          const teacher = teachersData[tid];
          const user = usersData[teacher.userId] || {};
          return {
            teacherId: tid,
            userId: teacher.userId,
            name: user.name || "No Name",
            profileImage: user.profileImage || "/default-profile.png",
          };
        });

        setTeachers(teacherList);

        const unread = {};
        const allMessages = [];

        for (const t of teacherList) {
          const chatKey = `${adminId}_${t.userId}`;
          const res = await axios.get(
            `https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${chatKey}/messages.json`
          );
          const msgs = Object.values(res.data || {}).map((m) => ({
            ...m,
            sender: m.senderId === adminId ? "admin" : "teacher",
          }));
          allMessages.push(...msgs);

          const unreadCount = msgs.filter((m) => m.receiverId === adminId && !m.seen).length;
          if (unreadCount > 0) unread[t.userId] = unreadCount;
        }

        setPopupMessages(allMessages);
        setUnreadTeachers(unread);
      } catch (err) {
        console.error(err);
      }
    };

    fetchTeachersAndUnread();
  }, [adminId]);

  const markMessagesAsSeen = async (userId) => {
    const key1 = `${admin.userId}_${userId}`;
    const key2 = `${userId}_${admin.userId}`;

    const [r1, r2] = await Promise.all([
      axios.get(`https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${key1}/messages.json`),
      axios.get(`https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${key2}/messages.json`),
    ]);

    const updates = {};

    const collectUpdates = (data, basePath) => {
      Object.entries(data || {}).forEach(([msgId, msg]) => {
        if (msg.receiverId === admin.userId && !msg.seen) {
          updates[`${basePath}/${msgId}/seen`] = true;
        }
      });
    };

    collectUpdates(r1.data, `Chats/${key1}/messages`);
    collectUpdates(r2.data, `Chats/${key2}/messages`);

    if (Object.keys(updates).length > 0) {
      await axios.patch("https://ethiostore-17d9f-default-rtdb.firebaseio.com/.json", updates);
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest(".icon-circle") && !e.target.closest(".messenger-dropdown")) {
        setShowMessageDropdown(false);
      }
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest(".icon-circle") && !e.target.closest(".notification-dropdown")) {
        setShowPostDropdown(false);
      }
    };
    document.addEventListener("click", closeDropdown);
    return () => document.removeEventListener("click", closeDropdown);
  }, []);

  const handleOpenChat = () => {
    navigate("/all-chat");
  };

  return (
    <div className="dashboard-page">
      <nav className="top-navbar">
        <h2>Gojo Dashboard</h2>

        <div className="nav-search">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search Teacher and Student..." />
        </div>

        <div className="nav-right">
          <div
            className="icon-circle"
            style={{ position: "relative", cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setShowPostDropdown((prev) => !prev);
            }}
          >
            <FaBell />
            {postNotifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  background: "red",
                  color: "#fff",
                  borderRadius: "50%",
                  padding: "2px 6px",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                {postNotifications.length}
              </span>
            )}

            {showPostDropdown && (
              <div
                className="notification-dropdown"
                style={{
                  position: "absolute",
                  top: "40px",
                  right: "0",
                  width: "350px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  background: "#fff",
                  borderRadius: "10px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
                  zIndex: 1000,
                  padding: "5px 0",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {postNotifications.length === 0 ? (
                  <p style={{ padding: "12px", textAlign: "center" }}>No new notifications</p>
                ) : (
                  postNotifications.map((n) => (
                    <div
                      key={n.notificationId}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onClick={async () => {
                        await axios.post("http://127.0.0.1:5000/api/mark_post_notification_read", {
                          notificationId: n.notificationId,
                        });
                        setPostNotifications((prev) =>
                          prev.filter((notif) => notif.notificationId !== n.notificationId)
                        );
                        setShowPostDropdown(false);
                        navigate("/dashboard", { state: { postId: n.postId } });
                      }}
                    >
                      <img
                        src={n.adminProfile || "/default-profile.png"}
                        alt={n.adminName}
                        style={{ width: "40px", height: "40px", borderRadius: "50%" }}
                      />
                      <div>
                        <strong>{n.adminName}</strong>
                        <p style={{ margin: 0 }}>{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div
            className="icon-circle"
            style={{ position: "relative", cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setShowMessageDropdown((prev) => !prev);
            }}
          >
            <FaFacebookMessenger />
            {Object.keys(unreadSenders).length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-5px",
                  right: "-5px",
                  background: "red",
                  color: "#fff",
                  borderRadius: "50%",
                  padding: "2px 6px",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                {Object.values(unreadSenders).reduce((a, b) => a + b.count, 0)}
              </span>
            )}

            {showMessageDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "40px",
                  right: "0",
                  width: "300px",
                  background: "#fff",
                  borderRadius: "10px",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
                  zIndex: 1000,
                }}
              >
                {Object.keys(unreadSenders).length === 0 ? (
                  <p style={{ padding: "12px", textAlign: "center", color: "#777" }}>No new messages</p>
                ) : (
                  Object.entries(unreadSenders).map(([userId, sender]) => (
                    <div
                      key={userId}
                      style={{
                        padding: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onClick={async () => {
                        setShowMessageDropdown(false);
                        await markMessagesAsSeen(userId);
                        setUnreadSenders((prev) => {
                          const copy = { ...prev };
                          delete copy[userId];
                          return copy;
                        });
                        navigate("/all-chat", {
                          state: {
                            user: {
                              userId,
                              name: sender.name,
                              profileImage: sender.profileImage,
                              type: sender.type,
                            },
                          },
                        });
                      }}
                    >
                      <img
                        src={sender.profileImage}
                        alt={sender.name}
                        style={{ width: "42px", height: "42px", borderRadius: "50%" }}
                      />
                      <div>
                        <strong>{sender.name}</strong>
                        <p style={{ fontSize: "12px", margin: 0 }}>
                          {sender.count} new message{sender.count > 1 && "s"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <Link className="icon-circle" to="/settings">
            <FaCog />
          </Link>

          <img src={admin.profileImage || "/default-profile.png"} alt="admin" className="profile-img" />
        </div>
      </nav>

      <div className="google-dashboard">
        <div className="google-sidebar">
          <div className="sidebar-profile">
            <div className="sidebar-img-circle">
              <img src={admin?.profileImage || "/default-profile.png"} alt="profile" />
            </div>
            <h3>{admin?.name || "Admin Name"}</h3>
            <p>{admin?.username || "username"}</p>
          </div>

          <div className="sidebar-menu">
            <Link className="sidebar-btn" to="/dashboard">
              <FaHome style={{ width: "28px", height: "28px" }} /> Home
            </Link>
            <Link className="sidebar-btn" to="/my-posts" style={{ backgroundColor: "#4b6cb7", color: "#fff" }}>
              <FaFileAlt /> My Posts
            </Link>
            <Link className="sidebar-btn" to="/teachers">
              <FaChalkboardTeacher /> Teachers
            </Link>
            <Link className="sidebar-btn" to="/students">
              <FaChalkboardTeacher /> Students
            </Link>
            <Link className="sidebar-btn" to="/schedule">
              <FaCalendarAlt /> Schedule
            </Link>
            <Link className="sidebar-btn" to="/parents">
              <FaChalkboardTeacher /> Parents
            </Link>

            <button
              className="sidebar-btn logout-btn"
              onClick={() => {
                localStorage.removeItem("admin");
                window.location.href = "/login";
              }}
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>

        <div className="google-main">
          <div className="post-box">
            <div className="fb-post-top">
              <img src={admin.profileImage || "/default-profile.png"} alt="me" />
              <textarea placeholder="What's on your mind?" value={postText} onChange={(e) => setPostText(e.target.value)} />
              <div className="fb-post-bottom">
                <label className="fb-upload">
                  <AiFillPicture className="fb-icon" />
                  <input type="file" onChange={(e) => setPostMedia(e.target.files[0])} accept="image/*,video/*" />
                </label>
                <button className="telegram-send-icon" onClick={handlePost}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25" width="35" height="35" fill="#0088cc">
                    <path d="M2.01 21L23 12 2.01 3v7l15 2-15 2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {posts.length === 0 && <p style={{ fontSize: "16px", textAlign: "center" }}>You have no posts yet.</p>}

          {posts.map((post) => (
            <div
              key={post.postId}
              id={`post-${post.postId}`}
              style={{
                width: "55%",
                margin: "0 5% 30px 40%",
                border: "1px solid #ccc",
                borderRadius: "12px",
                boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
                background: "#fff",
              }}
              className="post-card"
            >
              <div style={{ display: "flex", alignItems: "center", padding: "15px", gap: "10px", borderBottom: "1px solid #eee" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", overflow: "hidden" }}>
                  <img src={admin.profileImage || "/default-profile.png"} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>{admin.name}</h4>
                  <small style={{ color: "gray" }}>{post.time}</small>
                </div>
              </div>

              <div style={{ padding: "15px" }}>
                {editingPostId === post.postId ? (
                  <div>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      style={{ width: "100%", height: "100px", padding: "10px", borderRadius: "8px", fontSize: "16px", resize: "none" }}
                    />
                    <div style={{ marginTop: "10px" }}>
                      <button
                        onClick={() => saveEdit(post.postId)}
                        disabled={savingId === post.postId}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "none",
                          background: "#4b6cb7",
                          color: "#fff",
                          cursor: "pointer",
                          marginRight: "10px",
                        }}
                      >
                        {savingId === post.postId ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingPostId(null)}
                        style={{ padding: "8px 12px", borderRadius: "8px", border: "none", background: "#ccc", color: "#333", cursor: "pointer" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: "16px", marginBottom: "10px" }}>{post.message}</p>
                    {post.edited && <small style={{ color: "gray" }}>(edited)</small>}
                    {post.postUrl && (
                      <img src={post.postUrl} alt="post media" style={{ width: "100%", maxHeight: "400px", objectFit: "cover", borderRadius: "12px", marginTop: "10px" }} />
                    )}
                  </>
                )}
              </div>

              {editingPostId !== post.postId && (
                <div style={{ display: "flex", gap: "10px", padding: "10px 15px", borderTop: "1px solid #eee" }}>
                  <button
                    onClick={() => handleEdit(post.postId, post.message)}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: "none", background: "#ffa500", color: "#fff", cursor: "pointer" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.postId)}
                    disabled={deletingId === post.postId}
                    style={{ padding: "8px 12px", borderRadius: "8px", border: "none", background: "#ff4b5c", color: "#fff", cursor: "pointer" }}
                  >
                    {deletingId === post.postId ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyPosts;