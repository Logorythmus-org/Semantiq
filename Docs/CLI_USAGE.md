# SemantIQ Command-Line Surfaces

SemantIQ is currently **Public Alpha (Experimental)**. The repository contains
more than one command surface, and they are not interchangeable.

There is currently no published npm package or single generally installable
TypeScript `semantiq` executable that exposes every command implemented inside
the repository.

---

## 1. Source-checkout workspace commands

From a repository checkout:

```bash
git clone https://github.com/Logorythmus-org/Semantiq.git
cd Semantiq
pnpm install --frozen-lockfile
```

The root workspace currently exposes these user-facing source-checkout commands:

```bash
pnpm doctor
pnpm first-result
pnpm preflight
pnpm smoke
pnpm logo
```

### `pnpm logo`

Prints the compact UTF-8 brain logo, using color only on interactive terminals that
support it. Use `pnpm logo --color=always` to force ANSI color or
`pnpm logo --color=never` for plain text. This is a workspace display command,
not a published TypeScript executable or a benchmark run.

### `pnpm doctor`

Runs the repository's first-run environment/configuration diagnostics.

### `pnpm first-result`

Generates the deterministic local first-result artifact described in
[Quick Start](QUICK_START.md).

### `pnpm preflight`

Runs the current first-run diagnostic and connector-status preflight path.

### `pnpm smoke`

Runs the local deterministic scaffold smoke path.

These are repository workspace commands. Their existence does not establish a
globally installed `semantiq` executable, npm publication, production
deployment, or external benchmark validation.

---

## 2. Python CLI after source installation

The Python source package declares a console entrypoint named `semantiq`.
The package is not currently published on PyPI, so install it from the checkout:

```bash
python -m pip install -e "./packages/python"
```

The currently wired Python CLI commands are:

```bash
semantiq --version
semantiq logo
semantiq evaluate
semantiq validate-language "DP-008 is associated with reduced drift."
semantiq verify <64-character-hex-digest>
semantiq info
```

### `logo`

Prints the bundled compact SemantIQ brain artwork without running an evaluation or
changing existing CLI output. Use `semantiq logo --color=auto|always|never`:
`auto` colors interactive terminals and produces plain text for pipes,
`NO_COLOR`, or `TERM=dumb`. A UTF-8 monospaced terminal at least 65 columns
wide is recommended. README displays the corresponding colored SVG banner.
This is an opt-in display command, not benchmark qualification evidence.

### `evaluate`

Runs the Python package's deterministic evaluation path using the package's
current synthetic/mock fixtures.

Useful options include:

```bash
semantiq evaluate --agent-name "CLI-Agent" --seed "0x42"
semantiq evaluate --json
```

This command demonstrates the current Python package evaluation mechanics. It is
not evidence of external benchmark execution or independent validation.

### `validate-language`

Checks a statement against the package's controlled-language rules:

```bash
semantiq validate-language "DP-008 is associated with reduced drift."
semantiq validate-language "DP-008 causes perfect safety." --json
```

### `verify`

The current Python command validates the **format** of a supplied SHA-256-shaped
digest: it accepts a 64-character hexadecimal string.

It does **not** currently recompute a research bundle, trace, or receipt from source
content and therefore must not be described as full cryptographic content
verification.

### `info`

Prints the Python package's current release version, Public Alpha maturity,
product-contract schema version, and supported mode labels.

See [Python Usage](PYTHON_USAGE.md) for the source-package API.

---

## 3. Internal TypeScript CLI engine

The repository contains `SemantIQCliEngine` in
`packages/semantiq/src/cli.ts`. It implements internal/library command routing
for application-service workflows such as patterns, evidence, claims, reviews,
studies, bundles, comparisons, evaluations, and runs.

Current package metadata does not wire that engine to a public npm-installed CLI:

- the root package is private and has no `bin` entry;
- `packages/semantiq` is private and has no `bin` entry;
- npm publication is not established.

Therefore examples such as `semantiq patterns ...`, `semantiq claims ...`, or
`semantiq serve` must not be treated as generally available installed commands
unless a future release explicitly wires and publishes such an executable.

---

## 4. Headless HTTP API

A UI-independent HTTP server/router is implemented as a programmatic source
surface and is exercised by repository API tests.

It is documented in [Headless HTTP API Reference](HTTP_API_REFERENCE.md).

The repository does not currently establish a packaged `semantiq serve`
executable or a hosted SemantIQ API service.
