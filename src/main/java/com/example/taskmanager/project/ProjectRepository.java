package com.example.taskmanager.project;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProjectRepository extends JpaRepository<ProjectEntity, Long> {

  // projects belonging to a specific user
  Page<ProjectEntity> findByOwner_Username(String username, Pageable pageable);

  Optional<ProjectEntity> findByIdAndOwner_Username(Long id, String username);

  boolean existsByIdAndOwner_Username(Long id, String username);
}
