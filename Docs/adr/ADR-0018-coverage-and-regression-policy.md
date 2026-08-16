# ADR-0018: Coverage and Regression Policy

V8 coverage is measured for config, shared, and persistence. The current baseline is recorded without an arbitrary threshold. New foundational changes must preserve passing tests and should not reduce the measured baseline without a documented reason.
