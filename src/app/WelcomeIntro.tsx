import { RotateCcw } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Button } from '../components/ui/button'
import { prefersReducedMotion } from '../lib/motion'
import { INTRO_TIMING, markIntroSeen } from './intro'
import { IntroScene } from './IntroScene'
import { WelcomeModal } from './WelcomeModal'
import './intro.css'

/**
 * The welcome, shown once per visit before the app (docs/DECISIONS.md, 0048, 0049; redesigned in
 * 0143): a short animated map — a request, an agent at work, a person reviewing — and then the
 * welcome dialog over the last frame, so the dialog never sits on top of the table. Decorative:
 * the picture is hidden from assistive technology and described in text instead; the page loads
 * underneath from the first moment.
 *
 * - "Skip intro" jumps to the last frame; "Replay intro" plays it again (and takes the dialog
 *   away until it is done). Escape also skips while it plays.
 * - Shown once per visit (`ledger:intro-seen` in sessionStorage).
 * - With `prefers-reduced-motion: reduce` it starts on the last frame, with the dialog open.
 * - The dialog's two choices end the welcome: "Take the tour" or "Skip, I'll look around".
 */
export interface WelcomeIntroProps {
  onStartTour: () => void
  onSkip: () => void
}

const DESCRIPTION =
  'A short animation follows a request from a person to an AI agent across three stations, each with a character: two round faces and a robot for the agent. At the first a person asks the agent for a change, at the second the agent does the work, and at the last the finished work is ready for review. A welcome dialog then opens.'

export function WelcomeIntro({ onStartTour, onSkip }: WelcomeIntroProps) {
  const [done, setDone] = useState(prefersReducedMotion)
  // Bumped by "Replay intro": a new key restarts every CSS animation from the beginning.
  const [run, setRun] = useState(0)
  const [fit, setFit] = useState(1)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (done) {
      markIntroSeen()
      return
    }
    timer.current = window.setTimeout(() => setDone(true), INTRO_TIMING.total)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDone(true)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer.current)
      window.removeEventListener('keydown', onKey)
    }
  }, [done, run])

  // The picture is drawn at 1440 x 900 and scaled to fit the window.
  useLayoutEffect(() => {
    const measure = () => setFit(Math.min(window.innerWidth / 1440, window.innerHeight / 900))
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  return (
    <div
      className="intro-overlay"
      data-testid="welcome-intro"
      data-done={done || undefined}
      style={{ '--intro-fit': fit } as CSSProperties}
    >
      <p className="sr-only">{DESCRIPTION}</p>
      <div className="intro-stage" key={run}>
        <IntroScene />
      </div>
      <div className="intro-skip">
        {!done && (
          <Button variant="outline" size="sm" onClick={() => setDone(true)}>
            Skip intro
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRun((n) => n + 1)
            setDone(false)
          }}
        >
          <RotateCcw aria-hidden className="h-[15px] w-[15px]" />
          Replay intro
        </Button>
      </div>
      {done && (
        <WelcomeModal
          onStartTour={onStartTour}
          onSkip={onSkip}
          onReplayIntro={() => {
            setRun((n) => n + 1)
            setDone(false)
          }}
        />
      )}
    </div>
  )
}
