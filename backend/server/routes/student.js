import express from 'express';
import { supabase } from '../config/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('student', 'admin'));

router.get('/dashboard', async (req, res) => {
  try {
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!studentData) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentData.id);

    const totalClasses = attendanceData?.length || 0;
    const presentClasses = attendanceData?.filter(a => a.status === 'present').length || 0;
    const attendancePercentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(2) : 0;

    const { count: pendingAssignments } = await supabase
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .gte('due_date', new Date().toISOString())
      .not('id', 'in', `(SELECT assignment_id FROM submissions WHERE student_id = '${studentData.id}')`);

    const { data: recentMarks } = await supabase
      .from('marks')
      .select('*')
      .eq('student_id', studentData.id)
      .order('exam_date', { ascending: false })
      .limit(5);

    res.json({
      studentId: studentData.id,
      attendancePercentage,
      totalClasses,
      presentClasses,
      pendingAssignments: pendingAssignments || 0,
      recentMarks: recentMarks || []
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

router.get('/profile', async (req, res) => {
  try {
    const { data: studentData, error } = await supabase
      .from('students')
      .select(`
        *,
        users:user_id (id, email, full_name, phone)
      `)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    if (!studentData) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    res.json({ profile: studentData });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { address, guardian_name, guardian_phone } = req.body;

    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!studentData) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const { data: updatedProfile, error } = await supabase
      .from('students')
      .update({ address, guardian_name, guardian_phone })
      .eq('id', studentData.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.get('/attendance', async (req, res) => {
  try {
    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!studentData) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const { data: attendance, error } = await supabase
      .from('attendance')
      .select(`
        *,
        courses (course_name, course_code)
      `)
      .eq('student_id', studentData.id)
      .order('date', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ attendance });
  } catch (error) {
    console.error('Fetch attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

router.get('/courses', async (req, res) => {
  try {
    const { data: studentData } = await supabase
      .from('students')
      .select('class_section')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!studentData) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        *,
        teachers:teacher_id (
          employee_id,
          users:user_id (full_name)
        )
      `)
      .eq('class_section', studentData.class_section)
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

router.get('/assignments', async (req, res) => {
  try {
    const { data: studentData } = await supabase
      .from('students')
      .select('id, class_section')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!studentData) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('class_section', studentData.class_section);

    const courseIds = courses?.map(c => c.id) || [];

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select(`
        *,
        courses (course_name, course_code)
      `)
      .in('course_id', courseIds)
      .order('due_date', { ascending: true });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const { data: submissions } = await supabase
      .from('submissions')
      .select('assignment_id, marks_obtained, feedback, submitted_at')
      .eq('student_id', studentData.id);

    const assignmentsWithStatus = assignments?.map(assignment => {
      const submission = submissions?.find(s => s.assignment_id === assignment.id);
      return {
        ...assignment,
        submission: submission || null,
        status: submission ? 'submitted' : 'pending'
      };
    });

    res.json({ assignments: assignmentsWithStatus });
  } catch (error) {
    console.error('Fetch assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

router.post('/submissions', async (req, res) => {
  try {
    const { assignment_id, submission_text, file_url } = req.body;

    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!studentData) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const { data: submission, error } = await supabase
      .from('submissions')
      .upsert({
        assignment_id,
        student_id: studentData.id,
        submission_text,
        file_url,
        submitted_at: new Date().toISOString()
      }, {
        onConflict: 'assignment_id,student_id'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Assignment submitted successfully', submission });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

router.get('/marks', async (req, res) => {
  try {
    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!studentData) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const { data: marks, error } = await supabase
      .from('marks')
      .select(`
        *,
        courses (course_name, course_code)
      `)
      .eq('student_id', studentData.id)
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

router.get('/notifications', async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .or(`target_role.eq.all,target_role.eq.student`)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ notifications });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.post('/feedback', async (req, res) => {
  try {
    const { course_id, category, message, rating } = req.body;

    const { data: studentData } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (!studentData) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const { data: feedback, error } = await supabase
      .from('feedback')
      .insert({
        student_id: studentData.id,
        course_id,
        category,
        message,
        rating,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

export default router;
