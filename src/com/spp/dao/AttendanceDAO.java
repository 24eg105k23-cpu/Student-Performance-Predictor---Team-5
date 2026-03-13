package com.spp.dao;

import com.spp.model.AttendanceRecord;
import com.spp.util.DBUtil;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;

public class AttendanceDAO {

    public boolean saveAttendance(List<AttendanceRecord> records, String dateStr) {
        // 1) MERGE attendance record into ATTENDANCE table
        String mergeSql = "MERGE INTO ATTENDANCE a " +
                "USING (SELECT ? as roll_no, to_date(?, 'YYYY-MM-DD') as att_date, ? as status FROM dual) src " +
                "ON (a.ROLL_NO = src.roll_no AND a.ATTENDANCE_DATE = src.att_date) " +
                "WHEN MATCHED THEN UPDATE SET a.STATUS = src.status " +
                "WHEN NOT MATCHED THEN INSERT (ROLL_NO, ATTENDANCE_DATE, STATUS) VALUES (src.roll_no, src.att_date, src.status)";

        // 2) For absent: subtract 3% from OVERALL_ATTENDANCE (min 0)
        String absentSql = "UPDATE STUDENTS SET OVERALL_ATTENDANCE = GREATEST(OVERALL_ATTENDANCE - 3, 0) WHERE ROLL_NO = ?";

        // 3) For present: add 1% to OVERALL_ATTENDANCE only if < 100
        String presentSql = "UPDATE STUDENTS SET OVERALL_ATTENDANCE = LEAST(OVERALL_ATTENDANCE + 1, 100) WHERE ROLL_NO = ? AND OVERALL_ATTENDANCE < 100";

        try (Connection conn = DBUtil.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement mergeStmt = conn.prepareStatement(mergeSql);
                 PreparedStatement absentStmt = conn.prepareStatement(absentSql);
                 PreparedStatement presentStmt = conn.prepareStatement(presentSql)) {

                for (AttendanceRecord r : records) {
                    // Save attendance record
                    mergeStmt.setString(1, r.getRollNo());
                    mergeStmt.setString(2, dateStr);
                    mergeStmt.setString(3, r.getStatus());
                    mergeStmt.addBatch();

                    // Update OVERALL_ATTENDANCE based on status
                    if ("absent".equalsIgnoreCase(r.getStatus())) {
                        absentStmt.setString(1, r.getRollNo());
                        absentStmt.addBatch();
                    } else if ("present".equalsIgnoreCase(r.getStatus())) {
                        presentStmt.setString(1, r.getRollNo());
                        presentStmt.addBatch();
                    }
                }

                mergeStmt.executeBatch();
                absentStmt.executeBatch();
                presentStmt.executeBatch();
                conn.commit();
                return true;
            } catch (SQLException e) {
                conn.rollback();
                e.printStackTrace();
                return false;
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }
}
