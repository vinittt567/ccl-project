import express from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/dashboard', async (req, res) => {
  try {
    const { count: totalStudents } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    const { count: totalTeachers } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true });

    const { count: totalCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    const today = new Date().toISOString().split('T')[0];
    const { count: todayAttendance } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('date', today);

    res.json({
      totalStudents: totalStudents || 0,
      totalTeachers: totalTeachers || 0,
      totalCourses: totalCourses || 0,
      todayAttendance: todayAttendance || 0
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { email, password, role, full_name, phone } = req.body;

    if (!email || !password || !role || !full_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        role,
        full_name,
        phone,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, full_name, phone, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ users });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.password) {
      updates.password_hash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.post('/students', async (req, res) => {
  try {
    const studentData = req.body;

    const { data: student, error } = await supabase
      .from('students')
      .insert(studentData)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Student created successfully', student });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Failed to create student' });
  }
});

router.get('/students', async (req, res) => {
  try {
    const { data: students, error } = await supabase
      .from('students')
      .select(`
        *,
        users:user_id (id, email, full_name, phone, status)
      `)
      .order('roll_number', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ students });
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

router.post('/teachers', async (req, res) => {
  try {
    const teacherData = req.body;

    const { data: teacher, error } = await supabase
      .from('teachers')
      .insert(teacherData)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Teacher created successfully', teacher });
  } catch (error) {
    console.error('Create teacher error:', error);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

router.get('/teachers', async (req, res) => {
  try {
    const { data: teachers, error } = await supabase
      .from('teachers')
      .select(`
        *,
        users:user_id (id, email, full_name, phone, status)
      `)
      .order('employee_id', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ teachers });
  } catch (error) {
    console.error('Fetch teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const courseData = req.body;

    const { data: course, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Course created successfully', course });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

router.get('/courses', async (req, res) => {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        teachers:teacher_id (
          employee_id,
          users:user_id (full_name)
        )
      `)
      .order('course_code', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ courses });
  } catch (error) {
    console.error('Fetch courses error:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

router.post('/notifications', async (req, res) => {
  try {
    const { title, message, target_role, priority, expires_at } = req.body;

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        title,
        message,
        created_by: req.user.id,
        target_role,
        priority,
        expires_at
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Notification created successfully', notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

router.get('/reports/attendance', async (req, res) => {
  try {
    const { data: attendanceData, error } = await supabase
      .from('attendance')
      .select(`
        *,
        students (roll_number, users:user_id (full_name)),
        courses (course_name, course_code)
      `)
      .order('date', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ attendance: attendanceData });
  } catch (error) {
    console.error('Fetch attendance report error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance report' });
  }
});

router.get('/reports/marks', async (req, res) => {
  try {
    const { data: marksData, error } = await supabase
      .from('marks')
      .select(`
        *,
        students (roll_number, users:user_id (full_name)),
        courses (course_name, course_code)
      `)
      .order('exam_date', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ marks: marksData });
  } catch (error) {
    console.error('Fetch marks report error:', error);
    res.status(500).json({ error: 'Failed to fetch marks report' });
  }
});

export default router;
