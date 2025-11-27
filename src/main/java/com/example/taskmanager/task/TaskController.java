package com.example.taskmanager.task;

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
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
@RequiredArgsConstructor
public class TaskController {

  private final TaskRepository repo;
  private final TaskService service;

  @GetMapping
  public Page<TaskEntity> list(
      @PathVariable Long projectId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(required = false) Status status,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) String dir) {

    Pageable pageable = PageableUtils.of(page, size, sortBy, dir);

    if (status != null) {
      return repo.findByProjectIdAndStatus(projectId, status, pageable);
    }
    return repo.findByProjectId(projectId, pageable);
  }

  @PostMapping
  public ResponseEntity<TaskEntity> create(
      @PathVariable Long projectId,
      @RequestBody TaskReq req) {

    Status status = (req.getStatus() != null) ? req.getStatus() : Status.TODO;

    TaskEntity task = service.create(
        projectId,
        req.getTitle(),
        req.getDetails(),
        status,
        req.getAssigneeUsername());

    return ResponseEntity.status(HttpStatus.CREATED).body(task);
  }

  @PatchMapping("/{taskId}")
  public ResponseEntity<TaskEntity> update(
      @PathVariable Long projectId,
      @PathVariable Long taskId,
      @RequestBody TaskUpdateReq req) {

    TaskEntity task = repo.findById(taskId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

    if (!task.getProject().getId().equals(projectId)) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Task does not belong to this project");
    }

    // Only update the fields that were actually sent in the request
    if (req.getTitle() != null) {
      task.setTitle(req.getTitle());
    }
    if (req.getDetails() != null) {
      task.setDetails(req.getDetails());
    }
    if (req.getStatus() != null) {
      task.setStatus(req.getStatus());
    }
    if (req.getDueAt() != null) {
      task.setDueAt(req.getDueAt());
    }

    TaskEntity saved = repo.save(task);
    return ResponseEntity.ok(saved);
  }

  @DeleteMapping("/{taskId}")
  public ResponseEntity<?> delete(@PathVariable Long taskId) {
    repo.deleteById(taskId);
    return ResponseEntity.noContent().build();
  }

  @Data
  static class TaskReq {
    @NotBlank
    private String title;
    private String details;
    private Status status;
    private Instant dueAt;
    private String assigneeUsername;
  }

  @Data
  static class TaskUpdateReq {
    private String title;
    private String details;
    private Status status;
    private Instant dueAt;
  }
}
