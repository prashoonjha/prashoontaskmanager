package com.example.taskmanager.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@Component
public class JwtUtil {

  private static final String CLAIM_TYPE = "type";
  private static final String TYPE_ACCESS = "access";
  private static final String TYPE_REFRESH = "refresh";

  private final Key key;
  private final long expirationMinutes;
  private final long refreshExpirationDays;

  public JwtUtil(
      @Value("${jwt.secret}") String secret,
      @Value("${jwt.expirationMinutes}") long expirationMinutes,
      @Value("${jwt.refreshExpirationDays}") long refreshExpirationDays) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expirationMinutes = expirationMinutes;
    this.refreshExpirationDays = refreshExpirationDays;
  }

  public String generateAccessToken(String username) {
    return build(username, TYPE_ACCESS, expirationMinutes, ChronoUnit.MINUTES);
  }

  public String generateRefreshToken(String username) {
    return build(username, TYPE_REFRESH, refreshExpirationDays, ChronoUnit.DAYS);
  }

  private String build(String username, String type, long amount, ChronoUnit unit) {
    Instant now = Instant.now();
    return Jwts.builder()
        .setSubject(username)
        .setIssuedAt(Date.from(now))
        .setExpiration(Date.from(now.plus(amount, unit)))
        .claim(CLAIM_TYPE, type)
        .signWith(key, SignatureAlgorithm.HS256)
        .compact();
  }

  public Jws<Claims> parse(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token);
  }

  /**
   * Parse a refresh token and return its subject, rejecting anything that is not
   * actually a refresh token (e.g. an access token replayed against /refresh).
   */
  public String parseRefreshSubject(String token) {
    Claims claims = parse(token).getBody();
    if (!TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class))) {
      throw new IllegalArgumentException("Not a refresh token");
    }
    return claims.getSubject();
  }

  /**
   * Parse an access token and return its subject, rejecting non-access tokens so a
   * refresh token can't be used as a bearer credential.
   */
  public String parseAccessSubject(String token) {
    Claims claims = parse(token).getBody();
    if (!TYPE_ACCESS.equals(claims.get(CLAIM_TYPE, String.class))) {
      throw new IllegalArgumentException("Not an access token");
    }
    return claims.getSubject();
  }
}
