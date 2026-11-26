import { ArrowRight, RotateCcw } from 'lucide-react'
import { Modal } from '../components/Modal'
import { Button } from '../components/ui/button'
import { prefersReducedMotion } from '../lib/motion'

/**
 * Shown once per visit, right after the welcome intro, over the home page only
 * (docs/DECISIONS.md, 0079). Says what the screen is and why it exists, then asks directly:
 * take the guided tour, or skip it and look around alone. Closing it any other way (Escape)
 * counts as skipping — there is nothing to come back to mid-way, so there is no third option.
 *
 * A plain surface like every other `Modal` (docs/DECISIONS.md, 0135, replacing 0100's glass).
 */
export interface WelcomeModalProps {
  onStartTour: () => void
  onSkip: () => void
  /** Plays the intro again. Left out, or with reduced motion on, there is no replay button. */
  onReplayIntro?: () => void
}

export function WelcomeModal({ onStartTour, onSkip, onReplayIntro }: WelcomeModalProps) {
  return (
    <Modal title="Welcome to Review agent runs" onClose={onSkip} className="max-w-[32rem]">
      <p className="text-body leading-relaxed text-text-primary">
        This is where a reviewer looks at what an AI agent did to a piece of software, and decides
        whether to approve it, send it back, or reject it.
      </p>
      <p className="text-body leading-relaxed text-text-primary">
        It was built by Berit Alasmäki, a UX and product designer. She kept seeing teams bring in AI
        agents faster than anyone could keep track of what those agents were actually doing, and
        wanted to try designing an interface for that — not for any one company, just an idea worth
        testing.
      </p>
      {onReplayIntro && !prefersReducedMotion() && (
        <Button variant="link" size="inline" onClick={onReplayIntro} className="self-start">
          <RotateCcw aria-hidden className="h-4 w-4" />
          Replay the intro
        </Button>
      )}
      <div className="flex flex-wrap items-center justify-end gap-[var(--space-3)]">
        <Button variant="outline" onClick={onSkip}>
          Skip, I'll look around myself
        </Button>
        <Button onClick={onStartTour}>
          Take the tour
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Button>
      </div>
    </Modal>
  )
}
