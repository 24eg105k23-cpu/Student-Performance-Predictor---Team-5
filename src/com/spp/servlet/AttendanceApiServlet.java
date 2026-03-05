package com.spp.servlet;

import com.google.gson.Gson;
import com.spp.dao.AttendanceDAO;
import com.spp.model.AttendanceRecord;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.List;

@WebServlet("/api/attendance")
public class AttendanceApiServlet extends HttpServlet {

    private AttendanceDAO attendanceDAO = new AttendanceDAO();
    private Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }

        try {
            AttendanceRequest payload = gson.fromJson(sb.toString(), AttendanceRequest.class);
            if (payload == null || payload.date == null || payload.records == null) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\": \"Invalid request\"}");
                return;
            }

            boolean success = attendanceDAO.saveAttendance(payload.records, payload.date);

            if (success) {
                resp.getWriter().write("{\"status\": \"success\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                resp.getWriter().write("{\"error\": \"Failed to merge attendance records\"}");
            }
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    private class AttendanceRequest {
        String date;
        List<AttendanceRecord> records;
    }
}
