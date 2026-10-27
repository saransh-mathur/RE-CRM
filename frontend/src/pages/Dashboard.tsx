import React, { useState, useEffect } from "react";
import { Header } from "../components/layout/Header";
import { AdminDashboard } from "../components/dashboards/AdminDashboard";
import { ExecutiveDashboard } from "../components/dashboards/ExecutiveDashboard";
import { LeadItem } from "../components/leads/LeadTable";
import { PropertyItem } from "../components/properties/PropertyList";
import { ExportApprovalModal } from "../components/dlp/ExportApprovalModal";
import { DynamicCanvasWatermark } from "../components/dlp/DynamicCanvasWatermark";
import { AntiCopyContainer } from "../components/dlp/AntiCopyContainer";
import { AntiScreenCaptureGuard } from "../components/dlp/AntiScreenCaptureGuard";
import { LoginPage } from "../components/auth/LoginPage";
import { ProfileModal } from "../components/auth/ProfileModal";
import { themes, ThemeMode } from "../lib/theme";
import { mockStore } from "../lib/mockApi";
import { getInitialMockLeads, MOCK_PROPERTIES } from "../lib/mockData";

export const Dashboard: React.FC = () => {
  const backendUrl = "http://localhost:8000";

  // Liquid Glass Theme State (defaults to Liquid Glass Light, toggleable to Liquid Glass Dark)
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const theme = themes[themeMode];

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [token, setToken] = useState<string>("mock_jwt_token_OWNER-01");
  const [user, setUser] = useState<{
    id: string;
    fullName: string;
    employeeCode: string;
    role: string;
    isPunchedIn: boolean;
    mfaEnabled?: boolean;
  }>({
    id: "usr-owner-01",
    fullName: "Vikramaditya Singhania",
    employeeCode: "OWNER-01",
    role: "OWNER",
    isPunchedIn: true,
    mfaEnabled: true
  });

  const [leads, setLeads] = useState<LeadItem[]>(() => {
    return mockStore.leads && mockStore.leads.length > 0 ? mockStore.leads : getInitialMockLeads();
  });
  const [properties, setProperties] = useState<PropertyItem[]>(() => {
    return mockStore.properties && mockStore.properties.length > 0 ? mockStore.properties : [...MOCK_PROPERTIES];
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [callNotification, setCallNotification] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch leads and properties
  const fetchAllData = async () => {
    try {
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const leadResp = await fetch(`${backendUrl}/api/v1/leads`, { headers });
      if (leadResp.ok) {
        const leadData = await leadResp.json();
        if (Array.isArray(leadData) && leadData.length > 0) {
          setLeads(leadData);
        } else {
          // If empty, restore initial demonstration leads
          mockStore.resetToDefaults();
          const retryResp = await fetch(`${backendUrl}/api/v1/leads`);
          if (retryResp.ok) setLeads(await retryResp.json());
        }
      }

      const propResp = await fetch(`${backendUrl}/api/v1/properties`);
      if (propResp.ok) {
        const propData = await propResp.json();
        if (Array.isArray(propData) && propData.length > 0) {
          setProperties(propData);
        }
      }
    } catch (err) {
      console.error("Data refresh failed:", err);
    }
  };

  // Authenticate user session
  const authenticateUser = async (email = "owner@apexrealty.com", password = "OwnerPass2026!") => {
    try {
      const resp = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          device_type: email.includes("ananya") || email.includes("vikram") ? "MOBILE_APP" : "LAPTOP"
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        const activeToken = data.access_token || `mock_jwt_token_${data.employee_code}`;
        setToken(activeToken);
        setUser({
          id: data.user_id,
          fullName: data.full_name,
          employeeCode: data.employee_code,
          role: data.role,
          isPunchedIn: data.is_punched_in ?? true,
          mfaEnabled: data.mfa_enabled
        });
        setIsAuthenticated(true);
        fetchAllData();
        const isOwnerPortal = data.role === "OWNER" || data.role === "ADMIN" || data.role === "MANAGER";
        setToastMessage(`Switched to ${isOwnerPortal ? "👑 Owner Command Center" : "💼 Executive Portal"} as ${data.full_name}.`);
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error("Authentication failed:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
    authenticateUser();
    const interval = setInterval(fetchAllData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (newToken: string, loggedInUser: any) => {
    setToken(newToken);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    fetchAllData();
    setToastMessage(`Authenticated as ${loggedInUser.fullName} (${loggedInUser.role}) with MFA verification.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleLogout = () => {
    setToken("");
    setIsAuthenticated(false);
    setToastMessage("Signed out of session. Session terminated.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Click-to-Call handler
  const handleCallLead = async (lead: LeadItem) => {
    try {
      const resp = await fetch(`${backendUrl}/api/v1/leads/${lead.id}/call`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setCallNotification(`📞 ${data.message} (Bridge ID: ${data.call_bridge_id})`);
        fetchAllData();
        setTimeout(() => setCallNotification(null), 6000);
      }
    } catch (err) {
      alert("Failed to initiate masked call bridge.");
    }
  };

  // Simulate incoming Meta lead
  const handleSimulateMetaLead = async () => {
    try {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const resp = await fetch(`${backendUrl}/api/v1/webhooks/meta/simulate-test-lead?leadgen_id=leadgen_${randomId}`, {
        method: "POST"
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.lead) {
          setLeads((prev) => [data.lead, ...prev]);
        }
        setToastMessage(`⚡ Meta Lead Ingested via Webhook for ${data.lead?.full_name || "New Prospect"}! Auto-assigned to ready executive.`);
        fetchAllData();
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      alert("Simulation failed.");
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: string, notes: string) => {
    try {
      await fetch(`${backendUrl}/api/v1/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, notes })
      });
      fetchAllData();
    } catch (err) {}
  };

  const handleResetData = () => {
    mockStore.resetToDefaults();
    fetchAllData();
    setToastMessage("↺ Reset demo data to default showcase catalog.");
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (!isAuthenticated) {
    return (
      <LoginPage
        theme={theme}
        themeMode={themeMode}
        onLoginSuccess={handleLoginSuccess}
        backendUrl={backendUrl}
      />
    );
  }

  const isOwner = user.role === "OWNER" || user.role === "ADMIN" || user.role === "MANAGER";

  return (
    <AntiScreenCaptureGuard
      theme={theme}
      employeeCode={user.employeeCode}
      agentName={user.fullName}
      backendUrl={backendUrl}
      token={token}
    >
      <AntiCopyContainer backendUrl={backendUrl} employeeCode={user.employeeCode}>
        {/* 20% Visible Liquid Glass Watermark */}
        <DynamicCanvasWatermark
          agentName={user.fullName}
          employeeCode={user.employeeCode}
          themeMode={themeMode}
          backendUrl={backendUrl}
        />

        <div style={{
          minHeight: "100vh",
          background: theme.bg,
          color: theme.textPrimary,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          transition: "background 0.3s ease, color 0.3s ease"
        }}>
          {/* Navigation & Header */}
          <Header
            userName={user.fullName}
            employeeCode={user.employeeCode}
            role={user.role}
            isPunchedIn={user.isPunchedIn}
            token={token}
            themeMode={themeMode}
            theme={theme}
            onToggleTheme={handleToggleTheme}
            onPersonaChange={authenticateUser}
            onPunchStatusChange={(punched) => setUser((prev) => ({ ...prev, isPunchedIn: punched }))}
            onRequestExport={() => setIsExportModalOpen(true)}
            onSimulateMetaLead={handleSimulateMetaLead}
            onResetDemoData={handleResetData}
            onOpenProfile={() => setIsProfileOpen(true)}
            onLogout={handleLogout}
            backendUrl={backendUrl}
          />

        {/* Floating Toast Notification (Frosted Crystal Pill) */}
        {toastMessage && (
          <div style={{
            margin: "14px 24px 0 24px",
            padding: "12px 20px",
            backgroundColor: theme.cardBgElevated,
            backdropFilter: theme.glassBackdrop,
            WebkitBackdropFilter: theme.glassBackdrop,
            border: `1px solid ${theme.border}`,
            color: theme.textPrimary,
            borderRadius: "14px",
            fontWeight: "700",
            fontSize: "0.84rem",
            boxShadow: theme.glassShadowGlow,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
          }}>
            {toastMessage}
          </div>
        )}

        {callNotification && (
          <div style={{
            margin: "14px 24px 0 24px",
            padding: "12px 20px",
            backgroundColor: theme.cardBgElevated,
            backdropFilter: theme.glassBackdrop,
            WebkitBackdropFilter: theme.glassBackdrop,
            border: `1px solid ${theme.border}`,
            color: theme.textPrimary,
            borderRadius: "14px",
            fontWeight: "700",
            fontSize: "0.84rem",
            boxShadow: theme.glassShadowGlow,
            display: "inline-flex",
            alignItems: "center",
            gap: "8px"
          }}>
            {callNotification}
          </div>
        )}

        {/* Main Workspace: Conditionally Renders Owner Dashboard vs Executive Dashboard */}
        <main style={{ padding: "clamp(12px, 2.5vw, 24px)" }}>
          {isOwner ? (
            <AdminDashboard
              user={user}
              leads={leads}
              properties={properties}
              token={token}
              theme={theme}
              onCallLead={handleCallLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onSimulateMetaLead={handleSimulateMetaLead}
              backendUrl={backendUrl}
            />
          ) : (
            <ExecutiveDashboard
              user={user}
              leads={leads}
              properties={properties}
              token={token}
              theme={theme}
              onCallLead={handleCallLead}
              onUpdateLeadStatus={handleUpdateLeadStatus}
              backendUrl={backendUrl}
            />
          )}
        </main>

        {/* Four-Eyes Export Request Modal */}
        <ExportApprovalModal
          isOpen={isExportModalOpen}
          theme={theme}
          onClose={() => setIsExportModalOpen(false)}
          token={token}
          totalLeadsCount={leads.length}
          backendUrl={backendUrl}
        />

        {/* Security Profile & MFA Modal */}
        {isProfileOpen && (
          <ProfileModal
            user={user}
            theme={theme}
            onClose={() => setIsProfileOpen(false)}
            onMfaStatusChange={(enabled) => setUser((prev) => ({ ...prev, mfaEnabled: enabled }))}
            backendUrl={backendUrl}
            token={token}
          />
        )}
      </div>
    </AntiCopyContainer>
  </AntiScreenCaptureGuard>
  );
};
export default Dashboard;
