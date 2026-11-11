import { memo, useState, type ReactNode } from 'react';
import { Check, CheckCheck, Clock, Copy, Pencil, Reply, SmilePlus, Trash2 } from 'lucide-react';
import type { DeliveryStatus, Message } from '../types';
import { cn } from '../utils/conversations';
import { formatTime } from '../utils/format';

export const EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '🙏'];

export interface BubbleActions {
  reply: (m: Message) => void;
  edit: (m: Message) => void;
  remove: (m: Message) => void;
  react: (m: Message, emoji: string) => void;
}
interface Props {
  message: Message; isMe: boolean; senderName: string; showSender: boolean;
  replied?: { name: string; text: string }; query: string; actions: BubbleActions;
}

function Status({ s }: { s: DeliveryStatus }) {
  if (s === 'sending') return <Clock size={12} aria-label="Sending" />;
  if (s === 'sent') return <Check size={13} aria-label="Sent" />;
  return <CheckCheck size={14} aria-label={s === 'read' ? 'Read' : 'Delivered'}
    strokeWidth={s === 'read' ? 3 : 2} className={s === 'read' ? '' : 'opacity-50'} />;
}

function highlight(text: string, q: string): ReactNode {
  if (!q) return text;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((p, i) => (p.toLowerCase() === q.toLowerCase()
    ? <mark key={i} className="rounded bg-accent/50 px-0.5 text-inherit">{p}</mark> : p));
}

function Tool({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-full text-soft hover:bg-muted hover:text-fg">{children}</button>
  );
}

function Bubble({ message: m, isMe, senderName, showSender, replied, query, actions }: Props) {
  const [picker, setPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const reactions = Object.entries(m.reactions).filter(([, u]) => u.length);

  if (m.deleted) {
    return (
      <div className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
        <p className="rounded-2xl border border-dashed border-line px-4 py-2 text-sm italic text-soft">This message was deleted</p>
      </div>
    );
  }

  const copy = async () => {
    try { await navigator.clipboard.writeText(m.text); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch { /* clipboard blocked */ }
  };

  return (
    <div className={cn('group relative flex flex-col', isMe ? 'msg-r items-end' : 'msg-l items-start')}>
      {showSender && <span className="mb-1 ml-3 text-xs font-semibold text-soft">{senderName}</span>}

      <div className={cn('absolute -top-4 z-10 flex items-center gap-0.5 rounded-full border border-line bg-bg p-0.5 opacity-0 shadow-sm transition-opacity focus-within:opacity-100 group-hover:opacity-100',
        isMe ? 'right-2' : 'left-2', picker && 'opacity-100')}>
        <Tool label="Add reaction" onClick={() => setPicker((v) => !v)}><SmilePlus size={14} /></Tool>
        <Tool label="Reply" onClick={() => actions.reply(m)}><Reply size={14} /></Tool>
        <Tool label={copied ? 'Copied' : 'Copy text'} onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}</Tool>
        {isMe && <Tool label="Edit message" onClick={() => actions.edit(m)}><Pencil size={14} /></Tool>}
        {isMe && <Tool label="Delete message" onClick={() => actions.remove(m)}><Trash2 size={14} /></Tool>}
      </div>
      {picker && (
        <div className={cn('rise absolute top-5 z-20 flex gap-1 rounded-full border border-line bg-bg p-1 shadow-md', isMe ? 'right-2' : 'left-2')}>
          {EMOJIS.map((e) => (
            <button key={e} type="button" aria-label={`React with ${e}`}
              onClick={() => { actions.react(m, e); setPicker(false); }}
              className="grid h-8 w-8 place-items-center rounded-full text-lg hover:bg-muted">{e}</button>
          ))}
        </div>
      )}

      <div className={cn('max-w-[82%] px-4 py-2.5 text-[15px] leading-snug md:max-w-[70%]',
        'transition-transform duration-200 group-hover:-translate-y-0.5',
        isMe ? 'bubble-me rounded-3xl rounded-br-lg text-bg' : 'bubble-them rounded-3xl rounded-bl-lg border border-line bg-surface')}>
        {replied && (
          <div className={cn('mb-2 border-l-2 pl-2 text-xs', isMe ? 'border-bg/60 text-bg/70' : 'border-fg/60 text-soft')}>
            <p className="font-semibold">{replied.name}</p>
            <p className="line-clamp-2">{replied.text}</p>
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{highlight(m.text, query)}</p>
        <p className={cn('mt-1 flex items-center justify-end gap-1 text-[11px]', isMe ? 'text-bg/70' : 'text-soft')}>
          {m.edited && <span>Edited</span>}
          <time dateTime={new Date(m.createdAt).toISOString()}>{formatTime(m.createdAt)}</time>
          {isMe && <Status s={m.status} />}
        </p>
      </div>

      {reactions.length > 0 && (
        <div className="-mt-2 flex gap-1 px-2">
          {reactions.map(([emoji, users]) => (
            <button key={emoji} type="button" onClick={() => actions.react(m, emoji)}
              aria-label={`${emoji} ${users.length}, toggle reaction`}
              className={cn('pop flex h-6 items-center gap-1 rounded-full border bg-surface px-2 text-xs transition-transform hover:scale-110',
                users.includes('me') ? 'border-fg' : 'border-line')}>
              <span>{emoji}</span><span className="font-semibold">{users.length}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
export const MessageBubble = memo(Bubble);
