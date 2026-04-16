import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('status', 'active')
      .maybeSingle();

    if (error || !users) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, users.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      {
        id: users.id,
        email: users.email,
        role: users.role,
        full_name: users.full_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Login successful',
      user: {
        id: users.id,
        email: users.email,
        role: users.role,
        full_name: users.full_name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      full_name, 
      phone, 
      roll_number, 
      class_section,
      date_of_birth,
      gender,
      address,
      guardian_name,
      guardian_phone,
      guardian_email
    } = req.body;

    // Validate required fields
    if (!email || !password || !full_name || !roll_number || !class_section) {
      return res.status(400).json({ 
        error: 'Email, password, full name, roll number, and class section are required' 
      });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if roll number already exists
    const { data: existingStudent } = await supabase
      .from('students')
      .select('roll_number')
      .eq('roll_number', roll_number)
      .maybeSingle();

    if (existingStudent) {
      return res.status(400).json({ error: 'Roll number already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user account
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash,
        full_name,
        phone,
        role: 'student',
        status: 'active'
      })
      .select()
      .single();

    if (userError) {
      return res.status(400).json({ error: 'Failed to create user account' });
    }

    // Create student profile
    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert({
        user_id: newUser.id,
        roll_number,
        class_section,
        admission_date: new Date().toISOString().split('T')[0],
        date_of_birth,
        gender,
        address,
        guardian_name,
        guardian_phone,
        guardian_email
      })
      .select()
      .single();

    if (studentError) {
      // Rollback user creation if student profile fails
      await supabase.from('users').delete().eq('id', newUser.id);
      return res.status(400).json({ error: 'Failed to create student profile' });
    }

    // Auto-enroll in courses for their class section
    const { data: courses } = await supabase
      .from('courses')
      .select('id')
      .eq('class_section', class_section);

    if (courses && courses.length > 0) {
      const enrollments = courses.map(course => ({
        student_id: newStudent.id,
        course_id: course.id,
        enrollment_date: new Date().toISOString().split('T')[0],
        status: 'active'
      }));

      await supabase.from('enrollments').insert(enrollments);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        full_name: newUser.full_name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        full_name: newUser.full_name
      },
      student: {
        id: newStudent.id,
        roll_number: newStudent.roll_number,
        class_section: newStudent.class_section
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, full_name, phone, status')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Auth check error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
