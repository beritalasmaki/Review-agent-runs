import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { OnboardingTour } from './OnboardingTour'
import type { TourStep } from './OnboardingTour'

/*
 * A tiny mock page stands in for the real one: three boxes the steps point at, laid out with
 * real spacing so the cutout and bubble have something true to measure and position against.
 */
function MockPage({ steps }: { steps: TourStep[] }) {
  const [done, setDone] = useState<string | null>(null)
  return (
    <div className="flex min-h-[32rem] w-[48rem] flex-col gap-[var(--space-6)] bg-bg p-[var(--space-6)]">
      <div
        data-tour="one"
        className="rounded-lg border border-border-subtle bg-surface p-[var(--space-5)] shadow-card"
      >
        First region
      </div>
      <div
        data-tour="two"
        className="self-end rounded-lg border border-border-subtle bg-surface p-[var(--space-5)] shadow-card"
      >
        Second region
      </div>
      <div
        data-tour="three"
        className="rounded-lg border border-border-subtle bg-surface p-[var(--space-5)] shadow-card"
      >
        Third region
      </div>
      {!done && <OnboardingTour steps={steps} onDismiss={(reason) => setDone(reason)} />}
      {done && <p className="text-body text-text-secondary">Dismissed: {done}</p>}
    </div>
  )
}

const meta = {
  title: 'Components/OnboardingTour',
  component: OnboardingTour,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof OnboardingTour>

export default meta
type Story = StoryObj<typeof meta>

const STEPS: TourStep[] = [
  {
    id: 'one',
    selector: '[data-tour="one"]',
    title: 'The first region',
    body: 'What it is for, in one or two plain sentences.',
  },
  {
    id: 'two',
    selector: '[data-tour="two"]',
    title: 'The second region',
    body: 'Another short explanation, next to what it points at.',
  },
  {
    id: 'three',
    selector: '[data-tour="three"]',
    title: 'The last region',
    body: 'The final step reads "Done" instead of "Next".',
  },
]

export const FirstStep: Story = {
  args: { steps: STEPS, onDismiss: () => {} },
  render: () => <MockPage steps={STEPS} />,
}

export const MissingTarget: Story = {
  args: { steps: STEPS, onDismiss: () => {} },
  render: () => (
    <MockPage
      steps={[
        {
          id: 'missing',
          selector: '[data-tour="does-not-exist"]',
          title: 'Skipped',
          body: 'Never shown.',
        },
        ...STEPS.slice(1),
      ]}
    />
  ),
}
