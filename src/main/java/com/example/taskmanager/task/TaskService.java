package com.example.taskmanager.task;

import com.example.taskmanager.project.ProjectEntity;
import com.example.taskmanager.project.ProjectRepository;
import com.example.taskmanager.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskService {
  private final TaskRepository tasks;
  private final ProjectRepository projects;
  private final UserRepository users;

  @Transactional
  public TaskEntity create(Long projectId, String title, String details, TaskEntity.Status status,
      String assigneeUsername) {
    ProjectEntity p = projects.findById(projectId).orElseThrow();
    var builder = TaskEntity.builder().project(p).title(title).details(details).status(status);
    if (assigneeUsername != null) {
      users.findByUsername(assigneeUsername).ifPresent(builder::assignee);
    }
    return tasks.save(builder.build());
  }
}
