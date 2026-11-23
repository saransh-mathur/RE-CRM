export type LeadDisposition =
  | "PENDING"
  | "QUALIFIED"
  | "CALL_NOT_PICK"
  | "SITE_VISIT_SCHEDULED"
  | "SITE_VISIT_DONE"
  | "VIRTUAL_MEETING"
  | "NOT_INTERESTED"
  | "CLOSED_DEAL"
  | "BROKER"
  | "FOLLOW_UP";

export type LeadSummaryFilterKey =
  | "ALL"
  | "MY_CREATED"
  | "FOLLOW_UP"
  | "SITE_VISIT_DONE"
  | "NOT_YET_CONNECTED"
  | "BOOKED"
  | "PENDING";

export type AdChannel =
  | "META"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "LINKEDIN"
  | "GOOGLE"
  | "WEBSITE";

export interface AdChannelMeta {
  key: AdChannel;
  label: string;
  shortLabel: string;
  color: string;
  softBgLight: string;
  softBgDark: string;
}

export const AD_CHANNEL_META: AdChannelMeta[] = [
  {
    key: "META",
    label: "Meta (Facebook)",
    shortLabel: "Meta",
    color: "#1877F2",
    softBgLight: "#EFF6FF",
    softBgDark: "rgba(24, 119, 242, 0.16)"
  },
  {
    key: "WHATSAPP",
    label: "WhatsApp",
    shortLabel: "WhatsApp",
    color: "#16A34A",
    softBgLight: "#F0FDF4",
    softBgDark: "rgba(22, 163, 74, 0.16)"
  },
  {
    key: "INSTAGRAM",
    label: "Instagram",
    shortLabel: "Instagram",
    color: "#E1306C",
    softBgLight: "#FDF2F8",
    softBgDark: "rgba(225, 48, 108, 0.16)"
  },
  {
    key: "LINKEDIN",
    label: "LinkedIn",
    shortLabel: "LinkedIn",
    color: "#0A66C2",
    softBgLight: "#EFF6FF",
    softBgDark: "rgba(10, 102, 194, 0.18)"
  },
  {
    key: "GOOGLE",
    label: "Google Ads",
    shortLabel: "Google",
    color: "#D97706",
    softBgLight: "#FFFBEB",
    softBgDark: "rgba(217, 119, 6, 0.16)"
  },
  {
    key: "WEBSITE",
    label: "Website & Direct",
    shortLabel: "Website",
    color: "#0F766E",
    softBgLight: "#F0FDFA",
    softBgDark: "rgba(15, 118, 110, 0.18)"
  }
];

export interface AnalyticsLeadLike {
  id: string;
  full_name: string;
  status: string;
  source?: string;
  disposition?: LeadDisposition;
  assigned_agent_name?: string;
  created_by_me?: boolean;
  created_at: string;
  lead_code?: string;
  is_sla_breached?: boolean;
  poaching_risk_score?: string;
  offline_closing_flag?: boolean;
}

export interface CallLogLike {
  id: string;
  start_time: string;
  caller_name?: string;
  caller_code?: string;
}

export interface ActivityLike {
  id: string;
  timestamp: string;
  agent_name: string;
  employee_code?: string;
  activity_type: string;
  severity?: string;
}

export interface DispositionMeta {
  key: LeadDisposition;
  label: string;
  shortLabel: string;
  color: string;
  pillBgLight: string;
  pillTextLight: string;
  pillBgDark: string;
  pillTextDark: string;
}

export const DISPOSITION_META: DispositionMeta[] = [
  {
    key: "PENDING",
    label: "Pending",
    shortLabel: "Pending",
    color: "#F5B700",
    pillBgLight: "#FEF3C7",
    pillTextLight: "#92400E",
    pillBgDark: "rgba(245, 183, 0, 0.16)",
    pillTextDark: "#FCD34D"
  },
  {
    key: "QUALIFIED",
    label: "Qualified",
    shortLabel: "Qualified",
    color: "#2563EB",
    pillBgLight: "#DBEAFE",
    pillTextLight: "#1E40AF",
    pillBgDark: "rgba(37, 99, 235, 0.2)",
    pillTextDark: "#93C5FD"
  },
  {
    key: "CALL_NOT_PICK",
    label: "Call Not Pick",
    shortLabel: "Call not pick",
    color: "#EF4444",
    pillBgLight: "#FEF3E2",
    pillTextLight: "#9A3412",
    pillBgDark: "rgba(239, 68, 68, 0.18)",
    pillTextDark: "#FCA5A5"
  },
  {
    key: "SITE_VISIT_SCHEDULED",
    label: "Site Visit Scheduled",
    shortLabel: "Site Visit Sched.",
    color: "#F97316",
    pillBgLight: "#FFEDD5",
    pillTextLight: "#9A3412",
    pillBgDark: "rgba(249, 115, 22, 0.18)",
    pillTextDark: "#FDBA74"
  },
  {
    key: "SITE_VISIT_DONE",
    label: "Site Visit Done",
    shortLabel: "Site Visit Done",
    color: "#22C55E",
    pillBgLight: "#DCFCE7",
    pillTextLight: "#166534",
    pillBgDark: "rgba(34, 197, 94, 0.18)",
    pillTextDark: "#86EFAC"
  },
  {
    key: "VIRTUAL_MEETING",
    label: "Virtual Meeting",
    shortLabel: "Virtual Meeting",
    color: "#14B8A6",
    pillBgLight: "#CCFBF1",
    pillTextLight: "#115E59",
    pillBgDark: "rgba(20, 184, 166, 0.18)",
    pillTextDark: "#5EEAD4"
  },
  {
    key: "NOT_INTERESTED",
    label: "Not Interested",
    shortLabel: "Not Interested",
    color: "#64748B",
    pillBgLight: "#F1F5F9",
    pillTextLight: "#334155",
    pillBgDark: "rgba(100, 116, 139, 0.24)",
    pillTextDark: "#CBD5E1"
  },
  {
    key: "CLOSED_DEAL",
    label: "Closed Deal",
    shortLabel: "Closed Deal",
    color: "#15803D",
    pillBgLight: "#DCFCE7",
    pillTextLight: "#14532D",
    pillBgDark: "rgba(21, 128, 61, 0.24)",
    pillTextDark: "#4ADE80"
  },
  {
    key: "BROKER",
    label: "Broker",
    shortLabel: "Broker",
    color: "#8B5CF6",
    pillBgLight: "#EDE9FE",
    pillTextLight: "#5B21B6",
    pillBgDark: "rgba(139, 92, 246, 0.2)",
    pillTextDark: "#C4B5FD"
  },
  {
    key: "FOLLOW_UP",
    label: "Follow Up",
    shortLabel: "Follow Up",
    color: "#06B6D4",
    pillBgLight: "#CFFAFE",
    pillTextLight: "#155E75",
    pillBgDark: "rgba(6, 182, 212, 0.18)",
    pillTextDark: "#67E8F9"
  }
];

const VALID_DISPOSITIONS = new Set<string>(DISPOSITION_META.map((d) => d.key));

export function getDispositionMeta(disposition: LeadDisposition): DispositionMeta {
  return DISPOSITION_META.find((d) => d.key === disposition) || DISPOSITION_META[0];
}

/**
 * Normalizes a lead's telecalling disposition, falling back deterministically from pipeline status
 * for legacy/backend leads that do not specify an explicit disposition.
 */
export function normalizeLeadDisposition(lead: Pick<AnalyticsLeadLike, "status" | "disposition">): LeadDisposition {
  if (lead.disposition && VALID_DISPOSITIONS.has(lead.disposition)) {
    return lead.disposition;
  }

  switch ((lead.status || "").toUpperCase()) {
    case "WON":
      return "CLOSED_DEAL";
    case "LOST":
      return "NOT_INTERESTED";
    case "SITE_VISIT":
      return "SITE_VISIT_DONE";
    case "SITE_VISIT_SCHEDULED":
      return "SITE_VISIT_SCHEDULED";
    case "NEGOTIATION":
    case "OFFER":
      return "QUALIFIED";
    case "CONTACTED":
      return "FOLLOW_UP";
    case "NEW":
    default:
      return "PENDING";
  }
}

/**
 * Maps a telecalling disposition back to the nearest core CRM pipeline stage.
 */
export function dispositionToPipelineStatus(disposition: LeadDisposition): string {
  switch (disposition) {
    case "CLOSED_DEAL":
      return "WON";
    case "NOT_INTERESTED":
    case "BROKER":
      return "LOST";
    case "SITE_VISIT_SCHEDULED":
      return "SITE_VISIT_SCHEDULED";
    case "SITE_VISIT_DONE":
      return "SITE_VISIT";
    case "QUALIFIED":
    case "VIRTUAL_MEETING":
      return "NEGOTIATION";
    case "FOLLOW_UP":
      return "CONTACTED";
    case "CALL_NOT_PICK":
    case "PENDING":
    default:
      return "NEW";
  }
}

export interface LeadAnalyticsSlice {
  key: LeadDisposition;
  label: string;
  color: string;
  count: number;
  percentage: number;
  startAngle: number;
  endAngle: number;
  pathData: string;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians)
  };
}

function createPieSlicePath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const sweep = endAngle - startAngle;
  if (sweep <= 0) return "";

  // Full 360-degree circle needs two 180-degree arcs in SVG
  if (sweep >= 359.99) {
    const top = polarToCartesian(cx, cy, radius, 0);
    const bottom = polarToCartesian(cx, cy, radius, 180);
    return [
      `M ${cx} ${cy}`,
      `L ${top.x.toFixed(3)} ${top.y.toFixed(3)}`,
      `A ${radius} ${radius} 0 1 1 ${bottom.x.toFixed(3)} ${bottom.y.toFixed(3)}`,
      `A ${radius} ${radius} 0 1 1 ${top.x.toFixed(3)} ${top.y.toFixed(3)}`,
      "Z"
    ].join(" ");
  }

  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = sweep > 180 ? "1" : "0";

  return [
    `M ${cx} ${cy}`,
    `L ${end.x.toFixed(3)} ${end.y.toFixed(3)}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${start.x.toFixed(3)} ${start.y.toFixed(3)}`,
    "Z"
  ].join(" ");
}

export function computeLeadAnalytics(
  leads: AnalyticsLeadLike[],
  cx = 110,
  cy = 110,
  radius = 96
): { total: number; slices: LeadAnalyticsSlice[] } {
  const counts: Record<LeadDisposition, number> = {
    PENDING: 0,
    QUALIFIED: 0,
    CALL_NOT_PICK: 0,
    SITE_VISIT_SCHEDULED: 0,
    SITE_VISIT_DONE: 0,
    VIRTUAL_MEETING: 0,
    NOT_INTERESTED: 0,
    CLOSED_DEAL: 0,
    BROKER: 0,
    FOLLOW_UP: 0
  };

  for (const lead of leads) {
    const d = normalizeLeadDisposition(lead);
    counts[d] += 1;
  }

  const total = leads.length;
  let currentAngle = 0;

  const slices: LeadAnalyticsSlice[] = DISPOSITION_META.map((meta) => {
    const count = counts[meta.key];
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const sweepAngle = total > 0 ? (count / total) * 360 : 0;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sweepAngle;
    currentAngle = endAngle;

    return {
      key: meta.key,
      label: meta.label,
      color: meta.color,
      count,
      percentage: Math.round(percentage * 10) / 10,
      startAngle,
      endAngle,
      pathData: count > 0 ? createPieSlicePath(cx, cy, radius, startAngle, endAngle) : ""
    };
  });

  return { total, slices };
}

export interface LeadSummaryCard {
  key: LeadSummaryFilterKey;
  label: string;
  count: number;
  accentColor: string;
  accentColorDark: string;
}

export function matchesSummaryFilter(
  lead: AnalyticsLeadLike,
  filterKey: LeadSummaryFilterKey,
  currentUserName?: string
): boolean {
  const disposition = normalizeLeadDisposition(lead);
  switch (filterKey) {
    case "ALL":
      return true;
    case "MY_CREATED": {
      if (lead.created_by_me) return true;
      if (currentUserName && lead.assigned_agent_name) {
        const first = currentUserName.trim().toLowerCase().split(" ")[0];
        return Boolean(first) && lead.assigned_agent_name.toLowerCase().includes(first);
      }
      return false;
    }
    case "FOLLOW_UP":
      return disposition === "FOLLOW_UP";
    case "SITE_VISIT_DONE":
      return disposition === "SITE_VISIT_DONE";
    case "NOT_YET_CONNECTED":
      return disposition === "CALL_NOT_PICK";
    case "BOOKED":
      return disposition === "CLOSED_DEAL" || lead.status === "WON";
    case "PENDING":
      return disposition === "PENDING";
    default:
      return true;
  }
}

export function computeLeadSummary(leads: AnalyticsLeadLike[], currentUserName?: string): LeadSummaryCard[] {
  const countFor = (key: LeadSummaryFilterKey) =>
    leads.filter((lead) => matchesSummaryFilter(lead, key, currentUserName)).length;

  return [
    {
      key: "ALL",
      label: "All Leads",
      count: leads.length,
      accentColor: "#2563EB",
      accentColorDark: "#60A5FA"
    },
    {
      key: "MY_CREATED",
      label: "My Leads (Created)",
      count: countFor("MY_CREATED"),
      accentColor: "#7C3AED",
      accentColorDark: "#A78BFA"
    },
    {
      key: "FOLLOW_UP",
      label: "Follow-up Leads",
      count: countFor("FOLLOW_UP"),
      accentColor: "#16A34A",
      accentColorDark: "#4ADE80"
    },
    {
      key: "SITE_VISIT_DONE",
      label: "Site Visit Done",
      count: countFor("SITE_VISIT_DONE"),
      accentColor: "#15803D",
      accentColorDark: "#34D399"
    },
    {
      key: "NOT_YET_CONNECTED",
      label: "Not Yet Connected",
      count: countFor("NOT_YET_CONNECTED"),
      accentColor: "#DC2626",
      accentColorDark: "#F87171"
    },
    {
      key: "BOOKED",
      label: "Booked Leads",
      count: countFor("BOOKED"),
      accentColor: "#0D9488",
      accentColorDark: "#2DD4BF"
    },
    {
      key: "PENDING",
      label: "Pending Leads",
      count: countFor("PENDING"),
      accentColor: "#D97706",
      accentColorDark: "#FBBF24"
    }
  ];
}

export interface CallDetailsSummary {
  today: number;
  yesterday: number;
  weekly: number;
  all: number;
}

export function computeCallDetails(callLogs: CallLogLike[], nowMs: number = Date.now()): CallDetailsSummary {
  const nowDate = new Date(nowMs);
  const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;
  const startOfYesterday = startOfToday - msPerDay;
  const startOfWeek = startOfToday - 6 * msPerDay;

  let today = 0;
  let yesterday = 0;
  let weekly = 0;

  for (const log of callLogs) {
    const ts = new Date(log.start_time).getTime();
    if (Number.isNaN(ts)) continue;
    if (ts >= startOfToday && ts <= nowMs + 60_000) {
      today += 1;
    } else if (ts >= startOfYesterday && ts < startOfToday) {
      yesterday += 1;
    }
    if (ts >= startOfWeek && ts <= nowMs + 60_000) {
      weekly += 1;
    }
  }

  return {
    today,
    yesterday,
    weekly,
    all: callLogs.length
  };
}

export interface LeadDateGroup<T extends AnalyticsLeadLike> {
  dateKey: string;
  dateLabel: string;
  leads: T[];
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatLeadGroupDate(isoDate: string): { key: string; label: string } {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) {
    return { key: "0000-00-00", label: "Earlier" };
  }
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const dayNum = d.getDate();
  const monthName = MONTH_SHORT[d.getMonth()];
  return {
    key: `${yyyy}-${mm}-${dd}`,
    label: `${dayNum} ${monthName} ${yyyy}`
  };
}

export function groupLeadsByDate<T extends AnalyticsLeadLike>(leads: T[]): LeadDateGroup<T>[] {
  const sorted = [...leads].sort((a, b) => {
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });

  const groupsMap = new Map<string, LeadDateGroup<T>>();

  for (const lead of sorted) {
    const { key, label } = formatLeadGroupDate(lead.created_at);
    const existing = groupsMap.get(key);
    if (existing) {
      existing.leads.push(lead);
    } else {
      groupsMap.set(key, {
        dateKey: key,
        dateLabel: label,
        leads: [lead]
      });
    }
  }

  return Array.from(groupsMap.values());
}

export function getAdChannelMeta(channel: AdChannel): AdChannelMeta {
  return AD_CHANNEL_META.find((c) => c.key === channel) || AD_CHANNEL_META[0];
}

export function normalizeLeadChannel(source?: string): AdChannel {
  const s = (source || "").toUpperCase();
  if (s.includes("WHATSAPP") || s.includes("WA_")) return "WHATSAPP";
  if (s.includes("INSTAGRAM") || s.includes("IG_")) return "INSTAGRAM";
  if (s.includes("LINKEDIN") || s.includes("LI_")) return "LINKEDIN";
  if (s.includes("GOOGLE") || s.includes("GADS") || s.includes("YOUTUBE")) return "GOOGLE";
  if (s.includes("META") || s.includes("FB") || s.includes("FACEBOOK")) return "META";
  return "WEBSITE";
}

export interface AdChannelStat {
  key: AdChannel;
  label: string;
  shortLabel: string;
  color: string;
  total: number;
  contacted: number;
  siteVisits: number;
  closedDeals: number;
  percentage: number;
  barWidthPct: number;
}

export function computeAdChannelStats(leads: AnalyticsLeadLike[]): AdChannelStat[] {
  const buckets: Record<
    AdChannel,
    { total: number; contacted: number; siteVisits: number; closedDeals: number }
  > = {
    META: { total: 0, contacted: 0, siteVisits: 0, closedDeals: 0 },
    WHATSAPP: { total: 0, contacted: 0, siteVisits: 0, closedDeals: 0 },
    INSTAGRAM: { total: 0, contacted: 0, siteVisits: 0, closedDeals: 0 },
    LINKEDIN: { total: 0, contacted: 0, siteVisits: 0, closedDeals: 0 },
    GOOGLE: { total: 0, contacted: 0, siteVisits: 0, closedDeals: 0 },
    WEBSITE: { total: 0, contacted: 0, siteVisits: 0, closedDeals: 0 }
  };

  for (const lead of leads) {
    const ch = normalizeLeadChannel(lead.source);
    const disp = normalizeLeadDisposition(lead);
    const b = buckets[ch];
    b.total += 1;
    if (disp !== "PENDING" && disp !== "CALL_NOT_PICK") {
      b.contacted += 1;
    }
    if (disp === "SITE_VISIT_SCHEDULED" || disp === "SITE_VISIT_DONE") {
      b.siteVisits += 1;
    }
    if (disp === "CLOSED_DEAL" || lead.status === "WON") {
      b.closedDeals += 1;
    }
  }

  const totalLeads = leads.length;
  const maxCount = Math.max(1, ...Object.values(buckets).map((b) => b.total));

  return AD_CHANNEL_META.map((meta) => {
    const b = buckets[meta.key];
    return {
      key: meta.key,
      label: meta.label,
      shortLabel: meta.shortLabel,
      color: meta.color,
      total: b.total,
      contacted: b.contacted,
      siteVisits: b.siteVisits,
      closedDeals: b.closedDeals,
      percentage: totalLeads > 0 ? Math.round((b.total / totalLeads) * 1000) / 10 : 0,
      barWidthPct: b.total > 0 ? Math.max(6, Math.round((b.total / maxCount) * 100)) : 0
    };
  });
}

export interface DailyLeadPoint {
  dateKey: string;
  dayLabel: string;
  total: number;
  byChannel: Record<AdChannel, number>;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function computeDailyLeadTrend(
  leads: AnalyticsLeadLike[],
  days = 7,
  nowMs: number = Date.now()
): DailyLeadPoint[] {
  const nowDate = new Date(nowMs);
  const startOfToday = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate()).getTime();
  const msPerDay = 24 * 60 * 60 * 1000;

  const points: DailyLeadPoint[] = [];
  const byKey = new Map<string, DailyLeadPoint>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(startOfToday - i * msPerDay);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = i === 0 ? "Today" : WEEKDAY_SHORT[d.getDay()];
    const pt: DailyLeadPoint = {
      dateKey: key,
      dayLabel: label,
      total: 0,
      byChannel: { META: 0, WHATSAPP: 0, INSTAGRAM: 0, LINKEDIN: 0, GOOGLE: 0, WEBSITE: 0 }
    };
    points.push(pt);
    byKey.set(key, pt);
  }

  for (const lead of leads) {
    const d = new Date(lead.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const pt = byKey.get(key);
    if (pt) {
      const ch = normalizeLeadChannel(lead.source);
      pt.total += 1;
      pt.byChannel[ch] += 1;
    }
  }

  return points;
}

export interface AgentScorecard {
  agentName: string;
  employeeCode: string;
  leadsAssigned: number;
  callsMade: number;
  siteVisits: number;
  dealsClosed: number;
  alertsCount: number;
  activitiesCount: number;
}

export function computeAgentScorecards(
  agents: Array<{ full_name: string; employee_code: string }>,
  leads: AnalyticsLeadLike[],
  callLogs: CallLogLike[],
  activities: ActivityLike[]
): AgentScorecard[] {
  return agents.map((agent) => {
    const first = agent.full_name.trim().toLowerCase().split(" ")[0];
    const matchesName = (val?: string) => Boolean(val && val.toLowerCase().includes(first));

    const agentLeads = leads.filter((l) => matchesName(l.assigned_agent_name));
    const agentCalls = callLogs.filter(
      (c) => c.caller_code === agent.employee_code || matchesName(c.caller_name)
    );
    const agentActs = activities.filter(
      (a) => a.employee_code === agent.employee_code || matchesName(a.agent_name)
    );

    const siteVisits = agentLeads.filter((l) => {
      const d = normalizeLeadDisposition(l);
      return d === "SITE_VISIT_SCHEDULED" || d === "SITE_VISIT_DONE";
    }).length;

    const dealsClosed = agentLeads.filter(
      (l) => normalizeLeadDisposition(l) === "CLOSED_DEAL" || l.status === "WON"
    ).length;

    const alertsCount = agentLeads.filter(
      (l) =>
        l.offline_closing_flag ||
        l.poaching_risk_score === "CRITICAL" ||
        l.poaching_risk_score === "HIGH" ||
        l.is_sla_breached
    ).length;

    return {
      agentName: agent.full_name,
      employeeCode: agent.employee_code,
      leadsAssigned: agentLeads.length,
      callsMade: agentCalls.length,
      siteVisits,
      dealsClosed,
      alertsCount,
      activitiesCount: agentActs.length
    };
  });
}

