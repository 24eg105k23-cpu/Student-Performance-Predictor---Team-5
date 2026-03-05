package com.spp.model;

import java.util.List;
import java.util.ArrayList;

public class Student {
    private String id; // Matches frontend 'id', we map ROLL_NO here
    private String rollNo;
    private String name;
    private int performanceScore;
    private int attendanceRate;
    private String status;
    private String trend;
    private String lastUpdated;
    private boolean interventionNeeded;
    private List<Assessment> recentAssessments = new ArrayList<>();
    private List<String> riskFactors = new ArrayList<>();

    public Student() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getRollNo() {
        return rollNo;
    }

    public void setRollNo(String rollNo) {
        this.rollNo = rollNo;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getPerformanceScore() {
        return performanceScore;
    }

    public void setPerformanceScore(int performanceScore) {
        this.performanceScore = performanceScore;
    }

    public int getAttendanceRate() {
        return attendanceRate;
    }

    public void setAttendanceRate(int attendanceRate) {
        this.attendanceRate = attendanceRate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTrend() {
        return trend;
    }

    public void setTrend(String trend) {
        this.trend = trend;
    }

    public String getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(String lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    public boolean isInterventionNeeded() {
        return interventionNeeded;
    }

    public void setInterventionNeeded(boolean interventionNeeded) {
        this.interventionNeeded = interventionNeeded;
    }

    public List<Assessment> getRecentAssessments() {
        return recentAssessments;
    }

    public void setRecentAssessments(List<Assessment> recentAssessments) {
        this.recentAssessments = recentAssessments;
    }

    public List<String> getRiskFactors() {
        return riskFactors;
    }

    public void setRiskFactors(List<String> riskFactors) {
        this.riskFactors = riskFactors;
    }
}
