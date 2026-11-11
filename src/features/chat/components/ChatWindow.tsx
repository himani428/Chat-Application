import { useState } from 'react';
import { ArrowLeft, Search, Users, X } from 'lucide-react';
import { sendWithSimulation } from '../services/simulator';
import { useChatStore } from '../store/chatStore';
import { ME, type Conversation, type Message } from '../types';
import { cn, conversationTitle } from '../utils/conversations';
import { Avatar } from './Avatar';
import { Composer, type ComposerMode } from './Composer';
import { GroupPanel } from './GroupPanel';
import { MessageList } from './MessageList';

const NONE_M: Message[] = [];
const NONE_S: string[] = [];

export function ChatWindow() {
  const conv = useChatStore((s) => s.conversations.find((c) => c.id === s.activeId));
  if (!conv) {
    return (
      <div className="dots relative grid h-full w-full place-items-center overflow-hidden px-8 text-center">
        <div aria-hidden className="float absolute left-[16%] top-[20%] h-16 w-28 rounded-3xl rounded-bl-lg bg-accent" />
        <div aria-hidden className="float2 absolute bottom-[22%] right-[14%] h-14 w-24 rounded-3xl rounded-br-lg bg-fg" />
        <div className="relative">
          <p className="font-serif text-6xl italic tracking-tight md:text-7xl">Say something.</p>
          <p className="mt-3 text-soft">Pick a conversation on the left to start.</p>
        </div>
      </div>
    );
  }
  return <ChatView key={conv.id} conv={conv} />;
}

function ChatView({ conv }: { conv: Conversation }) {
  const users = useChatStore((s) => s.users);
  const list = useChatStore((s) => s.messages[conv.id]) ?? NONE_M;
  const typingIds = useChatStore((s) => s.typing[conv.id]) ?? NONE_S;
  const replyToId = useChatStore((s) => s.replyToId);
  const editingId = useChatStore((s) => s.editingId);
  const { select, setReplyTo, setEditing, editMessage } = useChatStore.getState();

  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const [panel, setPanel] = useState(false);

  const isGroup = conv.type === 'group';
  const title = conversationTitle(conv, users);
  const other = isGroup ? undefined : users[conv.memberIds.find((m) => m !== ME) ?? ''];
  const online = conv.memberIds.filter((m) => m !== ME && users[m]?.online).length;
  const typingNames = typingIds.map((id) => users[id]?.name.split(' ')[0]).join(', ');
  const subtitle = typingIds.length
    ? `${typingNames} typing…`
    : isGroup ? `${conv.memberIds.length} members, ${online} online` : other?.online ? 'Online' : 'Offline';

  const editing = list.find((m) => m.id === editingId);
  const replying = list.find((m) => m.id === replyToId);
  const mode: ComposerMode = editing
    ? { type: 'edit', message: editing }
    : replying ? { type: 'reply', message: replying, senderName: users[replying.senderId]?.name ?? '' } : null;

  const onSubmit = (text: string) =>
    editing ? editMessage(conv.id, editing.id, text) : sendWithSimulation(conv.id, text, replying?.id);

  return (
    <div className="flex h-full w-full">
      <section className="flex h-full min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-line bg-surface/70 px-4 py-3 backdrop-blur md:px-6">
          <button type="button" onClick={() => select(null)} aria-label="Back to conversations"
            className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted md:hidden"><ArrowLeft size={18} /></button>
          <Avatar name={title} src={other?.avatar} online={other?.online} group={isGroup} size={40} />
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold leading-tight">{title}</h2>
            <p className={cn('truncate text-sm text-soft', typingIds.length > 0 && 'italic')} aria-live="polite">{subtitle}</p>
          </div>
          <button type="button" onClick={() => { setSearching((v) => !v); setQuery(''); }} aria-label="Search in conversation"
            className={cn('grid h-9 w-9 place-items-center rounded-full hover:bg-muted', searching && 'bg-fg text-bg hover:bg-fg')}><Search size={17} /></button>
          {isGroup && (
            <button type="button" onClick={() => setPanel((v) => !v)} aria-label="Group info"
              className={cn('grid h-9 w-9 place-items-center rounded-full hover:bg-muted', panel && 'bg-fg text-bg hover:bg-fg')}><Users size={17} /></button>
          )}
        </header>

        {searching && (
          <div className="rise flex items-center gap-2 border-b border-line px-4 py-2 md:px-6">
            <Search size={15} className="text-soft" />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search messages"
              placeholder="Search this conversation" className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-soft" />
            <button type="button" aria-label="Close search" onClick={() => { setSearching(false); setQuery(''); }} className="text-soft hover:text-fg"><X size={16} /></button>
          </div>
        )}

        <MessageList conversationId={conv.id} query={query} isGroup={isGroup} />
        <Composer mode={mode} onSubmit={onSubmit} onCancel={() => { setReplyTo(null); setEditing(null); }} />
      </section>

      {isGroup && panel && (
        <div className="fixed inset-y-0 right-0 z-30 w-full border-l border-line sm:w-[340px] lg:static lg:z-auto lg:w-[320px] lg:shrink-0">
          <GroupPanel conversation={conv} onClose={() => setPanel(false)} />
        </div>
      )}
    </div>
  );
}
