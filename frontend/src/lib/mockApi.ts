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
import { dispositionToPipelineStatus, LeadDisposition } from "./leadAnalytics";
import { maskIndianPhoneNumber } from "./formatters";

const SEED_SCHEMA_VERSION = "aa_v4_unique_property_photos";

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
  currentUser: MockUser = MOCK_USERS["owner@absoluteassets.in"];
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
        const storedVersion = localStorage.getItem("aa_crm_seed_version");
        if (storedVersion !== SEED_SCHEMA_VERSION) {
          // Fresh migration to Absolute Assets v2 schema so stale localStorage doesn't hide new dispositions/properties
          this.resetToDefaults();
          return;
        }

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
          this.loginRecords = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...MOCK_LOGIN_RECORDS];
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
          this.activities = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...MOCK_MINUTE_ACTIVITIES];
        } else {
          this.activities = [...MOCK_MINUTE_ACTIVITIES];
        }

        const savedUsers = localStorage.getItem("apex_crm_mock_users");
        if (savedUsers) {
          const parsed = JSON.parse(savedUsers);
          this.users = { ...MOCK_USERS, ...parsed };
        } else {
          this.users = { ...MOCK_USERS };
        }

        const savedCurrentEmail = localStorage.getItem("apex_crm_current_user_email");
        if (savedCurrentEmail && this.users[savedCurrentEmail]) {
          this.currentUser = this.users[savedCurrentEmail];
        }
      } else {
        this.leads = getInitialMockLeads();
      }
    } catch (e) {
      this.resetToDefaults();
    }
  }

  saveState() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("aa_crm_seed_version", SEED_SCHEMA_VERSION);
        localStorage.setItem("apex_crm_mock_leads", JSON.stringify(this.leads));
        localStorage.setItem("apex_crm_mock_exports", JSON.stringify(this.exportsList));
        localStorage.setItem("apex_crm_mock_logs", JSON.stringify(this.logs));
        localStorage.setItem("apex_crm_mock_logins", JSON.stringify(this.loginRecords));
        localStorage.setItem("apex_crm_mock_calls", JSON.stringify(this.callLogs));
        localStorage.setItem("apex_crm_mock_activities", JSON.stringify(this.activities));
        localStorage.setItem("apex_crm_mock_users", JSON.stringify(this.users));
        if (this.currentUser?.email) {
          localStorage.setItem("apex_crm_current_user_email", this.currentUser.email);
        }
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
    this.currentUser = this.users["owner@absoluteassets.in"];
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

function resolveUserByEmail(email?: string): MockUser {
  if (!email) return mockStore.users["owner@absoluteassets.in"];
  if (mockStore.users[email]) return mockStore.users[email];
  // Backward compatibility aliases
  if (email.includes("rahul") || email.includes("dhruv")) return mockStore.users["dhruv@absoluteassets.in"];
  if (email.includes("ananya")) return mockStore.users["ananya@absoluteassets.in"];
  if (email.includes("vikram")) return mockStore.users["vikram@absoluteassets.in"];
  if (email.includes("karan")) return mockStore.users["karan@absoluteassets.in"];
  return mockStore.users["owner@absoluteassets.in"];
}

let originalFetchRef: typeof fetch | null = null;
let interceptorInstalled = false;

function getNativeFetch(): typeof fetch | null {
  if (originalFetchRef) return originalFetchRef;
  if (typeof globalThis !== "undefined" && typeof globalThis.fetch === "function") {
    return globalThis.fetch.bind(globalThis);
  }
  return null;
}

// Direct API fetch wrapper that works even in sandboxed iframes where window.fetch is a getter-only property
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const nativeFetch = getNativeFetch();

  // Check if this is an API call
  if (!url.includes("/api/v1/")) {
    if (nativeFetch) {
      return nativeFetch(input, init);
    }
    throw new Error(`Fetch unavailable for non-API request: ${url}`);
  }

  const forceStandalone =
    (typeof localStorage !== "undefined" && localStorage.getItem("apex_crm_force_standalone") === "true") ||
    !mockStore.backendAvailable;

  if (!forceStandalone && nativeFetch) {
    try {
      const response = await nativeFetch(input, init);
      return response;
    } catch (networkError) {
      mockStore.backendAvailable = false;
    }
  }

  // Simulate micro-delay for smooth UX
  await new Promise((res) => setTimeout(res, 35));

  const method = (init?.method || "GET").toUpperCase();
  const pathname = url.replace(/https?:\/\/[^\/]+/, "").split("?")[0];
  const queryString = url.includes("?") ? url.split("?")[1] : "";
  return handleMockApiRoute(pathname, method, init, queryString);
}

// Global fetch interceptor (safely handles getter-only or non-configurable window.fetch in iframes)
export function initMockInterceptor() {
  if (interceptorInstalled || typeof window === "undefined") return;
  interceptorInstalled = true;

  try {
    if (typeof window.fetch === "function") {
      originalFetchRef = window.fetch.bind(window);
    }
  } catch {
    originalFetchRef = null;
  }

  try {
    const desc =
      Object.getOwnPropertyDescriptor(window, "fetch") ||
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(window), "fetch");

    if (!desc || (desc.writable && !desc.get)) {
      window.fetch = apiFetch;
    } else if (desc.configurable) {
      Object.defineProperty(window, "fetch", {
        value: apiFetch,
        writable: true,
        configurable: true
      });
    }
    // If window.fetch is non-configurable getter-only, skip monkey-patching silently;
    // all app API calls invoke apiFetch() directly.
  } catch {
    // Gracefully fall back to direct apiFetch() calls without throwing on boot.
  }
}

async function handleMockApiRoute(
  pathname: string,
  method: string,
  init?: RequestInit,
  queryString = ""
): Promise<Response> {

    // 1. Auth Login: POST /api/v1/auth/login
    if (pathname.endsWith("/auth/login") && method === "POST") {
      let body: any = {};
      try {
        body = init?.body ? JSON.parse(init.body as string) : {};
      } catch (e) {}

      const user = resolveUserByEmail(body.email);
      mockStore.currentUser = user;

      const deviceModel = body.device_model || (body.device_type === "MOBILE_APP" ? "Apple iPhone 15 Pro (iOS 18.2)" : "MacBook Pro 16 M3 Max");
      const browser = body.browser || "Chrome 122.0.6";
      const channel: "WEB_APP" | "MOBILE_APP" = body.channel || (body.device_type === "MOBILE_APP" ? "MOBILE_APP" : "WEB_APP");
      const ipAddress = body.ip_address || "103.21.144.1";

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
        return mockResponse({ detail: "Account locked by administrator due to security violations. Please contact the Agency Principal." }, 403);
      }

      if (user.mfa_enabled || user.mfa_enforced) {
        mockStore.saveState();
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

      const otpCode = body.otp_code || "";
      const user = resolveUserByEmail(body.email);

      const deviceModel = body.device_model || (body.channel === "MOBILE_APP" ? "Apple iPhone 15 Pro (iOS 18.2)" : "MacBook Pro 16 M3 Max");
      const browser = body.browser || "Chrome 122.0.6";
      const channel: "WEB_APP" | "MOBILE_APP" = body.channel || "WEB_APP";
      const ipAddress = body.ip_address || "103.21.144.1";

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

      const user = body.email ? resolveUserByEmail(body.email) : mockStore.currentUser;

      if (user.mfa_enforced && !body.enabled) {
        return mockResponse({ detail: "MFA policy is enforced by company administration and cannot be disabled." }, 403);
      }

      user.mfa_enabled = !!body.enabled;
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

    // 1d-2. Call Logs Summary Endpoint: GET /api/v1/telemetry/call-logs
    if (pathname.endsWith("/telemetry/call-logs") && method === "GET") {
      return mockResponse(mockStore.callLogs);
    }

    // 1d-3. Agent Activities Feed Endpoint: GET /api/v1/telemetry/activities
    if (pathname.endsWith("/telemetry/activities") && method === "GET") {
      return mockResponse(mockStore.activities);
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

    // 3b. Create Lead Manually: POST /api/v1/leads
    if (pathname.endsWith("/leads") && method === "POST") {
      let body: any = {};
      try {
        body = init?.body ? JSON.parse(init.body as string) : {};
      } catch {}

      const now = Date.now();
      const rawName = String(body.full_name || "").trim();
      if (!rawName) {
        return mockResponse({ detail: "Full name is required." }, 400);
      }

      const maskedPhone = maskIndianPhoneNumber(body.phone);

      const assignedAgent = String(body.assigned_agent_name || "Dhruv Chaudhary").trim();
      const source = String(body.source || "WEBSITE_DIRECT").trim();
      const propertyType = String(body.property_type || "Residential Plots").trim();
      const location = String(body.preferred_location || "Gurugram").trim();
      const notes = String(body.notes || "Lead added manually in CRM.").trim();

      const newLead: LeadItem = {
        id: `lead-manual-${now}`,
        lead_code: String(197500 + Math.floor(Math.random() * 499)),
        full_name: rawName,
        phone_masked: maskedPhone,
        email_masked: body.email ? String(body.email) : undefined,
        source,
        status: "NEW",
        disposition: "PENDING",
        property_type: propertyType,
        budget_min: 20000000,
        budget_max: 45000000,
        preferred_location: location,
        notes,
        assigned_agent_name: assignedAgent,
        created_by_me: true,
        sla_deadline: new Date(now + 15 * 60 * 1000).toISOString(),
        is_sla_breached: false,
        estimated_brokerage: 650000,
        poaching_risk_score: "LOW",
        offline_closing_flag: false,
        created_at: new Date(now).toISOString()
      };

      mockStore.leads = [newLead, ...mockStore.leads];
      mockStore.activities.unshift({
        id: `act-add-${now}`,
        timestamp: new Date(now).toISOString(),
        agent_name: mockStore.currentUser.full_name,
        employee_code: mockStore.currentUser.employee_code,
        activity_type: "LEAD_VIEW",
        title: `Added New Lead: ${rawName}`,
        description: `Created inquiry for ${propertyType} and assigned to ${assignedAgent}.`,
        severity: "INFO"
      });
      mockStore.saveState();
      return mockResponse(newLead, 201);
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

      let newCallRecord: CallLogRecord | null = null;
      if (lead) {
        if (lead.status === "NEW") {
          lead.status = "CONTACTED";
          if (!lead.disposition || lead.disposition === "PENDING") {
            lead.disposition = "FOLLOW_UP";
          }
        }

        newCallRecord = {
          id: `call-rec-${Date.now()}`,
          caller_name: lead.assigned_agent_name || mockStore.currentUser.full_name,
          caller_code: mockStore.currentUser.employee_code,
          lead_name: lead.full_name,
          lead_phone_masked: lead.phone_masked,
          property_title: `${lead.property_type || "Gurugram Property"} Inquiry`,
          bridge_id: bridgeId,
          start_time: new Date().toISOString(),
          duration_seconds: durationSec,
          duration_formatted: `${mins}m ${secs < 10 ? "0" : ""}${secs}s`,
          outcome: "Masked Bridge Connected",
          notes: "Prospect consultation logged via encrypted telephony bridge.",
          is_encrypted: true
        };
        mockStore.callLogs.unshift(newCallRecord);

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
        call_log: newCallRecord,
        masked_number: lead?.phone_masked || "+91 98*** **22"
      });
    }

    // 5. Simulate Ad Lead (Meta, WhatsApp, Instagram, LinkedIn, Google): POST /api/v1/webhooks/meta/simulate-test-lead
    if (pathname.includes("/webhooks/meta/simulate-test-lead") && method === "POST") {
      const now = Date.now();
      const params = new URLSearchParams(queryString);
      const requestedChannel = (params.get("channel") || "").toUpperCase();

      const channelOptions = [
        { key: "META", source: "META_FB_AD", label: "Meta (Facebook)" },
        { key: "WHATSAPP", source: "WHATSAPP_AD", label: "WhatsApp" },
        { key: "INSTAGRAM", source: "META_IG_REEL", label: "Instagram" },
        { key: "LINKEDIN", source: "LINKEDIN_LEAD_GEN", label: "LinkedIn" },
        { key: "GOOGLE", source: "GOOGLE_ADS_SEARCH", label: "Google Ads" }
      ];
      const chosenChannel =
        channelOptions.find((c) => c.key === requestedChannel) ||
        channelOptions[Math.floor(Math.random() * channelOptions.length)];

      const randomNames = [
        "Aarav Singhania",
        "Ishita Sengupta",
        "Rohan Kulkarni",
        "Divya Pillai",
        "Kabir Malhotra",
        "Tanvi Joshi",
        "Alok Deshpande",
        "Prashant Verma"
      ];
      const randomProperties = [
        "residential plots",
        "DLF Privana South (4 BHK)",
        "Elan The Mark (Commercial)",
        "Smartworld One DXP (Penthouse)",
        "M3M Paragon 57 (Pre-Leased)"
      ];
      const randomLocations = [
        "Sector 106, Dwarka Expressway",
        "Sector 77, Gurugram",
        "Sector 57, Golf Course Road",
        "Sohna Road & New Gurugram"
      ];
      const randomAgents = [
        { name: "Dhruv Chaudhary", code: "EXE-204" },
        { name: "Ananya Patel", code: "EXE-208" },
        { name: "Vikram Malhotra", code: "EXE-215" },
        { name: "Karan Mehta", code: "EXE-210" }
      ];

      const chosenName = randomNames[Math.floor(Math.random() * randomNames.length)];
      const chosenProp = randomProperties[Math.floor(Math.random() * randomProperties.length)];
      const chosenLoc = randomLocations[Math.floor(Math.random() * randomLocations.length)];
      const chosenAgent = randomAgents[Math.floor(Math.random() * randomAgents.length)];
      const leadCode = String(197300 + Math.floor(Math.random() * 699));

      const newLead: LeadItem = {
        id: `lead-sim-${Date.now()}`,
        lead_code: leadCode,
        full_name: chosenName,
        phone_masked: `+91 98*** **${Math.floor(10 + Math.random() * 89)}`,
        email_masked: `${chosenName.toLowerCase().replace(" ", ".")}@gmail.com`,
        source: chosenChannel.source,
        status: "NEW",
        disposition: "PENDING",
        property_type: chosenProp,
        budget_min: 25000000,
        budget_max: 52000000,
        preferred_location: chosenLoc,
        notes: `New inquiry received from ${chosenChannel.label} advertisement. Assigned to ${chosenAgent.name} with 15-minute response timer.`,
        assigned_agent_name: chosenAgent.name,
        created_by_me: false,
        sla_deadline: new Date(now + 15 * 60 * 1000).toISOString(),
        is_sla_breached: false,
        estimated_brokerage: Math.round(38000000 * 0.02),
        poaching_risk_score: "LOW",
        poaching_risk_reason: `Fresh inquiry from ${chosenChannel.label}.`,
        offline_closing_flag: false,
        created_at: new Date(now).toISOString()
      };

      mockStore.leads = [newLead, ...mockStore.leads];
      mockStore.activities.unshift({
        id: `act-lead-${Date.now()}`,
        timestamp: new Date(now).toISOString(),
        agent_name: chosenAgent.name,
        employee_code: chosenAgent.code,
        activity_type: "LEAD_VIEW",
        title: `New ${chosenChannel.label} Ad Lead Assigned`,
        description: `${chosenName} inquired about ${chosenProp} via ${chosenChannel.label}. Auto-assigned to ${chosenAgent.name}.`,
        severity: "INFO"
      });
      mockStore.saveState();

      return mockResponse({
        success: true,
        channel: chosenChannel.label,
        message: `${chosenChannel.label} lead received and assigned to ${chosenAgent.name}.`,
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
        const previousAgent = lead.assigned_agent_name;
        if (body.disposition) {
          lead.disposition = body.disposition as LeadDisposition;
          if (!body.status) {
            lead.status = dispositionToPipelineStatus(lead.disposition);
          }
        }
        if (body.status) lead.status = body.status;
        if (typeof body.notes === "string") lead.notes = body.notes;
        if (typeof body.assigned_agent_name === "string" && body.assigned_agent_name.trim()) {
          lead.assigned_agent_name = body.assigned_agent_name.trim();
        }

        const agentChanged = previousAgent && lead.assigned_agent_name !== previousAgent;
        mockStore.activities.unshift({
          id: `act-upd-${Date.now()}`,
          timestamp: new Date().toISOString(),
          agent_name: lead.assigned_agent_name || mockStore.currentUser.full_name,
          employee_code: mockStore.currentUser.employee_code,
          activity_type: "DEAL_UPDATE",
          title: agentChanged
            ? `Reassigned Lead: ${lead.full_name}`
            : `Updated Lead: ${lead.full_name}`,
          description: agentChanged
            ? `Moved lead from ${previousAgent} to ${lead.assigned_agent_name}.`
            : `Changed status to ${(lead.disposition || lead.status).replace(/_/g, " ")}.${typeof body.notes === "string" && body.notes.trim() ? ` Note: "${body.notes.trim().slice(0, 90)}"` : ""}`,
          severity: "INFO"
        });
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
            assigned_agent: lead?.assigned_agent_name || "Dhruv Chaudhary",
            status: lead?.is_sla_breached ? "BREACHED" : "ACTIVE"
          }),
          created_at: lead?.created_at || new Date().toISOString()
        },
        {
          id: `act-3-${leadId}`,
          activity_type: "WATERMARKED_VIEW",
          metadata_json: JSON.stringify({
            viewer: mockStore.currentUser.full_name,
            dlp_protection: "Absolute Assets Canvas Watermark Injected"
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
            disposition: lead?.disposition,
            notes: lead?.notes
          }),
          created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString()
        });
      }

      return mockResponse(activities);
    }

    // 9. Telemetry Agents: GET /api/v1/telemetry/agents
    if (pathname.endsWith("/telemetry/agents") && method === "GET") {
      const agents = [
        {
          id: "ag-dhruv",
          full_name: "Dhruv Chaudhary",
          email: "dhruv@absoluteassets.in",
          employee_code: "EXE-204",
          role: "AGENT",
          phone: "+919822200000",
          assigned_territory: "Dwarka Expressway & Residential Plots",
          is_punched_in: true,
          last_punch_time: "2026-09-16T09:30:00Z",
          working_hours_today: "6h 45m",
          active_leads_count: mockStore.leads.filter((l) => l.assigned_agent_name === "Dhruv Chaudhary").length,
          total_brokerage_managed: 4580000,
          device_type: "LAPTOP",
          device_model: "Dell XPS 15 (Windows 11)",
          ip_address: "103.21.144.10",
          current_location: "Sector 106 Dwarka Exp. Desk (28.501, 77.011)",
          latitude: 28.501,
          longitude: 77.011,
          poaching_risk_score: "HIGH",
          poaching_risk_reason: "Customer contact viewed 5+ times without completing CRM bridge talk-time.",
          offline_closing_flag: false
        },
        {
          id: "ag-ananya",
          full_name: "Ananya Patel",
          email: "ananya@absoluteassets.in",
          employee_code: "EXE-208",
          role: "AGENT",
          phone: "+919833344455",
          assigned_territory: "Golf Course Extension & SPR",
          is_punched_in: true,
          last_punch_time: "2026-09-16T10:00:00Z",
          working_hours_today: "6h 15m",
          active_leads_count: mockStore.leads.filter((l) => l.assigned_agent_name === "Ananya Patel").length,
          total_brokerage_managed: 4590000,
          device_type: "MOBILE_PHONE",
          device_model: "Apple iPhone 15 Pro",
          ip_address: "157.34.192.44",
          current_location: "DLF Privana South Site Office, Sec 77 (28.393, 76.988)",
          latitude: 28.393,
          longitude: 76.988,
          poaching_risk_score: "CRITICAL",
          poaching_risk_reason: "Marked 'Not Interested' for Kavita Chawla (₹6.25 Cr), but GPS logs prove 3 unlogged site visits! Offline closing risk of ₹14.5 Lakhs.",
          offline_closing_flag: true
        },
        {
          id: "ag-vikram",
          full_name: "Vikram Malhotra",
          email: "vikram@absoluteassets.in",
          employee_code: "EXE-215",
          role: "AGENT",
          phone: "+919844455566",
          assigned_territory: "Sector 57 & Commercial Retail",
          is_punched_in: true,
          last_punch_time: "2026-09-16T09:45:00Z",
          working_hours_today: "6h 30m",
          active_leads_count: mockStore.leads.filter((l) => l.assigned_agent_name === "Vikram Malhotra").length,
          total_brokerage_managed: 1650000,
          device_type: "MOBILE_PHONE",
          device_model: "Samsung Galaxy S24 Ultra",
          ip_address: "157.34.192.89",
          current_location: "M3M Paragon 57 Lounge, Sec 57 (28.421, 77.071)",
          latitude: 28.421,
          longitude: 77.071,
          poaching_risk_score: "LOW",
          poaching_risk_reason: "Fully compliant CRM bridge calls logged (24 mins talk time).",
          offline_closing_flag: false
        },
        {
          id: "ag-karan",
          full_name: "Karan Mehta",
          email: "karan@absoluteassets.in",
          employee_code: "EXE-210",
          role: "AGENT",
          phone: "+919822277889",
          assigned_territory: "DLF Privana & Sohna Road",
          is_punched_in: true,
          last_punch_time: "2026-09-16T09:15:00Z",
          working_hours_today: "7h 00m",
          active_leads_count: mockStore.leads.filter((l) => l.assigned_agent_name === "Karan Mehta").length,
          total_brokerage_managed: 3420000,
          device_type: "LAPTOP",
          device_model: "MacBook Pro 14 M3",
          ip_address: "103.21.144.55",
          current_location: "Absolute Assets HQ, Golf Course Road (28.459, 77.093)",
          latitude: 28.459,
          longitude: 77.093,
          poaching_risk_score: "LOW",
          poaching_risk_reason: "Ultra-luxury client consultations completed with 100% masked bridge compliance.",
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
      mockStore.activities.unshift({
        id: `act-punch-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agent_name: mockStore.currentUser.full_name,
        employee_code: mockStore.currentUser.employee_code,
        activity_type: "GPS_CHECKIN",
        title: isPunchedIn ? "Punched In for Shift" : "Punched Out of Shift",
        description: `${mockStore.currentUser.full_name} ${isPunchedIn ? "started" : "ended"} duty with GPS verification.`,
        severity: "INFO"
      });
      mockStore.saveState();

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
      let agentName = "Ananya Patel";
      if (agentId.includes("dhruv") || agentId.includes("rahul")) agentName = "Dhruv Chaudhary";
      else if (agentId.includes("vikram")) agentName = "Vikram Malhotra";
      else if (agentId.includes("karan")) agentName = "Karan Mehta";

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

    // 16. Telemetry Alerts & Devices
    if (pathname.includes("/telemetry/report-alert") || pathname.includes("/telemetry/device")) {
      return mockResponse({ success: true, recorded_at: new Date().toISOString() });
    }

    return mockResponse({ message: "Mock API Standalone Success", endpoint: pathname });
}
