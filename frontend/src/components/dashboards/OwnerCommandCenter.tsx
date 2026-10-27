import React, { useState, useEffect } from "react";
import { ThemeColors } from "../../lib/theme";
import { LoginRecord, CallLogRecord, MinuteActivityRecord, MockUser } from "../../lib/mockData";
import { ExecutiveSecurityControl } from "../telemetry/ExecutiveSecurityControl";
import { formatIndianCurrency } from "../../lib/formatters";

interface OwnerCommandCenterProps {
  userRole: string;
  theme: ThemeColors;
  token: string;
  backendUrl?: string;
  leadsCount: number;
}

export const OwnerCommandCenter: React.FC<OwnerCommandCenterProps> = ({
  userRole,
  theme,
  token,
  backendUrl = "http://localhost:8000",
  leadsCount
}) => {
  const [activeTab, setActiveTab] = useState<"stream" | "logins" | "calls" | "deals" | "security">("stream");
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([]);
  const [callLogs, setCallLogs] = useState<CallLogRecord[]>([]);
  const [activities, setActivities] = useState<MinuteActivityRecord[]>([]);
  const [executives, setExecutives] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<"ALL" | "CRITICAL" | "DEAL">("ALL");

  const fetchForensics = async () => {
    try {
      const resp = await fetch(`${backendUrl}/api/v1/telemetry/owner-forensics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setLoginRecords(data.login_records || []);
        setCallLogs(data.call_logs || []);
        setActivities(data.activities || []);
        setExecutives((data.executives || []).filter((u: MockUser) => u.role === "AGENT"));
      }
    } catch (err) {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForensics();
    const interval = setInterval(fetchForensics, 5000);
    return () => clearInterval(interval);
  }, [token]);

  // Strict Owner Access Guard
  if (userRole !== "OWNER") {
    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        backgroundColor: theme.cardBg,
        border: theme.glassBorder,
        borderRadius: "20px",
        color: theme.textPrimary
      }}>
        <div style={{ fontSize: "2.4rem", marginBottom: "12px" }}>🔒</div>
        <h3 style={{ fontSize: "1.2rem", fontWeight: "800", margin: "0 0 6px 0" }}>
          Restricted to Agency Owner
        </h3>
        <p style={{ fontSize: "0.85rem", color: theme.textSecondary, maxWidth: "460px", margin: "0 auto" }}>
          The Executive Telemetry, Minute-by-Minute Surveillance Stream, and Login Audit Radar are accessible strictly to the Agency Owner persona.
        </p>
      </div>
    );
  }

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    if (filterSeverity === "CRITICAL") return act.severity === "CRITICAL";
    if (filterSeverity === "DEAL") return act.activity_type === "DEAL_UPDATE";
    return true;
  });

  const totalCallSeconds = callLogs.reduce((acc, c) => acc + (c.duration_seconds || 0), 0);
  const totalCallMinutes = Math.round(totalCallSeconds / 60);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top Banner: Sovereign Owner Mission Control */}
      <div style={{
        backgroundColor: theme.cardBg,
        backdropFilter: theme.glassBackdrop,
        WebkitBackdropFilter: theme.glassBackdrop,
        border: theme.glassBorder,
        boxShadow: theme.glassShadow,
        borderRadius: "18px",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.3rem" }}>👑</span>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: theme.textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
              Owner Forensic Radar & Minute Surveillance
            </h2>
          </div>
          <p style={{ fontSize: "0.82rem", color: theme.textSecondary, margin: "6px 0 0 0", maxWidth: "620px", lineHeight: 1.5 }}>
            Real-time chronological telemetry of all 4 field executives: login attempts, devices used, IP addresses, browser agents, deal stage velocity, call bridge duration logs, and anti-theft alerts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{
            fontSize: "0.72rem",
            padding: "4px 10px",
            borderRadius: "999px",
            backgroundColor: theme.cardBgSecondary,
            color: theme.textPrimary,
            fontWeight: "700",
            border: `1px solid ${theme.border}`
          }}>
            🟢 Live Radar Syncing (5s Polling)
          </span>
          <button
            onClick={fetchForensics}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgElevated,
              color: theme.textPrimary,
              fontWeight: "700",
              fontSize: "0.75rem",
              cursor: "pointer"
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px"
      }}>
        <div style={{
          backgroundColor: theme.cardBg,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: theme.glassBorder,
          borderRadius: "16px",
          padding: "18px 20px",
          boxShadow: theme.glassShadow
        }}>
          <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "700", textTransform: "uppercase" }}>
            Total Logins Tracked
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: theme.textPrimary, marginTop: "4px" }}>
            {loginRecords.length}
          </div>
          <div style={{ fontSize: "0.74rem", color: theme.textSecondary, marginTop: "4px" }}>
            Across 4 Field Executives & Management
          </div>
        </div>

        <div style={{
          backgroundColor: theme.cardBg,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: theme.glassBorder,
          borderRadius: "16px",
          padding: "18px 20px",
          boxShadow: theme.glassShadow
        }}>
          <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "700", textTransform: "uppercase" }}>
            Encrypted Call Talk-Time
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: theme.textPrimary, marginTop: "4px" }}>
            {totalCallMinutes} Mins
          </div>
          <div style={{ fontSize: "0.74rem", color: theme.textSecondary, marginTop: "4px" }}>
            {callLogs.length} Masked Telephony Bridges Connected
          </div>
        </div>

        <div style={{
          backgroundColor: theme.cardBg,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: theme.glassBorder,
          borderRadius: "16px",
          padding: "18px 20px",
          boxShadow: theme.glassShadow
        }}>
          <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "700", textTransform: "uppercase" }}>
            Minute Activities Logged
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: theme.textPrimary, marginTop: "4px" }}>
            {activities.length}
          </div>
          <div style={{ fontSize: "0.74rem", color: theme.textSecondary, marginTop: "4px" }}>
            Deal updates, calls, views & GPS breadcrumbs
          </div>
        </div>

        <div style={{
          backgroundColor: theme.cardBg,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: theme.glassBorder,
          borderRadius: "16px",
          padding: "18px 20px",
          boxShadow: theme.glassShadow
        }}>
          <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "700", textTransform: "uppercase" }}>
            DLP Protection Status
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: "800", color: theme.textPrimary, marginTop: "8px" }}>
            🛡️ 100% Enforced
          </div>
          <div style={{ fontSize: "0.74rem", color: theme.textSecondary, marginTop: "4px" }}>
            Anti-Screenshot & Defocus Veil Active
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        backgroundColor: theme.cardBgSecondary,
        padding: "6px",
        borderRadius: "14px",
        border: `1px solid ${theme.border}`,
        width: "fit-content"
      }}>
        <button
          onClick={() => setActiveTab("stream")}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            border: activeTab === "stream" ? `1px solid ${theme.border}` : "1px solid transparent",
            backgroundColor: activeTab === "stream" ? theme.cardBgElevated : "transparent",
            color: theme.textPrimary,
            fontWeight: activeTab === "stream" ? "800" : "600",
            fontSize: "0.82rem",
            cursor: "pointer"
          }}
        >
          ⏱️ Minute-by-Minute Live Ticker
        </button>

        <button
          onClick={() => setActiveTab("logins")}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            border: activeTab === "logins" ? `1px solid ${theme.border}` : "1px solid transparent",
            backgroundColor: activeTab === "logins" ? theme.cardBgElevated : "transparent",
            color: theme.textPrimary,
            fontWeight: activeTab === "logins" ? "800" : "600",
            fontSize: "0.82rem",
            cursor: "pointer"
          }}
        >
          💻 Executive Login & Device Telemetry ({loginRecords.length})
        </button>

        <button
          onClick={() => setActiveTab("calls")}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            border: activeTab === "calls" ? `1px solid ${theme.border}` : "1px solid transparent",
            backgroundColor: activeTab === "calls" ? theme.cardBgElevated : "transparent",
            color: theme.textPrimary,
            fontWeight: activeTab === "calls" ? "800" : "600",
            fontSize: "0.82rem",
            cursor: "pointer"
          }}
        >
          📞 Call Bridge Logs & Recordings ({callLogs.length})
        </button>

        <button
          onClick={() => setActiveTab("deals")}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            border: activeTab === "deals" ? `1px solid ${theme.border}` : "1px solid transparent",
            backgroundColor: activeTab === "deals" ? theme.cardBgElevated : "transparent",
            color: theme.textPrimary,
            fontWeight: activeTab === "deals" ? "800" : "600",
            fontSize: "0.82rem",
            cursor: "pointer"
          }}
        >
          💼 Deals & Commission Tracking
        </button>

        <button
          onClick={() => setActiveTab("security")}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            border: activeTab === "security" ? `1px solid ${theme.border}` : "1px solid transparent",
            backgroundColor: activeTab === "security" ? theme.cardBgElevated : "transparent",
            color: theme.textPrimary,
            fontWeight: activeTab === "security" ? "800" : "600",
            fontSize: "0.82rem",
            cursor: "pointer"
          }}
        >
          🛡️ Executive Security & MFA Admin
        </button>
      </div>

      {/* TAB 1: MINUTE-BY-MINUTE LIVE ACTIVITY STREAM */}
      {activeTab === "stream" && (
        <div style={{
          backgroundColor: theme.cardBg,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: theme.glassBorder,
          borderRadius: "18px",
          padding: "20px 24px",
          boxShadow: theme.glassShadow
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: "800", color: theme.textPrimary, margin: 0 }}>
                Live Chronological Activity Feed
              </h3>
              <p style={{ fontSize: "0.78rem", color: theme.textSecondary, margin: "2px 0 0 0" }}>
                Every minute action across leads, site visits, deals, calls, and security events.
              </p>
            </div>

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={() => setFilterSeverity("ALL")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: filterSeverity === "ALL" ? theme.cardBgElevated : "transparent",
                  color: theme.textPrimary,
                  fontSize: "0.74rem",
                  fontWeight: filterSeverity === "ALL" ? "700" : "500",
                  cursor: "pointer"
                }}
              >
                All Events
              </button>
              <button
                onClick={() => setFilterSeverity("DEAL")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: filterSeverity === "DEAL" ? theme.cardBgElevated : "transparent",
                  color: theme.textPrimary,
                  fontSize: "0.74rem",
                  fontWeight: filterSeverity === "DEAL" ? "700" : "500",
                  cursor: "pointer"
                }}
              >
                Deals Only
              </button>
              <button
                onClick={() => setFilterSeverity("CRITICAL")}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: filterSeverity === "CRITICAL" ? theme.cardBgElevated : "transparent",
                  color: theme.textPrimary,
                  fontSize: "0.74rem",
                  fontWeight: filterSeverity === "CRITICAL" ? "700" : "500",
                  cursor: "pointer"
                }}
              >
                Security & Theft Alerts
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "480px", overflowY: "auto" }}>
            {filteredActivities.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: theme.textMuted }}>No activities matching filter.</div>
            ) : (
              filteredActivities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "12px",
                    backgroundColor: theme.cardBgSecondary,
                    border: `1px solid ${theme.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "12px"
                  }}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                    <div style={{ fontSize: "1.2rem", marginTop: "2px" }}>
                      {act.activity_type === "DEAL_UPDATE" ? "💰" :
                       act.activity_type === "CALL_PLACED" ? "📞" :
                       act.activity_type === "GPS_CHECKIN" ? "📍" :
                       act.activity_type === "SECURITY_ALERT" ? "🛡️" : "📋"}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "800", color: theme.textPrimary }}>
                          {act.title}
                        </span>
                        <span style={{
                          fontSize: "0.68rem",
                          padding: "2px 7px",
                          borderRadius: "999px",
                          backgroundColor: theme.cardBgElevated,
                          color: theme.textPrimary,
                          fontWeight: "700",
                          border: `1px solid ${theme.border}`
                        }}>
                          👤 {act.agent_name} ({act.employee_code})
                        </span>
                        {act.deal_value && (
                          <span style={{
                            fontSize: "0.68rem",
                            padding: "2px 7px",
                            borderRadius: "999px",
                            backgroundColor: theme.cardBgElevated,
                            color: theme.textPrimary,
                            fontWeight: "800",
                            border: `1px solid ${theme.border}`
                          }}>
                            Deal: {formatIndianCurrency(act.deal_value)} (Comm: {formatIndianCurrency(act.brokerage_commission || 0)})
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: theme.textSecondary, marginTop: "4px", lineHeight: 1.4 }}>
                        {act.description}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: "0.72rem", color: theme.textMuted, whiteSpace: "nowrap" }}>
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: LOGIN ATTEMPTS & DEVICE TELEMETRY */}
      {activeTab === "logins" && (
        <div style={{
          backgroundColor: theme.cardBg,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: theme.glassBorder,
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: theme.glassShadow
        }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: "800", color: theme.textPrimary, margin: 0 }}>
                Every User's Login Attempts & Device Hardware Tracker
              </h3>
              <p style={{ fontSize: "0.76rem", color: theme.textSecondary, margin: "2px 0 0 0" }}>
                Identifies mobile vs laptop, IP address, browser agent, login frequency today, and MFA security status.
              </p>
            </div>
            <span style={{ fontSize: "0.74rem", color: theme.textSecondary, fontWeight: "600" }}>
              Total Records: {loginRecords.length}
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem", color: theme.textSecondary }}>
              <thead>
                <tr style={{ backgroundColor: theme.tableHeaderBg, color: theme.textMuted, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "700", borderBottom: `1px solid ${theme.border}` }}>
                  <th style={{ padding: "12px 16px" }}>User & Role</th>
                  <th style={{ padding: "12px 16px" }}>Device Model</th>
                  <th style={{ padding: "12px 16px" }}>IP Address</th>
                  <th style={{ padding: "12px 16px" }}>Browser</th>
                  <th style={{ padding: "12px 16px" }}>Channel</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {loginRecords.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: `1px solid ${theme.border}`, transition: "background-color 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.tableRowHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: theme.textPrimary }}>
                      <div>{log.user_name}</div>
                      <div style={{ fontSize: "0.72rem", color: theme.textMuted }}>
                        {log.employee_code} • {log.role}
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px", color: theme.textPrimary, fontWeight: "600" }}>
                      {log.device_model}
                    </td>

                    <td style={{ padding: "12px 16px", fontFamily: "monospace", color: theme.textPrimary }}>
                      {log.ip_address}
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      {log.browser}
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        fontSize: "0.7rem",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor: theme.cardBgSecondary,
                        color: theme.textPrimary,
                        fontWeight: "700",
                        border: `1px solid ${theme.border}`
                      }}>
                        {log.channel === "MOBILE_APP" ? "📱 Mobile App" : "💻 Web App"}
                      </span>
                    </td>

                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        fontSize: "0.7rem",
                        padding: "3px 8px",
                        borderRadius: "999px",
                        backgroundColor: theme.cardBgSecondary,
                        color: theme.textPrimary,
                        fontWeight: "800",
                        border: `1px solid ${theme.border}`
                      }}>
                        {log.status === "SUCCESS" ? "✓ SUCCESS (MFA)" :
                         log.status === "FAILED_MFA" ? "⚠️ INVALID MFA" : "🛑 LOCKED"}
                      </span>
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "right", color: theme.textMuted, fontSize: "0.75rem" }}>
                      {new Date(log.timestamp).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CALL LOGS LEDGER */}
      {activeTab === "calls" && (
        <div style={{
          backgroundColor: theme.cardBg,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: theme.glassBorder,
          borderRadius: "18px",
          overflow: "hidden",
          boxShadow: theme.glassShadow
        }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ fontSize: "1rem", fontWeight: "800", color: theme.textPrimary, margin: 0 }}>
                Masked Call Bridge Logs & Recordings Registry
              </h3>
              <p style={{ fontSize: "0.76rem", color: theme.textSecondary, margin: "2px 0 0 0" }}>
                Tracks caller executive, duration, bridge ID, encrypted recording tag, and outcome notes.
              </p>
            </div>
            <span style={{ fontSize: "0.74rem", color: theme.textSecondary, fontWeight: "600" }}>
              Total Talk Time: {totalCallMinutes} Minutes
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem", color: theme.textSecondary }}>
              <thead>
                <tr style={{ backgroundColor: theme.tableHeaderBg, color: theme.textMuted, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: "700", borderBottom: `1px solid ${theme.border}` }}>
                  <th style={{ padding: "12px 16px" }}>Caller Executive</th>
                  <th style={{ padding: "12px 16px" }}>Prospect Client</th>
                  <th style={{ padding: "12px 16px" }}>Inquiry Property</th>
                  <th style={{ padding: "12px 16px" }}>Duration</th>
                  <th style={{ padding: "12px 16px" }}>Bridge ID</th>
                  <th style={{ padding: "12px 16px" }}>Outcome & Notes</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {callLogs.map((c) => (
                  <tr
                    key={c.id}
                    style={{ borderBottom: `1px solid ${theme.border}`, transition: "background-color 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.tableRowHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: theme.textPrimary }}>
                      👤 {c.caller_name} ({c.caller_code})
                    </td>

                    <td style={{ padding: "12px 16px", color: theme.textPrimary }}>
                      <div>{c.lead_name}</div>
                      <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontFamily: "monospace" }}>
                        🔒 {c.lead_phone_masked}
                      </div>
                    </td>

                    <td style={{ padding: "12px 16px", color: theme.textSecondary, fontSize: "0.78rem" }}>
                      {c.property_title}
                    </td>

                    <td style={{ padding: "12px 16px", fontWeight: "800", color: theme.textPrimary }}>
                      ⏱️ {c.duration_formatted}
                    </td>

                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "0.74rem" }}>
                      {c.bridge_id}
                    </td>

                    <td style={{ padding: "12px 16px", maxWidth: "260px" }}>
                      <div style={{ fontWeight: "700", color: theme.textPrimary }}>{c.outcome}</div>
                      <div style={{ fontSize: "0.72rem", color: theme.textMuted, marginTop: "2px" }}>{c.notes}</div>
                    </td>

                    <td style={{ padding: "12px 16px", textAlign: "right", color: theme.textMuted, fontSize: "0.74rem" }}>
                      {new Date(c.start_time).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DEALS & COMMISSION VELOCITY */}
      {activeTab === "deals" && (
        <div style={{
          backgroundColor: theme.cardBg,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: theme.glassBorder,
          borderRadius: "18px",
          padding: "20px 24px",
          boxShadow: theme.glassShadow
        }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "800", color: theme.textPrimary, margin: "0 0 14px 0" }}>
            Field Executive Pipeline & Commission Velocity
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
            {executives.map((exec) => (
              <div
                key={exec.employee_code}
                style={{
                  padding: "16px",
                  borderRadius: "14px",
                  backgroundColor: theme.cardBgSecondary,
                  border: `1px solid ${theme.border}`
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "800", color: theme.textPrimary }}>
                      {exec.full_name}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: theme.textMuted }}>
                      {exec.employee_code} • {exec.assigned_territory}
                    </div>
                  </div>
                  <span style={{
                    fontSize: "0.68rem",
                    padding: "2px 8px",
                    borderRadius: "999px",
                    backgroundColor: theme.cardBgElevated,
                    color: theme.textPrimary,
                    fontWeight: "700",
                    border: `1px solid ${theme.border}`
                  }}>
                    {exec.last_login_channel === "MOBILE_APP" ? "📱 Mobile" : "💻 Laptop"}
                  </span>
                </div>

                <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.76rem" }}>
                  <div>Logins Today: <strong style={{ color: theme.textPrimary }}>{exec.login_count_today}</strong></div>
                  <div>Total Logins: <strong style={{ color: theme.textPrimary }}>{exec.total_logins}</strong></div>
                  <div>MFA Enforced: <strong style={{ color: theme.textPrimary }}>{exec.mfa_enforced ? "YES" : "NO"}</strong></div>
                  <div>Account: <strong style={{ color: theme.textPrimary }}>{exec.account_locked ? "LOCKED" : "ACTIVE"}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: EXECUTIVE SECURITY & MFA ADMIN */}
      {activeTab === "security" && (
        <ExecutiveSecurityControl
          theme={theme}
          token={token}
          backendUrl={backendUrl}
          onSecurityEventLogged={fetchForensics}
        />
      )}
    </div>
  );
};
