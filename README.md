# Task Manager

A full-stack Task Management application built with **Spring Boot** and **React** that helps users organize projects, manage tasks, and collaborate efficiently. The application provides secure authentication with JWT and OAuth2, a RESTful API, and a modern responsive frontend.

## ✨ Features

- 🔐 Secure authentication with JWT
- 🌐 OAuth2 login support
- 👤 User registration and login
- 📁 Project management
- ✅ Create, update, and delete tasks
- 📌 Task status management
- 💬 Task comments
- 🔍 Search and organize tasks
- 📖 RESTful API
- 📚 OpenAPI (Swagger) documentation
- 🛡️ Spring Security integration

## 🛠 Tech Stack

### Backend

- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- JWT Authentication
- OAuth2
- Maven

### Frontend

- React
- TypeScript
- Vite
- HTML5
- CSS3

## 📂 Project Structure

```text
taskmanager/
├── frontend/              # React + TypeScript application
├── src/
│   ├── main/
│   │   ├── java/          # Backend source code
│   │   └── resources/     # Configuration files
│   └── test/              # Unit tests
├── pom.xml
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Java 21+
- Node.js 18+
- PostgreSQL
- Maven

### Clone the repository

```bash
git clone https://github.com/prashoonjha/taskmanager.git
cd taskmanager
```

## ⚙️ Backend Setup

Configure your PostgreSQL database in:

```text
src/main/resources/application.yml
```

Run the backend:

```bash
mvn spring-boot:run
```

## 💻 Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

## 📖 API Documentation

After running the backend, Swagger UI is available at:

```
http://localhost:8080/swagger-ui/index.html
```

## 🧪 Running Tests

```bash
mvn test
```

## 📌 Future Improvements

- Real-time notifications
- File attachments
- Team collaboration
- Email notifications
- Dashboard analytics
- Dark mode
- Drag-and-drop task management

## 🤝 Contributing

Contributions are welcome! Feel free to fork the repository, create a feature branch, and submit a pull request.

## 📄 License

This project is licensed under the MIT License.

---

Made with ❤️ using Spring Boot and React.
