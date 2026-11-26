import { Check, X, CircleHelp } from 'lucide-react'
import { ActorName } from '../features/run/ActorName'
import { buttonVariants } from '../components/ui/button'
import { cn } from '../lib/utils'

/**
 * The welcome intro's picture (docs/DECISIONS.md, 0143): a map with one orange route from left to
 * right, three stations on it — Alpha, where a person asks for a change; Beta, where the agent
 * works; Omega, where the finished work waits for review — each with a character and a card.
 * Everything is timed in CSS (intro.css) off the delays written here, in seconds. With
 * `done`, the last frame is shown at once. Decorative: the parent hides it from assistive
 * technology and gives it a text description instead.
 *
 * The characters are two plain round faces and a robot: no photos, no real people. The agent looks
 * unlike the people on purpose, so it never reads as one.
 */
const ROUTE = 'M-40 700C100 640 200 590 320 560C480 520 560 440 720 420C880 400 960 480 1120 520'
const ROUTE_FULL = `${ROUTE}C1250 550 1360 520 1480 440`

const GRID_X = Array.from({ length: 13 }, (_, i) => i * 120)
const GRID_Y = Array.from({ length: 8 }, (_, i) => i * 120)

/** A filled status disc with a glyph, as everywhere else in the app: colour is never alone. */
function Disc({
  tone,
  children,
}: {
  tone: 'pass' | 'fail' | 'unknown'
  children: React.ReactNode
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full text-bg',
        tone === 'pass' && 'bg-status-pass',
        tone === 'fail' && 'bg-status-fail',
        tone === 'unknown' && 'bg-art-lilac',
      )}
    >
      {children}
    </span>
  )
}

export function IntroScene() {
  return (
    <div className="intro-cam" aria-hidden>
      <svg width="1440" height="900" viewBox="0 0 1440 900" className="absolute top-0 left-0">
        <defs>
          <radialGradient id="intro-emoji" cx=".35" cy=".3" r=".8">
            <stop offset="0" style={{ stopColor: 'var(--art-gold-hi)' }} />
            <stop offset="1" style={{ stopColor: 'var(--art-gold-lo)' }} />
          </radialGradient>
          <mask
            id="intro-reveal"
            maskUnits="userSpaceOnUse"
            x="-100"
            y="0"
            width="1640"
            height="900"
          >
            <path
              className="intro-rev"
              pathLength={1}
              d={ROUTE}
              fill="none"
              stroke="white"
              strokeWidth="22"
            />
          </mask>
        </defs>
        {GRID_X.map((x) => (
          <path key={`x${x}`} d={`M${x} 0V900`} className="intro-grid" />
        ))}
        {GRID_Y.map((y) => (
          <path key={`y${y}`} d={`M0 ${y}H1440`} className="intro-grid" />
        ))}
        <path d={ROUTE_FULL} className="intro-route-base" />
        <g mask="url(#intro-reveal)">
          <path d={ROUTE_FULL} className="intro-route" />
        </g>

        {/* Alpha: a person asks. */}
        <g>
          <Station x={320} y={560} delay={4.3} tone="ink" />
          <g transform="translate(320 560) scale(.78)">
            <g className="intro-face" style={{ animationDelay: '4.2s', ['--t' as string]: '4.3s' }}>
              <circle r="52" className="art-face" />
              <path d="M-32 -18Q-20 -28 -8 -20M10 -18Q20 -22 32 -14" className="art-brow" />
              <ellipse cx="-18" cy="-4" rx="6" ry="8" className="art-eye" />
              <ellipse cx="18" cy="-4" rx="6" ry="8" className="art-eye" />
              <path d="M-24 22Q0 38 28 12" className="art-mouth" />
              <path d="M28 12l5-4" className="art-mouth art-mouth-thin" />
              <g className="intro-shades" shapeRendering="crispEdges">
                <rect x="-42" y="-20" width="84" height="6" className="art-black" />
                <rect x="-38" y="-14" width="34" height="18" className="art-black" />
                <rect x="4" y="-14" width="34" height="18" className="art-black" />
                <rect x="-32" y="4" width="22" height="4" className="art-black" />
                <rect x="10" y="4" width="22" height="4" className="art-black" />
                <rect x="-34" y="-12" width="6" height="5" className="art-white" opacity=".55" />
                <rect x="8" y="-12" width="6" height="5" className="art-white" opacity=".55" />
              </g>
              <text className="intro-cap" x="0" y="86" textAnchor="middle">
                DEAL WITH IT
              </text>
            </g>
          </g>
        </g>

        {/* Beta: the agent works. */}
        <g>
          <Station x={720} y={420} delay={7.8} tone="ink" />
          <g transform="translate(720 420) scale(.78)">
            <g className="intro-face" style={{ animationDelay: '7.7s', ['--t' as string]: '7.8s' }}>
              <path d="M0 -46V-64" className="art-antenna-stem" />
              <circle className="intro-ant" cx="0" cy="-69" r="6" />
              <circle cx="-56" cy="-4" r="9" className="art-steel" />
              <circle cx="56" cy="-4" r="9" className="art-steel" />
              <rect
                x="-50"
                y="-46"
                width="100"
                height="86"
                rx="34"
                className="art-steel art-steel-big"
              />
              <rect x="-40" y="-34" width="80" height="60" rx="26" className="art-screen" />
              <g className="intro-blink">
                <circle cx="-18" cy="-8" r="10" className="art-glow" />
                <circle cx="18" cy="-8" r="10" className="art-glow" />
                <circle cx="-17" cy="-6" r="4" className="art-screen" />
                <circle cx="19" cy="-6" r="4" className="art-screen" />
                <path d="M-28 -19H-8V-14H-28Z M8 -19H28V-14H8Z" className="art-screen" />
              </g>
              <path d="M-8 12H8" className="art-mouth-line" />
              <g>
                <rect x="-52" y="52" width="104" height="38" rx="5" className="art-desk" />
                <circle cx="0" cy="71" r="5" className="art-desk-dot" />
              </g>
              <g className="intro-hand">
                <rect x="-38" y="42" width="24" height="14" rx="7" className="art-hand" />
              </g>
              <g className="intro-hand intro-hand-2">
                <rect x="14" y="42" width="24" height="14" rx="7" className="art-hand" />
              </g>
              <text className="intro-cap intro-cap-sm" x="0" y="118" textAnchor="middle">
                WORKING VERY HARD
              </text>
            </g>
          </g>
        </g>

        {/* Omega: you review. */}
        <g>
          <Station x={1120} y={520} delay={11.2} tone="brand" pings={3} />
          <g transform="translate(1120 520) scale(.78)">
            <g
              className="intro-face"
              style={{ animationDelay: '11.1s', ['--t' as string]: '11.2s' }}
            >
              <g className="intro-think">
                <circle r="52" className="art-face" />
                <path d="M-32 -22Q-20 -32 -8 -24M10 -16Q20 -18 32 -14" className="art-brow" />
                <g className="intro-eyes">
                  <ellipse cx="-17" cy="-4" rx="5.5" ry="8" className="art-eye" />
                  <ellipse cx="19" cy="-4" rx="5.5" ry="8" className="art-eye" />
                  <circle cx="-15" cy="-8" r="2" className="art-white" />
                  <circle cx="21" cy="-8" r="2" className="art-white" />
                </g>
                <path d="M-14 26Q0 22 14 28" className="art-mouth" />
                <g>
                  <ellipse
                    cx="14"
                    cy="42"
                    rx="24"
                    ry="15"
                    transform="rotate(-18 14 42)"
                    className="art-face"
                  />
                  <ellipse
                    cx="-4"
                    cy="30"
                    rx="8"
                    ry="6"
                    transform="rotate(-30 -4 30)"
                    className="art-face"
                  />
                  <ellipse
                    cx="8"
                    cy="27"
                    rx="8"
                    ry="6"
                    transform="rotate(-20 8 27)"
                    className="art-face"
                  />
                  <ellipse
                    cx="21"
                    cy="28"
                    rx="8"
                    ry="6"
                    transform="rotate(-8 21 28)"
                    className="art-face"
                  />
                </g>
              </g>
              <circle cx="52" cy="-52" r="5" className="art-thought" />
              <circle cx="64" cy="-66" r="7" className="art-thought" />
              <text className="intro-cap intro-cap-hm" x="0" y="96" textAnchor="middle">
                HMM...
              </text>
              <g>
                <rect x="-62" y="104" width="124" height="26" rx="13" className="art-tag" />
                <text x="0" y="121.5" textAnchor="middle" className="art-tag-text">
                  YOU · REVIEWER
                </text>
              </g>
            </g>
          </g>
        </g>
      </svg>

      <div className="intro-card" style={{ left: 100, top: 262, animationDelay: '4.1s' }}>
        <div className="foil intro-card-foil" />
        <div className="intro-card-hd">Alpha · Request</div>
        <div className="mb-[10px] flex items-center gap-[10px]">
          <ActorName name="Mira Salo" />
        </div>
        <p className="intro-card-msg">Please add a rate limit to the public booking API.</p>
        <span className={buttonVariants({ variant: 'outline', size: 'sm' })}>Send to agent</span>
      </div>

      <div className="intro-card" style={{ left: 560, top: 130, animationDelay: '7.6s' }}>
        <div className="foil intro-card-foil" />
        <div className="intro-card-hd">Beta · Agent at work</div>
        <div className="intro-bar">
          <i style={{ animationDelay: '7.8s' }} />
        </div>
        <div className="flex flex-col gap-2">
          <div className="intro-st">
            <Disc tone="pass">
              <Check className="h-3 w-3" strokeWidth={3} />
            </Disc>
            <span>Plan made</span>
          </div>
          <div className="intro-st">
            <Disc tone="pass">
              <Check className="h-3 w-3" strokeWidth={3} />
            </Disc>
            <span>Changing 5 files</span>
          </div>
          <div className="intro-st">
            <span className="intro-spin" />
            <span>Adding tests</span>
          </div>
        </div>
      </div>

      <div
        className="intro-card"
        style={{ left: 950, top: 170, width: 390, animationDelay: '11.0s' }}
      >
        <div className="foil intro-card-foil" />
        <div className="intro-card-hd">Omega · Your review</div>
        <div className="mb-[10px] flex items-center gap-[10px]">
          <ActorName name="You" />
          <span className="text-meta text-text-secondary">the reviewer</span>
        </div>
        <div className="mb-3 text-item-title leading-snug font-semibold">
          Add a rate limit to the public booking API
        </div>
        <div className="intro-chips">
          <span style={{ animationDelay: '11.5s' }}>
            <Disc tone="pass">
              <Check className="h-3 w-3" strokeWidth={3} />
            </Disc>
            2 passed
          </span>
          <span style={{ animationDelay: '11.7s' }}>
            <Disc tone="fail">
              <X className="h-3 w-3" strokeWidth={3} />
            </Disc>
            1 failed
          </span>
          <span style={{ animationDelay: '11.9s' }}>
            <Disc tone="unknown">
              <CircleHelp className="h-3 w-3" strokeWidth={3} />
            </Disc>
            1 not run
          </span>
        </div>
        <div className="lbl mb-[10px]">Your decision</div>
        <div className="intro-btns" style={{ animationDelay: '12.2s' }}>
          <span className={buttonVariants({ variant: 'approve', size: 'sm' })}>Approve</span>
          <span className={buttonVariants({ variant: 'outline', size: 'sm' })}>
            Request changes
          </span>
          <span className={buttonVariants({ variant: 'destructive', size: 'sm' })}>Reject</span>
        </div>
      </div>

      <div className="intro-sat" />
    </div>
  )
}

/** The dashed coverage ring and the pings that mark a station when the route reaches it. */
function Station({
  x,
  y,
  delay,
  tone,
  pings = 2,
}: {
  x: number
  y: number
  delay: number
  tone: 'ink' | 'brand'
  pings?: number
}) {
  return (
    <>
      <circle
        className={cn('intro-cov', tone === 'brand' ? 'intro-cov-brand' : 'intro-cov-ink')}
        cx={x}
        cy={y}
        r="130"
        style={{ animationDelay: `${delay}s` }}
      />
      {Array.from({ length: pings }, (_, i) => (
        <circle
          key={i}
          className={cn('intro-ping', tone === 'brand' ? 'intro-ping-brand' : 'intro-ping-ink')}
          cx={x}
          cy={y}
          r="44"
          style={{ animationDelay: `${delay + i * 0.5}s` }}
        />
      ))}
    </>
  )
}
