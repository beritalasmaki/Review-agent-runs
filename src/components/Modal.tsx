import { useState } from 'react'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'

/**
 * A generic modal, on shadcn/ui's Dialog (Radix — docs/DECISIONS.md, 0070): a focus trap,
 * Escape to close, and focus back to what opened it (WCAG 2.4.3). Knows nothing about
 * decisions or any other product concept: the caller supplies the title and body.
 *
 * There is no click-outside-to-close: closing is only ever Escape or an explicit action inside
 * the dialog (a real Cancel button, in every caller so far), so a stray click never discards
 * something the reviewer was in the middle of typing.
 *
 * Mount `Modal` to open it, unmount it to close it — there is no `open` prop.
 */
export interface ModalProps {
  title: string
  /** A short line above the title that says what kind of dialog this is ("Decision details"),
   * when the title itself is a name. */
  eyebrow?: string
  onClose: () => void
  children: ReactNode
  className?: string
  /** Overrides the scrim behind this one modal (docs/DECISIONS.md, 0100) — every other `Modal`
   * keeps the flat default. */
  overlayClassName?: string
}

export function Modal({
  title,
  eyebrow,
  onClose,
  children,
  className,
  overlayClassName,
}: ModalProps) {
  // What had focus when the dialog opened, read on the first render, before the dialog takes
  // it. Radix gives focus back to a `DialogTrigger`; a Modal is opened by mounting it, with no
  // trigger, so it gives focus back itself (docs/DECISIONS.md, 0059 and 0070).
  const [opener] = useState(() =>
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  )
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        // The body says what the dialog is for; there is no separate description to point to.
        aria-describedby={undefined}
        onInteractOutside={(event) => event.preventDefault()}
        // Escape is handled entirely ourselves, not left to Radix's own `DismissableLayer`
        // (docs/DECISIONS.md, 0103): it tracks which overlay is the topmost "layer" in one
        // `Set` shared by every Tooltip/Popover/Dialog in the app (a plain `React.createContext`
        // default value, never given a `.Provider`, so every consumer reads the same object —
        // confirmed by reading the installed package itself). A tooltip focused and then
        // tabbed away from earlier in the same keyboard pass can leave a stale entry in that
        // Set; when that happens, Radix's own Escape handler decides this dialog isn't the
        // topmost layer and silently skips closing it. Reproduced directly: identical steps,
        // ~15-45% failure rate depending on run. `onEscapeKeyDown` below suppresses Radix's own
        // handler so it can't also fire (it otherwise does, in the normal case where its layer
        // check passes, double-calling `onClose`); this `onKeyDown` is the one and only path.
        onEscapeKeyDown={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose()
        }}
        // Focus goes back to the opener — unless something outside the dialog took it on
        // purpose as it closed, such as the undo box's heading after a decision.
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          const active = document.activeElement
          if ((!active || active === document.body) && opener?.isConnected) {
            opener.focus({ preventScroll: true })
          }
        }}
        className={className}
        overlayClassName={overlayClassName}
      >
        <DialogHeader>
          {eyebrow && <p className="text-caption text-text-secondary">{eyebrow}</p>}
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-[var(--space-4)]">{children}</div>
      </DialogContent>
    </Dialog>
  )
}
