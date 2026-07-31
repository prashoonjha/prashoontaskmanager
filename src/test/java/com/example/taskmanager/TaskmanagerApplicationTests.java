package com.example.taskmanager;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

/**
 * Boots the full application context against a real PostgreSQL container
 * (wired via {@link TestcontainersConfiguration}) to prove the app starts and
 * every bean resolves.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class TaskmanagerApplicationTests {

  @Test
  void contextLoads() {
  }
}
