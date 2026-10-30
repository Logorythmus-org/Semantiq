"""Offline A/B/C comparison of recorded, independently labeled inference runs.
No API calls. Input: JSON with gold{id:label}, and arms A/B/C each containing
model, settings, rows[{id,prediction,latency_ms,tokens,cost_usd}].
"""
import json
import sys

def compare(data):
    arms = data['arms']
    gold = data['gold']
    reference = (arms['A']['model'], arms['A']['settings'])
    result = {}
    for name in ('A', 'B', 'C'):
        arm = arms[name]
        if (arm['model'], arm['settings']) != reference:
            raise ValueError('Model/settings must match across arms')
        rows = arm['rows']
        if len(rows) != len(gold) or {r['id'] for r in rows} != set(gold):
            raise ValueError('Require exactly one row per labeled case per arm')
        n = len(rows)
        if not n:
            raise ValueError('No cases')
        positives = sum(v == 'supported_offline' for v in gold.values())
        negatives = n - positives
        false_accept = sum(r['prediction'] == 'supported_offline' and gold[r['id']] != 'supported_offline' for r in rows)
        false_reject = sum(r['prediction'] != 'supported_offline' and gold[r['id']] == 'supported_offline' for r in rows)
        result[name] = {'n': n, 'accuracy': sum(r['prediction'] == gold[r['id']] for r in rows)/n,
                        'false_acceptance_rate': false_accept/negatives if negatives else None,
                        'false_rejection_rate': false_reject/positives if positives else None,
                        'abstention_rate': sum(r['prediction'] in ('review','invalid','blocked_unverified') for r in rows)/n}
        for key in ('latency_ms','tokens','cost_usd','tool_overhead_ms'):
            values = [r.get(key) for r in rows]
            result[name][key + '_total'] = sum(values) if all(type(v) in (int,float) and v >= 0 for v in values) else None
    return result

if __name__ == '__main__':
    print(json.dumps(compare(json.load(sys.stdin)), indent=2))
