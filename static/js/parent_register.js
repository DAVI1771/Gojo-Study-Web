document.getElementById('parentForm').addEventListener('submit', function(e){
    e.preventDefault();

    const childrenStr = document.getElementById('children').value;
    const childrenArray = childrenStr.split(',').map(s => s.trim()); // convert to array

    const data = {
        username: document.getElementById('username').value,
        name: document.getElementById('name').value,
        password: document.getElementById('password').value,
        children: childrenArray
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
