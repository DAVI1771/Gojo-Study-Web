import json
from flask import Flask, render_template, request, jsonify
import firebase_admin
from firebase_admin import credentials, db

app = Flask(__name__)

# Initialize Firebase Admin
cred = credentials.Certificate('ethiostore-17d9f-firebase-adminsdk-5e87k-aca424fa71.json')  # Make sure the path is correct
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://ethiostore-17d9f-default-rtdb.firebaseio.com/'  # Replace with your DB URL
})

# ===================== HOME PAGE =====================
@app.route('/')
def home():
    return render_template('teacher_register.html')


# ===================== STUDENT REGISTRATION =====================
@app.route('/register/student', methods=['POST'])
def register_student():
    data = request.json

    users_ref = db.reference('Users')
    students_ref = db.reference('Students')

    # Check if username exists in Users
    all_users = users_ref.get() or {}
    for user in all_users.values():
        if user.get('username') == data['username']:
            return jsonify({'success': False, 'message': 'Username already exists!'})

    # Create user in Users
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
    data = request.json

    users_ref = db.reference('Users')
    teachers_ref = db.reference('Teachers')

    # Check if username exists in Users
    all_users = users_ref.get() or {}
    for user in all_users.values():
        if user.get('username') == data['username']:
            return jsonify({'success': False, 'message': 'Username already exists!'})

    # Create user in Users
    new_user_ref = users_ref.push()
    new_user_ref.set({
        'userId': new_user_ref.key,
        'username': data['username'],
        'name': data['name'],
        'password': data['password'],
        'role': 'teacher',
        'isActive': True
    })

    # Create teacher entry
    new_teacher_ref = teachers_ref.push()
    new_teacher_ref.set({
        'userId': new_user_ref.key,
        'department': data.get('department', ''),
        'grade': data['grade'],
        'section': data['section'],
        'subject': data['subject'],
        'status': 'active'
    })

    return jsonify({'success': True, 'message': 'Teacher registered successfully!'})


# ===================== PARENT REGISTRATION =====================
@app.route('/register/parent', methods=['POST'])
def register_parent():
    data = request.json

    users_ref = db.reference('Users')
    parents_ref = db.reference('Parents')

    # Check if username exists in Users
    all_users = users_ref.get() or {}
    for user in all_users.values():
        if user.get('username') == data['username']:
            return jsonify({'success': False, 'message': 'Username already exists!'})

    # Create user in Users
    new_user_ref = users_ref.push()
    new_user_ref.set({
        'userId': new_user_ref.key,
        'username': data['username'],
        'name': data['name'],
        'password': data['password'],
        'role': 'parent',
        'isActive': True
    })

    # Create parent entry
    children_ids = [x.strip() for x in data['children'].split(',')]
    new_parent_ref = parents_ref.push()
    new_parent_ref.set({
        'userId': new_user_ref.key,
        'children': {child: True for child in children_ids}
    })

    return jsonify({'success': True, 'message': 'Parent registered successfully!'})


# ===================== RUN APP =====================
if __name__ == '__main__':
    app.run(debug=True)
