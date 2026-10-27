import React, { useState, useMemo } from "react";
import { ThemeColors } from "../../lib/theme";
import { formatIndianCurrency, formatBudgetRange } from "../../lib/formatters";

export interface LeadItem {
  id: string;
  full_name: string;
  phone_masked: string;
  email_masked?: string;
  source: string;
  status: string;
  property_type?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  notes?: string;
  assigned_agent_name?: string;
  sla_deadline?: string;
  is_sla_breached: boolean;
  estimated_brokerage?: number;
  poaching_risk_score?: string;
  poaching_risk_reason?: string;
  offline_closing_flag?: boolean;
  created_at: string;
}

interface LeadTableProps {
  leads: LeadItem[];
  theme: ThemeColors;
  onSelectLead: (lead: LeadItem) => void;
  onCallLead: (lead: LeadItem) => void;
  token: string;
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  theme,
  onSelectLead,
  onCallLead
}) => {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [riskFilterOnly, setRiskFilterOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      // 1. Status Filter
      if (filterStatus !== "ALL" && l.status !== filterStatus) {
        return false;
      }

      // 2. Risk Filter
      if (riskFilterOnly && !l.offline_closing_flag && l.poaching_risk_score !== "CRITICAL" && l.poaching_risk_score !== "HIGH") {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = l.full_name?.toLowerCase().includes(q);
        const matchesPhone = l.phone_masked?.toLowerCase().includes(q);
        const matchesProp = l.property_type?.toLowerCase().includes(q);
        const matchesLoc = l.preferred_location?.toLowerCase().includes(q);
        const matchesAgent = l.assigned_agent_name?.toLowerCase().includes(q);
        const matchesSource = l.source?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesProp && !matchesLoc && !matchesAgent && !matchesSource) {
          return false;
        }
      }

      return true;
    });
  }, [leads, filterStatus, riskFilterOnly, searchQuery]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLeads = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, safePage, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Refined SLA Badge (Subdued crystal glass styling matching the white theme)
  const getSlaBadge = (lead: LeadItem) => {
    if (lead.status !== "NEW") {
      return (
        <span style={{
          fontSize: "0.72rem",
          padding: "3px 9px",
          borderRadius: "999px",
          backgroundColor: theme.cardBgSecondary,
          color: theme.textMuted,
          fontWeight: "600",
          border: `1px solid ${theme.border}`,
          display: "inline-flex",
          alignItems: "center",
          gap: "4px"
        }}>
          <span>✓</span> Contacted
        </span>
      );
    }
    if (lead.is_sla_breached) {
      return (
        <span style={{
          fontSize: "0.72rem",
          padding: "3px 9px",
          borderRadius: "999px",
          backgroundColor: theme.cardBgElevated,
          color: theme.textPrimary,
          fontWeight: "700",
          border: `1px solid ${theme.border}`,
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: theme.textSecondary, opacity: 0.8 }}></span>
          SLA Escalated
        </span>
      );
    }
    return (
      <span style={{
        fontSize: "0.72rem",
        padding: "3px 9px",
        borderRadius: "999px",
        backgroundColor: theme.cardBgElevated,
        color: theme.textPrimary,
        fontWeight: "700",
        border: `1px solid ${theme.border}`,
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
      }}>
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: theme.crystalAccent }}></span>
        15m Active SLA
      </span>
    );
  };

  // Refined Source Badge
  const getSourceBadge = (source: string) => {
    let label = "Website Direct";
    let icon = "🌐";
    if (source.includes("FB")) {
      label = "Meta FB Ad";
      icon = "🎯";
    } else if (source.includes("IG")) {
      label = "Meta IG Lead";
      icon = "📱";
    }

    return (
      <span style={{
        fontSize: "0.72rem",
        padding: "3px 8px",
        borderRadius: "6px",
        backgroundColor: theme.cardBgSecondary,
        color: theme.textSecondary,
        fontWeight: "600",
        border: `1px solid ${theme.border}`,
        display: "inline-flex",
        alignItems: "center",
        gap: "5px"
      }}>
        <span>{icon}</span> {label}
      </span>
    );
  };

  return (
    <div style={{
      backgroundColor: theme.cardBg,
      backdropFilter: theme.glassBackdrop,
      WebkitBackdropFilter: theme.glassBackdrop,
      borderRadius: "18px",
      border: theme.glassBorder,
      boxShadow: theme.glassShadow,
      overflow: "hidden",
      transition: "all 0.2s ease"
    }}>
      {/* Filter & Search Toolbar */}
      <div style={{
        padding: "18px 22px",
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}>
        {/* Top Row: Title, Count, Search */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ fontSize: "1.08rem", fontWeight: "800", color: theme.textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
              Prospect Inquiries & Pipeline Ledger
            </h2>
            <span style={{
              fontSize: "0.72rem",
              backgroundColor: theme.cardBgSecondary,
              color: theme.textSecondary,
              padding: "3px 10px",
              borderRadius: "999px",
              fontWeight: "700",
              border: `1px solid ${theme.border}`
            }}>
              {filteredLeads.length} of {leads.length} Leads
            </span>
          </div>

          {/* Search Box */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: "1 1 240px", maxWidth: "380px" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "0.85rem", color: theme.textMuted }}>
                🔍
              </span>
              <input
                type="text"
                placeholder="Search clients, properties, locations, agents..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 34px",
                  borderRadius: "10px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgElevated,
                  color: theme.textPrimary,
                  fontSize: "0.82rem",
                  outline: "none",
                  boxSizing: "border-box",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: theme.textMuted,
                    cursor: "pointer",
                    fontSize: "0.8rem"
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Second Row: Status Filter Pills + Risk Toggle */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          {/* Status Segmented Control Buttons */}
          <div style={{
            display: "flex",
            gap: "5px",
            overflowX: "auto",
            maxWidth: "100%",
            paddingBottom: "4px"
          }}>
            {[
              { id: "ALL", label: "All Leads" },
              { id: "NEW", label: "New (15m SLA)" },
              { id: "CONTACTED", label: "Contacted" },
              { id: "SITE_VISIT_SCHEDULED", label: "Site Visit" },
              { id: "NEGOTIATION", label: "Negotiation" },
              { id: "WON", label: "Won (Closed)" },
              { id: "LOST", label: "Lost" }
            ].map((st) => {
              const active = filterStatus === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => {
                    setFilterStatus(st.id);
                    setCurrentPage(1);
                  }}
                  style={{
                    fontSize: "0.74rem",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${active ? theme.glassBorderHighlight || theme.border : theme.border}`,
                    cursor: "pointer",
                    backgroundColor: active ? theme.cardBgElevated : theme.cardBgSecondary,
                    color: active ? theme.textPrimary : theme.textMuted,
                    fontWeight: active ? "700" : "500",
                    whiteSpace: "nowrap",
                    boxShadow: active ? theme.glassShadow : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {st.label}
                </button>
              );
            })}
          </div>

          {/* Poaching Risk Toggle (Subdued crystal styling) */}
          <button
            onClick={() => {
              setRiskFilterOnly(!riskFilterOnly);
              setCurrentPage(1);
            }}
            style={{
              fontSize: "0.74rem",
              padding: "6px 14px",
              borderRadius: "8px",
              border: `1px solid ${riskFilterOnly ? theme.textPrimary : theme.border}`,
              backgroundColor: riskFilterOnly ? theme.cardBgElevated : theme.cardBgSecondary,
              color: theme.textPrimary,
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: riskFilterOnly ? theme.glassShadow : "none",
              transition: "all 0.15s ease"
            }}
          >
            <span style={{ fontSize: "0.85rem" }}>🛡️</span>
            <span>{riskFilterOnly ? "Showing Flagged Risks" : "Filter Flagged Risks"}</span>
          </button>
        </div>
      </div>

      {/* Leads Table Container with Touch Momentum Scrolling */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem", color: theme.textSecondary }}>
          <thead>
            <tr style={{
              borderBottom: `1px solid ${theme.border}`,
              backgroundColor: theme.tableHeaderBg,
              color: theme.textMuted,
              textTransform: "uppercase",
              fontSize: "0.68rem",
              letterSpacing: "0.04em",
              fontWeight: "700"
            }}>
              <th style={{ padding: "12px 18px" }}>Prospect Client</th>
              <th style={{ padding: "12px 18px" }}>Masked Phone (DLP)</th>
              <th style={{ padding: "12px 18px" }}>Property Tier</th>
              <th style={{ padding: "12px 18px" }}>Location</th>
              <th style={{ padding: "12px 18px" }}>Budget / Brokerage</th>
              <th style={{ padding: "12px 18px" }}>Source</th>
              <th style={{ padding: "12px 18px" }}>SLA Status</th>
              <th style={{ padding: "12px 18px" }}>Executive</th>
              <th style={{ padding: "12px 18px", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLeads.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "48px", color: theme.textMuted }}>
                  No customer leads match the selected filter.
                </td>
              </tr>
            ) : (
              paginatedLeads.map((lead) => {
                const brokerage = lead.estimated_brokerage || (lead.budget_max ? Math.round(lead.budget_max * 0.02) : 650000);
                const hasTheft = lead.offline_closing_flag || lead.poaching_risk_score === "CRITICAL" || lead.poaching_risk_score === "HIGH";

                return (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    style={{
                      borderBottom: `1px solid ${theme.border}`,
                      transition: "background-color 0.15s ease",
                      cursor: "pointer",
                      backgroundColor: "transparent"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.tableRowHover)}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Prospect Name + Clean Risk Indicator */}
                    <td style={{ padding: "13px 18px", fontWeight: "700", color: theme.textPrimary }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>{lead.full_name}</span>
                        {hasTheft && (
                          <span style={{
                            fontSize: "0.62rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            backgroundColor: theme.cardBgSecondary,
                            color: theme.textPrimary,
                            border: `1px solid ${theme.border}`,
                            fontWeight: "700"
                          }}>
                            FLAGGED
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Masked Phone */}
                    <td style={{ padding: "13px 18px", fontFamily: "monospace", color: theme.textSecondary, fontWeight: "600", whiteSpace: "nowrap" }}>
                      🔒 {lead.phone_masked}
                    </td>

                    {/* Property Preference */}
                    <td style={{ padding: "13px 18px", color: theme.textSecondary, whiteSpace: "nowrap" }}>
                      {lead.property_type || "Apartment"}
                    </td>

                    {/* Location */}
                    <td style={{ padding: "13px 18px", color: theme.textSecondary, whiteSpace: "nowrap" }}>
                      📍 {lead.preferred_location || "Downtown"}
                    </td>

                    {/* Budget & 2% Brokerage */}
                    <td style={{ padding: "13px 18px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: "700", color: theme.textPrimary }}>
                        {formatBudgetRange(lead.budget_min, lead.budget_max)}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: theme.textMuted, fontWeight: "600", marginTop: "1px" }}>
                        Brokerage: <span style={{ color: theme.textPrimary, fontWeight: "700" }}>{formatIndianCurrency(brokerage)}</span>
                      </div>
                    </td>

                    {/* Source */}
                    <td style={{ padding: "13px 18px", whiteSpace: "nowrap" }}>
                      {getSourceBadge(lead.source)}
                    </td>

                    {/* SLA Monitor */}
                    <td style={{ padding: "13px 18px", whiteSpace: "nowrap" }}>
                      {getSlaBadge(lead)}
                    </td>

                    {/* Assigned Agent */}
                    <td style={{ padding: "13px 18px", color: theme.textPrimary, fontWeight: "600", whiteSpace: "nowrap" }}>
                      👤 {lead.assigned_agent_name || "Unassigned"}
                    </td>

                    {/* Click-to-Call Masked Bridge (Crystal Glass Button) */}
                    <td style={{ padding: "13px 18px", textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCallLead(lead);
                        }}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "8px",
                          border: `1px solid ${theme.border}`,
                          backgroundColor: theme.cardBgElevated,
                          color: theme.textPrimary,
                          fontWeight: "700",
                          fontSize: "0.74rem",
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          transition: "all 0.15s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = theme.textPrimary;
                          e.currentTarget.style.color = theme.bg.includes("#090d16") ? "#000000" : "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme.cardBgElevated;
                          e.currentTarget.style.color = theme.textPrimary;
                        }}
                      >
                        📞 Masked Call
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{
        padding: "14px 20px",
        borderTop: `1px solid ${theme.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: theme.cardBgSecondary,
        flexWrap: "wrap",
        gap: "12px"
      }}>
        {/* Page size selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: theme.textMuted }}>
          <span>Show:</span>
          {[25, 50, 100].map((size) => (
            <button
              key={size}
              onClick={() => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              style={{
                padding: "3px 9px",
                borderRadius: "6px",
                border: pageSize === size ? "none" : `1px solid ${theme.border}`,
                backgroundColor: pageSize === size ? theme.textPrimary : "transparent",
                color: pageSize === size ? (theme.bg.includes("#090d16") ? "#000000" : "#ffffff") : theme.textSecondary,
                fontWeight: "700",
                fontSize: "0.75rem",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {size}
            </button>
          ))}
          <span>leads per page</span>
        </div>

        {/* Page controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.78rem", color: theme.textMuted, marginRight: "8px" }}>
            Page <strong style={{ color: theme.textPrimary }}>{safePage}</strong> of <strong style={{ color: theme.textPrimary }}>{totalPages}</strong>
          </span>

          <button
            onClick={() => handlePageChange(1)}
            disabled={safePage === 1}
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgElevated,
              color: safePage === 1 ? theme.textMuted : theme.textPrimary,
              cursor: safePage === 1 ? "not-allowed" : "pointer",
              fontSize: "0.75rem",
              fontWeight: "600",
              opacity: safePage === 1 ? 0.5 : 1
            }}
          >
            « First
          </button>

          <button
            onClick={() => handlePageChange(safePage - 1)}
            disabled={safePage === 1}
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgElevated,
              color: safePage === 1 ? theme.textMuted : theme.textPrimary,
              cursor: safePage === 1 ? "not-allowed" : "pointer",
              fontSize: "0.75rem",
              fontWeight: "600",
              opacity: safePage === 1 ? 0.5 : 1
            }}
          >
            ‹ Prev
          </button>

          <button
            onClick={() => handlePageChange(safePage + 1)}
            disabled={safePage >= totalPages}
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgElevated,
              color: safePage >= totalPages ? theme.textMuted : theme.textPrimary,
              cursor: safePage >= totalPages ? "not-allowed" : "pointer",
              fontSize: "0.75rem",
              fontWeight: "600",
              opacity: safePage >= totalPages ? 0.5 : 1
            }}
          >
            Next ›
          </button>

          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={safePage >= totalPages}
            style={{
              padding: "5px 10px",
              borderRadius: "6px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgElevated,
              color: safePage >= totalPages ? theme.textMuted : theme.textPrimary,
              cursor: safePage >= totalPages ? "not-allowed" : "pointer",
              fontSize: "0.75rem",
              fontWeight: "600",
              opacity: safePage >= totalPages ? 0.5 : 1
            }}
          >
            Last »
          </button>
        </div>
      </div>
    </div>
  );
};
