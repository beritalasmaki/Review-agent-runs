import { useEffect, useRef, useState } from 'react'
import { INTRO_PHASES, INTRO_TIMING, markIntroSeen } from './intro'
import type { IntroPhase } from './intro'
import { SignatureMark } from './SignatureMark'
import './intro.css'

/**
 * The welcome intro, shown once per visit before the app appears (docs/DECISIONS.md, 0048,
 * 0049; redesigned in 0142). Decorative, not informational: the page loads underneath from the
 * first moment, so the intro never delays the data.
 *
 * It tells the product's story as a short route across a map: Station Alpha (a run is
 * requested), Station Beta (an agent does the work), Station Omega (a person reviews and
 * decides). A marker travels the route; then the author's signature draws itself and the
 * overlay fades out. All shapes are simple, original figures: no photos, no real people.
 *
 * - Shown once per visit (`ledger:intro-seen` in sessionStorage), unless the visitor replays it
 *   from the welcome modal.
 * - Skipped outright for `prefers-reduced-motion: reduce` (the replay button is hidden then).
 * - Any click, tap or key press dismisses it at once. The overlay is `aria-hidden` and holds no
 *   focusable element, so it never traps keyboard focus.
 */
const NAME = 'Berit Alasmäki'
const TITLE = 'UX & Product Designer'

const ROUTE = 'M200 360 C 330 360, 420 200, 600 200 S 870 360, 1000 360'

const CAPTIONS: Record<IntroPhase, { station: string; line: string }> = {
  alpha: { station: 'Station Alpha', line: 'A run is requested' },
  beta: { station: 'Station Beta', line: 'An agent does the work' },
  omega: { station: 'Station Omega', line: 'You review it and decide' },
  sign: { station: '', line: '' },
  fade: { station: '', line: '' },
}

export interface WelcomeIntroProps {
  /** Called once, when the overlay has faded out or was skipped. */
  onDone: () => void
}

export function WelcomeIntro({ onDone }: WelcomeIntroProps) {
  const [phase, setPhase] = useState<IntroPhase>('alpha')
  const finished = useRef(false)
  const skip = useRef<() => void>(() => {})
  // The timeline runs once, on mount, and reads `onDone` through a ref, so a parent re-render
  // neither restarts the intro nor calls a stale callback.
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    const timers: number[] = []
    const at = (ms: number, run: () => void) => timers.push(window.setTimeout(run, ms))
    const finish = () => {
      if (finished.current) return
      finished.current = true
      timers.forEach((timer) => window.clearTimeout(timer))
      markIntroSeen()
      onDoneRef.current()
    }

    const t = INTRO_TIMING
    at(t.station, () => setPhase('beta'))
    at(t.station * 2, () => setPhase('omega'))
    at(t.station * 3, () => setPhase('sign'))
    at(t.station * 3 + t.sign, () => setPhase('fade'))
    at(t.station * 3 + t.sign + t.fade, finish)

    const onKey = () => finish()
    window.addEventListener('keydown', onKey)
    skip.current = finish
    return () => {
      window.removeEventListener('keydown', onKey)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const step = INTRO_PHASES.indexOf(phase)
  const caption = CAPTIONS[phase]
  const signing = phase === 'sign' || phase === 'fade'

  return (
    <div
      className="intro-overlay"
      data-phase={phase}
      data-testid="welcome-intro"
      aria-hidden
      onPointerDown={() => skip.current()}
    >
      <div className="intro-stage" data-signing={signing || undefined}>
        <svg viewBox="0 0 1200 520" className="intro-map" role="presentation">
          <path d={ROUTE} className="intro-route-base" />
          <path d={ROUTE} pathLength={1} className="intro-route" data-step={Math.min(step, 2)} />
          <Station x={200} y={360} label="A" active={step >= 0}>
            <Person x={200} y={296} />
            <Card x={150} y={190} title="Run requested" mark="dot" />
          </Station>
          <Station x={600} y={200} label="B" active={step >= 1}>
            <Robot x={600} y={136} />
            <Card x={550} y={30} title="Agent working" mark="dots" />
          </Station>
          <Station x={1000} y={360} label="Ω" active={step >= 2}>
            <Person x={1000} y={296} />
            <Card x={950} y={190} title="Your decision" mark="check" />
          </Station>
          <circle r={9} className="intro-marker" data-step={Math.min(step, 2)} />
        </svg>
        <div className="intro-caption" aria-hidden>
          <span className="intro-caption-station">{caption.station}</span>
          <span className="intro-caption-line">{caption.line}</span>
        </div>
        <div className="intro-sign">
          <SignatureMark className="intro-mark" size={120} resolved={signing} />
          <span className="intro-sign-label">Made by</span>
          <span className="intro-sign-name">{NAME}</span>
          <span className="intro-sign-title">{TITLE}</span>
        </div>
      </div>
    </div>
  )
}

function Station({
  x,
  y,
  label,
  active,
  children,
}: {
  x: number
  y: number
  label: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <g className="intro-station" data-active={active || undefined}>
      <circle cx={x} cy={y} r={20} className="intro-station-ring" />
      <text x={x} y={y + 6} textAnchor="middle" className="intro-station-label">
        {label}
      </text>
      {children}
    </g>
  )
}

/** A person: a plain round figure, never a likeness of anyone. */
function Person({ x, y }: { x: number; y: number }) {
  return (
    <g className="intro-person" transform={`translate(${x} ${y})`}>
      <circle r={24} className="intro-person-body" />
      <circle cx={-8} cy={-4} r={2.6} className="intro-face" />
      <circle cx={8} cy={-4} r={2.6} className="intro-face" />
      <path d="M-8 8 Q0 14 8 8" className="intro-mouth" />
    </g>
  )
}

/** An agent: square head and an antenna, so it never reads as a person. */
function Robot({ x, y }: { x: number; y: number }) {
  return (
    <g className="intro-robot" transform={`translate(${x} ${y})`}>
      <line x1={0} y1={-34} x2={0} y2={-24} className="intro-mouth" />
      <circle cy={-37} r={4} className="intro-antenna" />
      <rect x={-26} y={-24} width={52} height={44} rx={8} className="intro-robot-body" />
      <rect x={-14} y={-8} width={9} height={4} rx={2} className="intro-face-bar" />
      <rect x={5} y={-8} width={9} height={4} rx={2} className="intro-face-bar" />
      <line x1={-8} y1={8} x2={8} y2={8} className="intro-mouth" />
    </g>
  )
}

function Card({
  x,
  y,
  title,
  mark,
}: {
  x: number
  y: number
  title: string
  mark: 'dot' | 'dots' | 'check'
}) {
  return (
    <g className="intro-card" transform={`translate(${x} ${y})`}>
      <rect width={100} height={46} rx={6} className="intro-card-body" />
      <text x={10} y={19} className="intro-card-title">
        {title}
      </text>
      {mark === 'check' ? (
        <path d="M10 32 l5 5 l10 -11" className="intro-check" />
      ) : mark === 'dots' ? (
        <g className="intro-dots">
          <circle cx={14} cy={34} r={3} />
          <circle cx={26} cy={34} r={3} />
          <circle cx={38} cy={34} r={3} />
        </g>
      ) : (
        <circle cx={14} cy={34} r={4} className="intro-pulse" />
      )}
    </g>
  )
}
