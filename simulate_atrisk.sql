-- ============================================================
-- Script to simulate "At Risk" students for testing purposes
-- Run any section as needed, then COMMIT and refresh dashboard
-- ============================================================

-- ========================
-- OPTION A: Add Absences
-- Drops attendance below 75% for K01, K02, K03
-- ========================

INSERT INTO ATTENDANCE (ROLL_NO, ATTENDANCE_DATE, STATUS) 
SELECT '24EG105K01', SYSDATE - LEVEL, 'absent' FROM DUAL CONNECT BY LEVEL <= 20;

INSERT INTO ATTENDANCE (ROLL_NO, ATTENDANCE_DATE, STATUS) 
SELECT '24EG105K02', SYSDATE - LEVEL, 'absent' FROM DUAL CONNECT BY LEVEL <= 20;

INSERT INTO ATTENDANCE (ROLL_NO, ATTENDANCE_DATE, STATUS) 
SELECT '24EG105K03', SYSDATE - LEVEL, 'absent' FROM DUAL CONNECT BY LEVEL <= 20;

-- ========================
-- OPTION B: Lower Marks
-- Drops performance below 45% for K04, K05
-- ========================

UPDATE ASSESSMENTS SET SCORE = 1 WHERE ROLL_NO = '24EG105K04';
UPDATE ASSESSMENTS SET SCORE = 2 WHERE ROLL_NO = '24EG105K05';

COMMIT;

-- ============================================================
-- TO UNDO: Run these to revert back to normal
-- ============================================================
-- DELETE FROM ATTENDANCE WHERE ROLL_NO IN ('24EG105K01','24EG105K02','24EG105K03') AND STATUS = 'absent' AND ATTENDANCE_DATE >= SYSDATE - 20;
-- UPDATE ASSESSMENTS SET SCORE = ROUND(DBMS_RANDOM.VALUE(5, 18)) WHERE ROLL_NO IN ('24EG105K04','24EG105K05');
-- COMMIT;
