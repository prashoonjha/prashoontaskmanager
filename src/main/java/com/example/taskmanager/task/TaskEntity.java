package com.example.taskmanager.task;

import com.example.taskmanager.project.ProjectEntity;
import com.example.taskmanager.user.UserEntity;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tasks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class TaskEntity {

  public enum Status {
    TODO,
    IN_PROGRESS,
    DONE
  }

  public enum Priority {
    LOW,
    MEDIUM,
    HIGH
  }

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 150)
  private String title;

  @Column(length = 1000)
  private String details;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Status status;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Priority priority;

  @ElementCollection(fetch = FetchType.EAGER)
  @CollectionTable(name = "task_labels", joinColumns = @JoinColumn(name = "task_id"))
  @Column(name = "label", length = 40)
  @Builder.Default
  private Set<String> labels = new HashSet<>();

  private Instant dueAt;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "project_id")
  @JsonIgnore
  private ProjectEntity project;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assignee_id")
  @JsonIgnore
  private UserEntity assignee;

  @Column(nullable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  public void prePersist() {
    if (createdAt == null) {
      createdAt = Instant.now();
    }
    if (status == null) {
      status = Status.TODO;
    }
    if (priority == null) {
      priority = Priority.MEDIUM;
    }
  }
}
