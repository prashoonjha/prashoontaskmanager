![CI](https://github.com/prashoonjha/prashoontaskmanager/actions/workflows/ci.yml/badge.svg)

# Task Manager

A full-stack task management app built with **Spring Boot** and **React**. Users can organize projects, manage tasks through a simple workflow, and comment on them. Authentication is handled with JWT and optional GitHub OAuth2, backed by a RESTful API and a clean React + TypeScript frontend.

## ✨ Features

- 🔐 JWT authentication (access + refresh tokens)
- 🌐 GitHub OAuth2 login
- 👤 User registration and login
- 📁 Projects, scoped per user
- ✅ Tasks with status (To do / In progress / Done), assignee, and due date
- 💬 Comments on tasks
- 📊 Per-project progress meters
- 📖 RESTful API with OpenAPI (Swagger) docs
- 🛡️ Ownership-enforced access control (users only see their own data)

## 🛠 Tech Stack

**Backend** — Java 21, Spring Boot 3.3, Spring Security, Spring Data JPA, PostgreSQL, JWT (jjwt), OAuth2 client, Maven, JUnit 5 + Testcontainers.

**Frontend** — React 18, TypeScript, Vite.

**Deployment** — Multi-stage Docker build (frontend compiled and served as static resources by the Spring Boot jar).

## 📂 Project Structure

```text
taskmanager/
├── frontend/              # React + TypeScript app (Vite)
├── src/
│   ├── main/
│   │   ├── java/          # Backend source (package-by-feature)
│   │   └── resources/     # application.yml, etc.
│   └── test/              # Unit + Testcontainers integration tests
├── Dockerfile             # Multi-stage: build frontend + jar, slim runtime
├── pom.xml
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Java 21+
- Node.js 20+
- PostgreSQL (or Docker)
- Maven (the `./mvnw` wrapper is included)

### Clone

```bash
git clone https://github.com/prashoonjha/prashoontaskmanager.git
cd taskmanager
```

### Environment

The app reads configuration from environment variables. At minimum you need a
JWT secret and a database. GitHub OAuth is optional — leave the client
id/secret unset and the app still runs with username/password auth.

```bash
export JWT_SECRET="a-long-random-secret-at-least-32-chars"
export DB_URL="jdbc:postgresql://localhost:5432/taskmanager"
export DB_USER="postgres"
export DB_PASSWORD="postgres"

# optional, for GitHub login:
export GITHUB_CLIENT_ID="..."
export GITHUB_CLIENT_SECRET="..."
```

See `.env.example` for the full list.

## ⚙️ Running locally (two processes)

Backend:

```bash
./mvnw spring-boot:run
```

Frontend dev server (proxies `/api`, `/oauth2`, `/login` to the backend):

```bash
cd frontend
npm install
npm run dev
```

The dev frontend runs on http://localhost:5173. For GitHub login in this mode,
set `OAUTH2_REDIRECT_URI=http://localhost:5173/oauth-callback`.

## 🐳 Running with Docker (single container)

The Dockerfile builds the frontend, bakes it into the Spring Boot jar, and
serves everything on one port:

```bash
docker build -t taskmanager .
docker run -p 8080:8080 \
  -e JWT_SECRET="..." \
  -e DB_URL="jdbc:postgresql://host.docker.internal:5432/taskmanager" \
  -e DB_USER="postgres" -e DB_PASSWORD="postgres" \
  taskmanager
```

App available at http://localhost:8080.

## 📖 API Documentation

With the backend running, Swagger UI is at:

```
http://localhost:8080/swagger-ui/index.html
```

## 🧪 Running Tests

Integration tests use **Testcontainers** to spin up a real PostgreSQL instance,
so Docker must be running.

```bash
./mvnw test
```

Includes an access-control test that verifies a user cannot read another user's
project.

## 📌 Future Improvements

- Real-time notifications
- File attachments
- Team collaboration
- Dashboard analytics
- Dark mode
- Drag-and-drop task board

## 📄 License

MIT
