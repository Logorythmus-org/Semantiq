import json
import unittest
from are_trace_inspection import inspect_trace


class AREProfileTests(unittest.TestCase):
    def setUp(self):
        self.trace = {'version': 'are_simulation_v1',
                      'metadata': {'definition': {'scenario_id': 'synthetic-only',
                                                  'has_exception': False}},
                      'events': [{'event_id': 'planned-only'}],
                      'completed_events': []}

    def inspect(self):
        return inspect_trace(json.dumps(self.trace).encode(), fixture_origin='synthetic')

    def test_planned_is_not_executed(self):
        result = self.inspect()
        self.assertEqual(result['scheduled_event_count'], 1)
        self.assertEqual(result['completed_event_count'], 0)
        self.assertIsNone(result['execution_outcome'])

    def test_completed_event_link_and_no_success_inference(self):
        self.trace['completed_events'] = [{'event_id': 'actual', 'event_type': 'AGENT',
                                         'event_time': 12, 'action': {'args': 'private'}}]
        result = self.inspect()
        self.assertEqual(result['events'][0]['raw_ref']['json_pointer'], '/completed_events/0')
        self.assertNotIn('private', json.dumps(result))
        self.assertIsNone(result['judge_result'])
        self.assertIsNone(result['execution_outcome'])

    def test_doc_example_version_rejected(self):
        self.trace['version'] = '2.0'
        with self.assertRaisesRegex(ValueError, 'version'):
            self.inspect()

    def test_duplicate_completed_id_rejected(self):
        event = {'event_id': 'x', 'event_type': 'AGENT', 'event_time': 0}
        self.trace['completed_events'] = [event, event]
        with self.assertRaisesRegex(ValueError, 'duplicate'):
            self.inspect()

    def test_origin_must_be_explicit(self):
        with self.assertRaises(ValueError):
            inspect_trace(b'{}', fixture_origin='real')

    def test_exception_false_is_not_pass(self):
        result = self.inspect()
        self.assertFalse(result['reported_exception_flag'])
        self.assertIsNone(result['execution_outcome'])

    def event_with(self, **extra):
        self.trace['completed_events'] = [dict(event_id='e', event_type='AGENT',
                                              event_time=0, **extra)]
        return self.inspect()['events'][0]['result']

    def test_missing_metadata_unknown(self):
        self.assertEqual(self.event_with()['metadata_presence'], 'missing')

    def test_null_metadata_distinguished(self):
        self.assertEqual(self.event_with(metadata=None)['metadata_presence'], 'null')

    def test_missing_return_has_no_pointer(self):
        result = self.event_with(metadata={})
        self.assertEqual(result['return_value']['presence'], 'missing')
        self.assertIsNone(result['return_value']['raw_ref'])

    def test_null_return_has_pointer(self):
        result = self.event_with(metadata={'return_value': None, 'exception': None})
        self.assertEqual(result['return_value']['presence'], 'null')
        self.assertEqual(result['return_value']['raw_ref']['json_pointer'],
                         '/completed_events/0/metadata/return_value')
        self.assertEqual(result['outcome'], 'no_exception_reported')

    def test_error_text_not_exposed(self):
        result = self.event_with(metadata={'exception': 'sensitive-error-example'})
        self.assertEqual(result['outcome'], 'exception_reported')
        self.assertNotIn('sensitive-error-example', json.dumps(result))

    def test_empty_exception_is_still_reported(self):
        self.assertEqual(self.event_with(metadata={'exception': ''})['outcome'],
                         'exception_reported')

    def test_invalid_metadata_rejected(self):
        with self.assertRaises(ValueError):
            self.event_with(metadata=[])

    def test_invalid_exception_rejected(self):
        with self.assertRaises(ValueError):
            self.event_with(metadata={'exception': False})


if __name__ == '__main__':
    unittest.main()
