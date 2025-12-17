import React, { useEffect, useState } from "react";
import { ref, onValue, push, set } from "firebase/database";
import { db } from "../firebase";
import { FaUserCircle, FaPaperPlane } from "react-icons/fa";
import "../styles/chat.css";

function TeacherChatPage({ teacherUserId }) {
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  /* -------------------------------------------
     LOAD STUDENTS (FROM TEACHER ASSIGNMENTS)
  --------------------------------------------*/
  useEffect(() => {
    const assignmentRef = ref(db, "TeacherAssignments");

    onValue(assignmentRef, (snap) => {
      const assignments = snap.val() || {};
      const courseIds = Object.values(assignments)
        .filter(a => a.teacherId === teacherUserId)
        .map(a => a.courseId);

      loadStudents(courseIds);
      loadAdmins();
    });
  }, [teacherUserId]);

  const loadStudents = (courseIds) => {
    const courseRef = ref(db, "Courses");
    const studentRef = ref(db, "Students");
    const usersRef = ref(db, "Users");

    onValue(courseRef, (courseSnap) => {
      const courses = courseSnap.val() || {};
      const teacherCourses = courseIds.map(id => courses[id]);

      onValue(studentRef, (studentSnap) => {
        const students = studentSnap.val() || {};
        const matchedStudents = Object.entries(students)
          .filter(([_, s]) =>
            teacherCourses.some(
              c => c.grade === s.grade && c.section === s.section
            )
          )
          .map(([_, s]) => s.userId);

        onValue(usersRef, (userSnap) => {
          const users = userSnap.val() || {};
          const studentUsers = matchedStudents.map(uid => ({
            userId: uid,
            name: users[uid]?.name || "Student",
            role: "student",
          }));

          setChatUsers(prev => [...prev.filter(u => u.role !== "student"), ...studentUsers]);
        });
      });
    });
  };

  /* -------------------------------------------
     LOAD ADMINS
  --------------------------------------------*/
  const loadAdmins = () => {
    const usersRef = ref(db, "Users");
    onValue(usersRef, (snap) => {
      const users = snap.val() || {};
      const admins = Object.values(users)
        .filter(u => u.role === "school_admin")
        .map(u => ({
          userId: u.userId,
          name: u.name,
          role: "admin",
        }));

      setChatUsers(prev => [...admins, ...prev.filter(u => u.role !== "admin")]);
    });
  };

  /* -------------------------------------------
     LOAD MESSAGES
  --------------------------------------------*/
  const openChat = (user) => {
    setSelectedUser(user);
    const chatId = [teacherUserId, user.userId].sort().join("_");

    const msgRef = ref(db, `Chats/${chatId}/messages`);
    onValue(msgRef, (snap) => {
      setMessages(Object.values(snap.val() || {}));
    });

    // reset unread
    set(ref(db, `ChatsIndex/${teacherUserId}/${user.userId}/unread`), 0);
  };

  /* -------------------------------------------
     SEND MESSAGE
  --------------------------------------------*/
  const sendMessage = async () => {
    if (!text.trim()) return;

    const chatId = [teacherUserId, selectedUser.userId].sort().join("_");
    const time = Date.now();

    await push(ref(db, `Chats/${chatId}/messages`), {
      senderId: teacherUserId,
      receiverId: selectedUser.userId,
      text,
      timeStamp: time,
    });

    await set(ref(db, `ChatsIndex/${teacherUserId}/${selectedUser.userId}`), {
      chatId,
      lastMessage: text,
      lastTime: time,
      unread: 0,
    });

    setText("");
  };

  /* -------------------------------------------
     UI
  --------------------------------------------*/
  return (
    <div className="chat-container">
      {/* LEFT: USER LIST */}
      <div className="chat-users">
        <h3>Chats</h3>
        {chatUsers.map((u) => (
          <div
            key={u.userId}
            className={`chat-user ${selectedUser?.userId === u.userId ? "active" : ""}`}
            onClick={() => openChat(u)}
          >
            <FaUserCircle size={28} />
            <div>
              <p>{u.name}</p>
              <small>{u.role}</small>
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT: CHAT WINDOW */}
      <div className="chat-window">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <FaUserCircle />
              <span>{selectedUser.name}</span>
            </div>

            <div className="chat-messages">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`chat-msg ${m.senderId === teacherUserId ? "sent" : "received"}`}
                >
                  {m.text}
                </div>
              ))}
            </div>

            <div className="chat-input">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type message..."
              />
              <button onClick={sendMessage}>
                <FaPaperPlane />
              </button>
            </div>
          </>
        ) : (
          <div className="chat-empty">Select a chat</div>
        )}
      </div>
    </div>
  );
}

export default TeacherChatPage;
