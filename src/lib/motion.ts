/** Whether the visitor asked the OS for reduced motion. Shared by anything in `components/`
 * or `app/` that needs to cut an animation to instant rather than skip it outright — a
 * decorative effect (the welcome intro) can decide to skip itself; something informational
 * (the onboarding tour) should still show, just without the motion. */
export function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
