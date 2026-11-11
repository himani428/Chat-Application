import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/**
 * Pins the list to the bottom when a conversation opens, and follows new messages
 * only if the reader is already near the bottom (or just sent one themselves).
 */
export function useAutoScroll(
  ref: RefObject<HTMLDivElement>, conversationId: string,
  lastId: string | undefined, lastIsMine: boolean, typingCount: number,
) {
  const [atBottom, setAtBottom] = useState(true);
  const stick = useRef(true);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      stick.current = near;
      setAtBottom(near);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [ref]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
    stick.current = true;
  }, [ref, conversationId]);

  useEffect(() => {
    const el = ref.current;
    if (el && (stick.current || lastIsMine)) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [ref, lastId, lastIsMine, typingCount]);

  const scrollToBottom = useCallback(
    () => ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' }), [ref]);
  return { atBottom, scrollToBottom };
}
