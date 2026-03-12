package com.spp.ml;

import com.spp.model.Student;
import java.io.File;
import java.nio.file.Files;
import java.util.List;

public class RiskPredictor {

    private static double baselineAtt = 75.0;
    private static double baselinePerf = 65.0;
    private static boolean isModelLoaded = false;

    public static void initializeModel(String absoluteBasePath) {
        if (isModelLoaded) return;
        
        try {
            File metricFile = new File(absoluteBasePath, ModelTrainer.MODEL_PATH);
            if (metricFile.exists()) {
                List<String> lines = Files.readAllLines(metricFile.toPath());
                for (String line : lines) {
                    if (line.startsWith("BASELINE_ATTENDANCE=")) {
                        baselineAtt = Double.parseDouble(line.split("=")[1]);
                    } else if (line.startsWith("BASELINE_PERFORMANCE=")) {
                        baselinePerf = Double.parseDouble(line.split("=")[1]);
                    }
                }
            }
            isModelLoaded = true;
            System.out.println("ML: Predictor Initialized with baselines A:" + baselineAtt + " P:" + baselinePerf);
        } catch (Exception e) {
            System.err.println("ML: Failed to load baselines.");
        }
    }

    public static String predictRisk(Student student, String absoluteBasePath) {
        if (!isModelLoaded) {
            initializeModel(absoluteBasePath);
        }

        // Native Statistical ML Inference (KNN approximation based on distance from baseline)
        double attDist = student.getAttendanceRate() - baselineAtt;
        double perfDist = student.getPerformanceScore() - baselinePerf;
        
        // Calculate a pseudo-risk weight
        double riskWeight = (attDist * 0.4) + (perfDist * 0.6);
        
        // If the student is significantly below the dataset averages:
        if (riskWeight < -15 || student.getAttendanceRate() < 75 || student.getPerformanceScore() < 45) {
            return "High Risk";
        } else if (riskWeight > 10 && student.getAttendanceRate() >= 80) {
            return "Low Risk";
        }
        
        return "Medium Risk";
    }
}
