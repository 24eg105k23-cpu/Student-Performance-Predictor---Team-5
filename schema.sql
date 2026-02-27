-- 1. Core Student Record
CREATE TABLE STUDENT (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    roll_no VARCHAR(20) UNIQUE NOT NULL,
    student_name VARCHAR(100) NOT NULL,
    gender VARCHAR(10),
    date_of_birth DATE,
    email VARCHAR(100),
    phone VARCHAR(15),
    department VARCHAR(50),
    semester INT,
    admission_year INT
);

-- 2. Courses/Subjects available
CREATE TABLE COURSE (
    course_id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) UNIQUE,
    course_name VARCHAR(100) NOT NULL, -- e.g., Mathematics, English, Science
    credits INT,
    semester INT
);

-- 3. Student Enrollment in Courses
CREATE TABLE ENROLLMENT (
    enrollment_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    course_id INT,
    academic_year VARCHAR(10),
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id),
    FOREIGN KEY (course_id) REFERENCES COURSE(course_id)
);

-- 4. Daily Attendance Tracking (Matches the "Attendance" Tab)
CREATE TABLE DAILY_ATTENDANCE (
    attendance_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'present', 'absent', 'leave'
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
);

-- 5. Universal Assessments Table (Matches both "Enter Marks" and "Assessments" Tabs)
CREATE TABLE ASSESSMENTS (
    assessment_id INT PRIMARY KEY AUTO_INCREMENT,
    enrollment_id INT,             -- Links to the specific course
    assessment_type VARCHAR(50),   -- 'Mid-term', 'Quiz', 'Assignment', 'Class Test', etc.
    marks_obtained DECIMAL(5,2),   -- Allows for fractions like 95.5
    max_marks DECIMAL(5,2),
    assessment_date DATE,
    feedback TEXT,                 -- Replaces the hardcoded columns to support comments
    FOREIGN KEY (enrollment_id) REFERENCES ENROLLMENT(enrollment_id)
);

-- 6. Performance & Monitoring Table (Matches "Monitor" Tab Analytics)
CREATE TABLE STUDENT_METRICS (
    metric_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT UNIQUE,
    overall_performance_score DECIMAL(5,2), -- e.g. 78.50
    overall_attendance_rate DECIMAL(5,2),   -- e.g. 92.00
    status VARCHAR(20),                     -- 'excellent', 'average', 'at-risk'
    trend VARCHAR(20),                      -- 'improving', 'stable', 'declining'
    intervention_needed BOOLEAN,            -- True if at risk
    risk_factors TEXT,                      -- Comma-separated list like "Low attendance,Declining scores"
    last_updated DATE,
    FOREIGN KEY (student_id) REFERENCES STUDENT(student_id)
);
