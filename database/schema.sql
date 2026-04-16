-- Smart Student Management System (SSMS) Database Schema
-- PostgreSQL/Supabase Implementation
-- Created: 2025-10-05
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- 1. Users table (Base authentication and user info)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 2. Students table (Extended student profiles)
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    class_section VARCHAR(50) NOT NULL,
    admission_date DATE,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    blood_group VARCHAR(10),
    address TEXT,
    guardian_name VARCHAR(255),
    guardian_phone VARCHAR(20),
    guardian_email VARCHAR(255),
    emergency_contact VARCHAR(20),
    previous_school TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 3. Teachers table (Extended teacher profiles)
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    designation VARCHAR(100),
    qualification TEXT,
    experience_years INTEGER DEFAULT 0,
    joining_date DATE,
    salary DECIMAL(10, 2),
    subjects_specialization TEXT [],
    address TEXT,
    emergency_contact VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 4. Courses table (Subjects/Courses)
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 1,
    class_section VARCHAR(50) NOT NULL,
    teacher_id UUID REFERENCES teachers(id) ON DELETE
    SET NULL,
        semester VARCHAR(20),
        academic_year VARCHAR(20),
        start_date DATE,
        end_date DATE,
        max_students INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 5. Attendance table
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (
        status IN ('present', 'absent', 'late', 'excused')
    ),
    marked_by UUID REFERENCES teachers(id) ON DELETE
    SET NULL,
        remarks TEXT,
        marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        -- Ensure one attendance record per student per course per day
        UNIQUE(student_id, course_id, date)
);
-- 6. Assignments table
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    total_marks INTEGER DEFAULT 100,
    assignment_type VARCHAR(50) DEFAULT 'homework',
    instructions TEXT,
    attachment_urls TEXT [],
    created_by UUID REFERENCES teachers(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 7. Submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    submission_text TEXT,
    attachment_urls TEXT [],
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    marks_obtained INTEGER,
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE,
    graded_by UUID REFERENCES teachers(id) ON DELETE
    SET NULL,
        late_submission BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        -- Ensure one submission per student per assignment
        UNIQUE(assignment_id, student_id)
);
-- 8. Marks table (Exam marks/grades)
CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    exam_type VARCHAR(50) NOT NULL,
    -- 'midterm', 'final', 'quiz', 'assignment'
    exam_name VARCHAR(255),
    marks_obtained DECIMAL(5, 2) NOT NULL,
    total_marks DECIMAL(5, 2) NOT NULL,
    percentage DECIMAL(5, 2) GENERATED ALWAYS AS ((marks_obtained / total_marks) * 100) STORED,
    grade VARCHAR(5),
    exam_date DATE,
    entered_by UUID REFERENCES teachers(id) ON DELETE
    SET NULL,
        remarks TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 9. Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_role VARCHAR(20) CHECK (
        target_role IN ('student', 'teacher', 'admin', 'all')
    ),
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    -- for specific user notifications
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    read_status BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE
    SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 10. Feedback table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    feedback_type VARCHAR(50) DEFAULT 'general',
    -- 'course', 'teacher', 'general', 'complaint'
    subject VARCHAR(255),
    message TEXT NOT NULL,
    rating INTEGER CHECK (
        rating >= 1
        AND rating <= 5
    ),
    anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    admin_response TEXT,
    responded_by UUID REFERENCES users(id) ON DELETE
    SET NULL,
        responded_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- 11. Enrollments table (Student-Course relationship)
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed')),
    final_grade VARCHAR(5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure one enrollment per student per course
    UNIQUE(student_id, course_id)
);
-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_students_roll_number ON students(roll_number);
CREATE INDEX idx_students_class_section ON students(class_section);
CREATE INDEX idx_teachers_employee_id ON teachers(employee_id);
CREATE INDEX idx_courses_code ON courses(course_code);
CREATE INDEX idx_courses_class_section ON courses(class_section);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_student_course ON attendance(student_id, course_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_submissions_assignment_student ON submissions(assignment_id, student_id);
CREATE INDEX idx_marks_student_course ON marks(student_id, course_id);
CREATE INDEX idx_marks_exam_date ON marks(exam_date);
CREATE INDEX idx_notifications_target_role ON notifications(target_role);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_feedback_student_id ON feedback(student_id);
CREATE INDEX idx_enrollments_student_course ON enrollments(student_id, course_id);
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW();
RETURN NEW;
END;
$$ language 'plpgsql';
-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE
UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE
UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE
UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE
UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE
UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marks_updated_at BEFORE
UPDATE ON marks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();