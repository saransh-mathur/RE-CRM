import React from "react";
import { ThemeColors, ThemeMode } from "../../lib/theme";
import { PunchClockWidget } from "../telemetry/PunchClockWidget";

interface SettingsViewProps {
  user: {
    fullName: string;
    employeeCode: string;
    role: string;
    isPunchedIn: boolean;
  };
  token: string;
  theme: ThemeColors;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onPersonaChange: (email: string, password: string) => void;
  onPunchStatusChange: (punched: boolean) => void;
  onRequestExport: () => void;
  onOpenProfile: () => void;
  onResetDemoData: () => void;
  onLogout: () => void;
  backendUrl?: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  token,
  theme,
  themeMode,
  onToggleTheme,
  onPersonaChange,
  onPunchStatusChange,
  onRequestExport,
  onOpenProfile,
  onResetDemoData,
  onLogout,
  backendUrl
}) => {
  const isOwner = user.role === "OWNER" || user.role === "ADMIN" || user.role === "MANAGER";

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "14px",
    padding: "20px 22px",
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px", maxWidth: "820px" }}>
      <p style={{ fontSize: "0.88rem", color: theme.textSecondary, margin: 0 }}>
        Manage your profile, attendance shift, display preference, and lead export controls.
      </p>

      {/* Card 1: Account & Switch User */}
      <section style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>{user.fullName}</h3>
            <div style={{ fontSize: "0.82rem", color: theme.textMuted, marginTop: "2px" }}>
              {isOwner ? "Agency Owner" : "Sales Agent"} · {user.employeeCode}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onOpenProfile}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBgSecondary,
                color: theme.textPrimary,
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              2FA &amp; Security
            </button>
            <button
              type="button"
              onClick={onLogout}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: `1px solid ${theme.dangerBorder}`,
                backgroundColor: theme.dangerBg,
                color: theme.danger,
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div style={{ paddingTop: "12px", borderTop: `1px solid ${theme.borderSubtle}` }}>
          <label
            htmlFor="settings-role-select"
            style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: theme.textSecondary, marginBottom: "6px" }}
          >
            Preview CRM as another team member
          </label>
          <select
            id="settings-role-select"
            value={user.employeeCode}
            onChange={(e) => {
              const code = e.target.value;
              if (code === "OWNER-01") onPersonaChange("owner@absoluteassets.in", "OwnerPass2026!");
              else if (code === "EXE-204") onPersonaChange("dhruv@absoluteassets.in", "AgentPass2026!");
              else if (code === "EXE-208") onPersonaChange("ananya@absoluteassets.in", "AgentPass2026!");
              else if (code === "EXE-215") onPersonaChange("vikram@absoluteassets.in", "AgentPass2026!");
              else if (code === "EXE-210") onPersonaChange("karan@absoluteassets.in", "AgentPass2026!");
            }}
            style={{
              width: "100%",
              maxWidth: "340px",
              padding: "9px 12px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgSecondary,
              color: theme.textPrimary,
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <option value="OWNER-01">Vikramaditya Singhania (Owner)</option>
            <option value="EXE-204">Dhruv Chaudhary (Agent)</option>
            <option value="EXE-208">Ananya Patel (Agent)</option>
            <option value="EXE-215">Vikram Malhotra (Agent)</option>
            <option value="EXE-210">Karan Mehta (Agent)</option>
          </select>
        </div>
      </section>

      {/* Card 2: Shift Attendance */}
      <section style={cardStyle}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
          Daily Attendance
        </h3>
        <PunchClockWidget
          initialPunchedIn={user.isPunchedIn}
          token={token}
          theme={theme}
          backendUrl={backendUrl}
          onPunchStatusChange={onPunchStatusChange}
        />
      </section>

      {/* Card 3: Display & Data */}
      <section style={cardStyle}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
          Display &amp; Data
        </h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onToggleTheme}
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgSecondary,
              color: theme.textPrimary,
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Switch to {themeMode === "light" ? "Dark Mode" : "Light Mode"}
          </button>

          {isOwner && (
            <button
              type="button"
              onClick={onRequestExport}
              style={{
                padding: "9px 16px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: theme.primaryBtnBg,
                color: theme.primaryBtnText,
                fontSize: "0.84rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Export Leads
            </button>
          )}

          <button
            type="button"
            onClick={onResetDemoData}
            style={{
              padding: "9px 16px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: "transparent",
              color: theme.textSecondary,
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Reset Demo Data
          </button>
        </div>
      </section>
    </div>
  );
};
