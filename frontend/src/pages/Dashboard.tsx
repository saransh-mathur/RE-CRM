import React, { useState, useEffect } from "react";
import { Header } from "../components/layout/Header";
import { AppSection, Sidebar } from "../components/layout/Sidebar";
import { AdminDashboard } from "../components/dashboards/AdminDashboard";
import { ExecutiveDashboard } from "../components/dashboards/ExecutiveDashboard";
import { LeadItem } from "../components/leads/LeadTable";
import { AddLeadModal } from "../components/leads/AddLeadModal";
import { PropertyItem } from "../components/properties/PropertyList";
import { ExportApprovalModal } from "../components/dlp/ExportApprovalModal";
import { DynamicCanvasWatermark } from "../components/dlp/DynamicCanvasWatermark";
import { AntiCopyContainer } from "../components/dlp/AntiCopyContainer";
import { AntiScreenCaptureGuard } from "../components/dlp/AntiScreenCaptureGuard";
import { LoginPage } from "../components/auth/LoginPage";
import { ProfileModal } from "../components/auth/ProfileModal";
import { themes, ThemeMode } from "../lib/theme";
import { apiFetch, mockStore } from "../lib/mockApi";
import {
  CallLogRecord,
  getInitialMockLeads,
  MinuteActivityRecord,
  MOCK_CALL_LOGS,
  MOCK_MINUTE_ACTIVITIES,
  MOCK_PROPERTIES
} from "../lib/mockData";
import { AdChannel, getAdChannelMeta, LeadDisposition } from "../lib/leadAnalytics";

export const Dashboard: React.FC = () => {
  const backendUrl = "http://localhost:8000";

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    try {
      const saved = typeof localStorage !== "undefined" ? localStorage.getItem("aa_crm_theme_mode") : null;
      return saved === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });
  const [activeSection, setActiveSection] = useState<AppSection>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = themes[themeMode];

  const handleToggleTheme = () => {
    setThemeMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        if (typeof localStorage !== "undefined") localStorage.setItem("aa_crm_theme_mode", next);
      } catch {}
      return next;
    });
  };

  // Auth State (hydrated from persisted mockStore.currentUser so refreshes retain active role)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState<boolean>(false);
  const [token, setToken] = useState<string>(() => `mock_jwt_token_${mockStore.currentUser.employee_code}`);
  const [user, setUser] = useState<{
    id: string;
    fullName: string;
    employeeCode: string;
    role: string;
    isPunchedIn: boolean;
    mfaEnabled?: boolean;
  }>(() => ({
    id: mockStore.currentUser.id,
    fullName: mockStore.currentUser.full_name,
    employeeCode: mockStore.currentUser.employee_code,
    role: mockStore.currentUser.role,
    isPunchedIn: mockStore.currentUser.is_punched_in,
    mfaEnabled: mockStore.currentUser.mfa_enabled
  }));

  const [leads, setLeads] = useState<LeadItem[]>(() => {
    return mockStore.leads && mockStore.leads.length > 0 ? mockStore.leads : getInitialMockLeads();
  });
  const [properties, setProperties] = useState<PropertyItem[]>(() => {
    return mockStore.properties && mockStore.properties.length > 0 ? mockStore.properties : [...MOCK_PROPERTIES];
  });
  const [callLogs, setCallLogs] = useState<CallLogRecord[]>(() => {
    return mockStore.callLogs && mockStore.callLogs.length > 0 ? mockStore.callLogs : [...MOCK_CALL_LOGS];
  });
  const [activities, setActivities] = useState<MinuteActivityRecord[]>(() => {
    return mockStore.activities && mockStore.activities.length > 0
      ? mockStore.activities
      : [...MOCK_MINUTE_ACTIVITIES];
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [callNotification, setCallNotification] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchAllData = async () => {
    try {
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const [leadResp, propResp, callResp, actResp] = await Promise.all([
        apiFetch(`${backendUrl}/api/v1/leads`, { headers }),
        apiFetch(`${backendUrl}/api/v1/properties`),
        apiFetch(`${backendUrl}/api/v1/telemetry/call-logs`, { headers }),
        apiFetch(`${backendUrl}/api/v1/telemetry/activities`, { headers })
      ]);

      if (leadResp.ok) {
        const leadData = await leadResp.json();
        if (Array.isArray(leadData) && leadData.length > 0) {
          setLeads(leadData);
        } else {
          mockStore.resetToDefaults();
          const retryResp = await apiFetch(`${backendUrl}/api/v1/leads`);
          if (retryResp.ok) setLeads(await retryResp.json());
        }
      }

      if (propResp.ok) {
        const propData = await propResp.json();
        if (Array.isArray(propData) && propData.length > 0) {
          setProperties(propData);
        }
      }

      if (callResp.ok) {
        const callData = await callResp.json();
        if (Array.isArray(callData)) setCallLogs(callData);
      }

      if (actResp.ok) {
        const actData = await actResp.json();
        if (Array.isArray(actData)) setActivities(actData);
      }
    } catch (err) {
      console.error("Data refresh failed:", err);
    }
  };

  const authenticateUser = async (email = "owner@absoluteassets.in", password = "OwnerPass2026!") => {
    try {
      const resp = await apiFetch(`${backendUrl}/api/v1/auth/login`, {
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
        const isOwnerPortal = data.role === "OWNER" || data.role === "ADMIN" || data.role === "MANAGER";
        if (!isOwnerPortal && (activeSection === "ads" || activeSection === "activity")) {
          setActiveSection("overview");
        }
        fetchAllData();
        showToast(`Now viewing as ${data.full_name} (${isOwnerPortal ? "Owner" : "Sales Agent"}).`);
      }
    } catch (err) {
      console.error("Authentication failed:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (newToken: string, loggedInUser: any) => {
    setToken(newToken);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    fetchAllData();
    showToast(`Signed in as ${loggedInUser.fullName}.`);
  };

  const handleLogout = () => {
    setToken("");
    setIsAuthenticated(false);
    showToast("Signed out.");
  };

  const handleCallLead = async (lead: LeadItem) => {
    try {
      const resp = await apiFetch(`${backendUrl}/api/v1/leads/${lead.id}/call`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.call_log) {
          setCallLogs((prev) => [data.call_log, ...prev]);
        }
        setCallNotification(`Masked call connected to ${lead.full_name} (Ref: ${data.call_bridge_id}).`);
        fetchAllData();
        setTimeout(() => setCallNotification(null), 4500);
      }
    } catch {
      showToast("Could not start call.");
    }
  };

  const handleCreateLead = async (payload: {
    full_name: string;
    phone: string;
    source: string;
    property_type: string;
    preferred_location: string;
    assigned_agent_name: string;
    notes: string;
  }) => {
    const resp = await apiFetch(`${backendUrl}/api/v1/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (resp.ok) {
      const created = await resp.json();
      setLeads((prev) => [created, ...prev]);
      showToast(`Added lead "${created.full_name}" and assigned to ${created.assigned_agent_name}.`);
      fetchAllData();
    }
  };

  const handleSimulateAdLead = async (channel?: AdChannel) => {
    try {
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const channelQuery = channel ? `&channel=${channel}` : "";
      const resp = await apiFetch(
        `${backendUrl}/api/v1/webhooks/meta/simulate-test-lead?leadgen_id=leadgen_${randomId}${channelQuery}`,
        { method: "POST" }
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data.lead) {
          setLeads((prev) => [data.lead, ...prev]);
        }
        const channelLabel = channel ? getAdChannelMeta(channel).label : "Ad";
        showToast(
          `New ${channelLabel} lead received: ${data.lead?.full_name || "New Prospect"} — assigned to ${data.lead?.assigned_agent_name || "an agent"}.`
        );
        fetchAllData();
      }
    } catch {
      showToast("Could not simulate incoming ad lead.");
    }
  };

  const handleUpdateLead = async (
    leadId: string,
    payload: { status?: string; notes?: string; disposition?: LeadDisposition; assigned_agent_name?: string }
  ) => {
    try {
      const resp = await apiFetch(`${backendUrl}/api/v1/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const updated = await resp.json();
        setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      }
      fetchAllData();
    } catch {}
  };

  const handleResetData = () => {
    mockStore.resetToDefaults();
    fetchAllData();
    showToast("Demo data has been reset.");
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
  const firstNameLower = user.fullName.toLowerCase().split(" ")[0];
  const visibleLeadsCount = isOwner
    ? leads.length
    : leads.filter((l) => !l.assigned_agent_name || l.assigned_agent_name.toLowerCase().includes(firstNameLower)).length;

  const alertsCount = leads.filter(
    (l) =>
      l.offline_closing_flag ||
      l.poaching_risk_score === "CRITICAL" ||
      l.poaching_risk_score === "HIGH" ||
      l.is_sla_breached
  ).length;

  return (
    <AntiScreenCaptureGuard
      theme={theme}
      employeeCode={user.employeeCode}
      agentName={user.fullName}
      backendUrl={backendUrl}
      token={token}
    >
      <AntiCopyContainer backendUrl={backendUrl} employeeCode={user.employeeCode}>
        <DynamicCanvasWatermark
          agentName={user.fullName}
          employeeCode={user.employeeCode}
          themeMode={themeMode}
          backendUrl={backendUrl}
        />

        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            background: theme.bg,
            color: theme.textPrimary,
            fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
          }}
        >
          {/* Familiar Dark Left Sidebar (Simplified to 6 clear items) */}
          <Sidebar
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            isOwner={isOwner}
            leadsCount={visibleLeadsCount}
            alertsCount={alertsCount}
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            theme={theme}
          />

          {/* Main Right Workspace Column */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
            <Header
              userName={user.fullName}
              employeeCode={user.employeeCode}
              role={user.role}
              isPunchedIn={user.isPunchedIn}
              token={token}
              themeMode={themeMode}
              theme={theme}
              activeSection={activeSection}
              onOpenMobileMenu={() => setMobileMenuOpen(true)}
              onOpenAddLead={() => setIsAddLeadOpen(true)}
              onToggleTheme={handleToggleTheme}
              onPersonaChange={authenticateUser}
              onPunchStatusChange={(punched) => {
                setUser((prev) => ({ ...prev, isPunchedIn: punched }));
                fetchAllData();
              }}
              onOpenProfile={() => setIsProfileOpen(true)}
              onLogout={handleLogout}
              backendUrl={backendUrl}
            />

            {(toastMessage || callNotification) && (
              <div style={{ padding: "12px clamp(16px, 2vw, 24px) 0 clamp(16px, 2vw, 24px)" }}>
                {toastMessage && (
                  <div
                    role="status"
                    style={{
                      padding: "10px 14px",
                      backgroundColor: theme.cardBg,
                      border: `1px solid ${theme.accentPrimary}`,
                      color: theme.textPrimary,
                      borderRadius: "10px",
                      fontWeight: 600,
                      fontSize: "0.84rem",
                      boxShadow: theme.glassShadow,
                      display: "inline-flex",
                      alignItems: "center"
                    }}
                  >
                    {toastMessage}
                  </div>
                )}
                {callNotification && (
                  <div
                    role="status"
                    style={{
                      padding: "10px 14px",
                      backgroundColor: theme.successBg,
                      border: `1px solid ${theme.successBorder}`,
                      color: theme.success,
                      borderRadius: "10px",
                      fontWeight: 600,
                      fontSize: "0.84rem",
                      display: "inline-flex",
                      alignItems: "center",
                      marginLeft: toastMessage ? "10px" : 0
                    }}
                  >
                    {callNotification}
                  </div>
                )}
              </div>
            )}

            <main style={{ flex: 1, padding: "clamp(16px, 2vw, 28px)", width: "100%" }}>
              {isOwner ? (
                <AdminDashboard
                  user={user}
                  leads={leads}
                  properties={properties}
                  callLogs={callLogs}
                  activities={activities}
                  activeSection={activeSection}
                  onSelectSection={setActiveSection}
                  token={token}
                  theme={theme}
                  themeMode={themeMode}
                  onToggleTheme={handleToggleTheme}
                  onPersonaChange={authenticateUser}
                  onPunchStatusChange={(punched) => {
                    setUser((prev) => ({ ...prev, isPunchedIn: punched }));
                    fetchAllData();
                  }}
                  onRequestExport={() => setIsExportModalOpen(true)}
                  onOpenProfile={() => setIsProfileOpen(true)}
                  onResetDemoData={handleResetData}
                  onLogout={handleLogout}
                  onCallLead={handleCallLead}
                  onUpdateLead={handleUpdateLead}
                  onSimulateAdLead={handleSimulateAdLead}
                  onRefreshData={fetchAllData}
                  backendUrl={backendUrl}
                />
              ) : (
                <ExecutiveDashboard
                  user={user}
                  leads={leads}
                  properties={properties}
                  callLogs={callLogs}
                  activities={activities}
                  activeSection={activeSection}
                  onSelectSection={setActiveSection}
                  token={token}
                  theme={theme}
                  themeMode={themeMode}
                  onToggleTheme={handleToggleTheme}
                  onPersonaChange={authenticateUser}
                  onPunchStatusChange={(punched) => {
                    setUser((prev) => ({ ...prev, isPunchedIn: punched }));
                    fetchAllData();
                  }}
                  onRequestExport={() => setIsExportModalOpen(true)}
                  onOpenProfile={() => setIsProfileOpen(true)}
                  onResetDemoData={handleResetData}
                  onLogout={handleLogout}
                  onCallLead={handleCallLead}
                  onUpdateLead={handleUpdateLead}
                  backendUrl={backendUrl}
                />
              )}
            </main>
          </div>

          <AddLeadModal
            isOpen={isAddLeadOpen}
            onClose={() => setIsAddLeadOpen(false)}
            onCreateLead={handleCreateLead}
            onSimulateAdLead={handleSimulateAdLead}
            theme={theme}
          />

          <ExportApprovalModal
            isOpen={isExportModalOpen}
            theme={theme}
            onClose={() => setIsExportModalOpen(false)}
            token={token}
            totalLeadsCount={leads.length}
            backendUrl={backendUrl}
          />

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
