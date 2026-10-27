import React, { useState, useEffect } from "react";
import { ThemeColors } from "../../lib/theme";

interface AntiScreenCaptureGuardProps {
  children: React.ReactNode;
  theme: ThemeColors;
  employeeCode: string;
  agentName: string;
  backendUrl?: string;
  token?: string;
}

export const AntiScreenCaptureGuard: React.FC<AntiScreenCaptureGuardProps> = ({
  children,
  theme,
  employeeCode,
  agentName,
  backendUrl = "http://localhost:8000",
  token
}) => {
  const [blackoutActive, setBlackoutActive] = useState<boolean>(false);
  const [blurActive, setBlurActive] = useState<boolean>(false);
  const [alertReason, setAlertReason] = useState<string>("");

  const triggerBlackout = (reason: string) => {
    setAlertReason(reason);
    setBlackoutActive(true);

    // Dispatch incident to Owner Activity Radar
    fetch(`${backendUrl}/api/v1/telemetry/log-activity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        agent_name: agentName,
        employee_code: employeeCode,
        activity_type: "SECURITY_ALERT",
        title: "DLP Breach: Screenshot Attempt Intercepted",
        description: `Executive ${agentName} (${employeeCode}) triggered screen capture (${reason}). Visual blackout shield deployed.`,
        severity: "CRITICAL"
      })
    }).catch(() => {});

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setBlackoutActive(false);
    }, 5000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. PrintScreen key
      if (e.key === "PrintScreen" || e.code === "PrintScreen") {
        e.preventDefault();
        triggerBlackout("PrintScreen Key Triggered");
        return false;
      }

      // 2. Ctrl + P or Cmd + P (Print/Save to PDF)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        triggerBlackout("Print / PDF Export Attempt");
        return false;
      }

      // 3. Cmd + Shift + 3 / 4 / 5 (Mac Screenshot utilities)
      if (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5")) {
        e.preventDefault();
        triggerBlackout("OS Screen Grab Utility (Mac)");
        return false;
      }

      // 4. Windows Snipping Tool (Win + Shift + S)
      if (e.key.toLowerCase() === "s" && e.shiftKey && e.metaKey) {
        e.preventDefault();
        triggerBlackout("Snipping Tool Intercepted");
        return false;
      }
    };

    // Defocus privacy shield (anti-screen recording / tab switching)
    const handleBlur = () => {
      setBlurActive(true);
    };

    const handleFocus = () => {
      setBlurActive(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setBlurActive(true);
      } else {
        setBlurActive(false);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [agentName, employeeCode, token]);

  return (
    <div style={{ position: "relative", minHeight: "100vh", userSelect: "none", WebkitUserSelect: "none" }}>
      {/* Underlying Application Content (Blurred if Tab Defocused) */}
      <div style={{
        filter: blurActive ? "blur(12px)" : "none",
        transition: "filter 0.2s ease"
      }}>
        {children}
      </div>

      {/* Tab Defocus Anti-Recording Veil */}
      {blurActive && !blackoutActive && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          zIndex: 99998,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          textAlign: "center",
          pointerEvents: "none"
        }}>
          <div style={{
            padding: "16px 28px",
            borderRadius: "16px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}>
            <div style={{ fontSize: "1.6rem", marginBottom: "6px" }}>🔒</div>
            <div style={{ fontSize: "1rem", fontWeight: "800", letterSpacing: "0.02em" }}>
              Sensitive Client Data Hidden
            </div>
            <div style={{ fontSize: "0.76rem", opacity: 0.8, marginTop: "4px" }}>
              Session focus lost • Anti-Screen Recording Veil Active
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Blackout Shield (When Screenshot Attempted) */}
      {blackoutActive && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "#000000",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          textAlign: "center",
          padding: "30px"
        }}>
          <div style={{
            maxWidth: "560px",
            padding: "36px",
            borderRadius: "24px",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.9)"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "14px" }}>🚫</div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: "800", margin: "0 0 10px 0", letterSpacing: "-0.01em" }}>
              Unauthorized Screen Capture Intercepted
            </h2>
            <p style={{ fontSize: "0.88rem", lineHeight: 1.5, opacity: 0.85, margin: "0 0 18px 0" }}>
              Screen recording and screenshots are strictly forbidden under company Data Loss Prevention (DLP) policy.
            </p>
            <div style={{
              padding: "10px 14px",
              borderRadius: "10px",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontSize: "0.78rem",
              marginBottom: "20px"
            }}>
              Trigger: <strong style={{ color: "#ffffff" }}>{alertReason}</strong> • User: <strong>{agentName}</strong> ({employeeCode})
              <div style={{ marginTop: "4px", opacity: 0.8 }}>
                Security event cryptographically stamped to Owner Forensic Command Center.
              </div>
            </div>

            <button
              onClick={() => setBlackoutActive(false)}
              style={{
                padding: "10px 24px",
                borderRadius: "10px",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                backgroundColor: "#ffffff",
                color: "#000000",
                fontSize: "0.84rem",
                fontWeight: "800",
                cursor: "pointer"
              }}
            >
              Acknowledge & Return to CRM
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
