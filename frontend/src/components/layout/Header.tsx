import React, { useEffect, useRef, useState } from "react";
import { PunchClockWidget } from "../telemetry/PunchClockWidget";
import { ThemeColors, ThemeMode } from "../../lib/theme";
import { AppSection } from "./Sidebar";

export type { AppSection };

interface HeaderProps {
  userName: string;
  employeeCode: string;
  role: string;
  isPunchedIn: boolean;
  token: string;
  themeMode: ThemeMode;
  theme: ThemeColors;
  activeSection: AppSection;
  onOpenMobileMenu: () => void;
  onOpenAddLead: () => void;
  onToggleTheme: () => void;
  onPersonaChange: (email: string, password: string) => void;
  onPunchStatusChange: (isPunchedIn: boolean) => void;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  backendUrl?: string;
}

const SECTION_TITLES: Record<AppSection, string> = {
  overview: "Dashboard",
  leads: "Manage Leads",
  ads: "Ad Sources",
  activity: "Agent Activity",
  properties: "Properties",
  settings: "Settings"
};

export const Header: React.FC<HeaderProps> = ({
  userName,
  employeeCode,
  role,
  isPunchedIn,
  token,
  themeMode,
  theme,
  activeSection,
  onOpenMobileMenu,
  onOpenAddLead,
  onToggleTheme,
  onPersonaChange,
  onPunchStatusChange,
  onOpenProfile,
  onLogout,
  backendUrl
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = role === "OWNER" || role === "ADMIN" || role === "MANAGER";
  const firstName = userName.split(" ")[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      ref={menuRef}
      style={{
        height: "58px",
        backgroundColor: theme.headerBg,
        borderBottom: `1px solid ${theme.border}`,
        position: "sticky",
        top: 0,
        zIndex: 35,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 clamp(14px, 2vw, 24px)",
        gap: "12px"
      }}
    >
      {/* Left: Mobile Drawer Toggle + Crisp Current Page Title */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
        <button
          type="button"
          className="aa-mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          style={{
            padding: "7px 9px",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.cardBgSecondary,
            color: theme.textPrimary,
            cursor: "pointer",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <h1
          style={{
            fontSize: "1.08rem",
            fontWeight: 700,
            color: theme.textPrimary,
            margin: 0,
            letterSpacing: "-0.015em",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}
        >
          {SECTION_TITLES[activeSection]}
        </h1>
      </div>

      {/* Right: Single Primary "+ Add Lead" Button + Clean Account Menu */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, position: "relative" }}>
        <button
          type="button"
          onClick={onOpenAddLead}
          style={{
            padding: "8px 15px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: theme.primaryBtnBg,
            color: theme.primaryBtnText,
            fontSize: "0.84rem",
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span aria-hidden="true">+</span>
          <span>Add Lead</span>
        </button>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label="Open account menu"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            padding: "6px 11px",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.cardBgSecondary,
            color: theme.textPrimary,
            fontSize: "0.84rem",
            fontWeight: 600,
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: "7px"
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              backgroundColor: theme.accentBg,
              color: theme.accentPrimary,
              fontSize: "0.74rem",
              fontWeight: 800,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {firstName[0]}
          </span>
          <span className="aa-user-name-label">{firstName}</span>
          <span style={{ fontSize: "0.68rem", color: theme.textMuted }}>▾</span>
        </button>

        {menuOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: "290px",
              backgroundColor: theme.cardBgElevated,
              border: `1px solid ${theme.border}`,
              borderRadius: "12px",
              boxShadow: theme.glassShadowGlow,
              padding: "14px",
              zIndex: 90,
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}
          >
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: theme.textPrimary }}>{userName}</div>
              <div style={{ fontSize: "0.76rem", color: theme.textMuted, marginTop: "2px" }}>
                {isOwner ? "Agency Owner" : "Sales Agent"} · {employeeCode}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
              <label
                htmlFor="header-role-select"
                style={{ fontSize: "0.74rem", fontWeight: 600, color: theme.textSecondary }}
              >
                Switch User View
              </label>
              <select
                id="header-role-select"
                value={employeeCode}
                onChange={(e) => {
                  const code = e.target.value;
                  if (code === "OWNER-01") onPersonaChange("owner@absoluteassets.in", "OwnerPass2026!");
                  else if (code === "EXE-204") onPersonaChange("dhruv@absoluteassets.in", "AgentPass2026!");
                  else if (code === "EXE-208") onPersonaChange("ananya@absoluteassets.in", "AgentPass2026!");
                  else if (code === "EXE-215") onPersonaChange("vikram@absoluteassets.in", "AgentPass2026!");
                  else if (code === "EXE-210") onPersonaChange("karan@absoluteassets.in", "AgentPass2026!");
                  setMenuOpen(false);
                }}
                style={{
                  backgroundColor: theme.cardBgSecondary,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`,
                  padding: "7px 10px",
                  borderRadius: "8px",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                <option value="OWNER-01">Vikramaditya (Owner)</option>
                <option value="EXE-204">Dhruv Chaudhary (Agent)</option>
                <option value="EXE-208">Ananya Patel (Agent)</option>
                <option value="EXE-215">Vikram Malhotra (Agent)</option>
                <option value="EXE-210">Karan Mehta (Agent)</option>
              </select>
            </div>

            <div style={{ paddingTop: "10px", borderTop: `1px solid ${theme.borderSubtle}` }}>
              <PunchClockWidget
                initialPunchedIn={isPunchedIn}
                token={token}
                theme={theme}
                backendUrl={backendUrl}
                onPunchStatusChange={onPunchStatusChange}
              />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "2px",
                paddingTop: "8px",
                borderTop: `1px solid ${theme.borderSubtle}`
              }}
            >
              <button
                type="button"
                onClick={() => {
                  onToggleTheme();
                  setMenuOpen(false);
                }}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: "7px",
                  border: "none",
                  backgroundColor: "transparent",
                  color: theme.textPrimary,
                  fontSize: "0.82rem",
                  fontWeight: 500,
                  cursor: "pointer"
                }}
              >
                Switch to {themeMode === "light" ? "Dark Mode" : "Light Mode"}
              </button>

              {onOpenProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenProfile();
                    setMenuOpen(false);
                  }}
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: theme.textPrimary,
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  Account &amp; 2FA Security
                </button>
              )}

              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    setMenuOpen(false);
                  }}
                  style={{
                    textAlign: "left",
                    padding: "8px 10px",
                    borderRadius: "7px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: theme.danger,
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
