import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { Checkbox } from '../../components/ui/checkbox'
import { ArrowLeft, Check, Info, ShieldCheck, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { SubmitDecisionOptions } from '../../lib/api'
import { UNDO_WINDOW_MINUTES } from '../../lib/decision'
import { formatCount } from '../../lib/format'
import { approvalNeedsReason, buildOpenItems, missingChecks } from '../../lib/openItems'
import type { OpenItemTarget } from '../../lib/openItems'
import type { Decision, Run } from '../../lib/types'
import { cn } from '../../lib/utils'
import { ActorName } from './ActorName'
import { CURRENT_REVIEWER } from './currentReviewer'
import { DecisionDialog } from './DecisionDialog'
import type { DecisionAction } from './DecisionDialog'
import { SectionHeading } from './SectionHeading'

/**
 * "Your decision" — the right-hand panel before a decision (Region 6). Two numbered steps:
 * confirm each open item, then choose one action. docs/DECISIONS.md, 0040: every open item is
 * ticked separately, and approving with a check that failed or did not run needs a written
 * reason. docs/DECISIONS.md, 0039: "Approve and release" is the only filled button; "Request
 * changes" and "Reject run" sit below a divider, and every action says what happens next.
 *
 * Each action still opens `DecisionDialog`, which names the revision and target before
 * anything is recorded (spec, Acceptance criteria: "The confirmation names the revision and
 * the target environment") and asks for the reason for the other two actions.
 */
export interface DecisionPanelProps {
  run: Run
  reviewerName?: string
  onRunUpdated: (updatedRun: Run) => void
  submitDecisionOptions?: SubmitDecisionOptions
  /** Mainly for stories: start with these open items already ticked. */
  defaultTickedIds?: string[]
  /** Mainly for stories: start with this reason already written. */
  defaultReason?: string
  /** Shows where an open item comes from — its check or score card, or its step
   * (docs/DECISIONS.md, 0055). Without it, the items have no "Show the …" link. */
  onShowItem?: (target: OpenItemTarget) => void
}

/** The link under each open item (docs/DECISIONS.md, 0055). */
const SHOW_LABEL: Record<OpenItemTarget['kind'], (target: OpenItemTarget) => string> = {
  check: (target) =>
    target.kind === 'check' && target.count > 1 ? 'Show the checks →' : 'Show the check →',
  score: () => 'Show the score →',
  step: () => 'Show the step →',
}

function StepNumber({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-text-primary text-caption font-semibold font-body leading-none text-surface"
    >
      {children}
    </span>
  )
}

export function DecisionPanel({
  run,
  reviewerName = CURRENT_REVIEWER,
  onRunUpdated,
  submitDecisionOptions,
  defaultTickedIds = [],
  defaultReason = '',
  onShowItem,
}: DecisionPanelProps) {
  const items = buildOpenItems(run)
  const [ticked, setTicked] = useState<Set<string>>(() => new Set(defaultTickedIds))
  const [reason, setReason] = useState(defaultReason)
  const [openAction, setOpenAction] = useState<DecisionAction | null>(null)
  const [popping, setPopping] = useState(false)
  const popTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(popTimer.current), [])
  const reasonId = useId()
  const hintId = useId()

  const left = items.filter((item) => !ticked.has(item.id)).length
  const reasonRequired = approvalNeedsReason(run)
  const missing = missingChecks(run).length
  const hasReason = reason.trim().length > 0
  const ready = left === 0 && (!reasonRequired || hasReason)

  const todo: string[] = []
  if (left > 0) todo.push(`tick ${formatCount(left, 'more item')}`)
  if (reasonRequired && !hasReason) todo.push('add a reason')
  const approveHint = ready
    ? `Ready. Releases ${run.revision} to ${run.target.system} in ${run.target.environment}. You can undo for ${UNDO_WINDOW_MINUTES} minutes.`
    : `To approve, ${todo.join(' and ')}.`

  function toggle(id: string) {
    setTicked((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // "Approve and release" pops before its confirmation opens (docs/DECISIONS.md, 0051). No
  // motion — reduced-motion users, or an environment that can't report the preference —
  // means no pop and no wait: the confirmation opens at once.
  function approve() {
    const canAnimate =
      typeof window.matchMedia === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!canAnimate) {
      setOpenAction('approved')
      return
    }
    if (popping) return
    setPopping(true)
    // Matches --pop-dur in transitions.css, plus a little slack; a timer rather than
    // `animationend`, so the dialog always opens even if the animation never runs.
    popTimer.current = window.setTimeout(() => {
      setPopping(false)
      setOpenAction('approved')
    }, 440)
  }

  // Request changes or Reject pressed during the pop wins: the pending approve must not open
  // over it and turn a decline into an approval.
  function openOther(action: Exclude<DecisionAction, 'approved'>) {
    window.clearTimeout(popTimer.current)
    setPopping(false)
    setOpenAction(action)
  }

  function applyConflict(decision: Decision) {
    onRunUpdated({ ...run, decision, status: decision.outcome })
  }

  return (
    <section
      aria-labelledby="decision-heading"
      className="flex flex-col gap-[var(--space-6)] rounded-lg border border-border bg-surface shadow-card p-[var(--space-4)]"
    >
      <div className="flex flex-col gap-[var(--space-4)]">
        <div className="flex flex-col gap-[var(--space-1)]">
          <SectionHeading id="decision-heading" icon={ShieldCheck}>
            Your decision
          </SectionHeading>
          <p className="text-meta font-normal font-body text-text-secondary">
            Made by you, never by the agent. You can undo it for {UNDO_WINDOW_MINUTES} minutes.
          </p>
        </div>

        <div className="flex flex-col gap-[var(--space-2)]">
          <span className="text-caption font-normal font-body text-text-secondary">
            Deciding as
          </span>
          <ActorName name={reviewerName} className="self-start text-body font-medium" />
        </div>
      </div>

      <fieldset
        id="open-items"
        className="t-spotlight flex scroll-mt-[calc(var(--run-bar-height,4rem)+var(--space-5))] flex-col gap-[var(--space-2)]"
      >
        <legend className="mb-[var(--space-2)] flex w-full items-center gap-[var(--space-2)] text-meta font-semibold font-heading text-text-primary">
          <StepNumber>1</StepNumber>
          Confirm each open item
          {items.length > 0 && (
            <span className="ml-auto text-caption font-normal font-body text-text-secondary">
              {items.length - left} of {items.length}
            </span>
          )}
        </legend>
        {items.length === 0 ? (
          <p className="text-caption font-normal font-body text-text-secondary">
            Nothing is open: no check failed or was left without a result, and no score is low.
          </p>
        ) : (
          <>
            <p className="text-caption font-normal font-body leading-relaxed text-text-secondary">
              {run.target.environment === 'production'
                ? 'This change goes to production. Tick each item to say you have seen it and accept it.'
                : 'Tick each item to say you have seen it and accept it.'}
            </p>
            {items.map((item) => {
              const checked = ticked.has(item.id)
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex flex-col gap-[var(--space-2)] rounded-md border px-[var(--space-3)] py-[var(--space-3)]',
                    checked
                      ? 'border-border-subtle bg-bg'
                      : 'border-status-waived/40 bg-status-waived-tint-bg',
                  )}
                >
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-[var(--space-3)] rounded-sm',
                      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring',
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(item.id)}
                      // The label's own ring shows focus, around the box and its sentence.
                      className="mt-[var(--space-1)] border-status-waived text-surface focus-visible:outline-none data-[state=checked]:border-status-waived data-[state=checked]:bg-status-waived"
                    />
                    <span className="text-meta font-normal font-body leading-relaxed text-text-primary">
                      {item.text}
                    </span>
                  </label>
                  {onShowItem && (
                    <Button
                      variant="link"
                      size="inline"
                      onClick={() => onShowItem(item.target)}
                      className="ml-[calc(1rem+var(--space-3))] self-start font-medium font-body"
                    >
                      {SHOW_LABEL[item.target.kind](item.target)}
                    </Button>
                  )}
                </div>
              )
            })}
          </>
        )}
      </fieldset>

      <div className="flex flex-col gap-[var(--space-3)] border-t border-border-subtle pt-[var(--space-4)]">
        <span className="flex items-center gap-[var(--space-2)] text-meta font-semibold font-heading text-text-primary">
          <StepNumber>2</StepNumber>
          Choose one
        </span>

        <div className="flex flex-col gap-[var(--space-2)]">
          <label
            htmlFor={reasonId}
            className="text-caption font-semibold font-body text-text-primary"
          >
            Reason for approving{' '}
            <span className="font-normal text-text-secondary">
              {reasonRequired
                ? `(required: ${formatCount(missing, 'check')} ${missing === 1 ? 'is' : 'are'} missing)`
                : '(optional)'}
            </span>
          </label>
          <Textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            required={reasonRequired}
            placeholder={
              reasonRequired
                ? 'For example: these checks do not apply because no new dependencies or screens were added.'
                : undefined
            }
            className="text-meta focus-visible:border-primary"
          />
          <Button
            onClick={approve}
            disabled={!ready}
            aria-describedby={hintId}
            data-popping={popping || undefined}
            className="t-pop"
          >
            <span className="t-pop-label">
              <Check aria-hidden className="h-4 w-4" strokeWidth={2.5} />
              Approve and release
            </span>
          </Button>
          <span
            id={hintId}
            className="text-caption font-normal font-body leading-relaxed text-text-secondary"
            aria-live="polite"
          >
            {approveHint}
          </span>
        </div>

        <div
          className="my-[var(--space-1)] flex items-center gap-[var(--space-3)] text-caption font-normal font-body text-text-secondary"
          role="separator"
        >
          <span className="h-px flex-1 bg-border-subtle" />
          or, if it is not ready
          <span className="h-px flex-1 bg-border-subtle" />
        </div>

        <div className="flex flex-col gap-[var(--space-2)]">
          <Button variant="outline" onClick={() => openOther('changes_requested')}>
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Request changes
          </Button>
          <span className="text-caption font-normal font-body leading-relaxed text-text-secondary">
            Sends the run back to the agent with your reason. The agent tries again. Nothing is
            released.
          </span>
        </div>

        <div className="flex flex-col gap-[var(--space-2)]">
          <Button variant="destructive" onClick={() => openOther('rejected')}>
            <X aria-hidden className="h-4 w-4" />
            Reject run
          </Button>
          <span className="text-caption font-normal font-body leading-relaxed text-text-secondary">
            Closes the run for good. The agent does not try again. Nothing is released.
          </span>
        </div>
      </div>

      <p className="flex gap-[var(--space-2)] rounded-md bg-surface-raised px-[var(--space-3)] py-[var(--space-3)] text-caption font-normal font-body leading-relaxed text-text-secondary">
        <Info aria-hidden className="mt-[var(--space-1)] h-4 w-4 shrink-0" />
        Request changes and Reject run also ask for a short reason. Your name, the time, your ticks
        and your reason are saved with the run.
      </p>

      {openAction && (
        <DecisionDialog
          action={openAction}
          runId={run.id}
          revision={run.revision}
          environment={run.target.environment}
          reviewerName={reviewerName}
          acknowledgedItemIds={openAction === 'approved' ? [...ticked] : []}
          approvalReason={reason}
          onClose={() => setOpenAction(null)}
          onDecided={(updatedRun) => {
            onRunUpdated(updatedRun)
            setOpenAction(null)
          }}
          onConflict={applyConflict}
          submitDecisionOptions={submitDecisionOptions}
        />
      )}
    </section>
  )
}
