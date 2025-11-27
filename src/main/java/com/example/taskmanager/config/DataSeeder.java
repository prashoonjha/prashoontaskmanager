package com.example.taskmanager.config;

import com.example.taskmanager.user.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {
  private final UserRepository users;
  private final PasswordEncoder encoder;

  @Override
  public void run(String... args) {
    if (!users.existsByUsername("admin")) {
      var u = UserEntity.builder()
          .username("admin")
          .passwordHash(encoder.encode("admin123"))
          .role(Role.ADMIN)
          .build();
      users.save(u);
    }
  }
}
