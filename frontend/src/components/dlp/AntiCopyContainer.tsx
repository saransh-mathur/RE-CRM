import React, { useEffect } from "react";

interface AntiCopyContainerProps {
  children: React.ReactNode;
  backendUrl?: string;
  employeeCode?: string;
}

export const AntiCopyContainer: React.FC<AntiCopyContainerProps> = ({
  children,
  backendUrl = "http://localhost:8000",
  employeeCode = "AGENT"
}) => {
  useEffect(() => {
    // 1. Inject Print Protection Stylesheet
    const style = document.createElement("style");
    style.id = "dlp-print-protection";
    style.innerHTML = `
      @media print {
        body * {
          display: none !important;
          visibility: hidden !important;
        }
        body:after {
          content: "CONFIDENTIAL PROPERTY OF APEX REALTY. UNAUTHORIZED PRINTING IS PROHIBITED AND MONITORED.";
          display: block !important;
          visibility: visible !important;
          font-size: 24pt;
          color: red;
          text-align: center;
          padding-top: 50mm;
        }
      }
    `;
    document.head.appendChild(style);

    // 2. Intercept Keyboard Shortcuts (Ctrl+C, Ctrl+P, DevTools)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Print interception (Ctrl+P or Cmd+P)
      if (cmdOrCtrl && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
        reportDlpAlert("PRINT_ATTEMPTED", "HIGH", { key: e.key });
        alert("⚠️ Printing is disabled under Apex Realty Data Loss Prevention policies.");
        return false;
      }

      // Copy interception (Ctrl+C or Cmd+C)
      if (cmdOrCtrl && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        e.stopPropagation();
        reportDlpAlert("CLIPBOARD_COPY_BLOCKED", "MEDIUM", { key: e.key });
        return false;
      }

      // DevTools shortcuts (F12 or Ctrl+Shift+I / Cmd+Option+I)
      if (e.key === "F12" || (cmdOrCtrl && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j"))) {
        e.preventDefault();
        reportDlpAlert("DEVTOOLS_OPEN_ATTEMPT", "HIGH", { key: e.key });
        return false;
      }
    };

    const reportDlpAlert = (eventType: string, severity: string, details: Record<string, any>) => {
      fetch(`${backendUrl}/api/v1/telemetry/report-alert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: eventType,
          severity,
          details: { ...details, employee_code: employeeCode }
        })
      }).catch(() => {});
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      const printStyle = document.getElementById("dlp-print-protection");
      if (printStyle) printStyle.remove();
    };
  }, [backendUrl, employeeCode]);

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault(); // Disable Right-Click Context Menu
      }}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        minHeight: "100vh"
      }}
    >
      {children}
    </div>
  );
};
