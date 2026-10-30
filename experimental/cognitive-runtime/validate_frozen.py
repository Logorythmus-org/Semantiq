"""Read archived labels without regenerating fixtures. No model inference."""
import sys
import io
import hashlib
import json
import tempfile
from pathlib import Path
from semantic_ir import Runtime, InvalidInput, IntegrityFailure
from compare_recorded import LABELS, load_recording
ROOT = Path(__file__).resolve().parent

EXPECTED = {'main': 60, 'stress': 30}
FROZEN_DIGESTS = {
    'main_cases.jsonl': '69c58fc7dfef7e8e64c6aded794fa4f14c6915f80257f17ef846ba5ef7969a23',
    'main_gold.json': '0c23f2ba2bb5f7927fabfef59ce7c6b4911bb719ccaba0a0b911abcac448e803',
    'stress_cases.jsonl': 'e352c0fad39a4a56bfb881d6c983d210f3af3080c2ee149f776ad655664b65a9',
    'stress_gold.json': '1510aee581a1ce8f088cda4b12a2c0873be1c5b623d246f66cad145042d0ac2b',
}


def validate_case_set(cases, gold, expected_n):
    if not isinstance(cases, list) or len(cases) != expected_n or expected_n <= 0:
        raise ValueError('Frozen case count mismatch')
    if not isinstance(gold, dict) or len(gold) != expected_n:
        raise ValueError('Frozen gold count mismatch')
    ids = []
    for case in cases:
        if not isinstance(case, dict) or type(case.get('id')) is not str or not case['id']:
            raise ValueError('Invalid frozen case ID')
        if not isinstance(case.get('packet'), dict):
            raise ValueError('Packet must be object')
        if 'poisoned' in case and type(case['poisoned']) is not bool:
            raise ValueError('Poison marker must be boolean')
        ids.append(case['id'])
    if len(set(ids)) != len(ids) or set(ids) != set(gold):
        raise ValueError('Frozen IDs must be unique and match gold exactly')
    if any(type(v) is not str or v not in LABELS for v in gold.values()):
        raise ValueError('Unsupported frozen gold label')


def load_split(root, split):
    if split not in EXPECTED:
        raise ValueError('Unknown split')
    names = (split + '_cases.jsonl', split + '_gold.json')
    for name in names:
        if hashlib.sha256((root / 'data' / name).read_bytes()).hexdigest() != FROZEN_DIGESTS[name]:
            raise IntegrityFailure('Frozen benchmark input digest mismatch')
    with (root / 'data' / names[1]).open() as stream:
        gold = load_recording(stream)
    cases = [load_recording(io.StringIO(line)) for line in (root / 'data' / names[0]).read_text().splitlines()]
    validate_case_set(cases, gold, EXPECTED[split])
    return cases, gold


def main():
    rows = []
    for split in ('main', 'stress'):
        cases, gold = load_split(ROOT, split)
        for case in cases:
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
    try:
        main()
    except (ValueError, IntegrityFailure, OSError, KeyError):
        print(json.dumps({'error': 'Frozen evaluation input validation failed'}), file=sys.stderr)
        sys.exit(2)
