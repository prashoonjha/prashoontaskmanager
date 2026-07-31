import { useEffect, useState } from "react";
import { AuthForms } from "./components/AuthForms";
import { ProjectView } from "./components/ProjectView";
import type { AuthTokens } from "./api";
import { me } from "./api";

interface AuthState extends AuthTokens {
  username: string;
}

const STORAGE_KEY = "taskmanager_auth";

function loadStoredAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

// Handle the ?accessToken=...&refreshToken=...&username=... redirect
// that the backend sends after a successful GitHub OAuth login.
function consumeOAuthRedirect(): AuthState | null {
  const params = new URLSearchParams(window.location.search);
  const accessToken = params.get("accessToken");
  const refreshToken = params.get("refreshToken");
  const username = params.get("username");
  if (accessToken && refreshToken && username) {
    window.history.replaceState({}, "", window.location.pathname);
    return { accessToken, refreshToken, username };
  }
  return null;
}

export function App() {
  const [auth, setAuth] = useState<AuthState | null>(
    () => consumeOAuthRedirect() ?? loadStoredAuth()
  );
  const [checking, setChecking] = useState<boolean>(() => !!auth);

  useEffect(() => {
    if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  // Verify the stored/redirected token on load.
  useEffect(() => {
    if (!auth) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    setChecking(true);
    me(auth.accessToken)
      .then((res) => {
        if (cancelled) return;
        setAuth((cur) => (cur ? { ...cur, username: res.username } : null));
      })
      .catch(() => {
        if (cancelled) return;
        localStorage.removeItem(STORAGE_KEY);
        setAuth(null);
      })
      .finally(() => !cancelled && setChecking(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth?.accessToken]);

  function handleAuth(tokens: AuthTokens, username: string) {
    setAuth({ ...tokens, username });
  }

  function handleLogout() {
    setAuth(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  if (checking) {
    return (
      <div className="splash">
        <div className="spinner" />
        <span>Loading your workspace…</span>
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
