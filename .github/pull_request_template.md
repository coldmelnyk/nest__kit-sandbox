<!-- kit:begin id=ci-github/summary -->
## What and why

<!-- What changed and why, in two or three sentences. Link the task: docs/tasks/NNN-<slug>.md -->
<!-- kit:end id=ci-github/summary -->

<!-- kit:begin id=ci-github/done -->
## Done when

<!-- Each criterion from the task's "Done when", with the test that proves it. -->

- [ ] <criterion> — test: `<test name>`
<!-- kit:end id=ci-github/done -->

<!-- kit:begin id=ci-github/docs -->
## Documentation

- [ ] Task: `docs/tasks/…`
- [ ] Decision `Р-N` / assumption `Д-N` in `docs/decisions.md`, if one was made
- [ ] `docs/architecture.md` or `docs/glossary.md`, if the structure, environment or terms changed
- [ ] No record needed — then the `docs:skip` label and a line `docs:skip: <reason>` below
<!-- kit:end id=ci-github/docs -->

<!-- kit:begin id=ci-github/not-checked -->
## Not checked automatically

<!-- What CI cannot see: the "Not checked" items of the rules this PR touches, manual checks, risks, rollback. -->

- [ ] New runtime dependencies approved by the project owner
- [ ] Should a rule from this PR go to claude-kit?
<!-- kit:end id=ci-github/not-checked -->
