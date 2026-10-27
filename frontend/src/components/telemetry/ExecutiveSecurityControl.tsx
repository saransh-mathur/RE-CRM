import React, { useState, useEffect } from "react";
import { ThemeColors } from "../../lib/theme";
import { MockUser } from "../../lib/mockData";

interface ExecutiveSecurityControlProps {
  theme: ThemeColors;
  token: string;
  backendUrl?: string;
  onSecurityEventLogged?: () => void;
}

export const ExecutiveSecurityControl: React.FC<ExecutiveSecurityControlProps> = ({
  theme,
  token,
  backendUrl = "http://localhost:8000",
  onSecurityEventLogged
}) => {
  const [executives, setExecutives] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchExecutives = async () => {
    try {
      const resp = await fetch(`${backendUrl}/api/v1/telemetry/owner-forensics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        // Filter to only the 4 field executives
        const execs = (data.executives || []).filter((u: MockUser) => u.role === "AGENT");
        setExecutives(execs);
      }
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutives();
  }, [token]);

  const handleExecutiveAction = async (employeeCode: string, action: string, value: any, agentName: string) => {
    try {
      const resp = await fetch(`${backendUrl}/api/v1/telemetry/executive-security`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ employee_code: employeeCode, action, value })
      });

      if (resp.ok) {
        let msg = "";
        if (action === "TOGGLE_ENFORCE_MFA") msg = `Enforce MFA policy updated for ${agentName}.`;
        else if (action === "RESET_MFA") msg = `MFA reset for ${agentName}.`;
        else if (action === "LOCK_ACCOUNT") msg = `${agentName}'s account has been ${value ? "LOCKED" : "UNLOCKED"}.`;
        else if (action === "REVOKE_SESSION") msg = `Active session forcibly revoked for ${agentName}. User must re-authenticate.`;

        setActionMessage(`🛡️ ${msg}`);
        fetchExecutives();
        if (onSecurityEventLogged) onSecurityEventLogged();
        setTimeout(() => setActionMessage(null), 4500);
      }
    } catch (err) {
      alert("Failed to update executive security controls.");
    }
  };

  return (
    <div style={{
      backgroundColor: theme.cardBg,
      backdropFilter: theme.glassBackdrop,
      WebkitBackdropFilter: theme.glassBackdrop,
      border: theme.glassBorder,
      boxShadow: theme.glassShadow,
      borderRadius: "18px",
      padding: "20px 24px",
      marginTop: "16px"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>🛡️</span>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: theme.textPrimary, margin: 0 }}>
              Executive Login Security & MFA Control
            </h3>
          </div>
          <p style={{ fontSize: "0.8rem", color: theme.textSecondary, margin: "4px 0 0 0" }}>
            Enforce mandatory 2FA, remotely terminate unauthorized sessions, and lock accounts upon suspected data theft.
          </p>
        </div>

        <span style={{
          fontSize: "0.72rem",
          padding: "4px 10px",
          borderRadius: "999px",
          backgroundColor: theme.cardBgSecondary,
          color: theme.textPrimary,
          fontWeight: "700",
          border: `1px solid ${theme.border}`
        }}>
          4 Field Executives Enrolled
        </span>
      </div>

      {actionMessage && (
        <div style={{
          padding: "10px 14px",
          borderRadius: "10px",
          backgroundColor: theme.cardBgSecondary,
          border: `1px solid ${theme.border}`,
          color: theme.textPrimary,
          fontSize: "0.82rem",
          fontWeight: "700",
          marginBottom: "14px"
        }}>
          {actionMessage}
        </div>
      )}

      {/* Executives Control Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem", color: theme.textSecondary }}>
          <thead>
            <tr style={{ backgroundColor: theme.tableHeaderBg, color: theme.textMuted, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "700", borderBottom: `1px solid ${theme.border}` }}>
              <th style={{ padding: "10px 14px" }}>Executive</th>
              <th style={{ padding: "10px 14px" }}>Active Device & Channel</th>
              <th style={{ padding: "10px 14px" }}>MFA Status</th>
              <th style={{ padding: "10px 14px" }}>Account State</th>
              <th style={{ padding: "10px 14px", textAlign: "right" }}>Owner / Admin Actions</th>
            </tr>
          </thead>
          <tbody>
            {executives.map((exec) => (
              <tr
                key={exec.employee_code}
                style={{ borderBottom: `1px solid ${theme.border}`, transition: "background-color 0.15s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.tableRowHover)}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <td style={{ padding: "12px 14px", fontWeight: "700", color: theme.textPrimary }}>
                  <div>{exec.full_name}</div>
                  <div style={{ fontSize: "0.72rem", color: theme.textMuted }}>
                    {exec.employee_code} • {exec.assigned_territory}
                  </div>
                </td>

                <td style={{ padding: "12px 14px" }}>
                  <div style={{ color: theme.textPrimary, fontWeight: "600" }}>{exec.last_login_device}</div>
                  <div style={{ fontSize: "0.72rem", color: theme.textMuted }}>
                    IP: {exec.last_login_ip} • {exec.last_login_channel === "MOBILE_APP" ? "📱 Mobile App" : "💻 Web Portal"}
                  </div>
                </td>

                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      borderRadius: "999px",
                      fontWeight: "700",
                      backgroundColor: theme.cardBgSecondary,
                      color: theme.textPrimary,
                      border: `1px solid ${theme.border}`
                    }}>
                      {exec.mfa_enforced ? "🔒 Enforced Policy" : exec.mfa_enabled ? "✓ Enabled" : "⚠️ Disabled"}
                    </span>
                  </div>
                </td>

                <td style={{ padding: "12px 14px" }}>
                  <span style={{
                    fontSize: "0.7rem",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    fontWeight: "700",
                    backgroundColor: theme.cardBgSecondary,
                    color: theme.textPrimary,
                    border: `1px solid ${theme.border}`
                  }}>
                    {exec.account_locked ? "🛑 LOCKED" : "🟢 ACTIVE"}
                  </span>
                </td>

                <td style={{ padding: "12px 14px", textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {/* Toggle Enforce MFA */}
                    <button
                      onClick={() => handleExecutiveAction(exec.employee_code, "TOGGLE_ENFORCE_MFA", !exec.mfa_enforced, exec.full_name)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.cardBgElevated,
                        color: theme.textPrimary,
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      {exec.mfa_enforced ? "Unenforce MFA" : "Mandate 2FA"}
                    </button>

                    {/* Reset 2FA */}
                    {exec.mfa_enabled && (
                      <button
                        onClick={() => handleExecutiveAction(exec.employee_code, "RESET_MFA", null, exec.full_name)}
                        style={{
                          padding: "5px 10px",
                          borderRadius: "6px",
                          border: `1px solid ${theme.border}`,
                          backgroundColor: theme.cardBgElevated,
                          color: theme.textSecondary,
                          fontSize: "0.72rem",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                      >
                        Reset 2FA
                      </button>
                    )}

                    {/* Lock / Unlock */}
                    <button
                      onClick={() => handleExecutiveAction(exec.employee_code, "LOCK_ACCOUNT", !exec.account_locked, exec.full_name)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: `1px solid ${theme.border}`,
                        backgroundColor: exec.account_locked ? theme.textPrimary : theme.cardBgElevated,
                        color: exec.account_locked ? (theme.bg.includes("#090d16") ? "#000000" : "#ffffff") : theme.textPrimary,
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      {exec.account_locked ? "Unlock User" : "Lock User"}
                    </button>

                    {/* Revoke Session */}
                    <button
                      onClick={() => handleExecutiveAction(exec.employee_code, "REVOKE_SESSION", null, exec.full_name)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "6px",
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.cardBgElevated,
                        color: theme.textPrimary,
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      Terminate Session
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
