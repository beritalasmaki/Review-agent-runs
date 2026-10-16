# features/run

The agent run review view. Everything here knows what this product is about: runs, gates,
confidence, decisions. Parts that would work in any other product belong in
`src/components/` instead.

The full content spec is in `docs/spec-review-screen.md`. This file explains the words.

## Glossary

**Run** — one job carried out by an AI agent: it received a task, made a plan, changed files,
ran tests, and produced a result. A run is what this screen reviews.

**Agent** — the AI that did the work. It acts on its own, but it does not decide whether the
result is released.

**Policy gate** — a rule the change has to pass before release. The company defines the rule
in advance and the system checks it automatically. Example: *personal data must be deleted
within 30 days*. If the agent wrote code that stores email addresses with no expiry, that
gate fails.

Every gate is shown with: the rule's name, the rule in plain language, the result, what broke
it, who or what evaluated it, and a link to the evidence.

A gate can be:

- **pass** — the rule is met
- **fail** — the rule is broken
- **not applicable** — the rule does not concern this change
- **unknown** — the check could not be run; this is shown, never hidden
- **waived** — a person decided the change may proceed anyway. A waiver always names who
  decided, when, and why. A waiver is a decision, not a status.

**Evidence** — the data behind a claim: log events, test results, changed files. Every value
on screen links to its evidence. A number without a source is not proof.

**Timeline** — what the agent did, step by step, in order: plan, tool calls, file changes, test
runs, gate evaluations, errors, retries. This is the audit trail, so it can be collapsed but
never hidden.

**Confidence** — how sure the model is about part of its own work, plus the reasoning and,
most importantly, what it could not verify. Low confidence is normal information, not an
alarm.

**Decision** — the human's answer: approve, request changes, or reject. Recorded with the
person, the time, the exact revision approved, and any gates they acknowledged. Reversible
within the undo window before release.

**Reviewer** — the person making that decision. Usually not the person who would have
written the code: a compliance officer, a security lead, a product owner. Design for them.

## Files

The page is the "story layout" (docs/DECISIONS.md, 0038): an overview header, three views of
the run, and a right column that stays in place.

- `RunReviewPage.tsx` — composes the page and handles loading, not-found and failed-load
  states once. Holds the run in local state, so a decision, a conflict or an undo updates the
  screen straight away, without a refetch. Lays out the three columns, owns which view is
  open, and where focus goes when the view changes: the view's heading after a
  tab, or one step's row after a link into the step list (docs/DECISIONS.md, 0044).
- `RunTopBar.tsx` — sticky: breadcrumb back to "My reviews". No logo or main menu: the page
  sits inside a host platform (0042).
- `RunViewTabs.tsx` — the Story / Evidence / All N steps tab list, at the top of the view it
  switches, sticky under the top bar (0052).
- `RunOverview.tsx` — the card at the top of the middle column: status, initiative, why the
  agent was asked, where the run is now.
- `RunDetails.tsx` — "Run details", the left-hand column: *The change* (target, revision, run
  reference) and *The run* (requester, agent, time, checks, lowest score) (0046).
- `OpenItemsNotice.tsx` — at the right end of the top bar before a decision: a yellow dot,
  "3 things to solve" and a link to the tick list (0053).
- `UndoBox.tsx` — heads the right-hand column after a decision: the outcome ("Approved", with a
  check that plays transitions.dev's "Success check" and takes focus when the decision was just
  made here, 0047), the live undo countdown and the Undo button (0017, 0033).
- `StoryTimeline.tsx` — "What happened, in order": `Run.story` on a timeline spine, ending on
  "Waiting for a decision" or the decision and its reason. Uses `ScoreCard` and `CheckCard`
  where scores and checks happened.
- `ScoreCard.tsx` — one confidence score: percentage, level, action, basis, what could not be
  checked, and "Why this score" (0041). A missing area shows "Not checked".
- `CheckCard.tsx` — a check that failed, did not run, or has an exception. Before a decision,
  "Run check again" (local only) gives a way forward.
- `EvidenceTab.tsx` — every event the page's claims rest on, grouped by what it supports.
- `StepsTab.tsx` — the full audit log, one row per step, with long repeated runs folded.
- `DecisionPanel.tsx` — "Your decision": tick each open item, a reason (required when a check
  is missing), then Approve and release, or Request changes / Reject run (0039, 0040). Each
  action opens `DecisionDialog`.
- `DecisionDialog.tsx` — the confirmation (it names the revision and target) or the reason
  form behind each action, plus a failed submit and Scenario S5's conflict.
- `UnverifiedList.tsx` — "What is not checked" before a decision, "What is still unverified"
  after.
- `RunShape.tsx` — the run in five counted numbers, shown after a decision.
- `MyReviews.tsx` — "My reviews" (docs/DECISIONS.md, 0060): tabs by run type, search, filters,
  sort, runs in progress, selection, the Archive view and the toast. It holds the list's state;
  the pieces below only render it.
  - `ReviewsTable.tsx`, `ArchiveTable.tsx` — the two tables, real `<table>`s with sortable
    headers (`aria-sort`) and info tips.
  - `ReviewsToolbar.tsx` — search, the Filters button and panel, "Showing N of M".
  - `ReviewParts.tsx` — the run-type pill, environment chip, stage steps and run cell.
  - `ReviewDialogs.tsx` — Decision details, Request a new run, Create a report.
  - `reportExport.ts` — the report as a CSV download or a print-ready page for PDF.
- `ActorName.tsx` — the shared "who did this" display: a person gets a pill, a system stays
  plain icon + text (0023).
- `SectionHeading.tsx` — the region heading with its scanning icon.
- `currentReviewer.ts` — the stand-in identity of whoever is using the page (no sign-in yet).
- `useRun.ts` — loading, not-found and error handling around `lib/api`'s `getRun`.
