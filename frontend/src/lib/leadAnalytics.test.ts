import test from "node:test";
import assert from "node:assert/strict";
import {
  DISPOSITION_META,
  normalizeLeadDisposition,
  dispositionToPipelineStatus,
  computeLeadAnalytics,
  computeLeadSummary,
  matchesSummaryFilter,
  computeCallDetails,
  groupLeadsByDate,
  normalizeLeadChannel,
  computeAdChannelStats,
  computeDailyLeadTrend,
  computeAgentScorecards,
  AnalyticsLeadLike
} from "./leadAnalytics.ts";

const SAMPLE_LEADS: AnalyticsLeadLike[] = [
  {
    id: "l-1",
    full_name: "Ashish Kumar Gupta",
    status: "NEW",
    source: "META_FB_AD",
    disposition: "CALL_NOT_PICK",
    assigned_agent_name: "Dhruv Chaudhary",
    created_by_me: true,
    created_at: "2026-09-16T10:15:00.000Z",
    lead_code: "197128"
  },
  {
    id: "l-2",
    full_name: "Parmod Kumar Bhagat",
    status: "NEW",
    source: "WHATSAPP_AD",
    disposition: "CALL_NOT_PICK",
    assigned_agent_name: "Dhruv Chaudhary",
    created_by_me: false,
    created_at: "2026-09-16T08:00:00.000Z",
    lead_code: "196491",
    is_sla_breached: true
  },
  {
    id: "l-3",
    full_name: "Neha Bansal",
    status: "CONTACTED",
    source: "LINKEDIN_LEAD_GEN",
    disposition: "FOLLOW_UP",
    assigned_agent_name: "Rahul Verma",
    created_by_me: true,
    created_at: "2026-09-15T14:20:00.000Z",
    lead_code: "196410"
  },
  {
    id: "l-4",
    full_name: "Rohan Deshmukh",
    status: "SITE_VISIT",
    source: "META_IG_REEL",
    assigned_agent_name: "Karan Mehta",
    created_at: "2026-09-14T11:00:00.000Z"
  },
  {
    id: "l-5",
    full_name: "Amit Bhardwaj",
    status: "WON",
    source: "GOOGLE_ADS_SEARCH",
    assigned_agent_name: "Rahul Verma",
    created_at: "2026-09-12T09:00:00.000Z"
  },
  {
    id: "l-6",
    full_name: "Aditya Singhania",
    status: "NEW",
    source: "WEBSITE_DIRECT",
    assigned_agent_name: "Rahul Verma",
    created_at: "2026-09-16T11:00:00.000Z"
  }
];

test("normalizeLeadDisposition uses explicit disposition and falls back from pipeline status", () => {
  assert.equal(normalizeLeadDisposition({ status: "NEW", disposition: "CALL_NOT_PICK" }), "CALL_NOT_PICK");
  assert.equal(normalizeLeadDisposition({ status: "NEW" }), "PENDING");
  assert.equal(normalizeLeadDisposition({ status: "CONTACTED" }), "FOLLOW_UP");
  assert.equal(normalizeLeadDisposition({ status: "SITE_VISIT" }), "SITE_VISIT_DONE");
  assert.equal(normalizeLeadDisposition({ status: "SITE_VISIT_SCHEDULED" }), "SITE_VISIT_SCHEDULED");
  assert.equal(normalizeLeadDisposition({ status: "NEGOTIATION" }), "QUALIFIED");
  assert.equal(normalizeLeadDisposition({ status: "WON" }), "CLOSED_DEAL");
  assert.equal(normalizeLeadDisposition({ status: "LOST" }), "NOT_INTERESTED");
});

test("dispositionToPipelineStatus maps telecalling dispositions cleanly", () => {
  assert.equal(dispositionToPipelineStatus("CLOSED_DEAL"), "WON");
  assert.equal(dispositionToPipelineStatus("NOT_INTERESTED"), "LOST");
  assert.equal(dispositionToPipelineStatus("FOLLOW_UP"), "CONTACTED");
  assert.equal(dispositionToPipelineStatus("SITE_VISIT_DONE"), "SITE_VISIT");
  assert.equal(dispositionToPipelineStatus("CALL_NOT_PICK"), "NEW");
});

test("computeLeadAnalytics counts all 10 categories and generates valid pie paths", () => {
  const { total, slices } = computeLeadAnalytics(SAMPLE_LEADS);
  assert.equal(total, 6);
  assert.equal(slices.length, DISPOSITION_META.length);
  assert.equal(slices.length, 10);

  const byKey = Object.fromEntries(slices.map((s) => [s.key, s]));
  assert.equal(byKey.CALL_NOT_PICK.count, 2);
  assert.equal(byKey.FOLLOW_UP.count, 1);
  assert.equal(byKey.SITE_VISIT_DONE.count, 1);
  assert.equal(byKey.CLOSED_DEAL.count, 1);
  assert.equal(byKey.PENDING.count, 1);
  assert.equal(byKey.BROKER.count, 0);
  assert.equal(byKey.BROKER.pathData, "");
  assert.ok(byKey.CALL_NOT_PICK.pathData.startsWith("M 110 110"));

  const totalAngle = slices.reduce((sum, s) => sum + (s.endAngle - s.startAngle), 0);
  assert.ok(Math.abs(totalAngle - 360) < 0.01);
});

test("computeLeadAnalytics handles empty list and single 100% slice without SVG arc collapse", () => {
  const empty = computeLeadAnalytics([]);
  assert.equal(empty.total, 0);
  assert.ok(empty.slices.every((s) => s.count === 0 && s.pathData === ""));

  const single = computeLeadAnalytics([SAMPLE_LEADS[0]]);
  const activeSlice = single.slices.find((s) => s.key === "CALL_NOT_PICK");
  assert.ok(activeSlice);
  assert.equal(activeSlice.percentage, 100);
  const arcCount = (activeSlice.pathData.match(/ A /g) || []).length;
  assert.equal(arcCount, 2);
});

test("computeLeadSummary and matchesSummaryFilter stay consistent across all 7 summary cards", () => {
  const summary = computeLeadSummary(SAMPLE_LEADS, "Vikramaditya Singhania");
  assert.equal(summary.length, 7);

  const byKey = Object.fromEntries(summary.map((c) => [c.key, c.count]));
  assert.equal(byKey.ALL, 6);
  assert.equal(byKey.MY_CREATED, 2);
  assert.equal(byKey.FOLLOW_UP, 1);
  assert.equal(byKey.SITE_VISIT_DONE, 1);
  assert.equal(byKey.NOT_YET_CONNECTED, 2);
  assert.equal(byKey.BOOKED, 1);
  assert.equal(byKey.PENDING, 1);

  for (const card of summary) {
    const filteredCount = SAMPLE_LEADS.filter((l) =>
      matchesSummaryFilter(l, card.key, "Vikramaditya Singhania")
    ).length;
    assert.equal(filteredCount, card.count);
  }
});

test("computeCallDetails accurately buckets Today, Yesterday, Weekly, and All calls", () => {
  const now = new Date(2026, 8, 16, 15, 30, 0).getTime();
  const logs = [
    { id: "c1", start_time: new Date(2026, 8, 16, 10, 0, 0).toISOString() },
    { id: "c2", start_time: new Date(2026, 8, 16, 14, 45, 0).toISOString() },
    { id: "c3", start_time: new Date(2026, 8, 15, 18, 0, 0).toISOString() },
    { id: "c4", start_time: new Date(2026, 8, 12, 11, 0, 0).toISOString() },
    { id: "c5", start_time: new Date(2026, 8, 2, 9, 0, 0).toISOString() }
  ];

  const stats = computeCallDetails(logs, now);
  assert.deepEqual(stats, {
    today: 2,
    yesterday: 1,
    weekly: 4,
    all: 5
  });
});

test("groupLeadsByDate groups leads newest-first with readable DD MMM YYYY headers", () => {
  const groups = groupLeadsByDate(SAMPLE_LEADS);
  assert.equal(groups.length, 4);
  assert.equal(groups[0].dateKey, "2026-09-16");
  assert.equal(groups[0].dateLabel, "16 Sep 2026");
  assert.equal(groups[0].leads.length, 3);
  assert.equal(groups[0].leads[0].id, "l-6");
  assert.equal(groups[1].dateKey, "2026-09-15");
  assert.equal(groups[2].dateKey, "2026-09-14");
  assert.equal(groups[3].dateKey, "2026-09-12");
});

test("normalizeLeadChannel classifies Meta, WhatsApp, Instagram, LinkedIn, Google, and Website", () => {
  assert.equal(normalizeLeadChannel("META_FB_AD"), "META");
  assert.equal(normalizeLeadChannel("WHATSAPP_AD"), "WHATSAPP");
  assert.equal(normalizeLeadChannel("META_IG_REEL"), "INSTAGRAM");
  assert.equal(normalizeLeadChannel("META_IG_STORY"), "INSTAGRAM");
  assert.equal(normalizeLeadChannel("LINKEDIN_LEAD_GEN"), "LINKEDIN");
  assert.equal(normalizeLeadChannel("GOOGLE_ADS_SEARCH"), "GOOGLE");
  assert.equal(normalizeLeadChannel("WEBSITE_DIRECT"), "WEBSITE");
  assert.equal(normalizeLeadChannel(undefined), "WEBSITE");
});

test("computeAdChannelStats aggregates all 6 channels with percentages and bar widths", () => {
  const stats = computeAdChannelStats(SAMPLE_LEADS);
  assert.equal(stats.length, 6);
  const byKey = Object.fromEntries(stats.map((s) => [s.key, s]));
  assert.equal(byKey.META.total, 1);
  assert.equal(byKey.WHATSAPP.total, 1);
  assert.equal(byKey.INSTAGRAM.total, 1);
  assert.equal(byKey.INSTAGRAM.siteVisits, 1);
  assert.equal(byKey.LINKEDIN.total, 1);
  assert.equal(byKey.LINKEDIN.contacted, 1);
  assert.equal(byKey.GOOGLE.closedDeals, 1);
  assert.equal(byKey.WEBSITE.total, 1);
  assert.equal(byKey.META.barWidthPct, 100);
});

test("computeDailyLeadTrend builds 7 daily points ending with Today", () => {
  const now = new Date(2026, 8, 16, 15, 0, 0).getTime();
  const trend = computeDailyLeadTrend(SAMPLE_LEADS, 7, now);
  assert.equal(trend.length, 7);
  assert.equal(trend[6].dayLabel, "Today");
  assert.equal(trend[6].total, 3);
  assert.equal(trend[5].total, 1);
  assert.equal(trend[4].total, 1);
  assert.equal(trend[2].total, 1);
});

test("computeAgentScorecards summarizes leads, calls, visits, deals, and alerts per agent", () => {
  const cards = computeAgentScorecards(
    [
      { full_name: "Dhruv Chaudhary", employee_code: "EXE-204" },
      { full_name: "Karan Mehta", employee_code: "EXE-210" }
    ],
    SAMPLE_LEADS,
    [{ id: "c1", start_time: "2026-09-16T10:00:00Z", caller_code: "EXE-204", caller_name: "Dhruv Chaudhary" }],
    [{ id: "a1", timestamp: "2026-09-16T10:05:00Z", agent_name: "Dhruv Chaudhary", employee_code: "EXE-204", activity_type: "CALL_PLACED" }]
  );

  assert.equal(cards[0].leadsAssigned, 2);
  assert.equal(cards[0].callsMade, 1);
  assert.equal(cards[0].alertsCount, 1);
  assert.equal(cards[0].activitiesCount, 1);
  assert.equal(cards[1].leadsAssigned, 1);
  assert.equal(cards[1].siteVisits, 1);
});

