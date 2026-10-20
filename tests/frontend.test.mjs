import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs/promises";

const geometry = (
  await fs.readFile(
    new URL("../public/widget-layout.js", import.meta.url),
    "utf8",
  )
).replace(/^export /gm, "");
const app = await fs.readFile(
  new URL("../public/widgets.js", import.meta.url),
  "utf8",
);

test("authenticated requests wait for the session token, including early UI requests", async (t) => {
  const calls = [];
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  let resolveSession;
  globalThis.fetch = async (route, options) => {
    calls.push({ route, options });
    if (route === "/api/session")
      return new Promise((resolve) => {
        resolveSession = resolve;
      });
    return { ok: true, json: async () => ({ ok: true }) };
  };
  const { api, startSession } = await import("../public/api.js?session-test");
  const pending = api("/api/status");
  await Promise.resolve();
  assert.equal(calls.length, 0, "no unauthenticated request may escape");
  const starting = startSession();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].route, "/api/session");
  resolveSession({ ok: true, json: async () => ({ token: "session-ready" }) });
  await starting;
  await pending;
  assert.equal(calls.length, 2);
  assert.equal(calls[1].options.headers["X-Hugo-Token"], "session-ready");
});

test("floating widgets avoid the central content and each other, even with identical saved positions", () => {
  const context = vm.createContext({});
  vm.runInContext(geometry, context);
  const result = vm.runInContext(
    `(() => {
    const canvas = {width: 1200, height: 650};
    const centre = {x: 302, y: -16, width: 596, height: 682};
    const occupied = [centre];
    const placed = [];
    for (const size of [{width:282,height:285},{width:282,height:195},{width:260,height:150},{width:260,height:150}]) {
      const point = HugoWidgetLayout.resolve(size,{x:600,y:0},canvas,occupied);
      if (!point) return null;
      const rect = {...point,...size}; occupied.push(rect); placed.push(rect);
    }
    return {placed,centre};
  })()`,
    context,
  );
  assert.ok(result);
  for (let i = 0; i < result.placed.length; i++) {
    const a = result.placed[i];
    assert.ok(a.x + a.width <= 1200 && a.y + a.height <= 650);
    for (const b of [result.centre, ...result.placed.slice(i + 1)]) {
      assert.ok(
        a.x + a.width + 16 <= b.x ||
          b.x + b.width + 16 <= a.x ||
          a.y + a.height + 16 <= b.y ||
          b.y + b.height + 16 <= a.y,
      );
    }
  }
});

test("insufficient floating space returns no placement so UI can use the normal grid", () => {
  const context = vm.createContext({});
  vm.runInContext(geometry, context);
  assert.equal(
    vm.runInContext(
      "HugoWidgetLayout.resolve({width:282,height:300},{x:0,y:0},{width:500,height:200})",
      context,
    ),
    null,
  );
});

const calendarLoader = app.slice(
  app.indexOf("async function loadCalendar()"),
  app.indexOf("$('#calendar-retry').onclick"),
);
function calendarHarness(response, googleUrl = "") {
  class Node {
    constructor() {
      this.textContent = "";
      this.hidden = false;
      this.children = [];
      this.attributes = {};
    }
    set innerHTML(value) {
      throw new Error("HTML injection is forbidden");
    }
    setAttribute(key, value) {
      this.attributes[key] = value;
    }
    append(...nodes) {
      this.children.push(...nodes);
    }
    replaceChildren(...nodes) {
      this.children = [...nodes];
    }
  }
  const nodes = Object.fromEntries(
    [
      "calendar-empty",
      "calendar-events",
      "calendar-retry",
      "calendar-status",
    ].map((id) => ["#" + id, new Node()]),
  );
  const context = vm.createContext({
    $: (id) => nodes[id],
    api: () => response(),
    document: { createElement: () => new Node() },
    stamp: () => "20.10.26",
    resizeWidgets() {},
  });
  vm.runInContext(
    "let calendarRequest=0; let showCalendarEmbed=true; let calendarFrameUrl=" +
      JSON.stringify(googleUrl) +
      ";" +
      calendarLoader,
    context,
  );
  return { nodes, load: () => vm.runInContext("loadCalendar()", context) };
}
test("calendar loading, failure, retry and empty states stay distinguishable", async () => {
  let rejectRequest;
  let response = () =>
    new Promise((resolve, reject) => {
      rejectRequest = reject;
    });
  const h = calendarHarness(() => response());
  const loading = h.load();
  assert.equal(
    h.nodes["#calendar-empty"].textContent,
    "Termine werden geladen …",
  );
  assert.equal(h.nodes["#calendar-events"].attributes["aria-busy"], "true");
  rejectRequest(new Error("offline"));
  await loading;
  assert.equal(h.nodes["#calendar-retry"].hidden, false);
  assert.match(h.nodes["#calendar-empty"].textContent, /nicht geladen/);
  response = async () => ({
    configured: true,
    events: [],
    warnings: [],
    importedAt: "now",
  });
  await h.load();
  assert.equal(
    h.nodes["#calendar-empty"].textContent,
    "Keine Termine in den nächsten 7 Tagen",
  );
  assert.equal(h.nodes["#calendar-retry"].hidden, true);
  assert.equal(h.nodes["#calendar-events"].attributes["aria-busy"], "false");
  response = async () => ({ configured: false, events: [], warnings: [] });
  await h.load();
  assert.match(h.nodes["#calendar-empty"].textContent, /importieren/);
});
test("calendar titles are literal text and never parsed as HTML", async () => {
  const title = "<img src=x onerror=alert(1)>";
  const h = calendarHarness(async () => ({
    configured: true,
    importedAt: "now",
    warnings: [],
    events: [{ date: "2026-10-20", time: "10:00", allDay: false, title }],
  }));
  await h.load();
  const item = h.nodes["#calendar-events"].children[0];
  assert.equal(item.children[1].textContent, title);
  assert.match(item.children[0].textContent, /10:00/);
});

test("connected Google calendar displays without requesting an ICS import", async () => {
  const h = calendarHarness(() => {
    throw new Error("ICS must not be requested");
  }, "https://calendar.google.com/calendar/embed?src=example");
  await h.load();
  assert.equal(h.nodes["#calendar-empty"].hidden, true);
  assert.equal(h.nodes["#calendar-events"].hidden, true);
  assert.match(h.nodes["#calendar-status"].textContent, /kein Dateiimport/);
});
