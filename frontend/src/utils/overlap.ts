import { UnifiedCalendarItem, Todo, CalendarEvent, TimeChunk } from '../types';

/**
 * Format a Date to local YYYY-MM-DDTHH:mm string for datetime-local inputs.
 */
export const toLocalDatetime = (d: Date | string): string => {
  const date = typeof d === 'string' ? new Date(d) : d;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

/**
 * Clean decoration prefixes from item titles (e.g. checkboxes, time chunk markers).
 */
export const cleanItemTitle = (title: string): string => {
  return title
    .replace(/^[✓☐\s]+/, '')
    .replace(/^⚡\s*\[.*?\]\s*/, '')
    .trim();
};

/**
 * Calculate the timed interval [start, end] for an item on the schedule grid.
 * Returns null if the item is all-day or untimed.
 */
export const getItemInterval = (
  item: UnifiedCalendarItem
): { start: Date; end: Date } | null => {
  if (item.allDay) return null;

  if (item.type === 'todo') {
    const rawTodo = item.raw as Todo;
    const dueDateStr = rawTodo?.dueDate || item.start;
    if (!dueDateStr) return null;
    const dueDate = new Date(dueDateStr);
    const localHours = dueDate.getHours();
    let start: Date;
    let end: Date;

    if (localHours === 23) {
      start = new Date(dueDate);
      start.setHours(23, 0, 0, 0);
      end = new Date(dueDate);
      end.setHours(23, 30, 0, 0);
    } else {
      start = dueDate;
      end = new Date(dueDate.getTime() + 30 * 60 * 1000);
    }
    return { start, end };
  }

  if (item.type === 'event') {
    const rawEvent = item.raw as CalendarEvent;
    const startStr = rawEvent?.startDate || item.start;
    const endStr = rawEvent?.endDate || item.end;
    if (!startStr || !endStr) return null;
    return { start: new Date(startStr), end: new Date(endStr) };
  }

  if (item.type === 'timeChunk') {
    const rawChunk = item.raw as TimeChunk;
    const startStr = rawChunk?.startTime || item.start;
    const endStr = rawChunk?.endTime || item.end;
    if (!startStr || !endStr) return null;
    return { start: new Date(startStr), end: new Date(endStr) };
  }

  return null;
};

/**
 * Format a human-readable time range (e.g. "10:00 AM – 11:30 AM").
 */
export const formatTimeRange = (start: Date, end: Date): string => {
  const startFormatted = start.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endFormatted = end.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${startFormatted} – ${endFormatted}`;
};

/**
 * Check whether two intervals [startA, endA) and [startB, endB) overlap.
 * Back-to-back intervals (endA === startB or endB === startA) do NOT overlap.
 */
export const isIntervalOverlapping = (
  startA: Date,
  endA: Date,
  startB: Date,
  endB: Date
): boolean => {
  return startA.getTime() < endB.getTime() && endA.getTime() > startB.getTime();
};

export interface ConflictResult {
  conflictingItem: UnifiedCalendarItem;
  interval: { start: Date; end: Date };
  formattedTime: string;
  cleanTitle: string;
}

/**
 * Find the first conflicting item on the schedule that overlaps with [candidateStart, candidateEnd).
 */
export const findConflictingItem = (
  candidateStart: Date,
  candidateEnd: Date,
  items: UnifiedCalendarItem[],
  excludeId?: string
): ConflictResult | null => {
  for (const item of items) {
    if (
      excludeId &&
      (item.id === excludeId ||
        item.originalId === excludeId ||
        item.id.endsWith(`_${excludeId}`) ||
        item.originalId.endsWith(excludeId))
    ) {
      continue;
    }

    const interval = getItemInterval(item);
    if (!interval) continue;

    if (isIntervalOverlapping(candidateStart, candidateEnd, interval.start, interval.end)) {
      return {
        conflictingItem: item,
        interval,
        formattedTime: formatTimeRange(interval.start, interval.end),
        cleanTitle: cleanItemTitle(item.title),
      };
    }
  }

  return null;
};
