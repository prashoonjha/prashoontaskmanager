import { useState, type FormEvent } from "react";
import { AuthTokens, login, register } from "../api";

interface AuthFormsProps {
  onAuth(tokens: AuthTokens, username: string): void;
}

export function AuthForms(props: AuthFormsProps) {
  const { onAuth } = props;

  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError("Username and password are required.");
      return;
    }

    setLoading(true);
    try {
      if (tab === "login") {
        const tokens = await login(trimmedUser, trimmedPass);
        onAuth(tokens, trimmedUser);
      } else {
        const tokens = await register(trimmedUser, trimmedPass);
        onAuth(tokens, trimmedUser);
      }
    } catch (err) {
      const message = (err as Error).message || "Authentication failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top left, rgba(56,189,248,0.25), transparent 60%), radial-gradient(circle at bottom right, rgba(129,140,248,0.25), transparent 55%), #020617",
        fontFamily:
          'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text","Segoe UI", sans-serif',
        color: "#e5e7eb",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 24,
          border: "1px solid rgba(148,163,184,0.45)",
          background:
            "linear-gradient(145deg, rgba(15,23,42,0.98), rgba(15,23,42,0.92))",
          boxShadow:
            "0 22px 55px rgba(15,23,42,0.95), 0 0 0 1px rgba(15,23,42,1)",
          padding: "1.6rem 1.8rem 1.8rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top left, rgba(56,189,248,0.10), transparent 55%), radial-gradient(circle at bottom right, rgba(129,140,248,0.10), transparent 55%)",
            opacity: 0.9,
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginBottom: "0.9rem",
            }}
          >
            <div
              style={{
                fontSize: 13,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#9ca3af",
              }}
            >
              Task Manager
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: "0.02em",
              }}
            >
              Welcome back
            </div>
          </div>

          <p
            style={{
              margin: "0 0 1.1rem",
              fontSize: 13,
              color: "#9ca3af",
            }}
          >
            {tab === "login"
              ? "Sign in to access your projects and tasks."
              : "Create an account to start organizing your work."}
          </p>

          <div
            style={{
              display: "inline-flex",
              padding: 4,
              borderRadius: 999,
              border: "1px solid rgba(148,163,184,0.5)",
              background: "rgba(15,23,42,0.96)",
              marginBottom: "1.1rem",
            }}
          >
            <button
              type="button"
              onClick={() => setTab("login")}
              style={{
                flex: 1,
                padding: "0.35rem 0.9rem",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background:
                  tab === "login"
                    ? "linear-gradient(135deg, #38bdf8, #0ea5e9)"
                    : "transparent",
                color: tab === "login" ? "#0b1120" : "#9ca3af",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setTab("register")}
              style={{
                flex: 1,
                padding: "0.35rem 0.9rem",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background:
                  tab === "register"
                    ? "linear-gradient(135deg, #38bdf8, #0ea5e9)"
                    : "transparent",
                color: tab === "register" ? "#0b1120" : "#9ca3af",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.10em",
                textTransform: "uppercase",
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "0.8rem" }}>
              <label
                htmlFor="username"
                style={{
                  display: "block",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  marginBottom: 4,
                }}
              >
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. prashoon"
                autoComplete="username"
                style={{
                  width: "100%",
                  padding: "0.5rem 0.65rem",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.6)",
                  background: "rgba(15,23,42,0.96)",
                  color: "#e5e7eb",
                  outline: "none",
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ marginBottom: "0.8rem" }}>
              <label
                htmlFor="password"
                style={{
                  display: "block",
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#9ca3af",
                  marginBottom: 4,
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                style={{
                  width: "100%",
                  padding: "0.5rem 0.65rem",
                  borderRadius: 12,
                  border: "1px solid rgba(148,163,184,0.6)",
                  background: "rgba(15,23,42,0.96)",
                  color: "#e5e7eb",
                  outline: "none",
                  fontSize: 14,
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  marginTop: 4,
                  marginBottom: 10,
                  fontSize: 12,
                  color: "#fecaca",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "0.4rem",
                padding: "0.6rem 0.75rem",
                borderRadius: 999,
                border: "1px solid rgba(56,189,248,0.8)",
                background:
                  "linear-gradient(135deg, rgba(56,189,248,1), rgba(14,165,233,1))",
                color: "#0b1120",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 16px 40px rgba(56,189,248,0.5)",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? tab === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : tab === "login"
                ? "Sign in"
                : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
