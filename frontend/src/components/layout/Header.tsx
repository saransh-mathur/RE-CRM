import React, { useState } from "react";
import { PunchClockWidget } from "../telemetry/PunchClockWidget";
import { DeviceCollector } from "../telemetry/DeviceCollector";
import { ThemeColors, ThemeMode } from "../../lib/theme";
import { MOCK_USERS } from "../../lib/mockData";

interface HeaderProps {
  userName: string;
  employeeCode: string;
  role: string;
  isPunchedIn: boolean;
  token: string;
  themeMode: ThemeMode;
  theme: ThemeColors;
  onToggleTheme: () => void;
  onPersonaChange: (email: string, password: string) => void;
  onPunchStatusChange: (isPunchedIn: boolean) => void;
  onRequestExport: () => void;
  onSimulateMetaLead: () => void;
  onResetDemoData?: () => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  backendUrl?: string;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  employeeCode,
  role,
  isPunchedIn,
  token,
  themeMode,
  theme,
  onToggleTheme,
  onPersonaChange,
  onPunchStatusChange,
  onRequestExport,
  onSimulateMetaLead,
  onResetDemoData,
  onOpenProfile,
  onLogout,
  backendUrl
}) => {
  const [showCreds, setShowCreds] = useState(false);
  const isOwner = role === "OWNER" || role === "ADMIN";

  return (
    <header style={{
      backgroundColor: theme.headerBg,
      backdropFilter: theme.glassBackdrop,
      WebkitBackdropFilter: theme.glassBackdrop,
      borderBottom: `1px solid ${theme.border}`,
      padding: "16px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "14px",
      boxShadow: theme.glassShadow,
      position: "sticky",
      top: 0,
      zIndex: 50
    }}>
      {/* Top Bar: Brand, Switcher, Theme Toggle, Working Hours, Actions */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "14px"
      }}>
        {/* Brand & Security Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Crystalline Brand Emblem */}
          <div style={{
            background: themeMode === "light"
              ? "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(51, 65, 85, 0.9))"
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))",
            color: "#ffffff",
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.25rem",
            boxShadow: themeMode === "light"
              ? "0 4px 14px rgba(15, 23, 42, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.4)"
              : "0 4px 14px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }}>
            🏢
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <h1 style={{ fontSize: "1.15rem", fontWeight: "800", color: theme.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>
                Apex Sovereign
              </h1>
              {/* Frosted Crystal Role Pill */}
              <span style={{
                fontSize: "0.68rem",
                padding: "3px 9px",
                borderRadius: "999px",
                backgroundColor: theme.cardBgSecondary,
                color: theme.textSecondary,
                border: `1px solid ${theme.border}`,
                fontWeight: "700",
                letterSpacing: "0.03em"
              }}>
                {isOwner ? "👑 OWNER COMMAND CENTER" : "💼 EXECUTIVE WORKSPACE"}
              </span>

              {/* Standalone Demo Crystal Indicator */}
              <span style={{
                fontSize: "0.68rem",
                padding: "3px 9px",
                borderRadius: "999px",
                backgroundColor: theme.cardBgSecondary,
                color: theme.textSecondary,
                border: `1px solid ${theme.border}`,
                fontWeight: "700",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <span style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: theme.textPrimary,
                  opacity: 0.7,
                  display: "inline-block"
                }}></span>
                DEMO MODE ACTIVE
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: theme.textMuted, marginTop: "2px" }}>
              Session: <strong style={{ color: theme.textPrimary }}>{isOwner ? userName.split(" ")[0] : userName}</strong> ({employeeCode})
            </div>
          </div>
        </div>

        {/* Dashboard Persona Switcher (Owner vs Executive) */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          backgroundColor: theme.cardBgSecondary,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          padding: "5px 10px",
          borderRadius: "12px",
          border: `1px solid ${theme.border}`
        }}>
          <span style={{ fontSize: "0.74rem", color: theme.textMuted, fontWeight: "600" }}>Switch Persona:</span>
          <select
            value={employeeCode}
            onChange={(e) => {
              const code = e.target.value;
              if (code === "OWNER-01") onPersonaChange("owner@apexrealty.com", "OwnerPass2026!");
              else if (code === "EXE-204") onPersonaChange("agent.rahul@apexrealty.com", "AgentPass2026!");
              else if (code === "EXE-208") onPersonaChange("agent.ananya@apexrealty.com", "AgentPass2026!");
              else if (code === "EXE-215") onPersonaChange("agent.vikram@apexrealty.com", "AgentPass2026!");
              else if (code === "EXE-210") onPersonaChange("agent.karan@apexrealty.com", "AgentPass2026!");
            }}
            style={{
              backgroundColor: theme.cardBgElevated,
              color: theme.textPrimary,
              border: `1px solid ${theme.border}`,
              padding: "5px 10px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: "600",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <optgroup label="👑 Agency Leadership">
              <option value="OWNER-01">Vikramaditya (Agency Owner)</option>
            </optgroup>
            <optgroup label="💼 Field Executives (4 Enrolled)">
              <option value="EXE-204">Rahul (Downtown - Laptop)</option>
              <option value="EXE-208">Ananya (Palm Grove - Mobile)</option>
              <option value="EXE-215">Vikram (Marina Bay - Mobile)</option>
              <option value="EXE-210">Karan (Penthouse - Laptop)</option>
            </optgroup>
          </select>
          
          <button
            onClick={() => setShowCreds(!showCreds)}
            title="View User Details, Device & IP Telemetry"
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgElevated,
              color: theme.textSecondary,
              fontSize: "0.75rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            🛰️ Logins
          </button>

          {onResetDemoData && (
            <button
              onClick={onResetDemoData}
              title="Reset all demo leads & logs to initial showcase dataset"
              style={{
                padding: "5px 10px",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBgElevated,
                color: theme.textSecondary,
                fontSize: "0.75rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              ↺ Reset
            </button>
          )}
        </div>

        {/* Device Telemetry & Working Hours Punch Clock */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <DeviceCollector token={token} theme={theme} backendUrl={backendUrl} />
          <PunchClockWidget
            initialPunchedIn={isPunchedIn}
            token={token}
            theme={theme}
            backendUrl={backendUrl}
            onPunchStatusChange={onPunchStatusChange}
          />
        </div>

        {/* Theme Toggle & Quick Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Crystalline Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            title={`Switch to ${themeMode === "light" ? "Dark Crystal" : "White Crystal"} Theme`}
            style={{
              padding: "7px 13px",
              borderRadius: "10px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgElevated,
              backdropFilter: theme.glassBackdrop,
              color: theme.textPrimary,
              fontSize: "0.78rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: theme.glassShadow,
              transition: "all 0.15s ease"
            }}
          >
            {themeMode === "light" ? "🌙 Dark Glass" : "☀️ Light Glass"}
          </button>

          {/* Ingest Meta Lead Button (Refined Crystal Glass Aesthetic) */}
          <button
            onClick={onSimulateMetaLead}
            title="Simulate incoming Facebook/Instagram Instant Ad lead"
            style={{
              padding: "7px 13px",
              borderRadius: "10px",
              border: `1px solid ${themeMode === "light" ? "rgba(15, 23, 42, 0.2)" : "rgba(255, 255, 255, 0.25)"}`,
              backgroundColor: themeMode === "light" ? "#0f172a" : "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              fontSize: "0.78rem",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: themeMode === "light" ? "0 2px 8px rgba(15, 23, 42, 0.15)" : "0 2px 8px rgba(0, 0, 0, 0.3)",
              transition: "all 0.15s ease"
            }}
          >
            ⚡ Ingest Meta Lead
          </button>

          {isOwner && (
            <button
              onClick={onRequestExport}
              title="Request Four-Eyes approved export"
              style={{
                padding: "7px 13px",
                borderRadius: "10px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBgElevated,
                color: theme.textSecondary,
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease"
              }}
            >
              📥 Export Request
            </button>
          )}

          {/* Profile & MFA Settings */}
          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              title="View User Security Profile & Configure MFA"
              style={{
                padding: "7px 13px",
                borderRadius: "10px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBgElevated,
                color: theme.textPrimary,
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease"
              }}
            >
              👤 Profile & 2FA
            </button>
          )}

          {/* Sign Out / Lock Session */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out of Session"
              style={{
                padding: "7px 12px",
                borderRadius: "10px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBgElevated,
                color: theme.textSecondary,
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "all 0.15s ease"
              }}
            >
              🚪 Exit
            </button>
          )}
        </div>
      </div>

      {/* Pop-down User Telemetry & Hardware Info (No Passwords) */}
      {showCreds && (
        <div style={{
          backgroundColor: theme.cardBgElevated,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: `1px solid ${theme.border}`,
          boxShadow: theme.glassShadowGlow,
          borderRadius: "16px",
          padding: "18px 22px",
          fontSize: "0.8rem"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
            <div>
              <div style={{ fontWeight: "800", color: theme.textPrimary, fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🛰️</span> Authorized User Profiles & Live Session Telemetry
              </div>
              <div style={{ color: theme.textSecondary, fontSize: "0.74rem", marginTop: "2px" }}>
                Active device models, public IP addresses, browser versions, and channel detection.
              </div>
            </div>
            <button
              onClick={() => setShowCreds(false)}
              style={{
                background: "transparent",
                border: `1px solid ${theme.border}`,
                color: theme.textSecondary,
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "0.72rem",
                cursor: "pointer"
              }}
            >
              ✕ Close
            </button>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "12px"
          }}>
            {Object.values(MOCK_USERS).map((u) => (
              <div
                key={u.id}
                style={{
                  padding: "12px 14px",
                  borderRadius: "12px",
                  backgroundColor: theme.cardBgSecondary,
                  border: `1px solid ${theme.border}`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "8px"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: "800", color: theme.textPrimary, fontSize: "0.85rem" }}>
                      {u.role === "OWNER" ? "👑" : "💼"} {u.full_name}
                    </div>
                    <span style={{
                      fontSize: "0.68rem",
                      padding: "2px 7px",
                      borderRadius: "999px",
                      backgroundColor: theme.cardBgElevated,
                      color: theme.textPrimary,
                      fontWeight: "700",
                      border: `1px solid ${theme.border}`
                    }}>
                      {u.employee_code}
                    </span>
                  </div>

                  <div style={{ color: theme.textMuted, fontSize: "0.72rem", marginTop: "2px" }}>
                    {u.assigned_territory}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "4px", fontSize: "0.74rem", color: theme.textSecondary }}>
                  <div>
                    Email: <strong style={{ color: theme.textPrimary, fontFamily: "monospace" }}>{u.email}</strong>
                  </div>
                  <div>
                    IP Address: <strong style={{ color: theme.textPrimary, fontFamily: "monospace" }}>{u.last_login_ip}</strong>
                  </div>
                  <div>
                    Device: <strong style={{ color: theme.textPrimary }}>{u.last_login_device}</strong>
                  </div>
                  <div>
                    Browser: <strong style={{ color: theme.textPrimary }}>{u.last_login_browser}</strong>
                  </div>
                  <div>
                    Channel: <span style={{
                      fontSize: "0.68rem",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      backgroundColor: theme.cardBgElevated,
                      color: theme.textPrimary,
                      fontWeight: "700",
                      border: `1px solid ${theme.border}`
                    }}>
                      {u.last_login_channel === "MOBILE_APP" ? "📱 Mobile App" : "💻 Web Portal"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", paddingTop: "6px", borderTop: `1px solid ${theme.border}` }}>
                  <span style={{ fontSize: "0.7rem", color: theme.textMuted }}>
                    {u.mfa_enforced ? "🔒 2FA Enforced" : u.mfa_enabled ? "✓ 2FA Active" : "⚪ Standard"}
                  </span>

                  <button
                    onClick={() => {
                      onPersonaChange(u.email, "OwnerPass2026!");
                      setShowCreds(false);
                    }}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: `1px solid ${theme.border}`,
                      backgroundColor: theme.cardBgElevated,
                      color: theme.textPrimary,
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    Switch to User →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
