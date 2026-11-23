import React, { useEffect, useState } from "react";
import { LeadTable, LeadItem } from "../leads/LeadTable";
import { LeadPreviewDrawer } from "../leads/LeadPreviewDrawer";
import { PropertyList, PropertyItem } from "../properties/PropertyList";
import { LeadAnalyticsPanel } from "../analytics/LeadAnalyticsPanel";
import { AdChannelsView } from "../analytics/AdChannelsView";
import { AgentActivityHub } from "../telemetry/AgentActivityHub";
import { SettingsView } from "../settings/SettingsView";
import { AppSection } from "../layout/Sidebar";
import { ThemeColors, ThemeMode } from "../../lib/theme";
import { formatIndianCurrency } from "../../lib/formatters";
import { apiFetch, mockStore } from "../../lib/mockApi";
import { CallLogRecord, getInitialMockLeads, MinuteActivityRecord } from "../../lib/mockData";
import {
  AdChannel,
  computeCallDetails,
  LeadDisposition,
  LeadSummaryFilterKey
} from "../../lib/leadAnalytics";

interface AdminDashboardProps {
  user: {
    id: string;
    fullName: string;
    employeeCode: string;
    role: string;
    isPunchedIn: boolean;
  };
  leads: LeadItem[];
  properties: PropertyItem[];
  callLogs: CallLogRecord[];
  activities: MinuteActivityRecord[];
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  token: string;
  theme: ThemeColors;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onPersonaChange: (email: string, password: string) => void;
  onPunchStatusChange: (punched: boolean) => void;
  onRequestExport: () => void;
  onOpenProfile: () => void;
  onResetDemoData: () => void;
  onLogout: () => void;
  onCallLead: (lead: LeadItem) => void;
  onUpdateLead: (
    leadId: string,
    payload: { status?: string; notes?: string; disposition?: LeadDisposition; assigned_agent_name?: string }
  ) => Promise<void>;
  onSimulateAdLead: (channel?: AdChannel) => void;
  onRefreshData: () => void;
  backendUrl?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  leads,
  properties,
  callLogs,
  activities,
  activeSection,
  onSelectSection,
  token,
  theme,
  themeMode,
  onToggleTheme,
  onPersonaChange,
  onPunchStatusChange,
  onRequestExport,
  onOpenProfile,
  onResetDemoData,
  onLogout,
  onCallLead,
  onUpdateLead,
  onSimulateAdLead,
  onRefreshData,
  backendUrl = "http://localhost:8000"
}) => {
  const [drillDisposition, setDrillDisposition] = useState<LeadDisposition | "ALL">("ALL");
  const [drillSummary, setDrillSummary] = useState<LeadSummaryFilterKey | null>(null);
  const [drillChannel, setDrillChannel] = useState<AdChannel | "ALL">("ALL");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [localLeads, setLocalLeads] = useState<LeadItem[]>(() => {
    return leads && leads.length > 0
      ? leads
      : mockStore.leads && mockStore.leads.length > 0
      ? mockStore.leads
      : getInitialMockLeads();
  });

  useEffect(() => {
    if (leads && leads.length > 0) {
      setLocalLeads(leads);
    }
  }, [leads]);

  const selectedLead = selectedLeadId ? localLeads.find((l) => l.id === selectedLeadId) || null : null;

  const firstName = user.fullName.split(" ")[0];
  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  const callStats = computeCallDetails(callLogs);
  const alertsCount = localLeads.filter(
    (l) =>
      l.offline_closing_flag ||
      l.poaching_risk_score === "CRITICAL" ||
      l.poaching_risk_score === "HIGH" ||
      l.is_sla_breached
  ).length;

  const handleDrillDownDisposition = (disposition: LeadDisposition) => {
    setDrillSummary(null);
    setDrillChannel("ALL");
    setDrillDisposition(disposition);
    onSelectSection("leads");
  };

  const handleDrillDownSummary = (summaryKey: LeadSummaryFilterKey) => {
    setDrillDisposition("ALL");
    setDrillChannel("ALL");
    setDrillSummary(summaryKey === "ALL" ? null : summaryKey);
    onSelectSection("leads");
  };

  const handleDrillDownChannel = (channel: AdChannel) => {
    setDrillDisposition("ALL");
    setDrillSummary(null);
    setDrillChannel(channel);
    onSelectSection("leads");
  };

  const handleOpenAllLeadsClean = () => {
    setDrillDisposition("ALL");
    setDrillSummary(null);
    setDrillChannel("ALL");
    onSelectSection("leads");
  };

  const handleConfiscateAndReassign = async (leadId: string, leadName: string, estimatedBrokerage?: number) => {
    try {
      const resp = await apiFetch(`${backendUrl}/api/v1/leads/${leadId}/confiscate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (resp.ok) {
        const updatedLead = await resp.json();
        setLocalLeads((prev) => prev.map((l) => (l.id === leadId ? updatedLead : l)));
        const amtStr = estimatedBrokerage ? ` (${formatIndianCurrency(estimatedBrokerage)} commission protected)` : "";
        setStatusNotice(`Reassigned "${leadName}" to the compliant team queue${amtStr}.`);
        onRefreshData();
      }
    } catch {
      setLocalLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, offline_closing_flag: false, poaching_risk_score: "LOW" } : l))
      );
      setStatusNotice(`Reassigned "${leadName}" to the compliant team queue.`);
    }
    setTimeout(() => setStatusNotice(null), 4500);
  };

  const handleAgentLeadConfiscation = (agentName: string) => {
    setLocalLeads((prev) =>
      prev.map((l) =>
        l.assigned_agent_name === agentName &&
        (l.offline_closing_flag || l.poaching_risk_score === "CRITICAL" || l.poaching_risk_score === "HIGH")
          ? {
              ...l,
              offline_closing_flag: false,
              poaching_risk_score: "LOW",
              assigned_agent_name: "Compliant Queue (Reassigned)"
            }
          : l
      )
    );
    setStatusNotice(`Flagged leads for ${agentName} have been reassigned.`);
    onRefreshData();
    setTimeout(() => setStatusNotice(null), 4500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {statusNotice && (
        <div
          role="status"
          style={{
            padding: "11px 16px",
            borderRadius: "10px",
            backgroundColor: theme.cardBg,
            color: theme.textPrimary,
            fontWeight: 600,
            fontSize: "0.85rem",
            border: `1px solid ${theme.accentPrimary}`
          }}
        >
          {statusNotice}
        </div>
      )}

      {/* Clean Plain-English Dashboard Header Strip */}
      {activeSection === "overview" && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "16px",
            paddingBottom: "16px",
            borderBottom: `1px solid ${theme.border}`
          }}
        >
          <div>
            <div style={{ fontSize: "0.8rem", color: theme.textMuted, fontWeight: 500 }}>
              {todayLabel}
            </div>
            <h2
              style={{
                fontSize: "1.45rem",
                fontWeight: 700,
                color: theme.textPrimary,
                margin: "2px 0 0 0",
                letterSpacing: "-0.02em"
              }}
            >
              Welcome back, {firstName}
            </h2>
          </div>

          <div
            className="tabular-nums"
            style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "22px" }}
          >
            <button
              type="button"
              onClick={handleOpenAllLeadsClean}
              style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}
            >
              <div style={{ fontSize: "0.74rem", color: theme.textMuted }}>Total Leads</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: theme.textPrimary }}>{localLeads.length}</div>
            </button>

            <div style={{ width: "1px", height: "26px", backgroundColor: theme.border }} aria-hidden="true" />

            <button
              type="button"
              onClick={() => onSelectSection("activity")}
              style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}
            >
              <div style={{ fontSize: "0.74rem", color: theme.textMuted }}>Calls Today</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: theme.textPrimary }}>{callStats.today}</div>
            </button>

            <div style={{ width: "1px", height: "26px", backgroundColor: theme.border }} aria-hidden="true" />

            <button
              type="button"
              onClick={() => onSelectSection("activity")}
              style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}
            >
              <div style={{ fontSize: "0.74rem", color: theme.textMuted }}>Active Agents</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: theme.textPrimary }}>4</div>
            </button>

            <div style={{ width: "1px", height: "26px", backgroundColor: theme.border }} aria-hidden="true" />

            <button
              type="button"
              onClick={() => onSelectSection("activity")}
              style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer" }}
            >
              <div style={{ fontSize: "0.74rem", color: theme.textMuted }}>Needs Attention</div>
              <div
                style={{
                  fontSize: "1.3rem",
                  fontWeight: 800,
                  color: alertsCount > 0 ? theme.danger : theme.success
                }}
              >
                {alertsCount}
              </div>
            </button>
          </div>
        </div>
      )}

      {activeSection === "overview" && (
        <LeadAnalyticsPanel
          leads={localLeads}
          callLogs={callLogs}
          activities={activities}
          currentUserName={user.fullName}
          theme={theme}
          onSelectDisposition={handleDrillDownDisposition}
          onSelectSummaryCard={handleDrillDownSummary}
          onSelectChannel={handleDrillDownChannel}
          onOpenAllLeads={handleOpenAllLeadsClean}
          onOpenCallHistory={() => onSelectSection("activity")}
          onOpenAgentActivity={() => onSelectSection("activity")}
          onOpenAdSources={() => onSelectSection("ads")}
        />
      )}

      {activeSection === "leads" && (
        <LeadTable
          leads={localLeads}
          callLogs={callLogs}
          theme={theme}
          onSelectLead={(l) => setSelectedLeadId(l.id)}
          onCallLead={onCallLead}
          onRequestExport={onRequestExport}
          token={token}
          currentUserName={user.fullName}
          initialDispositionFilter={drillDisposition}
          initialSummaryFilter={drillSummary}
          initialChannelFilter={drillChannel}
          onClearExternalFilters={() => {
            setDrillDisposition("ALL");
            setDrillSummary(null);
            setDrillChannel("ALL");
          }}
          defaultViewMode="table"
        />
      )}

      {activeSection === "ads" && (
        <AdChannelsView
          leads={localLeads}
          theme={theme}
          onSelectChannel={handleDrillDownChannel}
          onSimulateAdLead={(ch) => onSimulateAdLead(ch)}
        />
      )}

      {activeSection === "activity" && (
        <AgentActivityHub
          leads={localLeads}
          callLogs={callLogs}
          activities={activities}
          token={token}
          userRole={user.role}
          theme={theme}
          backendUrl={backendUrl}
          onConfiscateLead={handleConfiscateAndReassign}
          onConfiscateAgentLeads={handleAgentLeadConfiscation}
          onRefreshData={onRefreshData}
        />
      )}

      {activeSection === "properties" && (
        <PropertyList properties={properties} theme={theme} />
      )}

      {activeSection === "settings" && (
        <SettingsView
          user={user}
          token={token}
          theme={theme}
          themeMode={themeMode}
          onToggleTheme={onToggleTheme}
          onPersonaChange={onPersonaChange}
          onPunchStatusChange={onPunchStatusChange}
          onRequestExport={onRequestExport}
          onOpenProfile={onOpenProfile}
          onResetDemoData={onResetDemoData}
          onLogout={onLogout}
          backendUrl={backendUrl}
        />
      )}

      {/* Right-Side Slide-Over Lead Preview Drawer (Matching Client's Current CRM Flow) */}
      <LeadPreviewDrawer
        lead={selectedLead}
        theme={theme}
        onClose={() => setSelectedLeadId(null)}
        onUpdateLead={onUpdateLead}
        onCallLead={onCallLead}
        callLogs={callLogs}
        token={token}
        backendUrl={backendUrl}
      />
    </div>
  );
};
