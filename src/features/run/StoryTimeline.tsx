import { Button } from '../../components/ui/button'
import { isSystemActor } from '../../lib/actors'
import { formatClock, formatClockRange, formatCount, formatGateResultLabel } from '../../lib/format'
import { resolveStory } from '../../lib/story'
import type { ResolvedStoryStep, StoryStepTone } from '../../lib/story'
import type { Run } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ActorName } from './ActorName'
import { CheckCard } from './CheckCard'
import { ScoreCard } from './ScoreCard'
import { SectionHeading } from './SectionHeading'

/**
 * "What happened, in order" — the Story tab (docs/DECISIONS.md, 0038). The run told as short
 * plain paragraphs on a timeline spine, with each score and each check that needs attention
 * placed at the moment it happened, instead of in separate regions further down the page.
 * The last step is where the run is now: waiting for a decision, or the decision itself.
 */
export interface StoryTimelineProps {
  run: Run
  /** Opens the step list at this event — "Show all 180 steps". */
  onShowSteps: (eventId: string) => void
}

const DOT: Record<StoryStepTone, string> = {
  key: 'bg-text-primary',
  plain: 'bg-border',
  attention: 'bg-status-waived',
}

const OUTCOME_DOT = {
  approved: 'bg-status-pass',
  changes_requested: 'bg-status-waived',
  rejected: 'bg-status-fail',
} as const

/** A link-styled button inside the story's running text: it keeps the sentence's size. */
const LINK = 'text-[length:inherit] leading-[inherit] font-medium font-body'

function Step({
  time,
  label,
  dotClassName,
  children,
}: {
  time: string
  label: string
  dotClassName: string
  children: React.ReactNode
}) {
  return (
    <li className="relative flex flex-col gap-[var(--space-2)]">
      <span
        aria-hidden
        className={cn(
          'absolute top-[var(--space-1)] -left-[2.375rem] h-2.5 w-2.5 rounded-full ring-4 ring-bg',
          dotClassName,
        )}
      />
      <span className="text-meta font-medium font-body leading-none text-text-secondary">
        {time} · {label}
      </span>
      {children}
    </li>
  )
}

const PROSE = 'max-w-[45rem] text-lead font-normal font-body leading-[1.7] text-text-primary'

function StepBody({
  step,
  run,
  onShowSteps,
}: {
  step: ResolvedStoryStep
  run: Run
  onShowSteps: (eventId: string) => void
}) {
  const decided = run.decision != null
  const people = step.gates.filter(
    (gate) => gate.result === 'pass' && !isSystemActor(gate.evaluatedBy),
  )
  const flagged = step.gates.filter(
    (gate) => gate.result === 'fail' || gate.result === 'unknown' || gate.result === 'waived',
  )

  return (
    <>
      <p className={PROSE}>
        {step.text}{' '}
        {step.linkToSteps && (
          <Button
            variant="link"
            size="inline"
            className={LINK}
            onClick={() => onShowSteps(step.events[0].id)}
          >
            {step.events.length >= 10
              ? `Show all ${step.events.length} steps`
              : formatCount(step.events.length, 'step')}
          </Button>
        )}
      </p>

      {step.files.length > 0 && (
        <ul className="flex flex-wrap gap-[var(--space-2)]" aria-label="Changed files">
          {step.files.map((file) => (
            <li
              key={file.path}
              title={file.path}
              className="rounded-sm border border-border-subtle bg-surface px-[var(--space-3)] py-[var(--space-1)] font-mono text-caption whitespace-nowrap text-text-secondary"
            >
              <b
                aria-hidden
                className={file.added ? 'text-status-pass-tint-fg' : 'text-text-primary'}
              >
                {file.added ? '+' : '~'}
              </b>{' '}
              <span className="sr-only">{file.added ? 'Added' : 'Edited'} </span>
              {file.name}
            </li>
          ))}
        </ul>
      )}

      {people.map((gate) => (
        <p
          key={gate.id}
          className="flex flex-wrap items-center gap-[var(--space-2)] text-body font-normal font-body text-text-secondary"
        >
          {gate.name}: {formatGateResultLabel(gate).toLowerCase()}, checked by
          <ActorName name={gate.evaluatedBy} className="text-text-primary" />
        </p>
      ))}

      {flagged.length > 0 && (
        <div className="flex flex-col gap-[var(--space-2)]">
          {flagged.map((gate) => (
            <CheckCard key={gate.id} gate={gate} timeline={run.timeline} actionable={!decided} />
          ))}
        </div>
      )}

      {step.confidence.map((area) => (
        <ScoreCard key={area.area} area={area} decided={decided} />
      ))}
    </>
  )
}

function DecisionStep({ run }: { run: Run }) {
  const decision = run.decision
  if (!decision) {
    if (!run.finishedAt) return null
    return (
      <Step
        time={formatClock(run.finishedAt)}
        label="Waiting for a decision"
        dotClassName="border-2 border-status-waived bg-bg"
      >
        <p className={PROSE}>
          The run stopped here. Nothing is released until a person decides, and the decision is
          recorded with their name, the time, and the version{' '}
          <span className="font-mono text-body">{run.revision}</span>.
        </p>
      </Step>
    )
  }

  const acknowledged = formatCount(decision.acknowledgedItemIds.length, 'open item')
  const what = {
    approved: (
      <>
        approved the run and released revision{' '}
        <span className="font-mono text-body">{decision.revision}</span> to {run.target.environment}
        {decision.acknowledgedItemIds.length > 0 ? `, after ticking ${acknowledged}.` : '.'}
      </>
    ),
    changes_requested: <>sent the run back to the agent. Nothing was released.</>,
    rejected: <>rejected the run. Nothing was released.</>,
  }[decision.outcome]

  return (
    <Step
      time={formatClock(decision.at)}
      label="Decision"
      dotClassName={OUTCOME_DOT[decision.outcome]}
    >
      <p className={PROSE}>
        <ActorName name={decision.by} className="align-middle" /> {what}
      </p>
      {decision.reason && (
        <blockquote className="max-w-[45rem] border-l-2 border-border pl-[var(--space-4)] text-body font-normal font-body leading-relaxed text-text-secondary">
          <span className="font-medium text-text-primary">Their reason: </span>“{decision.reason}”
        </blockquote>
      )}
    </Step>
  )
}

export function StoryTimeline({ run, onShowSteps }: StoryTimelineProps) {
  const steps = resolveStory(run)

  return (
    <section aria-labelledby="story-heading" className="flex min-w-0 flex-col gap-[var(--space-5)]">
      <SectionHeading id="story-heading" focusTarget>
        What happened, in order
      </SectionHeading>

      {steps.length === 0 ? (
        <p className="text-body font-normal font-body text-text-secondary">
          The agent has not reported any steps yet. The full record is under “All steps”.
        </p>
      ) : (
        <ol className="ml-[var(--space-1)] flex flex-col gap-[var(--space-5)] border-l-2 border-border-subtle pl-[var(--space-6)]">
          {steps.map((step) => (
            <Step
              key={step.id}
              time={formatClockRange(step.startAt, step.endAt)}
              label={step.label}
              dotClassName={DOT[step.tone]}
            >
              <StepBody step={step} run={run} onShowSteps={onShowSteps} />
            </Step>
          ))}
          <DecisionStep run={run} />
        </ol>
      )}
    </section>
  )
}
