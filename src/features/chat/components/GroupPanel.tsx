import { UserMinus, UserPlus, X } from 'lucide-react';
import { useChatStore } from '../store/chatStore';
import { ME, type Conversation } from '../types';
import { Avatar } from './Avatar';

export function GroupPanel({ conversation: c, onClose }: { conversation: Conversation; onClose: () => void }) {
  const users = useChatStore((s) => s.users);
  const addMember = useChatStore((s) => s.addMember);
  const removeMember = useChatStore((s) => s.removeMember);
  const members = c.memberIds.map((id) => users[id]).filter(Boolean);
  const candidates = Object.values(users).filter((u) => !c.memberIds.includes(u.id));

  return (
    <aside className="rise flex h-full w-full flex-col bg-bg" aria-label="Group info">
      <header className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-semibold">Group info</h2>
        <button type="button" onClick={onClose} aria-label="Close group info" className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><X size={16} /></button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-2 px-5 py-6">
          <Avatar name={c.name} size={72} group />
          <p className="font-serif text-3xl italic">{c.name}</p>
          <p className="text-sm text-soft">{members.length} members, {members.filter((m) => m.online).length} online</p>
        </div>
        <h3 className="px-5 pb-1 text-sm font-semibold">Members</h3>
        <ul>
          {members.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-5 py-2">
              <Avatar name={u.name} src={u.avatar} online={u.online} size={36} />
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{u.id === ME ? 'You' : u.name}</span>
                <span className="text-xs text-soft">{u.online ? 'Online' : 'Offline'}</span></span>
              {u.id !== ME && (
                <button type="button" onClick={() => removeMember(c.id, u.id)} aria-label={`Remove ${u.name}`}
                  className="grid h-8 w-8 place-items-center rounded-full text-soft hover:bg-muted hover:text-fg"><UserMinus size={16} /></button>
              )}
            </li>
          ))}
        </ul>
        {candidates.length > 0 && (
          <>
            <h3 className="px-5 pb-1 pt-5 text-sm font-semibold">Add people</h3>
            <ul className="pb-6">
              {candidates.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-5 py-2">
                  <Avatar name={u.name} src={u.avatar} online={u.online} size={36} />
                  <span className="flex-1 truncate text-sm font-medium">{u.name}</span>
                  <button type="button" onClick={() => addMember(c.id, u.id)} aria-label={`Add ${u.name}`}
                    className="grid h-8 w-8 place-items-center rounded-full border border-line hover:bg-fg hover:text-bg"><UserPlus size={16} /></button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}
