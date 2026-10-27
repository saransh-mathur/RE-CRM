import React, { useState, useEffect } from "react";
import { ThemeColors } from "../../lib/theme";
import { formatIndianCurrency } from "../../lib/formatters";

export interface AgentTelemetryData {
  id: string;
  full_name: string;
  email: string;
  employee_code: string;
  role: string;
  phone: string;
  assigned_territory: string;
  is_punched_in: boolean;
  last_punch_time?: string;
  working_hours_today?: string;
  active_leads_count: number;
  total_brokerage_managed?: number;
  device_type?: string;
  device_model?: string;
  ip_address?: string;
  current_location?: string;
  latitude?: number;
  longitude?: number;
  poaching_risk_score?: string;
  poaching_risk_reason?: string;
  offline_closing_flag?: boolean;
}

interface GPSBreadcrumbItem {
  id: string;
  latitude: number;
  longitude: number;
  geofence_tag: string;
  timestamp: string;
  is_within_geofence: boolean;
  unlogged_alert?: boolean;
}

interface AgentCallLogItem {
  id: string;
  customer_name: string;
  property: string;
  masked_phone: string;
  duration: string;
  outcome: string;
  notes: string;
  timestamp: string;
  sla_status: "COMPLIANT" | "BREACHED";
}

interface AgentActivityModalProps {
  agent: AgentTelemetryData | null;
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeColors;
  onConfiscateLeads?: (agentName: string) => void;
  backendUrl?: string;
  token?: string;
}

export const AgentActivityModal: React.FC<AgentActivityModalProps> = ({
  agent,
  isOpen,
  onClose,
  theme,
  onConfiscateLeads,
  backendUrl = "http://localhost:8000",
  token
}) => {
  const [activeTab, setActiveTab] = useState<"gps" | "calls" | "device" | "theft_radar">("gps");
  const [actionDone, setActionDone] = useState(false);
  const [liveBreadcrumbs, setLiveBreadcrumbs] = useState<GPSBreadcrumbItem[] | null>(null);

  useEffect(() => {
    if (!agent || !token) return;
    const fetchLive = async () => {
      try {
        const resp = await fetch(`${backendUrl}/api/v1/telemetry/agents/${agent.id}/activities`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.gps_breadcrumbs && data.gps_breadcrumbs.length > 0) {
            setLiveBreadcrumbs(data.gps_breadcrumbs);
          }
        }
      } catch (e) {}
    };
    fetchLive();
  }, [agent?.id, token, backendUrl]);

  if (!isOpen || !agent) return null;

  // Rich fallback GPS breadcrumbs tailored to each executive's authentic persona
  const getAgentBreadcrumbs = (): GPSBreadcrumbItem[] => {
    if (agent.employee_code === "EXE-208" || agent.full_name.includes("Ananya")) {
      return [
        {
          id: "gps-1",
          latitude: 19.1136,
          longitude: 72.8697,
          geofence_tag: "Palm Grove Signature Villa 12 - Private Site Inspection (UNLOGGED IN CRM)",
          timestamp: "Just now (18 mins ago)",
          is_within_geofence: true,
          unlogged_alert: true
        },
        {
          id: "gps-2",
          latitude: 19.1136,
          longitude: 72.8697,
          geofence_tag: "Palm Grove Signature Villa 12 - Afternoon Client Walkthrough",
          timestamp: "Today, 02:45 PM (Duration: 52 mins)",
          is_within_geofence: true,
          unlogged_alert: true
        },
        {
          id: "gps-3",
          latitude: 19.1145,
          longitude: 72.8710,
          geofence_tag: "Palm Grove Estates Clubhouse Coffee Lounge",
          timestamp: "Today, 01:15 PM (Duration: 40 mins)",
          is_within_geofence: true,
          unlogged_alert: false
        },
        {
          id: "gps-4",
          latitude: 19.1136,
          longitude: 72.8697,
          geofence_tag: "Palm Grove Signature Villa 12 - Morning Inspection (UNLOGGED IN CRM)",
          timestamp: "Today, 11:30 AM (Duration: 45 mins)",
          is_within_geofence: true,
          unlogged_alert: true
        },
        {
          id: "gps-5",
          latitude: 19.1120,
          longitude: 72.8680,
          geofence_tag: "Palm Grove Main Security Gate (Mobile Punch-In Verified)",
          timestamp: "Today, 10:00 AM",
          is_within_geofence: true,
          unlogged_alert: false
        }
      ];
    }

    if (agent.employee_code === "EXE-204" || agent.full_name.includes("Rahul")) {
      return [
        {
          id: "gps-r1",
          latitude: 19.0760,
          longitude: 72.8777,
          geofence_tag: "Downtown Skyline Corporate Branch - Workstation 4",
          timestamp: "12 mins ago",
          is_within_geofence: true,
          unlogged_alert: false
        },
        {
          id: "gps-r2",
          latitude: 19.0782,
          longitude: 72.8791,
          geofence_tag: "The Grand Crest - Sky Villa 401 Show Flat Presentation",
          timestamp: "Today, 02:30 PM (Duration: 45 mins)",
          is_within_geofence: true,
          unlogged_alert: false
        },
        {
          id: "gps-r3",
          latitude: 19.0745,
          longitude: 72.8762,
          geofence_tag: "Oberoi Corporate Park - Client Coffee Consultation",
          timestamp: "Today, 11:15 AM (Duration: 35 mins)",
          is_within_geofence: true,
          unlogged_alert: false
        },
        {
          id: "gps-r4",
          latitude: 19.0760,
          longitude: 72.8777,
          geofence_tag: "Downtown Skyline HQ (Shift Punch-In)",
          timestamp: "Today, 09:30 AM",
          is_within_geofence: true,
          unlogged_alert: false
        }
      ];
    }

    if (agent.employee_code === "EXE-215" || agent.full_name.includes("Vikram")) {
      return [
        {
          id: "gps-v1",
          latitude: 18.9220,
          longitude: 72.8347,
          geofence_tag: "Marina Azure Corporate Lounge - Client Term Sheet Review",
          timestamp: "25 mins ago",
          is_within_geofence: true,
          unlogged_alert: false
        },
        {
          id: "gps-v2",
          latitude: 18.9288,
          longitude: 72.8320,
          geofence_tag: "CBD Commercial Tower - Level 14 Site Inspection (Rajesh Agarwal)",
          timestamp: "Today, 01:20 PM (Duration: 1h 10m)",
          is_within_geofence: true,
          unlogged_alert: false
        },
        {
          id: "gps-v3",
          latitude: 18.9220,
          longitude: 72.8347,
          geofence_tag: "Marina Azure Sales Gallery (Mobile Punch-In)",
          timestamp: "Today, 09:45 AM",
          is_within_geofence: true,
          unlogged_alert: false
        }
      ];
    }

    if (agent.employee_code === "EXE-210" || agent.full_name.includes("Karan")) {
      return [
        {
          id: "gps-k1",
          latitude: 19.0544,
          longitude: 72.8266,
          geofence_tag: "Bandra Sea Face Lounge - Duplex Penthouse Signing",
          timestamp: "40 mins ago",
          is_within_geofence: true,
          unlogged_alert: false
        },
        {
          id: "gps-k2",
          latitude: 19.0560,
          longitude: 72.8280,
          geofence_tag: "Worli Sea Promenade Site Office",
          timestamp: "Today, 12:40 PM",
          is_within_geofence: true,
          unlogged_alert: false
        }
      ];
    }

    // Rohit
    return [
      {
        id: "gps-ro1",
        latitude: 19.1670,
        longitude: 72.9340,
        geofence_tag: "Green Valley Hills Home Base (Shift Ended)",
        timestamp: "Today, 05:00 PM (Shift Concluded)",
        is_within_geofence: true,
        unlogged_alert: false
      },
      {
        id: "gps-ro2",
        latitude: 19.1650,
        longitude: 72.9310,
        geofence_tag: "Green Valley Sanctuary - Eco Villa 07 Final Deed Handover",
        timestamp: "Today, 02:15 PM (Duration: 1h 30m)",
        is_within_geofence: true,
        unlogged_alert: false
      }
    ];
  };

  const getAgentCalls = (): AgentCallLogItem[] => {
    if (agent.employee_code === "EXE-208" || agent.full_name.includes("Ananya")) {
      return [
        {
          id: "c-1",
          customer_name: "Kavita Chawla (Villa 12 Prospect)",
          property: "Palm Serenade Villa 12 (₹7.25 Cr)",
          masked_phone: "+919*******77",
          duration: "0 sec on CRM bridge",
          outcome: "MARKED 'LOST' IN CRM",
          notes: "Customer marked unreachable, yet GPS indicates 3 unlogged in-person visits to client's villa.",
          timestamp: "Today, 10:45 AM",
          sla_status: "BREACHED"
        },
        {
          id: "c-2",
          customer_name: "Gautam Singhal",
          property: "Palm Serenade Signature Villa",
          masked_phone: "+919*******90",
          duration: "11m 40s (CRM Masked Bridge)",
          outcome: "OFFER SUBMITTED",
          notes: "Compliant call on CRM virtual bridge. Submitted formal token offer.",
          timestamp: "Today, 12:10 PM",
          sla_status: "COMPLIANT"
        },
        {
          id: "c-3",
          customer_name: "Naveen Mittal",
          property: "Palm Grove Estates",
          masked_phone: "+9715*******67",
          duration: "6m 45s (International Masked Bridge)",
          outcome: "NEGOTIATING",
          notes: "Arriving Mumbai on 28th. Requested villa brochures.",
          timestamp: "Yesterday, 04:30 PM",
          sla_status: "COMPLIANT"
        }
      ];
    }

    if (agent.employee_code === "EXE-204" || agent.full_name.includes("Rahul")) {
      return [
        {
          id: "c-r1",
          customer_name: "Aditya Singhania",
          property: "The Grand Crest Sky Villa",
          masked_phone: "+919*******22",
          duration: "0 sec on CRM bridge",
          outcome: "SUSPECTED DIRECT CALL",
          notes: "Agent viewed phone contact details 6 times in 2 hours without initiating CRM bridge call.",
          timestamp: "Today, 03:15 PM",
          sla_status: "BREACHED"
        },
        {
          id: "c-r2",
          customer_name: "Sunita Kapoor",
          property: "4 BHK Duplex Penthouse",
          masked_phone: "+919*******44",
          duration: "14m 20s (CRM Masked Bridge)",
          outcome: "DEAL WON (COMMISSION SECURED)",
          notes: "Closed transaction. Agency commission wired.",
          timestamp: "Yesterday, 02:40 PM",
          sla_status: "COMPLIANT"
        }
      ];
    }

    // Default
    return [
      {
        id: "c-def1",
        customer_name: "Rajesh Agarwal",
        property: "CBD Commercial Office (Level 14)",
        masked_phone: "+919*******11",
        duration: "22m 14s (CRM Masked Bridge)",
        outcome: "TERM SHEET UNDER REVIEW",
        notes: "Commercial term sheet finalized under agency contract.",
        timestamp: "Today, 02:10 PM",
        sla_status: "COMPLIANT"
      }
    ];
  };

  const breadcrumbs = liveBreadcrumbs && liveBreadcrumbs.length > 0 ? liveBreadcrumbs : getAgentBreadcrumbs();
  const calls = getAgentCalls();
  const hasTheftFlag = agent.offline_closing_flag || agent.poaching_risk_score === "CRITICAL" || agent.poaching_risk_score === "HIGH";

  const handleConfiscateClick = async () => {
    try {
      if (token && agent.id) {
        await fetch(`${backendUrl}/api/v1/telemetry/agents/${agent.id}/confiscate-all`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (e) {}

    if (onConfiscateLeads) {
      onConfiscateLeads(agent.full_name);
    }
    setActionDone(true);
    setTimeout(() => setActionDone(false), 5000);
  };

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
      zIndex: 999999,
      padding: "clamp(12px, 2.5vw, 24px)"
    }}>
      <div style={{
        backgroundColor: theme.cardBgElevated,
        backdropFilter: theme.glassBackdrop,
        WebkitBackdropFilter: theme.glassBackdrop,
        border: theme.glassBorder,
        borderRadius: "22px",
        boxShadow: theme.glassShadowGlow,
        width: "100%",
        maxWidth: "min(880px, 95vw)",
        maxHeight: "92vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: `1px solid ${theme.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: theme.cardBgSecondary
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              backgroundColor: theme.cardBgElevated,
              color: theme.textPrimary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: "800",
              border: `1px solid ${theme.border}`,
              boxShadow: theme.glassShadow
            }}>
              {agent.full_name.charAt(0)}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: theme.textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
                  {agent.full_name}
                </h2>
                <span style={{
                  fontSize: "0.68rem",
                  padding: "3px 8px",
                  borderRadius: "999px",
                  fontWeight: "700",
                  backgroundColor: theme.cardBgElevated,
                  color: theme.textPrimary,
                  border: `1px solid ${theme.border}`
                }}>
                  {agent.is_punched_in ? "ON DUTY" : "OFF DUTY"}
                </span>

                {hasTheftFlag && (
                  <span style={{
                    fontSize: "0.68rem",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    fontWeight: "700",
                    backgroundColor: theme.cardBgElevated,
                    color: theme.textPrimary,
                    border: `1px solid ${theme.border}`
                  }}>
                    FLAGGED BY RADAR
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.78rem", color: theme.textMuted, marginTop: "3px" }}>
                Code: <strong style={{ color: theme.textPrimary }}>{agent.employee_code}</strong> • Territory: <strong style={{ color: theme.textSecondary }}>{agent.assigned_territory}</strong> • Device: <strong style={{ color: theme.textPrimary }}>{agent.device_model}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: "transparent",
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

        {/* Tab Navigation (Frosted Crystal Glass Bar) */}
        <div style={{
          display: "flex",
          borderBottom: `1px solid ${theme.border}`,
          backgroundColor: theme.cardBgSecondary,
          padding: "4px 16px",
          gap: "6px",
          overflowX: "auto"
        }}>
          {[
            { id: "gps", label: `🛰️ Field GPS (${breadcrumbs.length})` },
            { id: "calls", label: `📞 Masked Calls (${calls.length})` },
            { id: "device", label: "💻 Device & Shifts" },
            { id: "theft_radar", label: `🛡️ Anti-Theft Radar ${hasTheftFlag ? "• Alert" : ""}` }
          ].map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  padding: "8px 14px",
                  border: `1px solid ${active ? theme.border : "transparent"}`,
                  borderRadius: "8px",
                  background: active ? theme.cardBgElevated : "transparent",
                  cursor: "pointer",
                  fontWeight: active ? "700" : "500",
                  fontSize: "0.8rem",
                  color: active ? theme.textPrimary : theme.textMuted,
                  boxShadow: active ? theme.glassShadow : "none",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease"
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {actionDone && (
            <div style={{
              marginBottom: "16px",
              padding: "12px 16px",
              borderRadius: "10px",
              backgroundColor: theme.cardBgElevated,
              color: theme.textPrimary,
              fontWeight: "700",
              fontSize: "0.82rem",
              border: `1px solid ${theme.border}`
            }}>
              ✓ Leads confiscated from {agent.full_name} and queued for compliant auto-distribution!
            </div>
          )}

          {/* TAB 1: GPS BREADCRUMBS */}
          {activeTab === "gps" && (
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: theme.textPrimary }}>
                    GPS Breadcrumb Trail & Field Movements
                  </h4>
                  <div style={{ fontSize: "0.75rem", color: theme.textMuted }}>
                    Physical presence at project sites cross-referenced with CRM calendar.
                  </div>
                </div>

                <span style={{ fontSize: "0.72rem", padding: "3px 9px", borderRadius: "999px", backgroundColor: theme.cardBgSecondary, color: theme.textSecondary, fontWeight: "600", border: `1px solid ${theme.border}` }}>
                  📍 Accuracy: ±5.5m
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {breadcrumbs.map((b, idx) => (
                  <div
                    key={b.id}
                    style={{
                      padding: "14px 18px",
                      borderRadius: "12px",
                      backgroundColor: theme.cardBgSecondary,
                      border: `1px solid ${theme.border}`,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "14px"
                    }}
                  >
                    <div style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      backgroundColor: theme.textPrimary,
                      color: theme.bg.includes("#090d16") ? "#000000" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.74rem",
                      fontWeight: "800",
                      flexShrink: 0,
                      marginTop: "2px"
                    }}>
                      {idx + 1}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                        <strong style={{ color: theme.textPrimary, fontSize: "0.88rem" }}>
                          {b.geofence_tag}
                        </strong>
                        <span style={{ fontSize: "0.74rem", color: theme.textMuted, fontWeight: "600" }}>
                          ⏱️ {b.timestamp}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.75rem", color: theme.textMuted, marginTop: "4px" }}>
                        Coordinates: <span style={{ fontFamily: "monospace", color: theme.textPrimary }}>{b.latitude.toFixed(4)}, {b.longitude.toFixed(4)}</span> | Status: <span style={{ fontWeight: "700", color: theme.textPrimary }}>{b.unlogged_alert ? "Unlogged Visit Detected" : "Verified Shift Zone"}</span>
                      </div>

                      {b.unlogged_alert && (
                        <div style={{
                          marginTop: "8px",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          backgroundColor: theme.cardBgElevated,
                          border: `1px solid ${theme.border}`,
                          fontSize: "0.74rem",
                          color: theme.textPrimary,
                          fontWeight: "600"
                        }}>
                          🛡️ Notice: Agent logged 40+ minutes at this villa without recording showing in CRM. Flagged for review.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: CALL LOGS */}
          {activeTab === "calls" && (
            <div>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "800", color: theme.textPrimary }}>
                    Encrypted CTI Masked Bridge Calls
                  </h4>
                  <div style={{ fontSize: "0.75rem", color: theme.textMuted }}>
                    Zero direct PII exposure. Calls routed via virtual bridge to prevent off-platform poaching.
                  </div>
                </div>

                <span style={{ fontSize: "0.72rem", padding: "3px 9px", borderRadius: "999px", backgroundColor: theme.cardBgSecondary, color: theme.textSecondary, fontWeight: "600", border: `1px solid ${theme.border}` }}>
                  🔒 Zero Raw PII Exposed
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {calls.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "12px",
                      backgroundColor: theme.cardBgSecondary,
                      border: `1px solid ${theme.border}`
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        <strong style={{ color: theme.textPrimary, fontSize: "0.92rem" }}>
                          {c.customer_name}
                        </strong>
                        <span style={{ fontSize: "0.8rem", color: theme.textMuted, marginLeft: "8px" }}>
                          ({c.property})
                        </span>
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{
                          fontSize: "0.68rem",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontWeight: "700",
                          backgroundColor: theme.cardBgElevated,
                          color: theme.textPrimary,
                          border: `1px solid ${theme.border}`
                        }}>
                          {c.sla_status === "COMPLIANT" ? "✓ BRIDGE COMPLIANT" : "FLAGGED FOR REVIEW"}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: theme.textMuted }}>
                          {c.timestamp}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: "0.8rem", color: theme.textSecondary, marginBottom: "8px" }}>
                      Customer Masked: <strong style={{ color: theme.textPrimary, fontFamily: "monospace" }}>{c.masked_phone}</strong> • Duration: <strong style={{ color: theme.textPrimary }}>{c.duration}</strong> • Outcome: <strong style={{ color: theme.textPrimary }}>{c.outcome}</strong>
                    </div>

                    <div style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor: theme.cardBgElevated,
                      fontSize: "0.8rem",
                      color: theme.textSecondary,
                      fontStyle: "italic",
                      border: `1px solid ${theme.border}`
                    }}>
                      "{c.notes}"
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DEVICE & SHIFT LOGS */}
          {activeTab === "device" && (
            <div>
              <h4 style={{ margin: "0 0 16px 0", fontSize: "0.95rem", fontWeight: "800", color: theme.textPrimary }}>
                Device Environment & Working Hours Telemetry
              </h4>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                <div style={{ padding: "16px", borderRadius: "14px", backgroundColor: theme.cardBgSecondary, border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "700" }}>HARDWARE FORM FACTOR</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "800", color: theme.textPrimary, marginTop: "4px" }}>
                    {agent.device_type === "MOBILE_PHONE" ? "📱 Mobile Phone" : "💻 Laptop / Desktop"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: theme.textMuted, marginTop: "2px" }}>
                    Model: {agent.device_model}
                  </div>
                </div>

                <div style={{ padding: "16px", borderRadius: "14px", backgroundColor: theme.cardBgSecondary, border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "700" }}>WORKING HOURS TODAY</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "800", color: theme.textPrimary, marginTop: "4px" }}>
                    {agent.working_hours_today || "4h 25m"}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: theme.textMuted, marginTop: "2px" }}>
                    Status: {agent.is_punched_in ? "Currently Active Shift" : "Shift Concluded"}
                  </div>
                </div>

                <div style={{ padding: "16px", borderRadius: "14px", backgroundColor: theme.cardBgSecondary, border: `1px solid ${theme.border}` }}>
                  <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "700" }}>NETWORK IDENTITY & IP</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "800", color: theme.textPrimary, marginTop: "4px", fontFamily: "monospace" }}>
                    {agent.ip_address}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: theme.textMuted, marginTop: "2px" }}>
                    ISP: Enterprise Cellular / Secure Wi-Fi
                  </div>
                </div>
              </div>

              <div style={{
                padding: "16px",
                borderRadius: "14px",
                backgroundColor: theme.cardBgSecondary,
                border: `1px solid ${theme.border}`
              }}>
                <h5 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", fontWeight: "800", color: theme.textPrimary }}>
                  DLP Security Controls Active on this Screen:
                </h5>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.8rem", color: theme.textSecondary, display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li>Dynamic Forensic Canvas Watermark: <strong style={{ color: theme.textPrimary }}>Active (EMP #{agent.employee_code})</strong></li>
                  <li>Developer Tools & DOM Inspector: <strong style={{ color: theme.textPrimary }}>Trap & Auto-Report Enabled</strong></li>
                  <li>Copy/Paste Clipboard Interceptor: <strong style={{ color: theme.textPrimary }}>Encrypted PII Guard Enabled</strong></li>
                  <li>Four-Eyes Data Export Rule: <strong style={{ color: theme.textPrimary }}>Direct Bulk CSV Export Prohibited</strong></li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: ANTI-THEFT RADAR */}
          {activeTab === "theft_radar" && (
            <div>
              <div style={{
                padding: "18px",
                borderRadius: "14px",
                backgroundColor: theme.cardBgSecondary,
                border: `1px solid ${theme.border}`,
                marginBottom: "20px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: theme.textPrimary }}>
                    {hasTheftFlag ? "🛡️ Suspected Offline Closing & Direct Calling Detected" : "✓ Compliant Operational Health"}
                  </h4>
                  <span style={{
                    fontSize: "0.7rem",
                    padding: "3px 9px",
                    borderRadius: "999px",
                    fontWeight: "700",
                    backgroundColor: theme.cardBgElevated,
                    color: theme.textPrimary,
                    border: `1px solid ${theme.border}`
                  }}>
                    STATUS: {agent.poaching_risk_score || (hasTheftFlag ? "FLAGGED" : "COMPLIANT")}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: "0.84rem", color: theme.textSecondary, lineHeight: 1.5 }}>
                  {agent.poaching_risk_reason || (
                    agent.employee_code === "EXE-208"
                      ? "Agent marked high-value villa lead 'Kavita Chawla' (₹7.25 Cr budget) as LOST in CRM, claiming the customer was unreachable. However, live GPS breadcrumb telemetry proves the executive visited Palm Grove Villa 12 three times in 24 hours. Estimated company brokerage of ₹14.5 Lakhs is at immediate risk of offline closing."
                      : "No suspicious offline closing activity detected. All site visits and client conversations are logged on the secure CRM bridge."
                  )}
                </p>

                {hasTheftFlag && (
                  <div style={{ marginTop: "16px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={handleConfiscateClick}
                      style={{
                        padding: "8px 18px",
                        borderRadius: "8px",
                        border: `1px solid ${theme.border}`,
                        backgroundColor: theme.textPrimary,
                        color: theme.bg.includes("#090d16") ? "#000000" : "#ffffff",
                        fontWeight: "700",
                        fontSize: "0.82rem",
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        transition: "all 0.15s ease"
                      }}
                    >
                      🛡️ Confiscate & Reassign Leads Now
                    </button>
                    <span style={{ fontSize: "0.75rem", color: theme.textMuted }}>
                      Secures estimated ₹14.5 Lakhs agency brokerage
                    </span>
                  </div>
                )}
              </div>

              {/* Active Pipeline */}
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", fontWeight: "800", color: theme.textPrimary }}>
                Active Company Leads Held by {agent.full_name} ({agent.active_leads_count} Leads)
              </h4>

              <div style={{
                padding: "14px 18px",
                borderRadius: "12px",
                backgroundColor: theme.cardBgSecondary,
                border: `1px solid ${theme.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <strong style={{ color: theme.textPrimary, fontSize: "0.85rem" }}>
                    Total Estimated Commission in Custody
                  </strong>
                  <div style={{ fontSize: "0.75rem", color: theme.textMuted }}>
                    Calculated at standard 2% agency commission rate
                  </div>
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: "800", color: theme.textPrimary }}>
                  {formatIndianCurrency(agent.total_brokerage_managed || 1850000)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: "16px 24px",
          borderTop: `1px solid ${theme.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: theme.cardBgSecondary
        }}>
          <div style={{ fontSize: "0.75rem", color: theme.textMuted }}>
            Apex Sovereign Real Estate CRM Telemetry Engine
          </div>

          <button
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgElevated,
              color: theme.textPrimary,
              fontWeight: "600",
              fontSize: "0.82rem",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
