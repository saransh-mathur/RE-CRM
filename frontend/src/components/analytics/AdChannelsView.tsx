import React, { useMemo } from "react";
import { ThemeColors } from "../../lib/theme";
import { LeadItem } from "../leads/LeadTable";
import {
  AdChannel,
  computeAdChannelStats,
  computeDailyLeadTrend
} from "../../lib/leadAnalytics";

interface AdChannelsViewProps {
  leads: LeadItem[];
  theme: ThemeColors;
  onSelectChannel: (channel: AdChannel) => void;
  onSimulateAdLead: (channel: AdChannel) => void;
}

export const AdChannelsView: React.FC<AdChannelsViewProps> = ({
  leads,
  theme,
  onSelectChannel,
  onSimulateAdLead
}) => {
  const channelStats = useMemo(() => computeAdChannelStats(leads), [leads]);
  const dailyTrend = useMemo(() => computeDailyLeadTrend(leads, 7), [leads]);
  const maxDayTotal = Math.max(1, ...dailyTrend.map((d) => d.total));

  const cardSurface: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    border: `1px solid ${theme.border}`,
    borderRadius: "16px",
    padding: "22px 24px"
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Concise Intro Row */}
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
          See every lead arriving from Meta, WhatsApp, Instagram, LinkedIn, Google Ads, and your website.
        </p>

        <button
          type="button"
          onClick={() => onSimulateAdLead("WHATSAPP")}
          style={{
            padding: "9px 18px",
            borderRadius: "10px",
            border: "none",
            background: theme.primaryBtnBg,
            color: theme.primaryBtnText,
            fontSize: "0.84rem",
            fontWeight: 700,
            cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          + Test WhatsApp Lead
        </button>
      </div>

      {/* Two Side-by-Side Graphs: Channel Breakdown + 7-Day Lead Volume */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
          gap: "20px",
          alignItems: "stretch"
        }}
      >
        {/* Graph 1: Horizontal Bar Graph by Platform */}
        <section aria-label="Leads by ad platform" style={cardSurface}>
          <div style={{ marginBottom: "18px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
              Leads by Platform
            </h3>
            <p style={{ fontSize: "0.82rem", color: theme.textMuted, margin: "4px 0 0 0" }}>
              Click any bar to view leads from that channel
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {channelStats.map((ch) => (
              <button
                key={ch.key}
                type="button"
                onClick={() => onSelectChannel(ch.key)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px 0",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  width: "100%"
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: "12px"
                  }}
                >
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: theme.textPrimary }}>
                    {ch.label}
                  </span>
                  <span
                    className="tabular-nums"
                    style={{ fontSize: "0.84rem", color: theme.textSecondary, fontWeight: 600 }}
                  >
                    <strong style={{ color: theme.textPrimary }}>{ch.total}</strong> leads · {ch.percentage}%
                  </span>
                </div>

                <div
                  style={{
                    width: "100%",
                    height: "10px",
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
        </section>

        {/* Graph 2: 7-Day Daily Lead Graph */}
        <section
          aria-label="7-day ad lead trend"
          style={{ ...cardSurface, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
        >
          <div style={{ marginBottom: "18px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
              Last 7 Days Lead Trend
            </h3>
            <p style={{ fontSize: "0.82rem", color: theme.textMuted, margin: "4px 0 0 0" }}>
              Daily inquiries received across all connected ad channels
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${dailyTrend.length}, minmax(0, 1fr))`,
              gap: "10px",
              alignItems: "end",
              height: "190px",
              paddingTop: "16px",
              borderBottom: `1px solid ${theme.border}`
            }}
          >
            {dailyTrend.map((day) => {
              const heightPct = day.total > 0 ? Math.max(14, Math.round((day.total / maxDayTotal) * 100)) : 4;
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
                    title={`${day.dayLabel}: ${day.total} leads`}
                    style={{
                      width: "100%",
                      maxWidth: "38px",
                      height: `${heightPct}%`,
                      borderRadius: "8px 8px 2px 2px",
                      backgroundColor: isToday
                        ? theme.goldAccent
                        : day.total > 0
                        ? theme.isDark
                          ? "#2E7D64"
                          : "#0D4A38"
                        : theme.cardBgSecondary,
                      transition: "height 0.25s ease"
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
              paddingTop: "10px"
            }}
          >
            {dailyTrend.map((day) => (
              <div
                key={day.dateKey}
                style={{
                  textAlign: "center",
                  fontSize: "0.78rem",
                  fontWeight: day.dayLabel === "Today" ? 700 : 500,
                  color: day.dayLabel === "Today" ? theme.textPrimary : theme.textMuted
                }}
              >
                {day.dayLabel}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Simple Per-Channel Summary Cards with 1-Click Actions */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 320px), 1fr))",
          gap: "16px"
        }}
      >
        {channelStats.map((ch) => (
          <div
            key={ch.key}
            style={{
              ...cardSurface,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span
                  aria-hidden="true"
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: ch.color,
                    flexShrink: 0
                  }}
                />
                <span style={{ fontSize: "1rem", fontWeight: 700, color: theme.textPrimary }}>
                  {ch.label}
                </span>
              </div>
              <span
                className="tabular-nums"
                style={{ fontSize: "1.35rem", fontWeight: 800, color: theme.textPrimary }}
              >
                {ch.total}
              </span>
            </div>

            <div
              className="tabular-nums"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: "8px",
                paddingTop: "12px",
                borderTop: `1px solid ${theme.borderSubtle}`
              }}
            >
              <div>
                <div style={{ fontSize: "0.75rem", color: theme.textMuted }}>Contacted</div>
                <div style={{ fontSize: "0.96rem", fontWeight: 700, color: theme.textPrimary, marginTop: "2px" }}>
                  {ch.contacted}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: theme.textMuted }}>Site Visits</div>
                <div style={{ fontSize: "0.96rem", fontWeight: 700, color: theme.textPrimary, marginTop: "2px" }}>
                  {ch.siteVisits}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: theme.textMuted }}>Booked</div>
                <div style={{ fontSize: "0.96rem", fontWeight: 700, color: theme.success, marginTop: "2px" }}>
                  {ch.closedDeals}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => onSelectChannel(ch.key)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgSecondary,
                  color: theme.textPrimary,
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                View Leads
              </button>
              {ch.key !== "WEBSITE" && (
                <button
                  type="button"
                  onClick={() => onSimulateAdLead(ch.key)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    border: `1px solid ${theme.goldBorder}`,
                    backgroundColor: theme.goldBg,
                    color: theme.goldAccent,
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  + Test Lead
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
