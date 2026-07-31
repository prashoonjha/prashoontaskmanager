package com.example.taskmanager.auth;

import com.example.taskmanager.user.Role;
import com.example.taskmanager.user.UserEntity;
import com.example.taskmanager.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

  private final UserRepository userRepository;
  private final JwtUtil jwtUtil;

  // Where to send the browser after a successful GitHub login. Configurable so
  // dev (localhost:5173) and prod (same-origin) can differ. Defaults to the
  // built-in frontend served from the same origin.
  @Value("${app.oauth2.redirect-uri:/oauth-callback}")
  private String frontendRedirectUri;

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request,
      HttpServletResponse response,
      Authentication authentication) throws IOException {

    OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

    // GitHub's "login" attribute is the GitHub username
    String githubLogin = (String) oauthUser.getAttributes().get("login");
    if (githubLogin == null || githubLogin.isBlank()) {
      response.sendError(HttpServletResponse.SC_BAD_REQUEST, "GitHub user has no login");
      return;
    }

    String username = "github_" + githubLogin;

    UserEntity user = userRepository.findByUsername(username)
        .orElseGet(() -> userRepository.save(UserEntity.builder()
            .username(username)
            // OAuth users can't log in with a password; store an unusable hash
            .passwordHash("{noop-oauth}")
            .role(Role.USER)
            .build()));

    String accessToken = jwtUtil.generateAccessToken(user.getUsername());
    String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());

    String redirectUrl = frontendRedirectUri
        + "?accessToken=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8)
        + "&refreshToken=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8)
        + "&username=" + URLEncoder.encode(user.getUsername(), StandardCharsets.UTF_8);

    response.sendRedirect(redirectUrl);
  }
}
