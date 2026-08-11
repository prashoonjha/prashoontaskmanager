package com.example.taskmanager.task;

import com.example.taskmanager.common.AccessGuard;
import com.example.taskmanager.task.TaskEntity.Priority;
import com.example.taskmanager.task.TaskEntity.Status;
import com.example.taskmanager.util.PageableUtils;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
@RequiredArgsConstructor
public class TaskController {

  private final TaskRepository repo;
  private final TaskService service;
  private final AccessGuard access;

  @GetMapping
  public Page<TaskEntity> list(
      @PathVariable Long projectId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(required = false) Status status,
      @RequestParam(required = false) Priority priority,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) String dir) {

    access.requireProject(projectId);
    Pageable pageable = PageableUtils.of(page, size, sortBy, dir);

    if (status != null && priority != null) {
      return repo.findByProjectIdAndStatusAndPriority(projectId, status, priority, pageable);
    }
    if (status != null) {
      return repo.findByProjectIdAndStatus(projectId, status, pageable);
    }
    if (priority != null) {
      return repo.findByProjectIdAndPriority(projectId, priority, pageable);
    }
    return repo.findByProjectId(projectId, pageable);
  }

  @PostMapping
  public ResponseEntity<TaskEntity> create(
      @PathVariable Long projectId,
      @RequestBody TaskReq req) {

    access.requireProject(projectId);
    Status status = (req.getStatus() != null) ? req.getStatus() : Status.TODO;

    TaskEntity task = service.create(
        projectId,
        req.getTitle(),
        req.getDetails(),
        status,
        req.getPriority(),
        req.getLabels(),
        req.getDueAt(),
        req.getAssigneeUsername());

    return ResponseEntity.status(HttpStatus.CREATED).body(task);
  }

  @PatchMapping("/{taskId}")
  public ResponseEntity<TaskEntity> update(
      @PathVariable Long projectId,
      @PathVariable Long taskId,
      @RequestBody TaskUpdateReq req) {

    TaskEntity task = access.requireTask(projectId, taskId);

    if (req.getTitle() != null) {
      task.setTitle(req.getTitle());
    }
    if (req.getDetails() != null) {
      task.setDetails(req.getDetails());
    }
    if (req.getStatus() != null) {
      task.setStatus(req.getStatus());
    }
    if (req.getPriority() != null) {
      task.setPriority(req.getPriority());
    }
    if (req.getLabels() != null) {
      task.setLabels(new HashSet<>(req.getLabels()));
    }
    if (req.getDueAt() != null) {
      task.setDueAt(req.getDueAt());
    }

    return ResponseEntity.ok(repo.save(task));
  }

  @DeleteMapping("/{taskId}")
  public ResponseEntity<?> delete(
      @PathVariable Long projectId,
      @PathVariable Long taskId) {

    TaskEntity task = access.requireTask(projectId, taskId);
    repo.delete(task);
    return ResponseEntity.noContent().build();
  }

  @Data
  static class TaskReq {
    @NotBlank
    private String title;
    private String details;
    private Status status;
    private Priority priority;
    private Set<String> labels;
    private Instant dueAt;
    private String assigneeUsername;
  }

  @Data
  static class TaskUpdateReq {
    private String title;
    private String details;
    private Status status;
    private Priority priority;
    private Set<String> labels;
    private Instant dueAt;
  }
}
