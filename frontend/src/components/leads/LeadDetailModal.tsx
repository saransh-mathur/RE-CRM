import React, { useState, useEffect } from "react";
import { LeadItem } from "./LeadTable";
import { ThemeColors } from "../../lib/theme";
import { formatIndianCurrency, formatBudgetRange } from "../../lib/formatters";
import {
  DISPOSITION_META,
  dispositionToPipelineStatus,
  LeadDisposition,
  normalizeLeadDisposition
} from "../../lib/leadAnalytics";
import { apiFetch } from "../../lib/mockApi";

interface ActivityItem {
  id: string;
  activity_type: string;
  metadata_json?: string;
  created_at: string;
}

interface LeadDetailModalProps {
  lead: LeadItem | null;
  theme: ThemeColors;
  onClose: () => void;
  onUpdateLeadStatus: (leadId: string, status: string, notes: string, disposition?: LeadDisposition) => Promise<void>;
  token: string;
  backendUrl?: string;
  onCallLead?: (lead: LeadItem) => void;
  allLeads?: LeadItem[];
  onNavigateLead?: (lead: LeadItem) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  theme,
  onClose,
  onUpdateLeadStatus,
  token,
  backendUrl = "http://localhost:8000",
  onCallLead,
  allLeads,
  onNavigateLead
}) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [currentStatus, setCurrentStatus] = useState(lead?.status || "NEW");
  const [currentDisposition, setCurrentDisposition] = useState<LeadDisposition>(
    lead ? normalizeLeadDisposition(lead) : "PENDING"
  );
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [showRiskExplainer, setShowRiskExplainer] = useState(false);

  // Anti-Scraping Rapid View Rate Limiter State
  const [navTimestamps, setNavTimestamps] = useState<number[]>([]);
  const [rateLimitActive, setRateLimitActive] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const recent = [...navTimestamps.filter((t) => now - t < 5000), now];
    setNavTimestamps(recent);

    if (recent.length > 4) {
      setRateLimitActive(true);
      setCooldownRemaining(15);

      apiFetch(`${backendUrl}/api/v1/telemetry/log-activity`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          agent_name: lead?.assigned_agent_name || "Field Executive",
          activity_type: "SECURITY_ALERT",
          title: "Rapid Lead Scraping Throttled",
          description: `Executive exceeded velocity limit (>4 rapid lead clicks in 5s). Anti-scraping rate limiter enforced with 15-second compliance lock.`,
          severity: "CRITICAL"
        })
      }).catch(() => {});

      return false;
    }
    return true;
  };

  useEffect(() => {
    if (!rateLimitActive) return;
    const interval = setInterval(() => {
      setCooldownRemaining((prev) => {
        if (prev <= 1) {
          setRateLimitActive(false);
          setNavTimestamps([]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [rateLimitActive]);

  const currentIndex = allLeads && lead ? allLeads.findIndex((l) => l.id === lead.id) : -1;
  const hasPrev = Boolean(allLeads && currentIndex > 0);
  const hasNext = Boolean(allLeads && currentIndex >= 0 && currentIndex < allLeads.length - 1);

  const handlePrev = () => {
    if (rateLimitActive) return;
    if (!checkRateLimit()) return;
    if (hasPrev && onNavigateLead && allLeads) {
      onNavigateLead(allLeads[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (rateLimitActive) return;
    if (!checkRateLimit()) return;
    if (hasNext && onNavigateLead && allLeads) {
      onNavigateLead(allLeads[currentIndex + 1]);
    }
  };

  const handleSaveAndNext = async () => {
    if (rateLimitActive) return;
    await handleSave();
    if (hasNext) {
      handleNext();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "textarea" || activeTag === "input" || activeTag === "select") {
        return;
      }
      if (e.key === "ArrowLeft" && hasPrev) {
        handlePrev();
      } else if (e.key === "ArrowRight" && hasNext) {
        handleNext();
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, currentIndex, allLeads]);

  useEffect(() => {
    if (!lead) return;
    setCurrentStatus(lead.status);
    setCurrentDisposition(normalizeLeadDisposition(lead));
    setNotes(lead.notes || "");
    setSaveSuccess(false);

    const fetchActivities = async () => {
      try {
        const resp = await apiFetch(`${backendUrl}/api/v1/leads/${lead.id}/activities`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          setActivities(data);
        }
      } catch (err) {}
    };

    fetchActivities();
  }, [lead?.id, token, backendUrl]);

  if (!lead) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdateLeadStatus(lead.id, currentStatus, notes, currentDisposition);
      setSaveSuccess(true);
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          activity_type: notes ? "DISPOSITION & NOTE UPDATED" : "DISPOSITION UPDATED",
          metadata_json: JSON.stringify({ status: currentStatus, disposition: currentDisposition, notes }),
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCall = () => {
    setCallActive(true);
    if (onCallLead) {
      onCallLead(lead);
    }
    setActivities((prev) => [
      {
        id: `call-${Date.now()}`,
        activity_type: "CALL_DIALED (Masked Bridge)",
        metadata_json: JSON.stringify({ masked_phone: lead.phone_masked, caller: "Advisor" }),
        created_at: new Date().toISOString()
      },
      ...prev
    ]);
    setTimeout(() => setCallActive(false), 4000);
  };

  const estimatedBrokerage =
    lead.estimated_brokerage || (lead.budget_max ? Math.round(lead.budget_max * 0.02) : 650000);
  const displayLeadCode = lead.lead_code || lead.id.slice(-6);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(2, 11, 8, 0.56)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100000,
        padding: "16px"
      }}
    >
      <div
        style={{
          backgroundColor: theme.cardBgElevated,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          color: theme.textPrimary,
          borderRadius: "22px",
          padding: "clamp(18px, 3vw, 28px)",
          width: "100%",
          maxWidth: "700px",
          maxHeight: "92vh",
          overflowY: "auto",
          border: theme.glassBorder,
          boxShadow: theme.glassShadowGlow,
          position: "relative"
        }}
      >
        {/* Rapid-View Anti-Scraping Freeze Overlay */}
        {rateLimitActive && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "22px",
              backgroundColor: "rgba(4, 21, 16, 0.94)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px",
              textAlign: "center",
              color: "#ffffff"
            }}
          >
            <div style={{ fontSize: "2.4rem", marginBottom: "8px" }}>🛑</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", margin: "0 0 6px 0" }}>
              Rapid Lead Scraping Throttled
            </h3>
            <p style={{ fontSize: "0.82rem", opacity: 0.9, maxWidth: "440px", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Rapid pagination is blocked to safeguard proprietary Absolute Assets client data from bulk hoarding.
            </p>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "12px",
                backgroundColor: "rgba(212, 175, 106, 0.16)",
                border: "1px solid rgba(212, 175, 106, 0.45)",
                fontSize: "0.88rem",
                fontWeight: "800"
              }}
            >
              <span>⏱️ Cooldown Active:</span>
              <span style={{ fontSize: "1.1rem", fontFamily: "monospace" }}>{cooldownRemaining}s</span>
            </div>
          </div>
        )}

        {/* Rapid Navigation Bar */}
        {allLeads && allLeads.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "10px",
              padding: "8px 12px",
              marginBottom: "14px",
              backgroundColor: theme.cardBgSecondary,
              borderRadius: "12px",
              border: `1px solid ${theme.border}`
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                onClick={handlePrev}
                disabled={!hasPrev}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: hasPrev ? theme.cardBgElevated : "transparent",
                  color: hasPrev ? theme.textPrimary : theme.textMuted,
                  cursor: hasPrev ? "pointer" : "not-allowed",
                  fontSize: "0.75rem",
                  fontWeight: "700"
                }}
              >
                ← Prev
              </button>
              <span className="tabular-nums" style={{ fontSize: "0.75rem", fontWeight: "700", color: theme.textPrimary }}>
                Lead {currentIndex + 1} of {allLeads.length}
              </span>
              <button
                type="button"
                onClick={handleNext}
                disabled={!hasNext}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: hasNext ? theme.cardBgElevated : "transparent",
                  color: hasNext ? theme.textPrimary : theme.textMuted,
                  cursor: hasNext ? "pointer" : "not-allowed",
                  fontSize: "0.75rem",
                  fontWeight: "700"
                }}
              >
                Next Lead →
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                className="tabular-nums"
                style={{
                  fontSize: "0.72rem",
                  padding: "3px 9px",
                  borderRadius: "999px",
                  backgroundColor: theme.goldBg,
                  color: theme.goldAccent,
                  fontWeight: "700",
                  border: `1px solid ${theme.goldBorder}`,
                  fontFamily: "'JetBrains Mono', monospace"
                }}
              >
                Lead Id: {displayLeadCode}
              </span>
              <span style={{ fontSize: "0.68rem", color: theme.textMuted }}>(Keys: ← / →)</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: theme.textPrimary, margin: 0 }}>
                {lead.full_name}
              </h2>
              {lead.offline_closing_flag && (
                <span
                  style={{
                    fontSize: "0.68rem",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    fontWeight: "700",
                    backgroundColor: theme.dangerBg,
                    color: theme.danger,
                    border: `1px solid ${theme.dangerBorder}`
                  }}
                >
                  FLAGGED RISK
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowRiskExplainer(!showRiskExplainer)}
                style={{
                  fontSize: "0.7rem",
                  padding: "3px 9px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  backgroundColor: theme.cardBgSecondary,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span>🔍</span> Risk Diagnostic {showRiskExplainer ? "▲" : "▼"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "0.8rem", color: theme.textMuted, flexWrap: "wrap" }}>
              <span>
                🔒 Masked Phone: <strong style={{ color: theme.textPrimary, fontFamily: "'JetBrains Mono', monospace" }}>{lead.phone_masked}</strong>
              </span>
              <span>• Source: <strong style={{ color: theme.textSecondary }}>{lead.source}</strong></span>
              <span>
                • Est. Commission: <strong style={{ color: theme.goldAccent }}>{formatIndianCurrency(estimatedBrokerage)}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
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

        {/* Risk Diagnostic Panel */}
        {showRiskExplainer && (
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "14px",
              backgroundColor: theme.cardBgSecondary,
              border: `1px solid ${theme.border}`,
              marginBottom: "18px"
            }}
          >
            <div style={{ fontSize: "0.82rem", fontWeight: "800", color: theme.textPrimary, marginBottom: "8px" }}>
              🛡️ Anti-Brokerage Shield — Detection Signal
            </div>
            <div
              style={{
                fontSize: "0.78rem",
                color: theme.textPrimary,
                lineHeight: 1.5,
                padding: "8px 10px",
                backgroundColor: theme.cardBgElevated,
                borderRadius: "8px",
                border: `1px solid ${theme.border}`
              }}
            >
              {lead.poaching_risk_reason || "Compliant record monitored under DLP watermark and masked telephony."}
            </div>
          </div>
        )}

        {/* Lead Parameters Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: "12px",
            backgroundColor: theme.cardBgSecondary,
            padding: "16px",
            borderRadius: "14px",
            marginBottom: "18px",
            fontSize: "0.82rem",
            border: `1px solid ${theme.border}`
          }}
        >
          <div>
            <span style={{ color: theme.textMuted, fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700" }}>
              Property Interest
            </span>
            <div style={{ fontWeight: "700", color: theme.textPrimary, marginTop: "2px" }}>
              {lead.property_type || "residential plots"}
            </div>
          </div>
          <div>
            <span style={{ color: theme.textMuted, fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700" }}>
              Budget Bracket
            </span>
            <div className="tabular-nums" style={{ fontWeight: "800", color: theme.textPrimary, marginTop: "2px" }}>
              {formatBudgetRange(lead.budget_min, lead.budget_max)}
            </div>
          </div>
          <div>
            <span style={{ color: theme.textMuted, fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700" }}>
              Assigned Advisor
            </span>
            <div style={{ fontWeight: "700", color: theme.textPrimary, marginTop: "2px" }}>
              👤 {lead.assigned_agent_name || "Unassigned"}
            </div>
          </div>
          <div>
            <span style={{ color: theme.textMuted, fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700" }}>
              SLA Status
            </span>
            <div style={{ fontWeight: "700", color: theme.textPrimary, marginTop: "2px" }}>
              {lead.is_sla_breached ? "⚠️ Escalated" : "⏱️ 15m Active SLA"}
            </div>
          </div>
        </div>

        {/* Click-to-Call Masked Bridge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            padding: "14px 18px",
            borderRadius: "14px",
            backgroundColor: theme.cardBgSecondary,
            border: `1px solid ${theme.border}`,
            marginBottom: "18px"
          }}
        >
          <div>
            <div style={{ fontWeight: "800", fontSize: "0.85rem", color: theme.textPrimary }}>
              📞 Encrypted Click-to-Call Bridge
            </div>
            <div style={{ fontSize: "0.75rem", color: theme.textMuted }}>
              Dials prospect via masked bridge and increments live Call Details analytics.
            </div>
          </div>

          <button
            type="button"
            onClick={handleCall}
            disabled={callActive}
            style={{
              padding: "9px 16px",
              borderRadius: "10px",
              border: `1px solid ${theme.goldBorder}`,
              backgroundColor: theme.primaryBtnBg,
              color: theme.primaryBtnText,
              fontWeight: "700",
              fontSize: "0.78rem",
              cursor: "pointer"
            }}
          >
            {callActive ? "Connecting Bridge..." : "📞 Dial Call Bridge"}
          </button>
        </div>

        {/* Telecalling Disposition, Pipeline Stage & Notes Form */}
        <div
          style={{
            padding: "18px",
            borderRadius: "14px",
            backgroundColor: theme.cardBgSecondary,
            border: `1px solid ${theme.border}`,
            marginBottom: "18px"
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px", marginBottom: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "800", color: theme.textPrimary, marginBottom: "6px" }}>
                Telecalling Disposition (Lead Analytics):
              </label>
              <select
                value={currentDisposition}
                onChange={(e) => {
                  const nextDisp = e.target.value as LeadDisposition;
                  setCurrentDisposition(nextDisp);
                  setCurrentStatus(dispositionToPipelineStatus(nextDisp));
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgElevated,
                  color: theme.textPrimary,
                  outline: "none",
                  fontWeight: "600",
                  fontSize: "0.82rem"
                }}
              >
                {DISPOSITION_META.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.74rem", fontWeight: "800", color: theme.textPrimary, marginBottom: "6px" }}>
                Pipeline Stage:
              </label>
              <select
                value={currentStatus}
                onChange={(e) => setCurrentStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgElevated,
                  color: theme.textPrimary,
                  outline: "none",
                  fontWeight: "600",
                  fontSize: "0.82rem"
                }}
              >
                <option value="NEW">NEW INQUIRY</option>
                <option value="CONTACTED">CONTACTED (CALL LOGGED)</option>
                <option value="SITE_VISIT_SCHEDULED">SITE VISIT SCHEDULED</option>
                <option value="SITE_VISIT">SITE VISIT DONE</option>
                <option value="NEGOTIATION">PRICE NEGOTIATION</option>
                <option value="WON">WON (BOOKED)</option>
                <option value="LOST">LOST / DISQUALIFIED</option>
              </select>
            </div>
          </div>

          <textarea
            rows={2}
            placeholder="Add consultation notes (e.g., Client requested Sector 106 commercial yield brochure)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgElevated,
              color: theme.textPrimary,
              outline: "none",
              resize: "none",
              fontSize: "0.82rem",
              boxSizing: "border-box",
              marginBottom: "10px"
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <span style={{ fontSize: "0.75rem", color: saveSuccess ? theme.success : theme.textMuted, fontWeight: saveSuccess ? "700" : "500" }}>
              {saveSuccess ? "✓ Disposition & notes saved — analytics updated!" : "Updates reflect live in Lead Analytics pie chart."}
            </span>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgElevated,
                  color: theme.textPrimary,
                  fontWeight: "700",
                  fontSize: "0.78rem",
                  cursor: "pointer"
                }}
              >
                {isSaving ? "Saving..." : "💾 Save"}
              </button>
              {hasNext && (
                <button
                  type="button"
                  onClick={handleSaveAndNext}
                  disabled={isSaving}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: `1px solid ${theme.goldBorder}`,
                    backgroundColor: theme.primaryBtnBg,
                    color: theme.primaryBtnText,
                    fontWeight: "700",
                    fontSize: "0.78rem",
                    cursor: "pointer"
                  }}
                >
                  Save &amp; Next Lead →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Audit Activity Timeline */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h4 style={{ fontSize: "0.85rem", fontWeight: "800", color: theme.textPrimary, margin: 0 }}>
              Forensic Audit Timeline (Immutable Activity Log)
            </h4>
            <span style={{ fontSize: "0.7rem", color: theme.goldAccent, fontWeight: "600" }}>
              ✓ Tamper-Proof Audit
            </span>
          </div>

          <div
            style={{
              maxHeight: "150px",
              overflowY: "auto",
              backgroundColor: theme.cardBgSecondary,
              borderRadius: "12px",
              padding: "10px 14px",
              fontSize: "0.8rem",
              border: `1px solid ${theme.border}`
            }}
          >
            {activities.length === 0 ? (
              <div style={{ color: theme.textMuted, padding: "8px 0" }}>Profile view recorded. Loading ledger...</div>
            ) : (
              activities.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: `1px solid ${theme.borderSubtle}`
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.72rem",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontWeight: "700",
                      backgroundColor: theme.cardBgElevated,
                      color: theme.textPrimary,
                      border: `1px solid ${theme.border}`
                    }}
                  >
                    {a.activity_type.replace(/_/g, " ")}
                  </span>
                  <span className="tabular-nums" style={{ color: theme.textMuted, fontSize: "0.74rem" }}>
                    {new Date(a.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "20px",
            paddingTop: "14px",
            borderTop: `1px solid ${theme.border}`
          }}
        >
          <span style={{ fontSize: "0.72rem", color: theme.textMuted }}>
            Absolute Assets • Consultancy With Absolute Clarity
          </span>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgSecondary,
              color: theme.textPrimary,
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.82rem"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
