import { Modal } from '../components/Modal'
import { Button } from '../components/ui/button'

/**
 * Shown once per visit, right after the welcome intro, over the home page only
 * (docs/DECISIONS.md, 0079). Says what the screen is and why it exists, then asks directly:
 * take the guided tour, or skip it and look around alone. Closing it any other way (Escape)
 * counts as skipping — there is nothing to come back to mid-way, so there is no third option.
 */
export interface WelcomeModalProps {
  onStartTour: () => void
  onSkip: () => void
}

export function WelcomeModal({ onStartTour, onSkip }: WelcomeModalProps) {
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
      <div className="flex flex-wrap items-center justify-end gap-[var(--space-3)]">
        <Button variant="outline" onClick={onSkip}>
          Skip, I'll look around myself
        </Button>
        <Button onClick={onStartTour}>Take the tour</Button>
      </div>
    </Modal>
  )
}
