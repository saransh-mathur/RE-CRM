import React from "react";
import { ThemeColors } from "../../lib/theme";

export type AppSection = "overview" | "leads" | "ads" | "activity" | "properties" | "settings";

interface SidebarProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  isOwner: boolean;
  leadsCount: number;
  alertsCount: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  theme: ThemeColors;
}

const NavIcon: React.FC<{ id: AppSection; active: boolean }> = ({ id, active }) => {
  const stroke = active ? "#FFFFFF" : "currentColor";
  switch (id) {
    case "overview":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "leads":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "ads":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10" />
          <path d="M12 20V4" />
          <path d="M6 20v-6" />
        </svg>
      );
    case "activity":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    case "properties":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l8-4v18" />
          <path d="M19 21V11l-6-4" />
          <path d="M9 9v.01" />
          <path d="M9 13v.01" />
          <path d="M9 17v.01" />
        </svg>
      );
    case "settings":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
  }
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  isOwner,
  leadsCount,
  alertsCount,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
  theme
}) => {
  const navItems: Array<{ id: AppSection; label: string; count?: number; isAlert?: boolean }> = isOwner
    ? [
        { id: "overview", label: "Dashboard" },
        { id: "leads", label: "Leads", count: leadsCount },
        { id: "ads", label: "Ad Sources" },
        { id: "activity", label: "Agent Activity", count: alertsCount > 0 ? alertsCount : undefined, isAlert: true },
        { id: "properties", label: "Properties" },
        { id: "settings", label: "Settings" }
      ]
    : [
        { id: "overview", label: "Dashboard" },
        { id: "leads", label: "My Leads", count: leadsCount },
        { id: "properties", label: "Properties" },
        { id: "settings", label: "Settings" }
      ];

  const handleSelect = (id: AppSection) => {
    onSelectSection(id);
    onCloseMobile();
  };

  const sidebarContent = (isMobileDrawer: boolean) => (
    <aside
      aria-label="Sidebar navigation"
      style={{
        width: isMobileDrawer ? "240px" : collapsed ? "68px" : "220px",
        minHeight: "100vh",
        height: "100%",
        backgroundColor: theme.sidebarBg,
        borderRight: `1px solid ${theme.sidebarBorder}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "width 0.2s ease",
        flexShrink: 0,
        position: isMobileDrawer ? "fixed" : "sticky",
        top: 0,
        left: 0,
        zIndex: isMobileDrawer ? 120 : 40
      }}
    >
      <div>
        {/* Brand Header */}
        <div
          style={{
            height: "58px",
            padding: collapsed && !isMobileDrawer ? "0 14px" : "0 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed && !isMobileDrawer ? "center" : "space-between",
            borderBottom: `1px solid ${theme.sidebarBorder}`
          }}
        >
          <button
            type="button"
            onClick={() => handleSelect("overview")}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              cursor: "pointer",
              color: "#FFFFFF",
              overflow: "hidden"
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #1BA88E 0%, #117A66 100%)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}
            >
              <svg width="17" height="17" viewBox="0 0 64 64" fill="none">
                <path
                  d="M32 8L11 54H20.5L25.5 42.5H38.5L43.5 54H53L32 8ZM28.2 35L32 25.5L35.8 35H28.2Z"
                  fill="#FFFFFF"
                />
              </svg>
            </span>
            {(!collapsed || isMobileDrawer) && (
              <span
                style={{
                  fontSize: "1.02rem",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "#FFFFFF",
                  whiteSpace: "nowrap"
                }}
              >
                Absolute Assets
              </span>
            )}
          </button>

          {isMobileDrawer && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              style={{
                background: "none",
                border: "none",
                color: theme.sidebarTextMuted,
                fontSize: "1.1rem",
                cursor: "pointer",
                padding: "4px"
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Clean 6-Item Navigation List */}
        <nav
          aria-label="Main navigation"
          style={{
            padding: "14px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "4px"
          }}
        >
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                title={collapsed && !isMobileDrawer ? item.label : undefined}
                onClick={() => handleSelect(item.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed && !isMobileDrawer ? "center" : "space-between",
                  gap: "10px",
                  padding: collapsed && !isMobileDrawer ? "10px" : "10px 12px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: active ? theme.sidebarActiveBg : "transparent",
                  color: active ? theme.sidebarActiveText : theme.sidebarTextMuted,
                  fontSize: "0.88rem",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  transition: "background-color 0.15s ease, color 0.15s ease",
                  textAlign: "left"
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.06)";
                    e.currentTarget.style.color = "#FFFFFF";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = theme.sidebarTextMuted;
                  }
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "11px", minWidth: 0 }}>
                  <NavIcon id={item.id} active={active} />
                  {(!collapsed || isMobileDrawer) && (
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.label}
                    </span>
                  )}
                </span>

                {(!collapsed || isMobileDrawer) && item.count !== undefined && (
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      color: active ? "#FFFFFF" : item.isAlert ? "#FCA5A5" : theme.sidebarTextMuted
                    }}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Subtle Bottom Collapse Control (Desktop Only) */}
      {!isMobileDrawer && (
        <div
          style={{
            padding: "12px 10px",
            borderTop: `1px solid ${theme.sidebarBorder}`
          }}
        >
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "transparent",
              color: theme.sidebarTextMuted,
              fontSize: "0.8rem",
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between"
            }}
          >
            {!collapsed && <span>Collapse Menu</span>}
            <span aria-hidden="true">{collapsed ? "»" : "«"}</span>
          </button>
        </div>
      )}
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="aa-desktop-sidebar" style={{ display: "flex", flexShrink: 0 }}>
        {sidebarContent(false)}
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 115,
            backgroundColor: "rgba(15, 23, 42, 0.55)"
          }}
          onClick={onCloseMobile}
        >
          <div onClick={(e) => e.stopPropagation()}>{sidebarContent(true)}</div>
        </div>
      )}
    </>
  );
};
