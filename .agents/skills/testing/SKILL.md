---
name: testing
description: Design and write automated tests that actually prove something — choosing what to test (behavior, not implementation), picking the right level (unit vs integration vs E2E), mocking discipline, deterministic non-flaky tests, meaningful assertions, and treating coverage as a signal rather than a target. Use this skill whenever writing, reviewing, fixing, or planning tests — "write unit tests for this", "add a test", "this test is flaky", "how do I mock this", "why is this test failing intermittently", "should this be a unit or integration test", "is this test any good", "test this endpoint/component", or when fixing a bug (a bug fix needs a test that fails without the fix). Also triggers on Indonesian phrasing like "bikin unit test", "buatkan test", "testnya flaky", "cara mocking", "test ini kenapa gagal terus". Covers unit, integration, and end-to-end testing. Scope boundary — test FOLDER LAYOUT and per-stack runner setup belong to the structure skills (`backend-conventions` for pytest/Pest/PHPUnit layout, `frontend-app` for Vitest/Testing Library); the quality of the test code itself belongs to `code-quality`; product-level QA process (manual test plans, bug reports, acceptance criteria, exploratory testing) is NOT this skill.
---

# Testing

A test's only job is to **fail when the behavior breaks**. A test that cannot fail proves nothing, and a suite full of them is worse than no suite — it manufactures confidence. Every rule below serves that one idea.

## The trap that matters most here

**A test written after reading the implementation tends to encode the implementation — including its bugs.** It mirrors the code's structure, asserts what the code already does, and passes by construction. This is the single most common way a green suite hides a broken feature.

Defenses:
- **Fixing a bug? Write the failing test first.** Run it, watch it go red *without* the fix. A bug-fix test that was never red has proven nothing.
- **Derive assertions from the requirement, not the code.** Ask "what should this do?" before "what does this do?" If acceptance criteria or QA test cases exist (see `business-analyst` / `qa`), they are the source — translate them, don't re-derive them from the implementation.
- If a test passes the moment you write it and you never saw it fail, break the code on purpose once and confirm the test catches it.

## What to test

- **Test behavior, not implementation.** Assert on outputs, state changes, and side effects a caller can observe — never on private methods, internal call order, or how many times a helper ran. Refactoring internals must not break tests; changing behavior must.
- **Test at the boundaries and the branches**: happy path, each error path, empty/null, zero, one, many, and the edges of any range or limit.
- **Don't test the framework, the language, or the library.** No tests for a getter that just returns a field, an ORM's `save()`, or that React renders props.
- **Don't test what a type checker already guarantees.**
- Prioritize by blast radius: money, auth, permissions, and data loss get tests first and hardest.

## Choosing the level

Push tests **down** to the cheapest level that can still catch the bug.

- **Unit** — one unit of behavior in isolation; no I/O, no DB, no network, no clock, no filesystem. Milliseconds. This is where logic, branches, and edge cases get covered exhaustively.
- **Integration** — the unit plus its real collaborators across a boundary: real DB, real HTTP handler, real queries. This is where you catch what unit tests structurally cannot — a wrong SQL query, a broken migration, a serialization mismatch, a misconfigured route. **Anything mocked in a unit test is untested until an integration test exercises it for real.**
- **E2E** — the whole system through the user's interface (Playwright/Cypress). Slow, expensive, flakiest. Reserve for a handful of **critical user journeys** (sign up → log in → buy). E2E is for proving the pieces are wired together, not for covering edge cases — cover those below.

A pyramid, not an hourglass: many unit, fewer integration, very few E2E. If you find yourself writing an E2E test to cover a validation rule, that rule belongs in a unit test.

## Mocking discipline

Over-mocking is the fastest way to build a suite that tests nothing.

- **Mock at the system's edges, not inside your own logic**: third-party APIs, payment providers, email/SMS, the clock, randomness. Don't mock your own service to test your own controller — that only asserts your mocks are wired the way you wrote them.
- **Never assert only that a mock was called.** `expect(repo.save).toHaveBeenCalled()` proves the code called something, not that anything *correct* happened. Assert the resulting state or the returned value. Call-assertions are acceptable only when the call *is* the behavior (e.g. "an email is sent on signup") — and even then, assert the payload.
- **Prefer real objects, then fakes, then stubs, then mocks** — in that order. An in-memory fake repository beats a mock; a real DB in a container beats both for integration.
- **If a test needs five mocks to run, the design is telling you something** — too many dependencies, or logic that should be pure. Fix the code, not the test.

## Determinism — no flaky tests

A flaky test is a broken test. It trains the team to ignore red, which is worse than having no test.

- **Never depend on real time.** Inject the clock or freeze it; no `sleep()`, no "should finish within 2 seconds".
- **Never depend on real randomness.** Seed it, or inject the generator.
- **Never depend on the network or third-party availability** in unit/integration tests. Stub the edge.
- **Tests must be order-independent and isolated.** No shared mutable state between tests; each sets up and tears down its own data (transaction rollback, truncation, or a fresh fixture). If tests only pass in a given order, they're already broken.
- **No inter-test dependencies** — test B must not rely on test A having created a record.
- In E2E, **wait on conditions, never on durations** (`await expect(el).toBeVisible()`, not `sleep(3000)`).

## Writing the test

- **Name by behavior**, so a failure reads as a bug report: `test_refund_fails_when_order_already_refunded`, `it("rejects a signup with an existing email")`. Never `test1`, `testUserService`.
- **Arrange–Act–Assert**, visibly separated. One behavior per test — if the name needs "and", split it.
- **Assert specifically.** `assert result.status == "refunded"` beats `assert result` — a truthy check passes on almost anything.
- **No logic in tests.** Loops, conditionals, and clever helpers in a test mean the test itself needs testing. Prefer explicit, repetitive, obvious test code — this is the one place where a little duplication is healthier than an abstraction.
- **Use factories/builders for test data**, with only the fields relevant to the test made explicit — the reader should see immediately what matters.
- A test's failure message should be enough to locate the problem without opening a debugger.

## Clean up testing artifacts

After testing, remove all temporary files, mock databases, generated code, or config changes created as a side effect of running tests. Test databases (`*.db`), generated migration files in `drizzle/`, and any scaffold-generated code in `server/modules/` or `src/` must be cleaned up so the repo is returned to its pre-test state. The only permanent testing artifacts are those explicitly placed in `docs/`.

## Coverage

- Coverage is a **signal, not a target.** It tells you what is definitely *not* tested; it says nothing about whether what *is* covered is meaningfully asserted. 100% coverage with weak assertions is a suite that proves nothing.
- **Never chase a coverage number by writing tests without assertions**, or by testing trivial code to pad the ratio.
- Use it to find blind spots in code that matters, and ignore it for code that doesn't.

## Applying this skill

1. **Ask what the code is supposed to do** before looking at how it does it.
2. **Pick the lowest level** that can catch the failure you care about.
3. Write the test so that it **fails for the right reason** — see it red at least once.
4. Assert on observable behavior; mock only at the edges.
5. **Run the suite.** Report what actually happened, including failures. Never claim tests pass without having run them.
6. Match the project's existing test conventions, runner, and layout (see `backend-conventions` / `frontend-app`) over the defaults here.
