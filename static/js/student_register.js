document.getElementById('studentForm').addEventListener('submit', function(e){
    e.preventDefault();

    const data = {
        username: document.getElementById('username').value,
        name: document.getElementById('name').value,
        password: document.getElementById('password').value,
        grade: document.getElementById('grade').value,
        section: document.getElementById('section').value
    };

    fetch('/register/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message); // Shows success or username exists message
        if(res.success){
            document.getElementById('studentForm').reset();
        }
    })
    .catch(err => console.error(err));
});
