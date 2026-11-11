import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchChatData } from '../services/mockApi';
import { ME, type ChatData, type Conversation, type DeliveryStatus, type Message, type Theme } from '../types';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface ChatState extends ChatData {
  activeId: string | null;
  theme: Theme;
  status: LoadStatus;
  error: string | null;
  typing: Record<string, string[]>;
  replyToId: string | null;
  editingId: string | null;

  init: () => Promise<void>;
  toggleTheme: () => void;
  select: (id: string | null) => void;
  sendMessage: (convId: string, text: string, replyToId?: string) => string;
  receive: (convId: string, senderId: string, text: string) => void;
  setStatus: (convId: string, id: string, status: DeliveryStatus) => void;
  editMessage: (convId: string, id: string, text: string) => void;
  deleteMessage: (convId: string, id: string) => void;
  toggleReaction: (convId: string, id: string, emoji: string) => void;
  setReplyTo: (id: string | null) => void;
  setEditing: (id: string | null) => void;
  setTyping: (convId: string, userId: string, on: boolean) => void;
  setPresence: (userId: string, online: boolean) => void;
  addMember: (convId: string, userId: string) => void;
  removeMember: (convId: string, userId: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const mapMsg = (list: Message[] | undefined, id: string, fn: (m: Message) => Message) =>
  (list ?? []).map((m) => (m.id === id ? fn(m) : m));
const mapConv = (list: Conversation[], id: string, fn: (c: Conversation) => Conversation) =>
  list.map((c) => (c.id === id ? fn(c) : c));
const prefersDark = () => !!window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      users: {}, conversations: [], messages: {},
      activeId: null, theme: prefersDark() ? 'dark' : 'light',
      status: 'idle', error: null, typing: {}, replyToId: null, editingId: null,

      init: async () => {
        const { conversations, messages } = get();
        if (conversations.length) {
          // Restored from localStorage: anything still "sending" lost its timer on reload.
          const fixed = Object.fromEntries(
            Object.entries(messages).map(([k, v]) => [
              k, v.map((m) => (m.status === 'sending' ? { ...m, status: 'sent' as const } : m)),
            ]),
          );
          return set({ messages: fixed, status: 'ready' });
        }
        set({ status: 'loading', error: null });
        try {
          set({ ...(await fetchChatData()), status: 'ready' });
        } catch (e) {
          set({ status: 'error', error: (e as Error).message });
        }
      },

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      select: (id) =>
        set((s) => ({
          activeId: id, replyToId: null, editingId: null,
          conversations: id ? mapConv(s.conversations, id, (c) => ({ ...c, unread: 0 })) : s.conversations,
        })),

      sendMessage: (convId, text, replyToId) => {
        const message: Message = {
          id: uid(), conversationId: convId, senderId: ME, text: text.trim(),
          createdAt: Date.now(), status: 'sending', replyToId, reactions: {},
        };
        set((s) => ({
          messages: { ...s.messages, [convId]: [...(s.messages[convId] ?? []), message] },
          conversations: mapConv(s.conversations, convId, (c) => ({ ...c, lastMessageAt: message.createdAt })),
          replyToId: null,
        }));
        return message.id;
      },

      receive: (convId, senderId, text) =>
        set((s) => {
          const message: Message = {
            id: uid(), conversationId: convId, senderId, text,
            createdAt: Date.now(), status: 'read', reactions: {},
          };
          const seen = s.activeId === convId && !document.hidden;
          return {
            messages: { ...s.messages, [convId]: [...(s.messages[convId] ?? []), message] },
            conversations: mapConv(s.conversations, convId, (c) => ({
              ...c, lastMessageAt: message.createdAt, unread: seen ? 0 : c.unread + 1,
            })),
          };
        }),

      setStatus: (convId, id, status) =>
        set((s) => ({ messages: { ...s.messages, [convId]: mapMsg(s.messages[convId], id, (m) => ({ ...m, status })) } })),

      editMessage: (convId, id, text) =>
        set((s) => ({
          editingId: null,
          messages: { ...s.messages, [convId]: mapMsg(s.messages[convId], id, (m) => ({ ...m, text: text.trim(), edited: true })) },
        })),

      deleteMessage: (convId, id) =>
        set((s) => ({
          messages: { ...s.messages, [convId]: mapMsg(s.messages[convId], id, (m) => ({ ...m, deleted: true, reactions: {} })) },
        })),

      toggleReaction: (convId, id, emoji) =>
        set((s) => ({
          messages: {
            ...s.messages,
            [convId]: mapMsg(s.messages[convId], id, (m) => {
              const users = m.reactions[emoji] ?? [];
              const next = users.includes(ME) ? users.filter((u) => u !== ME) : [...users, ME];
              const reactions = { ...m.reactions, [emoji]: next };
              if (!next.length) delete reactions[emoji];
              return { ...m, reactions };
            }),
          },
        })),

      setReplyTo: (id) => set({ replyToId: id, editingId: null }),
      setEditing: (id) => set({ editingId: id, replyToId: null }),

      setTyping: (convId, userId, on) =>
        set((s) => {
          const cur = (s.typing[convId] ?? []).filter((u) => u !== userId);
          return { typing: { ...s.typing, [convId]: on ? [...cur, userId] : cur } };
        }),

      setPresence: (userId, online) =>
        set((s) => (s.users[userId] ? { users: { ...s.users, [userId]: { ...s.users[userId], online } } } : s)),

      addMember: (convId, userId) =>
        set((s) => ({
          conversations: mapConv(s.conversations, convId, (c) =>
            c.memberIds.includes(userId) ? c : { ...c, memberIds: [...c.memberIds, userId] }),
        })),

      removeMember: (convId, userId) =>
        set((s) => ({
          conversations: mapConv(s.conversations, convId, (c) =>
            userId === ME ? c : { ...c, memberIds: c.memberIds.filter((m) => m !== userId) }),
        })),
    }),
    {
      name: 'murmur-chat-v2',
      partialize: (s) => ({ users: s.users, conversations: s.conversations, messages: s.messages, theme: s.theme }),
    },
  ),
);
