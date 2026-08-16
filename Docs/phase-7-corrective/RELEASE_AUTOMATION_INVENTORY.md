# Release Automation Inventory Report

**Project**: SemantIQ Benchmarks / Tech Club Monorepo  
**Date**: 2026-08-01

---

## Complete Release Automation Inventory

| Path / Command             | Type               | Risk Level | Active Status      | Action Required                  |
| -------------------------- | ------------------ | ---------- | ------------------ | -------------------------------- |
| `git push origin main`     | Direct CLI command | `HIGH`     | Disabled by Freeze | Block via Release Guard          |
| `tools/automation/cli.mjs` | Automation CLI     | `MEDIUM`   | Local Only         | Remove Git network commands      |
| `package.json` scripts     | Workspace Scripts  | `LOW`      | Development Only   | Disallow implicit git operations |
| `.github/workflows/*`      | CI/CD              | `MEDIUM`   | Audit Only         | Restrict CI push permissions     |
