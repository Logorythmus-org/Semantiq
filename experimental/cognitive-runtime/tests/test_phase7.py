import copy
import json
import subprocess
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from semantic_ir import Runtime, InvalidInput
ROOT = Path(__file__).resolve().parents[1]

class Phase7(unittest.TestCase):
    def setUp(self):
        self.packet = json.loads((ROOT / 'samples/nba_multi_claim.json').read_text())
        self.engine = Runtime()

    def test_schema_invalid_inputs(self):
        for key, value in [('domain', []), ('intent', {}), ('input_text', None)]:
            with self.subTest(key=key):
                packet = copy.deepcopy(self.packet)
                packet[key] = value
                with self.assertRaises(InvalidInput):
                    self.engine.evaluate(packet)

    def test_non_json_python_values(self):
        for value in [(), set(), object(), None, float('nan'), float('inf')]:
            packet = copy.deepcopy(self.packet)
            packet['claims'][0]['value'] = value
            with self.subTest(value=repr(value)), self.assertRaises(InvalidInput):
                self.engine.evaluate(packet)

    def test_missing_value(self):
        del self.packet['claims'][0]['value']
        with self.assertRaises(InvalidInput):
            self.engine.evaluate(self.packet)

    def test_nonadjacent_conflicts_unknown_target(self):
        claim = self.packet['claims'][0]
        claim.update(subject='unknown', predicate='unknown', operator='eq', value='A')
        second = dict(claim, id='middle', operator='neq', value='C')
        last = dict(claim, id='last', value='B')
        self.packet['claims'] = [claim, second, last]
        result = self.engine.evaluate(self.packet)
        self.assertEqual(result['verdict'], 'contradicted_offline')
        self.assertIn([claim['id'], 'last'], result['contradiction_groups'])

    def test_process_survives_invalid_packets(self):
        requests = [{'jsonrpc':'2.0', 'id':i, 'method':'tools/call', 'params':{'name':'semantiq_evaluate_claim_graph','arguments':{'packet':dict(self.packet, domain=[])}}} for i in range(3)]
        requests += [{'jsonrpc':'2.0','id':5,'method':'ping'}, {'jsonrpc':'2.0','id':6,'method':'ping','params':[]}, {'jsonrpc':'2.0','id':7,'method':'tools/call','params':{'name':'semantiq_capabilities','arguments':False}}]
        requests = [{'jsonrpc':'2.0','id':'init','method':'initialize','params':{'protocolVersion':'2025-06-18','capabilities':{},'clientInfo':{'name':'test','version':'1'}}}, {'jsonrpc':'2.0','method':'notifications/initialized'}] + requests
        p = subprocess.run([sys.executable, str(ROOT/'mcp_stdio.py')], input='\n'.join(map(json.dumps, requests))+'\n', text=True, capture_output=True, timeout=10)
        self.assertEqual(p.returncode, 0, p.stderr)
        replies = [json.loads(line) for line in p.stdout.splitlines()][1:]
        self.assertEqual(len(replies), 6)
        self.assertEqual(replies[3]['result'], {})
        for i in [0,1,2,4,5]:
            self.assertEqual(replies[i]['error']['code'], -32602)

    def test_v02_and_no_actions(self):
        self.packet['version'] = '0.2'
        self.assertFalse(self.engine.evaluate(self.packet)['action_allowed'])

    def test_oversize_recovers(self):
        p = subprocess.run([sys.executable, str(ROOT/'mcp_stdio.py')], input='x'*140000+'\n'+json.dumps({'jsonrpc':'2.0','id':1,'method':'ping'})+'\n', text=True, capture_output=True, timeout=10)
        replies = list(map(json.loads, p.stdout.splitlines()))
        self.assertEqual(len(replies), 2)
        self.assertEqual(replies[1]['result'], {})
