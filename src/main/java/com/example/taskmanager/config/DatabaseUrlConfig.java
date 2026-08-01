package com.example.taskmanager.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.HashMap;
import java.util.Map;

/**
 * Lets the app read a single connection string (Render, Heroku, Railway, etc.)
 * exposed as DATABASE_URL, and translates it into the three properties Spring
 * actually needs: a jdbc: url, a username and a password.
 *
 * Render gives DATABASE_URL in the form:
 *   postgresql://user:password@host:5432/dbname
 * which JDBC can't use directly. When DATABASE_URL is absent (e.g. local dev),
 * this does nothing and the existing DB_URL/DB_USER/DB_PASSWORD settings apply.
 *
 * Registered via META-INF/spring.factories so it runs before the datasource is
 * created.
 */
public class DatabaseUrlConfig implements EnvironmentPostProcessor {

  @Override
  public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
    String databaseUrl = environment.getProperty("DATABASE_URL");
    if (databaseUrl == null || databaseUrl.isBlank()) {
      return; // nothing to do locally
    }

    try {
      URI uri = new URI(databaseUrl);

      String userInfo = uri.getUserInfo(); // "user:password"
      String username = "";
      String password = "";
      if (userInfo != null) {
        String[] parts = userInfo.split(":", 2);
        username = parts[0];
        password = parts.length > 1 ? parts[1] : "";
      }

      int port = uri.getPort() == -1 ? 5432 : uri.getPort();
      String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + port + uri.getPath()
          + "?sslmode=require";

      Map<String, Object> props = new HashMap<>();
      props.put("spring.datasource.url", jdbcUrl);
      props.put("spring.datasource.username", username);
      props.put("spring.datasource.password", password);

      // highest precedence so it wins over the defaults in application.yml
      environment.getPropertySources()
          .addFirst(new MapPropertySource("renderDatabaseUrl", props));

    } catch (Exception ex) {
      throw new IllegalStateException("Could not parse DATABASE_URL", ex);
    }
  }
}
