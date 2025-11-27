package com.example.taskmanager.auth;

import com.example.taskmanager.user.UserEntity;
import com.example.taskmanager.user.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
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

  // Frontend URL for handling GitHub OAuth callback
  private static final String FRONTEND_REDIRECT_URL = "http://localhost:5173/oauth-callback";

  @Override
  public void onAuthenticationSuccess(
      HttpServletRequest request,
      HttpServletResponse response,
      Authentication authentication) throws IOException, ServletException {

    OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

    // GitHub's "login" attribute is the GitHub username
    String githubLogin = (String) oauthUser.getAttributes().get("login");
    if (githubLogin == null || githubLogin.isBlank()) {
      response.sendError(HttpServletResponse.SC_BAD_REQUEST, "GitHub user has no login");
      return;
    }

    String username = "github_" + githubLogin;

    UserEntity user = userRepository.findByUsername(username)
        .orElseGet(() -> {
          UserEntity u = new UserEntity();
          u.setUsername(username);

          u.setPasswordHash("!");
          return userRepository.save(u);
        });

    // Generate JWT tokens
    String accessToken = jwtUtil.generateAccessToken(user.getUsername());
    String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());

    // Redirect to frontend with tokens as query params
    String redirectUrl = FRONTEND_REDIRECT_URL
        + "?accessToken=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8)
        + "&refreshToken=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8)
        + "&username=" + URLEncoder.encode(user.getUsername(), StandardCharsets.UTF_8);

    response.sendRedirect(redirectUrl);
  }
}
