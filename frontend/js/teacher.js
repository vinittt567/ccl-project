let currentPage = 'dashboard';
let teacherId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth('teacher');
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
    courses: 'My Courses',
    attendance: 'Attendance',
    assignments: 'Assignments',
    marks: 'Marks',
    notifications: 'Notifications'
  };

  document.getElementById('pageTitle').textContent = titles[page];

  switch (page) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'courses':
      loadCourses();
      break;
    case 'attendance':
      loadAttendance();
      break;
    case 'assignments':
      loadAssignments();
      break;
    case 'marks':
      loadMarks();
      break;
    case 'notifications':
      loadNotifications();
      break;
  }
}

async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE_URL}/teacher/dashboard`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();
    teacherId = data.teacherId;

    document.getElementById('pageContent').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>My Courses</h3>
          <p class="stat-number">${data.myCourses}</p>
        </div>
        <div class="stat-card">
          <h3>Today's Classes</h3>
          <p class="stat-number">${data.todayClasses}</p>
        </div>
        <div class="stat-card">
          <h3>Pending Assignments</h3>
          <p class="stat-number">${data.pendingAssignments}</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Dashboard error:', error);
  }
}

async function loadCourses() {
  try {
    const response = await fetch(`${API_BASE_URL}/teacher/courses`, {
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
        <td>
          <button class="btn" onclick="viewCourseStudents('${course.id}', '${course.course_name}')">View Students</button>
        </td>
      </tr>
    `).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>My Courses</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Course Name</th>
              <th>Class</th>
              <th>Credits</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${coursesHtml || '<tr><td colspan="5" class="empty-state">No courses assigned</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Load courses error:', error);
  }
}

async function viewCourseStudents(courseId, courseName) {
  try {
    const response = await fetch(`${API_BASE_URL}/teacher/students/${courseId}`, {
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
      </tr>
    `).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>${courseName} - Students</h2>
          <button class="btn btn-secondary" onclick="loadCourses()">Back to Courses</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Name</th>
              <th>Email</th>
              <th>Class</th>
            </tr>
          </thead>
          <tbody>
            ${studentsHtml || '<tr><td colspan="4" class="empty-state">No students found</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('View students error:', error);
  }
}

async function loadAttendance() {
  try {
    const coursesResponse = await fetch(`${API_BASE_URL}/teacher/courses`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const coursesData = await coursesResponse.json();

    const courseOptions = coursesData.courses.map(course =>
      `<option value="${course.id}">${course.course_code} - ${course.course_name}</option>`
    ).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>Mark Attendance</h2>
          <button class="btn" onclick="showMarkAttendanceModal()">Mark Attendance</button>
        </div>
        <div style="padding: 24px;">
          <div class="form-group">
            <label for="selectCourse">Select Course to View Attendance</label>
            <select id="selectCourse" onchange="viewAttendance(this.value)">
              <option value="">-- Select Course --</option>
              ${courseOptions}
            </select>
          </div>
          <div id="attendanceList"></div>
        </div>
      </div>

      <div id="markAttendanceModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Mark Attendance</h2>
          </div>
          <form id="markAttendanceForm">
            <div class="form-group">
              <label for="attendanceCourse">Course</label>
              <select id="attendanceCourse" required onchange="loadStudentsForAttendance(this.value)">
                <option value="">-- Select Course --</option>
                ${courseOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="attendanceDate">Date</label>
              <input type="date" id="attendanceDate" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div id="studentsList"></div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="closeModal('markAttendanceModal')">Cancel</button>
              <button type="submit" class="btn">Submit Attendance</button>
            </div>
          </form>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Load attendance error:', error);
  }
}

function showMarkAttendanceModal() {
  document.getElementById('markAttendanceModal').classList.add('show');
}

async function loadStudentsForAttendance(courseId) {
  if (!courseId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/teacher/students/${courseId}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const studentsHtml = data.students.map(student => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border: 1px solid #e0e0e0; border-radius: 8px; margin-bottom: 8px;">
        <div>
          <strong>${student.roll_number}</strong> - ${student.users?.full_name || 'N/A'}
        </div>
        <div>
          <label style="margin-right: 16px;">
            <input type="radio" name="attendance_${student.id}" value="present" required> Present
          </label>
          <label style="margin-right: 16px;">
            <input type="radio" name="attendance_${student.id}" value="absent"> Absent
          </label>
          <label>
            <input type="radio" name="attendance_${student.id}" value="late"> Late
          </label>
        </div>
      </div>
    `).join('');

    document.getElementById('studentsList').innerHTML = `
      <div class="form-group">
        <label>Students</label>
        ${studentsHtml || '<p>No students found</p>'}
      </div>
    `;

    document.getElementById('markAttendanceForm').onsubmit = async (e) => {
      e.preventDefault();
      await submitAttendance(courseId, data.students);
    };
  } catch (error) {
    console.error('Load students error:', error);
  }
}

async function submitAttendance(courseId, students) {
  const date = document.getElementById('attendanceDate').value;

  try {
    for (const student of students) {
      const status = document.querySelector(`input[name="attendance_${student.id}"]:checked`)?.value;
      if (!status) continue;

      await fetch(`${API_BASE_URL}/teacher/attendance`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          student_id: student.id,
          course_id: courseId,
          date,
          status
        })
      });
    }

    closeModal('markAttendanceModal');
    alert('Attendance marked successfully!');
    loadAttendance();
  } catch (error) {
    alert('Error marking attendance: ' + error.message);
  }
}

async function viewAttendance(courseId) {
  if (!courseId) {
    document.getElementById('attendanceList').innerHTML = '';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/teacher/attendance/${courseId}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const attendanceHtml = data.attendance.map(record => `
      <tr>
        <td>${record.students?.roll_number || 'N/A'}</td>
        <td>${record.students?.users?.full_name || 'N/A'}</td>
        <td>${formatDate(record.date)}</td>
        <td><span class="badge ${record.status === 'present' ? 'badge-success' : record.status === 'late' ? 'badge-warning' : 'badge-danger'}">${record.status}</span></td>
      </tr>
    `).join('');

    document.getElementById('attendanceList').innerHTML = `
      <table style="margin-top: 24px;">
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Student Name</th>
            <th>Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${attendanceHtml || '<tr><td colspan="4" class="empty-state">No attendance records</td></tr>'}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('View attendance error:', error);
  }
}

async function loadAssignments() {
  try {
    const response = await fetch(`${API_BASE_URL}/teacher/assignments`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const assignmentsHtml = data.assignments.map(assignment => `
      <tr>
        <td>${assignment.title}</td>
        <td>${assignment.courses?.course_name || 'N/A'}</td>
        <td>${formatDateTime(assignment.due_date)}</td>
        <td>${assignment.total_marks}</td>
        <td>
          <button class="btn btn-secondary" onclick="viewSubmissions('${assignment.id}', '${assignment.title}')">View Submissions</button>
        </td>
      </tr>
    `).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>My Assignments</h2>
          <button class="btn" onclick="showCreateAssignmentModal()">Create Assignment</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Course</th>
              <th>Due Date</th>
              <th>Total Marks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${assignmentsHtml || '<tr><td colspan="5" class="empty-state">No assignments created</td></tr>'}
          </tbody>
        </table>
      </div>

      <div id="createAssignmentModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Create Assignment</h2>
          </div>
          <form id="createAssignmentForm">
            <div class="form-group">
              <label for="assignmentTitle">Title</label>
              <input type="text" id="assignmentTitle" required>
            </div>
            <div class="form-group">
              <label for="assignmentCourse">Course</label>
              <select id="assignmentCourse" required></select>
            </div>
            <div class="form-group">
              <label for="assignmentDescription">Description</label>
              <textarea id="assignmentDescription" required></textarea>
            </div>
            <div class="form-group">
              <label for="assignmentDueDate">Due Date</label>
              <input type="datetime-local" id="assignmentDueDate" required>
            </div>
            <div class="form-group">
              <label for="assignmentMarks">Total Marks</label>
              <input type="number" id="assignmentMarks" required value="100">
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="closeModal('createAssignmentModal')">Cancel</button>
              <button type="submit" class="btn">Create Assignment</button>
            </div>
          </form>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Load assignments error:', error);
  }
}

async function showCreateAssignmentModal() {
  try {
    const response = await fetch(`${API_BASE_URL}/teacher/courses`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const courseOptions = data.courses.map(course =>
      `<option value="${course.id}">${course.course_code} - ${course.course_name}</option>`
    ).join('');

    document.getElementById('assignmentCourse').innerHTML = courseOptions;
    document.getElementById('createAssignmentModal').classList.add('show');

    document.getElementById('createAssignmentForm').onsubmit = async (e) => {
      e.preventDefault();

      const assignmentData = {
        title: document.getElementById('assignmentTitle').value,
        course_id: document.getElementById('assignmentCourse').value,
        description: document.getElementById('assignmentDescription').value,
        due_date: new Date(document.getElementById('assignmentDueDate').value).toISOString(),
        total_marks: parseInt(document.getElementById('assignmentMarks').value)
      };

      try {
        const response = await fetch(`${API_BASE_URL}/teacher/assignments`, {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(assignmentData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }

        closeModal('createAssignmentModal');
        loadAssignments();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    };
  } catch (error) {
    console.error('Show create assignment modal error:', error);
  }
}

async function viewSubmissions(assignmentId, assignmentTitle) {
  try {
    const response = await fetch(`${API_BASE_URL}/teacher/submissions/${assignmentId}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const submissionsHtml = data.submissions.map(submission => `
      <tr>
        <td>${submission.students?.roll_number || 'N/A'}</td>
        <td>${submission.students?.users?.full_name || 'N/A'}</td>
        <td>${formatDateTime(submission.submitted_at)}</td>
        <td>${submission.marks_obtained !== null ? submission.marks_obtained : 'Not Graded'}</td>
        <td>
          <button class="btn btn-secondary" onclick="gradeSubmission('${submission.id}', '${assignmentId}')">Grade</button>
        </td>
      </tr>
    `).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>${assignmentTitle} - Submissions</h2>
          <button class="btn btn-secondary" onclick="loadAssignments()">Back to Assignments</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Roll Number</th>
              <th>Student Name</th>
              <th>Submitted At</th>
              <th>Marks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${submissionsHtml || '<tr><td colspan="5" class="empty-state">No submissions yet</td></tr>'}
          </tbody>
        </table>
      </div>

      <div id="gradeModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Grade Submission</h2>
          </div>
          <form id="gradeForm">
            <div class="form-group">
              <label for="marksObtained">Marks Obtained</label>
              <input type="number" id="marksObtained" required min="0">
            </div>
            <div class="form-group">
              <label for="feedback">Feedback</label>
              <textarea id="feedback"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="closeModal('gradeModal')">Cancel</button>
              <button type="submit" class="btn">Submit Grade</button>
            </div>
          </form>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('View submissions error:', error);
  }
}

function gradeSubmission(submissionId, assignmentId) {
  document.getElementById('gradeModal').classList.add('show');

  document.getElementById('gradeForm').onsubmit = async (e) => {
    e.preventDefault();

    const gradeData = {
      marks_obtained: parseInt(document.getElementById('marksObtained').value),
      feedback: document.getElementById('feedback').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/teacher/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(gradeData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      closeModal('gradeModal');
      viewSubmissions(assignmentId, 'Assignment');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
}

async function loadMarks() {
  try {
    const coursesResponse = await fetch(`${API_BASE_URL}/teacher/courses`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const coursesData = await coursesResponse.json();

    const courseOptions = coursesData.courses.map(course =>
      `<option value="${course.id}">${course.course_code} - ${course.course_name}</option>`
    ).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>Enter Marks</h2>
          <button class="btn" onclick="showEnterMarksModal()">Enter Marks</button>
        </div>
        <div style="padding: 24px;">
          <div class="form-group">
            <label for="selectMarksCourse">Select Course to View Marks</label>
            <select id="selectMarksCourse" onchange="viewMarks(this.value)">
              <option value="">-- Select Course --</option>
              ${courseOptions}
            </select>
          </div>
          <div id="marksList"></div>
        </div>
      </div>

      <div id="enterMarksModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Enter Marks</h2>
          </div>
          <form id="enterMarksForm">
            <div class="form-group">
              <label for="marksCourse">Course</label>
              <select id="marksCourse" required onchange="loadStudentsForMarks(this.value)">
                <option value="">-- Select Course --</option>
                ${courseOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="marksStudent">Student</label>
              <select id="marksStudent" required>
                <option value="">-- Select Student --</option>
              </select>
            </div>
            <div class="form-group">
              <label for="examType">Exam Type</label>
              <select id="examType" required>
                <option value="quiz">Quiz</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="practical">Practical</option>
              </select>
            </div>
            <div class="form-group">
              <label for="marksObtainedExam">Marks Obtained</label>
              <input type="number" id="marksObtainedExam" required min="0">
            </div>
            <div class="form-group">
              <label for="totalMarksExam">Total Marks</label>
              <input type="number" id="totalMarksExam" required value="100">
            </div>
            <div class="form-group">
              <label for="examDate">Exam Date</label>
              <input type="date" id="examDate" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label for="marksRemarks">Remarks</label>
              <textarea id="marksRemarks"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="closeModal('enterMarksModal')">Cancel</button>
              <button type="submit" class="btn">Submit Marks</button>
            </div>
          </form>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Load marks error:', error);
  }
}

function showEnterMarksModal() {
  document.getElementById('enterMarksModal').classList.add('show');

  document.getElementById('enterMarksForm').onsubmit = async (e) => {
    e.preventDefault();

    const marksData = {
      student_id: document.getElementById('marksStudent').value,
      course_id: document.getElementById('marksCourse').value,
      exam_type: document.getElementById('examType').value,
      marks_obtained: parseInt(document.getElementById('marksObtainedExam').value),
      total_marks: parseInt(document.getElementById('totalMarksExam').value),
      exam_date: document.getElementById('examDate').value,
      remarks: document.getElementById('marksRemarks').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/teacher/marks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(marksData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      closeModal('enterMarksModal');
      alert('Marks entered successfully!');
      loadMarks();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
}

async function loadStudentsForMarks(courseId) {
  if (!courseId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/teacher/students/${courseId}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const studentOptions = data.students.map(student =>
      `<option value="${student.id}">${student.roll_number} - ${student.users?.full_name || 'N/A'}</option>`
    ).join('');

    document.getElementById('marksStudent').innerHTML = '<option value="">-- Select Student --</option>' + studentOptions;
  } catch (error) {
    console.error('Load students error:', error);
  }
}

async function viewMarks(courseId) {
  if (!courseId) {
    document.getElementById('marksList').innerHTML = '';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/teacher/marks/${courseId}`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const marksHtml = data.marks.map(mark => {
      const percentage = ((mark.marks_obtained / mark.total_marks) * 100).toFixed(2);
      return `
        <tr>
          <td>${mark.students?.roll_number || 'N/A'}</td>
          <td>${mark.students?.users?.full_name || 'N/A'}</td>
          <td>${mark.exam_type}</td>
          <td>${mark.marks_obtained}/${mark.total_marks}</td>
          <td>${percentage}%</td>
          <td>${formatDate(mark.exam_date)}</td>
        </tr>
      `;
    }).join('');

    document.getElementById('marksList').innerHTML = `
      <table style="margin-top: 24px;">
        <thead>
          <tr>
            <th>Roll Number</th>
            <th>Student Name</th>
            <th>Exam Type</th>
            <th>Marks</th>
            <th>Percentage</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${marksHtml || '<tr><td colspan="6" class="empty-state">No marks entered</td></tr>'}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('View marks error:', error);
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
            <label for="priority">Priority</label>
            <select id="priority" required>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button type="submit" class="btn">Send to Students</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('notificationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const notifData = {
      title: document.getElementById('notifTitle').value,
      message: document.getElementById('notifMessage').value,
      target_role: 'student',
      priority: document.getElementById('priority').value,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
      const response = await fetch(`${API_BASE_URL}/teacher/notifications`, {
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

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}
