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

  const filtered = properties.filter((p) => {
    if (filterType === "ALL") return true;
    return p.property_type.includes(filterType) || p.status === filterType;
  });

  const getStatusBadge = (status: string) => {
    return (
      <span style={{
        fontSize: "0.68rem",
        padding: "3px 9px",
        borderRadius: "999px",
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        color: "#ffffff",
        fontWeight: "700",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        letterSpacing: "0.04em"
      }}>
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div>
      {/* Property Filters (Frosted Crystal Segmented Control) */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{
          display: "flex",
          gap: "6px",
          flexWrap: "wrap",
          backgroundColor: theme.cardBgSecondary,
          padding: "5px",
          borderRadius: "12px",
          border: `1px solid ${theme.border}`
        }}>
          {["ALL", "Villa", "Apartment", "Penthouse", "Commercial", "AVAILABLE"].map((f) => {
            const active = filterType === f;
            return (
              <button
                key={f}
                onClick={() => setFilterType(f)}
                style={{
                  fontSize: "0.76rem",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: `1px solid ${active ? theme.border : "transparent"}`,
                  cursor: "pointer",
                  backgroundColor: active ? theme.cardBgElevated : "transparent",
                  color: active ? theme.textPrimary : theme.textMuted,
                  fontWeight: active ? "700" : "500",
                  boxShadow: active ? theme.glassShadow : "none",
                  transition: "all 0.15s ease"
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: "0.82rem", color: theme.textMuted }}>
          Catalog: <strong style={{ color: theme.textPrimary }}>{filtered.length}</strong> Prime Assets
        </div>
      </div>

      {/* Property Cards Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "22px"
      }}>
        {filtered.map((p) => {
          let parsedAmenities: string[] = [];
          try {
            parsedAmenities = JSON.parse(p.amenities || "[]");
          } catch (e) {}

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
                transition: "transform 0.25s ease, box-shadow 0.25s ease",
                cursor: "pointer",
                boxShadow: theme.glassShadow
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = theme.glassShadowGlow;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = theme.glassShadow;
              }}
            >
              {/* Property Image with Price Tag */}
              <div style={{ position: "relative", height: "200px", backgroundColor: theme.cardBgSecondary, overflow: "hidden" }}>
                <img
                  src={p.image_url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80"}
                  alt={p.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                />
                <div style={{ position: "absolute", top: "12px", right: "12px" }}>
                  {getStatusBadge(p.status)}
                </div>
                {/* Floating Glass Price Capsule */}
                <div style={{
                  position: "absolute",
                  bottom: "12px",
                  left: "12px",
                  backgroundColor: "rgba(15, 23, 42, 0.78)",
                  backdropFilter: "blur(14px)",
                  WebkitBackdropFilter: "blur(14px)",
                  padding: "5px 12px",
                  borderRadius: "10px",
                  color: "#ffffff",
                  fontWeight: "800",
                  fontSize: "1rem",
                  letterSpacing: "-0.01em",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                }}>
                  {p.price_formatted || formatIndianCurrency(p.price)}
                </div>
              </div>

              {/* Property Details */}
              <div style={{ padding: "18px" }}>
                <div style={{ fontSize: "0.72rem", color: theme.textMuted, fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  {p.project_name}
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: theme.textPrimary, margin: "4px 0 6px 0", letterSpacing: "-0.01em" }}>
                  {p.title}
                </h3>
                <div style={{ fontSize: "0.78rem", color: theme.textMuted, display: "flex", alignItems: "center", gap: "4px", marginBottom: "14px" }}>
                  📍 {p.location}
                </div>

                {/* Specs Divider */}
                <div style={{
                  display: "flex",
                  gap: "14px",
                  padding: "10px 0",
                  borderTop: `1px solid ${theme.border}`,
                  borderBottom: `1px solid ${theme.border}`,
                  fontSize: "0.78rem",
                  color: theme.textSecondary,
                  marginBottom: "14px"
                }}>
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
