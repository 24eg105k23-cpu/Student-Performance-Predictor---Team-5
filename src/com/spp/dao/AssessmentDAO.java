package com.spp.dao;

import com.spp.model.Assessment;
import com.spp.util.DBUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

public class AssessmentDAO {

    public boolean saveAssessment(Assessment assessment, String rollNo) throws SQLException {
        String sql = "INSERT INTO ASSESSMENTS (ROLL_NO, ASSESSMENT_TYPE, SUBJECT, SCORE, MAX_SCORE) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = DBUtil.getConnection();
                PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, rollNo);
            stmt.setString(2, assessment.getType());
            stmt.setString(3, assessment.getSubject());
            stmt.setDouble(4, assessment.getScore());
            stmt.setDouble(5, assessment.getMaxScore());

            int rowsAffected = stmt.executeUpdate();
            return rowsAffected > 0;

        } // Exception bubbles up
    }
}
