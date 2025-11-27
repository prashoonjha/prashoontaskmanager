package com.example.taskmanager;

import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootTest
@ActiveProfiles("dev")
class IntegrationTest {
  @Autowired
  DataSource ds;

  @Test
  void contextLoads_andDbAccessible() throws Exception {
    try (Connection c = ds.getConnection()) {
      Assertions.assertNotNull(c);
    }
  }
}
