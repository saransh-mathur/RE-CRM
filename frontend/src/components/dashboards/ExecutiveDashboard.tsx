import React, { useState } from "react";
import { LeadTable, LeadItem } from "../leads/LeadTable";
import { LeadDetailModal } from "../leads/LeadDetailModal";
import { PropertyList, PropertyItem } from "../properties/PropertyList";
import { ThemeColors } from "../../lib/theme";

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
  token: string;
  theme: ThemeColors;
  onCallLead: (lead: LeadItem) => void;
  onUpdateLeadStatus: (leadId: string, status: string, notes: string) => Promise<void>;
  backendUrl?: string;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  user,
  leads,
  properties,
  token,
  theme,
  onCallLead,
  onUpdateLeadStatus,
  backendUrl = "http://localhost:8000"
}) => {
  const [activeTab, setActiveTab] = useState<"leads" | "properties">("leads");
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);

  // Filter: Executives ONLY see leads assigned to them!
  const myLeads = leads.filter(
    (l) => !l.assigned_agent_name || l.assigned_agent_name.toLowerCase().includes(user.fullName.toLowerCase().split(" ")[0])
  );

  const newInquiries = myLeads.filter((l) => l.status === "NEW").length;
  const inNegotiation = myLeads.filter((l) => l.status === "NEGOTIATION").length;
  const wonDeals = myLeads.filter((l) => l.status === "WON").length;

  return (
    <div>
      {/* Executive Quick Stats (Crystal Glass Style) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        {/* Metric 1 */}
        <div style={{
          backgroundColor: theme.cardBg,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: theme.glassBorder,
          boxShadow: theme.glassShadow,
          padding: "20px 22px",
          borderRadius: "18px"
        }}>
          <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            My Active Leads
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: theme.textPrimary, marginTop: "6px", letterSpacing: "-0.02em" }}>
            {myLeads.length}
          </div>
          <div style={{ fontSize: "0.74rem", color: theme.textMuted, marginTop: "4px" }}>
            Directly assigned to {user.fullName}
          </div>
        </div>

        {/* Metric 2 */}
        <div style={{
          backgroundColor: theme.cardBg,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: theme.glassBorder,
          boxShadow: theme.glassShadow,
          padding: "20px 22px",
          borderRadius: "18px"
        }}>
          <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Pending First Contact (SLA)
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: theme.textPrimary, marginTop: "6px", letterSpacing: "-0.02em" }}>
            {newInquiries}
          </div>
          <div style={{ fontSize: "0.74rem", color: theme.textMuted, marginTop: "4px" }}>
            15-minute response target
          </div>
        </div>

        {/* Metric 3 */}
        <div style={{
          backgroundColor: theme.cardBg,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: theme.glassBorder,
          boxShadow: theme.glassShadow,
          padding: "20px 22px",
          borderRadius: "18px"
        }}>
          <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Deals in Negotiation
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: theme.textPrimary, marginTop: "6px", letterSpacing: "-0.02em" }}>
            {inNegotiation}
          </div>
          <div style={{ fontSize: "0.74rem", color: theme.textMuted, marginTop: "4px" }}>
            Active buyer negotiations
          </div>
        </div>

        {/* Metric 4 */}
        <div style={{
          backgroundColor: theme.cardBg,
          backdropFilter: theme.glassBackdrop,
          WebkitBackdropFilter: theme.glassBackdrop,
          border: theme.glassBorder,
          boxShadow: theme.glassShadow,
          padding: "20px 22px",
          borderRadius: "18px"
        }}>
          <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em" }}>
            Closed Won Deals
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: "800", color: theme.textPrimary, marginTop: "6px", letterSpacing: "-0.02em" }}>
            {wonDeals}
          </div>
          <div style={{ fontSize: "0.74rem", color: theme.textMuted, marginTop: "4px" }}>
            Deeds registered & commissioned
          </div>
        </div>
      </div>

      {/* Tabs (Frosted Crystal Glass Segmented Control) */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "20px",
        backgroundColor: theme.cardBgSecondary,
        padding: "6px",
        borderRadius: "14px",
        border: `1px solid ${theme.border}`,
        width: "fit-content"
      }}>
        <button
          onClick={() => setActiveTab("leads")}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            border: activeTab === "leads" ? `1px solid ${theme.border}` : "1px solid transparent",
            backgroundColor: activeTab === "leads" ? theme.cardBgElevated : "transparent",
            color: theme.textPrimary,
            fontWeight: activeTab === "leads" ? "800" : "600",
            fontSize: "0.82rem",
            cursor: "pointer",
            boxShadow: activeTab === "leads" ? theme.glassShadow : "none",
            transition: "all 0.15s ease"
          }}
        >
          📋 My Assigned Leads ({myLeads.length})
        </button>

        <button
          onClick={() => setActiveTab("properties")}
          style={{
            padding: "8px 16px",
            borderRadius: "10px",
            border: activeTab === "properties" ? `1px solid ${theme.border}` : "1px solid transparent",
            backgroundColor: activeTab === "properties" ? theme.cardBgElevated : "transparent",
            color: theme.textPrimary,
            fontWeight: activeTab === "properties" ? "800" : "600",
            fontSize: "0.82rem",
            cursor: "pointer",
            boxShadow: activeTab === "properties" ? theme.glassShadow : "none",
            transition: "all 0.15s ease"
          }}
        >
          🏢 Properties Catalog ({properties.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "leads" && (
        <LeadTable
          leads={myLeads}
          theme={theme}
          onSelectLead={(l) => setSelectedLead(l)}
          onCallLead={onCallLead}
          token={token}
        />
      )}

      {activeTab === "properties" && (
        <PropertyList
          properties={properties}
          theme={theme}
        />
      )}

      {/* Lead Detail Modal */}
      <LeadDetailModal
        lead={selectedLead}
        theme={theme}
        onClose={() => setSelectedLead(null)}
        onUpdateLeadStatus={onUpdateLeadStatus}
        token={token}
        backendUrl={backendUrl}
        onCallLead={onCallLead}
        allLeads={myLeads}
        onNavigateLead={(l) => setSelectedLead(l)}
      />
    </div>
  );
};
