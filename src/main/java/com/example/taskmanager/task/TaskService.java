package com.example.taskmanager.task;

import com.example.taskmanager.project.ProjectEntity;
import com.example.taskmanager.project.ProjectRepository;
import com.example.taskmanager.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class TaskService {

  private final TaskRepository tasks;
  private final ProjectRepository projects;
  private final UserRepository users;

  @Transactional
  public TaskEntity create(
      Long projectId,
      String title,
      String details,
      TaskEntity.Status status,
      Instant dueAt,
      String assigneeUsername) {

    ProjectEntity project = projects.findById(projectId).orElseThrow();

    TaskEntity.TaskEntityBuilder builder = TaskEntity.builder()
        .project(project)
        .title(title)
        .details(details)
        .status(status)
        .dueAt(dueAt);

    if (assigneeUsername != null && !assigneeUsername.isBlank()) {
      users.findByUsername(assigneeUsername).ifPresent(builder::assignee);
    }

    return tasks.save(builder.build());
  }
}
