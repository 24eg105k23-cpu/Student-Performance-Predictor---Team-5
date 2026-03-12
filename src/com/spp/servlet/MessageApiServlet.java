package com.spp.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.spp.dao.StudentDAO;
import com.spp.model.Student;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@WebServlet("/api/messages/send")
public class MessageApiServlet extends HttpServlet {

    // Twilio credentials - replace with your actual values
    private static final String ACCOUNT_SID = "YOUR_TWILIO_ACCOUNT_SID";
    private static final String AUTH_TOKEN  = "YOUR_TWILIO_AUTH_TOKEN";
    private static final String FROM_NUMBER = "YOUR_TWILIO_FROM_NUMBER";

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        PrintWriter out = resp.getWriter();

        try {
            // 1. Parse request body
            String body = req.getReader().lines().collect(Collectors.joining());
            JsonObject json = JsonParser.parseString(body).getAsJsonObject();
            String recipientGroup = json.get("recipient").getAsString();
            String messageBody = json.get("message").getAsString();

            if (messageBody == null || messageBody.trim().isEmpty()) {
                resp.setStatus(400);
                out.print("{\"status\":\"error\",\"message\":\"Message body is required\"}");
                out.flush();
                return;
            }

            if (ACCOUNT_SID == null || AUTH_TOKEN == null || FROM_NUMBER == null) {
                resp.setStatus(500);
                out.print("{\"status\":\"error\",\"message\":\"Twilio credentials not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER env vars in Tomcat setenv.bat\"}");
                out.flush();
                return;
            }

            // 2. Get all students and filter by group
            StudentDAO dao = new StudentDAO();
            List<Student> allStudents = dao.getAllStudents();
            List<Student> recipients = filterByGroup(allStudents, recipientGroup);

            int sent = 0;
            int failed = 0;
            List<String> errors = new ArrayList<>();

            // 3. Send SMS to each recipient via Twilio
            for (Student s : recipients) {
                String phone = s.getPhoneNumber();
                if (phone == null || phone.trim().isEmpty()) {
                    failed++;
                    errors.add(s.getRollNo() + ": No phone number");
                    continue;
                }

                boolean success = sendTwilioSMS(phone.trim(), messageBody);
                if (success) {
                    sent++;
                } else {
                    failed++;
                    errors.add(s.getRollNo() + ": Send failed");
                }
            }

            // 4. Return result
            JsonObject result = new JsonObject();
            result.addProperty("status", "success");
            result.addProperty("sent", sent);
            result.addProperty("failed", failed);
            result.addProperty("total", recipients.size());
            out.print(new Gson().toJson(result));

        } catch (Exception e) {
            java.io.StringWriter sw = new java.io.StringWriter();
            e.printStackTrace(new java.io.PrintWriter(sw));
            resp.setStatus(500);
            out.print("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
        out.flush();
    }

    private List<Student> filterByGroup(List<Student> students, String group) {
        switch (group) {
            case "at-risk":
                return students.stream()
                        .filter(s -> "at-risk".equals(s.getStatus()))
                        .collect(Collectors.toList());
            case "low-attendance":
                return students.stream()
                        .filter(s -> s.getAttendanceRate() < 75)
                        .collect(Collectors.toList());
            case "excellent":
                return students.stream()
                        .filter(s -> "excellent".equals(s.getStatus()))
                        .collect(Collectors.toList());
            case "all":
            default:
                return students;
        }
    }

    private boolean sendTwilioSMS(String toNumber, String messageBody) {
        try {
            String urlStr = "https://api.twilio.com/2010-04-01/Accounts/"
                    + ACCOUNT_SID + "/Messages.json";

            // Build form data
            String data = "To=" + URLEncoder.encode(toNumber, "UTF-8")
                    + "&From=" + URLEncoder.encode(FROM_NUMBER, "UTF-8")
                    + "&Body=" + URLEncoder.encode(messageBody, "UTF-8");

            // Create connection
            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);

            // Basic Auth header
            String auth = ACCOUNT_SID + ":" + AUTH_TOKEN;
            String encoded = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
            conn.setRequestProperty("Authorization", "Basic " + encoded);
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

            // Send data
            try (OutputStream os = conn.getOutputStream()) {
                os.write(data.getBytes(StandardCharsets.UTF_8));
            }

            int responseCode = conn.getResponseCode();
            System.out.println("Twilio SMS to " + toNumber + " => HTTP " + responseCode);

            return responseCode == 201 || responseCode == 200;

        } catch (Exception e) {
            System.err.println("Twilio SMS Error: " + e.getMessage());
            return false;
        }
    }
}
