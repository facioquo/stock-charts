import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { FEED_DELAY_MINUTES } from "./quotes";

/**
 * Workers cron triggers run in UTC, while the US market keeps New York time and
 * moves between UTC-4 (EDT) and UTC-5 (EST). These tests read the deployed
 * schedule and check, with real time zone rules, that the refresh still runs
 * after each session's close in both seasons.
 */
const wranglerPath = resolve(dirname(fileURLToPath(import.meta.url)), "../wrangler.jsonc");

function configuredCrons(): string[] {
  const match = /"crons"\s*:\s*\[([^\]]*)\]/.exec(readFileSync(wranglerPath, "utf8"));

  if (match === null) {
    throw new Error("No crons found in wrangler.jsonc");
  }

  return [...match[1].matchAll(/"([^"]+)"/g)].map(entry => entry[1]);
}

/** Matches one cron field: `*`, `*\/n`, `a`, `a-b`, `a-b/n`, or a list of them. */
function fieldMatches(field: string, value: number): boolean {
  return field.split(",").some(part => {
    const [range, stepText] = part.split("/");
    const step = stepText === undefined ? 1 : Number(stepText);
    const [low, high] = range === "*" ? [0, Number.MAX_SAFE_INTEGER] : range.split("-").map(Number);
    const top = high ?? (stepText === undefined ? low : Number.MAX_SAFE_INTEGER);

    return value >= low && value <= top && (value - low) % step === 0;
  });
}

function cronMatches(cron: string, at: Date): boolean {
  const [minute, hour, day, month, weekday] = cron.trim().split(/\s+/);

  return (
    fieldMatches(minute, at.getUTCMinutes()) &&
    fieldMatches(hour, at.getUTCHours()) &&
    fieldMatches(day, at.getUTCDate()) &&
    fieldMatches(month, at.getUTCMonth() + 1) &&
    fieldMatches(weekday, at.getUTCDay())
  );
}

const newYork = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hourCycle: "h23",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric"
});

/** The UTC instant of a New York wall-clock time. */
function newYorkTime(year: number, month: number, day: number, hour: number, minute: number): Date {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  let instant = wall + 5 * 60 * 60_000;

  // Two passes settle the offset, including across a DST change.
  for (let pass = 0; pass < 2; pass++) {
    const parts = Object.fromEntries(
      newYork.formatToParts(new Date(instant)).map(part => [part.type, Number(part.value)])
    );
    const shown = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    instant += wall - shown;
  }

  return new Date(instant);
}

function newYorkHourOffset(at: Date): number {
  const parts = Object.fromEntries(
    newYork.formatToParts(at).map(part => [part.type, Number(part.value)])
  );
  const shown = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);

  return (shown - at.getTime()) / (60 * 60_000);
}

/** True when some cron fires between `from` and the end of that New York day. */
function runsAfter(crons: string[], from: Date, endOfDay: Date): boolean {
  for (let at = from.getTime(); at <= endOfDay.getTime(); at += 60_000) {
    if (crons.some(cron => cronMatches(cron, new Date(at)))) {
      return true;
    }
  }

  return false;
}

describe("quote refresh schedule", () => {
  const crons = configuredCrons();
  const closeMinute = 16 * 60 + FEED_DELAY_MINUTES;

  it("uses UTC offsets that differ between summer and winter", () => {
    expect(newYorkHourOffset(newYorkTime(2026, 7, 15, 12, 0))).toBe(-4);
    expect(newYorkHourOffset(newYorkTime(2026, 12, 15, 12, 0))).toBe(-5);
  });

  it.each([
    ["EDT", 2026, 7, 15],
    ["EST", 2026, 12, 15],
    ["first EST weekday", 2026, 11, 2],
    ["first EDT weekday", 2026, 3, 9]
  ])("runs after the close in %s (%i-%i-%i)", (_season, year, month, day) => {
    const close = newYorkTime(year, month, day, Math.floor(closeMinute / 60), closeMinute % 60);
    const endOfDay = newYorkTime(year, month, day, 23, 59);

    expect(runsAfter(crons, close, endOfDay)).toBe(true);
  });

  it("runs after the close on every weekday of the year", () => {
    const missed: string[] = [];

    for (let date = new Date(Date.UTC(2026, 0, 1)); date.getUTCFullYear() === 2026;) {
      const weekday = date.getUTCDay();
      const [year, month, day] = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()];

      if (weekday !== 0 && weekday !== 6) {
        const close = newYorkTime(year, month, day, Math.floor(closeMinute / 60), closeMinute % 60);
        const endOfDay = newYorkTime(year, month, day, 23, 59);

        if (!runsAfter(crons, close, endOfDay)) {
          missed.push(date.toISOString().slice(0, 10));
        }
      }

      date = new Date(date.getTime() + 24 * 60 * 60_000);
    }

    expect(missed).toEqual([]);
  });
});
