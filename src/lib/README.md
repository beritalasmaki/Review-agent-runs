# lib

Code with no user interface: types, formatting, data access, small helpers.

**Why this folder exists.** Some things are needed by several parts of the app and belong to
none of them. If a date formatter lives inside a component, the next component writes its
own version, and two screens start showing time differently. Putting these in one place
means one definition, one test, one thing to change.

**Dependencies run one way.** Nothing here imports from `components/`, `features/` or
`app/`; they import from here. `lib` knows nothing about the interface, while the interface
uses `lib` freely.

Keeping that direction is what stops the codebase from tangling as it grows. Once two
folders import from each other, moving or deleting anything means tracing the whole loop
first, and a change in a component can break something that has no visible connection to it.
With one direction, the rule is simple: you can always read the code from the bottom up,
and `lib` can be tested on its own with no UI at all.

## Files

- **`types.ts`** — the shape of the data: `Run`, `PolicyGate`, `TimelineEvent`,
  `ConfidenceArea`, `Decision`. Everything else in the app refers to these types, so a change
  here shows up as a compiler error everywhere it matters. That is the point.
- **`format.ts`** — how values are turned into text: timestamps, durations, confidence
  values, relative times ("4 minutes ago"). Rules like "confidence is shown as a whole
  percentage, and an unknown value is shown as the word unknown" live here, not in a
  component.
- **`api.ts`** — the only place that fetches data. See below.
- **`gates.ts`** — small domain helpers that are not UI: resolving a gate's evidence, and the
  one sentence that explains a failed or
  not-run gate (its own evaluation's detail first — docs/DECISIONS.md, 0043).
- **`decision.ts`** — the undo window: a fixed policy computed from `Decision.at`
  (docs/DECISIONS.md, 0003), not stored data.
- **`timeline.ts`** — the same kind of helper for the audit log: the shape of a run (step,
  error and retry counts), `testsPassing` (read from test-run details), and
  `resolveEvidenceIds`, which `gates.ts` and `story.ts` use to turn a list of evidence ids into
  the real timeline events they point to.
- **`utils.ts`** — `cn()` (taught the `--text-*` type-scale names, so a size is never dropped
  next to a colour — docs/DECISIONS.md, 0043), the class-name merger every shadcn/ui component expects at the
  `utils` alias in `components.json`. It lives here because that is where shadcn looks, and
  because `components/` is allowed to import from `lib`.
- **`motion.ts`** — `prefersReducedMotion()`, a real `matchMedia` check. Shared by `app/intro.ts`
  (the welcome intro skips itself outright under reduced motion) and
  `components/OnboardingTour.tsx` (the onboarding tour still shows, just without transitions) —
  it lives here, not in either caller, because `components/` cannot import from `app/`.
- **`actors.ts`** — `isSystemActor`, a heuristic (no dedicated data-model field exists) for
  telling a person's name from a system's name-and-version, used to choose a person/system
  icon next to `evaluatedBy`/`waiver.by`/`decision.by`.
- **`confidence.ts`** — `confidenceLevel` (High / Medium / Low, 0041) and `resolveConfidenceAreas`, the same kind of helper `gates.ts` is for
  gates: turns `Run.confidence` (which simply omits an area the model didn't report) into a
  fixed, always-complete list, so a missing area renders as "Not checked" instead of silently
  disappearing.
- **`openItems.ts`** — what is still open on a run and what approving it takes: the
  tick-each-item list, whether a reason is required, and the "What is not checked" list
  (docs/DECISIONS.md, 0040). Replaced `attention.ts`.
- **`reviews.ts`** — My reviews (docs/DECISIONS.md, 0060): run type and stage, open-item
  counts, search and calendar time ranges, sort, the archive rule (six months, then seven days
  to restore) and report records with a CSV writer. Takes `now`, so it tests with fixed dates.
- **`story.ts`** — resolves `Run.story` against the timeline (a step with no resolvable
  evidence is dropped; times come from the evidence), and writes the "Where the run is now"
  sentences.
- **`evidence.ts`** — groups the events the page's claims rest on, for the Evidence view.
- **`steps.ts`** — the step list: folding long runs of the same repeated step, step numbers,
  and who did each step with what result.

## What `api.ts` actually does

It is the seam between the interface and wherever the data comes from. Today there is no
backend, so it reads a fixture and returns it:

```ts
import type { Run } from "./types";
import { runs } from "../fixtures";

export async function getRun(id: string): Promise<Run> {
  await delay(400);                       // so loading states are real, not theoretical
  const run = runs[id];
  if (!run) throw new NotFoundError(id);
  return run;
}

export async function submitDecision(
  runId: string,
  decision: DecisionInput,
): Promise<Run> { … }

export async function undoDecision(runId: string): Promise<Run> { … }
```

Decisions and undos are written to an in-memory copy of the fixtures, and also to
sessionStorage (`ledger:decisions`), because every link in the app is a full page load. On
load they are laid back over the fixtures, so a decision holds across pages until the tab is
closed (docs/DECISIONS.md, 0064).

Three reasons to write it this way instead of importing fixtures straight into components:

1. **Components never learn where data comes from.** Replacing the fixture with a real
   `fetch` later touches this file only.
2. **It is async and can fail.** That forces the loading, error and empty states to be
   designed, which is most of the real work in this kind of screen.
3. **It can misbehave on purpose.** Slow responses, a run that changed while you were
   reading it, a rejected decision — all can be simulated here and designed for.
