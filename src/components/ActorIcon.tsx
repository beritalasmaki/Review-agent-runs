import type { ComponentType } from 'react'
import { cn } from '../lib/utils'

/**
 * A small circular badge around an icon — the shared shape a person icon and a system icon
 * both sit in, so "who did this" reads as one consistent visual language regardless of which
 * of the two it is. Knows nothing about people or systems specifically; the caller picks the
 * icon (see `features/run/`'s `actorIcon`, built on `lib/actors.ts`'s `isSystemActor`).
 */
export interface ActorIconProps {
  icon: ComponentType<{ className?: string }>
  className?: string
}

export function ActorIcon({ icon: Icon, className }: ActorIconProps) {
  return (
    <span
      className={cn(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-pill-icon',
        className,
      )}
    >
      <Icon aria-hidden className="h-3 w-3 text-text-primary" />
    </span>
  )
}
