package io.samved.roadmap;

import io.samved.common.ApiException;
import io.samved.common.StudentContext;
import io.samved.common.StudentProfilePort;
import io.samved.common.StudentSnapshot;
import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RoadmapServiceTest {
    @Test
    void offersVerifiedExternalLinksOnlyForMatchingPaths() {
        RoadmapRepository roadmaps = mock(RoadmapRepository.class);
        RoadmapMilestoneRepository milestones = mock(RoadmapMilestoneRepository.class);
        StudentContext context = mock(StudentContext.class);
        StudentProfilePort profiles = mock(StudentProfilePort.class);
        when(context.requireStudentId()).thenReturn(12L);
        Roadmap data = mock(Roadmap.class);
        when(data.getId()).thenReturn(1L);
        when(data.getTemplateCode()).thenReturn("DATA");
        Roadmap medicine = mock(Roadmap.class);
        when(medicine.getId()).thenReturn(2L);
        when(medicine.getTemplateCode()).thenReturn("MEDICINE");
        when(roadmaps.findByStudentIdOrderByCreatedAtDesc(12L)).thenReturn(List.of(data, medicine));
        RoadmapService service = new RoadmapService(roadmaps, milestones, context, profiles);

        List<RoadmapService.RoadmapView> views = service.mine();

        assertEquals(2, views.get(0).externalResources().size());
        assertEquals("https://roadmap.sh/data-analyst", views.get(0).externalResources().get(0).url());
        assertTrue(views.get(1).externalResources().isEmpty());
        verifyNoInteractions(profiles);
    }

    @Test
    void rejectsUnknownTemplateBeforePersisting() {
        RoadmapRepository roadmaps = mock(RoadmapRepository.class);
        RoadmapMilestoneRepository milestones = mock(RoadmapMilestoneRepository.class);
        StudentContext context = mock(StudentContext.class);
        StudentProfilePort profiles = mock(StudentProfilePort.class);
        when(context.requireStudentId()).thenReturn(12L);
        when(profiles.snapshot(12L)).thenReturn(new StudentSnapshot("UNDERGRADUATE", "EXPLORING", null,
            List.of(), List.of(), List.of(), List.of()));
        RoadmapService service = new RoadmapService(roadmaps, milestones, context, profiles);
        assertThrows(ApiException.class, () -> service.create(new RoadmapService.CreateRoadmap("NONEXISTENT", "Test")));
        verifyNoInteractions(roadmaps, milestones);
    }
}
