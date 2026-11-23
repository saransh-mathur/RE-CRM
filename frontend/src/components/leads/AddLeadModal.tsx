import React, { useState } from "react";
import { ThemeColors } from "../../lib/theme";
import { AdChannel } from "../../lib/leadAnalytics";

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateLead: (payload: {
    full_name: string;
    phone: string;
    source: string;
    property_type: string;
    preferred_location: string;
    assigned_agent_name: string;
    notes: string;
  }) => Promise<void>;
  onSimulateAdLead: (channel: AdChannel) => Promise<void>;
  theme: ThemeColors;
}

const CHANNEL_SOURCE_MAP: Array<{ label: string; value: string }> = [
  { label: "Meta (Facebook Ad)", value: "META_FB_AD" },
  { label: "WhatsApp Ad", value: "WHATSAPP_AD" },
  { label: "Instagram Reel / Story", value: "META_IG_REEL" },
  { label: "LinkedIn Lead Form", value: "LINKEDIN_LEAD_GEN" },
  { label: "Google Search Ad", value: "GOOGLE_ADS_SEARCH" },
  { label: "Website / Direct Call", value: "WEBSITE_DIRECT" }
];

const AGENTS = ["Dhruv Chaudhary", "Ananya Patel", "Vikram Malhotra", "Karan Mehta"];

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onCreateLead,
  onSimulateAdLead,
  theme
}) => {
  const [mode, setMode] = useState<"manual" | "simulate">("manual");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [source, setSource] = useState("WHATSAPP_AD");
  const [propertyType, setPropertyType] = useState("Residential Plots");
  const [location, setLocation] = useState("Dwarka Expressway, Gurugram");
  const [agent, setAgent] = useState("Dhruv Chaudhary");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Please enter the customer's full name.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onCreateLead({
        full_name: fullName.trim(),
        phone: phone.trim(),
        source,
        property_type: propertyType.trim() || "Residential Plots",
        preferred_location: location.trim() || "Gurugram",
        assigned_agent_name: agent,
        notes: notes.trim()
      });
      setFullName("");
      setPhone("");
      setNotes("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    marginTop: "5px",
    padding: "9px 12px",
    borderRadius: "8px",
    border: `1px solid ${theme.border}`,
    backgroundColor: theme.cardBgSecondary,
    color: theme.textPrimary,
    fontSize: "0.86rem",
    outline: "none",
    boxSizing: "border-box"
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add Lead"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 140,
        backgroundColor: "rgba(15, 23, 42, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(500px, 100%)",
          backgroundColor: theme.cardBg,
          borderRadius: "14px",
          border: `1px solid ${theme.border}`,
          boxShadow: theme.glassShadowGlow,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: theme.textPrimary, margin: 0 }}>
            Add New Lead
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add lead modal"
            style={{
              background: "none",
              border: "none",
              color: theme.textMuted,
              fontSize: "1.1rem",
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>

        {/* Simple 2-Tab Switcher: Enter Lead vs Test Ad Lead */}
        <div style={{ padding: "14px 20px 0 20px", display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setMode("manual")}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              border: `1px solid ${mode === "manual" ? theme.accentPrimary : theme.border}`,
              backgroundColor: mode === "manual" ? theme.accentBg : "transparent",
              color: mode === "manual" ? theme.accentPrimary : theme.textSecondary,
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Enter Lead Manually
          </button>
          <button
            type="button"
            onClick={() => setMode("simulate")}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "8px",
              border: `1px solid ${mode === "simulate" ? theme.accentPrimary : theme.border}`,
              backgroundColor: mode === "simulate" ? theme.accentBg : "transparent",
              color: mode === "simulate" ? theme.accentPrimary : theme.textSecondary,
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Test Incoming Ad Lead
          </button>
        </div>

        {mode === "manual" ? (
          <form onSubmit={handleSubmit} style={{ padding: "18px 20px 20px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {error && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "8px",
                  backgroundColor: theme.dangerBg,
                  border: `1px solid ${theme.dangerBorder}`,
                  color: theme.danger,
                  fontSize: "0.8rem",
                  fontWeight: 600
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: theme.textSecondary }}>
                Customer Name *
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Verma"
                  style={inputStyle}
                />
              </label>

              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: theme.textSecondary }}>
                Mobile Number
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 98110 22334"
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: theme.textSecondary }}>
                Ad Source
                <select value={source} onChange={(e) => setSource(e.target.value)} style={inputStyle}>
                  {CHANNEL_SOURCE_MAP.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: theme.textSecondary }}>
                Assign To Agent
                <select value={agent} onChange={(e) => setAgent(e.target.value)} style={inputStyle}>
                  {AGENTS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "12px" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: theme.textSecondary }}>
                Property Interest
                <input
                  type="text"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: theme.textSecondary }}>
                Preferred Location
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={{ fontSize: "0.8rem", fontWeight: 600, color: theme.textSecondary }}>
              Note (Optional)
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any budget or callback note..."
                style={{ ...inputStyle, fontFamily: "inherit" }}
              />
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: "transparent",
                  color: theme.textSecondary,
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: theme.primaryBtnBg,
                  color: theme.primaryBtnText,
                  fontSize: "0.84rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {submitting ? "Adding..." : "Save Lead"}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ padding: "18px 20px 22px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <p style={{ fontSize: "0.84rem", color: theme.textSecondary, margin: "0 0 6px 0", lineHeight: 1.45 }}>
              Click any platform below to test how a new advertisement lead arrives and automatically assigns to an agent:
            </p>
            {[
              { key: "META" as const, label: "Meta (Facebook) Instant Form", color: "#1877F2" },
              { key: "WHATSAPP" as const, label: "WhatsApp Click-to-Chat Ad", color: "#16A34A" },
              { key: "INSTAGRAM" as const, label: "Instagram Reel / Story Ad", color: "#E1306C" },
              { key: "LINKEDIN" as const, label: "LinkedIn Lead Gen Form", color: "#0A66C2" },
              { key: "GOOGLE" as const, label: "Google Search Ad", color: "#D97706" }
            ].map((ch) => (
              <button
                key={ch.key}
                type="button"
                onClick={async () => {
                  await onSimulateAdLead(ch.key);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 14px",
                  borderRadius: "10px",
                  border: `1px solid ${theme.border}`,
                  backgroundColor: theme.cardBgSecondary,
                  color: theme.textPrimary,
                  fontSize: "0.86rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "9px", height: "9px", borderRadius: "50%", backgroundColor: ch.color }} />
                  {ch.label}
                </span>
                <span style={{ fontSize: "0.78rem", color: theme.accentPrimary, fontWeight: 700 }}>
                  + Simulate
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
