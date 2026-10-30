"""Offline A/B/C analysis. Validates records; cannot attest their provenance.

No API calls. False rejection retains the historical acceptance-class definition:
any non-supported_offline prediction on supported_offline gold, including abstention.
Hard rejection and abstention-on-positive are also reported separately.
"""
import json
import math
import sys

LABELS = {'supported_offline', 'contradicted_offline', 'review', 'invalid',
          'blocked_conflict', 'blocked_unverified', 'requires_human_approval'}
ABSTAIN = {'review', 'invalid', 'blocked_unverified'}
HARD_REJECT = {'contradicted_offline', 'blocked_conflict'}
TELEMETRY = ('latency_ms', 'tokens', 'cost_usd', 'tool_overhead_ms')


def finite(value):
    try:
        return math.isfinite(value)
    except OverflowError:
        return False


def canonical(value):
    """Type-sensitive JSON comparison: True and 1 must not compare equal."""
    if type(value) not in (dict, list, str, int, float, bool, type(None)):
        raise ValueError('Settings must be JSON values')
    if isinstance(value, dict):
        if any(type(k) is not str for k in value):
            raise ValueError('JSON keys must be strings')
        for v in value.values():
            canonical(v)
    elif isinstance(value, list):
        for v in value:
            canonical(v)
    return json.dumps(value, sort_keys=True, allow_nan=False, separators=(',', ':'))


def load_recording(stream):
    def pairs(items):
        obj = {}
        for key, value in items:
            if key in obj:
                raise ValueError('Duplicate JSON member')
            obj[key] = value
        return obj

    def constant(value):
        raise ValueError('Nonstandard JSON number')

    return json.load(stream, object_pairs_hook=pairs, parse_constant=constant)


def compare(data):
    if not isinstance(data, dict):
        raise ValueError('Recording must be object')
    gold = data.get('gold')
    arms = data.get('arms')
    if not isinstance(gold, dict) or not gold:
        raise ValueError('Nonempty gold mapping required')
    if any(type(k) is not str or not k or type(v) is not str or v not in LABELS for k, v in gold.items()):
        raise ValueError('Invalid gold IDs or labels')
    if not isinstance(arms, dict) or set(arms) != {'A', 'B', 'C'}:
        raise ValueError('Exactly A/B/C arms required')
    reference = None
    result = {}
    correct = {}
    for name in ('A', 'B', 'C'):
        arm = arms[name]
        if not isinstance(arm, dict) or not isinstance(arm.get('model'), str) or not arm['model'].strip():
            raise ValueError('Nonempty model ID required')
        if not isinstance(arm.get('settings'), dict):
            raise ValueError('Settings object required')
        identity = (arm['model'], canonical(arm['settings']))
        if reference is None:
            reference = identity
        if identity != reference:
            raise ValueError('Model/settings must match across arms')
        rows = arm.get('rows')
        if not isinstance(rows, list) or len(rows) != len(gold):
            raise ValueError('Exactly one row per labeled case required')
        ids = []
        for row in rows:
            if not isinstance(row, dict) or type(row.get('id')) is not str:
                raise ValueError('Row must have string case ID')
            if type(row.get('prediction')) is not str or row['prediction'] not in LABELS:
                raise ValueError('Unsupported prediction label')
            ids.append(row['id'])
            for key in TELEMETRY:
                value = row.get(key)
                if value is None:
                    continue
                if type(value) not in (int, float) or not finite(value) or value < 0:
                    raise ValueError('Telemetry must be finite and nonnegative')
                if key == 'tokens' and type(value) is not int:
                    raise ValueError('Token count must be integer')
        if len(set(ids)) != len(ids) or set(ids) != set(gold):
            raise ValueError('Missing, extra or duplicate case IDs')
        n = len(rows)
        positives = sum(v == 'supported_offline' for v in gold.values())
        negatives = n - positives
        fa = sum(r['prediction'] == 'supported_offline' and gold[r['id']] != 'supported_offline' for r in rows)
        fr = sum(r['prediction'] != 'supported_offline' and gold[r['id']] == 'supported_offline' for r in rows)
        correct[name] = {r['id']: r['prediction'] == gold[r['id']] for r in rows}
        result[name] = {'n': n, 'accuracy': sum(correct[name].values())/n,
                        'positive_gold_count': positives, 'negative_gold_count': negatives,
                        'false_acceptance_count': fa, 'false_rejection_count': fr,
                        'false_acceptance_rate': fa/negatives if negatives else None,
                        'false_rejection_rate': fr/positives if positives else None,
                        'hard_rejection_on_positive_count': sum(r['prediction'] in HARD_REJECT and gold[r['id']] == 'supported_offline' for r in rows),
                        'abstention_on_positive_count': sum(r['prediction'] in ABSTAIN and gold[r['id']] == 'supported_offline' for r in rows),
                        'abstention_rate': sum(r['prediction'] in ABSTAIN for r in rows)/n}
        for key in TELEMETRY:
            values = [r.get(key) for r in rows]
            measured = [v for v in values if v is not None]
            total = sum(measured)
            if not finite(total):
                raise ValueError('Telemetry total overflow')
            result[name][key + '_measured_count'] = len(measured)
            result[name][key + '_total'] = total if len(measured) == n else None
    paired = {}
    for before, after in (('A', 'B'), ('B', 'C')):
        improved = sum(not correct[before][key] and correct[after][key] for key in gold)
        regressed = sum(correct[before][key] and not correct[after][key] for key in gold)
        paired[after + '_minus_' + before] = {'improved_count': improved, 'regressed_count': regressed,
                                            'accuracy_delta': (improved-regressed)/len(gold)}
    result['paired'] = paired
    return result


if __name__ == '__main__':
    try:
        print(json.dumps(compare(load_recording(sys.stdin)), indent=2, allow_nan=False))
    except (ValueError, TypeError, KeyError, OverflowError, RecursionError):
        print(json.dumps({'error':'Invalid comparison recording'}), file=sys.stderr)
        sys.exit(2)
