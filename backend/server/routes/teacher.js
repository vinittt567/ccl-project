import express from 'express';
import { supabase } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('teacher', 'admin'));

router.get('/dashboard', async (req, res) => {
  try {
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!teacherData) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const { count: myCourses } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', teacherData.id);

    const today = new Date().toISOString().split('T')[0];
    const { count: todayClasses } = await supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('marked_by', teacherData.id)
      .eq('date', today);

    const { count: pendingAssignments } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true })
      .eq('created_by', teacherData.id)
      .gte('due_date', new Date().toISOString());

    res.json({
      myCourses: myCourses || 0,
      todayClasses: todayClasses || 0,
      pendingAssignments: pendingAssignments || 0,
      teacherId: teacherData.id
    });
  } catch (error) {
    console.error('Teacher dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.get('/courses', async (req, res) => {
  try {
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!teacherData) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('teacher_id', teacherData.id)
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

router.post('/attendance', async (req, res) => {
  try {
    const { student_id, course_id, date, status, remarks } = req.body;

    const { data: teacherData } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!teacherData) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const { data: attendance, error } = await supabase
      .from('attendance')
      .upsert({
        student_id,
        course_id,
        date: date || new Date().toISOString().split('T')[0],
        status,
        marked_by: teacherData.id,
        remarks
      }, {
        onConflict: 'student_id,course_id,date'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

router.get('/attendance/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;

    let query = supabase
      .from('attendance')
      .select(`
        *,
        students (
          roll_number,
          users:user_id (full_name)
        )
      `)
      .eq('course_id', courseId);

    if (date) {
      query = query.eq('date', date);
    }

    const { data: attendance, error } = await query.order('date', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ attendance });
  } catch (error) {
    console.error('Fetch attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

router.post('/assignments', async (req, res) => {
  try {
    const { course_id, title, description, due_date, total_marks } = req.body;

    const { data: teacherData } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!teacherData) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        course_id,
        title,
        description,
        due_date,
        total_marks: total_marks || 100,
        created_by: teacherData.id
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Assignment created successfully', assignment });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

router.get('/assignments', async (req, res) => {
  try {
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!teacherData) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        courses (course_name, course_code)
      `)
      .eq('created_by', teacherData.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ assignments });
  } catch (error) {
    console.error('Fetch assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

router.get('/submissions/:assignmentId', async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        students (
          roll_number,
          users:user_id (full_name)
        )
      `)
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ submissions });
  } catch (error) {
    console.error('Fetch submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

router.put('/submissions/:id/grade', async (req, res) => {
  try {
    const { id } = req.params;
    const { marks_obtained, feedback } = req.body;

    const { data: submission, error } = await supabase
      .from('submissions')
      .update({
        marks_obtained,
        feedback,
        graded_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Submission graded successfully', submission });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

router.post('/marks', async (req, res) => {
  try {
    const { student_id, course_id, exam_type, marks_obtained, total_marks, exam_date, remarks } = req.body;

    const { data: teacherData } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!teacherData) {
      return res.status(404).json({ error: 'Teacher profile not found' });
    }

    const { data: mark, error } = await supabase
      .from('marks')
      .insert({
        student_id,
        course_id,
        exam_type,
        marks_obtained,
        total_marks,
        exam_date,
        entered_by: teacherData.id,
        remarks
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Marks entered successfully', mark });
  } catch (error) {
    console.error('Enter marks error:', error);
    res.status(500).json({ error: 'Failed to enter marks' });
  }
});

router.get('/marks/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const { data: marks, error } = await supabase
      .from('marks')
      .select(`
        *,
        students (
          roll_number,
          users:user_id (full_name)
        )
      `)
      .eq('course_id', courseId)
      .order('exam_date', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ marks });
  } catch (error) {
    console.error('Fetch marks error:', error);
    res.status(500).json({ error: 'Failed to fetch marks' });
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
        target_role: target_role || 'student',
        priority,
        expires_at
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Notification sent successfully', notification });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

router.get('/students/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;

    const { data: course } = await supabase
      .from('courses')
      .select('class_section')
      .eq('id', courseId)
      .maybeSingle();

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const { data: students, error } = await supabase
      .from('students')
      .select(`
        *,
        users:user_id (id, full_name, email)
      `)
      .eq('class_section', course.class_section)
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

export default router;
