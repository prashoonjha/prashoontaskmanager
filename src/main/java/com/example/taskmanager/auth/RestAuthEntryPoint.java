package com.example.taskmanager.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;

/**
 * Sends a clean JSON 401 for unauthenticated requests to protected endpoints,
 * instead of Spring Security's default redirect-to-login behaviour (which shows
 * up as a confusing 302/500 for an API client).
 */
@Component
@RequiredArgsConstructor
public class RestAuthEntryPoint implements AuthenticationEntryPoint {

  private final ObjectMapper objectMapper;

  @Override
  public void commence(
      HttpServletRequest request,
      HttpServletResponse response,
      AuthenticationException authException) throws IOException {

    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
    response.setContentType(MediaType.APPLICATION_JSON_VALUE);

    Map<String, Object> body = Map.of(
        "timestamp", Instant.now().toString(),
        "status", 401,
        "error", "Unauthorized",
        "message", "Authentication required",
        "path", request.getRequestURI());

    objectMapper.writeValue(response.getOutputStream(), body);
  }
}
