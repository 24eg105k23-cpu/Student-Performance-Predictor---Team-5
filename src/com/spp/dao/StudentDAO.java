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
        // Attendance = 100 - (absent_count * 3) + (present_count * 1), capped [0, 100]
        // Performance = (total_score / total_max_score) * 100
        String sql = "SELECT s.ROLL_NO, s.STUDENT_NAME, s.PHONE_NUMBER, " +
                "       GREATEST(LEAST(100 - (COALESCE(att.ABSENT_COUNT, 0) * 3) + (COALESCE(att.PRESENT_COUNT, 0) * 1), 100), 0) AS ATTENDANCE_RATE, " +
                "       COALESCE(perf.PERF_SCORE, 0) AS PERFORMANCE_SCORE " +
                "FROM STUDENTS s " +
                "LEFT JOIN (" +
                "    SELECT ROLL_NO, " +
                "           SUM(CASE WHEN STATUS = 'absent' THEN 1 ELSE 0 END) AS ABSENT_COUNT, " +
                "           SUM(CASE WHEN STATUS = 'present' THEN 1 ELSE 0 END) AS PRESENT_COUNT " +
                "    FROM ATTENDANCE GROUP BY ROLL_NO" +
                ") att ON s.ROLL_NO = att.ROLL_NO " +
                "LEFT JOIN (" +
                "    SELECT ROLL_NO, ROUND((SUM(SCORE) / NULLIF(SUM(MAX_SCORE), 0)) * 100) AS PERF_SCORE " +
                "    FROM ASSESSMENTS GROUP BY ROLL_NO" +
                ") perf ON s.ROLL_NO = perf.ROLL_NO " +
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
                s.setPhoneNumber(rs.getString("PHONE_NUMBER"));
                s.setAttendanceRate(rs.getInt("ATTENDANCE_RATE"));
                s.setPerformanceScore(rs.getInt("PERFORMANCE_SCORE"));

                // Determine Status using the ML Model Prediction
                /*
                 * Resolve Tomcat deployment path dynamically
                 */
                String catalinaBase = System.getProperty("catalina.base");
                String basePath = catalinaBase != null ? catalinaBase + "/webapps/spp" : "webapp";
                
                String mlPrediction = com.spp.ml.RiskPredictor.predictRisk(s, basePath);

                if (mlPrediction.equals("High Risk")) {
                    s.setStatus("at-risk");
                    s.setInterventionNeeded(true);
                    s.getRiskFactors().add("ML Model detected critical performance or attendance levels");
                } else if (mlPrediction.equals("Low Risk")) {
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
