let currentPage = 'dashboard';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth('admin');
  if (!user) return;

  document.getElementById('userName').textContent = user.full_name;

  loadDashboard();

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = e.target.dataset.page;
      switchPage(page);
    });
  });
});

function switchPage(page) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-page="${page}"]`).classList.add('active');

  currentPage = page;

  const titles = {
    dashboard: 'Dashboard',
    users: 'Manage Users',
    students: 'Students',
    teachers: 'Teachers',
    courses: 'Courses',
    reports: 'Reports',
    notifications: 'Notifications'
  };

  document.getElementById('pageTitle').textContent = titles[page];

  switch (page) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'users':
      loadUsers();
      break;
    case 'students':
      loadStudents();
      break;
    case 'teachers':
      loadTeachers();
      break;
    case 'courses':
      loadCourses();
      break;
    case 'reports':
      loadReports();
      break;
    case 'notifications':
      loadNotifications();
      break;
  }
}

async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    document.getElementById('totalStudents').textContent = data.totalStudents;
    document.getElementById('totalTeachers').textContent = data.totalTeachers;
    document.getElementById('totalCourses').textContent = data.totalCourses;
    document.getElementById('todayAttendance').textContent = data.todayAttendance;

    document.getElementById('pageContent').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Students</h3>
          <p class="stat-number">${data.totalStudents}</p>
        </div>
        <div class="stat-card">
          <h3>Total Teachers</h3>
          <p class="stat-number">${data.totalTeachers}</p>
        </div>
        <div class="stat-card">
          <h3>Total Courses</h3>
          <p class="stat-number">${data.totalCourses}</p>
        </div>
        <div class="stat-card">
          <h3>Today's Attendance</h3>
          <p class="stat-number">${data.todayAttendance}</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Dashboard error:', error);
  }
}

async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const usersHtml = data.users.map(user => `
      <tr>
        <td>${user.full_name}</td>
        <td>${user.email}</td>
        <td><span class="badge badge-info">${user.role}</span></td>
        <td><span class="badge ${user.status === 'active' ? 'badge-success' : 'badge-danger'}">${user.status}</span></td>
        <td>${formatDate(user.created_at)}</td>
        <td>
          <button class="btn btn-secondary" onclick="deleteUser('${user.id}')">Delete</button>
        </td>
      </tr>
    `).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>All Users</h2>
          <button class="btn" onclick="showAddUserModal()">Add User</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${usersHtml || '<tr><td colspan="6" class="empty-state">No users found</td></tr>'}
          </tbody>
        </table>
      </div>

      <div id="addUserModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Add New User</h2>
          </div>
          <form id="addUserForm">
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <input type="text" id="fullName" required>
            </div>
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" required>
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" required>
            </div>
            <div class="form-group">
              <label for="phone">Phone</label>
              <input type="tel" id="phone">
            </div>
            <div class="form-group">
              <label for="role">Role</label>
              <select id="role" required>
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="closeModal('addUserModal')">Cancel</button>
              <button type="submit" class="btn">Add User</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('addUserForm').addEventListener('submit', addUser);
  } catch (error) {
    console.error('Load users error:', error);
  }
}

function showAddUserModal() {
  document.getElementById('addUserModal').classList.add('show');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

async function addUser(e) {
  e.preventDefault();

  const userData = {
    full_name: document.getElementById('fullName').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    phone: document.getElementById('phone').value,
    role: document.getElementById('role').value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    closeModal('addUserModal');
    loadUsers();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    loadUsers();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function loadStudents() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/students`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const studentsHtml = data.students.map(student => `
      <tr>
        <td>${student.roll_number}</td>
        <td>${student.users?.full_name || 'N/A'}</td>
        <td>${student.users?.email || 'N/A'}</td>
        <td>${student.class_section || 'N/A'}</td>
        <td>${student.date_of_birth ? formatDate(student.date_of_birth) : 'N/A'}</td>
        <td>${student.guardian_name || 'N/A'}</td>
      </tr>
    `).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>All Students</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Name</th>
              <th>Email</th>
              <th>Class</th>
              <th>DOB</th>
              <th>Guardian</th>
            </tr>
          </thead>
          <tbody>
            ${studentsHtml || '<tr><td colspan="6" class="empty-state">No students found</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Load students error:', error);
  }
}

async function loadTeachers() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/teachers`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const teachersHtml = data.teachers.map(teacher => `
      <tr>
        <td>${teacher.employee_id}</td>
        <td>${teacher.users?.full_name || 'N/A'}</td>
        <td>${teacher.users?.email || 'N/A'}</td>
        <td>${teacher.department || 'N/A'}</td>
        <td>${teacher.specialization || 'N/A'}</td>
        <td>${teacher.experience_years || 0} years</td>
      </tr>
    `).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>All Teachers</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Specialization</th>
              <th>Experience</th>
            </tr>
          </thead>
          <tbody>
            ${teachersHtml || '<tr><td colspan="6" class="empty-state">No teachers found</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Load teachers error:', error);
  }
}

async function loadCourses() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/courses`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const coursesHtml = data.courses.map(course => `
      <tr>
        <td>${course.course_code}</td>
        <td>${course.course_name}</td>
        <td>${course.class_section || 'N/A'}</td>
        <td>${course.credits}</td>
        <td>${course.teachers?.users?.full_name || 'Unassigned'}</td>
      </tr>
    `).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>All Courses</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Class</th>
              <th>Credits</th>
              <th>Teacher</th>
            </tr>
          </thead>
          <tbody>
            ${coursesHtml || '<tr><td colspan="5" class="empty-state">No courses found</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Load courses error:', error);
  }
}

async function loadReports() {
  document.getElementById('pageContent').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card" style="cursor: pointer;" onclick="loadAttendanceReport()">
        <h3>Attendance Report</h3>
        <p style="font-size: 14px; margin-top: 12px;">View detailed attendance records</p>
      </div>
      <div class="stat-card" style="cursor: pointer;" onclick="loadMarksReport()">
        <h3>Marks Report</h3>
        <p style="font-size: 14px; margin-top: 12px;">View student marks and grades</p>
      </div>
    </div>
    <div id="reportContent"></div>
  `;
}

async function loadAttendanceReport() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reports/attendance`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const reportHtml = data.attendance.map(record => `
      <tr>
        <td>${record.students?.users?.full_name || 'N/A'}</td>
        <td>${record.students?.roll_number || 'N/A'}</td>
        <td>${record.courses?.course_name || 'N/A'}</td>
        <td>${formatDate(record.date)}</td>
        <td><span class="badge ${record.status === 'present' ? 'badge-success' : record.status === 'late' ? 'badge-warning' : 'badge-danger'}">${record.status}</span></td>
      </tr>
    `).join('');

    document.getElementById('reportContent').innerHTML = `
      <div class="table-container" style="margin-top: 24px;">
        <div class="table-header">
          <h2>Attendance Report</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Roll Number</th>
              <th>Course</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${reportHtml || '<tr><td colspan="5" class="empty-state">No attendance records found</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Load attendance report error:', error);
  }
}

async function loadMarksReport() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/reports/marks`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const reportHtml = data.marks.map(record => {
      const percentage = ((record.marks_obtained / record.total_marks) * 100).toFixed(2);
      return `
        <tr>
          <td>${record.students?.users?.full_name || 'N/A'}</td>
          <td>${record.students?.roll_number || 'N/A'}</td>
          <td>${record.courses?.course_name || 'N/A'}</td>
          <td>${record.exam_type}</td>
          <td>${record.marks_obtained}/${record.total_marks}</td>
          <td>${percentage}%</td>
          <td>${formatDate(record.exam_date)}</td>
        </tr>
      `;
    }).join('');

    document.getElementById('reportContent').innerHTML = `
      <div class="table-container" style="margin-top: 24px;">
        <div class="table-header">
          <h2>Marks Report</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Roll Number</th>
              <th>Course</th>
              <th>Exam Type</th>
              <th>Marks</th>
              <th>Percentage</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${reportHtml || '<tr><td colspan="7" class="empty-state">No marks records found</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Load marks report error:', error);
  }
}

async function loadNotifications() {
  document.getElementById('pageContent').innerHTML = `
    <div class="table-container">
      <div class="table-header">
        <h2>Send Notification</h2>
      </div>
      <div style="padding: 24px;">
        <form id="notificationForm">
          <div class="form-group">
            <label for="notifTitle">Title</label>
            <input type="text" id="notifTitle" required>
          </div>
          <div class="form-group">
            <label for="notifMessage">Message</label>
            <textarea id="notifMessage" required></textarea>
          </div>
          <div class="form-group">
            <label for="targetRole">Target Audience</label>
            <select id="targetRole" required>
              <option value="all">All Users</option>
              <option value="student">Students Only</option>
              <option value="teacher">Teachers Only</option>
              <option value="admin">Admins Only</option>
            </select>
          </div>
          <div class="form-group">
            <label for="priority">Priority</label>
            <select id="priority" required>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button type="submit" class="btn">Send Notification</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('notificationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const notifData = {
      title: document.getElementById('notifTitle').value,
      message: document.getElementById('notifMessage').value,
      target_role: document.getElementById('targetRole').value,
      priority: document.getElementById('priority').value,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(notifData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      alert('Notification sent successfully!');
      document.getElementById('notificationForm').reset();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  });
}
