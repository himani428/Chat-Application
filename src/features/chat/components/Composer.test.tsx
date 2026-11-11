import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Composer } from './Composer';
import { buildSeed } from '../services/mockApi';

describe('Composer', () => {
  it('sends on Enter and clears the field', async () => {
    const onSubmit = vi.fn();
    render(<Composer mode={null} onSubmit={onSubmit} onCancel={() => {}} />);
    const box = screen.getByRole('textbox', { name: 'Message' });
    await userEvent.type(box, 'hello{Enter}');
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('hello'));
    expect(box).toHaveValue('');
  });

  it('does not send on Shift+Enter', async () => {
    const onSubmit = vi.fn();
    render(<Composer mode={null} onSubmit={onSubmit} onCancel={() => {}} />);
    await userEvent.type(screen.getByRole('textbox'), 'a{Shift>}{Enter}{/Shift}b');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prefills the text when editing and cancels on Escape', async () => {
    const message = buildSeed().messages.d2[1];
    const onCancel = vi.fn();
    render(<Composer mode={{ type: 'edit', message }} onSubmit={() => {}} onCancel={onCancel} />);
    expect(screen.getByRole('textbox')).toHaveValue(message.text);
    await userEvent.type(screen.getByRole('textbox'), '{Escape}');
    expect(onCancel).toHaveBeenCalled();
  });
});
