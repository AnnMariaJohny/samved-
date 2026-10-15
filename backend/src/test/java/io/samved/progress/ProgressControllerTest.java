package io.samved.progress;

import io.samved.common.StudentContext;
import io.samved.roadmap.MilestoneStatus;
import io.samved.roadmap.Roadmap;
import io.samved.roadmap.RoadmapMilestoneRepository;
import io.samved.roadmap.RoadmapRepository;
import io.samved.task.LearningTaskRepository;
import io.samved.task.TaskStatus;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class ProgressControllerTest {
    @Test
    void zeroRecordsProduceZeroPercent() {
        StudentContext context = mock(StudentContext.class);
        RoadmapRepository roadmaps = mock(RoadmapRepository.class);
        RoadmapMilestoneRepository milestones = mock(RoadmapMilestoneRepository.class);
        LearningTaskRepository tasks = mock(LearningTaskRepository.class);
        when(context.requireStudentId()).thenReturn(7L);
        when(roadmaps.findByStudentIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());
        ProgressController.ProgressView result = new ProgressController(context, roadmaps, milestones, tasks).mine();
        assertEquals(0, result.percent());
        assertEquals(0, result.total());
    }

    @Test
    void countsOnlySignedInStudentsTasks() {
        StudentContext context = mock(StudentContext.class);
        RoadmapRepository roadmaps = mock(RoadmapRepository.class);
        RoadmapMilestoneRepository milestones = mock(RoadmapMilestoneRepository.class);
        LearningTaskRepository tasks = mock(LearningTaskRepository.class);
        when(context.requireStudentId()).thenReturn(7L);
        when(roadmaps.findByStudentIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());
        when(tasks.countByStudentId(7L)).thenReturn(3L);
        when(tasks.countByStudentIdAndStatus(7L, TaskStatus.COMPLETED)).thenReturn(2L);
        ProgressController.ProgressView result = new ProgressController(context, roadmaps, milestones, tasks).mine();
        assertEquals(67, result.percent());
        assertEquals(2, result.completed());
        verify(tasks, never()).countByStudentId(8L);
    }
}
