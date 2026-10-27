import React, { useState, useEffect } from "react";
import { ThemeColors } from "../../lib/theme";
import { AgentActivityModal, AgentTelemetryData } from "./AgentActivityModal";
import { formatIndianCurrency } from "../../lib/formatters";

interface AuditLog {
  id: string;
  event_type: string;
  severity: string;
  ip_address?: string;
  details_json?: string;
  created_at: string;
}

interface ExportReq {
  id: string;
  requester_id: string;
  status: string;
  reason: string;
  records_count: number;
  created_at: string;
}

interface SecurityTelemetryProps {
  token: string;
  userRole: string;
  theme: ThemeColors;
  backendUrl?: string;
  onConfiscateLeads?: (agentName: string) => void;
}

const DEFAULT_AGENTS: AgentTelemetryData[] = [
  {
    id: "ag-rahul",
    full_name: "Rahul Verma",
    email: "agent.rahul@apexrealty.com",
    employee_code: "EXE-204",
    role: "AGENT",
    phone: "+919822200000",
    assigned_territory: "Downtown Skyline",
    is_punched_in: true,
    last_punch_time: "2026-10-27T09:30:00Z",
    working_hours_today: "6h 45m",
    active_leads_count: 7,
    total_brokerage_managed: 2450000,
    device_type: "LAPTOP",
    device_model: "Dell XPS 15 (Windows 11)",
    ip_address: "103.21.144.10",
    current_location: "Downtown Skyline HQ (19.076, 72.877)",
    latitude: 19.0760,
    longitude: 72.8777,
    poaching_risk_score: "HIGH",
    poaching_risk_reason: "Customer contact viewed 6 times without using CRM bridge. Suspected direct personal calling.",
    offline_closing_flag: false
  },
  {
    id: "ag-ananya",
    full_name: "Ananya Patel",
    email: "agent.ananya@apexrealty.com",
    employee_code: "EXE-208",
    role: "AGENT",
    phone: "+919833344455",
    assigned_territory: "Palm Grove Estates",
    is_punched_in: true,
    last_punch_time: "2026-10-27T10:00:00Z",
    working_hours_today: "6h 15m",
    active_leads_count: 5,
    total_brokerage_managed: 4550000,
    device_type: "MOBILE_PHONE",
    device_model: "Apple iPhone 15 Pro",
    ip_address: "157.34.192.44",
    current_location: "Palm Grove Villa 12 Inspection (19.113, 72.869)",
    latitude: 19.1136,
    longitude: 72.8697,
    poaching_risk_score: "CRITICAL",
    poaching_risk_reason: "Marked 'LOST' in CRM for Kavita Chawla (₹7.25 Cr), but GPS logs prove 3 unlogged physical visits! Offline closing risk of ₹14.5 Lakhs brokerage.",
    offline_closing_flag: true
  },
  {
    id: "ag-vikram",
    full_name: "Vikram Malhotra",
    email: "agent.vikram@apexrealty.com",
    employee_code: "EXE-215",
    role: "AGENT",
    phone: "+919844455566",
    assigned_territory: "Marina Bay Promenade",
    is_punched_in: true,
    last_punch_time: "2026-10-27T09:45:00Z",
    working_hours_today: "6h 30m",
    active_leads_count: 4,
    total_brokerage_managed: 2400000,
    device_type: "MOBILE_PHONE",
    device_model: "Samsung Galaxy S24 Ultra",
    ip_address: "157.34.192.89",
    current_location: "Marina Azure Site Office (18.922, 72.834)",
    latitude: 18.9220,
    longitude: 72.8347,
    poaching_risk_score: "LOW",
    poaching_risk_reason: "Fully compliant CRM bridge calls logged (22 mins talk time).",
    offline_closing_flag: false
  },
  {
    id: "ag-karan",
    full_name: "Karan Mehta",
    email: "agent.karan@apexrealty.com",
    employee_code: "EXE-210",
    role: "AGENT",
    phone: "+919822277889",
    assigned_territory: "Bandra West & Worli Promenade",
    is_punched_in: true,
    last_punch_time: "2026-10-27T09:15:00Z",
    working_hours_today: "7h 00m",
    active_leads_count: 6,
    total_brokerage_managed: 3100000,
    device_type: "LAPTOP",
    device_model: "MacBook Pro 14 M3",
    ip_address: "103.21.144.55",
    current_location: "Bandra Sea Face Office (19.054, 72.826)",
    latitude: 19.0544,
    longitude: 72.8266,
    poaching_risk_score: "LOW",
    poaching_risk_reason: "Ultra-luxury client consultation completed with 100% CRM masked bridge compliance.",
    offline_closing_flag: false
  }
];

export const SecurityTelemetryView: React.FC<SecurityTelemetryProps> = ({
  token,
  userRole,
  theme,
  backendUrl = "http://localhost:8000",
  onConfiscateLeads
}) => {
  const [agents, setAgents] = useState<AgentTelemetryData[]>(DEFAULT_AGENTS);
  const [selectedAgent, setSelectedAgent] = useState<AgentTelemetryData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [exportsList, setExportsList] = useState<ExportReq[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [filter, setFilter] = useState<"ALL" | "ON_DUTY" | "FLAGGED">("ALL");

  const fetchSecurityData = async () => {
    try {
      // 1. Fetch live agents fleet
      const agentsResp = await fetch(`${backendUrl}/api/v1/telemetry/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (agentsResp.ok) {
        const fetchedAgents = await agentsResp.json();
        if (Array.isArray(fetchedAgents) && fetchedAgents.length > 0) {
          setAgents(fetchedAgents);
        }
      }

      // 2. Fetch security audit logs
      const logResp = await fetch(`${backendUrl}/api/v1/telemetry/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (logResp.ok) {
        setLogs(await logResp.json());
      }

      // 3. Fetch export requests
      const expResp = await fetch(`${backendUrl}/api/v1/exports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (expResp.ok) {
        setExportsList(await expResp.json());
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchSecurityData();
  }, [token]);

  const handleAgentClick = (agent: AgentTelemetryData) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  const handleReviewExport = async (requestId: string, approved: boolean) => {
    setReviewLoading(true);
    try {
      const resp = await fetch(`${backendUrl}/api/v1/exports/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ request_id: requestId, approved })
      });
      if (resp.ok) {
        fetchSecurityData();
      }
    } catch (err) {}
    finally {
      setReviewLoading(false);
    }
  };

  const getSeverityBadge = (sev: string) => {
    return (
      <span style={{
        fontSize: "0.7rem",
        padding: "3px 8px",
        borderRadius: "999px",
        backgroundColor: theme.cardBgElevated,
        color: theme.textPrimary,
        fontWeight: "700",
        border: `1px solid ${theme.border}`,
        letterSpacing: "0.02em"
      }}>
        {sev}
      </span>
    );
  };

  const filteredAgents = agents.filter((ag) => {
    if (filter === "ON_DUTY") return ag.is_punched_in;
    if (filter === "FLAGGED") return ag.offline_closing_flag || ag.poaching_risk_score === "CRITICAL" || ag.poaching_risk_score === "HIGH";
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Field Agent Fleet Overview */}
      <div style={{
        backgroundColor: theme.cardBg,
        backdropFilter: theme.glassBackdrop,
        WebkitBackdropFilter: theme.glassBackdrop,
        border: theme.glassBorder,
        borderRadius: "18px",
        padding: "24px",
        boxShadow: theme.glassShadow
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: theme.textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
                🛰️ Live Fleet Telemetry & Activity Inspector
              </h3>
              <span style={{
                fontSize: "0.72rem",
                padding: "3px 9px",
                borderRadius: "999px",
                backgroundColor: theme.cardBgSecondary,
                color: theme.textSecondary,
                fontWeight: "700",
                border: `1px solid ${theme.border}`
              }}>
                {agents.length} ENROLLED • {agents.filter(a => a.is_punched_in).length} ACTIVE
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.8rem", color: theme.textMuted }}>
              Select any executive to inspect real-time GPS breadcrumbs, call duration logs, and device hardware telemetry.
            </p>
          </div>

          {/* Filter Pills (Frosted Crystal Segmented Control) */}
          <div style={{
            display: "flex",
            gap: "5px",
            backgroundColor: theme.cardBgSecondary,
            padding: "4px",
            borderRadius: "10px",
            border: `1px solid ${theme.border}`
          }}>
            {[
              { id: "ALL", label: `All (${agents.length})` },
              { id: "ON_DUTY", label: `On Duty (${agents.filter(a => a.is_punched_in).length})` },
              { id: "FLAGGED", label: `Flagged (${agents.filter(a => a.offline_closing_flag || a.poaching_risk_score === "CRITICAL" || a.poaching_risk_score === "HIGH").length})` }
            ].map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "7px",
                    fontSize: "0.74rem",
                    fontWeight: active ? "700" : "500",
                    cursor: "pointer",
                    border: `1px solid ${active ? theme.border : "transparent"}`,
                    backgroundColor: active ? theme.cardBgElevated : "transparent",
                    color: active ? theme.textPrimary : theme.textMuted,
                    boxShadow: active ? theme.glassShadow : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Agent Interactive Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: "18px"
        }}>
          {filteredAgents.map((ag) => {
            const hasTheft = ag.offline_closing_flag || ag.poaching_risk_score === "CRITICAL" || ag.poaching_risk_score === "HIGH";

            return (
              <div
                key={ag.id}
                onClick={() => handleAgentClick(ag)}
                style={{
                  backgroundColor: theme.cardBgSecondary,
                  backdropFilter: theme.glassBackdrop,
                  WebkitBackdropFilter: theme.glassBackdrop,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "16px",
                  padding: "18px",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                  position: "relative",
                  boxShadow: theme.glassShadow
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = theme.glassShadowGlow;
                  e.currentTarget.style.borderColor = theme.textPrimary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = theme.glassShadow;
                  e.currentTarget.style.borderColor = theme.border;
                }}
              >
                {/* Top Row: Name + Duty Badge */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <strong style={{ color: theme.textPrimary, fontSize: "0.95rem", display: "block" }}>
                      {ag.full_name}
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: theme.textMuted }}>
                      {ag.employee_code} • {ag.assigned_territory}
                    </span>
                  </div>

                  <span style={{
                    fontSize: "0.68rem",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    fontWeight: "700",
                    backgroundColor: theme.cardBgElevated,
                    color: theme.textPrimary,
                    border: `1px solid ${theme.border}`,
                    whiteSpace: "nowrap",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px"
                  }}>
                    <span style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      backgroundColor: ag.is_punched_in ? theme.crystalAccent : theme.textMuted
                    }}></span>
                    {ag.is_punched_in ? "ON DUTY" : "OFF DUTY"}
                  </span>
                </div>

                {/* Device & Location */}
                <div style={{ fontSize: "0.8rem", color: theme.textSecondary, display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                  <div>
                    {ag.device_type === "MOBILE_PHONE" ? "📱 Mobile Phone: " : "💻 Laptop: "}
                    <span style={{ color: theme.textPrimary, fontWeight: "600" }}>
                      {ag.device_model}
                    </span>
                  </div>
                  <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    📍 Location: <span style={{ color: theme.textPrimary, fontWeight: "500" }}>
                      {ag.current_location}
                    </span>
                  </div>
                  <div>
                    ⚡ Active Leads: <strong style={{ color: theme.textPrimary }}>{ag.active_leads_count} Assigned</strong>
                    {ag.total_brokerage_managed && (
                      <span style={{ marginLeft: "6px", color: theme.textMuted }}>
                        ({formatIndianCurrency(ag.total_brokerage_managed)} Brokerage)
                      </span>
                    )}
                  </div>
                </div>

                {/* Risk / Compliance Tag */}
                {hasTheft ? (
                  <div style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    backgroundColor: theme.cardBgElevated,
                    border: `1px solid ${theme.border}`,
                    color: theme.textPrimary,
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "12px"
                  }}>
                    <span>🛡️</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ag.offline_closing_flag ? "Offline Meeting Detected (Villa 12)" : "Direct Calling Suspicion"}
                    </span>
                  </div>
                ) : (
                  <div style={{
                    padding: "6px 10px",
                    borderRadius: "8px",
                    backgroundColor: theme.cardBgElevated,
                    border: `1px solid ${theme.border}`,
                    color: theme.textMuted,
                    fontSize: "0.72rem",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginBottom: "12px"
                  }}>
                    <span>✓</span>
                    <span>Compliant Shift & CTI Bridge</span>
                  </div>
                )}

                {/* Clickable prompt button */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "10px",
                  borderTop: `1px solid ${theme.border}`,
                  fontSize: "0.75rem",
                  color: theme.textPrimary,
                  fontWeight: "600"
                }}>
                  <span>Inspect activities & GPS logs</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent Activity Detail Modal */}
      <AgentActivityModal
        agent={selectedAgent}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        theme={theme}
        onConfiscateLeads={onConfiscateLeads}
        backendUrl={backendUrl}
        token={token}
      />

      {/* Four-Eyes Export Governance Requests */}
      <div style={{
        backgroundColor: theme.cardBg,
        backdropFilter: theme.glassBackdrop,
        WebkitBackdropFilter: theme.glassBackdrop,
        border: theme.glassBorder,
        borderRadius: "18px",
        padding: "24px",
        boxShadow: theme.glassShadow
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: theme.textPrimary, margin: 0 }}>
            🛡️ DLP Export Governance (Four-Eyes Authorization)
          </h3>
          <span style={{ fontSize: "0.75rem", color: theme.textMuted }}>
            Requires Owner or Manager Dual Sign-off
          </span>
        </div>

        {exportsList.length === 0 ? (
          <div style={{ color: theme.textMuted, fontSize: "0.85rem" }}>No export requests registered.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {exportsList.map((exp) => (
              <div
                key={exp.id}
                style={{
                  backgroundColor: theme.cardBgSecondary,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "12px",
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{
                      fontSize: "0.7rem",
                      padding: "3px 8px",
                      borderRadius: "999px",
                      fontWeight: "700",
                      backgroundColor: theme.cardBgElevated,
                      color: theme.textPrimary,
                      border: `1px solid ${theme.border}`
                    }}>
                      {exp.status}
                    </span>
                    <strong style={{ color: theme.textPrimary, fontSize: "0.85rem" }}>
                      Requested {exp.records_count} Records
                    </strong>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: theme.textSecondary }}>
                    Reason: <em>"{exp.reason}"</em>
                  </div>
                </div>

                {exp.status === "PENDING" && (userRole === "ADMIN" || userRole === "MANAGER" || userRole === "OWNER") && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      disabled={reviewLoading}
                      onClick={() => handleReviewExport(exp.id, true)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.textPrimary,
                        color: theme.bg.includes("#090d16") ? "#000000" : "#ffffff",
                        fontWeight: "700",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      ✓ Approve (Sign)
                    </button>
                    <button
                      disabled={reviewLoading}
                      onClick={() => handleReviewExport(exp.id, false)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "8px",
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.cardBgElevated,
                        color: theme.textPrimary,
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      ✕ Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Immutable Security Audit Logs */}
      <div style={{
        backgroundColor: theme.cardBg,
        backdropFilter: theme.glassBackdrop,
        WebkitBackdropFilter: theme.glassBackdrop,
        border: theme.glassBorder,
        borderRadius: "18px",
        padding: "24px",
        boxShadow: theme.glassShadow
      }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: theme.textPrimary, marginBottom: "14px", marginTop: 0 }}>
          🔍 Real-Time Forensic Security Ledger (Immutable Audit)
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.8rem", color: theme.textSecondary }}>
            <thead>
              <tr style={{
                borderBottom: `1px solid ${theme.border}`,
                color: theme.textMuted,
                backgroundColor: theme.tableHeaderBg,
                textTransform: "uppercase",
                fontSize: "0.7rem",
                letterSpacing: "0.04em",
                fontWeight: "700"
              }}>
                <th style={{ padding: "12px 16px" }}>Incident Event</th>
                <th style={{ padding: "12px 16px" }}>Severity</th>
                <th style={{ padding: "12px 16px" }}>Source IP</th>
                <th style={{ padding: "12px 16px" }}>Forensic Incident Details</th>
                <th style={{ padding: "12px 16px" }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: "13px 16px", fontWeight: "700", color: theme.textPrimary }}>
                    {l.event_type}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    {getSeverityBadge(l.severity)}
                  </td>
                  <td style={{ padding: "13px 16px", fontFamily: "monospace", color: theme.textPrimary, fontWeight: "600" }}>
                    {l.ip_address || "127.0.0.1"}
                  </td>
                  <td style={{ padding: "13px 16px", color: theme.textSecondary, maxWidth: "340px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {l.details_json || "{}"}
                  </td>
                  <td style={{ padding: "13px 16px", color: theme.textMuted }}>
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
