package com.example.taskmanager.user;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository repo;
  private final PasswordEncoder encoder;

  @Transactional
  public UserEntity register(String username, String rawPassword) {
    if (repo.existsByUsername(username)) {
      throw new IllegalArgumentException("Username taken");
    }

    UserEntity user = UserEntity.builder()
        .username(username)
        .passwordHash(encoder.encode(rawPassword))
        .role(Role.USER)
        .build();

    return repo.save(user);
  }
}
