# Experimental local Codex / MCP adapter

1. Unzip the artifact into a trusted local directory. Review code and data; there are no install scripts and no network requirements.
2. Run `python /absolute/path/semantiq_cognitive_phase6/mcp_stdio.py` as a **stdio** MCP tool server from a compatible local host. The prototype supports `initialize`, `tools/list`, and `tools/call` with version `2025-06-18` and read-only annotations.
3. The host should call `semantiq_capabilities` to retrieve limitations, then `semantiq_evaluate_claim_graph` with `{"packet":{...}}`. The additional `SKILL.md` document instructs the agent not to fabricate evidence IDs or overclaim truth.
4. All operations return `action_allowed=false`. The server does not authenticate sources, download data, run third-party models, or execute external changes.

The exact host install configuration must be checked against the **installed Codex version and available plugin mechanism**. The `.codex-plugin/plugin.json` file is provisional packaging, not proof of compatibility or successful installation. The local stdio exchange was tested in Python, not in an installed Codex session. A conformance test and actual host discovery are required before publication.

Official reference: https://modelcontextprotocol.io/specification/2025-06-18/server/tools
