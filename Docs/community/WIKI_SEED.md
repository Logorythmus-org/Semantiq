# SemantIQ Wiki Seed

The GitHub Wiki is intended as an orientation and learning surface. It should be easier to browse than the repository, while always pointing back to canonical version-controlled sources.

## Wiki Home

Suggested opening text:

> SemantIQ is Behavioral Evidence Infrastructure for AI Systems. The project is currently Public Alpha (Experimental). This Wiki helps readers navigate concepts, workflows, and contributor paths. Canonical implementation, version, governance, security, and scientific claims remain in the repository.

Suggested navigation:

1. **Start Here**
2. **Concepts**
3. **Using SemantIQ**
4. **Benchmarks & Evidence**
5. **Reproduction**
6. **Integrations**
7. **Contributing**
8. **Glossary**
9. **Repository Truth Sources**

## Page: Start Here

Link to:

- repository README;
- installation matrix;
- CLI usage;
- Python SDK guide;
- TypeScript SDK guide;
- HTTP API reference;
- known limitations;
- Community Hub.

The page should explicitly preserve the distinction between software version `0.1.0-alpha.2`, schema version `1.0.0`, and HTTP route family `/api/v1`.

## Page: Concepts

Explain, with links to canonical docs:

- Benchmark Engine;
- Evidence Engine;
- Research Workbench;
- observations vs inference;
- matched association vs causal effect;
- evidence levels and claim boundaries;
- deterministic and offline verification where documented.

Avoid creating new normative definitions in the Wiki.

## Page: Using SemantIQ

Create a task-oriented index for:

- installation;
- first run;
- CLI;
- Python;
- TypeScript;
- HTTP;
- benchmark packs;
- research bundles.

Code examples should link to version-controlled examples instead of becoming independent Wiki-only source code.

## Page: Reproduction

Explain:

- owner-controlled validation vs external reproduction;
- how to reproduce a documented workflow;
- how to submit an Independent Replication Report;
- why divergent and blocked results are welcome;
- provenance requirements.

## Page: Integrations

Use the repository Integration Graph as the evidence-backed source. Separate:

- implemented integration;
- tested compatibility;
- documented preparation;
- proposed integration;
- external validation.

## Page: Contributing

Link to:

- Community Hub;
- CONTRIBUTING;
- Discussions;
- Projects;
- issue forms;
- RFC process;
- Code of Conduct;
- Security Policy.

## Page: Glossary

Keep this page explanatory only. Normative vocabulary should link to the repository document or schema that defines it.

## Wiki maintenance rule

Every Wiki page should include:

> **Source-of-truth note:** This page is navigational or explanatory. If it conflicts with the version-controlled SemantIQ repository, the reviewed repository artifact is authoritative.

Wiki updates should not be used to bypass normal pull-request review for scientific, security, governance, release, or contract claims.
