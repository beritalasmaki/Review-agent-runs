/**
 * The app's own top bar (docs/DECISIONS.md, 0124): a logo, nothing else, fixed above every page
 * this app has. Reverses 0042's "no wordmark, the page lives inside a host platform" on purpose,
 * confirmed with the user before building this — see 0124 for that conversation.
 *
 * Glass, like every other bar in the app (`RunTopBar`, the filters popover): `bg-glass` +
 * `backdrop-blur-[var(--blur-glass)]` + `border-glass-border`. `position: fixed`, not `sticky`,
 * for the same reason `RunTopBar` already is (0119): `sticky` plus `backdrop-filter` broke the
 * accessibility suite's colour-contrast check on unrelated text elsewhere on the page; `fixed`
 * never has.
 *
 * The logo itself is not a rendered image sitting on the bar — it's a hole cut through the bar's
 * own fill, the exact shape of the wordmark, open straight through to the page's own photo
 * background behind it (`topnav-logo-cutout`, `src/styles/index.css`). A soft white glow sits
 * behind that hole (`topnav-logo-glow`), visible only through it, so the wordmark reads clearly
 * against whatever the photo happens to be doing at that spot rather than fighting it.
 *
 * `aria-label` on the `<header>` carries the accessible name a sighted visitor gets from the cut
 * logo shape itself — there is no text node for it, the cutout is purely visual.
 */
export function TopNav() {
  return (
    <header
      className="topnav fixed inset-x-0 top-0 z-30 h-[var(--top-nav-height)]"
      aria-label="Review agent runs"
    >
      <div aria-hidden className="topnav-logo-glow" />
      <div
        aria-hidden
        className="topnav-logo-cutout absolute inset-0 border-b border-glass-border bg-glass backdrop-blur-[var(--blur-glass)]"
      />
    </header>
  )
}
