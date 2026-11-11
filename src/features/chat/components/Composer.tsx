import { useEffect, useLayoutEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Send, X } from 'lucide-react';
import type { Message } from '../types';

export type ComposerMode =
  | { type: 'reply'; message: Message; senderName: string }
  | { type: 'edit'; message: Message }
  | null;

interface Props { mode: ComposerMode; onSubmit: (text: string) => void; onCancel: () => void }

export function Composer({ mode, onSubmit, onCancel }: Props) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<{ text: string }>({ defaultValues: { text: '' } });
  const { ref: regRef, ...field } = register('text');
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const text = watch('text');
  const modeKey = mode ? `${mode.type}:${mode.message.id}` : '';

  useEffect(() => {
    if (mode?.type === 'edit') setValue('text', mode.message.text);
    if (mode) taRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modeKey]);

  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const submit = handleSubmit(({ text: value }) => {
    if (!value.trim()) return;
    onSubmit(value.trim());
    reset({ text: '' });
  });
  const cancel = () => { reset({ text: '' }); onCancel(); };

  return (
    <form onSubmit={submit} className="border-t border-line px-4 pb-4 pt-3 md:px-8">
      {mode && (
        <div className="rise mb-2 flex items-start justify-between gap-3 rounded-xl bg-muted px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="font-semibold">{mode.type === 'edit' ? 'Editing message' : `Replying to ${mode.senderName}`}</p>
            {mode.type === 'reply' && <p className="truncate text-soft">{mode.message.text}</p>}
          </div>
          <button type="button" onClick={cancel} aria-label="Cancel" className="mt-0.5 text-soft hover:text-fg"><X size={16} /></button>
        </div>
      )}
      <div className="flex items-end gap-2 rounded-3xl border border-line bg-surface px-4 py-2 shadow-sm transition-shadow focus-within:border-fg focus-within:shadow-lg">
        <textarea {...field} ref={(e) => { regRef(e); taRef.current = e; }} rows={1} aria-label="Message"
          placeholder="Write a message" className="max-h-40 min-h-[28px] flex-1 resize-none bg-transparent py-1 text-[15px] outline-none placeholder:text-soft"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void submit(); }
            if (e.key === 'Escape' && mode) cancel();
          }} />
        <button type="submit" aria-label={mode?.type === 'edit' ? 'Save edit' : 'Send message'} disabled={!text?.trim()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-onaccent transition-all duration-200 enabled:hover:-rotate-12 enabled:hover:scale-110 enabled:active:scale-90 disabled:opacity-25">
          <Send size={16} />
        </button>
      </div>
      <p className="mt-1.5 hidden px-2 text-xs text-soft md:block">Enter to send. Shift+Enter for a new line. Esc to cancel.</p>
    </form>
  );
}
