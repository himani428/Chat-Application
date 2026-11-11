import { beforeEach, describe, expect, it } from 'vitest';
import { buildSeed } from '../services/mockApi';
import { useChatStore } from './chatStore';

const get = () => useChatStore.getState();
const msgs = (id: string) => get().messages[id];

beforeEach(() => {
  useChatStore.setState({ ...buildSeed(), status: 'ready', activeId: null, typing: {}, replyToId: null, editingId: null });
});

describe('chat store', () => {
  it('sends optimistically with a "sending" status and optional reply', () => {
    const id = get().sendMessage('d2', '  hi there ', 'd2-0');
    const m = msgs('d2').find((x) => x.id === id)!;
    expect(m).toMatchObject({ text: 'hi there', status: 'sending', replyToId: 'd2-0', senderId: 'me' });
  });

  it('edits and deletes messages', () => {
    get().editMessage('d2', 'd2-3', 'Approved!');
    expect(msgs('d2')[3]).toMatchObject({ text: 'Approved!', edited: true });
    get().deleteMessage('d2', 'd2-3');
    expect(msgs('d2')[3].deleted).toBe(true);
  });

  it('toggles reactions per user', () => {
    get().toggleReaction('d2', 'd2-0', '🎉');
    expect(msgs('d2')[0].reactions['🎉']).toEqual(['me']);
    get().toggleReaction('d2', 'd2-0', '🎉');
    expect(msgs('d2')[0].reactions['🎉']).toBeUndefined();
  });

  it('counts unread for background chats and clears on select', () => {
    const before = get().conversations.find((c) => c.id === 'd2')!.unread;
    get().receive('d2', 'u2', 'ping');
    expect(get().conversations.find((c) => c.id === 'd2')!.unread).toBe(before + 1);
    get().select('d2');
    expect(get().conversations.find((c) => c.id === 'd2')!.unread).toBe(0);
  });

  it('adds and removes group members but never removes you', () => {
    get().addMember('g3', 'u1');
    expect(get().conversations.find((c) => c.id === 'g3')!.memberIds).toContain('u1');
    get().removeMember('g3', 'u1');
    get().removeMember('g3', 'me');
    const ids = get().conversations.find((c) => c.id === 'g3')!.memberIds;
    expect(ids).not.toContain('u1');
    expect(ids).toContain('me');
  });

  it('tracks typing users', () => {
    get().setTyping('d2', 'u2', true);
    expect(get().typing.d2).toEqual(['u2']);
    get().setTyping('d2', 'u2', false);
    expect(get().typing.d2).toEqual([]);
  });
});
