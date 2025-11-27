package com.example.taskmanager.task;

import com.example.taskmanager.task.TaskEntity.Status;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<TaskEntity, Long> {
  Page<TaskEntity> findByProjectIdAndStatus(Long projectId, Status status, Pageable pageable);

  Page<TaskEntity> findByProjectId(Long projectId, Pageable pageable);
}
