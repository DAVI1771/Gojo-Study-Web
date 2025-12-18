document.getElementById('studentForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", document.getElementById("username").value);
    formData.append("name", document.getElementById("name").value);
    formData.append("password", document.getElementById("password").value);
    formData.append("grade", document.getElementById("grade").value);
    formData.append("section", document.getElementById("section").value);
    formData.append("profile", document.getElementById("profileImage").files[0]);

    try {
        const res = await fetch("/register/student", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        alert(data.message);

        if (data.success) {
            document.getElementById("studentForm").reset();
        }
    } catch (err) {
        console.error(err);
    }
});
