"""Limited ARE exported-trace inspection profile, not full schema validation.

Source: official rendered data_handler.models source, reviewed 2026-10-29.
No model, judge, importer, application code or world-log content is executed.
"""
import hashlib
import json
import math
def strict_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError('Duplicate JSON key: ' + key)
        result[key] = value
    return result


def reject_constant(value):
    raise ValueError('Non-finite JSON constant: ' + value)


MAX_BYTES = 8 * 1024 * 1024


def field_reference(obj, key, pointer, digest):
    """Record presence without copying possibly sensitive payload text."""
    present = key in obj
    return {'presence': 'missing' if not present else
            ('null' if obj[key] is None else 'value'),
            'raw_ref': {'sha256': digest, 'json_pointer': pointer + '/' + key}
            if present else None}


def event_result(event, pointer, digest):
    meta = event.get('metadata')
    if meta is not None and not isinstance(meta, dict):
        raise ValueError('Event metadata must be an object or null')
    parent_presence = ('missing' if 'metadata' not in event else
                       'null' if meta is None else 'value')
    result = {'metadata_presence': parent_presence,
              'outcome': 'unknown', 'return_value': None, 'exception': None}
    if meta is None:
        return result
    for key in ('return_value', 'exception'):
        result[key] = field_reference(meta, key, pointer + '/metadata', digest)
    if 'exception' in meta:
        if meta['exception'] is not None and not isinstance(meta['exception'], str):
            raise ValueError('Event exception must be a string or null')
        result['outcome'] = ('no_exception_reported' if meta['exception'] is None
                             else 'exception_reported')
    return result


def inspect_trace(raw, *, fixture_origin):
    if fixture_origin not in ('synthetic', 'external_unverified'):
        raise ValueError('Explicit origin required')
    if len(raw) > MAX_BYTES:
        raise ValueError('Input exceeds profile size limit')
    trace = json.loads(raw, object_pairs_hook=strict_object,
                       parse_constant=reject_constant)
    if not isinstance(trace, dict) or trace.get('version') != 'are_simulation_v1':
        raise ValueError('Unsupported exported trace version')
    definition = trace['metadata']['definition']
    scenario = definition['scenario_id']
    if not isinstance(scenario, str) or not scenario:
        raise ValueError('Scenario ID required')
    scheduled = trace.get('events', [])
    completed = trace.get('completed_events', [])
    if not isinstance(scheduled, list) or not isinstance(completed, list):
        raise ValueError('Event collections must be arrays')
    if len(scheduled) + len(completed) > 10000:
        raise ValueError('Too many events')
    digest = hashlib.sha256(raw).hexdigest()
    records = []
    seen = set()
    for index, event in enumerate(completed):
        event_id = event['event_id']
        if not isinstance(event_id, str) or not event_id or event_id in seen:
            raise ValueError('Invalid or duplicate completed event ID')
        seen.add(event_id)
        timestamp = event['event_time']
        if type(timestamp) not in (int, float) or not math.isfinite(timestamp):
            raise ValueError('Invalid simulation timestamp')
        if not isinstance(event['event_type'], str):
            raise ValueError('Event type required')
        action = event.get('action')
        if action is not None and not isinstance(action, dict):
            raise ValueError('Action must be an object or null')
        records.append({
            'sequence': index, 'event_id': event_id,
            'event_type': event['event_type'],
            'simulation_event_time': timestamp,
            'raw_ref': {'sha256': digest,
                        'json_pointer': f'/completed_events/{index}'},
            # Payloads and tool arguments deliberately remain only in raw input.
            'action_present': action is not None,
            'result': event_result(event, f'/completed_events/{index}', digest),
        })
    flag = definition.get('has_exception')
    if flag is not None and type(flag) is not bool:
        raise ValueError('Exception flag must be boolean')
    return {
        'profile': 'experimental-are-v1-inspection-0.3',
        'fixture_origin': fixture_origin, 'benchmark_evidence': False,
        'source_format': trace['version'], 'raw_sha256': digest,
        'scenario_id': scenario, 'scheduled_event_count': len(scheduled),
        'completed_event_count': len(completed), 'events': records,
        'reported_exception_flag': flag,
        'execution_outcome': None, 'judge_result': None,
        'wall_duration_seconds': None, 'input_tokens': None,
        'output_tokens': None, 'cost': None,
        'missing_reason': 'not_mapped_by_this_inspection_profile',
        'limits': 'Not full ARE validation; no hf/lite transport compatibility claim; '
                  'no execution success inferred from completed events or false exception flag.',
    }


if __name__ == '__main__':
    import argparse
    from pathlib import Path
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path)
    parser.add_argument('output', type=Path)
    parser.add_argument('--origin', choices=('synthetic', 'external_unverified'), required=True)
    args = parser.parse_args()
    # Bound the read itself, not merely the parsed document.
    with args.input.open('rb') as stream:
        raw = stream.read(MAX_BYTES + 1)
    report = inspect_trace(raw, fixture_origin=args.origin)
    with args.output.open('x', encoding='utf-8') as stream:
        json.dump(report, stream, sort_keys=True, indent=2, allow_nan=False)
        stream.write('\n')
