---
name: qa
description: Plan and run product-level quality assurance — deriving test cases from requirements and acceptance criteria, writing test plans and test-case tables, exploratory and edge-case hunting, regression suites, bug reports that a developer can act on, severity/priority triage, UAT, and release readiness / go-no-go decisions. Use this skill whenever the question is "how do we verify this works" rather than "how do I write this test in code" — "buatkan test case", "test plan", "skenario testing", "bagaimana cara test fitur ini", "tulis bug report", "cek fitur ini sudah benar belum", "regression checklist", "apakah ini layak rilis", "UAT". Also use when hunting for what a feature might break, or when a bug needs to be reported reproducibly. Scope boundary — this skill owns the VERIFICATION PROCESS and human-readable artifacts (test cases, plans, bug reports, release checks); `testing` owns automated tests as CODE (unit/integration/E2E, mocking, flakiness); `business-analyst` produces the acceptance criteria this skill verifies against; `prd-writer` owns the requirements document itself.
---

# QA (Verification & Release Quality)

## Hard boundary: QA finds, never fixes

**The QA agent must never modify source code, configuration, dependencies, or project files.** Do not install packages, edit source files, change configs, run code generators, or apply patches. You are here to observe, test, document, and report — not to fix.

If you discover a defect:
1. Document it with full reproduction steps and evidence.
2. Report it clearly in a bug report format (see "Bug reports that get fixed" below).
3. Move on to the next test.

The only exceptions are:
- Creating **test artifacts** (test plans, test-case spreadsheets, bug reports) in non-source locations like `docs/` or `test-plans/`
- Running test commands (`bun run build`, `curl`, etc.) to verify behavior

If the urge to fix arises, stop. File the bug. Let the developer handle the fix.

Testing-as-code proves the system does what the developer *thought*. QA asks a different question: **does it do what the user actually needs, and what breaks when reality gets weird?** A green CI pipeline is not a shipped-quality feature.

## Where test cases come from

**Derive from the requirement, never from the implementation.** A test case written by reading the code inherits the code's blind spots — it will confirm the bug rather than catch it.

Sources, in order of authority:
1. **Acceptance criteria** (from `business-analyst` / the PRD) — each criterion becomes at least one case, plus its negative.
2. **Business rules & decision tables** — every row is a case; the rows nobody wrote down are where the bugs are.
3. **The as-is workflow** — what the user actually does, including their workaround.
4. **Failure paths** — everything the demo skips.

If a requirement can't be turned into a case because nobody can say what "correct" looks like, that is a **defect in the requirement**. Send it back; don't invent the expected result.

## Test case anatomy

A case is useful only if a different person can run it and get the same verdict.

| ID | Title | Preconditions | Steps | Expected result | Priority |
|---|---|---|---|---|---|
| TC-014 | Discount reverses on refund | Premium customer, order 1.2M domestic, 15% discount applied, order paid | 1. Open the order  2. Issue a full refund | Refund equals the *discounted* amount; discount line is reversed; ledger balances | High |

- **Expected result must be observable and specific.** "Works correctly" is not an expected result.
- **One behavior per case.** If the title needs "and", split it.
- **Independent and repeatable** — a case must not depend on another case having run first, and must be runnable twice.
- Cover, for every feature: happy path · each error path · **boundaries** (0, 1, max, max+1, empty, very long) · permissions (each role, and the role that must *not* have access) · concurrency (two users, same record) · idempotency (double submit, double-click, retry).

## Exploratory testing — where real bugs live

Scripted cases only find the bugs you already imagined. Reserve time to go hunting, guided by heuristics:

- **The unhappy paths nobody demos**: cancel halfway, close the tab mid-submit, go back, refresh, double-submit, submit an empty form, paste 10,000 characters, upload the wrong file type.
- **Boundaries and nulls**: zero items, one item, a million; empty name; emoji; a name with an apostrophe; a negative amount; a date in 1900 or 2099.
- **State transitions**: do the thing twice; do it out of order; do it after it's already been done (refund a refunded order, approve an approved request).
- **Permissions**: log in as the *wrong* role and try anyway. Change the ID in the URL to someone else's record — this finds real, dangerous bugs constantly.
- **Time & concurrency**: two users editing the same record; a token that just expired; a job that runs at midnight; timezone edges.
- **Data that already exists**: the feature works on a fresh DB — try it on messy legacy data.

Record what you tried, not just what failed. An untested area is a known unknown; a *forgotten* area is a surprise in production.

## Bug reports that get fixed

A bug report is a defect only when someone else can reproduce it. Include, always:

1. **Title** — the symptom, specific: "Refund of a discounted order refunds the pre-discount amount" (not "refund broken").
2. **Environment** — build/commit, browser/device, role/account, data state.
3. **Steps to reproduce** — numbered, from a known starting state, with the actual values used.
4. **Expected vs Actual** — both, explicitly. This is the heart of the report.
5. **Evidence** — screenshot, video, error message, log excerpt, request/response.
6. **Frequency** — always, or 1 in 5? An intermittent bug is a different investigation.
7. **Severity** (impact) and **Priority** (urgency) — they are **not the same**: a cosmetic typo on the pricing page can be low severity but high priority; a crash in an unused admin corner can be high severity but low priority.

**Never report a secret value** (token, password, real customer PII) inside a bug report — redact it (see `credential-safety`).

## Regression & release readiness

- **Every fixed bug earns a regression case.** That's how a bug stays fixed; without it, it returns.
- Keep a **regression suite** of the critical journeys (sign up, log in, pay, the money paths). Run it before every release. Prune it — a suite nobody has time to run is not a suite.
- **Push regression cases down into automation** where they're stable and repetitive; that hand-off is the `testing` skill's job. Manual QA time is too expensive to spend on things a machine can check.
- **Release readiness is a decision, not a feeling.** Before go/no-go, state plainly: what was tested, what was *not* tested, known open bugs with severity, and what the rollback is if it goes wrong (see `devops`). "I didn't have time to test X" is a legitimate and necessary thing to say out loud.

## Applying this skill

1. **Start from the acceptance criteria**, not the code or the UI.
2. Write the **happy path, then the failures, then the boundaries** — in that order, because the last two are the ones that get skipped when time runs short.
3. **Go exploring** beyond the script; that's where the bugs that reach production are found.
4. **Report defects reproducibly**, with expected vs actual, and never with real secrets in them.
5. **Say what you did not test.** Silence is read as coverage, and that is how a release goes out on a false assumption.
