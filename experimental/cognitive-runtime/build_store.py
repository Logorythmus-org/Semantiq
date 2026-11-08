"""Create curated offline test world (NBA derived from earlier pilot; other domains synthetic)."""
import json,hashlib
from pathlib import Path
ROOT=Path(__file__).resolve().parent
nba=json.loads((ROOT.parent/'semantiq_nba_phase5'/'reference_catalog.json').read_text())
records=[]
def put(domain,subject,predicate,value,label,kind='curated_offline'):
    fid=f'{domain}:{subject}:{predicate}'
    records.append({'fact_id':fid,'domain':domain,'subject':subject,'predicate':predicate,'value':value,'evidence_id':fid,'evidence_class':kind,'label':label})
for game_id,g in nba.items():
    s='game:'+game_id
    win=g['away'] if g['away_total']>g['home_total'] else g['home']
    facts={'winner':win,'margin':abs(g['away_total']-g['home_total']),'overtime':g['overtime'],'away_team':g['away'],'home_team':g['home'],'away_score':g['away_total'],'home_score':g['home_total'],'period_count':len(g['away_periods']),'score_sum':g['away_total']+g['home_total']}
    for k,v in facts.items():put('nba',s,k,v,g['source'])
software={
    'service:billing':{'tests_pass':False,'api_version':'v2','breaking_change':True,'rollback_available':True,'owner':'team-core','deploy_approved':False,'latency_ms':900},
    'service:search':{'tests_pass':True,'api_version':'v3','breaking_change':False,'rollback_available':True,'owner':'team-query','deploy_approved':False,'latency_ms':220},
    'service:identity':{'tests_pass':True,'api_version':'v1','breaking_change':True,'rollback_available':False,'owner':'team-security','deploy_approved':False,'latency_ms':160},
    'service:reporting':{'tests_pass':False,'api_version':'v2','breaking_change':False,'rollback_available':True,'owner':'team-data','deploy_approved':False,'latency_ms':700}}
for s,fs in software.items():
    for k,v in fs.items():put('software',s,k,v,'synthetic software fixture','synthetic')
decision={
    'scenario:incident':{'severity':'high','reversible':False,'data_sufficient':False,'human_approval':False,'budget_eur':900,'hold_option':True},
    'scenario:rollout':{'severity':'low','reversible':True,'data_sufficient':True,'human_approval':False,'budget_eur':120,'hold_option':True},
    'scenario:purchase':{'severity':'medium','reversible':True,'data_sufficient':False,'human_approval':False,'budget_eur':1500,'hold_option':True},
    'scenario:backup':{'severity':'low','reversible':True,'data_sufficient':True,'human_approval':True,'budget_eur':20,'hold_option':False}}
for s,fs in decision.items():
    for k,v in fs.items():put('decision',s,k,v,'synthetic decision fixture','synthetic')
obj={'schema_version':'0.1','records':records,'caveat':'NBA curated offline; software and decisions synthetic. No host-source attestation, truth guarantees, or actual-world execution.'}
b=json.dumps(obj,ensure_ascii=False,indent=2,sort_keys=True).encode()
(ROOT/'data'/'offline_facts.json').write_bytes(b)
(ROOT/'data'/'manifest.json').write_text(json.dumps({'file':'offline_facts.json','sha256':hashlib.sha256(b).hexdigest(),'integrity_scope':'self-bundle only, not independent authentication'},indent=2))
print(len(records),'facts')
