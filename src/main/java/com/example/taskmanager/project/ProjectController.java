package com.example.taskmanager.project;

import com.example.taskmanager.user.UserEntity;
import com.example.taskmanager.user.UserRepository;
import com.example.taskmanager.util.PageableUtils;
import com.example.taskmanager.util.SecurityUtils;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

  private final ProjectRepository repo;
  private final UserRepository users;

  @GetMapping
  public Page<ProjectEntity> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) String dir) {

    Pageable pageable = PageableUtils.of(page, size, sortBy, dir);

    // tie projects to the currently logged-in user
    String username = SecurityUtils.currentUsername();
    if (username == null) {

      return Page.empty(pageable);
    }

    return repo.findByOwner_Username(username, pageable);
  }

  @PostMapping
  public ResponseEntity<?> create(@RequestBody ProjectReq req) {
    // who is logged in?
    String username = SecurityUtils.currentUsername();

    // if no JWT / not logged in -> clear error instead of "no value present"
    if (username == null) {
      return ResponseEntity
          .status(HttpStatus.UNAUTHORIZED)
          .body(Map.of("message", "Not authenticated"));
    }

    UserEntity owner = users.findByUsername(username)
        .orElseThrow(() -> new IllegalStateException("User not found: " + username));

    ProjectEntity project = ProjectEntity.builder()
        .name(req.getName())
        .description(req.getDescription())
        .owner(owner)
        .build();

    return ResponseEntity.ok(repo.save(project));
  }

  @GetMapping("/{id}")
  public ResponseEntity<ProjectEntity> get(@PathVariable Long id) {
    return repo.findById(id)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<?> delete(@PathVariable Long id) {
    repo.deleteById(id);
    return ResponseEntity.noContent().build();
  }

  @Data
  static class ProjectReq {
    @NotBlank
    private String name;
    private String description;
  }
}
