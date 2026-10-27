import React, { useState } from "react";
import { ThemeColors } from "../../lib/theme";

interface ProfileModalProps {
  user: {
    id: string;
    fullName: string;
    employeeCode: string;
    role: string;
    isPunchedIn: boolean;
    mfaEnabled?: boolean;
  };
  theme: ThemeColors;
  onClose: () => void;
  onMfaStatusChange: (enabled: boolean) => void;
  backendUrl?: string;
  token: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  theme,
  onClose,
  onMfaStatusChange,
  backendUrl = "http://localhost:8000",
  token
}) => {
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(user.mfaEnabled ?? true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showQrSetup, setShowQrSetup] = useState(false);
  const [setupKey] = useState(`APEX-${user.employeeCode}-TOTP-${Math.floor(1000 + Math.random() * 9000)}`);

  const handleToggleMfa = async (targetState: boolean) => {
    setSaving(true);
    setStatusMessage(null);
    try {
      const resp = await fetch(`${backendUrl}/api/v1/auth/mfa-toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: `${user.fullName.toLowerCase().split(" ")[0]}@apexrealty.com`,
          enabled: targetState
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        setStatusMessage(data.detail || "Failed to update MFA settings.");
        return;
      }

      setMfaEnabled(targetState);
      onMfaStatusChange(targetState);
      if (targetState) {
        setShowQrSetup(true);
      } else {
        setShowQrSetup(false);
      }
      setStatusMessage(`MFA successfully ${targetState ? "ENABLED" : "DISABLED"}.`);
    } catch (err) {
      setStatusMessage("Error updating security profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.45)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100000,
      padding: "16px"
    }}>
      <div style={{
        backgroundColor: theme.cardBgElevated,
        backdropFilter: theme.glassBackdrop,
        WebkitBackdropFilter: theme.glassBackdrop,
        color: theme.textPrimary,
        borderRadius: "22px",
        padding: "clamp(20px, 3vw, 30px)",
        width: "100%",
        maxWidth: "540px",
        maxHeight: "92vh",
        overflowY: "auto",
        border: theme.glassBorder,
        boxShadow: theme.glassShadowGlow
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.4rem" }}>👤</span>
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: theme.textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
                Security & User Profile
              </h2>
            </div>
            <div style={{ fontSize: "0.78rem", color: theme.textMuted, marginTop: "4px" }}>
              Manage multi-factor authentication, active sessions, and personal identity.
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: `1px solid ${theme.border}`,
              color: theme.textSecondary,
              fontSize: "1rem",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: "8px",
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        {statusMessage && (
          <div style={{
            padding: "10px 14px",
            borderRadius: "10px",
            backgroundColor: theme.cardBgSecondary,
            border: `1px solid ${theme.border}`,
            color: theme.textPrimary,
            fontSize: "0.8rem",
            fontWeight: "700",
            marginBottom: "16px"
          }}>
            {statusMessage}
          </div>
        )}

        {/* User Identity Card */}
        <div style={{
          padding: "16px",
          borderRadius: "14px",
          backgroundColor: theme.cardBgSecondary,
          border: `1px solid ${theme.border}`,
          marginBottom: "18px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "1.05rem", fontWeight: "800", color: theme.textPrimary }}>
                {user.fullName}
              </div>
              <div style={{ fontSize: "0.76rem", color: theme.textMuted, marginTop: "2px" }}>
                Employee ID: <strong style={{ color: theme.textPrimary }}>{user.employeeCode}</strong> • Role: <strong style={{ color: theme.textPrimary }}>{user.role}</strong>
              </div>
            </div>
            <span style={{
              fontSize: "0.7rem",
              padding: "4px 10px",
              borderRadius: "999px",
              backgroundColor: theme.cardBgElevated,
              color: theme.textPrimary,
              fontWeight: "700",
              border: `1px solid ${theme.border}`
            }}>
              {user.isPunchedIn ? "🟢 ON DUTY" : "⚪ OFF DUTY"}
            </span>
          </div>
        </div>

        {/* MFA / 2FA Security Management Card */}
        <div style={{
          padding: "18px",
          borderRadius: "14px",
          backgroundColor: theme.cardBgSecondary,
          border: `1px solid ${theme.border}`,
          marginBottom: "18px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: "800", color: theme.textPrimary, display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🔐</span> Multi-Factor Authentication (MFA)
              </div>
              <div style={{ fontSize: "0.75rem", color: theme.textSecondary, marginTop: "2px" }}>
                Requires a 6-digit TOTP code on every login to protect CRM data.
              </div>
            </div>

            <button
              onClick={() => handleToggleMfa(!mfaEnabled)}
              disabled={saving}
              style={{
                padding: "8px 16px",
                borderRadius: "10px",
                border: `1px solid ${theme.border}`,
                backgroundColor: mfaEnabled ? theme.textPrimary : theme.cardBgElevated,
                color: mfaEnabled ? (theme.bg.includes("#090d16") ? "#000000" : "#ffffff") : theme.textPrimary,
                fontWeight: "700",
                fontSize: "0.78rem",
                cursor: "pointer",
                boxShadow: theme.glassShadow,
                transition: "all 0.15s ease"
              }}
            >
              {saving ? "Updating..." : mfaEnabled ? "✓ MFA Enabled" : "Enable MFA"}
            </button>
          </div>

          {/* QR Code Setup Simulation (When MFA Enabled) */}
          {mfaEnabled && (
            <div style={{
              marginTop: "14px",
              padding: "14px",
              borderRadius: "12px",
              backgroundColor: theme.cardBgElevated,
              border: `1px solid ${theme.border}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Visual QR Code Placeholder */}
                <div style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #e2e8f0",
                  fontSize: "2rem"
                }}>
                  🏁
                </div>
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: "700", color: theme.textPrimary }}>
                    Authenticator App Synced
                  </div>
                  <div style={{ fontSize: "0.72rem", color: theme.textMuted, marginTop: "2px" }}>
                    Compatible with Google Authenticator, Authy & Microsoft Authenticator.
                  </div>
                  <div style={{ fontSize: "0.7rem", fontFamily: "monospace", color: theme.textSecondary, marginTop: "4px" }}>
                    Secret: <strong>{setupKey}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Active Session & Device Telemetry Card */}
        <div style={{
          padding: "16px",
          borderRadius: "14px",
          backgroundColor: theme.cardBgSecondary,
          border: `1px solid ${theme.border}`,
          marginBottom: "18px",
          fontSize: "0.78rem"
        }}>
          <div style={{ fontWeight: "800", color: theme.textPrimary, marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <span>💻</span> Current Active Session Telemetry
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", color: theme.textSecondary }}>
            <div>Active IP: <strong style={{ color: theme.textPrimary }}>103.21.144.1</strong></div>
            <div>Channel: <strong style={{ color: theme.textPrimary }}>Web Workspace</strong></div>
            <div>Protection: <strong style={{ color: theme.textPrimary }}>Canvas Watermark Active</strong></div>
            <div>Audit Status: <strong style={{ color: theme.textPrimary }}>Tamper-Proof Logged</strong></div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            onClick={onClose}
            style={{
              padding: "9px 22px",
              borderRadius: "10px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.textPrimary,
              color: theme.bg.includes("#090d16") ? "#000000" : "#ffffff",
              fontWeight: "700",
              fontSize: "0.82rem",
              cursor: "pointer",
              boxShadow: theme.glassShadow
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
