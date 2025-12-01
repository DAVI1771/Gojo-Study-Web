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

# Home page (for testing)
@app.route('/')
def home():
    return render_template('student_register.html')


# ===================== STUDENT REGISTRATION =====================
@app.route('/register/student', methods=['POST'])
def register_student():
    data = request.json
    student_ref = db.reference('Students')

    # Check if username exists
    all_students = student_ref.get() or {}
    for key, student in all_students.items():
        if student.get('username') == data['username']:
            return jsonify({'success': False, 'message': 'Username already exists!'})

    new_student_ref = student_ref.push()  # Auto-generated unique key
    new_student_ref.set({
        'userId': new_student_ref.key,
        'username': data['username'],
        'name': data['name'],
        'password': data['password'],
        'grade': data['grade'],
        'section': data['section'],
        'status': 'active',
        'academicYear': '2024_2025'
    })

    return jsonify({'success': True, 'message': 'Student registered successfully!'})



# ===================== TEACHER REGISTRATION =====================
@app.route('/register/teacher', methods=['POST'])
def register_teacher():
    data = request.json
    teacher_ref = db.reference('Teachers')

    # Check if username exists
    all_teachers = teacher_ref.get() or {}
    for teacher in all_teachers.values():
        if teacher.get('username') == data['username']:
            return jsonify({'success': False, 'message': 'Username already exists!'})

    new_teacher_ref = teacher_ref.push()
    new_teacher_ref.set({
        'userId': new_teacher_ref.key,
        'username': data['username'],
        'name': data['name'],
        'password': data['password'],
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
    parent_ref = db.reference('Parents')

    # Check if username exists
    all_parents = parent_ref.get() or {}
    for parent in all_parents.values():
        if parent.get('username') == data['username']:
            return jsonify({'success': False, 'message': 'Username already exists!'})

    children_ids = [x.strip() for x in data['children'].split(',')]

    new_parent_ref = parent_ref.push()
    new_parent_ref.set({
        'userId': new_parent_ref.key,
        'username': data['username'],
        'name': data['name'],
        'password': data['password'],
        'children': {child: True for child in children_ids}
    })

    return jsonify({'success': True, 'message': 'Parent registered successfully!'})

# ===================== RUN APP =====================
if __name__ == '__main__':
    app.run(debug=True)
