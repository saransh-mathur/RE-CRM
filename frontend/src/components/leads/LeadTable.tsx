import React, { useEffect, useMemo, useState } from "react";
import { ThemeColors } from "../../lib/theme";
import { CallLogRecord } from "../../lib/mockData";
import {
  AD_CHANNEL_META,
  AdChannel,
  DISPOSITION_META,
  getAdChannelMeta,
  getDispositionMeta,
  groupLeadsByDate,
  LeadDisposition,
  LeadSummaryFilterKey,
  matchesSummaryFilter,
  normalizeLeadChannel,
  normalizeLeadDisposition
} from "../../lib/leadAnalytics";

export interface LeadItem {
  id: string;
  lead_code?: string;
  full_name: string;
  phone_masked: string;
  email_masked?: string;
  source: string;
  status: string;
  disposition?: LeadDisposition;
  property_type?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  notes?: string;
  assigned_agent_name?: string;
  created_by_me?: boolean;
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
  callLogs?: CallLogRecord[];
  theme: ThemeColors;
  onSelectLead: (lead: LeadItem) => void;
  onCallLead: (lead: LeadItem) => void;
  onRequestExport?: () => void;
  token: string;
  currentUserName?: string;
  initialDispositionFilter?: LeadDisposition | "ALL";
  initialSummaryFilter?: LeadSummaryFilterKey | null;
  initialChannelFilter?: AdChannel | "ALL";
  onClearExternalFilters?: () => void;
  defaultViewMode?: "table" | "cards";
}

function formatCreatedAt(iso: string): string {
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

function formatCampaignSubtext(source: string, propertyType?: string): string {
  const clean = source.replace(/_/g, " ").toLowerCase();
  if (clean.includes("fb")) return propertyType ? `${propertyType} (FB Form)` : "Facebook Lead Form";
  if (clean.includes("whatsapp")) return propertyType ? `${propertyType} (WhatsApp)` : "WhatsApp Inquiry";
  if (clean.includes("ig") || clean.includes("instagram")) return propertyType ? `${propertyType} (IG Ad)` : "Instagram Ad";
  if (clean.includes("linkedin")) return propertyType ? `${propertyType} (LinkedIn)` : "LinkedIn Form";
  if (clean.includes("google")) return propertyType ? `${propertyType} (Google)` : "Google Search Ad";
  return propertyType || "Direct Inquiry";
}

export const LeadTable: React.FC<LeadTableProps> = ({
  leads,
  callLogs = [],
  theme,
  onSelectLead,
  onCallLead,
  onRequestExport,
  currentUserName,
  initialDispositionFilter = "ALL",
  initialSummaryFilter = null,
  initialChannelFilter = "ALL",
  onClearExternalFilters,
  defaultViewMode = "table"
}) => {
  const [viewMode, setViewMode] = useState<"table" | "cards">(defaultViewMode);
  const [filterDisposition, setFilterDisposition] = useState<LeadDisposition | "ALL">(initialDispositionFilter);
  const [summaryFilter, setSummaryFilter] = useState<LeadSummaryFilterKey | null>(initialSummaryFilter);
  const [filterChannel, setFilterChannel] = useState<AdChannel | "ALL">(initialChannelFilter);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [flaggedOnly, setFlaggedOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  useEffect(() => {
    setFilterDisposition(initialDispositionFilter);
    setCurrentPage(1);
  }, [initialDispositionFilter]);

  useEffect(() => {
    setSummaryFilter(initialSummaryFilter);
    setCurrentPage(1);
  }, [initialSummaryFilter]);

  useEffect(() => {
    setFilterChannel(initialChannelFilter);
    setCurrentPage(1);
  }, [initialChannelFilter]);

  // Quick lookup for latest call duration per lead
  const latestCallDurationByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const call of callLogs) {
      const key = call.lead_name.toLowerCase();
      if (!map.has(key) && call.duration_formatted) {
        map.set(key, call.duration_formatted);
      }
    }
    return map;
  }, [callLogs]);

  // Quick scope counts for the clean top tab strip (All / My Leads / Follow-Up / Site Visit / Call Not Pick / Booked)
  const tabCounts = useMemo(() => {
    return {
      ALL: leads.length,
      MY_CREATED: leads.filter((l) => matchesSummaryFilter(l, "MY_CREATED", currentUserName)).length,
      FOLLOW_UP: leads.filter((l) => matchesSummaryFilter(l, "FOLLOW_UP", currentUserName)).length,
      SITE_VISIT_DONE: leads.filter((l) => matchesSummaryFilter(l, "SITE_VISIT_DONE", currentUserName)).length,
      NOT_YET_CONNECTED: leads.filter((l) => matchesSummaryFilter(l, "NOT_YET_CONNECTED", currentUserName)).length,
      BOOKED: leads.filter((l) => matchesSummaryFilter(l, "BOOKED", currentUserName)).length
    };
  }, [leads, currentUserName]);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (summaryFilter && summaryFilter !== "ALL") {
        if (!matchesSummaryFilter(l, summaryFilter, currentUserName)) return false;
      }
      if (filterChannel !== "ALL") {
        if (normalizeLeadChannel(l.source) !== filterChannel) return false;
      }
      if (filterDisposition !== "ALL") {
        if (normalizeLeadDisposition(l) !== filterDisposition) return false;
      }
      if (
        flaggedOnly &&
        !l.offline_closing_flag &&
        l.poaching_risk_score !== "CRITICAL" &&
        l.poaching_risk_score !== "HIGH" &&
        !l.is_sla_breached
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const ch = getAdChannelMeta(normalizeLeadChannel(l.source));
        const match =
          l.full_name?.toLowerCase().includes(q) ||
          l.lead_code?.toLowerCase().includes(q) ||
          l.phone_masked?.toLowerCase().includes(q) ||
          l.assigned_agent_name?.toLowerCase().includes(q) ||
          l.property_type?.toLowerCase().includes(q) ||
          l.preferred_location?.toLowerCase().includes(q) ||
          ch.label.toLowerCase().includes(q) ||
          l.source?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [leads, summaryFilter, filterChannel, filterDisposition, flaggedOnly, searchQuery, currentUserName]);

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedLeads = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, safePage]);

  const groupedDateLeads = useMemo(() => groupLeadsByDate(paginatedLeads), [paginatedLeads]);

  const hasActiveFilters =
    filterChannel !== "ALL" ||
    filterDisposition !== "ALL" ||
    (summaryFilter !== null && summaryFilter !== "ALL") ||
    flaggedOnly ||
    Boolean(searchQuery.trim());

  const handleResetFilters = () => {
    setFilterChannel("ALL");
    setFilterDisposition("ALL");
    setSummaryFilter(null);
    setFlaggedOnly(false);
    setSearchQuery("");
    setCurrentPage(1);
    if (onClearExternalFilters) onClearExternalFilters();
  };

  const quickTabs: Array<{ key: LeadSummaryFilterKey; label: string; count: number }> = [
    { key: "ALL", label: "All Leads", count: tabCounts.ALL },
    { key: "MY_CREATED", label: "My Leads", count: tabCounts.MY_CREATED },
    { key: "FOLLOW_UP", label: "Follow-Up", count: tabCounts.FOLLOW_UP },
    { key: "SITE_VISIT_DONE", label: "Site Visit Done", count: tabCounts.SITE_VISIT_DONE },
    { key: "NOT_YET_CONNECTED", label: "Call Not Pick", count: tabCounts.NOT_YET_CONNECTED },
    { key: "BOOKED", label: "Booked", count: tabCounts.BOOKED }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Clean Single-Row Quick Status Tabs (Simple version of LeadRat top tabs) */}
      <div
        role="tablist"
        aria-label="Lead view filters"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          borderBottom: `1px solid ${theme.border}`,
          overflowX: "auto",
          paddingBottom: "2px"
        }}
      >
        {quickTabs.map((tab) => {
          const active =
            (tab.key === "ALL" && (!summaryFilter || summaryFilter === "ALL") && filterDisposition === "ALL" && !flaggedOnly) ||
            summaryFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setSummaryFilter(tab.key === "ALL" ? null : tab.key);
                setFilterDisposition("ALL");
                setFlaggedOnly(false);
                setCurrentPage(1);
              }}
              style={{
                background: "none",
                border: "none",
                borderBottom: active ? `2px solid ${theme.accentPrimary}` : "2px solid transparent",
                padding: "9px 12px",
                color: active ? theme.accentPrimary : theme.textSecondary,
                fontSize: "0.84rem",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>{tab.label}</span>
              <span
                className="tabular-nums"
                style={{
                  fontSize: "0.75rem",
                  color: active ? theme.accentPrimary : theme.textMuted,
                  fontWeight: 600
                }}
              >
                ({tab.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Single Clean Toolbar: Search + Ad Source Dropdown + Status Dropdown + Export + View Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px"
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by name, mobile number, source, or agent..."
          aria-label="Search leads"
          style={{
            flex: "1 1 230px",
            minWidth: "min(100%, 210px)",
            padding: "9px 12px",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
            backgroundColor: theme.cardBg,
            color: theme.textPrimary,
            fontSize: "0.84rem",
            outline: "none"
          }}
        />

        <select
          aria-label="Filter by ad source"
          value={filterChannel}
          onChange={(e) => {
            setFilterChannel(e.target.value as AdChannel | "ALL");
            setCurrentPage(1);
          }}
          style={{
            padding: "9px 12px",
            borderRadius: "8px",
            border: `1px solid ${filterChannel !== "ALL" ? theme.accentPrimary : theme.border}`,
            backgroundColor: theme.cardBg,
            color: theme.textPrimary,
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          <option value="ALL">All Ad Sources</option>
          {AD_CHANNEL_META.map((ch) => (
            <option key={ch.key} value={ch.key}>
              {ch.label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by lead status"
          value={filterDisposition}
          onChange={(e) => {
            setFilterDisposition(e.target.value as LeadDisposition | "ALL");
            setSummaryFilter(null);
            setCurrentPage(1);
          }}
          style={{
            padding: "9px 12px",
            borderRadius: "8px",
            border: `1px solid ${filterDisposition !== "ALL" ? theme.accentPrimary : theme.border}`,
            backgroundColor: theme.cardBg,
            color: theme.textPrimary,
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer"
          }}
        >
          <option value="ALL">All Statuses</option>
          {DISPOSITION_META.map((d) => (
            <option key={d.key} value={d.key}>
              {d.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              padding: "8px 11px",
              borderRadius: "8px",
              border: `1px solid ${theme.border}`,
              backgroundColor: theme.cardBgSecondary,
              color: theme.textSecondary,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Reset
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, marginLeft: "auto" }}>
          {onRequestExport && (
            <button
              type="button"
              onClick={onRequestExport}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: theme.primaryBtnBg,
                color: theme.primaryBtnText,
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              Export
            </button>
          )}

          <div
            style={{
              display: "inline-flex",
              padding: "2px",
              borderRadius: "8px",
              backgroundColor: theme.cardBg,
              border: `1px solid ${theme.border}`
            }}
          >
            <button
              type="button"
              onClick={() => setViewMode("table")}
              style={{
                padding: "6px 11px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: viewMode === "table" ? theme.accentBg : "transparent",
                color: viewMode === "table" ? theme.accentPrimary : theme.textMuted,
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Table
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              style={{
                padding: "6px 11px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: viewMode === "cards" ? theme.accentBg : "transparent",
                color: viewMode === "cards" ? theme.accentPrimary : theme.textMuted,
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Cards
            </button>
          </div>
        </div>
      </div>

      {/* BODY: FAMILIAR LEADRAT-STYLE CLEAN TABLE (DEFAULT) OR CARD FEED */}
      {viewMode === "table" ? (
        <div
          style={{
            backgroundColor: theme.cardBg,
            borderRadius: "10px",
            border: `1px solid ${theme.border}`,
            boxShadow: theme.glassShadow,
            overflow: "hidden"
          }}
        >
          <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: "0.84rem"
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: theme.tableHeaderBg,
                    color: theme.tableHeaderText,
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    fontWeight: 700
                  }}
                >
                  <th style={{ padding: "13px 16px" }}>Lead Name</th>
                  <th style={{ padding: "13px 16px" }}>Created</th>
                  <th style={{ padding: "13px 16px" }}>Assigned To</th>
                  <th style={{ padding: "13px 16px" }}>Source &amp; Ad Campaign</th>
                  <th style={{ padding: "13px 16px" }}>Status</th>
                  <th style={{ padding: "13px 16px" }}>Call Duration</th>
                  <th style={{ padding: "13px 16px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: "42px 16px", textAlign: "center", color: theme.textMuted }}>
                      No leads match your current filter.
                    </td>
                  </tr>
                ) : (
                  paginatedLeads.map((lead) => {
                    const channel = getAdChannelMeta(normalizeLeadChannel(lead.source));
                    const disp = getDispositionMeta(normalizeLeadDisposition(lead));
                    const duration = latestCallDurationByName.get(lead.full_name.toLowerCase()) || "—";
                    const hasAlert =
                      lead.offline_closing_flag ||
                      lead.poaching_risk_score === "CRITICAL" ||
                      lead.poaching_risk_score === "HIGH";

                    return (
                      <tr
                        key={lead.id}
                        onClick={() => onSelectLead(lead)}
                        style={{
                          borderBottom: `1px solid ${theme.borderSubtle}`,
                          cursor: "pointer",
                          transition: "background-color 0.12s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = theme.tableRowHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <td style={{ padding: "13px 16px", minWidth: "180px" }}>
                          <div style={{ fontWeight: 700, color: theme.textPrimary, display: "flex", alignItems: "center", flexWrap: "wrap", gap: "4px 6px" }}>
                            <span>{lead.full_name}</span>
                            {hasAlert && (
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  color: theme.danger,
                                  fontWeight: 700,
                                  whiteSpace: "nowrap"
                                }}
                              >
                                · Alert
                              </span>
                            )}
                          </div>
                          <div
                            className="tabular-nums"
                            style={{ fontSize: "0.75rem", color: theme.textMuted, marginTop: "2px" }}
                          >
                            {lead.phone_masked}
                          </div>
                        </td>

                        <td
                          className="tabular-nums"
                          style={{ padding: "13px 16px", color: theme.textSecondary, whiteSpace: "nowrap", fontSize: "0.8rem" }}
                        >
                          {formatCreatedAt(lead.created_at)}
                        </td>

                        <td style={{ padding: "13px 16px", color: theme.textPrimary, fontWeight: 600, whiteSpace: "nowrap" }}>
                          {lead.assigned_agent_name || "Unassigned"}
                        </td>

                        <td style={{ padding: "13px 16px", minWidth: "185px" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontWeight: 600, color: theme.textPrimary }}>
                            <span
                              aria-hidden="true"
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: channel.color,
                                flexShrink: 0
                              }}
                            />
                            <span>{channel.label}</span>
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: theme.textMuted,
                              marginTop: "2px",
                              maxWidth: "220px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {formatCampaignSubtext(lead.source, lead.property_type)}
                          </div>
                        </td>

                        <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              fontSize: "0.82rem",
                              fontWeight: 700,
                              color: theme.isDark ? disp.pillTextDark : disp.color
                            }}
                          >
                            {disp.label}
                          </span>
                        </td>

                        <td
                          className="tabular-nums"
                          style={{ padding: "13px 16px", color: theme.textSecondary, fontWeight: 600, whiteSpace: "nowrap" }}
                        >
                          {duration}
                        </td>

                        <td style={{ padding: "13px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            <button
                              type="button"
                              aria-label={`Call ${lead.full_name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onCallLead(lead);
                              }}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "7px",
                                border: `1px solid ${theme.successBorder}`,
                                backgroundColor: theme.successBg,
                                color: theme.success,
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              Call
                            </button>
                            <button
                              type="button"
                              aria-label={`Preview ${lead.full_name}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectLead(lead);
                              }}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "7px",
                                border: `1px solid ${theme.border}`,
                                backgroundColor: theme.cardBgSecondary,
                                color: theme.textPrimary,
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              Preview
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Simple Pagination Footer */}
          <div
            style={{
              padding: "12px 16px",
              borderTop: `1px solid ${theme.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              fontSize: "0.8rem",
              color: theme.textMuted
            }}
          >
            <span className="tabular-nums">
              Showing {filteredLeads.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filteredLeads.length)} of {filteredLeads.length} leads
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "5px 11px",
                  borderRadius: "7px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgSecondary,
                  color: safePage <= 1 ? theme.textMuted : theme.textPrimary,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: safePage <= 1 ? "not-allowed" : "pointer",
                  opacity: safePage <= 1 ? 0.5 : 1
                }}
              >
                Previous
              </button>
              <span className="tabular-nums" style={{ fontWeight: 600, color: theme.textSecondary }}>
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: "5px 11px",
                  borderRadius: "7px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgSecondary,
                  color: safePage >= totalPages ? theme.textMuted : theme.textPrimary,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                  opacity: safePage >= totalPages ? 0.5 : 1
                }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* CLEAN CARD FEED VIEW (For quick mobile scanning) */
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {groupedDateLeads.length === 0 ? (
            <div
              style={{
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "12px",
                padding: "40px 16px",
                textAlign: "center",
                color: theme.textMuted
              }}
            >
              No leads match your current filter.
            </div>
          ) : (
            groupedDateLeads.map((group) => (
              <div key={group.dateKey}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: theme.textMuted,
                    marginBottom: "8px",
                    display: "flex",
                    justifyContent: "space-between"
                  }}
                >
                  <span>{group.dateLabel}</span>
                  <span className="tabular-nums">{group.leads.length} leads</span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))",
                    gap: "12px"
                  }}
                >
                  {group.leads.map((lead) => {
                    const disp = getDispositionMeta(normalizeLeadDisposition(lead));
                    const channel = getAdChannelMeta(normalizeLeadChannel(lead.source));
                    return (
                      <div
                        key={lead.id}
                        onClick={() => onSelectLead(lead)}
                        style={{
                          backgroundColor: theme.cardBg,
                          border: `1px solid ${theme.border}`,
                          borderRadius: "12px",
                          padding: "14px 16px",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: theme.textPrimary }}>
                              {lead.full_name}
                            </div>
                            <div className="tabular-nums" style={{ fontSize: "0.76rem", color: theme.textMuted, marginTop: "2px" }}>
                              {lead.phone_masked}
                            </div>
                          </div>
                          <span
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              color: theme.isDark ? disp.pillTextDark : disp.color,
                              whiteSpace: "nowrap"
                            }}
                          >
                            {disp.label}
                          </span>
                        </div>

                        <div style={{ height: "1px", backgroundColor: theme.borderSubtle }} />

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: "0.84rem", fontWeight: 600, color: theme.textPrimary }}>
                              {lead.property_type || "Residential Plots"}
                            </div>
                            <div style={{ fontSize: "0.76rem", color: theme.textMuted, marginTop: "3px" }}>
                              {lead.assigned_agent_name || "Unassigned"} · {channel.shortLabel}
                            </div>
                          </div>

                          <button
                            type="button"
                            aria-label={`Call ${lead.full_name}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onCallLead(lead);
                            }}
                            style={{
                              padding: "7px 12px",
                              borderRadius: "8px",
                              border: `1px solid ${theme.successBorder}`,
                              backgroundColor: theme.successBg,
                              color: theme.success,
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Call
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
