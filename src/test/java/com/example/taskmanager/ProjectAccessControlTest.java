package com.example.taskmanager;

import com.example.taskmanager.auth.JwtUtil;
import com.example.taskmanager.project.ProjectEntity;
import com.example.taskmanager.project.ProjectRepository;
import com.example.taskmanager.user.Role;
import com.example.taskmanager.user.UserEntity;
import com.example.taskmanager.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that project ownership is enforced: a user must not be able to read
 * another user's project by guessing its id. This is the regression test for the
 * IDOR issue where any authenticated user could reach any resource.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ProjectAccessControlTest {

  @Autowired
  MockMvc mvc;
  @Autowired
  UserRepository users;
  @Autowired
  ProjectRepository projects;
  @Autowired
  PasswordEncoder encoder;
  @Autowired
  JwtUtil jwtUtil;

  private Long alicesProjectId;
  private String bobToken;

  @BeforeEach
  void setup() {
    projects.deleteAll();
    users.deleteAll();

    UserEntity alice = users.save(UserEntity.builder()
        .username("alice").passwordHash(encoder.encode("pw")).role(Role.USER).build());
    UserEntity bob = users.save(UserEntity.builder()
        .username("bob").passwordHash(encoder.encode("pw")).role(Role.USER).build());

    ProjectEntity alicesProject = projects.save(ProjectEntity.builder()
        .name("Alice private").owner(alice).build());

    alicesProjectId = alicesProject.getId();
    bobToken = jwtUtil.generateAccessToken(bob.getUsername());
  }

  @Test
  void owner_canReadOwnProject() throws Exception {
    String aliceToken = jwtUtil.generateAccessToken("alice");
    mvc.perform(get("/api/projects/" + alicesProjectId)
            .header("Authorization", "Bearer " + aliceToken))
        .andExpect(status().isOk());
  }

  @Test
  void nonOwner_getsNotFound_forSomeoneElsesProject() throws Exception {
    // Bob must not be able to read Alice's project; 404 (not 403) so ids can't be probed
    mvc.perform(get("/api/projects/" + alicesProjectId)
            .header("Authorization", "Bearer " + bobToken))
        .andExpect(status().isNotFound());
  }

  @Test
  void unauthenticated_getsUnauthorized() throws Exception {
    mvc.perform(get("/api/projects/" + alicesProjectId))
        .andExpect(status().isUnauthorized());
  }
}
