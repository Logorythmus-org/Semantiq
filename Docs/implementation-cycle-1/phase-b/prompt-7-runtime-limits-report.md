# Prompt 7 Runtime Limits Report

Question and semantic text, list counts, metadata, reasons, locators, report descriptions, request bodies, headers, pages, cursors, graph depth/nodes/edges, audit reads, case report IDs, and identifiers are bounded. Graph maximums are depth 3, 100 nodes, and 500 edges; discovery page maximum is 100.

Per-operation local fixed-window limits cover create, update, relation, semantic, source, report, search, graph, and moderation. Stable 429 responses disclose operation and retry time, not limiter keys. Distributed enforcement remains out of scope.
