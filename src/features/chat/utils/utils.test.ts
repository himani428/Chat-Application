import { describe, expect, it } from 'vitest';
import { buildSeed } from '../services/mockApi';
import { filterConversations } from './conversations';
import { dayLabel, groupByDate } from './format';

describe('groupByDate', () => {
  it('inserts one divider per calendar day', () => {
    const { messages } = buildSeed();
    const items = groupByDate(messages.d1);
    const dividers = items.filter((i) => i.kind === 'date');
    expect(dividers.length).toBeGreaterThanOrEqual(2);
    expect(items[0].kind).toBe('date');
  });
  it('labels today and yesterday', () => {
    const now = Date.now();
    expect(dayLabel(now, now)).toBe('Today');
    expect(dayLabel(now - 864e5, now)).toBe('Yesterday');
  });
});

describe('filterConversations', () => {
  const { conversations, messages, users } = buildSeed();
  it('filters unread', () => {
    const r = filterConversations(conversations, messages, users, { filter: 'unread', query: '' });
    expect(r.length).toBe(3);
    expect(r.every((c) => c.unread > 0)).toBe(true);
  });
  it('filters groups', () => {
    const r = filterConversations(conversations, messages, users, { filter: 'groups', query: '' });
    expect(r.every((c) => c.type === 'group')).toBe(true);
  });
  it('searches by name and message text', () => {
    expect(filterConversations(conversations, messages, users, { filter: 'all', query: 'mahima' })).toHaveLength(1);
    expect(filterConversations(conversations, messages, users, { filter: 'all', query: 'chai place' })[0].id).toBe('d1');
  });
});

import { generateReply } from '../services/mockApi';
describe('generateReply', () => {
  it('answers in context', () => {
    expect(['Sure, go ahead.', 'Of course, ask away.']).toContain(generateReply('i have a question'));
    expect(['Anytime!', 'No problem at all.']).toContain(generateReply('thanks a lot'));
  });
});
