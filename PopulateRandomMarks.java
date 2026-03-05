import com.spp.dao.AssessmentDAO;
import com.spp.dao.StudentDAO;
import com.spp.model.Assessment;
import com.spp.model.Student;

import java.util.List;
import java.util.Random;

public class PopulateRandomMarks {
    public static void main(String[] args) {
        System.out.println("Starting to populate random marks...");
        try {
            StudentDAO studentDAO = new StudentDAO();
            AssessmentDAO assessmentDAO = new AssessmentDAO();
            List<Student> students = studentDAO.getAllStudents();
            Random rand = new Random();

            String subject = "Computer Oriented Statistical Methods";
            String[] types = { "mid1" };
            double[] maxs = { 20.0 };

            int count = 0;
            for (Student s : students) {
                for (int i = 0; i < types.length; i++) {
                    Assessment a = new Assessment();
                    a.setType(types[i]);
                    a.setSubject(subject);
                    a.setMaxScore(maxs[i]);

                    // Generate random integer score (no float values)
                    // nextInt(bound) returns between 0 (inclusive) and bound (exclusive)
                    int score = rand.nextInt((int) maxs[i] + 1);
                    a.setScore((double) score);

                    boolean success = assessmentDAO.saveAssessment(a, s.getRollNo());
                    if (success) {
                        count++;
                    } else {
                        System.err.println("Failed to save for " + s.getRollNo() + " " + types[i]);
                    }
                }
            }
            System.out.println("Finished! Inserted " + count + " random manual assessments for " + subject);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
