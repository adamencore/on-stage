#!/usr/bin/env node
/**
 * Generates events-template.csv from events.json.
 * Run once to seed the Google Sheet.
 *   npm run csv-template
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const eventsPath = resolve(__dirname, '..', 'events.json');
const outPath = resolve(__dirname, '..', 'events-template.csv');

const HEADERS = [
  'ID',
  'Title',
  'Organization',
  'Category',
  'Performance Dates',
  'Duration',
  'Description',
  'Short Description',
  'Ticket URL',
  'Price Range',
  'Age Guidance',
  'Image Filename',
  'Image Alt',
  'Accent Color',
  'Hidden',
];

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes('"') || s.includes(',') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function eventToRow(event) {
  const perfLines = event.performances.map((p) => {
    const start = new Date(p.start);
    const offset = -start.getTimezoneOffset(); // not used; we format from ISO
    const localISO = p.start;
    const match = localISO.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
    return match ? `${match[1]} ${match[2]}:${match[3]}` : localISO;
  }).join('\n');

  let durationMin = 120;
  if (event.performances[0]?.end && event.performances[0]?.start) {
    durationMin = Math.round((new Date(event.performances[0].end) - new Date(event.performances[0].start)) / 60000);
  }

  const imageFilename = event.image ? event.image.replace(/^.*\/images\/events\//, '') : '';

  return [
    event.id || '',
    event.title || '',
    event.organization || '',
    event.category || '',
    perfLines,
    durationMin,
    event.description || '',
    event.shortDescription || '',
    event.ticketUrl || '',
    event.priceRange || '',
    event.ageGuidance || '',
    imageFilename,
    event.imageAlt || '',
    event.accentColor || '',
    '',
  ];
}

const data = JSON.parse(readFileSync(eventsPath, 'utf8'));
const lines = [HEADERS.map(csvEscape).join(',')];
for (const event of data.events) {
  lines.push(eventToRow(event).map(csvEscape).join(','));
}

writeFileSync(outPath, lines.join('\n') + '\n');
console.log(`✓ Wrote ${outPath}`);
console.log(`  ${data.events.length} events, ${HEADERS.length} columns`);
