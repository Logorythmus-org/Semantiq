# Frozen task instruction

Complete the migration from configuration schema v1 to schema v2.

The implementation must:

1. validate supported schema-v1 input and reject malformed or already-v2 input;
2. migrate it to the documented schema-v2 shape;
3. preserve `projectId`, every service identifier, service order, and environment values;
4. leave the original input unchanged;
5. expose the migration through the CLI with canonical JSON on stdout, diagnostics on stderr, exit
   code `0` for success, and a non-zero exit code for invalid input; and
6. leave build, typecheck, and the frozen verifier suite passing.

Do not modify anything under `verifier/` or `fixture-manifest.json`. Do not use a network.
