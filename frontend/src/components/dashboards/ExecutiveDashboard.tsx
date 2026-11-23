import React, { useState } from "react";
import { LeadTable, LeadItem } from "../leads/LeadTable";
import { LeadPreviewDrawer } from "../leads/LeadPreviewDrawer";
import { PropertyList, PropertyItem } from "../properties/PropertyList";
import { LeadAnalyticsPanel } from "../analytics/LeadAnalyticsPanel";
import { SettingsView } from "../settings/SettingsView";
import { AppSection } from "../layout/Sidebar";
import { ThemeColors, ThemeMode } from "../../lib/theme";
import { CallLogRecord, MinuteActivityRecord } from "../../lib/mockData";
import { AdChannel, LeadDisposition, LeadSummaryFilterKey } from "../../lib/leadAnalytics";

interface ExecutiveDashboardProps {
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
  backendUrl?: string;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
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
  backendUrl = "http://localhost:8000"
}) => {
  const [drillDisposition, setDrillDisposition] = useState<LeadDisposition | "ALL">("ALL");
  const [drillSummary, setDrillSummary] = useState<LeadSummaryFilterKey | null>(null);
  const [drillChannel, setDrillChannel] = useState<AdChannel | "ALL">("ALL");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const firstName = user.fullName.toLowerCase().split(" ")[0];
  const displayFirstName = user.fullName.split(" ")[0];

  const myLeads = leads.filter(
    (l) => !l.assigned_agent_name || l.assigned_agent_name.toLowerCase().includes(firstName)
  );
  const selectedLead = selectedLeadId ? myLeads.find((l) => l.id === selectedLeadId) || null : null;

  const myCalls = callLogs.filter(
    (c) => c.caller_code === user.employeeCode || c.caller_name.toLowerCase().includes(firstName)
  );

  const myActivities = activities.filter(
    (a) => a.employee_code === user.employeeCode || a.agent_name.toLowerCase().includes(firstName)
  );

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

  const handleOpenMyLeadsClean = () => {
    setDrillDisposition("ALL");
    setDrillSummary(null);
    setDrillChannel("ALL");
    onSelectSection("leads");
  };

  const viewSection =
    activeSection === "leads" || activeSection === "properties" || activeSection === "settings"
      ? activeSection
      : "overview";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {viewSection === "overview" && (
        <div style={{ paddingBottom: "14px", borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: "0.8rem", color: theme.textMuted }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </div>
          <h2 style={{ fontSize: "1.45rem", fontWeight: 700, color: theme.textPrimary, margin: "2px 0 0 0" }}>
            Hello, {displayFirstName}
          </h2>
        </div>
      )}

      {viewSection === "overview" && (
        <LeadAnalyticsPanel
          leads={myLeads}
          callLogs={myCalls}
          activities={myActivities}
          currentUserName={user.fullName}
          theme={theme}
          onSelectDisposition={handleDrillDownDisposition}
          onSelectSummaryCard={handleDrillDownSummary}
          onSelectChannel={handleDrillDownChannel}
          onOpenAllLeads={handleOpenMyLeadsClean}
        />
      )}

      {viewSection === "leads" && (
        <LeadTable
          leads={myLeads}
          callLogs={myCalls}
          theme={theme}
          onSelectLead={(l) => setSelectedLeadId(l.id)}
          onCallLead={onCallLead}
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

      {viewSection === "properties" && (
        <PropertyList properties={properties} theme={theme} />
      )}

      {viewSection === "settings" && (
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

      <LeadPreviewDrawer
        lead={selectedLead}
        theme={theme}
        onClose={() => setSelectedLeadId(null)}
        onUpdateLead={onUpdateLead}
        onCallLead={onCallLead}
        callLogs={myCalls}
        token={token}
        backendUrl={backendUrl}
      />
    </div>
  );
};
