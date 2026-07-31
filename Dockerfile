# syntax=docker/dockerfile:1

# ---- Stage 1: build the React frontend ----
FROM node:20-alpine AS frontend
WORKDIR /frontend
# install deps first for better layer caching
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# keep the build output inside this stage (overrides the local-dev default that
# emits into ../src/main/resources/static)
ENV VITE_BUILD_OUTDIR=dist
RUN npm run build

# ---- Stage 2: build the Spring Boot jar ----
FROM eclipse-temurin:21-jdk-jammy AS backend
WORKDIR /app
# cache Maven deps: copy wrapper + pom, resolve, then copy sources
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q dependency:go-offline
COPY src/ src/
# bring in the compiled frontend as static resources served by Spring
COPY --from=frontend /frontend/dist/ src/main/resources/static/
RUN ./mvnw -q -DskipTests package

# ---- Stage 3: slim runtime ----
FROM eclipse-temurin:21-jre-jammy AS runtime
WORKDIR /app
COPY --from=backend /app/target/taskmanager-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-jar", "app.jar"]
