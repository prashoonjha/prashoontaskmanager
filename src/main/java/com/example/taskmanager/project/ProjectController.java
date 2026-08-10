package com.example.taskmanager.project;

import com.example.taskmanager.common.AccessGuard;
import com.example.taskmanager.user.UserEntity;
import com.example.taskmanager.user.UserRepository;
import com.example.taskmanager.util.PageableUtils;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

  private final ProjectRepository repo;
  private final UserRepository users;
  private final AccessGuard access;

  @GetMapping
  public Page<ProjectEntity> list(
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(required = false) String sortBy,
      @RequestParam(required = false) String dir) {

    Pageable pageable = PageableUtils.of(page, size, sortBy, dir);
    return repo.findByOwner_Username(access.currentUsername(), pageable);
  }

  @PostMapping
  public ResponseEntity<ProjectEntity> create(@RequestBody ProjectReq req) {
    UserEntity owner = users.findByUsername(access.currentUsername())
        .orElseThrow(() -> new IllegalStateException("Current user no longer exists"));

    ProjectEntity project = ProjectEntity.builder()
        .name(req.getName())
        .description(req.getDescription())
        .owner(owner)
        .build();

    return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(project));
  }

  @GetMapping("/{id}")
  public ProjectEntity get(@PathVariable Long id) {
    return access.requireProject(id);
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    ProjectEntity project = access.requireProject(id);
    repo.delete(project);
    return ResponseEntity.noContent().build();
  }

  @Data
  static class ProjectReq {
    @NotBlank
    private String name;
    private String description;
  }
}
