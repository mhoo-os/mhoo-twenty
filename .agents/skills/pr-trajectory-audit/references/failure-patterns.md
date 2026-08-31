# AI-layer compliance findings — mhoo-os/mhoo-twenty

This repository-specific rubric was built from `AGENTS.md`, `CLAUDE.md`, and
the applicable `.cursor/rules/` files against the complete 35-PR history
observed on 2026-08-31. It replaces the copied `mhoo` example. Findings evaluate
documented process compliance, not implementation quality.

## Rule violations

No documented rule violation was confirmed in this audit. The relevant source
and fork rules require source/provenance preservation, focused validation, and
no implied deployment authority. Recent #29 and #30 include exact source custody
and terminal CI evidence; #23 is closed and #34 explicitly supersedes it on the
governed v2.37 base. Those title clusters are deliberate handoffs, not evidence
of a repeated process violation.

## Coverage gaps

No recurring uncovered pattern was confirmed in this 35-PR corpus. The scope
heuristic only applies to `fix(module):` titles, so it contributes no signal to
the repository's `feat(...)`, `docs:`, `build:`, and plain-title PRs. This is a
known heuristic limitation, not a repository coverage finding by itself.

## How to extend this file

Re-run Workflow A after a material batch of PRs. For every candidate, identify
the exact current rule or workflow step it tests and check state, `mergedAt`,
head branch, comments, CI, and actual diff before adding a finding. A repeated
pattern with no current rule is a coverage gap; an isolated event is not.
