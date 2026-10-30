"""Read archived labels without regenerating fixtures. No model inference."""
import sys
import hashlib
import json
import tempfile
from pathlib import Path
from semantic_ir import Runtime, InvalidInput, IntegrityFailure
ROOT = Path(__file__).resolve().parent

def main():
    rows = []
    for split in ('main', 'stress'):
        gold = json.loads((ROOT / 'data' / (split + '_gold.json')).read_text())
        for line in (ROOT / 'data' / (split + '_cases.jsonl')).read_text().splitlines():
            case = json.loads(line)
            engine = Runtime()
            try:
                if case.get('poisoned'):
                    with tempfile.TemporaryDirectory() as tmp:
                        world = json.loads((ROOT / 'data/offline_facts.json').read_text())
                        c = case['packet']['claims'][0]
                        fid = f"{case['domain']}:{c['subject']}:{c['predicate']}"
                        for rec in world['records']:
                            if rec['fact_id'] == fid:
                                rec['value'] = c['value']
                        raw = json.dumps(world, sort_keys=True).encode()
                        Path(tmp, 'offline_facts.json').write_bytes(raw)
                        Path(tmp, 'manifest.json').write_text(json.dumps({'sha256': hashlib.sha256(raw).hexdigest()}))
                        engine = Runtime(Path(tmp))
                actual = engine.evaluate(case['packet'])['verdict']
            except IntegrityFailure:
                actual = 'review'
            except InvalidInput:
                actual = 'invalid'
            rows.append({'id': case['id'], 'gold': gold[case['id']], 'actual': actual, 'correct': actual == gold[case['id']]})
    print(json.dumps({'rows': rows, 'correct': sum(r['correct'] for r in rows), 'n': len(rows), 'model_calls': 0, 'note': 'Integrity rejection mapped to review; not new scientific evidence'}, indent=2))
    if not all(r['correct'] for r in rows):
        raise SystemExit(1)
if __name__ == '__main__':
    main()
