#!/usr/bin/env node
/**
 * Fetches the events Google Sheet (as CSV), generates events.json.
 * Runs automatically before each build. If SHEETS_CSV_URL is not set,
 * leaves the existing events.json in place — useful for local dev.
 *
 * Sheet schema (column names, case-insensitive, in any order):
 *   ID, Title, Organization, Category, Performance Dates, Duration,
 *   Description, Short Description, Ticket URL, Price Range, Age Guidance,
 *   Image Filename, Image Alt, Accent Color, Hidden
 *
 * Performance Dates: one date per line in the cell, format "YYYY-MM-DD HH:MM" (24-hour)
 * Duration: minutes per performance (defaults to 120)
 * Hidden: TRUE to skip the row, anything else (or blank) to include
 */

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const eventsPath = resolve(__dirname, '..', 'events.json');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const url = process.env.SHEETS_CSV_URL;
if (!url) {
  if (existsSync(eventsPath)) {
    console.log(`${DIM}SHEETS_CSV_URL not set — using existing events.json${RESET}`);
    process.exit(0);
  }
  console.error(`${RED}✗ SHEETS_CSV_URL not set and no events.json exists.${RESET}`);
  process.exit(1);
}

console.log(`${DIM}Fetching events sheet…${RESET}`);

let csv;
try {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  csv = await res.text();
} catch (err) {
  console.error(`${RED}✗ Could not fetch the events sheet.${RESET}`);
  console.error(`${DIM}  ${err.message}${RESET}`);
  console.error(`${YELLOW}  Check the sheet is published to the web and that SHEETS_CSV_URL points to its CSV export.${RESET}`);
  process.exit(1);
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 2; }
      else if (c === '"') { inQuotes = false; i++; }
      else { field += c; i++; }
    } else {
      if (c === '"' && field === '') { inQuotes = true; i++; }
      else if (c === ',') { row.push(field); field = ''; i++; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      }
      else { field += c; i++; }
    }
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

const rows = parseCSV(csv).filter((r) => r.some((c) => c && c.trim() !== ''));
if (rows.length < 2) {
  console.error(`${RED}✗ Sheet has no event rows.${RESET}`);
  process.exit(1);
}

const headers = rows[0].map((h) => h.trim().toLowerCase());
const dataRows = rows.slice(1);

const col = (name) => headers.indexOf(name.toLowerCase());
const get = (row, name) => {
  const idx = col(name);
  if (idx === -1) return '';
  return (row[idx] || '').trim();
};

function pad(n) { return String(n).padStart(2, '0'); }

const offsetCache = new Map();
function mountainOffset(year, month, day) {
  const key = `${year}-${month}-${day}`;
  if (offsetCache.has(key)) return offsetCache.get(key);
  const sample = new Date(Date.UTC(year, month - 1, day, 12, 0));
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Denver',
    timeZoneName: 'longOffset',
  }).formatToParts(sample);
  const tz = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT-07:00';
  const offset = tz.replace(/^GMT/, '') || '-07:00';
  offsetCache.set(key, offset);
  return offset;
}

function parsePerformance(line, durationMinutes) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  // Accept "YYYY-MM-DD HH:MM" or "YYYY-MM-DDTHH:MM" or "YYYY-MM-DD HH:MM:SS"
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new Error(`Could not parse performance date "${trimmed}". Use format "YYYY-MM-DD HH:MM" (24-hour clock), e.g. "2026-09-11 19:30".`);
  }
  const [, y, mo, d, h, mi, s] = match;
  const year = Number(y), month = Number(mo), day = Number(d);
  const hour = Number(h), minute = Number(mi), second = Number(s || 0);
  const offset = mountainOffset(year, month, day);
  const startISO = `${y}-${mo}-${d}T${pad(hour)}:${mi}:${pad(second)}${offset}`;
  const startMs = Date.UTC(year, month - 1, day, hour, minute, second) - (parseInt(offset) * 3600000);
  const endMs = startMs + durationMinutes * 60000;
  const end = new Date(endMs);
  const endY = end.getUTCFullYear();
  const endMonth = end.getUTCMonth() + 1;
  const endDay = end.getUTCDate();
  const endOffset = mountainOffset(endY, endMonth, endDay);
  // Compute local end time using the end-date offset (handles DST crossings cleanly)
  const localEnd = new Date(endMs + (parseInt(endOffset) * 3600000));
  const endISO = `${localEnd.getUTCFullYear()}-${pad(localEnd.getUTCMonth() + 1)}-${pad(localEnd.getUTCDate())}T${pad(localEnd.getUTCHours())}:${pad(localEnd.getUTCMinutes())}:${pad(localEnd.getUTCSeconds())}${endOffset}`;
  return { start: startISO, end: endISO };
}

const events = [];
const errors = [];

dataRows.forEach((row, ri) => {
  const rowNum = ri + 2; // +1 for header, +1 for 1-indexing
  const hidden = get(row, 'Hidden').toUpperCase();
  if (hidden === 'TRUE' || hidden === 'YES' || hidden === '1') return;

  const id = get(row, 'ID');
  const title = get(row, 'Title');
  if (!id || !title) {
    // Skip empty-ish rows silently if no id AND no title
    if (!id && !title) return;
    errors.push(`Row ${rowNum}: missing ${!id ? 'ID' : 'Title'}.`);
    return;
  }

  const durationRaw = get(row, 'Duration');
  const duration = durationRaw ? Number(durationRaw) : 120;
  if (Number.isNaN(duration) || duration <= 0) {
    errors.push(`Row ${rowNum} (${id}): Duration "${durationRaw}" is not a positive number.`);
    return;
  }

  const performances = [];
  const datesRaw = get(row, 'Performance Dates');
  if (!datesRaw) {
    errors.push(`Row ${rowNum} (${id}): Performance Dates is empty.`);
    return;
  }
  const dateLines = datesRaw.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  for (const line of dateLines) {
    try {
      const p = parsePerformance(line, duration);
      if (p) performances.push(p);
    } catch (err) {
      errors.push(`Row ${rowNum} (${id}): ${err.message}`);
    }
  }
  if (performances.length === 0) return;

  const imageFilename = get(row, 'Image Filename');
  const image = imageFilename ? `/images/events/${imageFilename.replace(/^\//, '')}` : undefined;

  const event = {
    id,
    title,
    organization: get(row, 'Organization'),
    category: get(row, 'Category').toLowerCase(),
    performances,
    description: get(row, 'Description'),
    shortDescription: get(row, 'Short Description'),
  };

  const optional = {
    ticketUrl: get(row, 'Ticket URL'),
    priceRange: get(row, 'Price Range'),
    ageGuidance: get(row, 'Age Guidance'),
    image,
    imageAlt: get(row, 'Image Alt'),
    accentColor: get(row, 'Accent Color'),
  };
  for (const [k, v] of Object.entries(optional)) {
    if (v) event[k] = v;
  }

  events.push(event);
});

if (errors.length > 0) {
  console.error(`${RED}✗ Sheet has ${errors.length} problem${errors.length === 1 ? '' : 's'}:${RESET}`);
  errors.forEach((e) => console.error(`  ${RED}•${RESET} ${e}`));
  process.exit(1);
}

const output = {
  $schema: 'Auto-generated from the events Google Sheet at build time. Do not edit by hand — changes will be overwritten on the next build. Edit the sheet instead.',
  events,
};

writeFileSync(eventsPath, JSON.stringify(output, null, 2) + '\n');
console.log(`${GREEN}✓ Generated events.json from sheet${RESET} ${DIM}(${events.length} events, ${events.reduce((s, e) => s + e.performances.length, 0)} performances)${RESET}`);
