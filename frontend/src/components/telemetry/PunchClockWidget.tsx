import React, { useState, useEffect } from "react";
import { ThemeColors } from "../../lib/theme";

interface PunchClockProps {
  initialPunchedIn: boolean;
  token: string;
  theme: ThemeColors;
  backendUrl?: string;
  onPunchStatusChange?: (isPunchedIn: boolean) => void;
}

export const PunchClockWidget: React.FC<PunchClockProps> = ({
  initialPunchedIn,
  token,
  theme,
  backendUrl = "http://localhost:8000",
  onPunchStatusChange
}) => {
  const [isPunchedIn, setIsPunchedIn] = useState(initialPunchedIn);
  const [loading, setLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (isPunchedIn) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isPunchedIn]);

  const getCoordinates = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCurrentCoords(coords);
            resolve(coords);
          },
          () => {
            const mock = { lat: 19.0760, lng: 72.8777 };
            setCurrentCoords(mock);
            resolve(mock);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        resolve(null);
      }
    });
  };

  const handleTogglePunch = async () => {
    setLoading(true);
    const nextAction = isPunchedIn ? "PUNCH_OUT" : "PUNCH_IN";
    const coords = await getCoordinates();

    try {
      const resp = await fetch(`${backendUrl}/api/v1/telemetry/punch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action: nextAction,
          latitude: coords?.lat,
          longitude: coords?.lng
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setIsPunchedIn(data.is_punched_in);
        if (onPunchStatusChange) onPunchStatusChange(data.is_punched_in);
      }
    } catch (err) {
      alert("Failed to update punch clock. Please check connectivity.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      backgroundColor: theme.cardBgSecondary,
      backdropFilter: theme.glassBackdrop,
      WebkitBackdropFilter: theme.glassBackdrop,
      padding: "5px 12px",
      borderRadius: "12px",
      border: `1px solid ${theme.border}`,
      boxShadow: theme.glassShadow
    }}>
      {/* Shift Status Indicator (Clean crystal pill) */}
      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
        <span style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          backgroundColor: isPunchedIn ? theme.crystalAccent : theme.textMuted,
          boxShadow: isPunchedIn ? `0 0 6px ${theme.crystalAccent}` : "none"
        }} />
        <div>
          <div style={{ fontSize: "0.68rem", color: theme.textMuted, fontWeight: "600" }}>
            Shift Status
          </div>
          <div style={{ fontSize: "0.76rem", fontWeight: "700", color: theme.textPrimary }}>
            {isPunchedIn ? "Active Shift" : "Concluded"}
          </div>
        </div>
      </div>

      {/* Live Working Hours Stopwatch */}
      {isPunchedIn && (
        <div style={{ borderLeft: `1px solid ${theme.border}`, paddingLeft: "10px" }}>
          <div style={{ fontSize: "0.68rem", color: theme.textMuted, fontWeight: "600" }}>Logged</div>
          <div style={{ fontSize: "0.8rem", fontWeight: "700", color: theme.textPrimary, fontFamily: "monospace" }}>
            {formatTime(elapsedSeconds)}
          </div>
        </div>
      )}

      {/* GPS Geolocation Ping Indicator */}
      {currentCoords && (
        <div style={{ borderLeft: `1px solid ${theme.border}`, paddingLeft: "10px", fontSize: "0.68rem", color: theme.textSecondary }}>
          <div style={{ color: theme.textMuted, fontWeight: "600" }}>Location</div>
          <div style={{ color: theme.textPrimary, fontFamily: "monospace", fontWeight: "600" }}>
            📍 {currentCoords.lat.toFixed(2)}, {currentCoords.lng.toFixed(2)}
          </div>
        </div>
      )}

      {/* Toggle Button (Crystal Glass Pill) */}
      <button
        onClick={handleTogglePunch}
        disabled={loading}
        style={{
          marginLeft: "auto",
          padding: "5px 10px",
          borderRadius: "8px",
          fontWeight: "600",
          fontSize: "0.74rem",
          cursor: loading ? "wait" : "pointer",
          border: `1px solid ${theme.border}`,
          backgroundColor: theme.cardBgElevated,
          color: theme.textPrimary,
          transition: "all 0.15s ease",
          boxShadow: theme.glassShadow
        }}
      >
        {loading ? "..." : isPunchedIn ? "Punch Out" : "Punch In"}
      </button>
    </div>
  );
};
