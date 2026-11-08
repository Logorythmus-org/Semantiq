import json,sys,unittest,subprocess,tempfile,hashlib
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from semantic_ir import Runtime,InvalidInput,IntegrityFailure
from benchmark import main_cases,stress_cases,run
ROOT=Path(__file__).resolve().parents[1]
class Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.r=Runtime()
 def test_main_gold(self):
  for c in main_cases():
   with self.subTest(c=c['id']):self.assertEqual(run(c),c['gold'])
 def test_fresh_stress_except_known_provenance_boundary(self):
  for c in stress_cases():
   if c.get('poisoned'):continue
   with self.subTest(c=c['id']):self.assertEqual(run(c),c['gold'])
 def test_three_forged_worlds_remain_unsafe(self):
  for c in stress_cases():
   if c.get('poisoned'):
    with self.assertRaises(IntegrityFailure):run(c)
    self.assertEqual(c['gold'],'review')
 def test_schema_unknown_fields_rejected(self):
  p=main_cases()[0]['packet'].copy();p['signed_by']='agent'
  with self.assertRaises(InvalidInput):self.r.evaluate(p)
 def test_duplicate_claim_id_rejected(self):
  p=main_cases()[0]['packet'].copy();p['claims']=p['claims']+p['claims']
  with self.assertRaises(InvalidInput):self.r.evaluate(p)
 def test_unparsed_narrative_not_supported(self):
  p=main_cases()[0]['packet'].copy();p['input_text']='Winner declared; plus unverified facts.'
  self.assertEqual(self.r.evaluate(p)['verdict'],'review')
 def test_forged_evidence_not_admitted(self):
  self.assertEqual(run(next(c for c in main_cases() if c['phenomenon']=='forged_verification_flag')),'invalid')
 def test_execute_never_allows_side_effect(self):
  for c in main_cases():
   if c['packet'].get('intent')=='execute':
    x=self.r.evaluate(c['packet']);self.assertFalse(x['action_allowed']);self.assertTrue(x['human_approval_required'])
 def test_mutation_detected_before_rehash(self):
  with tempfile.TemporaryDirectory() as d:
   d=Path(d);raw=(ROOT/'data'/'offline_facts.json').read_bytes()
   (d/'offline_facts.json').write_bytes(raw+b' ')
   (d/'manifest.json').write_bytes((ROOT/'data'/'manifest.json').read_bytes())
   with self.assertRaises(IntegrityFailure):Runtime(d)
 def test_no_external_system_calls(self):
  self.assertFalse(self.r.info()['action_allowed'])
  self.assertFalse(self.r.info()['can_authenticate_source'])
 def test_all_three_domains_available(self):self.assertEqual(set(self.r.info()['domains']),{'nba','software','decision'})
 def test_mcp_real_subprocess_30_calls(self):
  cases=stress_cases()
  requests=[{'jsonrpc':'2.0','id':1,'method':'initialize','params':{'protocolVersion':'2025-06-18','capabilities':{},'clientInfo':{'name':'phase6-regression','version':'1'}}},
            {'jsonrpc':'2.0','method':'notifications/initialized'},
            {'jsonrpc':'2.0','id':2,'method':'tools/list'}]
  for i,c in enumerate(cases,3):
   requests.append({'jsonrpc':'2.0','id':i,'method':'tools/call','params':{'name':'semantiq_evaluate_claim_graph','arguments':{'packet':c['packet']}}})
  stream='\n'.join(json.dumps(x) for x in requests)+'\n'
  p=subprocess.run([sys.executable,str(ROOT/'mcp_stdio.py')],input=stream,text=True,capture_output=True,timeout=20,cwd=ROOT)
  self.assertEqual(p.returncode,0,p.stderr)
  replies=[json.loads(x) for x in p.stdout.splitlines()]
  self.assertEqual(len(replies),32)
  self.assertEqual(len(replies[1]['result']['tools']),2)
  for case,reply in zip(cases,replies[2:]):
   if case['phenomenon']=='unsupported_extra_metadata':
    self.assertEqual(reply['error']['code'],-32602)
    continue
   self.assertIn('structuredContent',reply['result'])
   self.assertEqual(reply['result']['structuredContent']['verdict'],self.r.evaluate(case['packet'])['verdict'])
   self.assertFalse(reply['result']['structuredContent']['action_allowed'])
 def test_mcp_bad_json(self):
  p=subprocess.run([sys.executable,str(ROOT/'mcp_stdio.py')],input='{oops\n',text=True,capture_output=True,timeout=10,cwd=ROOT)
  self.assertEqual(json.loads(p.stdout)['error']['code'],-32700)
if __name__=='__main__':unittest.main()
