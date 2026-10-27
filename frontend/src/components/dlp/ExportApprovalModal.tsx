import React, { useState } from "react";
import { ThemeColors } from "../../lib/theme";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  theme: ThemeColors;
  totalLeadsCount: number;
  backendUrl?: string;
}

export const ExportApprovalModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  token,
  theme,
  totalLeadsCount,
  backendUrl = "http://localhost:8000"
}) => {
  const [reason, setReason] = useState("");
  const [recordsCount, setRecordsCount] = useState(Math.min(totalLeadsCount || 10, 50));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMessage("Business justification is mandatory for data export requests.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const resp = await fetch(`${backendUrl}/api/v1/exports/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          reason,
          records_count: Number(recordsCount)
        })
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || "Failed to submit export request");
      }

      const data = await resp.json();
      setSuccessMessage(`Request #${data.id.substring(0, 8)} submitted. Awaiting manager approval under Four-Eyes Policy.`);
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
        setReason("");
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      backgroundColor: "rgba(15, 23, 42, 0.4)",
      backdropFilter: "blur(18px)",
      WebkitBackdropFilter: "blur(18px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100000,
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: theme.cardBgElevated,
        backdropFilter: theme.glassBackdrop,
        WebkitBackdropFilter: theme.glassBackdrop,
        color: theme.textPrimary,
        borderRadius: "20px",
        padding: "26px",
        width: "100%",
        maxWidth: "500px",
        boxShadow: theme.glassShadowGlow,
        border: theme.glassBorder
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: theme.textPrimary, margin: 0, letterSpacing: "-0.01em" }}>
            🛡️ Request Lead Data Export
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: `1px solid ${theme.border}`,
              color: theme.textSecondary,
              cursor: "pointer",
              fontSize: "1rem",
              padding: "4px 8px",
              borderRadius: "8px",
              lineHeight: 1
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          backgroundColor: theme.cardBgSecondary,
          border: `1px solid ${theme.border}`,
          padding: "14px",
          borderRadius: "12px",
          fontSize: "0.8rem",
          color: theme.textSecondary,
          marginBottom: "16px",
          lineHeight: 1.45
        }}>
          <strong style={{ color: theme.textPrimary }}>Four-Eyes Governance:</strong> Bulk exports require dual authorization. Submitting sends an automated ticket to management. The exported CSV will contain cryptographic tracking watermarks.
        </div>

        {errorMessage && (
          <div style={{
            padding: "10px 14px",
            backgroundColor: theme.cardBgSecondary,
            color: theme.textPrimary,
            borderRadius: "8px",
            marginBottom: "14px",
            fontSize: "0.82rem",
            border: `1px solid ${theme.border}`
          }}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{
            padding: "10px 14px",
            backgroundColor: theme.cardBgSecondary,
            color: theme.textPrimary,
            borderRadius: "8px",
            marginBottom: "14px",
            fontSize: "0.82rem",
            border: `1px solid ${theme.border}`,
            fontWeight: "600"
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: theme.textSecondary, marginBottom: "6px" }}>
              Records Count (Max 50)
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={recordsCount}
              onChange={(e) => setRecordsCount(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBgSecondary,
                color: theme.textPrimary,
                outline: "none",
                fontSize: "0.85rem"
              }}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: theme.textSecondary, marginBottom: "6px" }}>
              Business Justification / Reason *
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Preparing quarterly review for High Net Worth client meeting..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.cardBgSecondary,
                color: theme.textPrimary,
                outline: "none",
                resize: "none",
                fontSize: "0.82rem",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                backgroundColor: "transparent",
                color: theme.textSecondary,
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "0.82rem"
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "8px 18px",
                borderRadius: "8px",
                border: `1px solid ${theme.border}`,
                backgroundColor: theme.textPrimary,
                color: theme.bg.includes("#090d16") ? "#000000" : "#ffffff",
                fontWeight: "700",
                fontSize: "0.82rem",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                transition: "all 0.15s ease"
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
