import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css"; // single CSS for both

function TeacherRegister() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    courses: [{ grade: "", section: "", subject: "" }],
  });
  const [profile, setProfile] = useState(null); // profile image
  const [message, setMessage] = useState("");

  // Handle input changes
  const handleChange = (e, index = null) => {
    const { name, value } = e.target;
    if (index !== null) {
      const updatedCourses = [...formData.courses];
      updatedCourses[index][name] = value;
      setFormData({ ...formData, courses: updatedCourses });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addCourse = () => {
    setFormData({
      ...formData,
      courses: [...formData.courses, { grade: "", section: "", subject: "" }],
    });
  };

  const removeCourse = (index) => {
    const updatedCourses = formData.courses.filter((_, i) => i !== index);
    setFormData({ ...formData, courses: updatedCourses });
  };

  // Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const dataToSend = new FormData();
      dataToSend.append("name", formData.name);
      dataToSend.append("username", formData.username);
      dataToSend.append("password", formData.password);
      dataToSend.append("courses", JSON.stringify(formData.courses));
      if (profile) dataToSend.append("profile", profile); // image file

      const res = await fetch("http://127.0.0.1:5000/register/teacher", {
        method: "POST",
        body: dataToSend,
      });

      const data = await res.json();

      if (data.success) {
        // Store teacher info including profile image URL returned from backend
        const teacherData = {
          teacherId: data.teacherId || data.userId || "",
          name: formData.name,
          username: formData.username,
          profileImage: data.profileImage || "/default-profile.png",
        };
        localStorage.setItem("teacher", JSON.stringify(teacherData));

        setMessage("Teacher registered successfully!");
        setFormData({
          name: "",
          username: "",
          password: "",
          courses: [{ grade: "", section: "", subject: "" }],
        });
        setProfile(null);

        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        setMessage(`Failed to register teacher: ${data.message}`);
      }
    } catch (err) {
      setMessage("Error connecting to server.");
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box" style={{ maxWidth: "600px" }}>
        <h2>Teacher Registration</h2>
        {message && <p className="auth-error">{message}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {/* Profile Image Upload */}
          <div className="profile-upload">
            {profile && (
              <img
                src={URL.createObjectURL(profile)}
                alt="Profile Preview"
                className="profile-preview"
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfile(e.target.files[0])}
            />
          </div>

          <h3>Courses</h3>
          {formData.courses.map((course, index) => (
            <div className="course-group" key={index}>
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={course.subject}
                onChange={(e) => handleChange(e, index)}
                required
              />
              <input
                type="text"
                name="grade"
                placeholder="Grade"
                value={course.grade}
                onChange={(e) => handleChange(e, index)}
                required
              />
              <input
                type="text"
                name="section"
                placeholder="Section"
                value={course.section}
                onChange={(e) => handleChange(e, index)}
                required
              />
              {formData.courses.length > 1 && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => removeCourse(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button type="button" className="add-btn" onClick={addCourse}>
            Add Course
          </button>

          <button type="submit" className="submit-btn">
            Register
          </button>
        </form>

        <p className="auth-link">
          Already have an account? <a href="/login">Go to Login</a>
        </p>
      </div>
    </div>
  );
}

export default TeacherRegister;
