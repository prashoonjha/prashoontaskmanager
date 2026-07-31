import { initials } from "../ui";

interface TopBarProps {
  username: string;
  onLogout(): void;
}

export function TopBar({ username, onLogout }: TopBarProps) {
  const display = username.replace(/^github_/, "");
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <span className="topbar-mark">Ledger</span>
        <span className="topbar-sub">task manager</span>
      </div>
      <div className="topbar-user">
        <div className="avatar" style={{ width: 26, height: 26, fontSize: 11 }}>
          {initials(username)}
        </div>
        <span className="topbar-name">{display}</span>
        <button className="btn-ghost" onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}
