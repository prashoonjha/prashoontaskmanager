
import { useEffect, useState } from "react";
import { AuthForms } from "./components/AuthForms";
import { ProjectView } from "./components/ProjectView";
import type { AuthTokens } from "./api";
import { me } from "./api";

interface AuthState extends AuthTokens {
  username: string;
}

const STORAGE_KEY = "taskmanager_auth";

function loadInitialAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function App() {
  const [auth, setAuth] = useState<AuthState | null>(() => loadInitialAuth());
  const [checking, setChecking] = useState<boolean>(() => !!loadInitialAuth());

  // Verify stored token on first load and whenever the access token changes
  useEffect(() => {
    if (!auth) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);

    const token = auth.accessToken;

    async function verifyToken(accessToken: string) {
      try {
        const meRes = await me(accessToken);
        if (cancelled) return;

        // Update username from backend response (if different)
        setAuth((current) => {
          if (!current) return null;
          const next: AuthState = {
            ...current,
            username: meRes.username,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          return next;
        });
      } catch {
        if (cancelled) return;
        // Token invalid → logout
        localStorage.removeItem(STORAGE_KEY);
        setAuth(null);
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    verifyToken(token);

    return () => {
      cancelled = true;
    };
  }, [auth?.accessToken]);

  function handleAuth(tokens: AuthTokens, username: string) {
    const state: AuthState = { ...tokens, username };
    setAuth(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function handleLogout() {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top left, rgba(56,189,248,0.25), transparent 60%), radial-gradient(circle at bottom right, rgba(129,140,248,0.25), transparent 55%), #020617",
          color: "#e5e7eb",
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text","Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            padding: "1rem 1.4rem",
            borderRadius: 999,
            border: "1px solid rgba(148,163,184,0.5)",
            background: "rgba(15,23,42,0.96)",
            boxShadow: "0 18px 40px rgba(15,23,42,0.9)",
            fontSize: 14,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Loading workspace…
        </div>
      </div>
    );
  }

  if (!auth) {
    return <AuthForms onAuth={handleAuth} />;
  }

  return (
    <ProjectView
      token={auth.accessToken}
      username={auth.username}
      onLogout={handleLogout}
    />
  );
}
