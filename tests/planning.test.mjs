import test from "node:test";
import assert from "node:assert/strict";
import {
  validateSnapshot,
  planningContext,
  createIntegrations,
  weather,
} from "../integrations.mjs";
import { calendarWeek } from "../calendar.mjs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
const week = { start: "2026-10-19", end: "2026-10-25" };
const snapshot = {
  source: "klassenflow",
  weekStart: week.start,
  text: "Montag: Mathematik Brüche und Dezimalzahlen.",
};
test("weekly planning rejects spoofed sources, malformed dates and a different week", () => {
  assert.throws(() =>
    validateSnapshot({ ...snapshot, url: "https://evil.test" }),
  );
  assert.throws(() =>
    validateSnapshot({ ...snapshot, weekStart: "2026-02-30" }),
  );
  assert.throws(() =>
    validateSnapshot({ ...snapshot, weekStart: "2026-10-20" }),
  );
  const captured = validateSnapshot(snapshot, new Date("2026-10-19T10:00Z"));
  assert.equal(planningContext([captured], week).documents.length, 1);
  assert.equal(
    planningContext([{ ...captured, weekStart: "2026-10-12" }], week).documents
      .length,
    0,
  );
  assert.match(
    planningContext(
      [captured],
      week,
      new Date("2026-10-21T10:00Z"),
    ).warnings.join(" "),
    /24 Stunden/,
  );
  assert.match(
    planningContext(
      [validateSnapshot({ ...snapshot, source: "learningview" })],
      week,
    ).warnings.join(" "),
    /kein Nachweis/,
  );
});
test("calendar accepts only Google embeds; rejects unsafe URLs and invalid coordinates", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "hugo-sources-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const store = await createIntegrations(dir);
  await store.ingest(snapshot);
  assert.equal((await createIntegrations(dir)).snapshots().length, 1);
  await assert.rejects(
    store.settings({ calendarUrl: "https://evil.test/calendar/embed" }),
  );
  await assert.rejects(
    store.settings({
      calendarUrl: "https://user:pass@calendar.google.com/calendar/embed",
    }),
  );
  await store.settings({
    calendarUrl: "https://calendar.google.com/calendar/embed?src=me",
  });
  await assert.rejects(weather(null, { latitude: 95, longitude: 8 }));
});
const ics = (events) =>
  `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${events}\r\nEND:VCALENDAR`;
const event = (lines) => `BEGIN:VEVENT\r\n${lines.join("\r\n")}\r\nEND:VEVENT`;
test("weather coordinates survive restarting the store and a city replaces them", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "hugo-weather-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  let store = await createIntegrations(dir);
  await store.settings({
    weatherCoords: { latitude: 47.123456, longitude: 8.123456 },
  });
  store = await createIntegrations(dir);
  assert.deepEqual(store.state().settings.weatherCoords, {
    latitude: 47.12,
    longitude: 8.12,
  });
  await assert.rejects(
    store.settings({ weatherCoords: { latitude: 100, longitude: 8 } }),
  );
  await store.settings({ weatherCity: "Bern" });
  store = await createIntegrations(dir);
  assert.equal(store.state().settings.weatherCity, "Bern");
  assert.equal(store.state().settings.weatherCoords, null);
});
test("calendar expands repeated events in Zurich time and applies exclusions and overrides", () => {
  const text = ics(
    event([
      "UID:repeat",
      "DTSTART:20261005T090000Z",
      "DTEND:20261005T100000Z",
      "RRULE:FREQ=WEEKLY;COUNT=4",
      "SUMMARY:Unterricht",
    ]) +
      "\r\n" +
      event([
        "UID:repeat",
        "RECURRENCE-ID:20261019T090000Z",
        "DTSTART:20261020T100000Z",
        "DTEND:20261020T110000Z",
        "SUMMARY:Verschoben",
      ]),
  );
  const result = calendarWeek(text, week);
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].date, "2026-10-20");
  assert.equal(result.events[0].time, "12:00");
  assert.equal(result.events[0].title, "Verschoben");
  const excluded = ics(
    event([
      "UID:exclude",
      "DTSTART:20261005T090000Z",
      "DTEND:20261005T100000Z",
      "RRULE:FREQ=WEEKLY;COUNT=4",
      "EXDATE:20261019T090000Z",
      "SUMMARY:Entfällt",
    ]),
  );
  assert.equal(calendarWeek(excluded, week).events.length, 0);
});
test("calendar keeps all-day dates, ignores out-of-week items and warns for missing timezones", () => {
  const text = ics(
    event([
      "UID:all",
      "DTSTART;VALUE=DATE:20261019",
      "DTEND;VALUE=DATE:20261020",
      "SUMMARY:Ganztägig",
    ]) +
      "\r\n" +
      event(["UID:old", "DTSTART:20261012T100000Z", "SUMMARY:Alt"]) +
      "\r\n" +
      event([
        "UID:zone",
        "DTSTART;TZID=Missing/Zone:20261020T100000",
        "SUMMARY:Unbekannt",
      ]),
  );
  const result = calendarWeek(text, week);
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].allDay, true);
  assert.match(result.warnings.join(" "), /Zeitzone/);
  assert.throws(() => calendarWeek("not a calendar", week));
});

test("calendar list covers seven Swiss days across week, year and timezone boundaries", async () => {
  const { calendarNextDays } = await import("../calendar.mjs");
  const text = ics(
    event([
      "UID:next-week",
      "DTSTART;VALUE=DATE:20261026",
      "SUMMARY:Nächster Montag",
    ]) +
      "\r\n" +
      event([
        "UID:too-late",
        "DTSTART;VALUE=DATE:20261027",
        "SUMMARY:Ausserhalb",
      ]),
  );
  const result = calendarNextDays(text, new Date("2026-10-20T12:00:00Z"));
  assert.deepEqual(result.range, { start: "2026-10-20", end: "2026-10-26" });
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].title, "Nächster Montag");
  assert.deepEqual(
    calendarNextDays(null, new Date("2026-12-31T23:30:00Z")).range,
    { start: "2027-01-01", end: "2027-01-07" },
  );
  assert.equal(calendarNextDays(null).configured, false);
  assert.equal(calendarNextDays(ics("")).configured, true);
});
