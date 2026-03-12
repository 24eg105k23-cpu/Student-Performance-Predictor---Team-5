package com.spp.servlet;

import com.spp.dao.StudentDAO;
import com.spp.ml.ModelTrainer;
import com.spp.model.Student;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet("/api/ml/train")
public class MLTrainingServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        PrintWriter out = resp.getWriter();

        try {
            // 1. Fetch historical student data to use as the training baseline
            StudentDAO dao = new StudentDAO();
            List<Student> students = dao.getAllStudents();

            // 2. Resolve true absolute path for the webapp
            String absoluteBasePath = getServletContext().getRealPath("/");
            
            // 3. Trigger Model Generation
            ModelTrainer.trainAndSaveModel(students, absoluteBasePath);

            // 4. Send Success Response
            out.print("{\"status\":\"success\", \"message\":\"ML Model trained and saved successfully!\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            out.print("{\"status\":\"error\", \"message\":\"Failed to train ML Model: " + e.getMessage() + "\"}");
        }
        out.flush();
    }
}
