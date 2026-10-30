"""SemantIQ Phase 6: structured multi-claim coherence, offline and side-effect-free.

Not a natural-language parser, truth oracle or source authenticator. A caller cannot
attest its own evidence. All positive verdicts are explicitly offline-relative.
"""
from __future__ import annotations
import hashlib, json
from pathlib import Path
from typing import Any

ROOT=Path(__file__).resolve().parent
OPS={'eq','neq','gt','gte','lt','lte'}
DOMAINS={'nba','software','decision'}
# Release-controlled pin: detects data + adjacent manifest rewriting, not publisher authenticity.
TRUSTED_FIXTURE_SHA256='d75cbaa329d4b449d4ed99a1074c57a8114f8a42560cb3e0930b469b21813951'

class InvalidInput(ValueError):pass
class IntegrityFailure(RuntimeError):pass

def strict_keys(obj, allowed, where):
    if not isinstance(obj,dict):raise InvalidInput(where+' must be object')
    unknown=set(obj)-set(allowed)
    if unknown:raise InvalidInput(where+' unexpected keys: '+', '.join(sorted(unknown)))

def same(a,b):
    return type(a) is type(b) and a==b

def compare(a,operator,b):
    if operator in {'eq','neq'}:
        if type(a) is not type(b):raise InvalidInput('different scalar types cannot be compared')
        s=same(a,b)
        return s if operator=='eq' else not s
    if not (type(a) in (float,int) and type(b) in (float,int)):
        raise InvalidInput('order comparisons need numeric values; booleans excluded')
    return {'gt':lambda:a>b,'gte':lambda:a>=b,'lt':lambda:a<b,'lte':lambda:a<=b}[operator]()

class Runtime:
    def __init__(self,store_dir:Path|None=None):
        store_dir=Path(store_dir or ROOT/'data')
        raw=(store_dir/'offline_facts.json').read_bytes()
        manifest=json.loads((store_dir/'manifest.json').read_text())
        self.digest=hashlib.sha256(raw).hexdigest()
        if self.digest != TRUSTED_FIXTURE_SHA256:raise IntegrityFailure('Fixture differs from release-controlled pin')
        if manifest.get('sha256')!=self.digest:raise IntegrityFailure('Offline fact bundle does not match manifest')
        world=json.loads(raw)
        self.caveat=world['caveat'];self.facts={}
        for item in world['records']:
            fid=item['fact_id']
            if fid in self.facts:raise IntegrityFailure('duplicate fact_id')
            self.facts[fid]=item

    def evaluate(self,packet:dict[str,Any]):
        strict_keys(packet,{'version','domain','claims','input_text','intent'},'packet')
        if packet.get('version') not in ('0.1','0.2'):raise InvalidInput('Unsupported IR version')
        domain=packet.get('domain')
        if not isinstance(domain,str) or domain not in DOMAINS:raise InvalidInput('Unsupported domain')
        claims=packet.get('claims')
        if not isinstance(claims,list) or not 1<=len(claims)<=16:raise InvalidInput('claims length must be 1..16')
        intent=packet.get('intent','inspect')
        if not isinstance(intent,str) or intent not in {'inspect','execute'}:raise InvalidInput('Unknown intent')
        seen=set();individual=[]; contradictions=[]; pending=[]; claims_by_target={}
        for c in claims:
            strict_keys(c,{'id','subject','predicate','operator','value','evidence_ids'},'claim')
            cid=c.get('id');subject=c.get('subject');predicate=c.get('predicate');op=c.get('operator')
            if not all(isinstance(x,str) and 0<len(x)<=128 for x in (cid,subject,predicate,op)):
                raise InvalidInput('Invalid claim id/subject/predicate/operator')
            if cid in seen:raise InvalidInput('duplicate claim id')
            seen.add(cid)
            if op not in OPS:raise InvalidInput('Unsupported operator')
            value=c.get('value')
            if 'value' not in c or type(value) not in (str,bool,int,float):raise InvalidInput('Atomic claim value must be scalar and nonnull')
            if isinstance(value,float) and (value!=value or not -1e308<value<1e308):raise InvalidInput('non-finite number')
            evid=c.get('evidence_ids')
            if not isinstance(evid,list) or any(not isinstance(x,str) for x in evid):raise InvalidInput('evidence_ids must be string list')
            target=(subject,predicate)
            for previous in claims_by_target.get(target,[]):
                if op=='eq' and previous['operator']=='eq' and not same(previous['value'],value):
                    contradictions.append([previous['id'],cid])
            claims_by_target.setdefault(target,[]).append(c)
            fid=f'{domain}:{subject}:{predicate}'
            fact=self.facts.get(fid)
            if not fact:
                verdict='unknown';reason='FACT_NOT_IN_OFFLINE_WORLD'
            elif evid!=[fact['evidence_id']]:
                verdict='unknown';reason='EVIDENCE_SET_NOT_EXACT' 
            else:
                try:yes=compare(fact['value'],op,value)
                except InvalidInput:yes=None
                if yes is True:verdict='supported_offline';reason='ATOMIC_MATCH'
                elif yes is False:verdict='contradicted_offline';reason='ATOMIC_MISMATCH'
                else:verdict='unknown';reason='TYPE_OR_OPERATOR_MISMATCH'
            r={'id':cid,'subject':subject,'predicate':predicate,'verdict':verdict,'reason':reason,'source_class':fact['evidence_class'] if fact else None}
            individual.append(r)
            if verdict=='contradicted_offline':contradictions.append([cid])
            if verdict=='unknown':pending.append(cid)
        # Open-ended text has no certified claim coverage in this prototype.
        raw=packet.get('input_text')
        unverified_text=isinstance(raw,str) and bool(raw.strip())
        if 'input_text' in packet and not isinstance(raw,str):raise InvalidInput('input_text must be string')
        if contradictions:status='contradicted_offline'
        elif pending or unverified_text:status='review'
        else:status='supported_offline'
        if intent=='execute':
            if contradictions:status='blocked_conflict'
            elif pending or unverified_text:status='blocked_unverified'
            else:status='requires_human_approval'
        return {'verdict':status,'claims':individual,'claim_count':len(claims),
                'contradiction_groups':contradictions,'unresolved_claim_ids':pending,
                'narrative_coverage':'unverified' if unverified_text else 'not_supplied',
                'action_allowed':False,'human_approval_required':intent=='execute',
                'evidence_level':'curated_offline_or_synthetic_not_authenticated',
                'data_digest':self.digest,
                'limitations':['IR claims supplied by caller; not independently extracted from open text',
                   'Offline fixture self-hash cannot authenticate its publisher',
                   'No production policy enforcement or actual external actions']}

    def info(self):
        return {'version':'0.2','accepted_packet_versions':['0.1','0.2'],'domains':sorted(DOMAINS),'fact_count':len(self.facts),'sha256':self.digest,
                'coverage':'structured atomic claims only; natural language remains unverified',
                'can_authenticate_source':False,'action_allowed':False}

if __name__=='__main__':
    import sys
    try:print(json.dumps(Runtime().evaluate(json.load(sys.stdin)),ensure_ascii=False,indent=2))
    except (InvalidInput,IntegrityFailure) as e:
        print(json.dumps({'error':type(e).__name__,'message':str(e)}),file=sys.stderr);sys.exit(2)
