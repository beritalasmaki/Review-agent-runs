import AxeBuilder from '@axe-core/playwright'
import type { Page } from '@playwright/test'
import { expect, test } from './fixtures'

/**
 * The time-boxed accessibility check (docs/DECISIONS.md, 0059): axe's WCAG 2.2 A and AA rules,
 * colour contrast included, over the composed page in every state a reviewer reaches, in
 * light and dark. Not the full audit AGENTS.md first planned — see 0059 for what this does
 * not cover.
 */
const STATES: { name: string; url: string; open?: (page: Page) => Promise<void> }[] = [
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

/** For text over the page's decorative circles (0068), which axe cannot read through: the
 * lowest contrast of the text against every colour that can be behind it — the page and each
 * `--color-decor-*` token. A worst case, so it is stricter than the real blend. */
function contrastOverDecor(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const element = document.querySelector(sel)
    if (!element) return 0
    const hex = (value: string) => {
      const v = value.trim().replace('#', '')
      return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16))
    }
    const rgb = (value: string) => value.match(/[\d.]+/g)!.map(Number)
    const luminance = ([r, g, b]: number[]) => {
      const channel = (c: number) => {
        const v = c / 255
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
      }
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
    }
    const root = getComputedStyle(document.documentElement)
    const behind = [
      '--color-bg',
      '--color-decor-disc',
      '--color-decor-mint',
      '--color-decor-line',
    ].map((name) => luminance(hex(root.getPropertyValue(name))))
    const fg = luminance(rgb(getComputedStyle(element).color))
    return Math.min(...behind.map((bg) => (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)))
  }, selector)
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme`, () => {
    for (const state of STATES) {
      test(`${state.name}: no WCAG A/AA violations, contrast included`, async ({ page }) => {
        // Reduced motion, so nothing is mid-transition when axe reads colours.
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' })
        await page.goto(state.url)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await state.open?.(page)

        const lightness = await backgroundLightness(page)
        expect(scheme === 'light' ? lightness > 200 : lightness < 60).toBe(true)

        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([])
        // Contrast axe could not decide would slip past `violations`. One kind is measured here
        // instead: text in a floating layer — an open modal dialog, or a fixed toast — that axe
        // calls "partially obscured". Axe does not order such layers against the page, so a
        // card behind one counts as overlapping its text, though nothing does (checked with elementsFromPoint; setting
        // `inert` or moving the dialog to <body> does not change axe's answer — 0060). Any
        // other undecided result fails and should be looked at by eye.
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
        // The other kind: text straight on the page, over its decorative circles (0068), which
        // are a background gradient on <main>. Measured against the worst colour behind it.
        const overDecor = undecided.filter(
          (node) =>
            (node.any[0]?.data as { messageKey?: string } | undefined)?.messageKey ===
              'bgGradient' &&
            (node.any[0]?.relatedNodes ?? []).every((related) =>
              related.html.includes('page-decor'),
            ),
        )
        for (const node of overDecor) {
          const ratio = await contrastOverDecor(page, String(node.target[node.target.length - 1]))
          expect(
            ratio,
            `contrast over the decor of ${node.html.slice(0, 60)}`,
          ).toBeGreaterThanOrEqual(4.5)
        }
        expect(
          undecided.filter((node) => !behindModal.includes(node) && !overDecor.includes(node)),
        ).toEqual([])
      })
    }
  })
}
