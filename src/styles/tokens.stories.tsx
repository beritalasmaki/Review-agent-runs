import type { Meta, StoryObj } from '@storybook/react-vite'

/*
 * Not a component — a live check on the tokens themselves. If a token's name changes in
 * tokens.css, this story is where that shows up, in both themes, before it reaches a real
 * screen. See src/styles/README.md, including the "Contrast" section this story's status
 * and accent examples are built to match: the colour is the icon and the swatch border, the
 * label stays in text-primary.
 */

const statusTokens = [
  { name: 'pass', label: 'Passed' },
  { name: 'fail', label: 'Failed' },
  { name: 'waived', label: 'Exception' },
  { name: 'not-applicable', label: 'Not applicable' },
  { name: 'unknown', label: 'Not run' },
] as const

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: 'var(--font-heading)',
        fontWeight: 600,
        fontSize: '1rem',
        marginBottom: '0.75rem',
        color: 'var(--color-text-primary)',
      }}
    >
      {children}
    </h2>
  )
}

function Swatch({
  label,
  sub,
  style,
}: {
  label: string
  sub?: string
  style: React.CSSProperties
}) {
  return (
    <div
      style={{
        ...style,
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-md)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.8125rem',
        minWidth: '11rem',
      }}
    >
      <div style={{ fontWeight: 500 }}>{label}</div>
      {sub && (
        <div style={{ fontSize: '0.75rem', opacity: 0.75, marginTop: '0.125rem' }}>{sub}</div>
      )}
    </div>
  )
}

/* Status swatch: the colour is the icon and the border, per the usage rule — never the label
 * text itself, which stays --color-text-primary. */
function StatusSwatch({ name, label }: { name: string; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.875rem',
        borderRadius: '999px',
        border: `1.5px solid var(--color-status-${name})`,
        fontFamily: 'var(--font-body)',
        fontSize: '0.8125rem',
        color: 'var(--color-text-primary)',
        background: 'var(--color-surface-raised)',
      }}
    >
      <span
        aria-hidden
        style={{
          display: 'inline-block',
          width: '0.5rem',
          height: '0.5rem',
          borderRadius: '999px',
          background: `var(--color-status-${name})`,
        }}
      />
      {label}
      <code style={{ opacity: 0.6, fontSize: '0.6875rem' }}>--color-status-{name}</code>
    </div>
  )
}

/* Accent as the usage rules require: an outline pill, a different shape from a status chip,
 * and never carrying a check/cross icon. */
function AccentPill({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'inline-block',
        padding: '0.5rem 1rem',
        borderRadius: '999px',
        border: '1.5px solid var(--color-accent)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.8125rem',
        color: 'var(--color-text-primary)',
      }}
    >
      {label}
    </div>
  )
}

const spacingSteps = [1, 2, 3, 4, 6, 8, 12, 16] as const

function TokensShowcase() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        padding: '1.5rem',
        background: 'var(--color-bg)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <section>
        <SectionTitle>Surfaces &amp; text</SectionTitle>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Swatch
            label="bg"
            sub="page background"
            style={{
              background: 'var(--color-bg)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          />
          <Swatch
            label="surface"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          />
          <Swatch
            label="surface-raised"
            style={{
              background: 'var(--color-surface-raised)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          />
          <Swatch
            label="text-secondary"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border-subtle)',
            }}
          />
          <Swatch
            label="text-disabled"
            sub="fails 4.5:1 — WCAG exempts inactive text"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-disabled)',
              border: '1px solid var(--color-border-subtle)',
            }}
          />
          <Swatch
            label="border / border-subtle"
            sub="low contrast against every surface — see README"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              border: '2px solid var(--color-border)',
            }}
          />
        </div>
      </section>

      <section>
        <SectionTitle>Brand — never on Approve / Request changes / Reject</SectionTitle>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Swatch
            label="primary"
            sub="white text in light, near-black in dark — see README"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          />
          <Swatch
            label="primary-hover"
            style={{
              background: 'var(--color-primary-hover)',
              color: 'var(--color-primary-foreground)',
            }}
          />
          <AccentPill label="accent — outline pill, not a filled chip" />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
            --color-accent-hover: <code style={{ color: 'var(--color-accent-hover)' }}>●</code>
          </span>
        </div>
      </section>

      <section>
        <SectionTitle>
          Status — a separate palette, icon + border only, never the label text
        </SectionTitle>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {statusTokens.map(({ name, label }) => (
            <StatusSwatch key={name} name={name} label={label} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Type</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.5rem' }}>
            Chakra Petch 700 — heading
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '1.125rem' }}>
            Chakra Petch 600 — heading / button label
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: '1rem' }}>
            Chakra Petch 500 — heading / wordmark
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '0.9375rem' }}>
            Hanken Grotesk 400 — body text. "Two files changed, 14 tests added, all passing."
          </div>
          <div style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '0.8125rem' }}>
            Hanken Grotesk 500 — table / data text. Evaluated by policy-engine v2.3.
          </div>
        </div>
      </section>

      <section>
        <SectionTitle>Spacing</SectionTitle>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-secondary)',
            marginBottom: '0.5rem',
          }}
        >
          Tailwind's default scale — steps of 0.25rem. Not a bespoke token set: documented here
          because a new screen should never need one.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {spacingSteps.map((step) => (
            <div
              key={step}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <div
                style={{
                  width: '1.25rem',
                  height: `${step * 0.25}rem`,
                  background: 'var(--color-primary)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
              <code style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>
                {step}
              </code>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Usage rules</SectionTitle>
        <ul
          style={{
            fontSize: '0.8125rem',
            color: 'var(--color-text-secondary)',
            lineHeight: 1.6,
            paddingLeft: '1.25rem',
            margin: 0,
          }}
        >
          <li>Primary and accent never appear on Approve, Request changes or Reject.</li>
          <li>
            Accent never resembles a status badge: no check/cross icon, and an outline pill rather
            than a filled chip.
          </li>
          <li>Status is a separate palette from brand and is never reused for non-status UI.</li>
          <li>
            Status and accent colours are icon/border colour only — the label stays text-primary or
            text-secondary. Full contrast numbers: src/styles/README.md.
          </li>
        </ul>
      </section>
    </div>
  )
}

const meta = {
  title: 'Design system/Tokens',
  component: TokensShowcase,
  parameters: {
    // The point of this story is comparing both themes; a fixed background
    // would defeat that, so the usual layout padding is skipped.
    layout: 'fullscreen',
  },
} satisfies Meta<typeof TokensShowcase>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {
  globals: { theme: 'light' },
}

export const Dark: Story = {
  globals: { theme: 'dark' },
}
