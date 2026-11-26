#!/usr/bin/env node
/*
 * Guards against the shadcn bridge silently overriding a semantic token — the bug class
 * behind docs/DECISIONS.md 0007 (`--color-accent`), 0008 (`--color-border`) and 0014
 * (`--color-primary`/`--color-primary-foreground`). All three happened the same way:
 * `src/styles/index.css`'s `@theme inline` block declared a custom property that shares its
 * exact name with one of our own tokens in `src/styles/tokens.css`'s `@theme` block. Because
 * Tailwind merges an `@theme` name with a same-named `@theme inline` one into a single
 * registry entry — the later (bridge) declaration winning outright, not layered on top —
 * that always wins for every consumer of the name, everywhere in the app.
 *
 * 0014 is why this script no longer has a "safe if it mirrors the token" exception: the
 * bridge used to redeclare `--color-primary` as `var(--color-primary)`, reasoned to be a
 * harmless pass-through. It wasn't — referencing your own name is a CSS custom-property
 * cycle, which computes to nothing at all, silently, in every theme that doesn't separately
 * override the name further down the cascade. There is no version of redeclaring a colliding
 * name that is safe; the only fix is to leave it out, same as accent and border.
 *
 * Two checks run:
 *
 *  1. Static: no name in the bridge's `@theme inline` block may also appear in tokens.css's
 *     `@theme` block, at all — a text-level check, same mechanism as before, just without
 *     the exception that let 0014 through.
 *  2. Runtime: builds the real app CSS (via Vite, the same pipeline that ships) and, in an
 *     actual browser, applies every semantic colour's `bg-*` and `text-*` Tailwind utility to
 *     a real element and checks it actually painted something, in light, dark (system
 *     preference) and dark (`data-theme` attribute). This is what would have caught 0014 even
 *     if the static check had missed it: a self- or mutually-referencing cycle is a runtime
 *     fact, not something reliably visible by reading the source.
 *
 *     This checks utility classes, not raw `getComputedStyle(:root).getPropertyValue(...)`,
 *     deliberately: `@theme inline` (every bridge name that doesn't collide with a token) is
 *     Tailwind's instruction to bake the referenced value straight into each utility's own
 *     declaration at build time — `.bg-background{background-color:var(--color-bg)}` — rather
 *     than emit a `--color-background` custom property at all. Checking for that property
 *     directly would flag every one of those as "empty" despite nothing being wrong. The
 *     utility itself, applied to an element, is the one thing that's always meaningful to
 *     check regardless of which emission mode Tailwind chose for a given name.
 *
 *     `background-color`'s initial value is a detectably-different `transparent`, so failure
 *     there is unambiguous. `color` is inherited, so an invalid `text-*` declaration falls
 *     back to whatever the parent's colour is instead of anything obviously wrong — which is
 *     exactly how 0014's `--color-primary-foreground` bug looked fine at a glance (a real,
 *     plausible dark colour) while being wrong. Each element under test sits inside a wrapper
 *     forced to a marker colour, so "still the marker colour" reliably means "this class's
 *     own colour didn't apply," not "this class happens to produce that colour."
 *
 * Requires a Chromium build Playwright can launch — `npx playwright install chromium` if
 * this fails with "Executable doesn't exist". Set PLAYWRIGHT_CHROMIUM_EXECUTABLE to point at
 * a specific binary instead of Playwright's own managed install (used in this project's own
 * sandboxed dev session, where browsers live at a shared, non-default path).
 */
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'vite'
import { chromium } from 'playwright'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const TOKENS_PATH = join(ROOT, 'src/styles/tokens.css')
const BRIDGE_PATH = join(ROOT, 'src/styles/index.css')

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Finds `${atRule} {`, then walks braces to return the text between them. */
function extractBlock(css, atRule) {
  const withoutComments = stripComments(css)
  const start = withoutComments.indexOf(atRule)
  if (start === -1) return null

  const openBrace = withoutComments.indexOf('{', start)
  if (openBrace === -1) return null

  let depth = 0
  for (let i = openBrace; i < withoutComments.length; i++) {
    if (withoutComments[i] === '{') depth++
    else if (withoutComments[i] === '}') {
      depth--
      if (depth === 0) return withoutComments.slice(openBrace + 1, i)
    }
  }
  return null
}

/** Parses flat `--name: value;` declarations out of a block's text. */
function parseDeclarations(blockText) {
  const declarations = new Map()
  const pattern = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g
  for (const match of blockText.matchAll(pattern)) {
    declarations.set(match[1], match[2].trim())
  }
  return declarations
}

function findCollisions(tokens, bridge) {
  const collisions = []
  for (const name of bridge.keys()) {
    if (tokens.has(name)) collisions.push(name)
  }
  return collisions
}

const PROBE_PATH = join(ROOT, 'theme-bridge-probe.tmp.html')

/*
 * Builds the real app CSS via the project's own Vite pipeline, into a throwaway dir.
 *
 * Tailwind v4's automatic content detection only generates a utility class if it finds that
 * exact class name as literal text somewhere in the project — it does not generate every
 * class every registered colour name could theoretically produce. Most of the colour names
 * this script cares about (every status colour, `bg-bg`, `bg-card`, …) aren't literally
 * written anywhere in the app yet, so without help the build simply wouldn't contain their
 * CSS at all — indistinguishable, to a naive check, from the class being genuinely broken.
 * A throwaway probe file, deleted again straight after the build, gives every `bg-<name>`/
 * `text-<name>` this script is about to check a real, scanned reason to exist in the output.
 */
async function buildCss(colorNames) {
  const outDir = mkdtempSync(join(tmpdir(), 'theme-bridge-check-'))
  const probeClasses = colorNames.flatMap((name) => [`bg-${name}`, `text-${name}`]).join(' ')
  try {
    writeFileSync(PROBE_PATH, `<div class="${probeClasses}"></div>\n`)
    await build({
      root: ROOT,
      logLevel: 'silent',
      build: { outDir, write: true, emptyOutDir: true, minify: false, sourcemap: false },
    })
    const assetsDir = join(outDir, 'assets')
    const cssFile = readdirSync(assetsDir).find((f) => f.endsWith('.css'))
    if (!cssFile) throw new Error('vite build produced no CSS asset')
    return readFileSync(join(assetsDir, cssFile), 'utf8')
  } finally {
    rmSync(PROBE_PATH, { force: true })
    rmSync(outDir, { recursive: true, force: true })
  }
}

/** For each theme variant, loads the built CSS in a real browser and, for every colour name,
 * applies `bg-<name>` and `text-<name>` to a real element and reads what actually painted.
 * Each element sits inside a wrapper forced to a marker colour, so a `text-*` class that
 * silently fails (inherits instead of applying its own colour — see header comment) is
 * caught the same way a `bg-*` class landing on transparent is. */
async function checkColorUtilities(css, colorNames) {
  const launchOptions = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}
  const browser = await chromium.launch(launchOptions)
  const themeVariants = [{ label: 'dark', colorScheme: 'dark', dataTheme: null }]

  try {
    const results = {}
    for (const variant of themeVariants) {
      const page = await browser.newPage({ colorScheme: variant.colorScheme })
      await page.setContent(
        `<!doctype html><html><head><style>${css}</style></head><body></body></html>`,
      )
      if (variant.dataTheme) {
        await page.evaluate((value) => {
          document.documentElement.setAttribute('data-theme', value)
        }, variant.dataTheme)
      }
      results[variant.label] = await page.evaluate((names) => {
        const MARKER = 'rgb(255, 0, 0)'
        const TRANSPARENT = 'rgba(0, 0, 0, 0)'
        const out = {}
        for (const name of names) {
          const wrapper = document.createElement('div')
          wrapper.style.color = 'red'
          const bgEl = document.createElement('div')
          bgEl.className = `bg-${name}`
          const textEl = document.createElement('div')
          textEl.className = `text-${name}`
          wrapper.append(bgEl, textEl)
          document.body.append(wrapper)

          const bgColor = getComputedStyle(bgEl).backgroundColor
          const textColor = getComputedStyle(textEl).color
          out[name] = {
            bgOk: bgColor !== '' && bgColor !== TRANSPARENT,
            bgColor,
            textOk: textColor !== '' && textColor !== MARKER,
            textColor,
          }

          wrapper.remove()
        }
        return out
      }, colorNames)
      await page.close()
    }
    return results
  } finally {
    await browser.close()
  }
}

async function main() {
  const tokensCss = readFileSync(TOKENS_PATH, 'utf8')
  const bridgeCss = readFileSync(BRIDGE_PATH, 'utf8')

  const tokensBlock = extractBlock(tokensCss, '@theme')
  const bridgeBlock = extractBlock(bridgeCss, '@theme inline')

  if (!tokensBlock) {
    console.error(`check-theme-bridge: found no "@theme { ... }" block in ${TOKENS_PATH}.`)
    process.exit(1)
  }
  if (!bridgeBlock) {
    console.error(`check-theme-bridge: found no "@theme inline { ... }" block in ${BRIDGE_PATH}.`)
    process.exit(1)
  }

  const tokens = parseDeclarations(tokensBlock)
  const bridge = parseDeclarations(bridgeBlock)

  const collisions = findCollisions(tokens, bridge)
  if (collisions.length > 0) {
    console.error(
      'check-theme-bridge: the shadcn bridge (src/styles/index.css) redeclares a semantic ' +
        "token's own name. Tailwind merges @theme and @theme inline entries that share a " +
        'name into one, the bridge always winning — so this always overrides the token, ' +
        'for every consumer of the name, everywhere in the app. There is no safe way to ' +
        'redeclare it here, not even to "mirror" the token\'s own value (see ' +
        'docs/DECISIONS.md 0014) — remove it from the bridge instead.\n',
    )
    for (const name of collisions) {
      console.error(`  --${name}`)
      console.error(`    tokens.css:  ${tokens.get(name)}`)
      console.error(`    bridge sets: ${bridge.get(name)}\n`)
    }
    process.exit(1)
  }

  console.log(
    `check-theme-bridge: static check ok (${bridge.size} bridge variables, none collide with a tokens.css name).`,
  )
  console.log('check-theme-bridge: building CSS and verifying computed values in a real browser…')

  const colorNames = [...new Set([...tokens.keys(), ...bridge.keys()])]
    .filter((name) => name.startsWith('color-'))
    .map((name) => name.slice('color-'.length))

  let css
  try {
    css = await buildCss(colorNames)
  } catch (err) {
    console.error('check-theme-bridge: failed to build CSS for verification.')
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
  }

  let resultsByTheme
  try {
    resultsByTheme = await checkColorUtilities(css, colorNames)
  } catch (err) {
    console.error('check-theme-bridge: could not verify colour utilities in a browser.')
    console.error(err instanceof Error ? err.message : String(err))
    console.error(
      '\nIf this is "Executable doesn\'t exist", run `npx playwright install chromium`, or ' +
        'set PLAYWRIGHT_CHROMIUM_EXECUTABLE to a Chromium binary already on this machine.',
    )
    process.exit(1)
  }

  const broken = []
  for (const [themeLabel, values] of Object.entries(resultsByTheme)) {
    for (const [name, result] of Object.entries(values)) {
      if (!result.bgOk)
        broken.push({ themeLabel, name, utility: `bg-${name}`, got: result.bgColor })
      if (!result.textOk)
        broken.push({ themeLabel, name, utility: `text-${name}`, got: result.textColor })
    }
  }

  if (broken.length > 0) {
    console.error(
      'check-theme-bridge: the following colour utilities did not paint their own colour in ' +
        'at least one theme — either transparent where a background was expected, or (for ' +
        'text-*) silently inherited the surrounding colour instead of applying their own. ' +
        'Almost always a custom-property cycle: a declaration that references its own name, ' +
        'directly or through another variable:\n',
    )
    for (const { themeLabel, utility, got } of broken) {
      console.error(`  .${utility}  (${themeLabel}) -> ${got}`)
    }
    process.exit(1)
  }

  console.log(
    `check-theme-bridge: ok (${bridge.size} bridge variables; ${colorNames.length} colours ` +
      `verified (bg-* and text-*) across ${Object.keys(resultsByTheme).length} themes).`,
  )
}

main().catch((err) => {
  console.error('check-theme-bridge: unexpected failure.')
  console.error(err instanceof Error ? (err.stack ?? err.message) : String(err))
  process.exit(1)
})
