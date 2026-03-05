package com.spp.servlet;

import com.google.gson.Gson;
import com.spp.dao.AssessmentDAO;
import com.spp.model.Assessment;

import java.util.HashMap;
import java.util.Map;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.BufferedReader;
import java.io.IOException;

@WebServlet("/api/assessments")
public class AssessmentApiServlet extends HttpServlet {

    private AssessmentDAO assessmentDAO = new AssessmentDAO();
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
            AssessmentRequest payload = gson.fromJson(sb.toString(), AssessmentRequest.class);
            if (payload == null || payload.rollNo == null) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                Map<String, String> errMap = new HashMap<>();
                errMap.put("error", "Invalid request payload");
                resp.getWriter().write(gson.toJson(errMap));
                return;
            }

            Assessment assessment = new Assessment();
            assessment.setType(payload.assessmentType);
            assessment.setSubject(payload.subject);
            assessment.setScore(payload.score);
            assessment.setMaxScore(payload.maxScore);

            boolean success = assessmentDAO.saveAssessment(assessment, payload.rollNo);

            Map<String, String> responseMap = new HashMap<>();

            if (success) {
                responseMap.put("status", "success");
            } else {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                responseMap.put("error", "Database insertion failed");
            }
            resp.getWriter().write(gson.toJson(responseMap));

        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            Map<String, String> errorMap = new HashMap<>();
            errorMap.put("error", "SQL DB Error: " + e.getMessage());
            resp.getWriter().write(gson.toJson(errorMap));
        }
    }

    private class AssessmentRequest {
        String rollNo;
        String assessmentType;
        String subject;
        double score;
        double maxScore;
    }
}
