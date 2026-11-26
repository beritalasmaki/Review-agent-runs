import { ArrowRight, RotateCcw } from 'lucide-react'
import { Modal } from '../components/Modal'
import { Button } from '../components/ui/button'

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
    <Modal title="Welcome to Review agent runs" onClose={onSkip} className="max-w-[35rem]">
      <p className="text-lead leading-relaxed text-text-secondary">
        This is where a reviewer looks at what an AI agent did to a piece of software, and decides
        whether to approve it, send it back, or reject it.
      </p>
      <p className="text-lead leading-relaxed text-text-secondary">
        The idea is based on the EU AI Act, which asks that people can oversee what an AI system
        does (Article 14, human oversight). As agents take on more work, a person has to stay in the
        loop on what they are doing.
      </p>
      <p className="text-lead leading-relaxed text-text-secondary">
        It was built by Berit Alasmäki, a UX and product designer, to test how an interface for that
        could work. It is not for any one company, and it is not a compliance tool.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-3)]">
        {onReplayIntro ? (
          <Button variant="link" size="inline" onClick={onReplayIntro}>
            <RotateCcw aria-hidden className="h-4 w-4" />
            Replay intro
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-wrap items-center gap-[var(--space-3)]">
          <Button variant="outline" onClick={onSkip}>
            Skip, I'll look around myself
          </Button>
          <Button onClick={onStartTour} autoFocus>
            Take the tour
            <ArrowRight
              aria-hidden
              className="h-4 w-4 transition-transform group-hover:translate-x-[3px]"
            />
          </Button>
        </div>
      </div>
    </Modal>
  )
}
