import { useChatStore } from '../store/chatStore';
import { ME } from '../types';
import { INCOMING, generateReply } from './mockApi';

const timers = new Set<number>();
const later = (fn: () => void, ms: number) => {
  const t = window.setTimeout(() => { timers.delete(t); fn(); }, ms);
  timers.add(t);
};
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const st = () => useChatStore.getState();

export function clearSimulation() {
  timers.forEach(clearTimeout);
  timers.clear();
}

/** Optimistic send, then fake the network: sent -> delivered -> read -> typing -> reply. */
export function sendWithSimulation(convId: string, text: string, replyToId?: string) {
  const id = st().sendMessage(convId, text, replyToId);
  const others = st().conversations.find((c) => c.id === convId)?.memberIds.filter((m) => m !== ME) ?? [];
  later(() => st().setStatus(convId, id, 'sent'), 350);
  later(() => st().setStatus(convId, id, 'delivered'), 1000);
  if (!others.length) return id;
  const from = pick(others);
  later(() => { st().setStatus(convId, id, 'read'); st().setTyping(convId, from, true); }, 1800);
  later(() => { st().setTyping(convId, from, false); st().receive(convId, from, generateReply(text)); }, 4200);
  return id;
}

/** Random incoming messages and presence changes. Returns a cleanup function. */
export function startIncomingSimulation() {
  const incoming = window.setInterval(() => {
    const s = st();
    if (s.status !== 'ready' || !s.conversations.length) return;
    const pool = s.conversations.filter((c) => c.id !== s.activeId);
    if (!pool.length) return;
    const conv = pick(pool);
    const others = conv.memberIds.filter((m) => m !== ME);
    if (!others.length) return;
    const from = pick(others);
    s.setTyping(conv.id, from, true);
    later(() => { st().setTyping(conv.id, from, false); st().receive(conv.id, from, pick(INCOMING)); }, 2200);
  }, 22000);

  const presence = window.setInterval(() => {
    const ids = Object.keys(st().users).filter((u) => u !== ME);
    if (!ids.length) return;
    const id = pick(ids);
    st().setPresence(id, !st().users[id].online);
  }, 15000);

  return () => { clearInterval(incoming); clearInterval(presence); clearSimulation(); };
}
