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

/**
 * Central place for "does the current user own this thing?" checks.
 *
 * Ownership always chains up to the project owner: a task belongs to a project,
 * a comment belongs to a task belongs to a project. If the current user is not
 * the owner we throw 404 (not 403) on purpose, so callers can't probe which ids
 * exist by watching the status code.
 */
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

  /** The current user, or 401 if there is none. */
  public String currentUsername() {
    return requireUsername();
  }

  /** Load a project the current user owns, or 404. */
  public ProjectEntity requireProject(Long projectId) {
    String username = requireUsername();
    return projects.findByIdAndOwner_Username(projectId, username)
        .orElseThrow(() -> notFound("Project"));
  }

  /** Load a task within a project the current user owns, or 404. */
  public TaskEntity requireTask(Long projectId, Long taskId) {
    requireProject(projectId);
    TaskEntity task = tasks.findById(taskId).orElseThrow(() -> notFound("Task"));
    if (!task.getProject().getId().equals(projectId)) {
      throw notFound("Task");
    }
    return task;
  }

  /** Load a task the current user can reach (via project ownership), or 404. */
  public TaskEntity requireTask(Long taskId) {
    String username = requireUsername();
    TaskEntity task = tasks.findById(taskId).orElseThrow(() -> notFound("Task"));
    if (!task.getProject().getOwner().getUsername().equals(username)) {
      throw notFound("Task");
    }
    return task;
  }

  /** Load a comment within a task the current user can reach, or 404. */
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
