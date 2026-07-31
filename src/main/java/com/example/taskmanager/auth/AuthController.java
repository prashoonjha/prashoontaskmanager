package com.example.taskmanager.auth;

import com.example.taskmanager.user.UserEntity;
import com.example.taskmanager.user.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final UserService userService;
  private final JwtUtil jwtUtil;

  @PostMapping("/login")
  public ResponseEntity<TokenResponse> login(@Valid @RequestBody LoginRequest request) {
    try {
      Authentication auth = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(
              request.getUsername(), request.getPassword()));
      return ResponseEntity.ok(tokensFor(auth.getName()));
    } catch (BadCredentialsException ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
    }
  }

  @PostMapping("/register")
  public ResponseEntity<TokenResponse> register(@Valid @RequestBody RegisterRequest request) {
    try {
      UserEntity user = userService.register(request.getUsername(), request.getPassword());
      return ResponseEntity.status(HttpStatus.CREATED).body(tokensFor(user.getUsername()));
    } catch (IllegalArgumentException ex) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, ex.getMessage());
    }
  }

  @PostMapping("/refresh")
  public ResponseEntity<TokenResponse> refresh(@Valid @RequestBody RefreshRequest request) {
    try {
      // rejects anything that isn't actually a refresh token
      String username = jwtUtil.parseRefreshSubject(request.getRefreshToken());
      return ResponseEntity.ok(tokensFor(username));
    } catch (Exception ex) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
    }
  }

  @GetMapping("/me")
  public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal UserDetails user) {
    if (user == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }
    return ResponseEntity.ok(Map.of("username", user.getUsername()));
  }

  private TokenResponse tokensFor(String username) {
    return new TokenResponse(
        jwtUtil.generateAccessToken(username),
        jwtUtil.generateRefreshToken(username));
  }

  @Data
  static class LoginRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
  }

  @Data
  static class RegisterRequest {
    @NotBlank
    private String username;
    @NotBlank
    private String password;
  }

  @Data
  static class RefreshRequest {
    @NotBlank
    private String refreshToken;
  }

  @Data
  static class TokenResponse {
    private final String accessToken;
    private final String refreshToken;
  }
}
