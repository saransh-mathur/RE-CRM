import test from "node:test";
import assert from "node:assert/strict";
import { apiFetch, initMockInterceptor } from "./mockApi";

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

test("apiFetch directly serves leads and call logs without relying on window.fetch mutation", async () => {
  const leadsResp = await apiFetch("http://localhost:8000/api/v1/leads");
  assert.equal(leadsResp.status, 200);
  const leads = await leadsResp.json();
  assert.ok(Array.isArray(leads) && leads.length >= 20);

  const callsResp = await apiFetch("http://localhost:8000/api/v1/telemetry/call-logs");
  assert.equal(callsResp.status, 200);
  const calls = await callsResp.json();
  assert.ok(Array.isArray(calls) && calls.length >= 10);
});
