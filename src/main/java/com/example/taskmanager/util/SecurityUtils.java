package com.example.taskmanager.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

  private SecurityUtils() {
  }

  public static String currentUsername() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
      return null;
    }
    return auth.getName();
  }
}
