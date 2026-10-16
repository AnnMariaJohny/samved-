package io.samved.task;
import com.fasterxml.jackson.databind.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;
class AiActionPlannerTest {
    private final ObjectMapper json=new ObjectMapper();
    private final AiActionPlanner planner=new AiActionPlanner("","unused",json);
    @Test void validatesExactlySevenUniqueBoundedActivities() {
        var value=json.createObjectNode().put("summary","A research week");var days=value.putArray("days");
        for(int i=0;i<7;i++)days.addObject().put("title","Research "+i).put("description","Save a paper summary").put("minutes",25);
        assertThat(planner.parse(value).steps()).hasSize(7);
        ((com.fasterxml.jackson.databind.node.ObjectNode)days.get(0)).put("minutes",400);
        assertThatThrownBy(()->planner.parse(value)).isInstanceOf(IllegalArgumentException.class);
        days.remove(0);assertThatThrownBy(()->planner.parse(value)).isInstanceOf(IllegalArgumentException.class);
    }
}
