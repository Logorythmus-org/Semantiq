# SemantIQ Lite (experimental)

A minimal **skill-only** plugin for Codex and skill-enabled agent runtimes. It uses the existing SemantIQ Python SDK for controlled-language checks. No own model, server, database, remote API, or numeric truth score.

## Three actions

| Action | Result | What it does NOT do |
| --- | --- | --- |
| `claim-check` | Controlled-language wording flags | Verify truth or causality |
| `evidence-limits` | Supplied reference count and limitations | Retrieve or authenticate citations |
| `short-report` | Short combined report | Replace human review |

## Local install and usage

Requires Python 3.10+, run from a SemantIQ repository checkout:

~~~bash
python -m pip install -e ./packages/python
python plugins/semantiq-lite/skills/semantiq-lite/scripts/semantiq_lite.py claim-check --text "Treatment causes improvement." --json
python plugins/semantiq-lite/skills/semantiq-lite/scripts/semantiq_lite.py evidence-limits --text "The result improved." --source "paper-1" --json
python plugins/semantiq-lite/skills/semantiq-lite/scripts/semantiq_lite.py short-report --text "The result improved." --source "paper-1"
~~~

`--text` may be replaced with stdin; `--source` can be repeated. No results are stored by the script. Exit codes: 0 = report completed/no wording flags, 1 = claim-check wording flagged/needs review, 2 = usage/dependency error.

## Codex / ChatGPT

Portable manifest: `plugin.json`; Codex compatibility manifest: `.codex-plugin/plugin.json`. Skill: `skills/semantiq-lite/SKILL.md`. For direct local Codex use, copy the skill folder to `${CODEX_HOME:-$HOME/.codex}/skills/semantiq-lite` or install the plugin via a supported plugin mechanism. Ensure the SemantIQ Python SDK is available to that Python environment.

This repository change **does not install a plugin in ChatGPT**. ChatGPT distribution/enablement requires a separate supported plugin setup; an environment without Python execution cannot run the script. The no-network script remains opt-in.

## Tests

~~~bash
python -m unittest discover -s plugins/semantiq-lite/tests -v
~~~

Unit tests stub the SDK interface, so an SDK-installed end-to-end smoke is still required before release. This is an alpha integration, not a certification, truth detector, or a complete semantic intelligence evaluator.

## Scope and limitations (0.1.1 draft)

Supplemental narrow patterns recognize explicit absolute safety wording in English and a few Persian phrases. **This is not a comprehensive English/Persian semantic verifier.** Persian text that matches no rule returns `needs_review` instead of a potentially misleading `pass`. Even an English `pass` is not proof of truth, safety, or evidentiary support.

Run `python -m unittest discover -s plugins/semantiq-lite/tests -v` for offline contract tests. SDK-installed end-to-end smoke has now passed on GitHub Actions under Python 3.10 and 3.12 (19 tests and 2 subtests per runner). The workflow also copies this skill into an isolated `CODEX_HOME/skills/semantiq-lite` directory and invokes its CLI with the real SDK; this tests the install path, **not Codex agent discovery or execution**. ChatGPT plugin installation/distribution and actual host invocation remain unverified.

Real-SDK CI evidence: [SemantIQ Lite Real-SDK Smoke](https://github.com/Logorythmus-org/Semantiq/actions/workflows/semantiq-lite-e2e.yml).
