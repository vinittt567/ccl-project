let currentPage = 'dashboard';
let studentId = null;

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth('student');
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
    profile: 'My Profile',
    attendance: 'Attendance',
    courses: 'My Courses',
    assignments: 'Assignments',
    marks: 'My Marks',
    notifications: 'Notifications',
    feedback: 'Feedback'
  };

  document.getElementById('pageTitle').textContent = titles[page];

  switch (page) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'profile':
      loadProfile();
      break;
    case 'attendance':
      loadAttendance();
      break;
    case 'courses':
      loadCourses();
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
    case 'feedback':
      loadFeedback();
      break;
  }
}

async function loadDashboard() {
  try {
    const response = await fetch(`${API_BASE_URL}/student/dashboard`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();
    studentId = data.studentId;

    const recentMarksHtml = data.recentMarks.map(mark => {
      const percentage = ((mark.marks_obtained / mark.total_marks) * 100).toFixed(2);
      return `
        <tr>
          <td>${mark.exam_type}</td>
          <td>${mark.marks_obtained}/${mark.total_marks}</td>
          <td>${percentage}%</td>
          <td>${formatDate(mark.exam_date)}</td>
        </tr>
      `;
    }).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Attendance</h3>
          <p class="stat-number">${data.attendancePercentage}%</p>
          <p style="font-size: 14px; color: #666; margin-top: 8px;">${data.presentClasses}/${data.totalClasses} classes</p>
        </div>
        <div class="stat-card">
          <h3>Total Classes</h3>
          <p class="stat-number">${data.totalClasses}</p>
        </div>
        <div class="stat-card">
          <h3>Pending Assignments</h3>
          <p class="stat-number">${data.pendingAssignments}</p>
        </div>
      </div>

      <div class="table-container" style="margin-top: 24px;">
        <div class="table-header">
          <h2>Recent Marks</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Exam Type</th>
              <th>Marks</th>
              <th>Percentage</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${recentMarksHtml || '<tr><td colspan="4" class="empty-state">No marks available</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Dashboard error:', error);
  }
}

async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/student/profile`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();
    const profile = data.profile;

    document.getElementById('pageContent').innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>Personal Information</h2>
        </div>
        <div style="padding: 24px;">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
            <div>
              <p style="font-size: 14px; color: #666; margin-bottom: 4px;">Full Name</p>
              <p style="font-size: 16px; font-weight: 500;">${profile.users?.full_name || 'N/A'}</p>
            </div>
            <div>
              <p style="font-size: 14px; color: #666; margin-bottom: 4px;">Email</p>
              <p style="font-size: 16px; font-weight: 500;">${profile.users?.email || 'N/A'}</p>
            </div>
            <div>
              <p style="font-size: 14px; color: #666; margin-bottom: 4px;">Roll Number</p>
              <p style="font-size: 16px; font-weight: 500;">${profile.roll_number || 'N/A'}</p>
            </div>
            <div>
              <p style="font-size: 14px; color: #666; margin-bottom: 4px;">Class/Section</p>
              <p style="font-size: 16px; font-weight: 500;">${profile.class_section || 'N/A'}</p>
            </div>
            <div>
              <p style="font-size: 14px; color: #666; margin-bottom: 4px;">Date of Birth</p>
              <p style="font-size: 16px; font-weight: 500;">${profile.date_of_birth ? formatDate(profile.date_of_birth) : 'N/A'}</p>
            </div>
            <div>
              <p style="font-size: 14px; color: #666; margin-bottom: 4px;">Gender</p>
              <p style="font-size: 16px; font-weight: 500;">${profile.gender || 'N/A'}</p>
            </div>
            <div>
              <p style="font-size: 14px; color: #666; margin-bottom: 4px;">Phone</p>
              <p style="font-size: 16px; font-weight: 500;">${profile.users?.phone || 'N/A'}</p>
            </div>
            <div>
              <p style="font-size: 14px; color: #666; margin-bottom: 4px;">Address</p>
              <p style="font-size: 16px; font-weight: 500;">${profile.address || 'N/A'}</p>
            </div>
            <div>
              <p style="font-size: 14px; color: #666; margin-bottom: 4px;">Guardian Name</p>
              <p style="font-size: 16px; font-weight: 500;">${profile.guardian_name || 'N/A'}</p>
            </div>
            <div>
              <p style="font-size: 14px; color: #666; margin-bottom: 4px;">Guardian Phone</p>
              <p style="font-size: 16px; font-weight: 500;">${profile.guardian_phone || 'N/A'}</p>
            </div>
          </div>
          <button class="btn" style="margin-top: 24px;" onclick="showEditProfileModal()">Edit Profile</button>
        </div>
      </div>

      <div id="editProfileModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Edit Profile</h2>
          </div>
          <form id="editProfileForm">
            <div class="form-group">
              <label for="address">Address</label>
              <textarea id="address">${profile.address || ''}</textarea>
            </div>
            <div class="form-group">
              <label for="guardianName">Guardian Name</label>
              <input type="text" id="guardianName" value="${profile.guardian_name || ''}">
            </div>
            <div class="form-group">
              <label for="guardianPhone">Guardian Phone</label>
              <input type="tel" id="guardianPhone" value="${profile.guardian_phone || ''}">
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="closeModal('editProfileModal')">Cancel</button>
              <button type="submit" class="btn">Update Profile</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const profileData = {
        address: document.getElementById('address').value,
        guardian_name: document.getElementById('guardianName').value,
        guardian_phone: document.getElementById('guardianPhone').value
      };

      try {
        const response = await fetch(`${API_BASE_URL}/student/profile`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(profileData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }

        closeModal('editProfileModal');
        alert('Profile updated successfully!');
        loadProfile();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
  } catch (error) {
    console.error('Load profile error:', error);
  }
}

function showEditProfileModal() {
  document.getElementById('editProfileModal').classList.add('show');
}

async function loadAttendance() {
  try {
    const response = await fetch(`${API_BASE_URL}/student/attendance`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const groupedByCourse = {};
    data.attendance.forEach(record => {
      const courseName = record.courses?.course_name || 'Unknown Course';
      if (!groupedByCourse[courseName]) {
        groupedByCourse[courseName] = {
          present: 0,
          absent: 0,
          late: 0,
          total: 0,
          records: []
        };
      }
      groupedByCourse[courseName].total++;
      groupedByCourse[courseName][record.status]++;
      groupedByCourse[courseName].records.push(record);
    });

    const summaryHtml = Object.keys(groupedByCourse).map(courseName => {
      const stats = groupedByCourse[courseName];
      const percentage = ((stats.present / stats.total) * 100).toFixed(2);
      return `
        <div class="stat-card">
          <h3>${courseName}</h3>
          <p class="stat-number">${percentage}%</p>
          <p style="font-size: 14px; color: #666; margin-top: 8px;">
            Present: ${stats.present} | Absent: ${stats.absent} | Late: ${stats.late}
          </p>
        </div>
      `;
    }).join('');

    const attendanceHtml = data.attendance.map(record => `
      <tr>
        <td>${record.courses?.course_name || 'N/A'}</td>
        <td>${formatDate(record.date)}</td>
        <td><span class="badge ${record.status === 'present' ? 'badge-success' : record.status === 'late' ? 'badge-warning' : 'badge-danger'}">${record.status}</span></td>
        <td>${record.remarks || '-'}</td>
      </tr>
    `).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="stats-grid">
        ${summaryHtml || '<div class="empty-state">No attendance records found</div>'}
      </div>

      <div class="table-container" style="margin-top: 24px;">
        <div class="table-header">
          <h2>Attendance Details</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Date</th>
              <th>Status</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${attendanceHtml || '<tr><td colspan="4" class="empty-state">No attendance records</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Load attendance error:', error);
  }
}

async function loadCourses() {
  try {
    const response = await fetch(`${API_BASE_URL}/student/courses`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const coursesHtml = data.courses.map(course => `
      <tr>
        <td>${course.course_code}</td>
        <td>${course.course_name}</td>
        <td>${course.credits}</td>
        <td>${course.teachers?.users?.full_name || 'TBA'}</td>
        <td>${course.description || '-'}</td>
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
              <th>Code</th>
              <th>Course Name</th>
              <th>Credits</th>
              <th>Teacher</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            ${coursesHtml || '<tr><td colspan="5" class="empty-state">No courses enrolled</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Load courses error:', error);
  }
}

async function loadAssignments() {
  try {
    const response = await fetch(`${API_BASE_URL}/student/assignments`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const assignmentsHtml = data.assignments.map(assignment => {
      const isPast = new Date(assignment.due_date) < new Date();
      const isSubmitted = assignment.status === 'submitted';

      return `
        <tr>
          <td>${assignment.title}</td>
          <td>${assignment.courses?.course_name || 'N/A'}</td>
          <td>${formatDateTime(assignment.due_date)}</td>
          <td>${assignment.total_marks}</td>
          <td><span class="badge ${isSubmitted ? 'badge-success' : isPast ? 'badge-danger' : 'badge-warning'}">${isSubmitted ? 'Submitted' : isPast ? 'Overdue' : 'Pending'}</span></td>
          <td>${assignment.submission?.marks_obtained !== undefined ? assignment.submission.marks_obtained : '-'}</td>
          <td>
            ${!isSubmitted ? `<button class="btn" onclick="submitAssignment('${assignment.id}', '${assignment.title}')">Submit</button>` : ''}
            ${isSubmitted && assignment.submission?.feedback ? `<button class="btn btn-secondary" onclick="viewFeedback('${assignment.submission.feedback}')">View Feedback</button>` : ''}
          </td>
        </tr>
      `;
    }).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="table-container">
        <div class="table-header">
          <h2>Assignments</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Course</th>
              <th>Due Date</th>
              <th>Total Marks</th>
              <th>Status</th>
              <th>Marks Obtained</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${assignmentsHtml || '<tr><td colspan="7" class="empty-state">No assignments</td></tr>'}
          </tbody>
        </table>
      </div>

      <div id="submitModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Submit Assignment</h2>
          </div>
          <form id="submitForm">
            <div class="form-group">
              <label for="submissionText">Submission</label>
              <textarea id="submissionText" required placeholder="Enter your submission text"></textarea>
            </div>
            <div class="form-group">
              <label for="fileUrl">File URL (Optional)</label>
              <input type="url" id="fileUrl" placeholder="Enter file link if any">
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="closeModal('submitModal')">Cancel</button>
              <button type="submit" class="btn">Submit Assignment</button>
            </div>
          </form>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Load assignments error:', error);
  }
}

function submitAssignment(assignmentId, title) {
  document.getElementById('submitModal').classList.add('show');

  document.getElementById('submitForm').onsubmit = async (e) => {
    e.preventDefault();

    const submissionData = {
      assignment_id: assignmentId,
      submission_text: document.getElementById('submissionText').value,
      file_url: document.getElementById('fileUrl').value
    };

    try {
      const response = await fetch(`${API_BASE_URL}/student/submissions`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      closeModal('submitModal');
      alert('Assignment submitted successfully!');
      loadAssignments();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };
}

function viewFeedback(feedback) {
  alert('Teacher Feedback:\n\n' + feedback);
}

async function loadMarks() {
  try {
    const response = await fetch(`${API_BASE_URL}/student/marks`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const groupedByCourse = {};
    data.marks.forEach(mark => {
      const courseName = mark.courses?.course_name || 'Unknown Course';
      if (!groupedByCourse[courseName]) {
        groupedByCourse[courseName] = [];
      }
      groupedByCourse[courseName].push(mark);
    });

    const summaryHtml = Object.keys(groupedByCourse).map(courseName => {
      const marks = groupedByCourse[courseName];
      const totalObtained = marks.reduce((sum, m) => sum + m.marks_obtained, 0);
      const totalMax = marks.reduce((sum, m) => sum + m.total_marks, 0);
      const percentage = ((totalObtained / totalMax) * 100).toFixed(2);

      return `
        <div class="stat-card">
          <h3>${courseName}</h3>
          <p class="stat-number">${percentage}%</p>
          <p style="font-size: 14px; color: #666; margin-top: 8px;">
            ${totalObtained}/${totalMax} marks
          </p>
        </div>
      `;
    }).join('');

    const marksHtml = data.marks.map(mark => {
      const percentage = ((mark.marks_obtained / mark.total_marks) * 100).toFixed(2);
      return `
        <tr>
          <td>${mark.courses?.course_name || 'N/A'}</td>
          <td>${mark.exam_type}</td>
          <td>${mark.marks_obtained}/${mark.total_marks}</td>
          <td>${percentage}%</td>
          <td>${formatDate(mark.exam_date)}</td>
          <td>${mark.remarks || '-'}</td>
        </tr>
      `;
    }).join('');

    document.getElementById('pageContent').innerHTML = `
      <div class="stats-grid">
        ${summaryHtml || '<div class="empty-state">No marks available</div>'}
      </div>

      <div class="table-container" style="margin-top: 24px;">
        <div class="table-header">
          <h2>Detailed Marks</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Exam Type</th>
              <th>Marks</th>
              <th>Percentage</th>
              <th>Date</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${marksHtml || '<tr><td colspan="6" class="empty-state">No marks available</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    console.error('Load marks error:', error);
  }
}

async function loadNotifications() {
  try {
    const response = await fetch(`${API_BASE_URL}/student/notifications`, {
      headers: getAuthHeaders(),
      credentials: 'include'
    });

    const data = await response.json();

    const notificationsHtml = data.notifications.map(notif => {
      const priorityClass = notif.priority === 'high' ? 'badge-danger' : notif.priority === 'medium' ? 'badge-warning' : 'badge-info';

      return `
        <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <h3 style="font-size: 18px; font-weight: 600; margin: 0;">${notif.title}</h3>
            <span class="badge ${priorityClass}">${notif.priority}</span>
          </div>
          <p style="color: #666; margin-bottom: 12px;">${notif.message}</p>
          <p style="font-size: 13px; color: #999;">${formatDateTime(notif.created_at)}</p>
        </div>
      `;
    }).join('');

    document.getElementById('pageContent').innerHTML = `
      <div style="max-width: 800px;">
        <h2 style="margin-bottom: 24px;">Notifications</h2>
        ${notificationsHtml || '<div class="empty-state">No notifications</div>'}
      </div>
    `;
  } catch (error) {
    console.error('Load notifications error:', error);
  }
}

async function loadFeedback() {
  try {
    const coursesResponse = await fetch(`${API_BASE_URL}/student/courses`, {
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
          <h2>Submit Feedback</h2>
        </div>
        <div style="padding: 24px;">
          <form id="feedbackForm">
            <div class="form-group">
              <label for="feedbackCourse">Course (Optional)</label>
              <select id="feedbackCourse">
                <option value="">-- General Feedback --</option>
                ${courseOptions}
              </select>
            </div>
            <div class="form-group">
              <label for="category">Category</label>
              <input type="text" id="category" required placeholder="e.g., Teaching Quality, Facilities, etc.">
            </div>
            <div class="form-group">
              <label for="message">Message</label>
              <textarea id="message" required placeholder="Share your feedback"></textarea>
            </div>
            <div class="form-group">
              <label for="rating">Rating</label>
              <select id="rating" required>
                <option value="">-- Select Rating --</option>
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Below Average</option>
                <option value="1">1 - Poor</option>
              </select>
            </div>
            <button type="submit" class="btn">Submit Feedback</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const feedbackData = {
        course_id: document.getElementById('feedbackCourse').value || null,
        category: document.getElementById('category').value,
        message: document.getElementById('message').value,
        rating: parseInt(document.getElementById('rating').value)
      };

      try {
        const response = await fetch(`${API_BASE_URL}/student/feedback`, {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify(feedbackData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }

        alert('Feedback submitted successfully!');
        document.getElementById('feedbackForm').reset();
      } catch (error) {
        alert('Error: ' + error.message);
      }
    });
  } catch (error) {
    console.error('Load feedback error:', error);
  }
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}
