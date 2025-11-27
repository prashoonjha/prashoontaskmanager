package com.example.taskmanager.comment;

import com.example.taskmanager.task.TaskEntity;
import com.example.taskmanager.task.TaskRepository;
import com.example.taskmanager.user.UserEntity;
import com.example.taskmanager.user.UserRepository;
import com.example.taskmanager.util.PageableUtils;
import com.example.taskmanager.util.SecurityUtils;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class CommentController {

  private final CommentRepository repo;
  private final TaskRepository tasks;
  private final UserRepository users;

  @GetMapping
  public Page<CommentEntity> list(
      @PathVariable Long taskId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {

    Pageable pageable = PageableUtils.of(page, size, "createdAt", "asc");
    return repo.findByTaskId(taskId, pageable);
  }

  @PostMapping
  public ResponseEntity<CommentEntity> create(
      @PathVariable Long taskId,
      @RequestBody CommentReq req) {

    TaskEntity task = tasks.findById(taskId).orElseThrow();
    String username = SecurityUtils.currentUsername();
    UserEntity author = users.findByUsername(username).orElseThrow();

    CommentEntity c = CommentEntity.builder()
        .body(req.getBody())
        .task(task)
        .author(author)
        .build();

    return ResponseEntity.ok(repo.save(c));
  }

  @DeleteMapping("/{commentId}")
  public ResponseEntity<?> delete(@PathVariable Long commentId) {
    repo.deleteById(commentId);
    return ResponseEntity.noContent().build();
  }

  @Data
  static class CommentReq {
    @NotBlank
    private String body;
  }
}
