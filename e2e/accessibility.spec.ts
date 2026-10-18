import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

/**
 * The time-boxed accessibility check (docs/DECISIONS.md, 0059): axe's WCAG 2.2 A and AA rules,
 * colour contrast included, over the composed page in every state a reviewer reaches, in
 * light and dark. Not the full audit AGENTS.md first planned — see 0059 for what this does
 * not cover.
 */
const STATES: {
  name: string
  url: string
  open?: (page: Page) => Promise<void>
  /** This one state exercises the onboarding tour itself, so it needs the opposite of every
   * other state here: the tour's once-per-visit bypass (e2e/fixtures.ts) cleared, not kept. */
  skipTourBypass?: boolean
  /** The welcome modal and the tour both open on their own, the instant the page loads — not
   * from a mid-test click like every other dialog here — so the page's own `<h1>` is already
   * `aria-hidden` behind the open overlay (correctly: Radix hides the rest of the page from
   * assistive tech while a true modal sits over it) by the time the shared first check would
   * run. Skips that one check for states where this is expected, not a real regression. */
  skipInitialHeading?: boolean
}[] = [
  { name: 'pending run, Story', url: '/?run=run-messy-pending' },
  {
    name: 'pending run, Evidence',
    url: '/?run=run-messy-pending',
    open: (page) => page.getByRole('tab', { name: 'Evidence' }).click(),
  },
  {
    name: 'pending run, All steps',
    url: '/?run=run-messy-pending',
    open: (page) => page.getByRole('tab', { name: /^All \d+ steps$/ }).click(),
  },
  { name: 'clean run', url: '/?run=run-clean' },
  { name: 'blocked run', url: '/?run=run-blocked' },
  { name: 'decided run, undo window open', url: '/?run=run-messy' },
  { name: 'My reviews', url: '/' },
  {
    name: 'My reviews, welcome modal open',
    url: '/',
    skipTourBypass: true,
    skipInitialHeading: true,
    open: async (page) => {
      await expect(
        page.getByRole('heading', { name: 'Welcome to Review agent runs' }),
      ).toBeVisible()
    },
  },
  {
    name: 'My reviews, onboarding tour open',
    url: '/',
    skipTourBypass: true,
    skipInitialHeading: true,
    open: async (page) => {
      await page.getByRole('button', { name: 'Take the tour' }).click()
      await expect(page.getByText('Step 1 of 5')).toBeVisible()
    },
  },
  {
    name: 'My reviews, approved tab with filters open and a run selected',
    url: '/',
    open: async (page) => {
      await page.getByRole('tab', { name: /Approved/ }).click()
      await page.getByRole('button', { name: /^Filters/ }).click()
      await page
        .getByRole('checkbox', { name: /^Select/ })
        .first()
        .check()
    },
  },
  {
    name: 'My reviews, requested for change, runs in progress open',
    url: '/',
    open: async (page) => {
      await page.getByRole('tab', { name: /Requested for change/ }).click()
      await page.getByRole('button', { name: /still in progress/ }).click()
    },
  },
  {
    name: 'My reviews, asking before archiving',
    url: '/',
    open: async (page) => {
      await page.getByRole('tab', { name: /Approved/ }).click()
      await page
        .getByRole('button', { name: /^Archive “/ })
        .first()
        .click()
      await expect(page.getByRole('dialog')).toBeVisible()
    },
  },
  {
    name: 'My reviews, decision details',
    url: '/',
    open: async (page) => {
      await page.getByRole('tab', { name: /Approved/ }).click()
      await page
        .getByRole('button', { name: /^Decision details/ })
        .first()
        .click()
      await expect(page.getByRole('dialog')).toBeVisible()
    },
  },
  {
    name: 'My reviews, request a new run',
    url: '/',
    open: async (page) => {
      await page.getByRole('tab', { name: /Approved/ }).click()
      await page
        .getByRole('button', { name: /^Request a new run/ })
        .first()
        .click()
      await expect(page.getByRole('dialog')).toBeVisible()
    },
  },
  {
    name: 'My reviews, create a report',
    url: '/',
    open: async (page) => {
      await page.getByRole('tab', { name: /Approved/ }).click()
      await page
        .getByRole('checkbox', { name: /^Select/ })
        .first()
        .check()
      await page.getByRole('button', { name: 'Create report' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
    },
  },
  {
    name: 'My reviews, archive with a run in it, and the toast',
    url: '/',
    open: async (page) => {
      await page.getByRole('tab', { name: /Approved/ }).click()
      await page
        .getByRole('button', { name: /^Archive “/ })
        .first()
        .click()
      await page.getByRole('button', { name: 'Move to the archive' }).click()
      await page.getByRole('button', { name: /^Archive, / }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Archive' })).toBeVisible()
    },
  },
  {
    name: 'decision dialog',
    url: '/?run=run-clean',
    open: async (page) => {
      await page.getByRole('button', { name: 'Request changes' }).click()
      await expect(page.getByRole('dialog')).toBeVisible()
    },
  },
]

/** The page background's lightness, 0–255: proves the theme really switched. */
function backgroundLightness(page: Page) {
  return page.evaluate(() => {
    const [r, g, b] = getComputedStyle(document.body).backgroundColor.match(/\d+/g)!.map(Number)
    return (r + g + b) / 3
  })
}

/** The contrast of an element's text against the nearest background actually painted
 * behind it, for text in a floating layer only: an open modal dialog or a fixed element. */
function ownContrast(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel)
    // Only for text in a layer that floats above the page: an open modal dialog, or a
    // fixed-position element such as the toast. Anything else stays undecided and fails.
    const floating = (el: Element | null): boolean =>
      !!el && (getComputedStyle(el).position === 'fixed' || floating(el.parentElement))
    if (!element || !(element.closest('dialog[open]') || floating(element))) return 0
    const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number)
    const luminance = ([r, g, b]: number[]) => {
      const channel = (c: number) => {
        const v = c / 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
    }
    let background: Element | null = element
    while (background) {
      const [, , , alpha = 1] = rgb(getComputedStyle(background).backgroundColor)
      if (alpha > 0) break
      background = background.parentElement
    }
    if (!background) return 0
    const fg = luminance(rgb(getComputedStyle(element).color))
    const bg = luminance(rgb(getComputedStyle(background).backgroundColor))
    return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)
  }, selector)
}

/**
 * The real, rendered contrast behind text whose background axe could not statically resolve —
 * a CSS gradient or backdrop-filter in the ancestor chain (the frosted-glass pilot's cards,
 * docs/DECISIONS.md 0089). Axe is right to refuse a guess here: the composited background
 * genuinely varies pixel to pixel, which is the whole point of the effect. This measures the
 * actual painted pixels instead — the same technique used to tune the glass tokens in the
 * first place (not a waiver: every one of these still has to clear the ratio axe itself says
 * it expects). It samples a grid across the element's own box and takes the most common
 * (quantised) colour as the background — text glyphs cover a minority of the box's pixels for
 * any of this app's normal-weight labels and headings, so the mode is reliably the background,
 * unlike an edge-only probe (which this replaced after it kept landing on ascenders/descenders
 * at tight line-heights and reporting a false low ratio).
 *
 * Returns `'obscured'`, not a ratio, for an element an open dialog, the welcome modal or the
 * onboarding tour's scrim currently paints over (checked with `elementFromPoint`, the same
 * technique the `behindModal` case above uses in spirit): a screenshot taken in that state
 * would measure the *scrim's* dimmed colour, not the card's, under-reporting a page that reads
 * fine once the overlay closes. The caller treats that the same as `behindModal` — no overlay
 * means a real measurement always runs.
 */
async function measuredBackgroundContrast(page: Page, selector: string) {
  const info = await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const cx = rect.x + rect.width / 2
    const cy = rect.y + rect.height / 2
    const topMost = document.elementFromPoint(cx, cy)
    const obscured = !!topMost && topMost !== el && !el.contains(topMost) && !topMost.contains(el)
    return {
      rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      color: getComputedStyle(el).color,
      obscured,
    }
  }, selector)
  if (!info) return null
  if (info.obscured) return 'obscured' as const
  if (info.rect.width <= 0 || info.rect.height <= 0) return null

  const shot = await page.screenshot()
  const dataUrl = `data:image/png;base64,${shot.toString('base64')}`

  return page.evaluate(
    async ({ dataUrl, rect, color }) => {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('image load failed'))
        img.src = dataUrl
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)

      const rgb = (s: string) => s.match(/[\d.]+/g)!.map(Number)
      const luminance = ([r, g, b]: number[]) => {
        const channel = (c: number) => {
          const v = c / 255
          return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
        }
        return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
      }
      const contrast = (a: number[], b: number[]) => {
        const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x)
        return (l1 + 0.05) / (l2 + 0.05)
      }

      const textRgb = rgb(color)
      const xStep = Math.max(1, Math.floor(rect.width / 20))
      const yStep = Math.max(1, Math.floor(rect.height / 10))
      const buckets = new Map<string, { count: number; rgb: [number, number, number] }>()
      for (let x = rect.x; x < rect.x + rect.width; x += xStep) {
        for (let y = rect.y; y < rect.y + rect.height; y += yStep) {
          const xi = Math.round(x)
          const yi = Math.round(y)
          if (xi < 0 || yi < 0 || xi >= canvas.width || yi >= canvas.height) continue
          const [r, g, b] = ctx.getImageData(xi, yi, 1, 1).data
          // Quantise to absorb anti-aliasing noise at glyph edges; the most frequent bucket is
          // the background, since text ink covers a minority of the box for ordinary labels.
          const key = `${Math.round(r / 16)}_${Math.round(g / 16)}_${Math.round(b / 16)}`
          const entry = buckets.get(key) ?? { count: 0, rgb: [r, g, b] }
          entry.count += 1
          buckets.set(key, entry)
        }
      }
      let mode: { count: number; rgb: [number, number, number] } | null = null
      for (const entry of buckets.values()) {
        if (!mode || entry.count > mode.count) mode = entry
      }
      return mode ? contrast(textRgb, mode.rgb) : null
    },
    { dataUrl, rect: info.rect, color: info.color },
  )
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    for (const state of STATES) {
      test(`${state.name}: no WCAG A/AA violations, contrast included`, async ({ page }) => {
        // Reduced motion, so nothing is mid-transition when axe reads colours.
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        if (state.skipTourBypass) {
          await page.addInitScript(() => sessionStorage.removeItem('ledger:tour-seen'))
        }
        await page.goto(state.url)
        if (!state.skipInitialHeading) {
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        }
        await state.open?.(page)

        const lightness = await backgroundLightness(page)
        expect(scheme === 'light' ? lightness > 200 : lightness < 60).toBe(true)

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
        // Contrast axe could not decide would slip past `violations`. Two kinds are measured
        // here instead, neither a waiver: text in a floating layer — an open modal dialog, or a
        // fixed toast — that axe calls "partially obscured". Axe does not order such layers
        // against the page, so a card behind one counts as overlapping its text, though nothing
        // does (checked with elementsFromPoint; setting `inert` or moving the dialog to <body>
        // does not change axe's answer — 0060). And text whose background axe can't statically
        // resolve at all — a CSS gradient or backdrop-filter in the ancestor chain (the frosted-
        // glass pilot's cards, 0089), or a pseudo-element painted directly over the text's own
        // box (`glass-sheen`'s `::before`, 0098 — axe calls this one "pseudoContent", since it
        // can't tell what's behind its own element rather than an ancestor) — measured against
        // the real rendered pixels instead (measuredBackgroundContrast), still against axe's own
        // expected ratio. Any other undecided result fails and should be looked at by eye.
        const undecided = results.incomplete
          .filter((r) => r.id === 'color-contrast')
          .flatMap((r) => r.nodes)
        const behindModal = undecided.filter(
          (node) =>
            (node.any[0]?.data as { messageKey?: string } | undefined)?.messageKey ===
            'elmPartiallyObscuring',
        )
        for (const node of behindModal) {
          const ratio = await ownContrast(page, String(node.target[node.target.length - 1]))
          expect(ratio, `contrast of ${node.html.slice(0, 60)}`).toBeGreaterThanOrEqual(4.5)
        }
        const glassObscured = undecided.filter((node) => {
          const messageKey = (node.any[0]?.data as { messageKey?: string } | undefined)?.messageKey
          return (
            messageKey === 'bgGradient' ||
            messageKey === 'bgImage' ||
            messageKey === 'pseudoContent'
          )
        })
        for (const node of glassObscured) {
          const data = node.any[0]?.data as { expectedContrastRatio?: string } | undefined
          const expected = parseFloat(data?.expectedContrastRatio ?? '4.5')
          const selector = String(node.target[node.target.length - 1])
          const ratio = await measuredBackgroundContrast(page, selector)
          // Same carve-out as `behindModal` above, reached by a different axe messageKey: a
          // dialog, the welcome modal or the tour's scrim sits over this element right now, so
          // there is nothing real to measure (see measuredBackgroundContrast's own comment).
          if (ratio === 'obscured') continue
          expect(ratio, `measured contrast of ${node.html.slice(0, 60)}`).not.toBeNull()
          expect(ratio!, `measured contrast of ${node.html.slice(0, 60)}`).toBeGreaterThanOrEqual(
            expected,
          )
        }
        const resolved = [...behindModal, ...glassObscured]
        expect(undecided.filter((node) => !resolved.includes(node))).toEqual([])
      })
    }
  })
}
