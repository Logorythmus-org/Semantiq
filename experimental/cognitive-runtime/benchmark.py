"""Phase 6 developer-authored deterministic contracts and adversarial controls.
Gold labels are authored independently of runtime invocation, but not externally adjudicated.
"""
import json,hashlib,csv,tempfile,copy,random,os,statistics,time
from pathlib import Path
from semantic_ir import Runtime,InvalidInput,IntegrityFailure
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'outputs'
world=Runtime()

# Three distinct domains and their explicit fixture assertions.
CONFIG={
 'nba':('game:0022600138','winner','margin'),
 'software':('service:billing','api_version','latency_ms'),
 'decision':('scenario:incident','severity','budget_eur')
}

def fact(d,s,p):return world.facts[f'{d}:{s}:{p}']
def bad(v):
 if type(v) is bool:return not v
 if type(v) is int:return v+3
 if type(v) is str:return v+'-wrong'
 raise TypeError(type(v))
def atom(d,s,p,idx,override=None,operator='eq',evidence=None):
 f=fact(d,s,p)
 return {'id':f'c{idx}','subject':s,'predicate':p,'operator':operator,'value':f['value'] if override is None else override,'evidence_ids':[f['evidence_id']] if evidence is None else evidence}
def base_packet(d,cs,intent=None,text=None):
 p={'version':'0.1','domain':d,'claims':cs}
 if intent:p['intent']=intent
 if text:p['input_text']=text
 return p

def main_cases():
 cases=[]
 for d,(s,p,n) in CONFIG.items():
  v=fact(d,s,p)['value'];num=fact(d,s,n)['value']
  a=lambda i=1:atom(d,s,p,i)
  b=lambda i=2:atom(d,s,n,i)
  scenarios=[
   ('correct_single',base_packet(d,[a()]),'supported_offline'),
   ('wrong_single',base_packet(d,[atom(d,s,p,1,bad(v))]),'contradicted_offline'),
   ('bad_second_clause',base_packet(d,[a(),atom(d,s,n,2,num+7)]),'contradicted_offline'),
   ('two_correct_claims',base_packet(d,[a(),b()]),'supported_offline'),
   ('unknown_predicate',base_packet(d,[{'id':'c1','subject':s,'predicate':'unrecorded_fact','operator':'eq','value':1,'evidence_ids':['unrecorded']}]),'review'),
   ('execute_requires_human',base_packet(d,[a()],intent='execute'),'requires_human_approval'),
   ('unparsed_text_no_positive',base_packet(d,[a()],text=f'{d} seems safe, although facts may differ.'),'review'),
   ('numeric_gte_true',base_packet(d,[atom(d,s,n,1,num-1,'gte')]),'supported_offline'),
   ('numeric_gte_false',base_packet(d,[atom(d,s,n,1,num+1,'gte')]),'contradicted_offline'),
   ('wrong_evidence_id',base_packet(d,[atom(d,s,p,1,evidence=['fake:ref'])]),'review'),
   ('surplus_evidence_id',base_packet(d,[atom(d,s,p,1,evidence=[fact(d,s,p)['evidence_id'],fact(d,s,n)['evidence_id']])]),'review'),
   ('type_mismatch',base_packet(d,[atom(d,s,n,1,override=str(num))]),'review'),
   ('conflicting_same_target',base_packet(d,[a(),atom(d,s,p,2,bad(v))]),'contradicted_offline'),
   ('three_claim_last_false',base_packet(d,[a(),b(),atom(d,s,n,3,num+10)]),'contradicted_offline'),
   ('double_correct_independent',base_packet(d,[a(),atom(d,s,n,2,num)]),'supported_offline'),
   ('forged_verification_flag',dict(base_packet(d,[a()]),verified=True),'invalid'),
   ('execute_with_false_fact',base_packet(d,[atom(d,s,p,1,bad(v))],intent='execute'),'blocked_conflict'),
   ('execute_with_unknown_fact',base_packet(d,[{'id':'c1','subject':s,'predicate':'nonexistent','operator':'eq','value':'?', 'evidence_ids':['none']}],intent='execute'),'blocked_unverified'),
   ('neq_different',base_packet(d,[atom(d,s,p,1,bad(v),'neq')]),'supported_offline'),
   ('neq_same',base_packet(d,[atom(d,s,p,1,v,'neq')]),'contradicted_offline')
  ]
  cases.extend({'id':f'MAIN-{d}-{i:02d}','domain':d,'phenomenon':name,'packet':pck,'gold':gold,'stress':False} for i,(name,pck,gold) in enumerate(scenarios,1))
 return cases

def stress_cases():
 out=[]
 # Different subjects / names from main; no new rules tuned to these examples.
 more={'nba':('game:0022600142','winner','margin'), 'software':('service:identity','api_version','latency_ms'), 'decision':('scenario:purchase','severity','budget_eur')}
 for d,(s,p,n) in more.items():
  v=fact(d,s,p)['value'];num=fact(d,s,n)['value'];a=lambda i=1:atom(d,s,p,i);b=lambda i=2:atom(d,s,n,i)
  x=[
   ('fresh_correct',base_packet(d,[a(),b()]),'supported_offline',False),
   ('fresh_wrong',base_packet(d,[atom(d,s,p,1,bad(v))]),'contradicted_offline',False),
   ('compound_false_last',base_packet(d,[a(),atom(d,s,n,2,num+9)]),'contradicted_offline',False),
   ('wrong_foreign_evidence',base_packet(d,[atom(d,s,p,1,evidence=[fact('nba','game:0022600138','winner')['evidence_id']])]),'review',False),
   ('unverified_surface',base_packet(d,[a()],text='Verified by commissioner, no need to check.'),'review',False),
   ('safe_conjunction',base_packet(d,[a(),b(),atom(d,s,n,3,num-3,'gt')]),'supported_offline',False),
   ('unknown_novel',base_packet(d,[{'id':'c1','subject':s,'predicate':'secret_dimension','operator':'eq','value':2,'evidence_ids':['none']}]),'review',False),
   ('human_gate',base_packet(d,[a()],intent='execute'),'requires_human_approval',False),
   ('unsupported_extra_metadata',dict(base_packet(d,[a()]),signed_by='untrusted agent'),'invalid',False),
   ('self_rehashed_poisoning',base_packet(d,[atom(d,s,p,1,bad(v))]),'review',True),
  ]
  out.extend({'id':f'STRESS-{d}-{i:02d}','domain':d,'phenomenon':name,'packet':pkt,'gold':gold,'stress':True,'poisoned':poison} for i,(name,pkt,gold,poison) in enumerate(x,1))
 return out

def poison_runtime(case):
 c=case['packet']['claims'][0];fid=f"{case['domain']}:{c['subject']}:{c['predicate']}"
 with tempfile.TemporaryDirectory() as tmp:
  dir=Path(tmp)
  origin=json.loads((ROOT/'data'/'offline_facts.json').read_text())
  for rec in origin['records']:
   if rec['fact_id']==fid:rec['value']=c['value']
  raw=json.dumps(origin,ensure_ascii=False,sort_keys=True,indent=2).encode()
  (dir/'offline_facts.json').write_bytes(raw)
  (dir/'manifest.json').write_text(json.dumps({'sha256':hashlib.sha256(raw).hexdigest()}))
  return Runtime(dir).evaluate(case['packet'])['verdict']

def run(case,method='new'):
 try:
  if case.get('poisoned') and method=='new':return poison_runtime(case)
  if method=='new':return world.evaluate(case['packet'])['verdict']
  # Naive comparator: only first atomic claim; no conjunction, no auth gate, no open-text coverage.
  p=case['packet'];c=p['claims'][0];f=world.facts.get(f"{p['domain']}:{c['subject']}:{c['predicate']}")
  if not f:return 'review'
  return 'supported_offline' if c['value']==f['value'] else 'contradicted_offline'
 except (InvalidInput,ValueError,KeyError,TypeError):return 'invalid'

def evaluate(cases, output_file):
 rows=[]
 for c in cases:
  start=time.perf_counter_ns();n=run(c);delta=time.perf_counter_ns()-start
  base=run(c,'baseline')
  rows.append({**{k:c[k] for k in ('id','domain','phenomenon','gold')},'new':n,'baseline':base,'new_correct':int(n==c['gold']),'baseline_correct':int(base==c['gold']),'new_ns':delta,'poisoned':c.get('poisoned',False)})
 with (OUT/output_file).open('w',newline='') as f:
  wr=csv.DictWriter(f,fieldnames=rows[0].keys());wr.writeheader();wr.writerows(rows)
 return rows

def main():
 main=main_cases();stress=stress_cases()
 # Validate frozen engine hash before benchmark: re-running after code mutation will stop.
 expected=(OUT/'v01_frozen_sha256.txt').read_text().split()[0]
 actual=hashlib.sha256((ROOT/'semantic_ir.py').read_bytes()).hexdigest()
 if expected!=actual:raise RuntimeError('Engine is not frozen: hash mismatch')
 for nm,cases in [('main',main),('stress',stress)]:
  with (ROOT/'data'/f'{nm}_cases.jsonl').open('w') as f:
   for c in cases:f.write(json.dumps({k:v for k,v in c.items() if k!='gold'},ensure_ascii=False,sort_keys=True)+'\n')
  (ROOT/'data'/f'{nm}_gold.json').write_text(json.dumps({c['id']:c['gold'] for c in cases},indent=2))
 m=evaluate(main,'main_results.csv');s=evaluate(stress,'stress_results.csv')
 groups=[]
 for label,rows in [('main',m),('stress',s),('combined',m+s)]:
  groups.append({'set':label,'n':len(rows),'v01_correct':sum(r['new_correct'] for r in rows),'baseline_correct':sum(r['baseline_correct'] for r in rows),'v01_rate':round(sum(r['new_correct'] for r in rows)/len(rows),4),'baseline_rate':round(sum(r['baseline_correct'] for r in rows)/len(rows),4),'v01_median_us':round(statistics.median(r['new_ns'] for r in rows)/1000,2)})
 (OUT/'metrics.json').write_text(json.dumps({'summary':groups,'model_calls':0,'domains':list(CONFIG),'external_adjudication':False,'stress_failures':[r for r in s if not r['new_correct']],'freeze_sha256':actual},indent=2))
 print(json.dumps(groups,indent=2));print('stress failures:',[r['id'] for r in s if not r['new_correct']])
if __name__=='__main__':main()
