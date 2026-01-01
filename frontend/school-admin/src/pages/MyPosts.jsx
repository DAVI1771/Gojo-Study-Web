import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaHome, FaFileAlt, FaChalkboardTeacher, FaCog, FaSignOutAlt, FaBell, FaFacebookMessenger ,  FaSearch, FaCalendarAlt  } from "react-icons/fa";
import { AiFillPicture } from "react-icons/ai";
import "../styles/global.css";
import { useNavigate } from "react-router-dom";


function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const navigate = useNavigate(); 
  // New post states
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




  // Logged-in admin
  const admin = JSON.parse(localStorage.getItem("admin")) || {};
const adminId = admin.userId;


 useEffect(() => {
    if (!adminId) {
      console.error("Admin ID missing in localStorage", admin);
      return;
    }
    fetchMyPosts();
  }, [adminId]);

  // ---------------- FETCH POST NOTIFICATIONS ----------------

const fetchPostNotifications = async () => {
  try {
    const res = await axios.get(`http://127.0.0.1:5000/api/get_post_notifications/${adminId}`);
    console.log("Notifications fetched:", res.data);

    // Ensure all objects have notificationId
    const notifications = (res.data || []).map(n => ({
      ...n,
      notificationId: n.notificationId || n.id
    }));

    setPostNotifications(notifications);
  } catch (err) {
    console.error("Post notification fetch failed", err);
  }
};



// -----------------------------
// Add at the top
// -----------------------------


useEffect(() => {
  fetchPostNotifications();
  const interval = setInterval(fetchPostNotifications, 5000);
  return () => clearInterval(interval);
}, [adminId]);

const handleNotificationClick = async (notification) => {
  // 1️⃣ Mark as read in backend
  await axios.post("http://127.0.0.1:5000/api/mark_post_notification_read", {
    notificationId: notification.notificationId
  });

  // 2️⃣ Remove from UI
  setPostNotifications(prev =>
    prev.filter(n => n.notificationId !== notification.notificationId)
  );

  setShowPostDropdown(false);

  // 3️⃣ Navigate to dashboard page with postId in state
  navigate("/dashboard", { state: { postId: notification.postId } });
};



  useEffect(() => {
    // Replace with your actual API call
    const fetchUnreadSenders = async () => {
      const response = await fetch("/api/unreadSenders");
      const data = await response.json();
      setUnreadSenders(data);
    };
    fetchUnreadSenders();
  }, []);


const handleClick = () => {
    navigate("/all-chat"); // replace with your target route
  };

   const fetchMyPosts = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/get_my_posts/${adminId}`);
      setPosts(res.data || []);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`http://127.0.0.1:5000/api/delete_post/${postId}`, {
        data: { adminId },
      });
      setPosts(posts.filter((post) => post.postId !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleEdit = (postId, currentContent) => {
    setEditingPostId(postId);
    setEditedContent(currentContent);
  };

  const saveEdit = async (postId) => {
    try {
      await axios.post(`http://127.0.0.1:5000/api/edit_post/${postId}`, {
        adminId,
        postText: editedContent,
      });
      setPosts(
        posts.map((post) =>
          post.postId === postId
            ? { ...post, message: editedContent, edited: true }
            : post
        )
      );
      setEditingPostId(null);
      setEditedContent("");
    } catch (err) {
      console.error("Error updating post:", err);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/like_post", {
        adminId: adminId,

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
      console.error("Error liking post:", err);
    }
  };





 // ---------------- FETCH UNREAD MESSAGES ----------------
const fetchUnreadMessages = async () => {
  if (!admin.userId) return;

  const senders = {};

  try {
    // 1️⃣ USERS (names & images)
    const usersRes = await axios.get(
      "https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json"
    );
    const usersData = usersRes.data || {};

 const findUserByUserId = (userId) => {
  return Object.values(usersData).find(u => u.userId === userId);
};



    // helper to read messages from BOTH chat keys
    const getUnreadCount = async (userId) => {
      const key1 = `${admin.userId}_${userId}`;
      const key2 = `${userId}_${admin.userId}`;

      const [r1, r2] = await Promise.all([
        axios.get(`https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${key1}/messages.json`),
        axios.get(`https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${key2}/messages.json`)
      ]);

      const msgs = [
        ...Object.values(r1.data || {}),
        ...Object.values(r2.data || {})
      ];

      return msgs.filter(
        m => m.receiverId === admin.userId && !m.seen
      ).length;
    };

    // 2️⃣ TEACHERS
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
  count: unread
};
      }
    }

    // 3️⃣ STUDENTS
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
  count: unread
};

      }
    }

    // 4️⃣ PARENTS
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
  count: unread
};

      }
    }

    setUnreadSenders(senders);
  } catch (err) {
    console.error("Unread fetch failed:", err);
  }
};

  // ---------------- CLOSE DROPDOWN ON OUTSIDE CLICK ----------------
useEffect(() => {
  const closeDropdown = (e) => {
    if (
      !e.target.closest(".icon-circle") &&
      !e.target.closest(".messenger-dropdown")
    ) {
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



useEffect(() => {
  if (!admin.userId) return;

  fetchUnreadMessages();
  const interval = setInterval(fetchUnreadMessages, 5000);

  return () => clearInterval(interval);
}, [admin.userId]);


useEffect(() => {
  const fetchTeachersAndUnread = async () => {
    try {
      const [teachersRes, usersRes] = await Promise.all([
        axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Teachers.json"),
        axios.get("https://ethiostore-17d9f-default-rtdb.firebaseio.com/Users.json")
      ]);

      const teachersData = teachersRes.data || {};
      const usersData = usersRes.data || {};

      const teacherList = Object.keys(teachersData).map(tid => {
        const teacher = teachersData[tid];
        const user = usersData[teacher.userId] || {};
        return {
          teacherId: tid,
          userId: teacher.userId,
          name: user.name || "No Name",
          profileImage: user.profileImage || "/default-profile.png"
        };
      });

      setTeachers(teacherList);

      // fetch unread messages
      const unread = {};
      const allMessages = [];

      for (const t of teacherList) {
        const chatKey = `${adminId}_${t.userId}`;
        const res = await axios.get(`https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${chatKey}/messages.json`);
        const msgs = Object.values(res.data || {}).map(m => ({
          ...m,
          sender: m.senderId === adminId
 ? "admin" : "teacher"
        }));
        allMessages.push(...msgs);

        const unreadCount = msgs.filter(m => m.receiverId === adminId
 && !m.seen).length;
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



  // ---------------- NEW POST ----------------
  const handlePost = async () => {
    if (!postText && !postMedia) return; // don't allow empty posts
    try {
      const formData = new FormData();
     formData.append("adminId", adminId);

      formData.append("postText", postText);
      if (postMedia) formData.append("postMedia", postMedia);

      const res = await axios.post(
        "http://127.0.0.1:5000/api/create_post",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setPosts([res.data, ...posts]); // add new post to the top
      setPostText("");
      setPostMedia(null);
    } catch (err) {
      console.error("Error creating post:", err);
    }
  };


const markMessagesAsSeen = async (userId) => {
  const key1 = `${admin.userId}_${userId}`;
  const key2 = `${userId}_${admin.userId}`;

  const [r1, r2] = await Promise.all([
    axios.get(`https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${key1}/messages.json`),
    axios.get(`https://ethiostore-17d9f-default-rtdb.firebaseio.com/Chats/${key2}/messages.json`)
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
    await axios.patch(
      "https://ethiostore-17d9f-default-rtdb.firebaseio.com/.json",
      updates
    );
  }
};


  return (
    <div className="dashboard-page">
  
  {/* ---------------- TOP NAVIGATION BAR ---------------- */}
  <nav className="top-navbar">
    <h2>Gojo Dashboard</h2>
  
    {/* Search Bar */}
    <div className="nav-search">
      <FaSearch className="search-icon" />
      <input type="text" placeholder="Search Teacher and Student..." />
    </div>
  
    <div className="nav-right">
      {/* Notification */}
{/* Notification Icon */}
<div
  className="icon-circle"
  style={{ position: "relative", cursor: "pointer" }}
  onClick={(e) => {
    e.stopPropagation(); // prevents document click from closing immediately
    setShowPostDropdown(prev => !prev);
  }}
>
  <FaBell />

  {/* Notification Badge */}
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
        fontWeight: "bold"
      }}
    >
      {postNotifications.length}
    </span>
  )}

  {/* Notification Dropdown */}
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
        padding: "5px 0"
      }}
      onClick={(e) => e.stopPropagation()} // 🔹 important: stop clicks from bubbling
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
              borderBottom: "1px solid #eee"
            }}
            onClick={async () => {
              // Mark as read
              await axios.post("http://127.0.0.1:5000/api/mark_post_notification_read", {
                notificationId: n.notificationId
              });

              // Remove from UI
              setPostNotifications(prev =>
                prev.filter(notif => notif.notificationId !== n.notificationId)
              );

              setShowPostDropdown(false);

              // Navigate to dashboard
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





   {/* ================= MESSENGER ================= */}
   <div
     className="icon-circle"
     style={{ position: "relative", cursor: "pointer" }}
     onClick={(e) => {
       e.stopPropagation();
       setShowMessageDropdown((prev) => !prev);
     }}
   >
     <FaFacebookMessenger />
   
     {/* 🔴 TOTAL UNREAD COUNT */}
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
           fontWeight: "bold"
         }}
       >
         {Object.values(unreadSenders).reduce((a, b) => a + b.count, 0)}
       </span>
     )}
   
     {/* 📩 DROPDOWN */}
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
           zIndex: 1000
         }}
       >
         {Object.keys(unreadSenders).length === 0 ? (
           <p style={{ padding: "12px", textAlign: "center", color: "#777" }}>
             No new messages
           </p>
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
                 borderBottom: "1px solid #eee"
               }}
     onClick={async () => {
  setShowMessageDropdown(false);

  // 1️⃣ Mark messages as seen in DB
  await markMessagesAsSeen(userId);

  // 2️⃣ Remove sender immediately from UI
  setUnreadSenders(prev => {
    const copy = { ...prev };
    delete copy[userId];
    return copy;
  });

  // 3️⃣ Navigate to exact chat
  navigate("/all-chat", {
    state: {
      user: {
        userId,
        name: sender.name,
        profileImage: sender.profileImage,
        type: sender.type
      }
    }
  });
}}

   
   
             >
               <img
                 src={sender.profileImage}
                 alt={sender.name}
                 style={{
                   width: "42px",
                   height: "42px",
                   borderRadius: "50%"
                 }}
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
   {/* ============== END MESSENGER ============== */}
   
  
      {/* Settings */}
      <Link className="icon-circle" to="/settings">
        <FaCog />
      </Link>

      {/* Profile */}
      <img
        src={admin.profileImage || "/default-profile.png"}
        alt="admin"
        className="profile-img"
      />
      {/* <span>{admin.name}</span> */}
    </div>
  </nav>
  
  


      <div className="google-dashboard">
 {/* LEFT SIDEBAR — 25% */}

     <div className="google-sidebar">
      <div className="sidebar-profile">
        <div className="sidebar-img-circle">
          <img src={admin?.profileImage || "/default-profile.png"} alt="profile" />
        </div>
        <h3>{admin?.name || "Admin Name"}</h3>
        <p>{admin?.username || "username"}</p>
      </div>

      <div className="sidebar-menu">
           <Link className="sidebar-btn" to="/dashboard"
            
            > <FaHome style={{ width: "28px", height:"28px" }}/> Home</Link>
             <Link className="sidebar-btn" to="/my-posts" style={{ backgroundColor: "#4b6cb7", color: "#fff" }}><FaFileAlt /> My Posts</Link>
             <Link className="sidebar-btn" to="/teachers"><FaChalkboardTeacher /> Teachers</Link>
               <Link className="sidebar-btn" to="/students" > <FaChalkboardTeacher /> Students</Link>
                <Link
                             className="sidebar-btn"
                             to="/schedule"
                            
                       >
                             <FaCalendarAlt /> Schedule
                           </Link>
                <Link className="sidebar-btn" to="/parents" ><FaChalkboardTeacher /> Parents
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

  {/* MAIN CONTENT — 75% */}
        <div className="google-main">
                     {/* Post input box */}
                     <div className="post-box">
             <div className="fb-post-top">
               <img src={admin.profileImage || "/default-profile.png"} alt="me" />
               <textarea
                 placeholder="What's on your mind?"
                 value={postText}
                 onChange={(e) => setPostText(e.target.value)}
               />
           <div className="fb-post-bottom">
              <label className="fb-upload">
             <AiFillPicture className="fb-icon" />
            
             <input
               type="file"
               onChange={(e) => setPostMedia(e.target.files[0])}
               accept="image/*,video/*"
             />
           </label>
           
           
              <button className="telegram-send-icon" onClick={handlePost}>
             <svg
               xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 25 25"
               width="35"
               height="35"
               fill="#0088cc"
             >
               <path d="M2.01 21L23 12 2.01 3v7l15 2-15 2z" />
             </svg>
           </button>
             </div>
           
             </div>
        
           </div>




















            {/* ---------------- POSTS LIST ---------------- */}
            {posts.length === 0 && (
              <p style={{ fontSize: "16px", textAlign: "center" }}>You have no posts yet.</p>
            )}

            {posts.map((post) => (
              <div
                key={post.postId}
                id={`post-${post.postId}`} // ✅ this is essential
               style={{
                       width: "55%",               // fixed width
                       margin: "0 5% 30px 40%", /* top:0, right:0, bottom:30px, left:25% */
                       border: "1px solid #ccc",
                       borderRadius: "12px",
                       boxShadow: "0 5px 20px rgba(0,0,0,0.1)",
                       background: "#fff",
}}

                className="post-card"
              >
                {/* Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "15px",
                    gap: "10px",
                    borderBottom: "1px solid #eee",
                  }}
                >
                  <div
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={admin.profileImage || "/default-profile.png"}
                      alt="profile"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <h4 style={{ margin: 0 }}>{admin.name}</h4>
                    <small style={{ color: "gray" }}>{post.time}</small>
                  </div>
                </div>

                {/* Post content */}
                <div style={{ padding: "15px" }}>
                  {editingPostId === post.postId ? (
                    <div>
                      <textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        style={{
                          width: "100%",
                          height: "100px",
                          padding: "10px",
                          borderRadius: "8px",
                          fontSize: "16px",
                          resize: "none",
                        }}
                      />
                      <div style={{ marginTop: "10px" }}>
                        <button
                          onClick={() => saveEdit(post.postId)}
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
                          Save
                        </button>
                        <button
                          onClick={() => setEditingPostId(null)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#ccc",
                            color: "#333",
                            cursor: "pointer",
                          }}
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
                        <img
                          src={post.postUrl}
                          alt="post media"
                          style={{
                            width: "100%",
                            maxHeight: "400px",
                            objectFit: "cover",
                            borderRadius: "12px",
                            marginTop: "10px",
                          }}
                        />
                      )}
                    </>
                  )}
                </div>

                {/* Footer buttons */}
                {editingPostId !== post.postId && (
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      padding: "10px 15px",
                      borderTop: "1px solid #eee",
                    }}
                  >
                    <button
                      onClick={() => handleEdit(post.postId, post.message)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#ffa500",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.postId)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#ff4b5c",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      Delete
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
