import React, { useMemo, useState } from "react";
import { ThemeColors } from "../../lib/theme";
import { LeadItem } from "../leads/LeadTable";
import { CallLogRecord, MinuteActivityRecord } from "../../lib/mockData";
import {
  AdChannel,
  computeAdChannelStats,
  computeCallDetails,
  computeDailyLeadTrend,
  computeLeadAnalytics,
  computeLeadSummary,
  LeadDisposition,
  LeadSummaryFilterKey
} from "../../lib/leadAnalytics";

interface LeadAnalyticsPanelProps {
  leads: LeadItem[];
  callLogs: CallLogRecord[];
  activities?: MinuteActivityRecord[];
  currentUserName: string;
  theme: ThemeColors;
  onSelectDisposition: (disposition: LeadDisposition) => void;
  onSelectSummaryCard: (summaryKey: LeadSummaryFilterKey) => void;
  onSelectChannel?: (channel: AdChannel) => void;
  onOpenAllLeads: () => void;
  onOpenCallHistory?: () => void;
  onOpenAgentActivity?: () => void;
  onOpenAdSources?: () => void;
}

function formatShortTime(iso: string): string {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "";
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export const LeadAnalyticsPanel: React.FC<LeadAnalyticsPanelProps> = ({
  leads,
  callLogs,
  activities = [],
  currentUserName,
  theme,
  onSelectDisposition,
  onSelectSummaryCard,
  onSelectChannel,
  onOpenAllLeads,
  onOpenCallHistory,
  onOpenAgentActivity,
  onOpenAdSources
}) => {
  const [hoveredSlice, setHoveredSlice] = useState<LeadDisposition | null>(null);
  const [graphMode, setGraphMode] = useState<"channels" | "daily">("channels");

  const analytics = useMemo(() => computeLeadAnalytics(leads, 106, 106, 92), [leads]);
  const summaryCards = useMemo(
    () => computeLeadSummary(leads, currentUserName),
    [leads, currentUserName]
  );
  const callDetails = useMemo(() => computeCallDetails(callLogs), [callLogs]);
  const channelStats = useMemo(() => computeAdChannelStats(leads), [leads]);
  const dailyTrend = useMemo(() => computeDailyLeadTrend(leads, 7), [leads]);
  const maxDayTotal = Math.max(1, ...dailyTrend.map((d) => d.total));

  const activeHoverMeta = hoveredSlice
    ? analytics.slices.find((s) => s.key === hoveredSlice) || null
    : null;

  const recentActivities = useMemo(() => activities.slice(0, 5), [activities]);

  const callCards = [
    { key: "today", label: "Today", count: callDetails.today },
    { key: "yesterday", label: "Yesterday", count: callDetails.yesterday },
    { key: "weekly", label: "This Week", count: callDetails.weekly },
    { key: "all", label: "All Calls", count: callDetails.all }
  ];

  const cardSurface: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "16px",
    padding: "22px 24px"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* ROW 1: Side-by-Side Visual Charts — Lead Status Pie Chart + Ad Leads Graph */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 440px), 1fr))",
          gap: "20px",
          alignItems: "stretch"
        }}
      >
        {/* CHART 1: LEAD STATUS PIE CHART + LEGEND */}
        <section
          aria-label="Lead Analytics"
          style={{ ...cardSurface, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "18px",
              gap: "12px",
              flexWrap: "wrap"
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "1.08rem",
                  fontWeight: 700,
                  color: theme.textPrimary,
                  margin: 0
                }}
              >
                Lead Status Breakdown
              </h3>
              <p style={{ fontSize: "0.82rem", color: theme.textMuted, margin: "3px 0 0 0" }}>
                Click any slice or status to view those leads
              </p>
            </div>
            <span className="tabular-nums" style={{ fontSize: "0.82rem", fontWeight: 600, color: theme.textSecondary }}>
              {analytics.total} leads
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: "20px"
            }}
          >
            {/* Interactive SVG Pie Chart */}
            <div style={{ position: "relative", width: "212px", height: "212px", flexShrink: 0 }}>
              <svg
                viewBox="0 0 212 212"
                width="212"
                height="212"
                role="img"
                aria-label="Lead disposition distribution pie chart"
                style={{ display: "block", overflow: "visible" }}
              >
                {analytics.total === 0 ? (
                  <circle
                    cx="106"
                    cy="106"
                    r="92"
                    fill={theme.cardBgSecondary}
                    stroke={theme.border}
                    strokeWidth="2"
                  />
                ) : (
                  analytics.slices.map((slice) => {
                    if (!slice.pathData) return null;
                    const isHovered = hoveredSlice === slice.key;
                    return (
                      <path
                        key={slice.key}
                        d={slice.pathData}
                        fill={slice.color}
                        stroke={theme.isDark ? "#051912" : "#ffffff"}
                        strokeWidth={isHovered ? "2.5" : "1.2"}
                        style={{
                          cursor: "pointer",
                          transition: "transform 0.18s ease, opacity 0.18s ease",
                          transformOrigin: "106px 106px",
                          transform: isHovered ? "scale(1.035)" : "scale(1)",
                          opacity: hoveredSlice && !isHovered ? 0.65 : 1
                        }}
                        onMouseEnter={() => setHoveredSlice(slice.key)}
                        onMouseLeave={() => setHoveredSlice(null)}
                        onClick={() => onSelectDisposition(slice.key)}
                      >
                        <title>{`${slice.label}: ${slice.count} (${slice.percentage}%)`}</title>
                      </path>
                    );
                  })
                )}
              </svg>

              {activeHoverMeta && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    bottom: "-10px",
                    transform: "translateX(-50%)",
                    backgroundColor: theme.cardBgElevated,
                    border: `1px solid ${theme.border}`,
                    boxShadow: theme.glassShadow,
                    borderRadius: "8px",
                    padding: "5px 10px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: theme.textPrimary,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                    zIndex: 5
                  }}
                >
                  {activeHoverMeta.label}: {activeHoverMeta.count} ({activeHoverMeta.percentage}%)
                </div>
              )}
            </div>

            {/* Clean Interactive 10-Status Legend */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                minWidth: "195px",
                flex: "1 1 195px"
              }}
            >
              {analytics.slices.map((slice) => {
                const isHovered = hoveredSlice === slice.key;
                return (
                  <button
                    key={slice.key}
                    type="button"
                    onMouseEnter={() => setHoveredSlice(slice.key)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={() => onSelectDisposition(slice.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "4px 8px",
                      borderRadius: "8px",
                      border: "none",
                      backgroundColor: isHovered ? theme.cardBgSecondary : "transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background-color 0.14s ease"
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: "11px",
                        height: "11px",
                        borderRadius: "50%",
                        backgroundColor: slice.color,
                        flexShrink: 0
                      }}
                    />
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        color: theme.textPrimary,
                        minWidth: "22px"
                      }}
                    >
                      {slice.count}
                    </span>
                    <span
                      style={{
                        fontSize: "0.84rem",
                        fontWeight: isHovered ? 700 : 500,
                        color: isHovered ? theme.textPrimary : theme.textSecondary,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {slice.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* CHART 2: AD LEADS GRAPH (Meta, WhatsApp, Instagram, LinkedIn, Google, Website + 7-Day Trend) */}
        <section
          aria-label="Advertisement Leads Graph"
          style={{ ...cardSurface, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "16px" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px"
            }}
          >
            <div>
              <h3 style={{ fontSize: "1.08rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                Ad Leads Graph
              </h3>
              <p style={{ fontSize: "0.82rem", color: theme.textMuted, margin: "3px 0 0 0" }}>
                {graphMode === "channels"
                  ? "Meta, WhatsApp, Instagram, LinkedIn, Google & Website"
                  : "New leads arriving each day over the last 7 days"}
              </p>
            </div>

            {/* Simple 2-Option Graph Toggle */}
            <div
              style={{
                display: "inline-flex",
                padding: "3px",
                borderRadius: "9px",
                backgroundColor: theme.cardBgSecondary,
                border: `1px solid ${theme.border}`,
                gap: "2px"
              }}
            >
              <button
                type="button"
                onClick={() => setGraphMode("channels")}
                style={{
                  padding: "5px 11px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: graphMode === "channels" ? theme.cardBgElevated : "transparent",
                  color: graphMode === "channels" ? theme.textPrimary : theme.textMuted,
                  fontSize: "0.78rem",
                  fontWeight: graphMode === "channels" ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                By Platform
              </button>
              <button
                type="button"
                onClick={() => setGraphMode("daily")}
                style={{
                  padding: "5px 11px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: graphMode === "daily" ? theme.cardBgElevated : "transparent",
                  color: graphMode === "daily" ? theme.textPrimary : theme.textMuted,
                  fontSize: "0.78rem",
                  fontWeight: graphMode === "daily" ? 700 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                Last 7 Days
              </button>
            </div>
          </div>

          {graphMode === "channels" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
              {channelStats.map((ch) => (
                <button
                  key={ch.key}
                  type="button"
                  onClick={() => (onSelectChannel ? onSelectChannel(ch.key) : onOpenAllLeads())}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "2px 0",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                    width: "100%"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
                    <span style={{ fontSize: "0.86rem", fontWeight: 600, color: theme.textPrimary }}>
                      {ch.label}
                    </span>
                    <span className="tabular-nums" style={{ fontSize: "0.82rem", color: theme.textSecondary }}>
                      <strong style={{ color: theme.textPrimary }}>{ch.total}</strong> ({ch.percentage}%)
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "9px",
                      borderRadius: "999px",
                      backgroundColor: theme.cardBgSecondary,
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        width: `${ch.barWidthPct}%`,
                        height: "100%",
                        borderRadius: "999px",
                        backgroundColor: ch.color,
                        transition: "width 0.25s ease"
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "flex-end" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${dailyTrend.length}, minmax(0, 1fr))`,
                  gap: "10px",
                  alignItems: "end",
                  height: "175px",
                  paddingTop: "12px",
                  borderBottom: `1px solid ${theme.border}`
                }}
              >
                {dailyTrend.map((day) => {
                  const heightPct = day.total > 0 ? Math.max(14, Math.round((day.total / maxDayTotal) * 100)) : 5;
                  const isToday = day.dayLabel === "Today";
                  return (
                    <div
                      key={day.dateKey}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        height: "100%",
                        gap: "6px"
                      }}
                    >
                      <span
                        className="tabular-nums"
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          color: day.total > 0 ? theme.textPrimary : theme.textMuted
                        }}
                      >
                        {day.total}
                      </span>
                      <div
                        style={{
                          width: "100%",
                          maxWidth: "36px",
                          height: `${heightPct}%`,
                          borderRadius: "7px 7px 2px 2px",
                          backgroundColor: isToday
                            ? theme.goldAccent
                            : day.total > 0
                            ? theme.isDark
                              ? "#2E7D64"
                              : "#0D4A38"
                            : theme.cardBgSecondary
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${dailyTrend.length}, minmax(0, 1fr))`,
                  gap: "10px",
                  paddingTop: "8px"
                }}
              >
                {dailyTrend.map((day) => (
                  <div
                    key={day.dateKey}
                    style={{
                      textAlign: "center",
                      fontSize: "0.76rem",
                      fontWeight: day.dayLabel === "Today" ? 700 : 500,
                      color: day.dayLabel === "Today" ? theme.textPrimary : theme.textMuted
                    }}
                  >
                    {day.dayLabel}
                  </div>
                ))}
              </div>
            </div>
          )}

          {onOpenAdSources && (
            <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "4px" }}>
              <button
                type="button"
                onClick={onOpenAdSources}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: theme.goldAccent,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Open Full Ad Sources →
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ROW 2: Lead Summary + Call Details (Left) & Latest Agent Activity (Right) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
          gap: "20px",
          alignItems: "start"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* LEAD SUMMARY (7 Clean Clickable Numbers) */}
          <section aria-label="Lead Summary" style={cardSurface}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "1.08rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                Lead Summary
              </h3>
              <button
                type="button"
                onClick={onOpenAllLeads}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: theme.goldAccent,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                View All Leads →
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(128px, 1fr))",
                gap: "10px"
              }}
            >
              {summaryCards.map((card) => (
                <button
                  key={card.key}
                  type="button"
                  onClick={() => onSelectSummaryCard(card.key)}
                  style={{
                    backgroundColor: theme.cardBgSecondary,
                    border: `1px solid ${theme.borderSubtle}`,
                    borderRadius: "12px",
                    padding: "14px 12px",
                    textAlign: "left",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                    transition: "border-color 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.goldAccent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.borderSubtle;
                  }}
                >
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: "1.65rem",
                      fontWeight: 800,
                      lineHeight: 1.05,
                      color: theme.isDark ? card.accentColorDark : card.accentColor
                    }}
                  >
                    {card.count}
                  </span>
                  <span style={{ fontSize: "0.78rem", fontWeight: 600, color: theme.textSecondary, lineHeight: 1.25 }}>
                    {card.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* CALL DETAILS (2x2 Grid) */}
          <section aria-label="Call Details" style={cardSurface}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px" }}>
              <h3 style={{ fontSize: "1.08rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                Call Details
              </h3>
              <span style={{ fontSize: "0.78rem", color: theme.textMuted }}>
                All calls recorded automatically
              </span>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "10px"
              }}
            >
              {callCards.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => (onOpenCallHistory ? onOpenCallHistory() : onOpenAllLeads())}
                  style={{
                    backgroundColor: theme.cardBgSecondary,
                    border: `1px solid ${theme.borderSubtle}`,
                    borderRadius: "12px",
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "border-color 0.15s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.goldAccent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.borderSubtle;
                  }}
                >
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: theme.textPrimary }}>
                    {item.label}
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontSize: "1.38rem",
                      fontWeight: 800,
                      color: theme.isDark ? "#60A5FA" : "#2563EB"
                    }}
                  >
                    {item.count}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* RECENT AGENT ACTIVITY PREVIEW (Plain English) */}
        <section aria-label="Recent Agent Activity" style={cardSurface}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "14px",
              gap: "8px",
              flexWrap: "wrap"
            }}
          >
            <div>
              <h3 style={{ fontSize: "1.08rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
                Recent Agent Activity
              </h3>
              <p style={{ fontSize: "0.8rem", color: theme.textMuted, margin: "3px 0 0 0" }}>
                Latest calls, lead updates, site visits, and alerts
              </p>
            </div>
            {onOpenAgentActivity && (
              <button
                type="button"
                onClick={onOpenAgentActivity}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: theme.goldAccent,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                See All Activity →
              </button>
            )}
          </div>

          {recentActivities.length === 0 ? (
            <div style={{ padding: "24px 0", textAlign: "center", color: theme.textMuted, fontSize: "0.86rem" }}>
              Agent activity will appear here as your team calls and updates leads.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {recentActivities.map((act, idx) => {
                const isAlert = act.severity === "CRITICAL" || act.severity === "WARNING";
                return (
                  <div
                    key={act.id}
                    style={{
                      padding: "12px 0",
                      borderTop: idx > 0 ? `1px solid ${theme.borderSubtle}` : "none",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px"
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: "0.78rem", color: theme.textMuted }}>
                        <strong style={{ color: theme.textPrimary }}>{act.agent_name}</strong>
                        {isAlert && (
                          <span style={{ color: theme.danger, fontWeight: 700 }}> · Needs Attention</span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.88rem", fontWeight: 700, color: theme.textPrimary, marginTop: "3px" }}>
                        {act.title}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: theme.textSecondary, marginTop: "2px", lineHeight: 1.4 }}>
                        {act.description}
                      </div>
                    </div>
                    <span
                      className="tabular-nums"
                      style={{ fontSize: "0.75rem", color: theme.textMuted, whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      {formatShortTime(act.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
