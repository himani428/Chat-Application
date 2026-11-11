import { useState } from 'react';
import { cn, initials } from '../utils/conversations';

interface Props { name: string; src?: string; online?: boolean; size?: number; group?: boolean }

export function Avatar({ name, src, online, size = 44, group }: Props) {
  const [broken, setBroken] = useState(false);
  const shape = group ? 'rounded-2xl' : 'rounded-full';
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      {src && !broken ? (
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)}
          className={cn('h-full w-full object-cover', shape)} />
      ) : (
        <div className={cn('grid h-full w-full place-items-center bg-fg text-xs font-semibold text-bg', shape)}
          style={{ fontSize: size * 0.32 }}>
          {initials(name)}
        </div>
      )}
      {online !== undefined && (
        <span role="img" aria-label={online ? 'Online' : 'Offline'}
          className={cn('absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-bg', online ? 'bg-accent' : 'bg-soft/50')} />
      )}
    </div>
  );
}
