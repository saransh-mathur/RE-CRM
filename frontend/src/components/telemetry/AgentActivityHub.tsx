import React, { useEffect, useMemo, useState } from "react";
import { ThemeColors } from "../../lib/theme";
import { LeadItem } from "../leads/LeadTable";
import { CallLogRecord, LoginRecord, MinuteActivityRecord } from "../../lib/mockData";
import { AgentActivityModal, AgentTelemetryData } from "./AgentActivityModal";
import { ExecutiveSecurityControl } from "./ExecutiveSecurityControl";
import { apiFetch } from "../../lib/mockApi";
import { computeAgentScorecards } from "../../lib/leadAnalytics";
import { formatIndianCurrency } from "../../lib/formatters";

interface AgentActivityHubProps {
  leads: LeadItem[];
  callLogs: CallLogRecord[];
  activities: MinuteActivityRecord[];
  token: string;
  userRole: string;
  theme: ThemeColors;
  backendUrl?: string;
  onConfiscateLead: (leadId: string, leadName: string, brokerage?: number) => void;
  onConfiscateAgentLeads: (agentName: string) => void;
  onRefreshData: () => void;
}

type ActivityFilter = "ALL" | "CALLS" | "LEADS" | "VISITS" | "LOGINS" | "ALERTS";

interface ExportReqItem {
  id: string;
  requester_name?: string;
  status: string;
  reason: string;
  records_count: number;
  created_at: string;
}

function formatTimeAgo(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatFriendlyClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function friendlyActivityLabel(type: string): string {
  switch (type) {
    case "CALL_PLACED":
      return "Phone Call";
    case "DEAL_UPDATE":
      return "Lead Updated";
    case "GPS_CHECKIN":
      return "Site Visit / Check-In";
    case "LEAD_VIEW":
      return "Lead Viewed";
    case "NOTE_ADDED":
      return "Note Added";
    case "SECURITY_ALERT":
      return "Needs Attention";
    case "EXPORT_REQUEST":
      return "Data Export";
    default:
      return "Activity";
  }
}

export const AgentActivityHub: React.FC<AgentActivityHubProps> = ({
  leads,
  callLogs,
  activities,
  token,
  userRole,
  theme,
  backendUrl = "http://localhost:8000",
  onConfiscateLead,
  onConfiscateAgentLeads,
  onRefreshData
}) => {
  const [agents, setAgents] = useState<AgentTelemetryData[]>([]);
  const [loginRecords, setLoginRecords] = useState<LoginRecord[]>([]);
  const [exportRequests, setExportRequests] = useState<ExportReqItem[]>([]);
  const [selectedAgentName, setSelectedAgentName] = useState<string>("ALL");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [inspectedAgent, setInspectedAgent] = useState<AgentTelemetryData | null>(null);
  const [showAdminTools, setShowAdminTools] = useState<boolean>(false);

  const loadAgentDetails = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [agentsResp, forensicsResp, exportsResp] = await Promise.all([
        apiFetch(`${backendUrl}/api/v1/telemetry/agents`, { headers }),
        apiFetch(`${backendUrl}/api/v1/telemetry/owner-forensics`, { headers }),
        apiFetch(`${backendUrl}/api/v1/exports`, { headers })
      ]);
      if (agentsResp.ok) {
        const data = await agentsResp.json();
        if (Array.isArray(data)) setAgents(data);
      }
      if (forensicsResp.ok) {
        const data = await forensicsResp.json();
        if (Array.isArray(data.login_records)) setLoginRecords(data.login_records);
      }
      if (exportsResp.ok) {
        const data = await exportsResp.json();
        if (Array.isArray(data)) setExportRequests(data);
      }
    } catch {}
  };

  useEffect(() => {
    loadAgentDetails();
  }, [token]);

  const handleReviewExport = async (requestId: string, approved: boolean) => {
    try {
      const resp = await apiFetch(`${backendUrl}/api/v1/exports/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ request_id: requestId, approved })
      });
      if (resp.ok) {
        loadAgentDetails();
      }
    } catch {}
  };

  const scorecards = useMemo(
    () => computeAgentScorecards(agents, leads, callLogs, activities),
    [agents, leads, callLogs, activities]
  );

  // Combine every activity source (live activities + call logs + login history) into one easy timeline
  const unifiedFeed = useMemo(() => {
    const items: Array<{
      id: string;
      timestamp: string;
      agentName: string;
      category: ActivityFilter;
      categoryLabel: string;
      title: string;
      description: string;
      isAlert: boolean;
    }> = [];

    for (const act of activities) {
      let category: ActivityFilter = "LEADS";
      if (act.activity_type === "CALL_PLACED") category = "CALLS";
      else if (act.activity_type === "GPS_CHECKIN") category = "VISITS";
      else if (act.activity_type === "SECURITY_ALERT" || act.activity_type === "EXPORT_REQUEST") {
        category = "ALERTS";
      }

      items.push({
        id: act.id,
        timestamp: act.timestamp,
        agentName: act.agent_name,
        category,
        categoryLabel: friendlyActivityLabel(act.activity_type),
        title: act.title,
        description: act.description,
        isAlert: act.severity === "CRITICAL" || act.severity === "WARNING"
      });
    }

    for (const login of loginRecords) {
      items.push({
        id: `login-${login.id}`,
        timestamp: login.timestamp,
        agentName: login.user_name,
        category: "LOGINS",
        categoryLabel: login.status === "SUCCESS" ? "Signed In" : "Login Alert",
        title:
          login.status === "SUCCESS"
            ? `Signed in on ${login.device_model}`
            : `Failed sign-in attempt (${login.status.replace(/_/g, " ")})`,
        description: `${login.channel === "MOBILE_APP" ? "Mobile App" : "Desktop Web"} · ${login.browser} · IP ${login.ip_address}`,
        isAlert: login.status !== "SUCCESS"
      });
    }

    return items.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [activities, loginRecords]);

  const filteredFeed = useMemo(() => {
    return unifiedFeed.filter((item) => {
      if (selectedAgentName !== "ALL") {
        const first = selectedAgentName.toLowerCase().split(" ")[0];
        if (!item.agentName.toLowerCase().includes(first)) return false;
      }
      if (activityFilter !== "ALL" && item.category !== activityFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !item.agentName.toLowerCase().includes(q) &&
          !item.title.toLowerCase().includes(q) &&
          !item.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [unifiedFeed, selectedAgentName, activityFilter, searchQuery]);

  const flaggedLeads = useMemo(() => {
    return leads.filter((l) => {
      const flagged =
        l.offline_closing_flag ||
        l.poaching_risk_score === "CRITICAL" ||
        l.poaching_risk_score === "HIGH" ||
        l.is_sla_breached;
      if (!flagged) return false;
      if (selectedAgentName !== "ALL") {
        const first = selectedAgentName.toLowerCase().split(" ")[0];
        return Boolean(l.assigned_agent_name?.toLowerCase().includes(first));
      }
      return true;
    });
  }, [leads, selectedAgentName]);

  const pendingExports = exportRequests.filter((e) => e.status === "PENDING");

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "16px",
    padding: "20px 22px"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Concise Intro Row + Controls Toggle */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <p style={{ fontSize: "0.88rem", color: theme.textSecondary, margin: 0 }}>
          Click any agent below to see their calls, lead updates, site visits, logins, and alerts.
        </p>

        {userRole === "OWNER" && (
          <button
            type="button"
            onClick={() => setShowAdminTools(!showAdminTools)}
            style={{
              padding: "8px 14px",
              borderRadius: "8px",
              border: `1px solid ${showAdminTools ? theme.goldBorder : theme.border}`,
              backgroundColor: showAdminTools ? theme.goldBg : theme.cardBg,
              color: showAdminTools ? theme.goldAccent : theme.textPrimary,
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {showAdminTools ? "Hide Controls" : `Exports & Account Controls${pendingExports.length > 0 ? ` (${pendingExports.length})` : ""}`}
          </button>
        )}
      </div>

      {/* Step 1: Pick an Agent */}
      <section aria-label="Team members">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 195px), 1fr))",
            gap: "12px"
          }}
        >
          {/* All Team Card */}
          <button
            type="button"
            onClick={() => setSelectedAgentName("ALL")}
            style={{
              backgroundColor: selectedAgentName === "ALL" ? theme.cardBgElevated : theme.cardBg,
              border: `1px solid ${selectedAgentName === "ALL" ? theme.goldAccent : theme.border}`,
              borderRadius: "14px",
              padding: "16px 18px",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "10px"
            }}
          >
            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: theme.textPrimary }}>
                All Agents
              </div>
              <div style={{ fontSize: "0.78rem", color: theme.textMuted, marginTop: "2px" }}>
                {agents.length} team members active
              </div>
            </div>
            <div className="tabular-nums" style={{ fontSize: "0.8rem", color: theme.textSecondary }}>
              <strong style={{ color: theme.textPrimary }}>{callLogs.length}</strong> calls ·{" "}
              <strong style={{ color: theme.textPrimary }}>{leads.length}</strong> leads
            </div>
          </button>

          {/* Individual Agent Cards */}
          {agents.map((agent) => {
            const stats = scorecards.find((s) => s.employeeCode === agent.employee_code);
            const isSelected = selectedAgentName === agent.full_name;
            const hasAlert = Boolean(stats && stats.alertsCount > 0);
            return (
              <div
                key={agent.id}
                style={{
                  backgroundColor: isSelected ? theme.cardBgElevated : theme.cardBg,
                  border: `1px solid ${isSelected ? theme.goldAccent : theme.border}`,
                  borderRadius: "14px",
                  padding: "16px 18px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "10px"
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedAgentName(agent.full_name)}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    textAlign: "left",
                    cursor: "pointer",
                    width: "100%"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 700, color: theme.textPrimary }}>
                      {agent.full_name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        color: agent.is_punched_in ? theme.success : theme.textMuted
                      }}
                    >
                      {agent.is_punched_in ? "On Duty" : "Off Duty"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.76rem", color: theme.textMuted, marginTop: "2px" }}>
                    {agent.assigned_territory}
                  </div>
                </button>

                <div
                  className="tabular-nums"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "0.78rem",
                    color: theme.textSecondary,
                    paddingTop: "8px",
                    borderTop: `1px solid ${theme.borderSubtle}`
                  }}
                >
                  <span>
                    <strong style={{ color: theme.textPrimary }}>{stats?.callsMade ?? 0}</strong> calls ·{" "}
                    <strong style={{ color: theme.textPrimary }}>{stats?.leadsAssigned ?? 0}</strong> leads
                    {hasAlert && (
                      <span style={{ color: theme.danger, fontWeight: 700 }}>
                        {" "}· {stats?.alertsCount} alert{stats?.alertsCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInspectedAgent(agent)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      color: theme.goldAccent,
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Collapsible Exports & Account Controls (Owner Only) */}
      {showAdminTools && userRole === "OWNER" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <section style={cardStyle}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: theme.textPrimary, margin: "0 0 12px 0" }}>
              Pending Data Export Approvals
            </h3>
            {exportRequests.length === 0 ? (
              <p style={{ fontSize: "0.84rem", color: theme.textMuted, margin: 0 }}>
                No export requests right now.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {exportRequests.map((req) => (
                  <div
                    key={req.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                      padding: "12px 0",
                      borderBottom: `1px solid ${theme.borderSubtle}`
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: theme.textPrimary }}>
                        {req.requester_name || "Agent"} · {req.records_count} leads
                      </div>
                      <div style={{ fontSize: "0.8rem", color: theme.textSecondary, marginTop: "2px" }}>
                        {req.reason}
                      </div>
                    </div>
                    {req.status === "PENDING" ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={() => handleReviewExport(req.id, true)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: "none",
                            backgroundColor: theme.success,
                            color: "#ffffff",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewExport(req.id, false)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: `1px solid ${theme.dangerBorder}`,
                            backgroundColor: theme.dangerBg,
                            color: theme.danger,
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          Decline
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: theme.textMuted }}>
                        {req.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <ExecutiveSecurityControl
            theme={theme}
            token={token}
            backendUrl={backendUrl}
            onSecurityEventLogged={() => {
              loadAgentDetails();
              onRefreshData();
            }}
          />
        </div>
      )}

      {/* Plain-English Items Needing Attention (If Any) */}
      {flaggedLeads.length > 0 && (
        <section
          aria-label="Items needing attention"
          style={{
            ...cardStyle,
            borderColor: theme.dangerBorder
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "12px", gap: "8px", flexWrap: "wrap" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
              Needs Your Attention ({flaggedLeads.length})
            </h3>
            <span style={{ fontSize: "0.8rem", color: theme.textMuted }}>
              Overdue follow-ups or unlogged site visits
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            {flaggedLeads.map((lead, idx) => (
              <div
                key={lead.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  padding: "12px 0",
                  borderTop: idx > 0 ? `1px solid ${theme.borderSubtle}` : "none"
                }}
              >
                <div style={{ minWidth: "240px", flex: 1 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: theme.textPrimary }}>
                    {lead.full_name}{" "}
                    <span style={{ fontWeight: 500, color: theme.textMuted }}>
                      · Assigned to {lead.assigned_agent_name || "Unassigned"}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: theme.textSecondary, marginTop: "3px" }}>
                    {lead.poaching_risk_reason || "15-minute first call response overdue."}
                    {lead.estimated_brokerage ? ` · Est. commission ${formatIndianCurrency(lead.estimated_brokerage)}` : ""}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onConfiscateLead(lead.id, lead.full_name, lead.estimated_brokerage)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${theme.dangerBorder}`,
                    backgroundColor: theme.dangerBg,
                    color: theme.danger,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  Reassign Lead
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Step 2 & 3: Complete Chronological Activity Feed */}
      <section aria-label="All agent activities" style={cardStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px"
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
              {selectedAgentName === "ALL" ? "Every Team Activity" : `${selectedAgentName}'s Activity`}
            </h3>
            <p style={{ fontSize: "0.8rem", color: theme.textMuted, margin: "3px 0 0 0" }}>
              Showing {filteredFeed.length} recorded actions, newest first
            </p>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity..."
            aria-label="Search agent activity"
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgSecondary,
              color: theme.textPrimary,
              fontSize: "0.84rem",
              minWidth: "220px",
              outline: "none"
            }}
          />
        </div>

        {/* Clean Filter Buttons */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            paddingBottom: "16px",
            borderBottom: `1px solid ${theme.borderSubtle}`
          }}
        >
          {[
            { key: "ALL" as const, label: "Every Activity" },
            { key: "CALLS" as const, label: "Phone Calls" },
            { key: "LEADS" as const, label: "Lead Updates" },
            { key: "VISITS" as const, label: "Site Visits & GPS" },
            { key: "LOGINS" as const, label: "Logins & Devices" },
            { key: "ALERTS" as const, label: "Alerts" }
          ].map((tab) => {
            const active = activityFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActivityFilter(tab.key)}
                style={{
                  padding: "7px 13px",
                  borderRadius: "8px",
                  border: `1px solid ${active ? theme.goldBorder : theme.border}`,
                  backgroundColor: active ? theme.goldBg : "transparent",
                  color: active ? theme.goldAccent : theme.textSecondary,
                  fontSize: "0.8rem",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Clean Uncluttered Timeline Rows */}
        {filteredFeed.length === 0 ? (
          <div style={{ padding: "36px 16px", textAlign: "center", color: theme.textMuted, fontSize: "0.88rem" }}>
            No activities match your current filter.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredFeed.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  padding: "14px 4px",
                  borderTop: idx > 0 ? `1px solid ${theme.borderSubtle}` : "none",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                      fontSize: "0.78rem",
                      color: theme.textMuted
                    }}
                  >
                    <strong style={{ color: theme.textPrimary, fontWeight: 700 }}>{item.agentName}</strong>
                    <span aria-hidden="true">·</span>
                    <span style={{ color: item.isAlert ? theme.danger : theme.textSecondary, fontWeight: item.isAlert ? 700 : 500 }}>
                      {item.categoryLabel}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.92rem", fontWeight: 700, color: theme.textPrimary, marginTop: "4px" }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: "0.84rem", color: theme.textSecondary, marginTop: "3px", lineHeight: 1.45 }}>
                    {item.description}
                  </div>
                </div>

                <div
                  className="tabular-nums"
                  style={{
                    fontSize: "0.78rem",
                    color: theme.textMuted,
                    whiteSpace: "nowrap",
                    textAlign: "right"
                  }}
                >
                  <div style={{ fontWeight: 600, color: theme.textSecondary }}>{formatTimeAgo(item.timestamp)}</div>
                  <div>{formatFriendlyClock(item.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Detailed GPS/Call/Device Drawer Modal when clicking "Details" on any agent */}
      <AgentActivityModal
        agent={inspectedAgent}
        isOpen={Boolean(inspectedAgent)}
        onClose={() => setInspectedAgent(null)}
        theme={theme}
        token={token}
        backendUrl={backendUrl}
        onConfiscateLeads={(name) => {
          onConfiscateAgentLeads(name);
          loadAgentDetails();
        }}
      />
    </div>
  );
};
