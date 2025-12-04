document.addEventListener('DOMContentLoaded', async function() {
    const teacherId = localStorage.getItem('teacherId');

    if (!teacherId) {
        window.location.href = '/';
        return;
    }

    const container = document.getElementById('coursesContainer');

    try {
        // Fetch teacher's courses
        const res = await fetch(`/api/teacher/${teacherId}/courses`);
        const data = await res.json();

        if (!data.courses || data.courses.length === 0) {
            container.textContent = 'No courses assigned yet.';
            return;
        }

        for (const course of data.courses) {
            const courseDiv = document.createElement('div');
            courseDiv.classList.add('course-section');

            const header = document.createElement('h4');
            header.textContent = `${course.subject} - Grade ${course.grade} Section ${course.section}`;
            courseDiv.appendChild(header);

            const table = document.createElement('table');
            table.classList.add('course-table');

            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th>#</th>
                    <th>Student Name</th>
                    <th>Username</th>
                    <th>20%</th>
                    <th>30%</th>
                    <th>50%</th>
                    <th>100%</th>
                    <th>Total</th>
                </tr>
            `;
            table.appendChild(thead);

            const tbody = document.createElement('tbody');

            const courseId = `course_${course.subject.toLowerCase()}_${course.grade}${course.section.toUpperCase()}`;
            const studentRes = await fetch(`/api/course/${courseId}/students`);
            const studentData = await studentRes.json();

            if (studentData.students.length > 0) {
                studentData.students.forEach((s, index) => {
                    const tr = document.createElement('tr');

                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${s.name}</td>
                        <td>${s.username}</td>
                        <td><input type="number" class="mark mark-20" value="${s.marks?.mark20 || 0}" min="0" max="20"></td>
                        <td><input type="number" class="mark mark-30" value="${s.marks?.mark30 || 0}" min="0" max="30"></td>
                        <td><input type="number" class="mark mark-50" value="${s.marks?.mark50 || 0}" min="0" max="50"></td>
                        <td><input type="number" class="mark mark-100" value="${s.marks?.mark100 || 0}" min="0" max="100"></td>
                        <td class="total">${calculateTotal(s.marks)}</td>
                    `;

                    tr.querySelectorAll('.mark').forEach(input => {
                        input.addEventListener('input', () => {
                            tr.querySelector('.total').textContent = calculateTotal({
                                mark20: tr.querySelector('.mark-20').value,
                                mark30: tr.querySelector('.mark-30').value,
                                mark50: tr.querySelector('.mark-50').value,
                                mark100: tr.querySelector('.mark-100').value
                            });
                        });
                    });

                    tbody.appendChild(tr);
                });
            } else {
                const tr = document.createElement('tr');
                tr.innerHTML = `<td colspan="8">No students found for this course.</td>`;
                tbody.appendChild(tr);
            }

            table.appendChild(tbody);
            courseDiv.appendChild(table);

            // Add Save button
            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Save Marks';
            saveBtn.addEventListener('click', async () => {
                const rows = tbody.querySelectorAll('tr');
                const updates = [];

                rows.forEach(row => {
                    const username = row.children[2].textContent;
                    const marks = {
                        mark20: parseFloat(row.querySelector('.mark-20').value) || 0,
                        mark30: parseFloat(row.querySelector('.mark-30').value) || 0,
                        mark50: parseFloat(row.querySelector('.mark-50').value) || 0,
                        mark100: parseFloat(row.querySelector('.mark-100').value) || 0
                    };
                    updates.push({ username, marks });
                });

                try {
                    const res = await fetch(`/api/course/${courseId}/update-marks`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ updates })
                    });

                    const result = await res.json();
                    if (result.success) {
                        alert('Marks saved successfully!');
                    } else {
                        alert('Failed to save marks: ' + result.message);
                    }
                } catch (err) {
                    console.error(err);
                    alert('Error saving marks.');
                }
            });

            courseDiv.appendChild(saveBtn);
            container.appendChild(courseDiv);
        }

    } catch (err) {
        console.error('Error loading courses or students:', err);
        container.textContent = 'Failed to load courses or students.';
    }

    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('teacherId');
        window.location.href = '/';
    });
});

// Calculate total function
function calculateTotal(marks) {
    const m20 = parseFloat(marks?.mark20 || 0);
    const m30 = parseFloat(marks?.mark30 || 0);
    const m50 = parseFloat(marks?.mark50 || 0);
    const m100 = parseFloat(marks?.mark100 || 0);
    return m20 + m30 + m50 + m100;
}
