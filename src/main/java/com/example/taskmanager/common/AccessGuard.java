package com.example.taskmanager.common;

import com.example.taskmanager.comment.CommentEntity;
import com.example.taskmanager.comment.CommentRepository;
import com.example.taskmanager.project.ProjectEntity;
import com.example.taskmanager.project.ProjectRepository;
import com.example.taskmanager.task.TaskEntity;
import com.example.taskmanager.task.TaskRepository;
import com.example.taskmanager.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
@RequiredArgsConstructor
public class AccessGuard {

  private final ProjectRepository projects;
  private final TaskRepository tasks;
  private final CommentRepository comments;

  private String requireUsername() {
    String username = SecurityUtils.currentUsername();
    if (username == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }
    return username;
  }

  private ResponseStatusException notFound(String what) {
    return new ResponseStatusException(HttpStatus.NOT_FOUND, what + " not found");
  }

  public String currentUsername() {
    return requireUsername();
  }

  public ProjectEntity requireProject(Long projectId) {
    String username = requireUsername();
    return projects.findByIdAndOwner_Username(projectId, username)
        .orElseThrow(() -> notFound("Project"));
  }

  public TaskEntity requireTask(Long projectId, Long taskId) {
    requireProject(projectId);
    TaskEntity task = tasks.findById(taskId).orElseThrow(() -> notFound("Task"));
    if (!task.getProject().getId().equals(projectId)) {
      throw notFound("Task");
    }
    return task;
  }

  public TaskEntity requireTask(Long taskId) {
    String username = requireUsername();
    TaskEntity task = tasks.findById(taskId).orElseThrow(() -> notFound("Task"));
    if (!task.getProject().getOwner().getUsername().equals(username)) {
      throw notFound("Task");
    }
    return task;
  }

  public CommentEntity requireComment(Long taskId, Long commentId) {
    requireTask(taskId);
    CommentEntity comment = comments.findById(commentId)
        .orElseThrow(() -> notFound("Comment"));
    if (!comment.getTask().getId().equals(taskId)) {
      throw notFound("Comment");
    }
    return comment;
  }
}
