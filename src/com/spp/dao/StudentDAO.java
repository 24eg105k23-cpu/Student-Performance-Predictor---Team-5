package com.spp.dao;

import com.spp.model.Assessment;
import com.spp.model.Student;
import com.spp.util.DBUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class StudentDAO {

    /**
     * Retrieves all students, calculates their performance score from ASSESSMENTS
     * and attendance rate from ATTENDANCE manually since the VIEW was removed.
     */
    public List<Student> getAllStudents() {
        List<Student> students = new ArrayList<>();
        // Query computes performance score and attendance rate manually per student.
        String sql = "SELECT s.ROLL_NO, s.STUDENT_NAME, " +
                "       COALESCE(ROUND((SUM(CASE WHEN a.STATUS = 'present' THEN 1 ELSE 0 END) / NULLIF(COUNT(a.ID), 0)) * 100), 100) AS ATTENDANCE_RATE, "
                +
                "       COALESCE(ROUND((SUM(m.SCORE) / NULLIF(SUM(m.MAX_SCORE), 0)) * 100), 0) AS PERFORMANCE_SCORE " +
                "FROM STUDENTS s " +
                "LEFT JOIN ATTENDANCE a ON s.ROLL_NO = a.ROLL_NO " +
                "LEFT JOIN ASSESSMENTS m ON s.ROLL_NO = m.ROLL_NO " +
                "GROUP BY s.ROLL_NO, s.STUDENT_NAME " +
                "ORDER BY s.ROLL_NO ASC";

        try (Connection conn = DBUtil.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql);
                ResultSet rs = stmt.executeQuery()) {
            System.out.println("DEBUG: Oracle connection and query executed successfully.");

            while (rs.next()) {
                System.out.println("DEBUG: Fetched a row from STUDENTS table.");
                Student s = new Student();
                s.setId(rs.getString("ROLL_NO")); // frontend uses ID
                s.setRollNo(rs.getString("ROLL_NO"));
                s.setName(rs.getString("STUDENT_NAME"));
                s.setAttendanceRate(rs.getInt("ATTENDANCE_RATE"));
                s.setPerformanceScore(rs.getInt("PERFORMANCE_SCORE"));

                // Determine Status based on performance and attendance matching app.js logic
                if (s.getAttendanceRate() < 60 || s.getPerformanceScore() < 45) {
                    s.setStatus("at-risk");
                    s.setInterventionNeeded(true);
                    s.getRiskFactors().add("Critical performance or attendance levels detected");
                } else if (s.getAttendanceRate() >= 85 && s.getPerformanceScore() >= 75) {
                    s.setStatus("excellent");
                    s.setInterventionNeeded(false);
                } else {
                    s.setStatus("average");
                    s.setInterventionNeeded(false);
                }

                s.setTrend("stable"); // Simplified for now
                s.setLastUpdated(java.time.LocalDate.now().toString());

                // Fetch recent assessments for the student
                s.setRecentAssessments(getRecentAssessments(conn, s.getRollNo()));

                students.add(s);
            }
        } catch (SQLException e) {
            System.out.println("DEBUG FATAL SQL ERROR IN StudentDAO: " + e.getMessage());
            e.printStackTrace();
        }
        System.out.println("DEBUG: Returning " + students.size() + " students.");
        return students;
    }

    private List<Assessment> getRecentAssessments(Connection conn, String rollNo) {
        List<Assessment> list = new ArrayList<>();
        String sql = "SELECT ASSESSMENT_TYPE, SUBJECT, SCORE, MAX_SCORE, TO_CHAR(ASSESSMENT_DATE, 'YYYY-MM-DD') as ADATE "
                +
                "FROM ASSESSMENTS WHERE ROLL_NO = ? ORDER BY ASSESSMENT_DATE DESC";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, rollNo);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Assessment a = new Assessment();
                    a.setType(rs.getString("ASSESSMENT_TYPE"));
                    a.setSubject(rs.getString("SUBJECT"));
                    a.setScore(rs.getDouble("SCORE"));
                    a.setMaxScore(rs.getDouble("MAX_SCORE"));
                    a.setDate(rs.getString("ADATE"));
                    list.add(a);
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }
}
