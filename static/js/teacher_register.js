document.getElementById('teacherForm').addEventListener('submit', function(e){
    e.preventDefault();

    const data = {
        username: document.getElementById('username').value,
        name: document.getElementById('name').value,
        password: document.getElementById('password').value,
        department: document.getElementById('department').value
    };

    fetch('/register/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message);
        if(res.success){
            document.getElementById('teacherForm').reset();
        }
    })
    .catch(err => console.error(err));
});
