import { useMemo, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { useAutoScroll } from '../hooks/useAutoScroll';
import { useChatStore } from '../store/chatStore';
import { ME, type Message } from '../types';
import { groupByDate } from '../utils/format';
import { MessageBubble, type BubbleActions } from './MessageBubble';

const NONE_M: Message[] = [];
const NONE_S: string[] = [];

export function MessageList({ conversationId, query, isGroup }: { conversationId: string; query: string; isGroup: boolean }) {
  const messages = useChatStore((s) => s.messages[conversationId]) ?? NONE_M;
  const users = useChatStore((s) => s.users);
  const typing = useChatStore((s) => s.typing[conversationId]) ?? NONE_S;
  const ref = useRef<HTMLDivElement>(null);

  const q = query.trim();
  const visible = useMemo(
    () => (q ? messages.filter((m) => !m.deleted && m.text.toLowerCase().includes(q.toLowerCase())) : messages),
    [messages, q]);
  const items = useMemo(() => groupByDate(visible), [visible]);
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  const last = messages.at(-1);
  const { atBottom, scrollToBottom } = useAutoScroll(ref, conversationId, last?.id, last?.senderId === ME, typing.length);

  const actions = useMemo<BubbleActions>(() => {
    const s = useChatStore.getState;
    return {
      reply: (m) => s().setReplyTo(m.id),
      edit: (m) => s().setEditing(m.id),
      remove: (m) => s().deleteMessage(conversationId, m.id),
      react: (m, e) => s().toggleReaction(conversationId, m.id, e),
    };
  }, [conversationId]);

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={ref} className="dots h-full overflow-y-auto px-4 py-6 md:px-8" role="log" aria-live="polite" aria-label="Messages">
        {items.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div>
              <p className="font-serif text-3xl italic">{q ? `No messages match “${q}”` : 'Nothing here yet'}</p>
              <p className="mt-2 text-sm text-soft">{q ? 'Try a different word.' : 'Send the first message below.'}</p>
            </div>
          </div>
        )}
        <div className="space-y-3">
          {items.map((item, i) => {
            if (item.kind === 'date') {
              return (
                <div key={item.key} className="flex items-center gap-3 py-2 text-xs font-medium text-soft">
                  <span className="h-px flex-1 bg-line" /><span className="rounded-full border border-line bg-surface px-3 py-1">{item.label}</span><span className="h-px flex-1 bg-line" />
                </div>
              );
            }
            const m = item.message;
            const prev = items[i - 1];
            const sameSender = prev?.kind === 'message' && prev.message.senderId === m.senderId;
            const parent = m.replyToId ? byId.get(m.replyToId) : undefined;
            return (
              <div key={item.key} className={sameSender ? '!mt-1' : ''}>
                <MessageBubble message={m} isMe={m.senderId === ME} query={q} actions={actions}
                  senderName={users[m.senderId]?.name ?? 'Unknown'}
                  showSender={isGroup && m.senderId !== ME && !sameSender}
                  replied={parent ? { name: users[parent.senderId]?.name ?? 'Unknown', text: parent.deleted ? 'Message deleted' : parent.text } : undefined} />
              </div>
            );
          })}
          {typing.length > 0 && !q && (
            <div className="rise flex items-center gap-2 text-sm text-soft" aria-live="polite">
              <span className="flex gap-1 rounded-full border border-line px-3 py-2">
                <i className="dot h-1.5 w-1.5 rounded-full bg-fg" /><i className="dot h-1.5 w-1.5 rounded-full bg-fg" /><i className="dot h-1.5 w-1.5 rounded-full bg-fg" />
              </span>
              <span>{typing.map((id) => users[id]?.name.split(' ')[0]).join(', ')} {typing.length > 1 ? 'are' : 'is'} typing</span>
            </div>
          )}
        </div>
      </div>
      {!atBottom && (
        <button type="button" onClick={scrollToBottom} aria-label="Jump to latest message"
          className="absolute bottom-4 right-6 grid h-10 w-10 place-items-center rounded-full bg-accent text-onaccent shadow-lg">
          <ArrowDown size={18} />
        </button>
      )}
    </div>
  );
}
