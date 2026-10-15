import type { Ref } from 'react'
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
 * Must render inside the page's `Tabs` root.
 */
export interface RunViewTabsProps {
  run: Run
  ref?: Ref<HTMLDivElement>
}

export function RunViewTabs({ run, ref }: RunViewTabsProps) {
  return (
    <div
      ref={ref}
      className="sticky top-[var(--run-bar-height,3rem)] z-10 rounded-t-lg bg-surface px-[var(--space-5)] py-[var(--space-3)]"
    >
      <TabsList variant="pill" label="Views of this run">
        <TabsTrigger
          variant="pill"
          value="story"
          tooltip="What the agent did, in order, in plain sentences"
        >
          Story
        </TabsTrigger>
        <TabsTrigger
          variant="pill"
          value="evidence"
          tooltip="Every file, test and check the page's claims are based on"
        >
          Evidence
        </TabsTrigger>
        <TabsTrigger
          variant="pill"
          value="steps"
          tooltip="The full record, one row for each step the agent took"
        >
          All {formatCount(run.timeline.length, 'step')}
        </TabsTrigger>
      </TabsList>
    </div>
  )
}
