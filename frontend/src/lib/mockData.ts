import { LeadItem } from "../components/leads/LeadTable";
import { PropertyItem } from "../components/properties/PropertyList";
import { AgentTelemetryData } from "../components/telemetry/AgentActivityModal";

export interface MockUser {
  id: string;
  email: string;
  full_name: string;
  employee_code: string;
  role: string;
  is_punched_in: boolean;
  phone: string;
  assigned_territory: string;
  mfa_enabled: boolean;
  mfa_enforced: boolean;
  account_locked: boolean;
  login_count_today: number;
  total_logins: number;
  last_login_device: string;
  last_login_ip: string;
  last_login_browser: string;
  last_login_channel: "WEB_APP" | "MOBILE_APP";
}

export interface LoginRecord {
  id: string;
  user_id: string;
  user_name: string;
  employee_code: string;
  role: string;
  timestamp: string;
  ip_address: string;
  device_model: string;
  browser: string;
  channel: "WEB_APP" | "MOBILE_APP";
  status: "SUCCESS" | "FAILED_CREDENTIALS" | "FAILED_MFA" | "ACCOUNT_LOCKED";
  mfa_used: boolean;
}

export interface CallLogRecord {
  id: string;
  caller_name: string;
  caller_code: string;
  lead_name: string;
  lead_phone_masked: string;
  property_title: string;
  bridge_id: string;
  start_time: string;
  duration_seconds: number;
  duration_formatted: string;
  outcome: string;
  notes?: string;
  is_encrypted: boolean;
}

export interface MinuteActivityRecord {
  id: string;
  timestamp: string;
  agent_name: string;
  employee_code: string;
  activity_type: "DEAL_UPDATE" | "CALL_PLACED" | "LEAD_VIEW" | "NOTE_ADDED" | "GPS_CHECKIN" | "SECURITY_ALERT" | "EXPORT_REQUEST";
  title: string;
  description: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  deal_value?: number;
  brokerage_commission?: number;
}

export const MOCK_USERS: Record<string, MockUser> = {
  "owner@apexrealty.com": {
    id: "usr-owner-01",
    email: "owner@apexrealty.com",
    full_name: "Vikramaditya Singhania",
    employee_code: "OWNER-01",
    role: "OWNER",
    is_punched_in: true,
    phone: "+919800011111",
    assigned_territory: "All Strategic Territories",
    mfa_enabled: true,
    mfa_enforced: true,
    account_locked: false,
    login_count_today: 4,
    total_logins: 382,
    last_login_device: "MacBook Pro 16 M3 Max (macOS 14.4)",
    last_login_ip: "103.21.144.1",
    last_login_browser: "Chrome 122.0.6",
    last_login_channel: "WEB_APP"
  },
  "agent.rahul@apexrealty.com": {
    id: "usr-exe-204",
    email: "agent.rahul@apexrealty.com",
    full_name: "Rahul Verma",
    employee_code: "EXE-204",
    role: "AGENT",
    is_punched_in: true,
    phone: "+919822200000",
    assigned_territory: "Downtown Skyline",
    mfa_enabled: true,
    mfa_enforced: true,
    account_locked: false,
    login_count_today: 5,
    total_logins: 142,
    last_login_device: "Dell XPS 15 (Windows 11 Pro)",
    last_login_ip: "103.21.144.10",
    last_login_browser: "Chrome 122.0.6",
    last_login_channel: "WEB_APP"
  },
  "agent.ananya@apexrealty.com": {
    id: "usr-exe-208",
    email: "agent.ananya@apexrealty.com",
    full_name: "Ananya Patel",
    employee_code: "EXE-208",
    role: "AGENT",
    is_punched_in: true,
    phone: "+919833344455",
    assigned_territory: "Palm Grove Estates",
    mfa_enabled: true,
    mfa_enforced: true,
    account_locked: false,
    login_count_today: 6,
    total_logins: 218,
    last_login_device: "Apple iPhone 15 Pro (iOS 18.2)",
    last_login_ip: "157.34.192.44",
    last_login_browser: "Mobile Safari 18.2",
    last_login_channel: "MOBILE_APP"
  },
  "agent.vikram@apexrealty.com": {
    id: "usr-exe-215",
    email: "agent.vikram@apexrealty.com",
    full_name: "Vikram Malhotra",
    employee_code: "EXE-215",
    role: "AGENT",
    is_punched_in: true,
    phone: "+919844455566",
    assigned_territory: "Marina Bay Promenade",
    mfa_enabled: false,
    mfa_enforced: false,
    account_locked: false,
    login_count_today: 4,
    total_logins: 110,
    last_login_device: "Samsung Galaxy S24 Ultra (Android 14)",
    last_login_ip: "157.34.192.89",
    last_login_browser: "Chrome Mobile 122.0",
    last_login_channel: "MOBILE_APP"
  },
  "agent.karan@apexrealty.com": {
    id: "usr-exe-210",
    email: "agent.karan@apexrealty.com",
    full_name: "Karan Mehta",
    employee_code: "EXE-210",
    role: "AGENT",
    is_punched_in: true,
    phone: "+919822277889",
    assigned_territory: "Bandra West & Worli Promenade",
    mfa_enabled: true,
    mfa_enforced: false,
    account_locked: false,
    login_count_today: 3,
    total_logins: 167,
    last_login_device: "MacBook Pro 14 M3 (macOS 14.3)",
    last_login_ip: "103.21.144.55",
    last_login_browser: "Chrome 122.0.6",
    last_login_channel: "WEB_APP"
  }
};

export const MOCK_PROPERTIES: PropertyItem[] = [
  {
    id: "prop-1",
    title: "The Grand Crest - Sky Villa 401",
    project_name: "The Grand Crest",
    property_type: "4 BHK Sky Villa",
    location: "Downtown Skyline, Sector 42",
    price: 48500000,
    price_formatted: "₹4.85 Cr",
    carpet_area_sqft: 3850,
    bedrooms: 4,
    bathrooms: 5,
    status: "AVAILABLE",
    amenities: JSON.stringify(["Private Plunge Pool", "Panoramic City Views", "3 Dedicated Parking", "Concierge Service", "Smart Home Automation"]),
    image_url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    featured: true
  },
  {
    id: "prop-2",
    title: "Palm Serenade - Signature Villa 12",
    project_name: "Palm Serenade Enclave",
    property_type: "5 BHK Independent Villa",
    location: "Palm Grove Estates",
    price: 72500000,
    price_formatted: "₹7.25 Cr",
    carpet_area_sqft: 5400,
    bedrooms: 5,
    bathrooms: 6,
    status: "AVAILABLE",
    amenities: JSON.stringify(["Private Landscaped Garden", "Italian Statuario Marble", "Private Home Cinema", "Golf Course Access", "Solar Microgrid"]),
    image_url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
    featured: true
  },
  {
    id: "prop-3",
    title: "Marina Azure - Sea Facing Residence 18B",
    project_name: "Marina Azure Towers",
    property_type: "3 BHK Luxury Apartment",
    location: "Marina Bay Promenade",
    price: 31000000,
    price_formatted: "₹3.10 Cr",
    carpet_area_sqft: 2150,
    bedrooms: 3,
    bathrooms: 3,
    status: "UNDER_OFFER",
    amenities: JSON.stringify(["Unobstructed Sea Views", "Olympic Infinity Pool", "Private Yacht Mooring Club", "Sky Spa"]),
    image_url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    featured: true
  },
  {
    id: "prop-4",
    title: "Apex One Corporate Tower - Level 14",
    project_name: "Apex One Financial Center",
    property_type: "Grade-A Commercial Office",
    location: "Central Business District (CBD)",
    price: 89000000,
    price_formatted: "₹8.90 Cr",
    carpet_area_sqft: 6800,
    bedrooms: 0,
    bathrooms: 4,
    status: "AVAILABLE",
    amenities: JSON.stringify(["LEED Platinum Rated", "Dual 10G Fiber", "100% DG Power Backup", "Dedicated Executive Elevator", "24/7 Security"]),
    image_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    featured: true
  },
  {
    id: "prop-5",
    title: "The Lumina Heights - Duplex Penthouse 28",
    project_name: "The Lumina Heights",
    property_type: "4 BHK Duplex Penthouse",
    location: "Downtown Skyline",
    price: 56000000,
    price_formatted: "₹5.60 Cr",
    carpet_area_sqft: 4200,
    bedrooms: 4,
    bathrooms: 5,
    status: "AVAILABLE",
    amenities: JSON.stringify(["Double Height Living Room", "Terrace Jacuzzi", "Private Elevator Access", "Designer Poggenpohl Kitchen"]),
    image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    featured: false
  },
  {
    id: "prop-6",
    title: "Green Valley Sanctuary - Eco Villa 07",
    project_name: "Green Valley Sanctuary",
    property_type: "3 BHK Forest Villa",
    location: "Green Valley Hills",
    price: 24500000,
    price_formatted: "₹2.45 Cr",
    carpet_area_sqft: 2600,
    bedrooms: 3,
    bathrooms: 3,
    status: "SOLD",
    amenities: JSON.stringify(["Forest Canopy View", "Organic Farm Allotment", "Rainwater Harvesting", "Nature Trail Access"]),
    image_url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80",
    featured: false
  },
  {
    id: "prop-7",
    title: "The Boulevard Retail Arcade - Unit G-04",
    project_name: "The Boulevard Promenade",
    property_type: "High-Street Retail Store",
    location: "Downtown Skyline Commercial Hub",
    price: 37500000,
    price_formatted: "₹3.75 Cr",
    carpet_area_sqft: 1450,
    bedrooms: 0,
    bathrooms: 2,
    status: "AVAILABLE",
    amenities: JSON.stringify(["Triple Height Glass Façade", "Heavy Footfall Plaza", "Dedicated Kitchen Shaft", "Valet Drop-off"]),
    image_url: "https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&q=80",
    featured: false
  },
  {
    id: "prop-8",
    title: "Elysium Grand - Presidential Suite 32A",
    project_name: "Elysium Grand",
    property_type: "4 BHK Ultra-Luxury Apartment",
    location: "Marina Bay Promenade",
    price: 64000000,
    price_formatted: "₹6.40 Cr",
    carpet_area_sqft: 4100,
    bedrooms: 4,
    bathrooms: 5,
    status: "AVAILABLE",
    amenities: JSON.stringify(["Private Elevator Foyer", "Master Suite Walk-in Wardrobe", "24/7 White Glove Butler", "Helipad Access"]),
    image_url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    featured: true
  }
];

export const getInitialMockLeads = (): LeadItem[] => {
  const now = Date.now();
  return [
    {
      id: "lead-meta-101",
      full_name: "Aditya Singhania",
      phone_masked: "+91 98*** **22",
      email_masked: "a**************a@indocap.com",
      source: "META_FB_AD",
      status: "NEW",
      property_type: "4 BHK Sky Villa",
      budget_min: 45000000,
      budget_max: 50000000,
      preferred_location: "Downtown Skyline",
      notes: "High-intent lead. Agent viewed phone details 6 times in 2 hours, but has 0 seconds talk-time on CRM bridge.",
      assigned_agent_name: "Rahul Verma",
      sla_deadline: new Date(now + 11 * 60 * 1000).toISOString(), // 11 mins left
      is_sla_breached: false,
      estimated_brokerage: 970000,
      poaching_risk_score: "HIGH",
      poaching_risk_reason: "Customer contact viewed 6 times without using CRM Masked Call bridge. Suspected direct personal calling.",
      offline_closing_flag: false,
      created_at: new Date(now - 4 * 60 * 1000).toISOString()
    },
    {
      id: "lead-meta-102",
      full_name: "Pooja Hegde",
      phone_masked: "+91 98*** **44",
      email_masked: "p*********e@creativestudio.in",
      source: "META_IG_REEL",
      status: "NEW",
      property_type: "3 BHK Luxury Apartment",
      budget_min: 30000000,
      budget_max: 34000000,
      preferred_location: "Marina Bay Promenade",
      notes: "SLA EXPIRED! 22 minutes elapsed without agent first contact. Automatic escalation triggered to Sales Director.",
      assigned_agent_name: "Vikram Malhotra",
      sla_deadline: new Date(now - 7 * 60 * 1000).toISOString(), // SLA breached
      is_sla_breached: true,
      estimated_brokerage: 640000,
      poaching_risk_score: "MEDIUM",
      poaching_risk_reason: "SLA breached. Lead subject to auto-reassignment.",
      offline_closing_flag: false,
      created_at: new Date(now - 22 * 60 * 1000).toISOString()
    },
    {
      id: "lead-meta-103",
      full_name: "Kavita Chawla",
      phone_masked: "+91 98*** **77",
      email_masked: "k************a@chawlaholdings.in",
      source: "META_IG_STORY",
      status: "LOST",
      property_type: "5 BHK Independent Villa",
      budget_min: 70000000,
      budget_max: 85000000,
      preferred_location: "Palm Grove Estates",
      notes: "CRITICAL: Agent marked lead as 'Client Unresponsive / Not Interested', but GPS telemetry confirms agent visited client's private site 3 times!",
      assigned_agent_name: "Ananya Patel",
      sla_deadline: new Date(now - 3600000 * 24).toISOString(),
      is_sla_breached: false,
      estimated_brokerage: 1550000,
      poaching_risk_score: "CRITICAL",
      poaching_risk_reason: "Marked 'LOST' in CRM for ₹7.25 Cr villa, but GPS logs prove 3 unlogged physical visits! Offline closing risk of ₹14.5 Lakhs brokerage.",
      offline_closing_flag: true,
      created_at: new Date(now - 3600000 * 48).toISOString()
    },
    {
      id: "lead-meta-104",
      full_name: "Harish Bhatt",
      phone_masked: "+91 98*** **33",
      email_masked: "h**********t@bhattconsulting.com",
      source: "META_FB_AD",
      status: "NEW",
      property_type: "4 BHK Ultra-Luxury Apartment",
      budget_min: 60000000,
      budget_max: 70000000,
      preferred_location: "Marina Bay Promenade",
      notes: "Lead arrived via Facebook Ad. Active 15-min SLA countdown in progress.",
      assigned_agent_name: "Vikram Malhotra",
      sla_deadline: new Date(now + 2.5 * 60 * 1000).toISOString(), // 2.5 mins left
      is_sla_breached: false,
      estimated_brokerage: 1300000,
      poaching_risk_score: "LOW",
      poaching_risk_reason: "Fresh inquiry. Waiting for masked first call.",
      offline_closing_flag: false,
      created_at: new Date(now - 12.5 * 60 * 1000).toISOString()
    },
    {
      id: "lead-meta-105",
      full_name: "Rajeshwari Devi",
      phone_masked: "+91 98*** **88",
      email_masked: "r**************i@heritagecapital.com",
      source: "META_IG_REEL",
      status: "NEGOTIATION",
      property_type: "4 BHK Duplex Penthouse",
      budget_min: 52000000,
      budget_max: 60000000,
      preferred_location: "Downtown Skyline",
      notes: "Interested in Duplex Penthouse 28. Final payment structure negotiation underway.",
      assigned_agent_name: "Karan Mehta",
      sla_deadline: new Date(now - 3600000 * 8).toISOString(),
      is_sla_breached: false,
      estimated_brokerage: 1120000,
      poaching_risk_score: "LOW",
      poaching_risk_reason: "Fully compliant CRM bridge calls logged (42 mins talk time).",
      offline_closing_flag: false,
      created_at: new Date(now - 3600000 * 18).toISOString()
    },
    {
      id: "lead-meta-106",
      full_name: "Rohan Deshmukh",
      phone_masked: "+91 98*** **11",
      email_masked: "r****n@deshmukhfintech.io",
      source: "WEBSITE_DIRECT",
      status: "SITE_VISIT",
      property_type: "Grade-A Commercial Office",
      budget_min: 80000000,
      budget_max: 95000000,
      preferred_location: "Central Business District (CBD)",
      notes: "Corporate HQ relocation. Physical site inspection completed at Apex One Tower Level 14.",
      assigned_agent_name: "Karan Mehta",
      sla_deadline: new Date(now - 3600000 * 12).toISOString(),
      is_sla_breached: false,
      estimated_brokerage: 1780000,
      poaching_risk_score: "LOW",
      poaching_risk_reason: "Executive level deal. Compliant audit logs.",
      offline_closing_flag: false,
      created_at: new Date(now - 3600000 * 36).toISOString()
    },
    {
      id: "lead-meta-107",
      full_name: "Neha Bansal",
      phone_masked: "+91 98*** **55",
      email_masked: "n***a@bansaljewels.com",
      source: "META_FB_AD",
      status: "CONTACTED",
      property_type: "4 BHK Sky Villa",
      budget_min: 46000000,
      budget_max: 52000000,
      preferred_location: "Downtown Skyline",
      notes: "First call conducted via CRM bridge. Requested brochure and floor plan for Sky Villa 401.",
      assigned_agent_name: "Rahul Verma",
      sla_deadline: new Date(now - 3600000 * 2).toISOString(),
      is_sla_breached: false,
      estimated_brokerage: 980000,
      poaching_risk_score: "LOW",
      poaching_risk_reason: "Masked call recorded successfully.",
      offline_closing_flag: false,
      created_at: new Date(now - 3600000 * 4).toISOString()
    },
    {
      id: "lead-meta-108",
      full_name: "Gautam Singhal",
      phone_masked: "+91 98*** **90",
      email_masked: "g*****m@singhalinfra.com",
      source: "META_IG_STORY",
      status: "OFFER",
      property_type: "5 BHK Independent Villa",
      budget_min: 68000000,
      budget_max: 75000000,
      preferred_location: "Palm Grove Estates",
      notes: "Submitted token expression of interest for Palm Serenade Villa 12.",
      assigned_agent_name: "Ananya Patel",
      sla_deadline: new Date(now - 3600000 * 16).toISOString(),
      is_sla_breached: false,
      estimated_brokerage: 1450000,
      poaching_risk_score: "MEDIUM",
      poaching_risk_reason: "High volume of offline meetings. GPS monitored.",
      offline_closing_flag: false,
      created_at: new Date(now - 3600000 * 40).toISOString()
    },
    {
      id: "lead-meta-109",
      full_name: "Amit Bhardwaj",
      phone_masked: "+91 98*** **66",
      email_masked: "a**t@bhardwajagro.in",
      source: "META_FB_AD",
      status: "WON",
      property_type: "3 BHK Forest Villa",
      budget_min: 24000000,
      budget_max: 26000000,
      preferred_location: "Green Valley Hills",
      notes: "Deal closed! Eco Villa 07 deed registered. Brokerage commission received.",
      assigned_agent_name: "Rahul Verma",
      sla_deadline: new Date(now - 3600000 * 60).toISOString(),
      is_sla_breached: false,
      estimated_brokerage: 490000,
      poaching_risk_score: "LOW",
      poaching_risk_reason: "Full compliance verified.",
      offline_closing_flag: false,
      created_at: new Date(now - 3600000 * 120).toISOString()
    },
    {
      id: "lead-meta-110",
      full_name: "Deepak Chopra",
      phone_masked: "+91 98*** **14",
      email_masked: "d****k@chopratech.com",
      source: "WEBSITE_DIRECT",
      status: "NEW",
      property_type: "High-Street Retail Store",
      budget_min: 35000000,
      budget_max: 40000000,
      preferred_location: "Downtown Skyline Commercial Hub",
      notes: "Inquiring about Unit G-04 retail shop for luxury flagship boutique.",
      assigned_agent_name: "Rahul Verma",
      sla_deadline: new Date(now + 9 * 60 * 1000).toISOString(), // 9 mins left
      is_sla_breached: false,
      estimated_brokerage: 750000,
      poaching_risk_score: "LOW",
      poaching_risk_reason: "New inquiry from web portal.",
      offline_closing_flag: false,
      created_at: new Date(now - 6 * 60 * 1000).toISOString()
    },
    {
      id: "lead-meta-111",
      full_name: "Sunita Rao",
      phone_masked: "+91 98*** **82",
      email_masked: "s****a@raopharma.org",
      source: "META_IG_REEL",
      status: "CONTACTED",
      property_type: "4 BHK Ultra-Luxury Apartment",
      budget_min: 62000000,
      budget_max: 68000000,
      preferred_location: "Marina Bay Promenade",
      notes: "Spoke via bridge. Requesting private sea-facing terrace viewing.",
      assigned_agent_name: "Ananya Patel",
      sla_deadline: new Date(now - 3600000 * 5).toISOString(),
      is_sla_breached: false,
      estimated_brokerage: 1280000,
      poaching_risk_score: "LOW",
      poaching_risk_reason: "Logged through virtual bridge.",
      offline_closing_flag: false,
      created_at: new Date(now - 3600000 * 6).toISOString()
    },
    {
      id: "lead-meta-112",
      full_name: "Tarun Agarwal",
      phone_masked: "+91 98*** **99",
      email_masked: "t***n@agarwalholdings.net",
      source: "META_FB_AD",
      status: "NEGOTIATION",
      property_type: "Grade-A Commercial Office",
      budget_min: 85000000,
      budget_max: 92000000,
      preferred_location: "Central Business District (CBD)",
      notes: "Commercial lease-to-buy discussion for Apex One 6,800 sq.ft unit.",
      assigned_agent_name: "Vikram Malhotra",
      sla_deadline: new Date(now - 3600000 * 22).toISOString(),
      is_sla_breached: false,
      estimated_brokerage: 1780000,
      poaching_risk_score: "LOW",
      poaching_risk_reason: "Manager supervised negotiation.",
      offline_closing_flag: false,
      created_at: new Date(now - 3600000 * 50).toISOString()
    }
  ];
};

export const MOCK_AUDIT_LOGS = [
  {
    id: "log-sec-01",
    event_type: "TAMPERING_ATTEMPT",
    severity: "CRITICAL",
    ip_address: "157.34.192.44",
    details_json: JSON.stringify({
      threat: "Watermark CSS Display None Manipulation",
      technique: "DOM Tree Modification / Inspector Override",
      action_taken: "Canvas auto-regenerated in Shadow DOM; incident logged"
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString()
  },
  {
    id: "log-sec-02",
    event_type: "IMPOSSIBLE_TRAVEL",
    severity: "HIGH",
    ip_address: "185.220.101.5",
    details_json: JSON.stringify({
      user: "agent.ananya@apexrealty.com",
      previous_ip: "103.21.144.10 (Mumbai, India)",
      detected_ip: "185.220.101.5 (Frankfurt, Germany)",
      time_delta_minutes: 14,
      velocity_kmh: 4200.0,
      action_taken: "Session token flagged; re-authentication challenged"
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: "log-sec-03",
    event_type: "CLIPBOARD_COPY_BLOCKED",
    severity: "MEDIUM",
    ip_address: "103.21.144.10",
    details_json: JSON.stringify({
      user: "agent.rahul@apexrealty.com",
      key_combo: "Ctrl+C on masked lead phone cell",
      target_element: "DIV.lead-phone-masked",
      action_taken: "Clipboard write neutralized by DLP container"
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString()
  },
  {
    id: "log-sec-04",
    event_type: "DEVTOOLS_OPEN_ATTEMPT",
    severity: "HIGH",
    ip_address: "103.21.144.10",
    details_json: JSON.stringify({
      user: "agent.rahul@apexrealty.com",
      trigger: "F12 Developer Tools Keyboard Shortcut",
      action_taken: "DLP keystroke suppression engaged"
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 110).toISOString()
  },
  {
    id: "log-sec-05",
    event_type: "OFFLINE_CLOSING_ALERT",
    severity: "CRITICAL",
    ip_address: "157.34.192.44",
    details_json: JSON.stringify({
      agent: "Ananya Patel (EXE-208)",
      lead: "Kavita Chawla (Villa 12)",
      lead_status: "LOST in CRM",
      gps_proximity: "Within 15 meters of property for 48 minutes",
      potential_loss: "₹14,50,000 Brokerage theft"
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString()
  },
  {
    id: "log-sec-06",
    event_type: "SLA_BREACH_ESCALATED",
    severity: "MEDIUM",
    ip_address: "127.0.0.1",
    details_json: JSON.stringify({
      lead_id: "lead-meta-102",
      customer: "Pooja Hegde",
      assigned_agent: "Vikram Malhotra",
      minutes_elapsed: 22,
      action_taken: "Escalated to Agency Owner Vikramaditya Singhania"
    }),
    created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString()
  }
];

export const MOCK_EXPORT_REQUESTS = [
  {
    id: "exp-req-9021",
    requester_id: "usr-exe-204",
    requester_name: "Rahul Verma (EXE-204)",
    status: "PENDING",
    reason: "Offline territory drive: need list of 25 Downtown Skyline prospects for in-person site meetings.",
    records_count: 25,
    expires_at: new Date(Date.now() + 3600000 * 24).toISOString(),
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString()
  },
  {
    id: "exp-req-8840",
    requester_id: "usr-exe-208",
    requester_name: "Ananya Patel (EXE-208)",
    approver_id: "usr-owner-01",
    approver_name: "Vikramaditya Singhania (OWNER)",
    status: "APPROVED",
    reason: "Authorized quarterly compliance audit for offshore private wealth syndicate.",
    records_count: 100,
    expires_at: new Date(Date.now() + 3600000 * 4).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 6).toISOString()
  }
];

export const MOCK_LOGIN_RECORDS: LoginRecord[] = [
  {
    id: "log-in-101",
    user_id: "usr-owner-01",
    user_name: "Vikramaditya Singhania",
    employee_code: "OWNER-01",
    role: "OWNER",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    ip_address: "103.21.144.1",
    device_model: "MacBook Pro 16 M3 Max (macOS 14.4)",
    browser: "Chrome 122.0.6",
    channel: "WEB_APP",
    status: "SUCCESS",
    mfa_used: true
  },
  {
    id: "log-in-102",
    user_id: "usr-exe-204",
    user_name: "Rahul Verma",
    employee_code: "EXE-204",
    role: "AGENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    ip_address: "103.21.144.10",
    device_model: "Dell XPS 15 (Windows 11 Pro)",
    browser: "Chrome 122.0.6",
    channel: "WEB_APP",
    status: "SUCCESS",
    mfa_used: true
  },
  {
    id: "log-in-103",
    user_id: "usr-exe-208",
    user_name: "Ananya Patel",
    employee_code: "EXE-208",
    role: "AGENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    ip_address: "157.34.192.44",
    device_model: "Apple iPhone 15 Pro (iOS 18.2)",
    browser: "Mobile Safari 18.2",
    channel: "MOBILE_APP",
    status: "SUCCESS",
    mfa_used: true
  },
  {
    id: "log-in-104",
    user_id: "usr-exe-208",
    user_name: "Ananya Patel",
    employee_code: "EXE-208",
    role: "AGENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 73).toISOString(),
    ip_address: "157.34.192.44",
    device_model: "Apple iPhone 15 Pro (iOS 18.2)",
    browser: "Mobile Safari 18.2",
    channel: "MOBILE_APP",
    status: "FAILED_MFA",
    mfa_used: true
  },
  {
    id: "log-in-105",
    user_id: "usr-exe-215",
    user_name: "Vikram Malhotra",
    employee_code: "EXE-215",
    role: "AGENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    ip_address: "157.34.192.89",
    device_model: "Samsung Galaxy S24 Ultra (Android 14)",
    browser: "Chrome Mobile 122.0",
    channel: "MOBILE_APP",
    status: "SUCCESS",
    mfa_used: false
  },
  {
    id: "log-in-106",
    user_id: "usr-exe-210",
    user_name: "Karan Mehta",
    employee_code: "EXE-210",
    role: "AGENT",
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    ip_address: "103.21.144.55",
    device_model: "MacBook Pro 14 M3 (macOS 14.3)",
    browser: "Chrome 122.0.6",
    channel: "WEB_APP",
    status: "SUCCESS",
    mfa_used: true
  }
];

export const MOCK_CALL_LOGS: CallLogRecord[] = [
  {
    id: "call-rec-901",
    caller_name: "Rahul Verma",
    caller_code: "EXE-204",
    lead_name: "Aarav Sharma",
    lead_phone_masked: "+91 98200 •••••",
    property_title: "The Grand Crest - Sky Villa 401 (₹4.85 Cr)",
    bridge_id: "BRG-2026-9941",
    start_time: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    duration_seconds: 342,
    duration_formatted: "5m 42s",
    outcome: "Site Visit Scheduled",
    notes: "Buyer confirmed private walkthrough this Saturday at 11:30 AM. Interested in payment schedule.",
    is_encrypted: true
  },
  {
    id: "call-rec-902",
    caller_name: "Ananya Patel",
    caller_code: "EXE-208",
    lead_name: "Kavita Chawla",
    lead_phone_masked: "+91 98199 •••••",
    property_title: "Palm Serenade - Signature Villa 12 (₹7.25 Cr)",
    bridge_id: "BRG-2026-8812",
    start_time: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    duration_seconds: 495,
    duration_formatted: "8m 15s",
    outcome: "Term Sheet Negotiation",
    notes: "Detailed pricing negotiation on Villa 12. Discussed stamp duty waiver. Flagged for close supervision.",
    is_encrypted: true
  },
  {
    id: "call-rec-903",
    caller_name: "Vikram Malhotra",
    caller_code: "EXE-215",
    lead_name: "Pooja Hegde",
    lead_phone_masked: "+91 98700 •••••",
    property_title: "Marina Azure Residence (₹3.40 Cr)",
    bridge_id: "BRG-2026-7730",
    start_time: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    duration_seconds: 180,
    duration_formatted: "3m 00s",
    outcome: "Brochure Dispatched",
    notes: "Meta Instagram lead contacted within 8 mins. Sent digital floor plans via encrypted portal.",
    is_encrypted: true
  },
  {
    id: "call-rec-904",
    caller_name: "Karan Mehta",
    caller_code: "EXE-210",
    lead_name: "Rohan Kapoor",
    lead_phone_masked: "+91 98211 •••••",
    property_title: "Worli Bayview Luxury Penthouse (₹12.00 Cr)",
    bridge_id: "BRG-2026-6619",
    start_time: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    duration_seconds: 640,
    duration_formatted: "10m 40s",
    outcome: "Deal Won (Booking Confirmed)",
    notes: "₹24 Lakhs commission earned. Client wired token amount. Handled strictly via recorded CRM bridge.",
    is_encrypted: true
  }
];

export const MOCK_MINUTE_ACTIVITIES: MinuteActivityRecord[] = [
  {
    id: "act-min-01",
    timestamp: new Date(Date.now() - 1000 * 45).toISOString(),
    agent_name: "Karan Mehta",
    employee_code: "EXE-210",
    activity_type: "DEAL_UPDATE",
    title: "Stage Transition: WON",
    description: "Marked Worli Bayview Luxury Penthouse as WON (₹12.0 Cr deal, ₹24,00,000 agency brokerage confirmed).",
    severity: "INFO",
    deal_value: 120000000,
    brokerage_commission: 2400000
  },
  {
    id: "act-min-02",
    timestamp: new Date(Date.now() - 1000 * 120).toISOString(),
    agent_name: "Ananya Patel",
    employee_code: "EXE-208",
    activity_type: "SECURITY_ALERT",
    title: "Theft Radar: Offline Closing Suspected",
    description: "Marked lead 'LOST' for Kavita Chawla, but GPS telemetry proved 3 physical site visits. Commission of ₹14.5L protected.",
    severity: "CRITICAL",
    deal_value: 72500000,
    brokerage_commission: 1450000
  },
  {
    id: "act-min-03",
    timestamp: new Date(Date.now() - 1000 * 210).toISOString(),
    agent_name: "Rahul Verma",
    employee_code: "EXE-204",
    activity_type: "CALL_PLACED",
    title: "Masked Call Bridge Initiated",
    description: "Completed 5m 42s encrypted call with Aarav Sharma regarding The Grand Crest Villa 401. Scheduled Saturday visit.",
    severity: "INFO"
  },
  {
    id: "act-min-04",
    timestamp: new Date(Date.now() - 1000 * 360).toISOString(),
    agent_name: "Vikram Malhotra",
    employee_code: "EXE-215",
    activity_type: "GPS_CHECKIN",
    title: "Field GPS Geofence Check-in",
    description: "Detected at Marina Azure Site Office (18.922, 72.834) on Apple iPhone 15 Pro. Telemetry broadcasted.",
    severity: "INFO"
  },
  {
    id: "act-min-05",
    timestamp: new Date(Date.now() - 1000 * 600).toISOString(),
    agent_name: "Rahul Verma",
    employee_code: "EXE-204",
    activity_type: "LEAD_VIEW",
    title: "Lead Profile Inspected",
    description: "Accessed masked contact details for Siddharth Singhania. Audit hash chained to DLP ledger.",
    severity: "INFO"
  },
  {
    id: "act-min-06",
    timestamp: new Date(Date.now() - 1000 * 900).toISOString(),
    agent_name: "Vikramaditya (Owner)",
    employee_code: "OWNER-01",
    activity_type: "EXPORT_REQUEST",
    title: "DLP Lead Export Reviewed",
    description: "Supervised export compliance review for offshore syndicate audit. Mandatory watermarking attached.",
    severity: "WARNING"
  }
];
