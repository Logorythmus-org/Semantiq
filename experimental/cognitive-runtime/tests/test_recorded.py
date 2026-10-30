import copy
import unittest
from compare_recorded import compare

class Recorded(unittest.TestCase):
    def test_metrics_and_missing_telemetry(self):
        arm = {'model':'fixture-only-not-inference','settings':{},'rows':[{'id':'1','prediction':'supported_offline'},{'id':'2','prediction':'review'}]}
        data = {'gold':{'1':'review','2':'supported_offline'},'arms':{k:copy.deepcopy(arm) for k in 'ABC'}}
        result = compare(data)
        self.assertEqual(result['A']['false_acceptance_rate'], 1)
        self.assertEqual(result['A']['false_rejection_rate'], 1)
        self.assertIsNone(result['A']['tokens_total'])
        data['arms']['C']['model'] = 'different'
        with self.assertRaises(ValueError):compare(data)
