package io.samved.career;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

/** An original SAMVED career summary and its broad starter skills. */
@Entity
@Table(name = "careers")
public class Career {
    @Id
    @Column(length = 80)
    private String id;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, length = 600)
    private String summary;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "career_interests", joinColumns = @JoinColumn(name = "career_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "interest", nullable = false, length = 100)
    private List<String> interests = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "career_required_skills", joinColumns = @JoinColumn(name = "career_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "skill", nullable = false, length = 100)
    private List<String> requiredSkills = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "career_strengths", joinColumns = @JoinColumn(name = "career_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "strength", nullable = false, length = 100)
    private List<String> strengths = new ArrayList<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "career_values", joinColumns = @JoinColumn(name = "career_id"))
    @OrderColumn(name = "sort_order")
    @Column(name = "career_value", nullable = false, length = 100)
    private List<String> values = new ArrayList<>();

    protected Career() { }

    Career(String id, String title, String summary, List<String> interests,
           List<String> requiredSkills, List<String> strengths, List<String> values) {
        this.id = id;
        this.title = title;
        this.summary = summary;
        this.interests = new ArrayList<>(interests);
        this.requiredSkills = new ArrayList<>(requiredSkills);
        this.strengths = new ArrayList<>(strengths);
        this.values = new ArrayList<>(values);
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public String getSummary() { return summary; }
    public List<String> getInterests() { return List.copyOf(interests); }
    public List<String> getRequiredSkills() { return List.copyOf(requiredSkills); }
    public List<String> getStrengths() { return List.copyOf(strengths); }
    public List<String> getValues() { return List.copyOf(values); }
}
