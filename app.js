
const $ = id => document.getElementById(id);

function showSection(id) {
    [
        "loginSection",
        "registerSection",
        "studentDashboard",
        "adminDashboard"
    ].forEach(section => {
        const element = $(section);
        if (element) element.classList.add("hidden");
    });

    const selected = $(id);
    if (selected) selected.classList.remove("hidden");
}

function message(text) {
    $("message").textContent = text;
}

async function request(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Request failed");
    }

    return data;
}

function makeCell(row, value) {
    const cell = document.createElement("td");
    cell.textContent = value ?? "";
    row.appendChild(cell);
}

function dateText(value) {
    if (!value) return "";
    return new Date(value).toLocaleDateString();
}

// Show registration form
$("showRegister").onclick = event => {
    event.preventDefault();
    message("");
    showSection("registerSection");
};

// Show login form
$("showLogin").onclick = event => {
    event.preventDefault();
    message("");
    showSection("loginSection");
};

// Register student
$("registerForm").onsubmit = async event => {
    event.preventDefault();

    try {
        const result = await request("/api/register", {
            method: "POST",
            body: JSON.stringify({
                username: $("username").value.trim(),
                email: $("email").value.trim(),
                password: $("password").value,
                rollNumber: $("rollNumber").value.trim()
            })
        });

        $("registerForm").reset();
        showSection("loginSection");
        message(result.message || "Registration successful");
    } catch (error) {
        message(error.message);
    }
};

// Login student or admin
$("loginForm").onsubmit = async event => {
    event.preventDefault();

    try {
        const result = await request("/api/login", {
            method: "POST",
            body: JSON.stringify({
                email: $("loginEmail").value.trim(),
                password: $("loginPassword").value
            })
        });

        const user = result.user || result;

        if (!user._id) {
            throw new Error("User ID missing in login response");
        }

        sessionStorage.setItem("userId", user._id);
        sessionStorage.setItem("userRole", user.role || "student");

        $("loginForm").reset();
        message("");

        if (user.role === "admin") {
            showSection("adminDashboard");
            await loadAdmin();
        } else {
            showSection("studentDashboard");
            await loadStudent();
        }
    } catch (error) {
        message(error.message);
    }
};

// Load student dashboard
async function loadStudent() {
    const id = sessionStorage.getItem("userId");

    try {
        const user = await request("/api/leave-balance/" + id);

        $("casualBalance").textContent = user.casualLeave ?? 0;
        $("medicalBalance").textContent = user.medicalLeave ?? 0;

        const data = await request("/api/my-leaves/" + id);
        const leaves = Array.isArray(data) ? data : data.leaves || [];

        $("leaveHistory").innerHTML = "";

        leaves.forEach(leave => {
            const row = document.createElement("tr");

            [
                leave.leaveType,
                dateText(leave.startDate),
                dateText(leave.endDate),
                leave.days,
                leave.reason,
                leave.status
            ].forEach(value => makeCell(row, value));

            $("leaveHistory").appendChild(row);
        });
    } catch (error) {
        message(error.message);
    }
}

// Apply leave
$("leaveForm").onsubmit = async event => {
    event.preventDefault();

    const startDate = $("startDate").value;
    const endDate = $("endDate").value;

    if (endDate < startDate) {
        message("End date cannot be before start date");
        return;
    }

    try {
        const result = await request("/api/apply-leave", {
            method: "POST",
            body: JSON.stringify({
                studentId: sessionStorage.getItem("userId"),
                leaveType: $("leaveType").value,
                startDate,
                endDate,
                reason: $("reason").value.trim()
            })
        });

        $("leaveForm").reset();
        message(result.message || "Leave request submitted");
        await loadStudent();
    } catch (error) {
        message(error.message);
    }
};

// Load admin dashboard
async function loadAdmin() {
    try {
        const stats = await request("/api/admin/dashboard");

        $("totalStudents").textContent = stats.totalStudents ?? 0;
        $("pendingLeaves").textContent = stats.pendingLeaves ?? 0;
        $("approvedLeaves").textContent = stats.approvedLeaves ?? 0;
        $("rejectedLeaves").textContent = stats.rejectedLeaves ?? 0;

        const studentData = await request("/api/admin/students");
        const students = Array.isArray(studentData)
            ? studentData
            : studentData.students || [];

        $("studentList").innerHTML = "";

        students.forEach(student => {
            const row = document.createElement("tr");
            makeCell(row, student.username);
            makeCell(row, student.email);
            makeCell(row, student.rollNumber);
            $("studentList").appendChild(row);
        });

        const leaveData = await request("/api/admin/leaves");
        const leaves = Array.isArray(leaveData)
            ? leaveData
            : leaveData.leaves || [];

        $("adminLeaveList").innerHTML = "";

        leaves.forEach(leave => {
            const row = document.createElement("tr");
            const student = leave.studentId || {};

            makeCell(row, student.username);
            makeCell(row, leave.leaveType);
            makeCell(
                row,
                dateText(leave.startDate) + " - " +
                dateText(leave.endDate)
            );
            makeCell(row, leave.days);
            makeCell(row, leave.reason);
            makeCell(row, leave.status);

            const action = document.createElement("td");

            if (leave.status === "Pending") {
                ["Approved", "Rejected"].forEach(status => {
                    const button = document.createElement("button");
                    button.textContent = status;
                    button.style.marginRight = "5px";
                    button.onclick = () => updateLeave(leave._id, status);
                    action.appendChild(button);
                });
            } else {
                action.textContent = leave.status;
            }

            row.appendChild(action);
            $("adminLeaveList").appendChild(row);
        });
    } catch (error) {
        message("Admin dashboard error: " + error.message);
    }
}

// Approve or reject leave
async function updateLeave(id, status) {
    try {
        const result = await request("/api/admin/leave/" + id, {
            method: "PUT",
            body: JSON.stringify({ status })
        });

        message(result.message || "Leave status updated");
        await loadAdmin();
    } catch (error) {
        message(error.message);
    }
}

// Logout
function logout() {
    sessionStorage.removeItem("userId");
    sessionStorage.removeItem("userRole");
    $("loginForm").reset();
    message("");
    showSection("loginSection");
}
