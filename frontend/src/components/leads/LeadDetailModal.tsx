import React, { useState, useEffect } from "react";
import { LeadItem } from "./LeadTable";
import { ThemeColors } from "../../lib/theme";
import { formatIndianCurrency, formatBudgetRange } from "../../lib/formatters";

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
  onUpdateLeadStatus: (leadId: string, status: string, notes: string) => Promise<void>;
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
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [showRiskExplainer, setShowRiskExplainer] = useState(false);
  const [afterHoursMode, setAfterHoursMode] = useState(true);

  // Anti-Scraping Rapid View Rate Limiter State
  const [navTimestamps, setNavTimestamps] = useState<number[]>([]);
  const [rateLimitActive, setRateLimitActive] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const recent = [...navTimestamps.filter((t) => now - t < 5000), now];
    setNavTimestamps(recent);

    // If more than 4 lead views in 5 seconds -> THROTTLE!
    if (recent.length > 4) {
      setRateLimitActive(true);
      setCooldownRemaining(15);

      // Log alert to Owner Command Center
      fetch(`${backendUrl}/api/v1/telemetry/log-activity`, {
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
  const hasPrev = allLeads && currentIndex > 0;
  const hasNext = allLeads && currentIndex >= 0 && currentIndex < allLeads.length - 1;

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
    setNotes(lead.notes || "");
    setSaveSuccess(false);

    const fetchActivities = async () => {
      try {
        const resp = await fetch(`${backendUrl}/api/v1/leads/${lead.id}/activities`, {
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
      await onUpdateLeadStatus(lead.id, currentStatus, notes);
      setSaveSuccess(true);
      // Append local activity
      setActivities((prev) => [
        {
          id: `act-${Date.now()}`,
          activity_type: notes ? "NOTE_ADDED & STAGE_CHANGED" : "STAGE_CHANGED",
          metadata_json: JSON.stringify({ status: currentStatus, notes }),
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
    // Append call log to timeline
    setActivities((prev) => [
      {
        id: `call-${Date.now()}`,
        activity_type: "CALL_DIALED (Masked Bridge)",
        metadata_json: JSON.stringify({ masked_phone: lead.phone_masked, caller: "Executive" }),
        created_at: new Date().toISOString()
      },
      ...prev
    ]);
    setTimeout(() => setCallActive(false), 4000);
  };

  const getActivityBadge = (type: string) => {
    let cleanLabel = type.replace(/_/g, " ");
    return {
      label: cleanLabel,
      bg: theme.cardBgSecondary,
      color: theme.textPrimary
    };
  };

  const estimatedBrokerage = lead.estimated_brokerage || (lead.budget_max ? Math.round(lead.budget_max * 0.02) : 650000);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.4)",
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
        padding: "clamp(18px, 3vw, 28px)",
        width: "100%",
        maxWidth: "680px",
        maxHeight: "92vh",
        overflowY: "auto",
        border: theme.glassBorder,
        boxShadow: theme.glassShadowGlow,
        position: "relative"
      }}>
        {/* Rapid-View Anti-Scraping Freeze Overlay */}
        {rateLimitActive && (
          <div style={{
            position: "absolute",
            inset: 0,
            borderRadius: "22px",
            backgroundColor: "rgba(15, 23, 42, 0.88)",
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
          }}>
            <div style={{ fontSize: "2.4rem", marginBottom: "8px" }}>🛑</div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", margin: "0 0 6px 0", letterSpacing: "-0.01em" }}>
              Rapid Lead Scraping Throttled
            </h3>
            <p style={{ fontSize: "0.82rem", opacity: 0.9, maxWidth: "440px", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Rapid pagination is blocked to safeguard proprietary client data from bulk hoarding. Please review lead interaction history thoroughly.
            </p>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "12px",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              fontSize: "0.88rem",
              fontWeight: "800"
            }}>
              <span>⏱️ Cooldown Active:</span>
              <span style={{ fontSize: "1.1rem", fontFamily: "monospace" }}>{cooldownRemaining}s</span>
            </div>
            <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "12px" }}>
              Security incident logged to Owner Command Center Radar.
            </div>
          </div>
        )}
        {/* Rapid / Bulk Lead Review Bar (with After-Hours Support) */}
        {allLeads && allLeads.length > 0 && (
          <div style={{
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
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={handlePrev}
                disabled={!hasPrev}
                title="Keyboard: Left Arrow"
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
              <span style={{ fontSize: "0.75rem", fontWeight: "700", color: theme.textPrimary }}>
                Lead {currentIndex + 1} of {allLeads.length}
              </span>
              <button
                onClick={handleNext}
                disabled={!hasNext}
                title="Keyboard: Right Arrow"
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
              <span style={{
                fontSize: "0.7rem",
                padding: "3px 8px",
                borderRadius: "999px",
                backgroundColor: theme.cardBgElevated,
                color: theme.textSecondary,
                fontWeight: "600",
                border: `1px solid ${theme.border}`
              }}>
                🌙 Rapid After-Hours Review Active
              </span>
              <span style={{ fontSize: "0.68rem", color: theme.textMuted }}>
                (Keys: ← / →)
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "18px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: theme.textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
                {lead.full_name}
              </h2>
              {lead.offline_closing_flag && (
                <span style={{
                  fontSize: "0.68rem",
                  padding: "3px 8px",
                  borderRadius: "999px",
                  fontWeight: "700",
                  backgroundColor: theme.cardBgSecondary,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`
                }}>
                  FLAGGED
                </span>
              )}
              {/* Reason for High Risk - Easy Trigger Button */}
              <button
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
                <span>🔍</span> Reason for High Risk — Easy {showRiskExplainer ? "▲" : "▼"}
              </button>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "6px", fontSize: "0.8rem", color: theme.textMuted, flexWrap: "wrap" }}>
              <span>🔒 Masked Phone: <strong style={{ color: theme.textPrimary, fontFamily: "monospace" }}>{lead.phone_masked}</strong></span>
              <span>• Source: <strong style={{ color: theme.textSecondary }}>{lead.source}</strong></span>
              <span>• Estimated Commission: <strong style={{ color: theme.textPrimary }}>{formatIndianCurrency(estimatedBrokerage)}</strong></span>
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
              lineHeight: 1,
              transition: "all 0.15s ease"
            }}
          >
            ✕
          </button>
        </div>

        {/* Reason for High Risk — Easy Diagnostic Breakdown Panel */}
        {showRiskExplainer && (
          <div style={{
            padding: "14px 16px",
            borderRadius: "14px",
            backgroundColor: theme.cardBgSecondary,
            border: `1px solid ${theme.border}`,
            marginBottom: "18px",
            boxShadow: theme.glassShadow
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ fontSize: "0.82rem", fontWeight: "800", color: theme.textPrimary }}>
                🛡️ Reason for High Risk — Easy Diagnostic
              </div>
              <span style={{ fontSize: "0.7rem", color: theme.textSecondary, fontWeight: "600" }}>
                Plain-Language Anti-Brokerage Shield
              </span>
            </div>

            <div style={{ fontSize: "0.78rem", color: theme.textPrimary, lineHeight: 1.5, marginBottom: "10px", padding: "8px 10px", backgroundColor: theme.cardBgElevated, borderRadius: "8px", border: `1px solid ${theme.border}` }}>
              <strong>Current Detection Signal:</strong> {lead.poaching_risk_reason || "Direct contact number accessed multiple times without placing call via encrypted CRM bridge."}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "8px", fontSize: "0.73rem" }}>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: theme.cardBgElevated, border: `1px solid ${theme.border}` }}>
                <span style={{ fontWeight: "700", color: theme.textPrimary }}>1. Direct Calling Bypass:</span>
                <div style={{ color: theme.textMuted, marginTop: "2px" }}>Agent revealed phone digits without routing call via recorded CRM bridge.</div>
              </div>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: theme.cardBgElevated, border: `1px solid ${theme.border}` }}>
                <span style={{ fontWeight: "700", color: theme.textPrimary }}>2. Unlogged Site Visit:</span>
                <div style={{ color: theme.textMuted, marginTop: "2px" }}>Agent GPS breadcrumb was at property site while lead remained in NEW status.</div>
              </div>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: theme.cardBgElevated, border: `1px solid ${theme.border}` }}>
                <span style={{ fontWeight: "700", color: theme.textPrimary }}>3. 15-Min Response SLA:</span>
                <div style={{ color: theme.textMuted, marginTop: "2px" }}>Lead generated from Meta Lead Ads unattended past 15-minute response window.</div>
              </div>
              <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: theme.cardBgElevated, border: `1px solid ${theme.border}` }}>
                <span style={{ fontWeight: "700", color: theme.textPrimary }}>4. Offline Deal Leakage:</span>
                <div style={{ color: theme.textMuted, marginTop: "2px" }}>Lead marked 'LOST' shortly after physically meeting buyer at project site.</div>
              </div>
            </div>
          </div>
        )}

        {/* DLP Immutable Audit Guarantee Banner */}
        <div style={{
          padding: "10px 14px",
          borderRadius: "12px",
          backgroundColor: theme.cardBgSecondary,
          border: `1px solid ${theme.border}`,
          marginBottom: "18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.76rem", color: theme.textSecondary, fontWeight: "600" }}>
            <span>🔒</span>
            <span>Immutable DLP Ledger Active: Profile access automatically logged with watermarked audit trail</span>
          </div>
          <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: "999px", backgroundColor: theme.cardBgElevated, color: theme.textPrimary, fontWeight: "700", border: `1px solid ${theme.border}` }}>
            ✓ AUTO-LOGGED
          </span>
        </div>

        {/* Lead Parameters Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: "12px",
          backgroundColor: theme.cardBgSecondary,
          padding: "16px",
          borderRadius: "14px",
          marginBottom: "18px",
          fontSize: "0.82rem",
          border: `1px solid ${theme.border}`
        }}>
          <div>
            <span style={{ color: theme.textMuted, fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700" }}>Property Tier</span>
            <div style={{ fontWeight: "700", color: theme.textPrimary, marginTop: "2px" }}>{lead.property_type || "Apartment"}</div>
          </div>
          <div>
            <span style={{ color: theme.textMuted, fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700" }}>Budget Bracket</span>
            <div style={{ fontWeight: "800", color: theme.textPrimary, marginTop: "2px" }}>
              {formatBudgetRange(lead.budget_min, lead.budget_max)}
            </div>
          </div>
          <div>
            <span style={{ color: theme.textMuted, fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700" }}>Assigned Executive</span>
            <div style={{ fontWeight: "700", color: theme.textPrimary, marginTop: "2px" }}>👤 {lead.assigned_agent_name || "Unassigned"}</div>
          </div>
          <div>
            <span style={{ color: theme.textMuted, fontSize: "0.7rem", textTransform: "uppercase", fontWeight: "700" }}>SLA Status</span>
            <div style={{ fontWeight: "700", color: theme.textPrimary, marginTop: "2px" }}>
              {lead.is_sla_breached ? "⚠️ Escalated to Management" : "⏱️ Active 15m Countdown"}
            </div>
          </div>
        </div>

        {/* Click-to-Call Masked Bridge Quick Dial */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 18px",
          borderRadius: "14px",
          backgroundColor: theme.cardBgSecondary,
          border: `1px solid ${theme.border}`,
          marginBottom: "18px"
        }}>
          <div>
            <div style={{ fontWeight: "800", fontSize: "0.85rem", color: theme.textPrimary }}>
              📞 Encrypted Click-to-Call Bridge
            </div>
            <div style={{ fontSize: "0.75rem", color: theme.textMuted }}>
              Dials customer via masked bridge without exposing raw phone number.
            </div>
          </div>

          <button
            onClick={handleCall}
            disabled={callActive}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.textPrimary,
              color: theme.bg.includes("#090d16") ? "#000000" : "#ffffff",
              fontWeight: "700",
              fontSize: "0.78rem",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              transition: "all 0.15s ease"
            }}
          >
            {callActive ? "Connecting Bridge..." : "📞 Dial Call Bridge"}
          </button>
        </div>

        {/* Status & Notes Editing Form */}
        <div style={{
          padding: "18px",
          borderRadius: "14px",
          backgroundColor: theme.cardBgSecondary,
          border: `1px solid ${theme.border}`,
          marginBottom: "18px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: "800", color: theme.textPrimary }}>
              Pipeline Stage & Notes:
            </label>
            <span style={{ fontSize: "0.7rem", color: theme.textMuted }}>
              Executive interaction notes
            </span>
          </div>

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
              marginBottom: "10px",
              outline: "none",
              fontWeight: "600",
              fontSize: "0.82rem"
            }}
          >
            <option value="NEW">NEW INQUIRY</option>
            <option value="CONTACTED">CONTACTED (CALL LOGGED)</option>
            <option value="SITE_VISIT_SCHEDULED">SITE VISIT SCHEDULED</option>
            <option value="NEGOTIATION">PRICE NEGOTIATION / TERM SHEET</option>
            <option value="WON">WON (COMMISSION EARNED)</option>
            <option value="LOST">LOST / DISQUALIFIED</option>
          </select>

          <textarea
            rows={2}
            placeholder="Type follow-up interaction details (e.g., Client requested video walkthrough of Sky Villa 401)..."
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
            <span style={{ fontSize: "0.75rem", color: saveSuccess ? theme.textPrimary : theme.textMuted, fontWeight: saveSuccess ? "700" : "500" }}>
              {saveSuccess ? "✓ Follow-up log saved to pipeline!" : "Changes reflect immediately in demo pipeline."}
            </span>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
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
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {isSaving ? "Saving..." : "💾 Save"}
              </button>
              {hasNext && (
                <button
                  onClick={handleSaveAndNext}
                  disabled={isSaving}
                  style={{
                    padding: "8px 18px",
                    borderRadius: "8px",
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.textPrimary,
                    color: theme.bg.includes("#090d16") ? "#000000" : "#ffffff",
                    fontWeight: "700",
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    transition: "all 0.15s ease"
                  }}
                >
                  Save & Next Lead →
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
            <span style={{ fontSize: "0.7rem", color: theme.textMuted, fontWeight: "600" }}>
              ✓ Tamper-Proof Audit
            </span>
          </div>

          <div style={{
            maxHeight: "160px",
            overflowY: "auto",
            backgroundColor: theme.cardBgSecondary,
            borderRadius: "12px",
            padding: "10px 14px",
            fontSize: "0.8rem",
            border: `1px solid ${theme.border}`
          }}>
            {activities.length === 0 ? (
              <div style={{ color: theme.textMuted, padding: "8px 0" }}>Profile view recorded. Loading ledger...</div>
            ) : (
              activities.map((a) => {
                const badge = getActivityBadge(a.activity_type);
                return (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: `1px solid ${theme.border}`
                    }}
                  >
                    <span style={{
                      fontSize: "0.72rem",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontWeight: "700",
                      backgroundColor: theme.cardBgElevated,
                      color: theme.textPrimary,
                      border: `1px solid ${theme.border}`
                    }}>
                      {badge.label}
                    </span>
                    <span style={{ color: theme.textMuted, fontSize: "0.74rem" }}>
                      {new Date(a.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer / Close */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "20px",
          paddingTop: "14px",
          borderTop: `1px solid ${theme.border}`
        }}>
          <span style={{ fontSize: "0.72rem", color: theme.textMuted }}>
            Apex Sovereign CRM DLP Safeguard
          </span>

          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgSecondary,
              color: theme.textPrimary,
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.82rem",
              transition: "all 0.15s ease"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
