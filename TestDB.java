import com.spp.dao.AssessmentDAO;
import com.spp.model.Assessment;

public class TestDB {
    public static void main(String[] args) {
        System.out.println("Starting TestDB...");
        try {
            AssessmentDAO dao = new AssessmentDAO();
            Assessment a = new Assessment();
            a.setType("mid1");
            a.setSubject("Web Technologies");
            a.setScore(15.0);
            a.setMaxScore(20.0);

            System.out.println("Attempting to save assessment...");
            boolean result = dao.saveAssessment(a, "24EG105K01");
            System.out.println("Result: " + result);
        } catch (Exception e) {
            e.printStackTrace();
        }
        System.out.println("Done.");
    }
}
