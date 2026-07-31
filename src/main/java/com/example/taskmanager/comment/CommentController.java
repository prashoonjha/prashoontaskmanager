package com.example.taskmanager.comment;

import com.example.taskmanager.common.AccessGuard;
import com.example.taskmanager.task.TaskEntity;
import com.example.taskmanager.user.UserEntity;
import com.example.taskmanager.user.UserRepository;
import com.example.taskmanager.util.PageableUtils;
import jakarta.validation.Valid;
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
@RequestMapping("/api/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class CommentController {

  private final CommentRepository repo;
  private final UserRepository users;
  private final AccessGuard access;

  @GetMapping
  public Page<CommentResponse> list(
      @PathVariable Long taskId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size) {

    access.requireTask(taskId);
    Pageable pageable = PageableUtils.of(page, size, "createdAt", "asc");
    return repo.findByTaskId(taskId, pageable).map(CommentResponse::from);
  }

  @PostMapping
  public ResponseEntity<CommentResponse> create(
      @PathVariable Long taskId,
      @Valid @RequestBody CommentReq req) {

    TaskEntity task = access.requireTask(taskId);
    UserEntity author = users.findByUsername(access.currentUsername())
        .orElseThrow(() -> new IllegalStateException("Current user no longer exists"));

    CommentEntity comment = CommentEntity.builder()
        .body(req.getBody())
        .task(task)
        .author(author)
        .build();

    return ResponseEntity.status(HttpStatus.CREATED)
        .body(CommentResponse.from(repo.save(comment)));
  }

  @DeleteMapping("/{commentId}")
  public ResponseEntity<Void> delete(
      @PathVariable Long taskId,
      @PathVariable Long commentId) {

    CommentEntity comment = access.requireComment(taskId, commentId);

    // only the author may delete their own comment
    if (!comment.getAuthor().getUsername().equals(access.currentUsername())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your comment");
    }

    repo.delete(comment);
    return ResponseEntity.noContent().build();
  }

  @Data
  static class CommentReq {
    @NotBlank
    private String body;
  }

  public record CommentResponse(Long id, String body, Instant createdAt, String authorUsername) {
    static CommentResponse from(CommentEntity c) {
      return new CommentResponse(
          c.getId(),
          c.getBody(),
          c.getCreatedAt(),
          c.getAuthor() != null ? c.getAuthor().getUsername() : null);
    }
  }
}
