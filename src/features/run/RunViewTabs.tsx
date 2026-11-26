import type { Ref } from 'react'
import { Clock, FileText, List } from 'lucide-react'
import { TabsList, TabsTrigger } from '../../components/Tabs'
import { formatCount } from '../../lib/format'
import type { Run } from '../../lib/types'

/**
 * The three views of the run — Story, Evidence, All steps — directly above the one view they
 * switch, since that area is the only part of the page they change (docs/DECISIONS.md, 0052).
 * Sticky just under the page's top bar, so the views can still be switched from anywhere in a
 * long run (0044). `ref` lets the page measure its height, so a view's heading scrolled to
 * lands below it.
 *
 * Each tab carries the icon its own view's heading used to show (0104): one clear place for it,
 * not the same icon twice on screen at once.
 *
 * `px-[var(--space-3)] py-[var(--space-2)]` (0133, down from `px-5 py-3`): "move the tabs closer
 * to the borders of the background panel area" — this strip's own padding is the only gap on its
 * top and right sides (`RunReviewPage`'s wrapper card has none of its own there, on purpose, so
 * this strip's `rounded-t-lg` sits flush against the card's corner), so tightening it here is what
 * actually brings the tabs closer to the card's true edges.
 *
 * Must render inside the page's `Tabs` root.
 */
export interface RunViewTabsProps {
  run: Run
  /** The view now open, named at the left of the bar (decoration: the view has its own heading). */
  view: 'story' | 'evidence' | 'steps'
  ref?: Ref<HTMLDivElement>
}

const VIEW_NAME = { story: 'Story', evidence: 'Evidence', steps: 'All steps' } as const

export function RunViewTabs({ run, view, ref }: RunViewTabsProps) {
  return (
    <div
      ref={ref}
      data-tour="run-tabs-view"
      className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-[var(--space-5)] gap-y-[var(--space-2)] rounded-t-[inherit] border-b border-border-subtle bg-surface px-[var(--space-5)] py-[var(--space-3)]"
    >
      <span
        aria-hidden
        className="text-section-heading leading-tight font-semibold font-heading text-text-primary"
      >
        {VIEW_NAME[view]}
      </span>
      <TabsList variant="pill" label="Views of this run">
        <TabsTrigger
          variant="pill"
          value="story"
          icon={Clock}
          tooltip="What the agent did, in order, in plain sentences"
        >
          Story
        </TabsTrigger>
        <TabsTrigger
          variant="pill"
          value="evidence"
          icon={FileText}
          tooltip="Every file, test and check the page's claims are based on"
        >
          Evidence
        </TabsTrigger>
        <TabsTrigger
          variant="pill"
          value="steps"
          icon={List}
          tooltip="The full record, one row for each step the agent took"
        >
          All {formatCount(run.timeline.length, 'step')}
        </TabsTrigger>
      </TabsList>
    </div>
  )
}
