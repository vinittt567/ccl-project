-- SSMS Demo Data - Admin and Teacher Only
-- This replaces sample_data.sql for production use
-- Students will register themselves through the application
-- Clear existing data (if any)
DELETE FROM feedback;
DELETE FROM notifications;
DELETE FROM marks;
DELETE FROM submissions;
DELETE FROM assignments;
DELETE FROM attendance;
DELETE FROM enrollments;
DELETE FROM courses;
DELETE FROM students;
DELETE FROM teachers;
DELETE FROM users;
-- Insert demo admin and teacher accounts only
INSERT INTO users (
        id,
        email,
        password_hash,
        full_name,
        phone,
        role,
        status
    )
VALUES -- Demo Admin (email: admin@ssms.edu, password: admin123)
    (
        '550e8400-e29b-41d4-a716-446655440000',
        'admin@ssms.edu',
        '$2b$10$tvb0vUnpv.lpgzD34THc6u0FGU5v6wX33DFbSljDnbQV0HwaEu.ji',
        'System Administrator',
        '+1234567890',
        'admin',
        'active'
    ),
    -- Demo Teachers (password: teacher123)
    (
        '550e8400-e29b-41d4-a716-446655440001',
        'john.smith@ssms.edu',
        '$2b$10$w8LlHL4ZJ8dl/RIKYtHk3eKPr45Jd.0YFWkxqlGHs9b5RihfMNguC',
        'Dr. John Smith',
        '+1234567891',
        'teacher',
        'active'
    ),
    (
        '550e8400-e29b-41d4-a716-446655440002',
        'sarah.johnson@ssms.edu',
        '$2b$10$w8LlHL4ZJ8dl/RIKYtHk3eKPr45Jd.0YFWkxqlGHs9b5RihfMNguC',
        'Prof. Sarah Johnson',
        '+1234567892',
        'teacher',
        'active'
    );
-- Insert teacher profiles
INSERT INTO teachers (
        id,
        user_id,
        employee_id,
        department,
        designation,
        qualification,
        experience_years,
        joining_date,
        subjects_specialization
    )
VALUES (
        '650e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440001',
        'T001',
        'Mathematics',
        'Professor',
        'PhD in Mathematics',
        15,
        '2020-01-15',
        ARRAY ['Calculus', 'Algebra', 'Statistics']
    ),
    (
        '650e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440002',
        'T002',
        'Computer Science',
        'Associate Professor',
        'PhD in Computer Science',
        12,
        '2021-03-01',
        ARRAY ['Programming', 'Data Structures', 'Algorithms']
    );
-- Insert sample courses (for demo purposes)
INSERT INTO courses (
        id,
        course_code,
        course_name,
        description,
        credits,
        class_section,
        teacher_id,
        semester,
        academic_year
    )
VALUES (
        '850e8400-e29b-41d4-a716-446655440001',
        'MATH101',
        'Calculus I',
        'Introduction to differential and integral calculus',
        4,
        'CS-A',
        '650e8400-e29b-41d4-a716-446655440001',
        'Fall',
        '2024-25'
    ),
    (
        '850e8400-e29b-41d4-a716-446655440002',
        'CS101',
        'Programming Fundamentals',
        'Introduction to programming concepts and practices',
        3,
        'CS-A',
        '650e8400-e29b-41d4-a716-446655440002',
        'Fall',
        '2024-25'
    ),
    (
        '850e8400-e29b-41d4-a716-446655440003',
        'MATH102',
        'Statistics',
        'Statistical analysis and probability',
        3,
        'IT-A',
        '650e8400-e29b-41d4-a716-446655440001',
        'Fall',
        '2024-25'
    ),
    (
        '850e8400-e29b-41d4-a716-446655440004',
        'CS102',
        'Data Structures',
        'Fundamental data structures and algorithms',
        4,
        'IT-A',
        '650e8400-e29b-41d4-a716-446655440002',
        'Fall',
        '2024-25'
    );
-- Insert a welcome notification
INSERT INTO notifications (
        title,
        message,
        target_role,
        priority,
        created_by
    )
VALUES (
        'Welcome to SSMS',
        'Welcome to the Smart Student Management System. Students can now register themselves!',
        'all',
        'normal',
        '550e8400-e29b-41d4-a716-446655440000'
    );