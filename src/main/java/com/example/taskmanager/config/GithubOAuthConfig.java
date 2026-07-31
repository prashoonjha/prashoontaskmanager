package com.example.taskmanager.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.beans.factory.annotation.Value;

/**
 * Registers GitHub as an OAuth2 provider, but only when a client id is actually
 * configured (GITHUB_CLIENT_ID). This keeps the app startable out of the box with
 * plain username/password auth: with no credentials, no ClientRegistrationRepository
 * bean is created, so SecurityConfig skips oauth2Login() entirely.
 *
 * We build the registration programmatically instead of declaring it under
 * spring.security.oauth2.client.* because Spring Boot validates that block at
 * startup and rejects an empty client-id, which would crash the app when the env
 * var is unset.
 */
@Configuration
@ConditionalOnExpression("'${github.oauth.client-id:}'.trim().length() > 0")
public class GithubOAuthConfig {

  @Bean
  public ClientRegistrationRepository clientRegistrationRepository(
      @Value("${github.oauth.client-id}") String clientId,
      @Value("${github.oauth.client-secret}") String clientSecret) {

    ClientRegistration github = CommonOAuth2Provider.GITHUB
        .getBuilder("github")
        .clientId(clientId)
        .clientSecret(clientSecret)
        .scope("read:user", "user:email")
        .build();

    return new InMemoryClientRegistrationRepository(github);
  }
}
