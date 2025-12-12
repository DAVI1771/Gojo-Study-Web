import json
from flask import Flask, render_template, request, jsonify
import firebase_admin
from firebase_admin import credentials, db
from flask_cors import CORS
from flask import Flask
from flask_cors import CORS
from firebase_admin import storage
from firebase_admin import credentials, db, storage
import os
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
import sys
from firebase_admin import db




# Initialize Flask app
app = Flask(__name__)
CORS(app)

# ✅ Fix CORS: allow all origins, methods, headers
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)


# ---------------- FIREBASE ---------------- #
firebase_json = "ethiostore-17d9f-firebase-adminsdk-5e87k-ff766d2648.json"
if not os.path.exists(firebase_json):
    print("Firebase JSON missing")
    sys.exit()

# Initialize Firebase Admin
cred = credentials.Certificate(firebase_json)
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://ethiostore-17d9f-default-rtdb.firebaseio.com/",
    "storageBucket": "ethiostore-17d9f.appspot.com"
})
bucket = storage.bucket()


# ===================== HOME PAGE =====================
@app.route('/')
def home():
    return render_template('teacher_login.html')


# ===================== STUDENT REGISTRATION =====================
@app.route('/register/student', methods=['POST'])
def register_student():
    data = request.json

    users_ref = db.reference('Users')
    students_ref = db.reference('Students')

    # Check if username exists
    all_users = users_ref.get() or {}
    for user in all_users.values():
        if user.get('username') == data['username']:
            return jsonify({'success': False, 'message': 'Username already exists!'})

    # Create user
    new_user_ref = users_ref.push()
    new_user_ref.set({
        'userId': new_user_ref.key,
        'username': data['username'],
        'name': data['name'],
        'password': data['password'],
        'role': 'student',
        'isActive': True
    })

    # Create student entry
    new_student_ref = students_ref.push()
    new_student_ref.set({
        'userId': new_user_ref.key,
        'academicYear': '2024_2025',
        'grade': data['grade'],
        'section': data['section'],
        'status': 'active'
    })

    return jsonify({'success': True, 'message': 'Student registered successfully!'})








# ===================== TEACHER REGISTRATION =====================
@app.route('/register/teacher', methods=['POST'])
def register_teacher():
    name = request.form.get('name')
    username = request.form.get('username')
    password = request.form.get('password')
    courses = json.loads(request.form.get('courses', '[]'))
    profile_file = request.files.get('profile')

    users_ref = db.reference('Users')
    teachers_ref = db.reference('Teachers')
    courses_ref = db.reference('Courses')
    assignments_ref = db.reference('TeacherAssignments')

    # Check if username exists
    all_users = users_ref.get() or {}
    for user in all_users.values():
        if user.get('username') == username:
            return jsonify({'success': False, 'message': 'Username already exists!'})

    # Upload profile image
    profile_url = "/default-profile.png"
    if profile_file:
        filename = f"teachers/{username}_{profile_file.filename}"
        blob = bucket.blob(filename)
        blob.upload_from_file(profile_file, content_type=profile_file.content_type)
        blob.make_public()
        profile_url = blob.public_url

    # Create user and store profileImage
    new_user_ref = users_ref.push()
    user_data = {
        'userId': new_user_ref.key,
        'username': username,
        'name': name,
        'password': password,
        'role': 'teacher',
        'isActive': True,
        'profileImage': profile_url  # store profile URL
    }
    new_user_ref.set(user_data)

    # Create teacher entry
    new_teacher_ref = teachers_ref.push()
    new_teacher_ref.set({
        'userId': new_user_ref.key,
        'status': 'active'
    })

    # Assign courses
    for course in courses:
        grade = course['grade']
        section = course['section']
        subject = course['subject']
        course_id = f"course_{subject.lower()}_{grade}{section.upper()}"

        if not courses_ref.child(course_id).get():
            courses_ref.child(course_id).set({
                'name': subject,
                'subject': subject,
                'grade': grade,
                'section': section
            })

        assignment_ref = assignments_ref.push()
        assignment_ref.set({
            'teacherId': new_teacher_ref.key,
            'courseId': course_id
        })

    return jsonify({
        'success': True,
        'message': 'Teacher registered successfully!',
        'teacherId': new_user_ref.key,
        'profileImage': profile_url  # return URL to frontend
    })






# ===================== TEACHER DASHBOARD PAGE =====================
@app.route('/teacher/dashboard')
def teacher_dashboard():
    return render_template('teacher_dashboard.html')










# ===================== FETCH TAKEN SUBJECTS =====================
@app.route('/teachers/subjects/<grade>/<section>', methods=['GET'])
def get_taken_subjects(grade, section):
    assignments_ref = db.reference('TeacherAssignments')
    courses_ref = db.reference('Courses')

    all_assignments = assignments_ref.get() or {}
    taken_subjects = []

    for assign in all_assignments.values():
        course_id = assign.get('courseId')
        course = courses_ref.child(course_id).get()
        if course and str(course.get('grade')) == grade and course.get('section') == section:
            taken_subjects.append(course.get('subject'))

    return jsonify({'takenSubjects': taken_subjects})


# ===================== TEACHER LOGIN =====================


@app.route("/api/teacher_login", methods=["POST", "OPTIONS"])
def teacher_login():
    if request.method == "OPTIONS":
        # Preflight request for CORS
        return '', 200

    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password required"}), 400

    try:
        users_ref = db.reference("Users")
        all_users = users_ref.get() or {}

        # Find user with role 'teacher' and matching username
        teacher_user = None
        for user_id, user in all_users.items():
            if user.get("username") == username and user.get("role") == "teacher":
                teacher_user = {"userId": user_id, **user}
                break

        if not teacher_user:
            return jsonify({"success": False, "message": "Teacher not found"}), 404

        # Check password
        if teacher_user.get("password") != password:
            return jsonify({"success": False, "message": "Invalid password"}), 401

        # Optional: fetch teacher profile image from Teachers node
        teachers_ref = db.reference("Teachers")
        teacher_profile = teachers_ref.child(teacher_user["userId"]).get() or {}
        profile_image = teacher_profile.get("profileImage", "/default-profile.png")

        # Return teacher info
        return jsonify({
            "success": True,
            "teacher": {
                "teacherId": teacher_user["userId"],
                "name": teacher_user.get("name"),
                "username": teacher_user.get("username"),
                "profileImage": profile_image
            }
        })

    except Exception as e:
        print("Login error:", e)
        return jsonify({"success": False, "message": "Server error"}), 500


@app.route('/api/teacher/<teacher_id>/courses', methods=['GET'])
def get_teacher_courses(teacher_id):
    assignments_ref = db.reference('TeacherAssignments')
    courses_ref = db.reference('Courses')

    all_assignments = assignments_ref.get() or {}
    courses_list = []

    for assign in all_assignments.values():
        if assign.get('teacherId') == teacher_id:
            course_id = assign.get('courseId')
            course_data = courses_ref.child(course_id).get()
            if course_data:
                courses_list.append({
                    'subject': course_data.get('subject'),
                    'grade': course_data.get('grade'),
                    'section': course_data.get('section')
                })

    return jsonify({'courses': courses_list})





@app.route('/api/teacher/<teacher_id>/students', methods=['GET'])
def get_teacher_students(teacher_id):
    assignments_ref = db.reference('TeacherAssignments')
    courses_ref = db.reference('Courses')
    students_ref = db.reference('Students')
    users_ref = db.reference('Users')
    marks_ref = db.reference('ClassMarks')

    all_assignments = assignments_ref.get() or {}
    course_students = []

    for assign in all_assignments.values():
        if assign.get('teacherId') != teacher_id:
            continue

        course_id = assign.get('courseId')
        course_data = courses_ref.child(course_id).get()
        if not course_data:
            continue

        grade = course_data.get('grade')
        section = course_data.get('section')
        subject = course_data.get('subject')

        # Fetch all students in this grade + section
        all_students = students_ref.get() or {}
        students_list = []
        for student_id, student in all_students.items():
            if student.get('grade') == grade and student.get('section') == section:
                user_data = users_ref.child(student.get('userId')).get()
                if not user_data:
                    continue

                # Fetch marks from ClassMarks node
                student_marks = marks_ref.child(student_id).child(course_id).get() or {}
                
                students_list.append({
                    'name': user_data.get('name'),
                    'username': user_data.get('username'),
                    'marks': student_marks
                })

        # Avoid duplicate grade-section
        exists = next((c for c in course_students if c['grade'] == grade and c['section'] == section and c['subject'] == subject), None)
        if not exists:
            course_students.append({
                'subject': subject,
                'grade': grade,
                'section': section,
                'students': students_list
            })

    return jsonify({'courses': course_students})


# ===================== GET STUDENTS OF A COURSE =====================
# ===================== GET STUDENTS OF A COURSE =====================
@app.route('/api/course/<course_id>/students', methods=['GET'])
def get_course_students(course_id):
    courses_ref = db.reference('Courses')
    students_ref = db.reference('Students')
    users_ref = db.reference('Users')
    marks_ref = db.reference('ClassMarks')  # New marks node

    course = courses_ref.child(course_id).get()
    if not course:
        return jsonify({'students': [], 'course': None})

    grade = course.get('grade')
    section = course.get('section')

    all_students = students_ref.get() or {}
    course_students = []

    for student_id, student in all_students.items():
        if student.get('grade') == grade and student.get('section') == section:
            user_data = users_ref.child(student.get('userId')).get()
            if user_data:
                # Fetch marks from ClassMarks node
                student_marks = marks_ref.child(course_id).child(student_id).get() or {}
                course_students.append({
                    'studentId': student_id,  # include studentId
                    'name': user_data.get('name'),
                    'username': user_data.get('username'),
                    'marks': {
                        'mark20': student_marks.get('mark20', 0),
                        'mark30': student_marks.get('mark30', 0),
                        'mark50': student_marks.get('mark50', 0),
                        'mark100': student_marks.get('mark100', 0)
                    }
                })

    return jsonify({
        'students': course_students,
        'course': {
            'subject': course.get('subject'),
            'grade': grade,
            'section': section
        }
    })


# ===================== UPDATE STUDENT MARKS =====================
@app.route('/api/course/<course_id>/update-marks', methods=['POST'])
def update_course_marks(course_id):
    data = request.json
    updates = data.get('updates', [])

    marks_ref = db.reference('ClassMarks')  # Use the new node

    for update in updates:
        student_id = update.get('studentId')  # ✅ use studentId from JS
        marks = update.get('marks', {})

        # Save marks for this student under the course
        marks_ref.child(course_id).child(student_id).set({
            'mark20': marks.get('mark20', 0),
            'mark30': marks.get('mark30', 0),
            'mark50': marks.get('mark50', 0)
            
        })

    return jsonify({'success': True, 'message': 'Marks updated successfully!'})





@app.route("/api/get_posts", methods=["GET"])
def get_posts():
    try:
        posts_ref = db.reference("Posts")
        admins_ref = db.reference("School_Admins")

        all_posts = posts_ref.get() or {}
        result = []

        for post_id, post in all_posts.items():
            admin_id = post.get("adminId")
            admin = admins_ref.child(admin_id).get() or {}

            admin_name = admin.get("name", "Admin")
            admin_profile = admin.get("profileImage", "/default-profile.png")

            result.append({
                "postId": post_id,
                "adminId": admin_id,
                "adminName": admin_name,
                "adminProfile": admin_profile,
                "message": post.get("message", ""),
                "postUrl": post.get("postUrl"),
                "timestamp": post.get("time", ""),  # use 'time' from your DB
                "likeCount": post.get("likeCount", 0),
                "likes": post.get("likes", {})
            })

        # Sort posts by timestamp descending
        result.sort(key=lambda x: x["timestamp"], reverse=True)

        return jsonify(result)

    except Exception as e:
        print("Get posts error:", e)
        return jsonify([]), 500



@app.route("/api/teacher/<teacher_id>", methods=["GET"])
def get_teacher(teacher_id):
    try:
        users_ref = db.reference("Users")
        teacher_user = users_ref.child(teacher_id).get()
        if not teacher_user or teacher_user.get("role") != "teacher":
            return jsonify({"success": False, "message": "Teacher not found"})

        return jsonify({
            "success": True,
            "teacher": {
                "teacherId": teacher_id,
                "name": teacher_user.get("name"),
                "username": teacher_user.get("username"),
                "profileImage": teacher_user.get("profileImage", "/default-profile.png")
            }
        })
    except Exception as e:
        print("Get teacher error:", e)
        return jsonify({"success": False, "message": "Server error"}), 500
    




    


# ===================== RUN APP =====================
if __name__ == '__main__':
    app.run(debug=True)
