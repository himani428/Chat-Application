import { ME, type Conversation, type Filter, type Message, type User } from '../types';

export function conversationTitle(c: Conversation, users: Record<string, User>) {
  if (c.type === 'group') return c.name;
  const other = c.memberIds.find((id) => id !== ME);
  return (other && users[other]?.name) || c.name;
}

export function filterConversations(
  conversations: Conversation[],
  messages: Record<string, Message[]>,
  users: Record<string, User>,
  { filter, query }: { filter: Filter; query: string },
) {
  const q = query.trim().toLowerCase();
  return conversations
    .filter((c) => (filter === 'unread' ? c.unread > 0 : filter === 'groups' ? c.type === 'group' : true))
    .filter(
      (c) =>
        !q ||
        conversationTitle(c, users).toLowerCase().includes(q) ||
        (messages[c.id] ?? []).some((m) => !m.deleted && m.text.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
}

export const initials = (name: string) =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export const cn = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');
