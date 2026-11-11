import { memo } from 'react';
import { useChatStore } from '../store/chatStore';
import { ME, type Conversation } from '../types';
import { cn, conversationTitle } from '../utils/conversations';
import { sidebarStamp } from '../utils/format';
import { Avatar } from './Avatar';

interface Props { conversation: Conversation; active: boolean; onSelect: (id: string) => void; index?: number }

function Item({ conversation: c, active, onSelect, index = 0 }: Props) {
  const users = useChatStore((s) => s.users);
  const last = useChatStore((s) => s.messages[c.id]?.at(-1));
  const typing = useChatStore((s) => s.typing[c.id]?.length ?? 0) > 0;
  const group = c.type === 'group';
  const other = group ? undefined : users[c.memberIds.find((m) => m !== ME) ?? ''];
  const title = conversationTitle(c, users);

  let preview = 'No messages yet';
  if (last) {
    const who = last.senderId === ME ? 'You: ' : group ? `${users[last.senderId]?.name.split(' ')[0] ?? ''}: ` : '';
    preview = last.deleted ? 'Message deleted' : who + last.text;
  }

  return (
    <li className="item-in" style={{ animationDelay: `${Math.min(index, 10) * 45}ms` }}>
      <button type="button" onClick={() => onSelect(c.id)} aria-current={active ? 'true' : undefined}
        className={cn('mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all duration-200 hover:translate-x-0.5 active:scale-[.98]',
          active ? 'bg-fg text-bg shadow-lg shadow-fg/25' : 'hover:bg-muted')}>
        <Avatar name={title} src={other?.avatar} online={other?.online} group={group} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate font-semibold">{title}</span>
            {last && <span className={cn('shrink-0 text-xs', active ? 'text-bg/70' : 'text-soft')}>{sidebarStamp(last.createdAt)}</span>}
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span className={cn('truncate text-sm', active ? 'text-bg/70' : 'text-soft', typing && 'italic')}>
              {typing ? 'typing…' : preview}
            </span>
            {c.unread > 0 && (
              <span aria-label={`${c.unread} unread`}
                className={cn('badge grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1.5 text-xs font-bold',
                  active ? 'bg-bg text-fg' : 'bg-accent text-onaccent')}>
                {c.unread}
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}
export const ConversationItem = memo(Item);
