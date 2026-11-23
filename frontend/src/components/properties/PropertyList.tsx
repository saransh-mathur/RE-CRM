import React, { useState } from "react";
import { ThemeColors } from "../../lib/theme";
import { formatIndianCurrency } from "../../lib/formatters";

export interface PropertyItem {
  id: string;
  title: string;
  project_name: string;
  property_type: string;
  location: string;
  price: number;
  price_formatted: string;
  carpet_area_sqft: number;
  bedrooms?: number;
  bathrooms?: number;
  status: string;
  roi_potential?: string;
  amenities?: string;
  image_url?: string;
  featured: boolean;
}

interface PropertyListProps {
  properties: PropertyItem[];
  theme: ThemeColors;
  onSelectProperty?: (prop: PropertyItem) => void;
}

export const PropertyList: React.FC<PropertyListProps> = ({ properties, theme, onSelectProperty }) => {
  const [filterType, setFilterType] = useState<string>("ALL");
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const filtered = properties.filter((p) => {
    if (filterType === "ALL") return true;
    return p.property_type.toLowerCase().includes(filterType.toLowerCase()) || p.status === filterType;
  });

  const getStatusBadge = (status: string) => {
    const isSold = status === "SOLD";
    return (
      <span
        style={{
          fontSize: "0.68rem",
          padding: "4px 10px",
          borderRadius: "999px",
          backgroundColor: isSold ? "rgba(185, 28, 28, 0.85)" : "rgba(4, 21, 16, 0.82)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          color: isSold ? "#ffffff" : "#E5C585",
          fontWeight: "700",
          border: "1px solid rgba(212, 175, 106, 0.42)",
          letterSpacing: "0.05em"
        }}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div>
      {/* Portfolio Header & Filters */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
            backgroundColor: theme.cardBgSecondary,
            padding: "5px",
            borderRadius: "12px",
            border: `1px solid ${theme.border}`
          }}
        >
          {[
            { key: "ALL", label: "All Assets" },
            { key: "Commercial", label: "Commercial" },
            { key: "Apartment", label: "Luxury Residences" },
            { key: "Penthouse", label: "Penthouse" },
            { key: "Plots", label: "Residential Plots" },
            { key: "AVAILABLE", label: "Available" }
          ].map((f) => {
            const active = filterType === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterType(f.key)}
                style={{
                  fontSize: "0.76rem",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${active ? theme.goldBorder : "transparent"}`,
                  cursor: "pointer",
                  backgroundColor: active ? theme.cardBgElevated : "transparent",
                  color: active ? theme.goldAccent : theme.textMuted,
                  fontWeight: active ? "700" : "500",
                  boxShadow: active ? theme.glassShadow : "none",
                  transition: "all 0.15s ease"
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: "0.82rem", color: theme.textMuted }}>
          Gurugram &amp; Delhi NCR Portfolio:{" "}
          <strong className="tabular-nums" style={{ color: theme.goldAccent }}>
            {filtered.length}
          </strong>{" "}
          RERA-Verified Projects
        </div>
      </div>

      {/* Property Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
          gap: "20px"
        }}
      >
        {filtered.map((p) => {
          let parsedAmenities: string[] = [];
          try {
            parsedAmenities = JSON.parse(p.amenities || "[]");
          } catch (e) {}

          const imgFailed = failedImages[p.id];

          return (
            <div
              key={p.id}
              onClick={() => onSelectProperty && onSelectProperty(p)}
              style={{
                backgroundColor: theme.cardBg,
                backdropFilter: theme.glassBackdrop,
                WebkitBackdropFilter: theme.glassBackdrop,
                borderRadius: "18px",
                border: theme.glassBorder,
                overflow: "hidden",
                transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
                cursor: "pointer",
                boxShadow: theme.glassShadow
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = theme.glassShadowGlow;
                e.currentTarget.style.borderColor = theme.goldAccent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = theme.glassShadow;
                e.currentTarget.style.borderColor = theme.border;
              }}
            >
              {/* Property Image with Price & ROI Capsule */}
              <div
                style={{
                  position: "relative",
                  height: "205px",
                  background: "linear-gradient(135deg, #041510 0%, #0d3628 60%, #1c4e3b 100%)",
                  overflow: "hidden"
                }}
              >
                {!imgFailed && p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.title}
                    referrerPolicy="no-referrer"
                    onError={() => setFailedImages((prev) => ({ ...prev, [p.id]: true }))}
                    style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease", display: "block" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#D4AF6A",
                      gap: "6px"
                    }}
                  >
                    <span className="font-display-serif" style={{ fontSize: "1.6rem", fontWeight: 700 }}>
                      {p.project_name}
                    </span>
                    <span style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#C8D9D2" }}>
                      Absolute Assets Exclusive
                    </span>
                  </div>
                )}

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(180deg, rgba(2,11,8,0.08) 0%, rgba(2,11,8,0.58) 100%)",
                    pointerEvents: "none"
                  }}
                />

                <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                  {getStatusBadge(p.status)}
                </div>

                {p.roi_potential && (
                  <div
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      backgroundColor: "rgba(4, 21, 16, 0.82)",
                      border: "1px solid rgba(212, 175, 106, 0.4)",
                      borderRadius: "8px",
                      padding: "4px 9px",
                      color: "#F7FAF8",
                      fontSize: "0.68rem",
                      fontWeight: "700"
                    }}
                  >
                    ✦ {p.roi_potential}
                  </div>
                )}

                <div
                  className="tabular-nums"
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "12px",
                    backgroundColor: "rgba(4, 21, 16, 0.86)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    padding: "5px 12px",
                    borderRadius: "10px",
                    color: "#E5C585",
                    fontWeight: "800",
                    fontSize: "1rem",
                    border: "1px solid rgba(212, 175, 106, 0.42)"
                  }}
                >
                  {p.price_formatted || formatIndianCurrency(p.price)}
                </div>
              </div>

              {/* Property Details */}
              <div style={{ padding: "18px" }}>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: theme.goldAccent,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em"
                  }}
                >
                  {p.project_name}
                </div>
                <h3
                  style={{
                    fontSize: "1.04rem",
                    fontWeight: "700",
                    color: theme.textPrimary,
                    margin: "4px 0 6px 0",
                    letterSpacing: "-0.01em"
                  }}
                >
                  {p.title}
                </h3>
                <div style={{ fontSize: "0.78rem", color: theme.textMuted, display: "flex", alignItems: "center", gap: "4px", marginBottom: "14px" }}>
                  📍 {p.location}
                </div>

                {/* Specs Divider */}
                <div
                  className="tabular-nums"
                  style={{
                    display: "flex",
                    gap: "14px",
                    padding: "10px 0",
                    borderTop: `1px solid ${theme.border}`,
                    borderBottom: `1px solid ${theme.border}`,
                    fontSize: "0.78rem",
                    color: theme.textSecondary,
                    marginBottom: "14px"
                  }}
                >
                  <div>📐 {p.carpet_area_sqft.toLocaleString()} sq.ft</div>
                  {p.bedrooms != null && p.bedrooms > 0 && <div>🛏️ {p.bedrooms} Beds</div>}
                  {p.bathrooms != null && p.bathrooms > 0 && <div>🚿 {p.bathrooms} Baths</div>}
                </div>

                {/* Amenity Badges */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {parsedAmenities.slice(0, 3).map((a, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "0.7rem",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        backgroundColor: theme.cardBgSecondary,
                        color: theme.textSecondary,
                        border: `1px solid ${theme.border}`
                      }}
                    >
                      {a}
                    </span>
                  ))}
                  {parsedAmenities.length > 3 && (
                    <span style={{ fontSize: "0.7rem", color: theme.textMuted, alignSelf: "center" }}>
                      +{parsedAmenities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
