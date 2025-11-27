package com.example.taskmanager.user;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

public class UserServiceTest {
  @Test
  void register_encodesPassword_andSaves() {
    var repo = Mockito.mock(UserRepository.class);
    var enc = Mockito.mock(PasswordEncoder.class);
    when(repo.existsByUsername("alice")).thenReturn(false);
    when(enc.encode("pw")).thenReturn("ENC");
    when(repo.save(any())).thenAnswer(a -> a.getArgument(0));

    var svc = new UserService(repo, enc);
    var user = svc.register("alice", "pw");
    assertThat(user.getPasswordHash()).isEqualTo("ENC");
  }
}
