#!/usr/bin/env node
/**
 * Validates events.json before the site builds.
 * Run automatically via `npm run build`. If validation fails, the build stops
 * with a clear error message pointing to the exact event and field that needs fixing.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const eventsPath = resolve(__dirname, '..', 'events.json');
const orgsPath = resolve(__dirname, '..', 'src', 'data', 'organizations.js');

const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const VALID_CATEGORIES = ['theater', 'dance', 'film', 'music', 'other'];

let eventsFile;
try {
  eventsFile = JSON.parse(readFileSync(eventsPath, 'utf8'));
} catch (err) {
  console.error(`${RED}✗ events.json is not valid JSON.${RESET}`);
  console.error(`${DIM}  ${err.message}${RESET}`);
  console.error(`${YELLOW}  Common causes: a missing comma between fields, an extra trailing comma after the last item, or an unclosed quote.${RESET}`);
  process.exit(1);
}

const orgsSource = readFileSync(orgsPath, 'utf8');
const orgSlugs = Array.from(orgsSource.matchAll(/slug:\s*'([^']+)'/g)).map((m) => m[1]);

const errors = [];
const warnings = [];

function err(eventIdx, eventId, message) {
  errors.push(`Event #${eventIdx + 1} (${eventId || 'no id'}): ${message}`);
}

function warn(eventIdx, eventId, message) {
  warnings.push(`Event #${eventIdx + 1} (${eventId || 'no id'}): ${message}`);
}

if (!Array.isArray(eventsFile.events)) {
  console.error(`${RED}✗ events.json must have an "events" key that is an array.${RESET}`);
  process.exit(1);
}

const seenIds = new Set();

eventsFile.events.forEach((event, i) => {
  const eid = event.id;

  // Required string fields
  for (const field of ['id', 'title', 'organization', 'category', 'description', 'shortDescription']) {
    if (!event[field] || typeof event[field] !== 'string') {
      err(i, eid, `missing required field "${field}".`);
    }
  }

  if (eid) {
    if (seenIds.has(eid)) err(i, eid, `duplicate id "${eid}". Each event needs a unique id.`);
    seenIds.add(eid);
  }

  if (event.organization && !orgSlugs.includes(event.organization)) {
    err(i, eid, `organization "${event.organization}" is not one of: ${orgSlugs.join(', ')}.`);
  }

  if (event.category && !VALID_CATEGORIES.includes(event.category)) {
    err(i, eid, `category "${event.category}" is not one of: ${VALID_CATEGORIES.join(', ')}.`);
  }

  if (!Array.isArray(event.performances) || event.performances.length === 0) {
    err(i, eid, `"performances" must be a non-empty array.`);
  } else {
    event.performances.forEach((p, pi) => {
      if (!p.start) {
        err(i, eid, `performance #${pi + 1} is missing "start".`);
      } else if (Number.isNaN(new Date(p.start).getTime())) {
        err(i, eid, `performance #${pi + 1} has an invalid "start" date "${p.start}". Use ISO 8601 with timezone, e.g. "2026-05-22T19:30:00-06:00".`);
      }
      if (p.end && Number.isNaN(new Date(p.end).getTime())) {
        err(i, eid, `performance #${pi + 1} has an invalid "end" date "${p.end}".`);
      }
    });
  }

  if (event.image && !event.image.startsWith('/')) {
    err(i, eid, `image path "${event.image}" must start with "/" (e.g. "/images/events/foo.jpg").`);
  }

  if (event.accentColor && !/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(event.accentColor)) {
    err(i, eid, `accentColor "${event.accentColor}" must be a hex color like "#a87842" or "#abc".`);
  }

  if (event.ticketUrl && !/^https?:\/\//.test(event.ticketUrl)) {
    warn(i, eid, `ticketUrl "${event.ticketUrl}" should start with "https://".`);
  }

  if (event.shortDescription && event.shortDescription.length > 180) {
    warn(i, eid, `shortDescription is ${event.shortDescription.length} characters — aim for under 180 so it doesn't wrap awkwardly on event cards.`);
  }
});

if (warnings.length > 0) {
  console.log(`${YELLOW}⚠ ${warnings.length} warning${warnings.length === 1 ? '' : 's'}:${RESET}`);
  warnings.forEach((w) => console.log(`  ${YELLOW}•${RESET} ${w}`));
  console.log('');
}

if (errors.length > 0) {
  console.error(`${RED}✗ events.json has ${errors.length} error${errors.length === 1 ? '' : 's'}:${RESET}\n`);
  errors.forEach((e) => console.error(`  ${RED}•${RESET} ${e}`));
  console.error(`\n${YELLOW}Fix the errors above and try again. The site will not deploy until they're fixed.${RESET}`);
  console.error(`${DIM}For help, see EDITING_GUIDE.md in the repo.${RESET}`);
  process.exit(1);
}

console.log(`${GREEN}✓ events.json is valid${RESET} ${DIM}(${eventsFile.events.length} events, ${eventsFile.events.reduce((s, e) => s + (e.performances?.length || 0), 0)} total performances)${RESET}`);
