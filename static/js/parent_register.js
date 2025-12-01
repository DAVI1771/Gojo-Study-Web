document.getElementById('parentForm').addEventListener('submit', function(e){
    e.preventDefault();

    const data = {
        username: document.getElementById('username').value,
        name: document.getElementById('name').value,
        password: document.getElementById('password').value,
        children: document.getElementById('children').value // comma-separated student IDs
    };

    fetch('/register/parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message);
        if(res.success){
            document.getElementById('parentForm').reset();
        }
    })
    .catch(err => console.error(err));
});
