import test from "node:test";
import assert from "node:assert/strict";
import { apiFetch, initMockInterceptor, mockStore } from "./mockApi";
import { maskIndianPhoneNumber } from "./formatters";

test("initMockInterceptor does not throw when window.fetch is a non-configurable getter", () => {
  const originalWindow = (globalThis as any).window;
  const fakeWindow: Record<string, unknown> = {};
  Object.defineProperty(fakeWindow, "fetch", {
    get() {
      return globalThis.fetch;
    },
    configurable: false
  });

  (globalThis as any).window = fakeWindow;
  try {
    assert.doesNotThrow(() => {
      initMockInterceptor();
    });
  } finally {
    if (originalWindow === undefined) {
      delete (globalThis as any).window;
    } else {
      (globalThis as any).window = originalWindow;
    }
  }
});

test("maskIndianPhoneNumber strips +91 country code and leading 0 accurately", () => {
  assert.equal(maskIndianPhoneNumber("+919876543210"), "+91 98*** **10");
  assert.equal(maskIndianPhoneNumber("+91 98765 43210"), "+91 98*** **10");
  assert.equal(maskIndianPhoneNumber("919876543210"), "+91 98*** **10");
  assert.equal(maskIndianPhoneNumber("09876543210"), "+91 98*** **10");
  assert.equal(maskIndianPhoneNumber("9876543210"), "+91 98*** **10");
  assert.match(maskIndianPhoneNumber(""), /^\+91 98\*\*\* \*\*\d{2}$/);
});

test("apiFetch directly serves leads, call logs, and masks newly created lead phone numbers", async () => {
  const leadsResp = await apiFetch("http://localhost:8000/api/v1/leads");
  assert.equal(leadsResp.status, 200);
  const leads = await leadsResp.json();
  assert.ok(Array.isArray(leads) && leads.length >= 20);

  const createResp = await apiFetch("http://localhost:8000/api/v1/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_name: "Rohit Kapoor",
      phone: "+919876543210",
      source: "WHATSAPP_AD",
      assigned_agent_name: "Dhruv Chaudhary"
    })
  });
  assert.equal(createResp.status, 201);
  const created = await createResp.json();
  assert.equal(created.phone_masked, "+91 98*** **10");

  // Restore clean mock state after test
  mockStore.resetToDefaults();

  const callsResp = await apiFetch("http://localhost:8000/api/v1/telemetry/call-logs");
  assert.equal(callsResp.status, 200);
  const calls = await callsResp.json();
  assert.ok(Array.isArray(calls) && calls.length >= 10);
});
