import { Button } from '../../components/ui/button'
import { Textarea } from '../../components/ui/textarea'
import { Checkbox } from '../../components/ui/checkbox'
import { ArrowUpRight, Check, Pencil, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import type { SubmitDecisionOptions } from '../../lib/api'
import { UNDO_WINDOW_MINUTES } from '../../lib/decision'
import { formatCount } from '../../lib/format'
import { prefersReducedMotion } from '../../lib/motion'
import { approvalNeedsReason, buildOpenItems, missingChecks } from '../../lib/openItems'
import type { OpenItemTarget } from '../../lib/openItems'
import type { Decision, Run } from '../../lib/types'
import { cn } from '../../lib/utils'
import { CURRENT_REVIEWER } from './currentReviewer'
import { DecisionDialog } from './DecisionDialog'
import type { DecisionAction } from './DecisionDialog'
import { InfoTip } from '../../components/InfoTip'
import { OpenItemsNotice } from './OpenItemsNotice'
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
  // Request changes / Reject run's icon pops the same way Approve's own button does, briefly,
  // before its confirmation opens (.t-icon-pop, transitions.css; docs/DECISIONS.md, 0090).
  const [bouncedAction, setBouncedAction] = useState<Exclude<DecisionAction, 'approved'> | null>(
    null,
  )
  const bounceTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(bounceTimer.current), [])
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
    window.clearTimeout(bounceTimer.current)
    if (prefersReducedMotion()) {
      setOpenAction(action)
      return
    }
    setBouncedAction(action)
    // Matches --icon-pop-dur in transitions.css, so the pop is visible before the confirmation
    // opens over it — the same reasoning approve()'s own delay already uses.
    bounceTimer.current = window.setTimeout(() => {
      setBouncedAction(null)
      setOpenAction(action)
    }, 260)
  }

  function applyConflict(decision: Decision) {
    onRunUpdated({ ...run, decision, status: decision.outcome })
  }

  const tickedCount = items.length - left
  return (
    <section aria-label="Your decision" className="panel overflow-hidden">
      <div aria-hidden className="foil" />
      <div className="flex flex-col gap-[var(--space-5)] p-[var(--space-5)]">
        <div className="flex flex-col gap-[var(--space-4)]">
          <div className="flex items-center gap-[var(--space-2)]">
            <SectionHeading id="decision-heading">Decision</SectionHeading>
            <InfoTip label="the decision">
              {`Made by you, never by the agent. It is saved with your name (${reviewerName}), the time, your ticks and your reason, and you can undo it for ${UNDO_WINDOW_MINUTES} minutes.`}
            </InfoTip>
          </div>
          <div className="flex items-center gap-[var(--space-2)]">
            <OpenItemsNotice run={run} jump={false} />
            {items.length > 0 && (
              <InfoTip label="open items">
                {run.target.environment === 'production'
                  ? 'This change goes to production. Tick each item to say you have seen it and accept it.'
                  : 'Tick each item to say you have seen it and accept it.'}
              </InfoTip>
            )}
          </div>
        </div>

        <fieldset
          id="open-items"
          className="t-spotlight flex scroll-mt-[calc(var(--space-5))] flex-col gap-[var(--space-3)]"
        >
          <legend className="lbl mb-[var(--space-3)] flex w-full items-center justify-between">
            <span>
              Open items<span className="sr-only">: confirm each one</span>
            </span>
            {items.length > 0 && (
              <span className="font-body tracking-normal normal-case">
                {tickedCount} of {items.length}
              </span>
            )}
          </legend>
          {items.length === 0 ? (
            <p className="text-meta text-text-secondary">
              Nothing is open: no check failed or was left without a result, and no score is low.
            </p>
          ) : (
            items.map((item) => {
              const checked = ticked.has(item.id)
              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex items-start gap-[var(--space-3)] rounded-[3px] border px-[var(--space-4)] py-[var(--space-3)]',
                    checked
                      ? 'border-border-subtle bg-bg'
                      : 'border-status-waived/50 bg-status-waived-tint-bg',
                  )}
                >
                  <label
                    className={cn(
                      'flex flex-1 cursor-pointer items-start gap-[var(--space-3)] rounded-sm',
                      'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring',
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(item.id)}
                      // The label's own ring shows focus, around the box and its sentence.
                      className="mt-[2px] h-[18px] w-[18px] rounded-[2px] border-0 bg-text-primary text-primary-foreground focus-visible:outline-none data-[state=checked]:bg-primary-strong"
                    />
                    <span className="text-meta leading-relaxed font-normal font-body text-text-primary">
                      {item.text}
                    </span>
                  </label>
                  {onShowItem && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onShowItem(item.target)}
                      aria-label={SHOW_LABEL[item.target.kind](item.target)}
                      title={SHOW_LABEL[item.target.kind](item.target).replace(' →', '')}
                      className="h-6 w-6 shrink-0 text-text-secondary"
                    >
                      <ArrowUpRight aria-hidden className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )
            })
          )}
        </fieldset>

        <div className="flex flex-col gap-[var(--space-3)]">
          <div className="flex items-center gap-[var(--space-2)]">
            <label htmlFor={reasonId} className="lbl">
              Reason for approving{' '}
              <span className="tracking-normal normal-case">
                {reasonRequired
                  ? `(required: ${formatCount(missing, 'check')} ${missing === 1 ? 'is' : 'are'} missing)`
                  : '(optional)'}
              </span>
            </label>
            <InfoTip label="the reason">
              Request changes and Reject run also ask for a short reason. Your name, the time, your
              ticks and your reason are saved with the run.
            </InfoTip>
          </div>
          <Textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            required={reasonRequired}
            placeholder={reasonRequired ? 'What risk are you accepting, and why?' : undefined}
            className="text-meta focus-visible:border-primary"
          />
          <span
            id={hintId}
            className="text-meta leading-relaxed font-normal font-body text-text-secondary"
            aria-live="polite"
          >
            {approveHint}
          </span>
          <span className="text-meta leading-relaxed font-normal font-body text-text-secondary">
            Approving releases revision <span className="font-mono">{run.revision}</span> to{' '}
            <b className="font-semibold text-text-primary">{run.target.environment}</b>. You can
            undo this for {UNDO_WINDOW_MINUTES} minutes.
          </span>
          <Button
            variant="approve"
            onClick={approve}
            disabled={!ready}
            aria-describedby={hintId}
            data-popping={popping || undefined}
            className="t-pop min-h-[60px] w-full"
          >
            <span className="t-pop-label">
              <Check aria-hidden className="h-4 w-4" strokeWidth={2.5} />
              Approve and release
            </span>
          </Button>
          <div className="flex items-center gap-[var(--space-2)]">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => openOther('changes_requested')}
            >
              <Pencil
                aria-hidden
                data-bounce={bouncedAction === 'changes_requested' || undefined}
                className="t-icon-pop h-4 w-4"
              />
              Request changes
            </Button>
            <InfoTip label="sending it back">
              Sends the run back to the agent with your reason. The agent tries again. Nothing is
              released.
            </InfoTip>
          </div>
          <div
            role="separator"
            className="my-[var(--space-2)] border-t border-dashed border-border-subtle"
          />
          <div className="flex items-center gap-[var(--space-2)]">
            <Button variant="destructive" size="sm" onClick={() => openOther('rejected')}>
              <X
                aria-hidden
                data-bounce={bouncedAction === 'rejected' || undefined}
                className="t-icon-pop h-4 w-4"
              />
              Reject run
            </Button>
            <InfoTip label="closing the run">
              Closes the run for good. The agent does not try again. Nothing is released.
            </InfoTip>
          </div>
        </div>

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
      </div>
    </section>
  )
}
