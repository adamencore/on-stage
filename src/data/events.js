import eventsFile from '../../events.json' with { type: 'json' };
import { getOrganizationBySlug } from './organizations.js';

const TIME_ZONE = 'America/Denver';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: TIME_ZONE,
});

const dateFormatterNoYear = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  timeZone: TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  timeZone: TIME_ZONE,
});

const monthDayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  timeZone: TIME_ZONE,
});

const monthDayYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: TIME_ZONE,
});

const isoDayFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: TIME_ZONE,
});

function isoDayInTZ(date) {
  return isoDayFormatter.format(date);
}

function toSlug(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function enrichEvent(event) {
  const performances = (event.performances || [])
    .map((p) => ({
      start: new Date(p.start),
      end: p.end ? new Date(p.end) : null,
      startISO: p.start,
      endISO: p.end ?? null,
    }))
    .sort((a, b) => a.start - b.start);

  const firstPerformance = performances[0];
  const lastPerformance = performances[performances.length - 1];
  const now = new Date();
  const upcomingPerformances = performances.filter((p) => p.start >= now);
  const nextPerformance = upcomingPerformances[0] || null;

  const organization = getOrganizationBySlug(event.organization);

  const monthSegment = firstPerformance
    ? `${firstPerformance.start.getFullYear()}-${String(firstPerformance.start.getMonth() + 1).padStart(2, '0')}`
    : 'tba';

  const slug = toSlug(`${event.organization}-${event.title}-${monthSegment}`);

  return {
    ...event,
    organization,
    organizationSlug: event.organization,
    performances,
    firstPerformance,
    lastPerformance,
    nextPerformance,
    upcomingPerformances,
    isUpcoming: upcomingPerformances.length > 0,
    slug,
    url: `/events/${slug}/`,
  };
}

const allEvents = eventsFile.events.map(enrichEvent);

export function getAllEvents() {
  return allEvents;
}

export function getUpcomingEvents() {
  return allEvents
    .filter((e) => e.isUpcoming)
    .sort((a, b) => a.nextPerformance.start - b.nextPerformance.start);
}

export function getFeaturedEvents(count = 3) {
  return getUpcomingEvents().slice(0, count);
}

export function getEventsByOrganization(slug) {
  return allEvents
    .filter((e) => e.organizationSlug === slug)
    .sort((a, b) => {
      const aDate = a.nextPerformance?.start ?? a.firstPerformance?.start ?? new Date(0);
      const bDate = b.nextPerformance?.start ?? b.firstPerformance?.start ?? new Date(0);
      return aDate - bDate;
    });
}

export function getEventBySlug(slug) {
  return allEvents.find((e) => e.slug === slug);
}

export const formatDate = (date) => dateFormatter.format(date);
export const formatDateShort = (date) => dateFormatterNoYear.format(date);
export const formatTime = (date) => timeFormatter.format(date);
export const formatMonthDay = (date) => monthDayFormatter.format(date);
export const formatMonthDayYear = (date) => monthDayYearFormatter.format(date);

export function formatPerformanceRange(event) {
  if (!event.firstPerformance) return 'Dates to be announced';
  if (event.performances.length === 1) {
    return `${formatDate(event.firstPerformance.start)} · ${formatTime(event.firstPerformance.start)}`;
  }
  const first = event.firstPerformance.start;
  const last = event.lastPerformance.start;
  const sameYear = first.getFullYear() === last.getFullYear();
  const firstDay = isoDayInTZ(first);
  const lastDay = isoDayInTZ(last);
  if (firstDay === lastDay) {
    return formatDate(first);
  }
  if (sameYear) {
    return `${formatMonthDay(first)} – ${formatMonthDay(last)}, ${last.getFullYear()}`;
  }
  return `${formatMonthDayYear(first)} – ${formatMonthDayYear(last)}`;
}

export function formatPerformanceRangeShort(event) {
  if (!event.firstPerformance) return 'TBA';
  if (event.performances.length === 1) {
    return formatDateShort(event.firstPerformance.start);
  }
  const first = event.firstPerformance.start;
  const last = event.lastPerformance.start;
  const firstDay = isoDayInTZ(first);
  const lastDay = isoDayInTZ(last);
  if (firstDay === lastDay) return formatDateShort(first);
  return `${formatMonthDay(first)} – ${formatMonthDay(last)}`;
}

export const CATEGORIES = [
  { slug: 'theater', label: 'Theater' },
  { slug: 'dance', label: 'Dance' },
  { slug: 'film', label: 'Film' },
  { slug: 'music', label: 'Music' },
  { slug: 'other', label: 'Other' },
];
