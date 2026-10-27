import React, { useEffect, useRef, useState } from "react";
import { ThemeMode } from "../../lib/theme";

interface WatermarkProps {
  agentName: string;
  employeeCode: string;
  ipAddress?: string;
  backendUrl?: string;
  themeMode?: ThemeMode;
}

export const DynamicCanvasWatermark: React.FC<WatermarkProps> = ({
  agentName,
  employeeCode,
  ipAddress = "127.0.0.1",
  backendUrl = "http://localhost:8000",
  themeMode = "light"
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tamperDetected, setTamperDetected] = useState(false);
  const [timestamp, setTimestamp] = useState<string>(new Date().toISOString());

  // Periodically refresh the forensic watermark timestamp
  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC");
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const watermarkText = `${agentName} [${employeeCode}] • IP:${ipAddress} • ${timestamp}`;

  const renderCanvas = () => {
    if (!containerRef.current) return;

    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }

    const canvas = document.createElement("canvas");
    canvas.id = "dlp-watermark-canvas";
    canvas.width = 460;
    canvas.height = 200;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.rotate((-22 * Math.PI) / 180);
      ctx.font = "600 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      
      // Semi-transparent neutral font
      ctx.fillStyle = themeMode === "light" 
        ? "rgba(51, 65, 85, 0.45)" 
        : "rgba(255, 255, 255, 0.40)";
        
      ctx.fillText(watermarkText, -30, 90);
      ctx.fillText(`CONFIDENTIAL • APEX SOVEREIGN REALTY DLP`, -30, 120);
    }

    const patternUrl = canvas.toDataURL("image/png");
    const overlayDiv = document.createElement("div");
    overlayDiv.id = "dlp-watermark-overlay";
    overlayDiv.style.position = "fixed";
    overlayDiv.style.top = "0";
    overlayDiv.style.left = "0";
    overlayDiv.style.width = "100vw";
    overlayDiv.style.height = "100vh";
    overlayDiv.style.pointerEvents = "none";
    overlayDiv.style.zIndex = "999990";
    overlayDiv.style.backgroundImage = `url(${patternUrl})`;
    overlayDiv.style.backgroundRepeat = "repeat";
    // Exactly 20% visible as requested by the client
    overlayDiv.style.opacity = "0.20";

    containerRef.current.appendChild(overlayDiv);
  };

  useEffect(() => {
    renderCanvas();

    const targetNode = containerRef.current;
    if (!targetNode) return;

    const observer = new MutationObserver((mutations) => {
      let tampered = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.removedNodes.length > 0) {
          tampered = true;
        }
        if (mutation.type === "attributes") {
          const target = mutation.target as HTMLElement;
          if (
            target.style.display === "none" ||
            target.style.visibility === "hidden"
          ) {
            tampered = true;
          }
        }
      }

      if (tampered) {
        setTamperDetected(true);
        fetch(`${backendUrl}/api/v1/telemetry/report-alert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "WATERMARK_TAMPER_ATTEMPT",
            severity: "CRITICAL",
            details: { employee_code: employeeCode, url: window.location.href }
          })
        }).catch(() => {});

        setTimeout(() => {
          renderCanvas();
          setTamperDetected(false);
        }, 400);
      }
    });

    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class", "hidden"]
    });

    return () => observer.disconnect();
  }, [watermarkText, themeMode]);

  return (
    <>
      <div ref={containerRef} aria-hidden="true" style={{ pointerEvents: "none" }} />
      {tamperDetected && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.96)",
          color: "#f43f5e",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000000,
          fontFamily: "system-ui, sans-serif"
        }}>
          <h2 style={{ fontSize: "2rem", fontWeight: "bold" }}>🚨 DLP SECURITY TAMPER ALERT</h2>
          <p style={{ marginTop: "1rem", color: "#cbd5e1" }}>
            Watermark tampering detected. Incident registered to immutable security audit ledger.
          </p>
        </div>
      )}
    </>
  );
};
