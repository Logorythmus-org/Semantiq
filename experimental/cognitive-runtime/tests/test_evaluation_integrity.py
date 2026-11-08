import copy
import io
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from compare_recorded import compare, load_recording
from semantic_ir import IntegrityFailure
from validate_frozen import load_split, validate_case_set
ROOT = Path(__file__).resolve().parents[1]


def recording():
    arm = {'model':'synthetic-fixture-not-inference','settings':{'temperature':0},
           'rows':[{'id':'p','prediction':'supported_offline'}, {'id':'n','prediction':'review'}]}
    return {'gold':{'p':'supported_offline','n':'review'}, 'arms':{k:copy.deepcopy(arm) for k in 'ABC'}}


class ComparisonIntegrity(unittest.TestCase):
    def test_unknown_prediction_and_gold(self):
        for location in ('prediction', 'gold'):
            d = recording()
            if location == 'prediction':d['arms']['A']['rows'][0]['prediction'] = 'MAGIC'
            else:d['gold']['p'] = 'MAGIC'
            with self.assertRaises(ValueError):compare(d)

    def test_case_id_coverage(self):
        for ids in (['p','p'], ['p','extra'], ['p']):
            d = recording()
            d['arms']['A']['rows'] = [{'id':x,'prediction':'review'} for x in ids]
            with self.assertRaises(ValueError):compare(d)

    def test_missing_extra_arms(self):
        for key in ('D','A'):
            d = recording()
            if key == 'D':d['arms'][key] = copy.deepcopy(d['arms']['A'])
            else:del d['arms'][key]
            with self.assertRaises(ValueError):compare(d)

    def test_reject_empty_model_and_settings(self):
        for key, value in [('model',''), ('model','  '), ('settings',[]), ('settings',{'x':float('nan')})]:
            d = recording();d['arms']['B'][key] = value
            with self.assertRaises(ValueError):compare(d)

    def test_settings_type_sensitive(self):
        d = recording();d['arms']['B']['settings']['temperature'] = False
        with self.assertRaises(ValueError):compare(d)

    def test_telemetry_validation(self):
        for key in ('latency_ms','tokens','cost_usd','tool_overhead_ms'):
            for value in (-1, True, float('inf'), float('nan'), '3', 10**400):
                d = recording();d['arms']['A']['rows'][0][key] = value
                with self.subTest(key=key,value=str(value)), self.assertRaises(ValueError):compare(d)
        d = recording();d['arms']['A']['rows'][0]['tokens'] = 1.5
        with self.assertRaises(ValueError):compare(d)

    def test_total_overflow(self):
        d = recording()
        for row in d['arms']['A']['rows']:row['cost_usd'] = 1e308
        with self.assertRaises(ValueError):compare(d)

    def test_partial_telemetry_is_not_zero(self):
        d = recording();d['arms']['A']['rows'][0]['tokens'] = 0
        r = compare(d)['A']
        self.assertIsNone(r['tokens_total']);self.assertEqual(r['tokens_measured_count'],1)
        d['arms']['A']['rows'][1]['tokens'] = 3
        self.assertEqual(compare(d)['A']['tokens_total'],3)

    def test_paired_outcomes_match_case_ids(self):
        d = recording();d['arms']['A']['rows'][0]['prediction'] = 'review'
        d['arms']['B']['rows'].reverse()
        d['arms']['C']['rows'][1]['prediction'] = 'supported_offline'
        p = compare(d)['paired']
        self.assertEqual(p['B_minus_A'],{'improved_count':1,'regressed_count':0,'accuracy_delta':0.5})
        self.assertEqual(p['C_minus_B']['accuracy_delta'],-0.5)

    def test_rejection_and_abstention_disaggregated(self):
        d = recording();d['arms']['A']['rows'][0]['prediction'] = 'review'
        r = compare(d)['A']
        self.assertEqual(r['false_rejection_count'],1)
        self.assertEqual(r['abstention_on_positive_count'],1)
        self.assertEqual(r['hard_rejection_on_positive_count'],0)

    def test_zero_denominators(self):
        d = recording();d['gold'] = {'p':'review','n':'review'}
        self.assertIsNone(compare(d)['A']['false_rejection_rate'])

    def test_duplicate_json_and_cli_failure(self):
        with self.assertRaises(ValueError):load_recording(io.StringIO('{"gold":{},"gold":{}}'))
        p = subprocess.run([sys.executable,str(ROOT/'compare_recorded.py')],input='{"gold":{},"arms":{}}',text=True,capture_output=True,timeout=10)
        self.assertEqual(p.returncode,2);self.assertEqual(p.stdout,'')
        self.assertEqual(json.loads(p.stderr),{'error':'Invalid comparison recording'})


class FrozenInputIntegrity(unittest.TestCase):
    def test_archived_splits(self):
        for name,count in [('main',60),('stress',30)]:
            cases,gold = load_split(ROOT,name)
            self.assertEqual(len(cases),count);self.assertEqual(len(gold),count)

    def test_digest_rejects_changed_or_empty_input(self):
        for raw in (b'',b'{}\n'):
            with tempfile.TemporaryDirectory() as tmp:
                r = Path(tmp);(r/'data').mkdir();(r/'data/main_cases.jsonl').write_bytes(raw)
                with self.assertRaises(IntegrityFailure):load_split(r,'main')

    def test_case_set_shape_and_labels(self):
        case = {'id':'one','packet':{}}
        for cases,gold,n in [([],{},0), ([case,case],{'one':'review'},2),
                              ([case],{'other':'review'},1), ([case],{'one':'invented'},1),
                              ([dict(case,poisoned='yes')],{'one':'review'},1)]:
            with self.assertRaises(ValueError):validate_case_set(cases,gold,n)

    def test_strict_gold_reader(self):
        with self.assertRaises(ValueError):load_recording(io.StringIO('{"one":"review","one":"supported_offline"}'))
