import { useState, type FormEvent } from "react";
import { type AuthTokens, login, register, API_BASE } from "../api";

interface AuthFormsProps {
  onAuth(tokens: AuthTokens, username: string): void;
}

export function AuthForms({ onAuth }: AuthFormsProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const user = username.trim();
    const pass = password.trim();
    if (!user || !pass) {
      setError("Enter a username and password.");
      return;
    }

    setLoading(true);
    try {
      const tokens =
        tab === "login" ? await login(user, pass) : await register(user, pass);
      onAuth(tokens, user);
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-mark">Ledger</span>
          <span className="auth-sub">task manager</span>
        </div>

        <h1 className="auth-title">
          {tab === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="auth-lede">
          {tab === "login"
            ? "Sign in to pick up where you left off."
            : "Start organizing your projects and tasks."}
        </p>

        <div className="auth-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "login"}
            className={tab === "login" ? "active" : ""}
            onClick={() => {
              setTab("login");
              setError(null);
            }}
          >
            Log in
          </button>
          <button
            role="tab"
            aria-selected={tab === "register"}
            className={tab === "register" ? "active" : ""}
            onClick={() => {
              setTab("register");
              setError(null);
            }}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label className="label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="prashoon"
              autoComplete="username"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={tab === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <div className="banner-error" style={{ marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading
              ? "Working…"
              : tab === "login"
              ? "Log in"
              : "Create account"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <a
          className="btn"
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            textDecoration: "none",
          }}
          href={`${API_BASE}/oauth2/authorization/github`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
            />
          </svg>
          Continue with GitHub
        </a>
      </div>
    </div>
  );
}
