import {
  MOCK_USERS,
  MOCK_PROPERTIES,
  getInitialMockLeads,
  MOCK_AUDIT_LOGS,
  MOCK_EXPORT_REQUESTS,
  MOCK_LOGIN_RECORDS,
  MOCK_CALL_LOGS,
  MOCK_MINUTE_ACTIVITIES,
  MockUser,
  LoginRecord,
  CallLogRecord,
  MinuteActivityRecord
} from "./mockData";
import { LeadItem } from "../components/leads/LeadTable";
import { AgentTelemetryData } from "../components/telemetry/AgentActivityModal";

// In-memory state for demonstration
class MockStore {
  users: Record<string, MockUser> = { ...MOCK_USERS };
  leads: LeadItem[] = [];
  properties = [...MOCK_PROPERTIES];
  logs = [...MOCK_AUDIT_LOGS];
  exportsList = [...MOCK_EXPORT_REQUESTS];
  loginRecords: LoginRecord[] = [...MOCK_LOGIN_RECORDS];
  callLogs: CallLogRecord[] = [...MOCK_CALL_LOGS];
  activities: MinuteActivityRecord[] = [...MOCK_MINUTE_ACTIVITIES];
  currentUser: MockUser = MOCK_USERS["owner@apexrealty.com"];
  isStandalone: boolean = true;
  backendAvailable: boolean = false;

  constructor() {
    this.loadState();
    if (!this.leads || this.leads.length === 0) {
      this.leads = getInitialMockLeads();
    }
    if (!this.properties || this.properties.length === 0) {
      this.properties = [...MOCK_PROPERTIES];
    }
  }

  loadState() {
    try {
      if (typeof localStorage !== "undefined") {
        const savedLeads = localStorage.getItem("apex_crm_mock_leads");
        if (savedLeads) {
          const parsed = JSON.parse(savedLeads);
          this.leads = Array.isArray(parsed) && parsed.length > 0 ? parsed : getInitialMockLeads();
        } else {
          this.leads = getInitialMockLeads();
        }

        const savedExports = localStorage.getItem("apex_crm_mock_exports");
        if (savedExports) {
          const parsed = JSON.parse(savedExports);
          this.exportsList = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...MOCK_EXPORT_REQUESTS];
        } else {
          this.exportsList = [...MOCK_EXPORT_REQUESTS];
        }

        const savedLogs = localStorage.getItem("apex_crm_mock_logs");
        if (savedLogs) {
          const parsed = JSON.parse(savedLogs);
          this.logs = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...MOCK_AUDIT_LOGS];
        } else {
          this.logs = [...MOCK_AUDIT_LOGS];
        }

        const savedLogins = localStorage.getItem("apex_crm_mock_logins");
        if (savedLogins) {
          const parsed = JSON.parse(savedLogins);
          this.loginRecords = (Array.isArray(parsed) && parsed.length > 0 ? parsed : [...MOCK_LOGIN_RECORDS])
            .filter((r: any) => r.user_name !== "Sarah Jenkins" && r.user_name !== "Priya Sharma");
        } else {
          this.loginRecords = [...MOCK_LOGIN_RECORDS];
        }

        const savedCalls = localStorage.getItem("apex_crm_mock_calls");
        if (savedCalls) {
          const parsed = JSON.parse(savedCalls);
          this.callLogs = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...MOCK_CALL_LOGS];
        } else {
          this.callLogs = [...MOCK_CALL_LOGS];
        }

        const savedActivities = localStorage.getItem("apex_crm_mock_activities");
        if (savedActivities) {
          const parsed = JSON.parse(savedActivities);
          this.activities = (Array.isArray(parsed) && parsed.length > 0 ? parsed : [...MOCK_MINUTE_ACTIVITIES])
            .filter((a: any) => a.agent_name !== "Sarah Jenkins" && a.agent_name !== "Priya Sharma");
        } else {
          this.activities = [...MOCK_MINUTE_ACTIVITIES];
        }

        const savedUsers = localStorage.getItem("apex_crm_mock_users");
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers);
          delete parsed["admin@apexrealty.com"];
          delete parsed["manager@apexrealty.com"];
          this.users = { ...MOCK_USERS, ...parsed };
          delete this.users["admin@apexrealty.com"];
          delete this.users["manager@apexrealty.com"];
        } else {
          this.users = { ...MOCK_USERS };
        }
      } else {
        this.leads = getInitialMockLeads();
      }
    } catch (e) {
      this.leads = getInitialMockLeads();
      this.logs = [...MOCK_AUDIT_LOGS];
      this.exportsList = [...MOCK_EXPORT_REQUESTS];
      this.loginRecords = [...MOCK_LOGIN_RECORDS];
      this.callLogs = [...MOCK_CALL_LOGS];
      this.activities = [...MOCK_MINUTE_ACTIVITIES];
      this.users = { ...MOCK_USERS };
    }
  }

  saveState() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("apex_crm_mock_leads", JSON.stringify(this.leads));
        localStorage.setItem("apex_crm_mock_exports", JSON.stringify(this.exportsList));
        localStorage.setItem("apex_crm_mock_logs", JSON.stringify(this.logs));
        localStorage.setItem("apex_crm_mock_logins", JSON.stringify(this.loginRecords));
        localStorage.setItem("apex_crm_mock_calls", JSON.stringify(this.callLogs));
        localStorage.setItem("apex_crm_mock_activities", JSON.stringify(this.activities));
        localStorage.setItem("apex_crm_mock_users", JSON.stringify(this.users));
      }
    } catch (e) {}
  }

  resetToDefaults() {
    this.leads = getInitialMockLeads();
    this.logs = [...MOCK_AUDIT_LOGS];
    this.exportsList = [...MOCK_EXPORT_REQUESTS];
    this.properties = [...MOCK_PROPERTIES];
    this.loginRecords = [...MOCK_LOGIN_RECORDS];
    this.callLogs = [...MOCK_CALL_LOGS];
    this.activities = [...MOCK_MINUTE_ACTIVITIES];
    this.users = { ...MOCK_USERS };
    this.saveState();
  }
}

export const mockStore = new MockStore();

// Helper to create Response object
function mockResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

// Global fetch interceptor
export function initMockInterceptor() {
  const originalFetch = window.fetch;

  // Initial check if backend is alive
  fetch("http://localhost:8000/health", { signal: AbortSignal.timeout(1000) })
    .then((res) => {
      if (res.ok) {
        mockStore.backendAvailable = true;
        // If user hasn't explicitly set standalone, we can connect
        console.log("[Apex CRM] Live backend detected at http://localhost:8000");
      }
    })
    .catch(() => {
      mockStore.backendAvailable = false;
      mockStore.isStandalone = true;
      console.log("[Apex CRM] Standalone Demo Mode Active (Running backend-free with rich dummy dataset)");
    });

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    // Check if this is an API call
    if (!url.includes("/api/v1/")) {
      return originalFetch(input, init);
    }

    // If live backend is available and user didn't force standalone mode, try originalFetch first
    const forceStandalone = (typeof localStorage !== "undefined" && localStorage.getItem("apex_crm_force_standalone") === "true") || !mockStore.backendAvailable;

    if (!forceStandalone) {
      try {
        const response = await originalFetch(input, init);
        return response;
      } catch (networkError) {
        // Backend disconnected or failed -> Fallback smoothly to mock engine!
        console.warn("[Apex CRM] Backend unreachable, falling back to Standalone Mock Engine:", url);
        mockStore.backendAvailable = false;
      }
    }

    // Simulate micro-delay (30ms - 80ms) for realistic UX
    await new Promise((res) => setTimeout(res, 40));

    const method = (init?.method || "GET").toUpperCase();
    const pathname = url.replace(/https?:\/\/[^\/]+/, "").split("?")[0];
    const searchParams = new URL(url, "http://localhost:8000").searchParams;

    // 1. Auth Login: POST /api/v1/auth/login
    if (pathname.endsWith("/auth/login") && method === "POST") {
      let body: any = {};
      try {
        body = init?.body ? JSON.parse(init.body as string) : {};
      } catch (e) {}

      const email = body.email || "owner@apexrealty.com";
      const user = mockStore.users[email] || mockStore.users["owner@apexrealty.com"];
      mockStore.currentUser = user;

      // Extract client device & telemetry info
      const deviceModel = body.device_model || (body.device_type === "MOBILE_APP" ? "Apple iPhone 15 Pro (iOS 18.2)" : "MacBook Pro 16 M3 Max");
      const browser = body.browser || "Chrome 122.0.6";
      const channel: "WEB_APP" | "MOBILE_APP" = body.channel || (body.device_type === "MOBILE_APP" ? "MOBILE_APP" : "WEB_APP");
      const ipAddress = body.ip_address || "103.21.144.1";

      // Check account lockout
      if (user.account_locked) {
        mockStore.loginRecords.unshift({
          id: `log-in-${Date.now()}`,
          user_id: user.id,
          user_name: user.full_name,
          employee_code: user.employee_code,
          role: user.role,
          timestamp: new Date().toISOString(),
          ip_address: ipAddress,
          device_model: deviceModel,
          browser: browser,
          channel: channel,
          status: "ACCOUNT_LOCKED",
          mfa_used: false
        });
        mockStore.saveState();
        return mockResponse({ detail: "Account locked by administrator due to security violations. Please contact the Agency Owner." }, 403);
      }

      // Check if MFA is required
      if (user.mfa_enabled || user.mfa_enforced) {
        return mockResponse({
          mfa_required: true,
          access_token: `mock_jwt_token_${user.employee_code}`,
          user_id: user.id,
          role: user.role,
          full_name: user.full_name,
          employee_code: user.employee_code,
          is_punched_in: user.is_punched_in,
          mfa_enabled: user.mfa_enabled,
          email: user.email,
          temp_token: `mfa_pending_${user.employee_code}_${Date.now()}`
        });
      }

      // Direct login without MFA
      user.login_count_today += 1;
      user.total_logins += 1;
      user.last_login_device = deviceModel;
      user.last_login_browser = browser;
      user.last_login_channel = channel;
      user.last_login_ip = ipAddress;

      mockStore.loginRecords.unshift({
        id: `log-in-${Date.now()}`,
        user_id: user.id,
        user_name: user.full_name,
        employee_code: user.employee_code,
        role: user.role,
        timestamp: new Date().toISOString(),
        ip_address: ipAddress,
        device_model: deviceModel,
        browser: browser,
        channel: channel,
        status: "SUCCESS",
        mfa_used: false
      });
      mockStore.saveState();

      return mockResponse({
        access_token: `mock_jwt_token_${user.employee_code}`,
        token_type: "bearer",
        user_id: user.id,
        role: user.role,
        full_name: user.full_name,
        employee_code: user.employee_code,
        is_punched_in: user.is_punched_in,
        mfa_enabled: user.mfa_enabled
      });
    }

    // 1b. MFA Verification: POST /api/v1/auth/verify-mfa
    if (pathname.endsWith("/auth/verify-mfa") && method === "POST") {
      let body: any = {};
      try {
        body = init?.body ? JSON.parse(init.body as string) : {};
      } catch (e) {}

      const email = body.email || "owner@apexrealty.com";
      const otpCode = body.otp_code || "";
      const user = mockStore.users[email] || mockStore.users["owner@apexrealty.com"];

      const deviceModel = body.device_model || (body.channel === "MOBILE_APP" ? "Apple iPhone 15 Pro (iOS 18.2)" : "MacBook Pro 16 M3 Max");
      const browser = body.browser || "Chrome 122.0.6";
      const channel: "WEB_APP" | "MOBILE_APP" = body.channel || "WEB_APP";
      const ipAddress = body.ip_address || "103.21.144.1";

      // Accept demo OTP "123456" or any 6-digit code
      const isValidOtp = otpCode === "123456" || (otpCode.length === 6 && /^\d+$/.test(otpCode));

      if (!isValidOtp) {
        mockStore.loginRecords.unshift({
          id: `log-in-${Date.now()}`,
          user_id: user.id,
          user_name: user.full_name,
          employee_code: user.employee_code,
          role: user.role,
          timestamp: new Date().toISOString(),
          ip_address: ipAddress,
          device_model: deviceModel,
          browser: browser,
          channel: channel,
          status: "FAILED_MFA",
          mfa_used: true
        });
        mockStore.saveState();
        return mockResponse({ detail: "Invalid MFA verification token. Enter code 123456 for demo authorization." }, 401);
      }

      // Successful MFA Verification
      user.login_count_today += 1;
      user.total_logins += 1;
      user.last_login_device = deviceModel;
      user.last_login_browser = browser;
      user.last_login_channel = channel;
      user.last_login_ip = ipAddress;

      mockStore.loginRecords.unshift({
        id: `log-in-${Date.now()}`,
        user_id: user.id,
        user_name: user.full_name,
        employee_code: user.employee_code,
        role: user.role,
        timestamp: new Date().toISOString(),
        ip_address: ipAddress,
        device_model: deviceModel,
        browser: browser,
        channel: channel,
        status: "SUCCESS",
        mfa_used: true
      });

      mockStore.activities.unshift({
        id: `act-auth-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agent_name: user.full_name,
        employee_code: user.employee_code,
        activity_type: "SECURITY_ALERT",
        title: "MFA Authentication Succeeded",
        description: `Verified login from ${deviceModel} (${ipAddress}) via TOTP Multi-Factor Authentication.`,
        severity: "INFO"
      });

      mockStore.saveState();

      return mockResponse({
        access_token: `mock_jwt_token_${user.employee_code}`,
        token_type: "bearer",
        user_id: user.id,
        role: user.role,
        full_name: user.full_name,
        employee_code: user.employee_code,
        is_punched_in: user.is_punched_in,
        mfa_enabled: user.mfa_enabled
      });
    }

    // 1c. MFA Toggle: POST /api/v1/auth/mfa-toggle
    if (pathname.endsWith("/auth/mfa-toggle") && method === "POST") {
      let body: any = {};
      try {
        body = init?.body ? JSON.parse(init.body as string) : {};
      } catch (e) {}

      const email = body.email || mockStore.currentUser.email;
      const user = mockStore.users[email] || mockStore.currentUser;

      if (user.mfa_enforced && !body.enabled) {
        return mockResponse({ detail: "MFA policy is enforced by company administration and cannot be disabled." }, 403);
      }

      user.mfa_enabled = !!body.enabled;
      mockStore.saveState();

      mockStore.activities.unshift({
        id: `act-mfa-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agent_name: user.full_name,
        employee_code: user.employee_code,
        activity_type: "SECURITY_ALERT",
        title: user.mfa_enabled ? "MFA Enabled on Profile" : "MFA Disabled on Profile",
        description: `User ${user.full_name} (${user.employee_code}) updated Multi-Factor Authentication setting to ${user.mfa_enabled ? "ENABLED" : "DISABLED"}.`,
        severity: user.mfa_enabled ? "INFO" : "WARNING"
      });
      mockStore.saveState();

      return mockResponse({
        success: true,
        mfa_enabled: user.mfa_enabled,
        message: `MFA is now ${user.mfa_enabled ? "enabled" : "disabled"} for your account.`
      });
    }

    // 1d. Owner Forensics: GET /api/v1/telemetry/owner-forensics
    if (pathname.endsWith("/telemetry/owner-forensics") && method === "GET") {
      return mockResponse({
        login_records: mockStore.loginRecords,
        call_logs: mockStore.callLogs,
        activities: mockStore.activities,
        executives: Object.values(mockStore.users)
      });
    }

    // 1e. Executive Security Control: POST /api/v1/telemetry/executive-security
    if (pathname.endsWith("/telemetry/executive-security") && method === "POST") {
      let body: any = {};
      try {
        body = init?.body ? JSON.parse(init.body as string) : {};
      } catch (e) {}

      const { employee_code, action, value } = body;
      const user = Object.values(mockStore.users).find((u) => u.employee_code === employee_code);

      if (!user) {
        return mockResponse({ detail: "Executive not found" }, 404);
      }

      if (action === "TOGGLE_ENFORCE_MFA") {
        user.mfa_enforced = !!value;
        if (user.mfa_enforced) user.mfa_enabled = true;
      } else if (action === "RESET_MFA") {
        user.mfa_enabled = false;
        user.mfa_enforced = false;
      } else if (action === "LOCK_ACCOUNT") {
        user.account_locked = !!value;
      } else if (action === "REVOKE_SESSION") {
        mockStore.activities.unshift({
          id: `act-sec-${Date.now()}`,
          timestamp: new Date().toISOString(),
          agent_name: "Vikramaditya (Owner)",
          employee_code: "OWNER-01",
          activity_type: "SECURITY_ALERT",
          title: "Session Forcibly Revoked",
          description: `Active authentication token for executive ${user.full_name} (${user.employee_code}) was terminated remotely.`,
          severity: "WARNING"
        });
      }

      mockStore.saveState();
      return mockResponse({
        success: true,
        user,
        message: `Updated security settings for ${user.full_name}`
      });
    }

    // 1f. Log Client-Side Activity / Incident: POST /api/v1/telemetry/log-activity
    if (pathname.endsWith("/telemetry/log-activity") && method === "POST") {
      let body: any = {};
      try {
        body = init?.body ? JSON.parse(init.body as string) : {};
      } catch (e) {}

      const newAct: MinuteActivityRecord = {
        id: `act-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agent_name: body.agent_name || mockStore.currentUser.full_name,
        employee_code: body.employee_code || mockStore.currentUser.employee_code,
        activity_type: body.activity_type || "SECURITY_ALERT",
        title: body.title || "Telemetry Event",
        description: body.description || "",
        severity: body.severity || "INFO",
        deal_value: body.deal_value,
        brokerage_commission: body.brokerage_commission
      };

      mockStore.activities.unshift(newAct);
      mockStore.saveState();
      return mockResponse({ success: true, activity: newAct });
    }

    // 2. Properties: GET /api/v1/properties
    if (pathname.endsWith("/properties") && method === "GET") {
      return mockResponse(mockStore.properties);
    }

    // 3. Leads: GET /api/v1/leads
    if (pathname.endsWith("/leads") && method === "GET") {
      return mockResponse(mockStore.leads);
    }

    // 4. Click-to-Call: POST /api/v1/leads/:id/call
    const callMatch = pathname.match(/\/leads\/([^\/]+)\/call$/);
    if (callMatch && method === "POST") {
      const leadId = callMatch[1];
      const lead = mockStore.leads.find((l) => l.id === leadId);
      const bridgeId = `BRG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const durationSec = Math.floor(60 + Math.random() * 360);
      const mins = Math.floor(durationSec / 60);
      const secs = durationSec % 60;

      if (lead) {
        if (lead.status === "NEW") {
          lead.status = "CONTACTED";
        }

        // Add call log record
        mockStore.callLogs.unshift({
          id: `call-rec-${Date.now()}`,
          caller_name: lead.assigned_agent_name || mockStore.currentUser.full_name,
          caller_code: mockStore.currentUser.employee_code,
          lead_name: lead.full_name,
          lead_phone_masked: lead.phone_masked,
          property_title: `${lead.property_type || "Apartment"} Inquiry`,
          bridge_id: bridgeId,
          start_time: new Date().toISOString(),
          duration_seconds: durationSec,
          duration_formatted: `${mins}m ${secs < 10 ? "0" : ""}${secs}s`,
          outcome: "Masked Bridge Connected",
          notes: "Prospect consultation logged via encrypted telephony bridge.",
          is_encrypted: true
        });

        // Add minute activity
        mockStore.activities.unshift({
          id: `act-call-${Date.now()}`,
          timestamp: new Date().toISOString(),
          agent_name: lead.assigned_agent_name || mockStore.currentUser.full_name,
          employee_code: mockStore.currentUser.employee_code,
          activity_type: "CALL_PLACED",
          title: "Masked Call Bridge Dialed",
          description: `Initiated encrypted telephony call with ${lead.full_name} (${lead.phone_masked}) via Bridge ${bridgeId}.`,
          severity: "INFO"
        });

        mockStore.saveState();
      }

      return mockResponse({
        message: "Initiating masked virtual CTI bridge call...",
        call_bridge_id: bridgeId,
        status: "CONNECTED",
        lead_id: leadId,
        masked_number: lead?.phone_masked || "+91 98*** **22"
      });
    }

    // 5. Simulate Meta Lead: POST /api/v1/webhooks/meta/simulate-test-lead
    if (pathname.includes("/webhooks/meta/simulate-test-lead") && method === "POST") {
      const now = Date.now();
      const metaLeadgens = ["meta_ad_9841", "meta_reel_3320", "meta_story_5119", "meta_carousel_7740"];
      const randomNames = [
        "Aarav Singhania",
        "Ishita Sengupta",
        "Rohan Kulkarni",
        "Divya Pillai",
        "Kabir Roy",
        "Tanvi Joshi",
        "Alok Deshpande",
        "Meenakshi Sundaram"
      ];
      const randomProperties = [
        "4 BHK Sky Villa",
        "3 BHK Luxury Apartment",
        "5 BHK Independent Villa",
        "4 BHK Duplex Penthouse",
        "Grade-A Commercial Office"
      ];
      const randomLocations = [
        "Downtown Skyline",
        "Palm Grove Estates",
        "Marina Bay Promenade",
        "Central Business District (CBD)"
      ];
      const randomAgents = ["Rahul Verma", "Ananya Patel", "Vikram Malhotra", "Karan Mehta"];

      const chosenName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const chosenProp = randomProperties[Math.floor(Math.random() * randomProperties.length)];
      const chosenLoc = randomLocations[Math.floor(Math.random() * randomLocations.length)];
      const chosenAgent = randomAgents[Math.floor(Math.random() * randomAgents.length)];
      const chosenSource = Math.random() > 0.5 ? "META_FB_AD" : "META_IG_REEL";

      const newLead: LeadItem = {
        id: `lead-sim-${Date.now()}`,
        full_name: chosenName,
        phone_masked: `+91 98*** **${Math.floor(10 + Math.random() * 89)}`,
        email_masked: `${chosenName.toLowerCase().replace(" ", ".")}@example.com`,
        source: chosenSource,
        status: "NEW",
        property_type: chosenProp,
        budget_min: 45000000,
        budget_max: 65000000,
        preferred_location: chosenLoc,
        notes: `⚡ Real-time lead ingested via ${chosenSource === "META_FB_AD" ? "Facebook Lead Ad" : "Instagram Reel"} Webhook. 15-minute SLA countdown activated!`,
        assigned_agent_name: chosenAgent,
        sla_deadline: new Date(now + 15 * 60 * 1000).toISOString(),
        is_sla_breached: false,
        estimated_brokerage: Math.round(55000000 * 0.02),
        poaching_risk_score: "LOW",
        poaching_risk_reason: "Fresh incoming inquiry via Meta Lead Webhook.",
        offline_closing_flag: false,
        created_at: new Date(now).toISOString()
      };

      mockStore.leads = [newLead, ...mockStore.leads];
      mockStore.saveState();

      return mockResponse({
        success: true,
        message: "Meta Lead Ingested via Webhook! Auto-assigned to ready executive.",
        lead: newLead
      });
    }

    // 6. Confiscate Single Lead: POST /api/v1/leads/:id/confiscate
    const confiscateMatch = pathname.match(/\/leads\/([^\/]+)\/confiscate$/);
    if (confiscateMatch && method === "POST") {
      const leadId = confiscateMatch[1];
      const lead = mockStore.leads.find((l) => l.id === leadId);
      if (lead) {
        lead.assigned_agent_name = "Central Reassignment Pool (Compliant)";
        lead.poaching_risk_score = "LOW";
        lead.offline_closing_flag = false;
        lead.notes = `[CONFISCATED BY MANAGEMENT] Lead reassigned to compliant queue to protect against offline broker theft.`;
        mockStore.saveState();
        return mockResponse(lead);
      }
      return mockResponse({ detail: "Lead not found" }, 404);
    }

    // 7. Update Lead: PATCH /api/v1/leads/:id
    const updateLeadMatch = pathname.match(/\/leads\/([^\/]+)$/);
    if (updateLeadMatch && method === "PATCH") {
      const leadId = updateLeadMatch[1];
      let body: any = {};
      try {
        body = init?.body ? JSON.parse(init.body as string) : {};
      } catch (e) {}

      const lead = mockStore.leads.find((l) => l.id === leadId);
      if (lead) {
        if (body.status) lead.status = body.status;
        if (body.notes) lead.notes = body.notes;
        mockStore.saveState();
        return mockResponse(lead);
      }
      return mockResponse({ detail: "Lead not found" }, 404);
    }

    // 8. Lead Activities: GET /api/v1/leads/:id/activities
    const leadActMatch = pathname.match(/\/leads\/([^\/]+)\/activities$/);
    if (leadActMatch && method === "GET") {
      const leadId = leadActMatch[1];
      const lead = mockStore.leads.find((l) => l.id === leadId);
      const activities = [
        {
          id: `act-1-${leadId}`,
          activity_type: "LEAD_INGESTED",
          metadata_json: JSON.stringify({
            source: lead?.source || "META_FB_AD",
            sla_countdown: "15 minutes"
          }),
          created_at: lead?.created_at || new Date().toISOString()
        },
        {
          id: `act-2-${leadId}`,
          activity_type: "SLA_COUNTDOWN_STARTED",
          metadata_json: JSON.stringify({
            assigned_agent: lead?.assigned_agent_name || "Rahul Verma",
            status: lead?.is_sla_breached ? "BREACHED" : "ACTIVE"
          }),
          created_at: lead?.created_at || new Date().toISOString()
        },
        {
          id: `act-3-${leadId}`,
          activity_type: "WATERMARKED_VIEW",
          metadata_json: JSON.stringify({
            viewer: mockStore.currentUser.full_name,
            dlp_protection: "Canvas Watermark Injected"
          }),
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        }
      ];

      if (lead?.status !== "NEW") {
        activities.unshift({
          id: `act-4-${leadId}`,
          activity_type: "STAGE_CHANGED",
          metadata_json: JSON.stringify({
            new_stage: lead?.status,
            notes: lead?.notes
          }),
          created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString()
        });
      }

      return mockResponse(activities);
    }

    // 9. Telemetry Agents: GET /api/v1/telemetry/agents
    if (pathname.endsWith("/telemetry/agents") && method === "GET") {
      // Return agents reflecting live lead counts from mockStore
      const agents = [
        {
          id: "ag-rahul",
          full_name: "Rahul Verma",
          email: "agent.rahul@apexrealty.com",
          employee_code: "EXE-204",
          role: "AGENT",
          phone: "+919822200000",
          assigned_territory: "Downtown Skyline",
          is_punched_in: true,
          last_punch_time: "2026-10-27T09:30:00Z",
          working_hours_today: "6h 45m",
          active_leads_count: mockStore.leads.filter((l) => l.assigned_agent_name === "Rahul Verma").length,
          total_brokerage_managed: 2450000,
          device_type: "LAPTOP",
          device_model: "Dell XPS 15 (Windows 11)",
          ip_address: "103.21.144.10",
          current_location: "Downtown Skyline HQ (19.076, 72.877)",
          latitude: 19.076,
          longitude: 72.8777,
          poaching_risk_score: "HIGH",
          poaching_risk_reason: "Customer contact viewed 6 times without using CRM bridge. Suspected direct personal calling.",
          offline_closing_flag: false
        },
        {
          id: "ag-ananya",
          full_name: "Ananya Patel",
          email: "agent.ananya@apexrealty.com",
          employee_code: "EXE-208",
          role: "AGENT",
          phone: "+919833344455",
          assigned_territory: "Palm Grove Estates",
          is_punched_in: true,
          last_punch_time: "2026-10-27T10:00:00Z",
          working_hours_today: "6h 15m",
          active_leads_count: mockStore.leads.filter((l) => l.assigned_agent_name === "Ananya Patel").length,
          total_brokerage_managed: 4550000,
          device_type: "MOBILE_PHONE",
          device_model: "Apple iPhone 15 Pro",
          ip_address: "157.34.192.44",
          current_location: "Palm Grove Villa 12 Inspection (19.113, 72.869)",
          latitude: 19.1136,
          longitude: 72.8697,
          poaching_risk_score: "CRITICAL",
          poaching_risk_reason: "Marked 'LOST' in CRM for Kavita Chawla (₹7.25 Cr), but GPS logs prove 3 unlogged physical visits! Offline closing risk of ₹14.5 Lakhs brokerage.",
          offline_closing_flag: true
        },
        {
          id: "ag-vikram",
          full_name: "Vikram Malhotra",
          email: "agent.vikram@apexrealty.com",
          employee_code: "EXE-215",
          role: "AGENT",
          phone: "+919844455566",
          assigned_territory: "Marina Bay Promenade",
          is_punched_in: true,
          last_punch_time: "2026-10-27T09:45:00Z",
          working_hours_today: "6h 30m",
          active_leads_count: mockStore.leads.filter((l) => l.assigned_agent_name === "Vikram Malhotra").length,
          total_brokerage_managed: 2400000,
          device_type: "MOBILE_PHONE",
          device_model: "Samsung Galaxy S24 Ultra",
          ip_address: "157.34.192.89",
          current_location: "Marina Azure Site Office (18.922, 72.834)",
          latitude: 18.922,
          longitude: 72.8347,
          poaching_risk_score: "LOW",
          poaching_risk_reason: "Fully compliant CRM bridge calls logged (22 mins talk time).",
          offline_closing_flag: false
        },
        {
          id: "ag-karan",
          full_name: "Karan Mehta",
          email: "agent.karan@apexrealty.com",
          employee_code: "EXE-210",
          role: "AGENT",
          phone: "+919822277889",
          assigned_territory: "Bandra West & Worli Promenade",
          is_punched_in: true,
          last_punch_time: "2026-10-27T09:15:00Z",
          working_hours_today: "7h 00m",
          active_leads_count: mockStore.leads.filter((l) => l.assigned_agent_name === "Karan Mehta").length,
          total_brokerage_managed: 3100000,
          device_type: "LAPTOP",
          device_model: "MacBook Pro 14 M3",
          ip_address: "103.21.144.55",
          current_location: "Bandra Sea Face Office (19.054, 72.826)",
          latitude: 19.0544,
          longitude: 72.8266,
          poaching_risk_score: "LOW",
          poaching_risk_reason: "Ultra-luxury client consultation completed with 100% CRM masked bridge compliance.",
          offline_closing_flag: false
        }
      ];
      return mockResponse(agents);
    }

    // 10. Security Audit Logs: GET /api/v1/telemetry/audit-logs
    if (pathname.endsWith("/telemetry/audit-logs") && method === "GET") {
      return mockResponse(mockStore.logs);
    }

    // 11. Export Requests: GET /api/v1/exports
    if (pathname.endsWith("/exports") && method === "GET") {
      return mockResponse(mockStore.exportsList);
    }

    // 12. Create Export Request: POST /api/v1/exports/request
    if (pathname.endsWith("/exports/request") && method === "POST") {
      let body: any = {};
      try {
        body = init?.body ? JSON.parse(init.body as string) : {};
      } catch (e) {}

      const newReq = {
        id: `exp-req-${Math.floor(1000 + Math.random() * 9000)}`,
        requester_id: mockStore.currentUser.id,
        requester_name: `${mockStore.currentUser.full_name} (${mockStore.currentUser.employee_code})`,
        status: "PENDING",
        reason: body.reason || "Client portfolio export",
        records_count: Number(body.records_count) || 25,
        expires_at: new Date(Date.now() + 3600000 * 24).toISOString(),
        created_at: new Date().toISOString()
      };

      mockStore.exportsList = [newReq, ...mockStore.exportsList];
      mockStore.saveState();

      return mockResponse(newReq);
    }

    // 13. Review Export Request: POST /api/v1/exports/review
    if (pathname.endsWith("/exports/review") && method === "POST") {
      let body: any = {};
      try {
        body = init?.body ? JSON.parse(init.body as string) : {};
      } catch (e) {}

      const reqId = body.request_id;
      const approved = body.approved;
      const targetReq = mockStore.exportsList.find((r) => r.id === reqId);

      if (targetReq) {
        targetReq.status = approved ? "APPROVED" : "REJECTED";
        mockStore.saveState();
        return mockResponse(targetReq);
      }
      return mockResponse({ detail: "Export request not found" }, 404);
    }

    // 14. Punch Clock: POST /api/v1/telemetry/punch
    if (pathname.endsWith("/telemetry/punch") && method === "POST") {
      let body: any = {};
      try {
        body = init?.body ? JSON.parse(init.body as string) : {};
      } catch (e) {}

      const isPunchedIn = body.action === "PUNCH_IN";
      mockStore.currentUser.is_punched_in = isPunchedIn;

      return mockResponse({
        is_punched_in: isPunchedIn,
        action: body.action,
        timestamp: new Date().toISOString(),
        status: "success"
      });
    }

    // 15. Confiscate All Agent Leads: POST /api/v1/telemetry/agents/:id/confiscate-all
    const confiscateAllMatch = pathname.match(/\/telemetry\/agents\/([^\/]+)\/confiscate-all$/);
    if (confiscateAllMatch && method === "POST") {
      const agentId = confiscateAllMatch[1];
      // Target agent mapping
      let agentName = "Ananya Patel";
      if (agentId.includes("rahul")) agentName = "Rahul Verma";
      else if (agentId.includes("vikram")) agentName = "Vikram Malhotra";

      let count = 0;
      mockStore.leads = mockStore.leads.map((lead) => {
        if (lead.assigned_agent_name === agentName) {
          count++;
          return {
            ...lead,
            assigned_agent_name: "Central Reassignment Pool (Compliant)",
            poaching_risk_score: "LOW",
            offline_closing_flag: false,
            notes: `[CONFISCATED BY OWNER] All leads revoked from ${agentName} due to theft detection.`
          };
        }
        return lead;
      });

      mockStore.saveState();

      return mockResponse({
        success: true,
        confiscated_count: count,
        message: `Successfully confiscated ${count} leads from executive.`
      });
    }

    // 16. Telemetry Alerts & Devices: POST /api/v1/telemetry/report-alert, POST /api/v1/telemetry/device
    if (pathname.includes("/telemetry/report-alert") || pathname.includes("/telemetry/device")) {
      return mockResponse({ success: true, recorded_at: new Date().toISOString() });
    }

    // Fallback: Generic 200 OK for any unhandled /api/v1 endpoint
    return mockResponse({ message: "Mock API Standalone Success", endpoint: pathname });
  };
}
