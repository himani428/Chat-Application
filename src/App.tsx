import { useEffect } from 'react';
import { ChatWindow } from './features/chat/components/ChatWindow';
import { Sidebar } from './features/chat/components/Sidebar';
import { useIncomingSimulation } from './features/chat/hooks/useIncomingSimulation';
import { useChatStore } from './features/chat/store/chatStore';
import { cn } from './features/chat/utils/conversations';

export default function App() {
  const activeId = useChatStore((s) => s.activeId);
  const theme = useChatStore((s) => s.theme);
  const init = useChatStore((s) => s.init);

  useEffect(() => { void init(); }, [init]);
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);
  useIncomingSimulation();

  return (
    <div className="backdrop h-[100dvh] w-full lg:p-5">
    <div className="app-in flex h-full w-full overflow-hidden bg-bg text-fg lg:rounded-[28px] lg:border lg:border-line lg:shadow-[0_40px_90px_-30px_rgb(var(--fg)/.55)]">
      <aside className={cn('h-full w-full shrink-0 border-r border-line md:flex md:w-[320px] lg:w-[380px]', activeId ? 'hidden' : 'flex')}>
        <Sidebar />
      </aside>
      <main className={cn('h-full min-w-0 flex-1 md:flex', activeId ? 'flex' : 'hidden')}>
        <ChatWindow />
      </main>
    </div>
    </div>
  );
}
