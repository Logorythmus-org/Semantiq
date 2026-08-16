# Independent Score Reproduction

To verify a published evaluation report:

```bash
npx tsx tools/automation/cli.mjs reproduce
```

The reproduction pipeline replays the recorded evidence trace through deterministic evaluation rubrics and verifies that the computed score exactly matches the published receipt.
