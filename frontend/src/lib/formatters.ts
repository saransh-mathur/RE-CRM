/**
 * Indian Real Estate Currency Formatting Utility
 * Correctly adheres to Indian numbering conventions:
 * - >= 1 Crore (100 Lakhs / 10,000,000) -> "₹X.XX Cr" (e.g., ₹1.49 Cr, ₹7.25 Cr)
 * - >= 1 Lakh (100,000) -> "₹X.X Lakhs" (e.g., ₹14.5 Lakhs, ₹85.0 Lakhs)
 * - < 1 Lakh -> "₹XX,XXX" (en-IN comma formatting)
 */

export const formatIndianCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(amount) || amount === 0) {
    return "₹0";
  }

  const absAmount = Math.abs(amount);

  if (absAmount >= 10000000) {
    const cr = amount / 10000000;
    // Format to 2 decimal places, trimming trailing zeros if clean (e.g. 1.5 Cr instead of 1.50 Cr, or 1.49 Cr)
    const formatted = cr.toFixed(2).replace(/\.?0+$/, "");
    return `₹${formatted} Cr`;
  }

  if (absAmount >= 100000) {
    const lakhs = amount / 100000;
    const formatted = lakhs.toFixed(1).replace(/\.0$/, "");
    return `₹${formatted} Lakhs`;
  }

  return `₹${amount.toLocaleString("en-IN")}`;
};

export const formatBudgetRange = (min?: number | null, max?: number | null): string => {
  if (min && max) {
    return `${formatIndianCurrency(min)} - ${formatIndianCurrency(max)}`;
  }
  if (max) {
    return `Up to ${formatIndianCurrency(max)}`;
  }
  if (min) {
    return `From ${formatIndianCurrency(min)}`;
  }
  return "Budget On Request";
};
