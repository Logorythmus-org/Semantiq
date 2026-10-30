import json
import subprocess
import sys
import unittest
from pathlib import Path
from mcp_stdio import Endpoint, PROTOCOL_VERSION, strict_loads
ROOT = Path(__file__).resolve().parents[1]


def init(e, version=PROTOCOL_VERSION):
    return e.handle({'jsonrpc':'2.0','id':'init','method':'initialize','params':{'protocolVersion':version,'capabilities':{},'clientInfo':{'name':'test-client','version':'1'}}})


def ready(e):
    init(e)
    e.handle({'jsonrpc':'2.0','method':'notifications/initialized'})


class Lifecycle(unittest.TestCase):
    def test_handshake(self):
        e = Endpoint()
        request = {'jsonrpc':'2.0','id':1,'method':'tools/list'}
        self.assertIn('error', e.handle(request))
        self.assertIn('result', init(e))
        self.assertIn('error', e.handle(request))
        self.assertIsNone(e.handle({'jsonrpc':'2.0','method':'notifications/initialized'}))
        self.assertEqual(len(e.handle(request)['result']['tools']), 2)

    def test_version_negotiation(self):
        e = Endpoint()
        self.assertEqual(init(e, '2099-01-01')['result']['protocolVersion'], PROTOCOL_VERSION)
        self.assertIn('error', init(e))

    def test_invalid_initialize_retry(self):
        e = Endpoint()
        self.assertIn('error', e.handle({'jsonrpc':'2.0','id':1,'method':'initialize','params':{}}))
        self.assertEqual(e.state, 'new')
        self.assertIn('result', init(e))

    def test_early_notification(self):
        e = Endpoint()
        self.assertIsNone(e.handle({'jsonrpc':'2.0','method':'notifications/initialized'}))
        self.assertEqual(e.state, 'new')

    def test_bad_id_types(self):
        for mid in (None, True, 1.5, [], {}):
            self.assertEqual(Endpoint().handle({'jsonrpc':'2.0','id':mid,'method':'ping'})['error']['code'], -32600)

    def test_unknown_tool_notification(self):
        e = Endpoint()
        ready(e)
        self.assertIsNone(e.handle({'jsonrpc':'2.0','method':'notifications/cancelled','params':{'requestId':99}}))
        self.assertEqual(e.handle({'jsonrpc':'2.0','id':2,'method':'tools/call','params':{'name':'missing'}})['error']['code'], -32602)

    def test_discovery_schema(self):
        e = Endpoint()
        ready(e)
        req = {'jsonrpc':'2.0','id':1,'method':'tools/list'}
        result = e.handle(req)['result']
        self.assertEqual(result['tools'][0]['inputSchema']['properties']['packet']['properties']['version']['enum'], ['0.1','0.2'])
        result['tools'].clear()
        self.assertEqual(len(e.handle(req)['result']['tools']), 2)

    def test_strict_json(self):
        for text in ('{"x":1,"x":2}', '{"x":NaN}', '{"x":Infinity}', '{"x":1e999}'):
            with self.subTest(text=text), self.assertRaises(ValueError):strict_loads(text)

    def test_parse_failure_recovery(self):
        payload = b'{"jsonrpc":"2.0","id":1,"id":2,"method":"ping"}\n'
        payload += b'['*2000+b']'*2000+b'\n\xff\n'
        payload += b'{"jsonrpc":"2.0","id":9,"method":"ping"}\n'
        p = subprocess.run([sys.executable,str(ROOT/'mcp_stdio.py')], input=payload, capture_output=True, timeout=10)
        self.assertEqual(p.returncode, 0, p.stderr)
        rows = [json.loads(line) for line in p.stdout.splitlines()]
        self.assertEqual([r['error']['code'] for r in rows[:3]], [-32700]*3)
        self.assertEqual(rows[-1]['result'], {})

    def test_direct_consistency(self):
        e = Endpoint()
        ready(e)
        for path in ROOT.glob('samples/*.json'):
            packet = json.loads(path.read_text())
            r = e.handle({'jsonrpc':'2.0','id':path.stem,'method':'tools/call','params':{'name':'semantiq_evaluate_claim_graph','arguments':{'packet':packet}}})['result']
            self.assertEqual(r['structuredContent'], e.engine.evaluate(packet))
            self.assertEqual(json.loads(r['content'][0]['text']),r['structuredContent'])
