-- Inserts random integer marks between 0 and 20 for unit 1 test assessment for all students
-- Includes all 8 core semester subjects

INSERT INTO ASSESSMENTS (ROLL_NO, ASSESSMENT_TYPE, SUBJECT, SCORE, MAX_SCORE)
SELECT 
    s.ROLL_NO, 
    'unit3 test', 
    sub.subject_name, 
    ROUND(DBMS_RANDOM.VALUE(0, 20)), 
    20 
FROM STUDENTS s
CROSS JOIN (
    SELECT 'Computer Oriented Statistical Methods' AS subject_name FROM DUAL UNION ALL
    SELECT 'Fundamentals of Computer Algorithms' FROM DUAL UNION ALL
    SELECT 'Database Management Systems' FROM DUAL UNION ALL
    SELECT 'Programming in Python' FROM DUAL UNION ALL
    SELECT 'Web Technologies' FROM DUAL UNION ALL
    SELECT 'Advanced Reading Comprehension Skills' FROM DUAL UNION ALL
    SELECT 'Quantitative Aptitude and Logical Reasoning - II' FROM DUAL
) sub;

COMMIT;
