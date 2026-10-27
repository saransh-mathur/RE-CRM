import React, { useState } from "react";
import { ThemeColors } from "../../lib/theme";

interface LoginPageProps {
  theme: ThemeColors;
  themeMode: "light" | "dark";
  onLoginSuccess: (token: string, user: {
    id: string;
    fullName: string;
    employeeCode: string;
    role: string;
    isPunchedIn: boolean;
    mfaEnabled?: boolean;
  }) => void;
  backendUrl?: string;
}

const PRESET_USERS = [
  {
    label: "👑 Vikramaditya (Agency Owner)",
    role: "OWNER",
    email: "owner@apexrealty.com",
    pass: "OwnerPass2026!",
    device: "MacBook Pro 16 M3 Max",
    browser: "Chrome 122.0",
    channel: "WEB_APP" as const,
    ip: "103.21.144.1",
    avatar: "👑"
  },
  {
    label: "💼 Rahul (Executive - Downtown)",
    role: "AGENT",
    email: "agent.rahul@apexrealty.com",
    pass: "AgentPass2026!",
    device: "Dell XPS 15 (Windows 11)",
    browser: "Chrome 122.0",
    channel: "WEB_APP" as const,
    ip: "103.21.144.10",
    avatar: "💻"
  },
  {
    label: "💼 Ananya (Executive - Palm Grove)",
    role: "AGENT",
    email: "agent.ananya@apexrealty.com",
    pass: "AgentPass2026!",
    device: "Apple iPhone 15 Pro",
    browser: "Mobile Safari 18.2",
    channel: "MOBILE_APP" as const,
    ip: "157.34.192.44",
    avatar: "📱"
  },
  {
    label: "💼 Vikram (Executive - Marina Bay)",
    role: "AGENT",
    email: "agent.vikram@apexrealty.com",
    pass: "AgentPass2026!",
    device: "Samsung Galaxy S24 Ultra",
    browser: "Chrome Mobile 122.0",
    channel: "MOBILE_APP" as const,
    ip: "157.34.192.89",
    avatar: "📱"
  },
  {
    label: "💼 Karan (Executive - Bandra West)",
    role: "AGENT",
    email: "agent.karan@apexrealty.com",
    pass: "AgentPass2026!",
    device: "MacBook Pro 14 M3",
    browser: "Chrome 122.0",
    channel: "WEB_APP" as const,
    ip: "103.21.144.55",
    avatar: "💻"
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({
  theme,
  themeMode,
  onLoginSuccess,
  backendUrl = "http://localhost:8000"
}) => {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [email, setEmail] = useState<string>(PRESET_USERS[0].email);
  const [password, setPassword] = useState<string>(PRESET_USERS[0].pass);
  const [channel, setChannel] = useState<"WEB_APP" | "MOBILE_APP">(PRESET_USERS[0].channel);
  const [deviceModel, setDeviceModel] = useState<string>(PRESET_USERS[0].device);
  const [browser, setBrowser] = useState<string>(PRESET_USERS[0].browser);
  const [ipAddress, setIpAddress] = useState<string>(PRESET_USERS[0].ip);

  // MFA Challenge State
  const [mfaStep, setMfaStep] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSelectPreset = (index: number) => {
    const p = PRESET_USERS[index];
    setSelectedPresetIndex(index);
    setEmail(p.email);
    setPassword(p.pass);
    setChannel(p.channel);
    setDeviceModel(p.device);
    setBrowser(p.browser);
    setIpAddress(p.ip);
    setErrorMessage(null);
  };

  const handleInitialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const resp = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          device_model: deviceModel,
          browser,
          channel,
          ip_address: ipAddress
        })
      });

      const data = await resp.json();

      if (!resp.ok) {
        setErrorMessage(data.detail || "Authentication failed. Check credentials.");
        return;
      }

      if (data.mfa_required) {
        // Transition to MFA Step
        setPendingUser(data);
        setMfaStep(true);
      } else {
        // Direct login
        onLoginSuccess(data.access_token, {
          id: data.user_id,
          fullName: data.full_name,
          employeeCode: data.employee_code,
          role: data.role,
          isPunchedIn: data.is_punched_in,
          mfaEnabled: data.mfa_enabled
        });
      }
    } catch (err) {
      setErrorMessage("Network error during login.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const resp = await fetch(`${backendUrl}/api/v1/auth/verify-mfa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          otp_code: otpCode,
          device_model: deviceModel,
          browser,
          channel,
          ip_address: ipAddress
        })
      });

      const data = await resp.json();

      if (!resp.ok) {
        setErrorMessage(data.detail || "Invalid MFA code. Use demo code 123456.");
        return;
      }

      onLoginSuccess(data.access_token, {
        id: data.user_id,
        fullName: data.full_name,
        employeeCode: data.employee_code,
        role: data.role,
        isPunchedIn: data.is_punched_in,
        mfaEnabled: data.mfa_enabled
      });
    } catch (err) {
      setErrorMessage("Verification error. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: theme.bg,
      color: theme.textPrimary,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      padding: "20px"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "520px",
        backgroundColor: theme.cardBgElevated,
        backdropFilter: theme.glassBackdrop,
        WebkitBackdropFilter: theme.glassBackdrop,
        border: theme.glassBorder,
        boxShadow: theme.glassShadowGlow,
        borderRadius: "24px",
        padding: "36px 32px",
        transition: "all 0.3s ease"
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "26px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            backgroundColor: theme.cardBgSecondary,
            border: `1px solid ${theme.border}`,
            fontSize: "1.8rem",
            marginBottom: "12px",
            boxShadow: theme.glassShadow
          }}>
            🏢
          </div>
          <h2 style={{ fontSize: "1.55rem", fontWeight: "800", margin: "0 0 6px 0", letterSpacing: "-0.02em", color: theme.textPrimary }}>
            Apex Sovereign
          </h2>
          <p style={{ fontSize: "0.82rem", color: theme.textSecondary, margin: 0 }}>
            Enterprise Real Estate CRM • Role-Based MFA Security Gateway
          </p>
        </div>

        {errorMessage && (
          <div style={{
            padding: "10px 14px",
            borderRadius: "10px",
            backgroundColor: theme.cardBgSecondary,
            border: `1px solid ${theme.border}`,
            color: theme.textPrimary,
            fontSize: "0.8rem",
            fontWeight: "600",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>⚠️</span> {errorMessage}
          </div>
        )}

        {!mfaStep ? (
          /* STEP 1: CREDENTIALS & ROLE SELECTION */
          <form onSubmit={handleInitialLogin}>
            {/* Persona Quick Selector */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.03em", display: "block", marginBottom: "6px" }}>
                Select Role Persona:
              </label>
              <select
                value={selectedPresetIndex}
                onChange={(e) => handleSelectPreset(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgSecondary,
                  color: theme.textPrimary,
                  fontSize: "0.84rem",
                  fontWeight: "600",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                {PRESET_USERS.map((p, idx) => (
                  <option key={p.email} value={idx}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Email Field */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.03em", display: "block", marginBottom: "6px" }}>
                Corporate Email Address:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgSecondary,
                  color: theme.textPrimary,
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                  outline: "none"
                }}
              />
            </div>

            {/* Password Field */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "0.75rem", fontWeight: "700", color: theme.textMuted, textTransform: "uppercase", letterSpacing: "0.03em", display: "block", marginBottom: "6px" }}>
                Security Password:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgSecondary,
                  color: theme.textPrimary,
                  fontSize: "0.85rem",
                  boxSizing: "border-box",
                  outline: "none"
                }}
              />
            </div>

            {/* Device & Channel Telemetry Collector Card */}
            <div style={{
              padding: "12px 14px",
              borderRadius: "12px",
              backgroundColor: theme.cardBgSecondary,
              border: `1px solid ${theme.border}`,
              marginBottom: "20px",
              fontSize: "0.76rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontWeight: "700", color: theme.textPrimary }}>🛰️ Client Device Fingerprint</span>
                <span style={{ fontSize: "0.68rem", color: theme.textMuted }}>Auto-Logged to Audit Log</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", color: theme.textSecondary }}>
                <div>Device: <strong style={{ color: theme.textPrimary }}>{deviceModel}</strong></div>
                <div>IP: <strong style={{ color: theme.textPrimary }}>{ipAddress}</strong></div>
                <div>Browser: <strong style={{ color: theme.textPrimary }}>{browser}</strong></div>
                <div>Channel: <strong style={{ color: theme.textPrimary }}>{channel}</strong></div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.textPrimary,
                color: theme.bg.includes("#090d16") ? "#000000" : "#ffffff",
                fontWeight: "800",
                fontSize: "0.88rem",
                cursor: "pointer",
                boxShadow: theme.glassShadow,
                transition: "all 0.15s ease"
              }}
            >
              {loading ? "Authenticating..." : "Sign In with Sovereign Security →"}
            </button>
          </form>
        ) : (
          /* STEP 2: MFA CHALLENGE */
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ fontSize: "2rem", marginBottom: "8px" }}>🔐</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: theme.textPrimary, margin: "0 0 6px 0" }}>
                Two-Factor Verification (MFA)
              </h3>
              <p style={{ fontSize: "0.8rem", color: theme.textSecondary, margin: 0, lineHeight: 1.4 }}>
                Enter the 6-digit security code from your registered Authenticator App or SMS token for <strong>{pendingUser?.full_name}</strong> ({pendingUser?.employee_code}).
              </p>
            </div>

            {/* OTP Input */}
            <div style={{ marginBottom: "18px", textAlign: "center" }}>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                style={{
                  width: "200px",
                  padding: "12px",
                  textAlign: "center",
                  fontSize: "1.6rem",
                  letterSpacing: "0.25em",
                  fontWeight: "800",
                  borderRadius: "12px",
                  border: `2px solid ${theme.border}`,
                  backgroundColor: theme.cardBgSecondary,
                  color: theme.textPrimary,
                  outline: "none",
                  boxShadow: theme.glassShadow
                }}
              />
              <div style={{ fontSize: "0.74rem", color: theme.textMuted, marginTop: "8px" }}>
                💡 Demo Passcode: <strong style={{ color: theme.textPrimary }}>123456</strong>
              </div>
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.textPrimary,
                color: theme.bg.includes("#090d16") ? "#000000" : "#ffffff",
                fontWeight: "800",
                fontSize: "0.88rem",
                cursor: otpCode.length >= 6 ? "pointer" : "not-allowed",
                boxShadow: theme.glassShadow,
                marginBottom: "10px",
                transition: "all 0.15s ease"
              }}
            >
              {loading ? "Verifying..." : "Verify & Launch Workspace →"}
            </button>

            {/* Back to Step 1 */}
            <button
              type="button"
              onClick={() => {
                setMfaStep(false);
                setOtpCode("");
                setErrorMessage(null);
              }}
              style={{
                width: "100%",
                padding: "8px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: "transparent",
                color: theme.textSecondary,
                fontSize: "0.78rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              ← Back to credentials login
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
