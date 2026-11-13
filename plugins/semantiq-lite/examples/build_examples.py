"""Explicitly regenerate only the three synthetic files beside this script."""

import json
from pathlib import Path

from semantiq_lite import EvidenceAnchor, ReviewResult, dumps_review, snapshot

if __name__ == "__main__":
    root = Path(__file__).resolve().parent
    raw = "Reported result: پژوهش 😀 e\u0301\r\n".encode("utf-8")
    source = snapshot("synthetic-1", raw)
    quote = "پژوهش 😀 e\u0301"
    start = source.extracted_text.index(quote)
    anchor = EvidenceAnchor("quote-1", source.source_id, start, start + len(quote), quote)
    review = ReviewResult([source], anchors=[anchor])
    payload = dumps_review(review, {source.source_id: raw})
    root.joinpath("source.txt").write_bytes(raw)
    root.joinpath("valid.json").write_text(payload + "\n", encoding="utf-8")
    invalid = json.loads(payload)
    invalid["anchors"][0]["quote"] = "fabricated quotation"
    root.joinpath("invalid.json").write_text(json.dumps(invalid) + "\n", encoding="utf-8")
