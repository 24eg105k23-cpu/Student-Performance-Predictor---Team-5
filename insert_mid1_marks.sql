-- Inserts random integer marks between 0 and 20 for mid1 assessment for all students
INSERT INTO ASSESSMENTS (ROLL_NO, ASSESSMENT_TYPE, SUBJECT, SCORE, MAX_SCORE)
SELECT 
    ROLL_NO, 
    'mid1', 
    'Computer Oriented Statistical Methods', 
    ROUND(DBMS_RANDOM.VALUE(0, 20)), 
    20 
FROM STUDENTS;

COMMIT;
