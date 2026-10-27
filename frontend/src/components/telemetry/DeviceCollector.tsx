import React, { useEffect, useState } from "react";
import { ThemeColors } from "../../lib/theme";

interface DeviceCollectorProps {
  token: string;
  theme: ThemeColors;
  backendUrl?: string;
  onDeviceClassified?: (deviceType: string) => void;
}

export const DeviceCollector: React.FC<DeviceCollectorProps> = ({
  token,
  theme,
  backendUrl = "http://localhost:8000",
  onDeviceClassified
}) => {
  const [deviceInfo, setDeviceInfo] = useState<{
    deviceType: string;
    os: string;
    resolution: string;
    cores: number;
    fingerprint: string;
  } | null>(null);

  useEffect(() => {
    const collectTelemetry = async () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      let canvasHash = "generic_fp";
      if (ctx) {
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("ApexRealty-DLP-Fingerprint-2026", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("ApexRealty-DLP-Fingerprint-2026", 4, 17);
        const dataUrl = canvas.toDataURL();
        canvasHash = btoa(dataUrl.substring(dataUrl.length - 64));
      }

      const ua = navigator.userAgent;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/i.test(ua);
      
      let classifiedType = "DESKTOP";
      if (isMobile && !isTablet) {
        classifiedType = "MOBILE_PHONE";
      } else if (isTablet) {
        classifiedType = "TABLET";
      } else if (/Macintosh|Windows|Linux/.test(ua)) {
        classifiedType = "LAPTOP";
      }

      const screenRes = `${window.screen.width}x${window.screen.height}`;
      const cpuCores = navigator.hardwareConcurrency || 4;

      const info = {
        deviceType: classifiedType,
        os: navigator.platform || "Workstation",
        resolution: screenRes,
        cores: cpuCores,
        fingerprint: canvasHash
      };
      setDeviceInfo(info);
      if (onDeviceClassified) onDeviceClassified(classifiedType);

      try {
        await fetch(`${backendUrl}/api/v1/telemetry/device`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fingerprint_hash: canvasHash,
            device_type: classifiedType,
            os_name: info.os,
            browser_name: navigator.appName,
            screen_resolution: screenRes,
            cpu_cores: cpuCores,
            is_mobile: isMobile
          })
        });
      } catch (err) {}
    };

    if (token) {
      collectTelemetry();
    }
  }, [token, backendUrl]);

  if (!deviceInfo) return null;

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      padding: "5px 12px",
      borderRadius: "12px",
      fontSize: "0.74rem",
      backgroundColor: theme.cardBgSecondary,
      backdropFilter: theme.glassBackdrop,
      WebkitBackdropFilter: theme.glassBackdrop,
      color: theme.textSecondary,
      border: `1px solid ${theme.border}`,
      boxShadow: theme.glassShadow
    }}>
      <span>{deviceInfo.deviceType.includes("MOBILE") ? "📱" : "💻"} Device:</span>
      <span style={{ color: theme.textPrimary, fontWeight: "700" }}>{deviceInfo.deviceType}</span>
      <span style={{ color: theme.textMuted }}>• {deviceInfo.resolution}</span>
    </div>
  );
};
