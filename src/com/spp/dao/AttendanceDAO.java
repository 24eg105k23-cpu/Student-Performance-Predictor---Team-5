package com.spp.dao;

import com.spp.model.AttendanceRecord;
import com.spp.util.DBUtil;

import java.sql.Connection;
import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.util.List;

public class AttendanceDAO {

    public boolean saveAttendance(List<AttendanceRecord> records, String dateStr) {
        // Expected dateStr format "YYYY-MM-DD"
        String sql = "MERGE INTO ATTENDANCE a " +
                "USING (SELECT ? as roll_no, to_date(?, 'YYYY-MM-DD') as att_date, ? as status FROM dual) src " +
                "ON (a.ROLL_NO = src.roll_no AND a.ATTENDANCE_DATE = src.att_date) " +
                "WHEN MATCHED THEN UPDATE SET a.STATUS = src.status " +
                "WHEN NOT MATCHED THEN INSERT (ROLL_NO, ATTENDANCE_DATE, STATUS) VALUES (src.roll_no, src.att_date, src.status)";

        try (Connection conn = DBUtil.getConnection()) {
            conn.setAutoCommit(false);
            try (PreparedStatement stmt = conn.prepareStatement(sql)) {
                for (AttendanceRecord r : records) {
                    stmt.setString(1, r.getRollNo());
                    stmt.setString(2, dateStr);
                    stmt.setString(3, r.getStatus());
                    stmt.addBatch();
                }
                stmt.executeBatch();
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
