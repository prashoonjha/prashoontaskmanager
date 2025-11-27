package com.example.taskmanager.auth;

import com.example.taskmanager.user.UserEntity;
import com.example.taskmanager.user.UserService;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthenticationManager authenticationManager;
  private final UserService userService;
  private final JwtUtil jwtUtil;

  @PostMapping("/login")
  public ResponseEntity<TokenResponse> login(@RequestBody LoginRequest request) {
    try {
      Authentication auth = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(
              request.getUsername(), request.getPassword()));
      String username = auth.getName();
      String accessToken = jwtUtil.generateAccessToken(username);
      String refreshToken = jwtUtil.generateRefreshToken(username);
      return ResponseEntity.ok(new TokenResponse(accessToken, refreshToken));
    } catch (BadCredentialsException ex) {
      return ResponseEntity.status(401).build();
    }
  }

  @PostMapping("/register")
  public ResponseEntity<TokenResponse> register(@RequestBody RegisterRequest request) {
    UserEntity user = userService.register(request.getUsername(), request.getPassword());
    String accessToken = jwtUtil.generateAccessToken(user.getUsername());
    String refreshToken = jwtUtil.generateRefreshToken(user.getUsername());
    return ResponseEntity.ok(new TokenResponse(accessToken, refreshToken));
  }

  @PostMapping("/refresh")
  public ResponseEntity<TokenResponse> refresh(@RequestBody RefreshRequest request) {
    var claims = jwtUtil.parse(request.getRefreshToken()).getBody();
    String username = claims.getSubject();
    String accessToken = jwtUtil.generateAccessToken(username);
    String refreshToken = jwtUtil.generateRefreshToken(username);
    return ResponseEntity.ok(new TokenResponse(accessToken, refreshToken));
  }

  @GetMapping("/me")
  public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal UserDetails user) {
    if (user == null) {
      return ResponseEntity.status(401).build();
    }
    return ResponseEntity.ok(Map.of("username", user.getUsername()));
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
