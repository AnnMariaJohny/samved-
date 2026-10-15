package io.samved.roadmap;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** One safe roadmap.sh catalogue summary saved after the first Parse request. */
@Entity
@Table(name = "roadmap_catalogue_entries")
public class RoadmapCatalogueEntry {
    @Id @Column(length = 100)
    private String id;
    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
    @Column(nullable = false, length = 160)
    private String title;
    @Column(nullable = false, length = 500)
    private String description;
    @Column(nullable = false, length = 260)
    private String url;
    @Column(name = "tags_json", nullable = false, length = 2000)
    private String tagsJson;
    @Column(name = "updated_at", nullable = false, length = 80)
    private String updatedAt;

    protected RoadmapCatalogueEntry() { }

    public RoadmapCatalogueEntry(ParseRoadmapCatalogue.RoadmapSummary item, int order, String tagsJson) {
        this.id = item.id();
        this.sortOrder = order;
        this.title = item.title();
        this.description = item.description();
        this.url = item.url();
        this.tagsJson = tagsJson;
        this.updatedAt = item.updatedAt();
    }

    public String getId() { return id; }
    public int getSortOrder() { return sortOrder; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getUrl() { return url; }
    public String getTagsJson() { return tagsJson; }
    public String getUpdatedAt() { return updatedAt; }
}
