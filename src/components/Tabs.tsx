import { useLayoutEffect, useRef } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { cn } from '../lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip'
import * as UI from './ui/tabs'

/**
 * A real ARIA tabs widget (`role="tablist"`/`"tab"`/`"tabpanel"`, arrow-key navigation between
 * triggers), on shadcn/ui's Tabs (`ui/tabs.tsx`, Radix — docs/DECISIONS.md, 0070), so the
 * correct keyboard behaviour and assistive-tech semantics come for free. This file adds what
 * shadcn's has not: the pill's sliding background, and a shadcn Tooltip on a pill tab. Knows nothing about policy gates or any other
 * product concept; `value`/`onValueChange` are the caller's, same shape as
 * Radix's `Tabs.Root`.
 */
export interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
  className?: string
  /** `automatic` (default): arrow keys select as they move. `manual`: arrow keys only move
   * focus, and Enter, Space or a click selects. Use `manual` when selecting a tab moves focus
   * into its panel — otherwise arrowing along the tab list would pull focus out of it. */
  activationMode?: 'automatic' | 'manual'
}

export function Tabs({
  value,
  onValueChange,
  children,
  className,
  activationMode = 'automatic',
}: TabsProps) {
  return (
    <UI.Tabs
      value={value}
      onValueChange={onValueChange}
      activationMode={activationMode}
      className={className}
    >
      {children}
    </UI.Tabs>
  )
}

/** `segmented`: the full-width bar described below. `pill`: a compact rounded track whose
 * selected tab is a raised white pill — for a small set of views in a toolbar, where a
 * full-width bar would dominate. `line`: text tabs on a rule, the selected one underlined in
 * the brand colour — for tabs that filter one list, each carrying its own icon and count
 * (docs/DECISIONS.md, 0060). */
export type TabsVariant = 'segmented' | 'pill' | 'line'

export interface TabsListProps {
  children: ReactNode
  className?: string
  variant?: TabsVariant
  /** Names the tab list for assistive tech when there is no visible heading for it. */
  label?: string
}

/** A full-width segmented bar (each trigger fills an equal share of the row, not a small
 * underlined text-link row) — the tab itself carries the "selected" affordance via its own
 * fill colour, divided from its neighbour by a vertical rule and from the row above/below by
 * a horizontal one. No rounding or side borders by default: the usual placement is edge-to-
 * edge inside a card that already has its own border, and a caller wanting the bar to bleed
 * to that card's outer edge supplies its own negative margin (this component doesn't assume
 * a specific parent padding value). */
export function TabsList({ children, className, variant = 'segmented', label }: TabsListProps) {
  if (variant === 'pill') {
    return (
      <PillTabsList className={className} label={label}>
        {children}
      </PillTabsList>
    )
  }
  if (variant === 'line') {
    return (
      <LineTabsList className={className} label={label}>
        {children}
      </LineTabsList>
    )
  }
  return (
    <UI.TabsList variant="segmented" aria-label={label} className={className}>
      {children}
    </UI.TabsList>
  )
}

/**
 * The shared measuring behind both sliding indicators — transitions.dev "Tabs sliding"
 * (src/styles/transitions.css, docs/DECISIONS.md 0047, 0084). The active tab is measured and
 * its position (and, for the pill, its size) written onto one element behind the labels; CSS
 * owns the tween. The first placement, and any placement after a resize (a font finishing
 * loading, a wrap), happens without a transition, so the indicator never slides in from the
 * left edge. A `requestAnimationFrame` poll checks which tab carries `aria-selected="true"`
 * (not `data-state` — see the comment in `place()` below) once a frame and re-measures only on
 * a change, so it follows every way a tab can become active — click, Enter, Space, or a caller
 * changing `value` — without ever running inside input-event handling itself (see `place`'s own
 * comment for why that distinction matters).
 */
function useSlidingIndicator(kind: 'pill' | 'line') {
  const listRef = useRef<HTMLDivElement>(null)
  const indicatorRef = useRef<HTMLSpanElement>(null)

  useLayoutEffect(() => {
    const list = listRef.current
    const indicator = indicatorRef.current
    if (!list || !indicator) return

    function place(animate: boolean) {
      if (!list || !indicator) return
      // aria-selected, not data-state: a pill trigger with a tooltip is wrapped in Radix's
      // Tooltip via `asChild` (PillTrigger below), which writes its own data-state (tooltip
      // open/closed) onto the same DOM node as Tabs' data-state (active/inactive) — once it
      // settles, a query keyed on data-state finds nothing, and the indicator vanishes on the
      // next switch. aria-selected is Radix Tabs' own attribute; nothing else touches it.
      const active = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
      if (!active) {
        indicator.style.opacity = '0'
        return
      }
      const listBox = list.getBoundingClientRect()
      const tabBox = active.getBoundingClientRect()
      const apply = () => {
        if (kind === 'pill') {
          indicator.style.transform = `translate(${tabBox.left - listBox.left}px, ${tabBox.top - listBox.top}px)`
          indicator.style.height = `${tabBox.height}px`
        } else {
          indicator.style.transform = `translateX(${tabBox.left - listBox.left}px)`
        }
        indicator.style.width = `${tabBox.width}px`
        indicator.style.opacity = '1'
      }
      if (animate) {
        apply()
        return
      }
      const previous = indicator.style.transition
      indicator.style.transition = 'none'
      apply()
      // Reading layout makes the browser commit the new position with no transition before
      // the transition comes back; without it both changes land together and the indicator
      // slides.
      void indicator.offsetWidth
      indicator.style.transition = previous
    }

    place(false)
    // Three earlier approaches all broke the same way: a `MutationObserver` calling `place`
    // straight away, the same observer coalesced through one `requestAnimationFrame`, and a
    // continuous per-frame `requestAnimationFrame` poll (even debounced, so it rarely measured
    // layout — the loop itself was still running every frame). All three dropped roughly one
    // run in three of a fast second arrow-key press under automatic activation — the same class
    // of bug as docs/WORKLOG.md's 2026-09-24 entry, confirmed directly (several arrow presses
    // with no delay between them) and confirmed again the other way: no `requestAnimationFrame`
    // loop running at all, same DOM, same `MutationObserver`, made the flakiness disappear, so
    // a continuously rescheduling `requestAnimationFrame` chain — not the layout reads
    // specifically — is what was perturbing Chromium's input handling here. What finally held
    // up under the same repeated test: back to the `MutationObserver` (event-driven, nothing
    // runs when nothing changes), but its callback only ever resets a debounce timer — it never
    // calls `place` itself — so the one `getBoundingClientRect` read per settled burst happens
    // on a plain timer callback, never inside the observer's own microtask.
    let debounce: ReturnType<typeof setTimeout> | null = null
    const mutations = new MutationObserver(() => {
      if (debounce != null) clearTimeout(debounce)
      debounce = setTimeout(() => {
        debounce = null
        place(true)
      }, 60)
    })
    mutations.observe(list, { attributes: true, attributeFilter: ['aria-selected'], subtree: true })
    const resizes =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => place(false))
    resizes?.observe(list)
    return () => {
      mutations.disconnect()
      if (debounce != null) clearTimeout(debounce)
      resizes?.disconnect()
    }
  }, [kind])

  return { listRef, indicatorRef }
}

function PillTabsList({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label?: string
}) {
  const { listRef, indicatorRef } = useSlidingIndicator('pill')
  return (
    <UI.TabsList ref={listRef} variant="pill" aria-label={label} className={className}>
      <span
        ref={indicatorRef}
        aria-hidden
        className="t-tabs-pill rounded-full bg-surface shadow-sm"
      />
      {children}
    </UI.TabsList>
  )
}

/**
 * The line variant's sliding underline (0084): the same movement as the pill above, asked for
 * so switching the run-type tabs (Pending, Requested for change, …) feels like switching the
 * run page's Story/Evidence/All steps view. Only `transform` and `width` are tweened — never a
 * colour — the same reason the pill's own `.t-tab` colour change is a plain, untransitioned
 * swap: a colour transition on these tabs dropped arrow-key presses in the keyboard e2e spec
 * before (docs/WORKLOG.md, 2026-09-24). Each trigger's own `data-[state=active]:text-text-primary`
 * (ui/tabs.tsx) still marks the selected tab instantly and independently, so the underline is a
 * decoration on top of an always-correct state, not the only thing carrying it.
 */
function LineTabsList({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label?: string
}) {
  const { listRef, indicatorRef } = useSlidingIndicator('line')
  return (
    <UI.TabsList
      ref={listRef}
      variant="line"
      aria-label={label}
      className={cn('relative', className)}
    >
      <span ref={indicatorRef} aria-hidden className="t-tabs-line bg-primary-strong" />
      {children}
    </UI.TabsList>
  )
}

export interface TabsTriggerProps {
  value: string
  children: ReactNode
  /** Shown before the label — every tab in this design carries one, unlike a plain text-link
   * tab. Colour is the caller's call via `iconClassName` (e.g. reusing `StatusBadge`'s own
   * "passed" green for a "settled" tab), since this component knows nothing about what the
   * icon means. */
  icon?: ComponentType<{ className?: string }>
  iconClassName?: string
  className?: string
  /** Must match the `TabsList` it sits in. */
  variant?: TabsVariant
  /** Pill variant only: a short description shown on hover and keyboard focus —
   * transitions.dev "Tooltip open/close". Linked with `aria-describedby`, so screen readers
   * hear it too; Escape hides it without moving the pointer (WCAG 1.4.13). */
  tooltip?: string
}

function PillTrigger({
  value,
  children,
  icon: Icon,
  iconClassName,
  className,
  tooltip,
}: Omit<TabsTriggerProps, 'variant'>) {
  const trigger = (
    <UI.TabsTrigger variant="pill" value={value} className={className}>
      {Icon && <Icon aria-hidden className={cn('h-4 w-4 shrink-0', iconClassName)} />}
      {children}
    </UI.TabsTrigger>
  )
  if (!tooltip) return trigger
  // shadcn's Tooltip (Radix): it opens on hover and focus, closes on Escape, stays in the
  // window, and renders outside the tab list, which may only contain tabs.
  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  )
}

export function TabsTrigger({
  value,
  children,
  icon: Icon,
  iconClassName,
  className,
  variant = 'segmented',
  tooltip,
}: TabsTriggerProps) {
  if (variant === 'pill') {
    return (
      <PillTrigger
        value={value}
        icon={Icon}
        iconClassName={iconClassName}
        className={className}
        tooltip={tooltip}
      >
        {children}
      </PillTrigger>
    )
  }
  return (
    <UI.TabsTrigger variant={variant} value={value} className={className}>
      {Icon && <Icon aria-hidden className={cn('h-4 w-4 shrink-0', iconClassName)} />}
      {children}
    </UI.TabsTrigger>
  )
}

export interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  return (
    <UI.TabsContent value={value} className={className}>
      {children}
    </UI.TabsContent>
  )
}
