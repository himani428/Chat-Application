import { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, Moon, Search, Sun, X } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useChatStore } from '../store/chatStore';
import type { Filter } from '../types';
import { cn, filterConversations } from '../utils/conversations';
import { ConversationItem } from './ConversationItem';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' }, { id: 'unread', label: 'Unread' }, { id: 'groups', label: 'Groups' },
];

export function Sidebar() {
  const { conversations, messages, users, activeId, status, error, theme } = useChatStore((s) => s);
  const select = useChatStore((s) => s.select);
  const init = useChatStore((s) => s.init);
  const toggleTheme = useChatStore((s) => s.toggleTheme);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const query = useDebounce(input, 200);

  const items = useMemo(
    () => filterConversations(conversations, messages, users, { filter, query }),
    [conversations, messages, users, filter, query]);
  const totalUnread = conversations.reduce((n, c) => n + c.unread, 0);
  const onSelect = useCallback((id: string) => select(id), [select]);

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex items-center justify-between px-4 pb-3 pt-5">
        <h1 className="font-serif text-4xl italic leading-none tracking-tight">Murmur<span className="text-accent">.</span></h1>
        <button type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface transition-transform hover:scale-110 hover:bg-muted active:scale-90">
          <span key={theme} className="spin-in">{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</span>
        </button>
      </header>

      <div className="space-y-3 px-4 pb-3">
        <label className="relative block">
          <span className="sr-only">Search conversations</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-soft" />
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Search conversations"
            className="h-10 w-full rounded-full border border-line bg-surface pl-9 pr-9 text-sm outline-none placeholder:text-soft focus:border-fg" />
          {input && (
            <button type="button" aria-label="Clear search" onClick={() => setInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-soft hover:text-fg"><X size={14} /></button>
          )}
        </label>
        <div role="tablist" aria-label="Filter conversations" className="relative grid grid-cols-3 rounded-full border border-line bg-surface p-0.5">
          <span aria-hidden className="absolute inset-y-0.5 left-0.5 w-[calc((100%-0.25rem)/3)] rounded-full bg-fg shadow-md transition-transform duration-300 ease-[cubic-bezier(.3,1.3,.5,1)]" style={{ transform: `translateX(${FILTERS.findIndex((f) => f.id === filter) * 100}%)` }} />
          {FILTERS.map((f) => (
            <button key={f.id} role="tab" aria-selected={filter === f.id} onClick={() => setFilter(f.id)}
              className={cn('relative z-10 h-8 rounded-full text-sm font-medium transition-colors',
                filter === f.id ? 'text-bg' : 'text-soft hover:text-fg')}>
              {f.label}{f.id === 'unread' && totalUnread > 0 ? ` (${totalUnread})` : ''}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-line">
        {status === 'loading' || status === 'idle' ? (
          <ul aria-busy="true" aria-label="Loading conversations">
            {Array.from({ length: 7 }, (_, i) => (
              <li key={i} className="flex animate-pulse items-center gap-3 px-4 py-3">
                <div className="h-11 w-11 rounded-full bg-muted" />
                <div className="flex-1 space-y-2"><div className="h-3 w-1/2 rounded bg-muted" /><div className="h-3 w-3/4 rounded bg-muted" /></div>
              </li>
            ))}
          </ul>
        ) : status === 'error' ? (
          <div role="alert" className="flex flex-col items-center gap-3 px-8 py-16 text-center">
            <AlertTriangle />
            <p className="font-semibold">Conversations did not load</p>
            <p className="text-sm text-soft">{error}</p>
            <button onClick={() => init()} className="h-9 rounded-full bg-fg px-5 text-sm font-semibold text-bg">Try again</button>
          </div>
        ) : items.length === 0 ? (
          <div className="px-8 py-16 text-center">
            <p className="font-semibold">{query ? `Nothing matches “${query}”` : 'No conversations here'}</p>
            <p className="mt-1 text-sm text-soft">{query ? 'Try a name or a word from a message.' : 'Switch filters to see everything.'}</p>
          </div>
        ) : (
          <ul className="py-2">{items.map((c, i) => <ConversationItem key={c.id} index={i} conversation={c} active={c.id === activeId} onSelect={onSelect} />)}</ul>
        )}
      </div>
    </div>
  );
}
