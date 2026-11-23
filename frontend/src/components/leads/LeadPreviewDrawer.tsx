import React, { useEffect, useState } from "react";
import { LeadItem } from "./LeadTable";
import { ThemeColors } from "../../lib/theme";
import { apiFetch } from "../../lib/mockApi";
import { formatBudgetRange, formatIndianCurrency } from "../../lib/formatters";
import {
  DISPOSITION_META,
  dispositionToPipelineStatus,
  getAdChannelMeta,
  getDispositionMeta,
  LeadDisposition,
  normalizeLeadChannel,
  normalizeLeadDisposition
} from "../../lib/leadAnalytics";
import { CallLogRecord } from "../../lib/mockData";

interface LeadPreviewDrawerProps {
  lead: LeadItem | null;
  theme: ThemeColors;
  onClose: () => void;
  onUpdateLead: (
    leadId: string,
    payload: { status?: string; notes?: string; disposition?: LeadDisposition; assigned_agent_name?: string }
  ) => Promise<void>;
  onCallLead: (lead: LeadItem) => void;
  callLogs: CallLogRecord[];
  token: string;
  backendUrl?: string;
}

interface ActivityRecord {
  id: string;
  activity_type: string;
  metadata_json: string;
  created_at: string;
}

const TEAM_AGENTS = [
  "Dhruv Chaudhary",
  "Ananya Patel",
  "Vikram Malhotra",
  "Karan Mehta"
];

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function describeActivity(act: ActivityRecord): { title: string; detail: string } {
  let meta: Record<string, any> = {};
  try {
    meta = JSON.parse(act.metadata_json || "{}");
  } catch {}

  switch (act.activity_type) {
    case "LEAD_INGESTED":
      return {
        title: "Lead Received",
        detail: `Arrived from ${getAdChannelMeta(normalizeLeadChannel(meta.source)).label}.`
      };
    case "SLA_COUNTDOWN_STARTED":
      return {
        title: "Assigned to Agent",
        detail: `Assigned to ${meta.assigned_agent || "team"} for first call follow-up.`
      };
    case "STAGE_CHANGED":
      return {
        title: "Status Updated",
        detail: `Status set to ${String(meta.disposition || meta.new_stage || "Updated").replace(/_/g, " ")}.${meta.notes ? ` "${meta.notes}"` : ""}`
      };
    case "WATERMARKED_VIEW":
      return {
        title: "Lead Viewed",
        detail: `Opened by ${meta.viewer || "team member"}.`
      };
    default:
      return {
        title: act.activity_type.replace(/_/g, " "),
        detail: meta.notes || "Activity logged automatically."
      };
  }
}

export const LeadPreviewDrawer: React.FC<LeadPreviewDrawerProps> = ({
  lead,
  theme,
  onClose,
  onUpdateLead,
  onCallLead,
  callLogs,
  token,
  backendUrl = "http://localhost:8000"
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "notes">("overview");
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingAgent, setEditingAgent] = useState(false);
  const [selectedDisposition, setSelectedDisposition] = useState<LeadDisposition>("PENDING");
  const [selectedAgent, setSelectedAgent] = useState<string>("Dhruv Chaudhary");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);

  useEffect(() => {
    if (!lead) return;
    setSelectedDisposition(normalizeLeadDisposition(lead));
    setSelectedAgent(lead.assigned_agent_name || "Dhruv Chaudhary");
    setNotes(lead.notes || "");
    setEditingStatus(false);
    setEditingAgent(false);
    setSavedBanner(null);
    setActiveTab("overview");

    let cancelled = false;
    apiFetch(`${backendUrl}/api/v1/leads/${lead.id}/activities`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setActivities(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [lead?.id, backendUrl, token]);

  if (!lead) return null;

  const channelMeta = getAdChannelMeta(normalizeLeadChannel(lead.source));
  const currentDispMeta = getDispositionMeta(selectedDisposition);
  const leadCalls = callLogs.filter(
    (c) => c.lead_name.toLowerCase() === lead.full_name.toLowerCase()
  );

  const handleSaveStatusAndNote = async () => {
    setSaving(true);
    try {
      await onUpdateLead(lead.id, {
        disposition: selectedDisposition,
        status: dispositionToPipelineStatus(selectedDisposition),
        notes
      });
      setEditingStatus(false);
      setSavedBanner("Lead updated successfully.");
      setTimeout(() => setSavedBanner(null), 2800);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAgent = async (newAgent: string) => {
    setSelectedAgent(newAgent);
    setSaving(true);
    try {
      await onUpdateLead(lead.id, { assigned_agent_name: newAgent });
      setEditingAgent(false);
      setSavedBanner(`Reassigned lead to ${newAgent}.`);
      setTimeout(() => setSavedBanner(null), 2800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Lead Preview for ${lead.full_name}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 130,
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "rgba(15, 23, 42, 0.32)"
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(470px, 100vw)",
          height: "100%",
          backgroundColor: theme.cardBg,
          borderLeft: `1px solid ${theme.border}`,
          boxShadow: "-12px 0 32px rgba(15, 23, 42, 0.16)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* Top Drawer Bar */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span style={{ fontSize: "0.95rem", fontWeight: 700, color: theme.textPrimary }}>
            Lead Preview
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close lead preview"
            style={{
              background: "none",
              border: "none",
              color: theme.textMuted,
              fontSize: "1.1rem",
              cursor: "pointer",
              padding: "4px 6px"
            }}
          >
            ✕
          </button>
        </div>

        {/* Prospect Summary + Quick Actions (Matching LeadRat Right Drawer) */}
        <div
          style={{
            padding: "18px 20px 14px 20px",
            borderBottom: `1px solid ${theme.border}`
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <div style={{ minWidth: 0 }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                {lead.full_name}
              </h2>
              <div
                className="tabular-nums"
                style={{
                  fontSize: "0.8rem",
                  color: theme.textMuted,
                  marginTop: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap"
                }}
              >
                <span>ID: {lead.lead_code || lead.id.slice(-6)}</span>
                <span>·</span>
                <span>{lead.phone_masked}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onCallLead(lead)}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: theme.primaryBtnBg,
                color: theme.primaryBtnText,
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.61 21 3 13.39 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" />
              </svg>
              Call Lead
            </button>
          </div>

          {/* Drawer Tabs: Overview / Activity History / Notes */}
          <div style={{ display: "flex", gap: "18px", marginTop: "16px" }}>
            {[
              { id: "overview" as const, label: "Overview" },
              { id: "history" as const, label: `Activity (${activities.length + leadCalls.length})` },
              { id: "notes" as const, label: "Notes" }
            ].map((t) => {
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: active ? `2px solid ${theme.accentPrimary}` : "2px solid transparent",
                    padding: "6px 2px",
                    color: active ? theme.accentPrimary : theme.textSecondary,
                    fontSize: "0.84rem",
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer"
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "18px" }}>
          {savedBanner && (
            <div
              role="status"
              style={{
                padding: "9px 12px",
                borderRadius: "8px",
                backgroundColor: theme.successBg,
                border: `1px solid ${theme.successBorder}`,
                color: theme.success,
                fontSize: "0.82rem",
                fontWeight: 600
              }}
            >
              {savedBanner}
            </div>
          )}

          {activeTab === "overview" && (
            <>
              {/* Latest Status Block (Just like LeadRat Video 0:17) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: theme.textPrimary }}>
                    Latest Status
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingStatus(!editingStatus)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: theme.accentBg,
                      color: theme.accentPrimary,
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {editingStatus ? "Cancel" : "Change Status"}
                  </button>
                </div>

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: theme.cardBgSecondary,
                    border: `1px solid ${theme.border}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "0.86rem",
                        fontWeight: 700,
                        color: currentDispMeta.color
                      }}
                    >
                      {currentDispMeta.label}
                    </span>
                    <span className="tabular-nums" style={{ fontSize: "0.75rem", color: theme.textMuted }}>
                      {formatDateTime(lead.created_at)}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: theme.textSecondary, margin: "8px 0 0 0", lineHeight: 1.45 }}>
                    {notes || "No remarks added yet."}
                  </p>

                  {editingStatus && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: `1px solid ${theme.border}`, display: "flex", flexDirection: "column", gap: "10px" }}>
                      <label style={{ fontSize: "0.76rem", fontWeight: 600, color: theme.textSecondary }}>
                        Select New Status
                        <select
                          value={selectedDisposition}
                          onChange={(e) => setSelectedDisposition(e.target.value as LeadDisposition)}
                          style={{
                            width: "100%",
                            marginTop: "4px",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: `1px solid ${theme.border}`,
                            backgroundColor: theme.cardBg,
                            color: theme.textPrimary,
                            fontSize: "0.84rem"
                          }}
                        >
                          {DISPOSITION_META.map((d) => (
                            <option key={d.key} value={d.key}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label style={{ fontSize: "0.76rem", fontWeight: 600, color: theme.textSecondary }}>
                        Quick Note
                        <textarea
                          rows={2}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Example: Will call back at 4 PM, interested in 300 sq yd plot"
                          style={{
                            width: "100%",
                            marginTop: "4px",
                            padding: "8px 10px",
                            borderRadius: "8px",
                            border: `1px solid ${theme.border}`,
                            backgroundColor: theme.cardBg,
                            color: theme.textPrimary,
                            fontSize: "0.82rem",
                            fontFamily: "inherit",
                            boxSizing: "border-box"
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={handleSaveStatusAndNote}
                        style={{
                          alignSelf: "flex-start",
                          padding: "7px 14px",
                          borderRadius: "8px",
                          border: "none",
                          backgroundColor: theme.primaryBtnBg,
                          color: theme.primaryBtnText,
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {saving ? "Saving..." : "Save Update"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned To Block (With 1-Click Change Agent) */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: theme.textPrimary }}>
                    Assigned To
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingAgent(!editingAgent)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: theme.accentBg,
                      color: theme.accentPrimary,
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {editingAgent ? "Cancel" : "Change Agent"}
                  </button>
                </div>

                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    backgroundColor: theme.cardBgSecondary,
                    border: `1px solid ${theme.border}`
                  }}
                >
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: theme.textPrimary }}>
                    {selectedAgent}
                  </div>

                  {editingAgent && (
                    <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {TEAM_AGENTS.map((agentName) => (
                        <button
                          key={agentName}
                          type="button"
                          onClick={() => handleSaveAgent(agentName)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "7px",
                            border: `1px solid ${selectedAgent === agentName ? theme.accentPrimary : theme.border}`,
                            backgroundColor: selectedAgent === agentName ? theme.accentBg : theme.cardBg,
                            color: selectedAgent === agentName ? theme.accentPrimary : theme.textPrimary,
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          {agentName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Lead Info Block (Clean Key-Value Rows) */}
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: theme.textPrimary, marginBottom: "8px" }}>
                  Lead Info
                </div>
                <div
                  style={{
                    borderRadius: "10px",
                    backgroundColor: theme.cardBgSecondary,
                    border: `1px solid ${theme.border}`,
                    padding: "4px 14px"
                  }}
                >
                  {[
                    { label: "Ad Platform", value: channelMeta.label, dot: channelMeta.color },
                    { label: "Campaign / Source", value: lead.source.replace(/_/g, " ") },
                    { label: "Property Interest", value: lead.property_type || "Residential Plots" },
                    { label: "Location", value: lead.preferred_location || "Gurugram" },
                    { label: "Budget Range", value: formatBudgetRange(lead.budget_min, lead.budget_max) },
                    {
                      label: "Est. Commission",
                      value: formatIndianCurrency(
                        lead.estimated_brokerage || (lead.budget_max ? Math.round(lead.budget_max * 0.02) : 650000)
                      )
                    },
                    { label: "Created On", value: formatDateTime(lead.created_at) }
                  ].map((row, idx) => (
                    <div
                      key={row.label}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "12px",
                        padding: "10px 0",
                        borderTop: idx > 0 ? `1px solid ${theme.borderSubtle}` : "none",
                        fontSize: "0.82rem"
                      }}
                    >
                      <span style={{ color: theme.textMuted }}>{row.label}</span>
                      <span
                        style={{
                          color: theme.textPrimary,
                          fontWeight: 600,
                          textAlign: "right",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                      >
                        {row.dot && (
                          <span
                            aria-hidden="true"
                            style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: row.dot }}
                          />
                        )}
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {leadCalls.map((call) => (
                <div
                  key={call.id}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    backgroundColor: theme.cardBgSecondary,
                    border: `1px solid ${theme.border}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: theme.textMuted }}>
                    <strong style={{ color: theme.textPrimary }}>Phone Call · {call.caller_name}</strong>
                    <span className="tabular-nums">{call.duration_formatted}</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: theme.textSecondary, marginTop: "4px" }}>
                    {call.outcome} — {call.notes}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: theme.textMuted, marginTop: "4px" }}>
                    {formatDateTime(call.start_time)}
                  </div>
                </div>
              ))}

              {activities.map((act) => {
                const desc = describeActivity(act);
                return (
                  <div
                    key={act.id}
                    style={{
                      padding: "12px 14px",
                      borderRadius: "10px",
                      backgroundColor: theme.cardBgSecondary,
                      border: `1px solid ${theme.border}`
                    }}
                  >
                    <div style={{ fontSize: "0.82rem", fontWeight: 700, color: theme.textPrimary }}>
                      {desc.title}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: theme.textSecondary, marginTop: "3px" }}>
                      {desc.detail}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: theme.textMuted, marginTop: "4px" }}>
                      {formatDateTime(act.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "notes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: theme.textPrimary }}>
                Call Notes &amp; Follow-up Summary
                <textarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write what the customer asked for, preferred budget, or next callback time..."
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.cardBgSecondary,
                    color: theme.textPrimary,
                    fontSize: "0.85rem",
                    fontFamily: "inherit",
                    lineHeight: 1.5,
                    boxSizing: "border-box"
                  }}
                />
              </label>

              <button
                type="button"
                disabled={saving}
                onClick={handleSaveStatusAndNote}
                style={{
                  alignSelf: "flex-start",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: theme.primaryBtnBg,
                  color: theme.primaryBtnText,
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {saving ? "Saving..." : "Save Note"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
