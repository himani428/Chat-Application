import type { Message } from '../types';

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const daysAgo = (t: number, now: number) => Math.round((startOfDay(now) - startOfDay(t)) / 864e5);

export const formatTime = (t: number) =>
  new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function dayLabel(t: number, now = Date.now()) {
  const diff = daysAgo(t, now);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return new Date(t).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
}

export function sidebarStamp(t: number, now = Date.now()) {
  const diff = daysAgo(t, now);
  if (diff === 0) return formatTime(t);
  if (diff === 1) return 'Yesterday';
  return new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export type ListItem =
  | { kind: 'date'; key: string; label: string }
  | { kind: 'message'; key: string; message: Message };

/** Inserts a date divider before the first message of each calendar day. */
export function groupByDate(messages: Message[], now = Date.now()): ListItem[] {
  const out: ListItem[] = [];
  let last = -1;
  for (const message of messages) {
    const day = startOfDay(message.createdAt);
    if (day !== last) {
      out.push({ kind: 'date', key: `d${day}`, label: dayLabel(message.createdAt, now) });
      last = day;
    }
    out.push({ kind: 'message', key: message.id, message });
  }
  return out;
}
