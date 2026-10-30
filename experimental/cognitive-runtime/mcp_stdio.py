"""Minimal experimental MCP stdio JSON-RPC subset; not conformance-certified."""
from __future__ import annotations
import json,sys
from semantic_ir import Runtime,InvalidInput

TOOLS=[
 {'name':'semantiq_evaluate_claim_graph','description':'Evaluate bounded structured multi-claim IR against a curated offline or synthetic fact world; never authenticates external sources or takes actions.','annotations':{'readOnlyHint':True,'destructiveHint':False},'inputSchema':{'type':'object','properties':{'packet':{'type':'object'}},'required':['packet'],'additionalProperties':False}},
 {'name':'semantiq_capabilities','description':'Report supported IR version and limitations.','annotations':{'readOnlyHint':True},'inputSchema':{'type':'object','additionalProperties':False}}
]
class Endpoint:
 def __init__(self):self.engine=Runtime()
 def handle(self,msg):
  if not isinstance(msg,dict) or msg.get('jsonrpc')!='2.0':return {'jsonrpc':'2.0','id':None,'error':{'code':-32600,'message':'Invalid Request'}}
  if 'id' not in msg:return None
  mid=msg['id'];method=msg.get('method');params=msg.get('params',{})
  if type(mid) not in (str,int) and mid is not None:return {'jsonrpc':'2.0','id':None,'error':{'code':-32600,'message':'Invalid id'}}
  if not isinstance(method,str):return {'jsonrpc':'2.0','id':mid,'error':{'code':-32600,'message':'Invalid method'}}
  if not isinstance(params,dict):return {'jsonrpc':'2.0','id':mid,'error':{'code':-32602,'message':'params must be object'}}
  try:
   if method=='initialize':
    r={'protocolVersion':'2025-06-18','capabilities':{'tools':{'listChanged':False}},'serverInfo':{'name':'semantiq-cognitive-experimental','version':'0.1.0'}}
   elif method=='ping':r={}
   elif method=='tools/list':r={'tools':TOOLS}
   elif method=='tools/call':
    if not isinstance(params,dict):raise InvalidInput('params must be object')
    name=params.get('name');args=params.get('arguments',{})
    if name=='semantiq_evaluate_claim_graph':
     if not isinstance(args,dict) or set(args)!={'packet'}:raise InvalidInput('packet argument required')
     value=self.engine.evaluate(args['packet'])
    elif name=='semantiq_capabilities':
     if args!={}:raise InvalidInput('no arguments allowed')
     value=self.engine.info()
    else:raise InvalidInput('Unknown tool')
    r={'content':[{'type':'text','text':json.dumps(value,ensure_ascii=False)}],'structuredContent':value,'isError':False}
   else:return {'jsonrpc':'2.0','id':mid,'error':{'code':-32601,'message':'Method not found'}}
   return {'jsonrpc':'2.0','id':mid,'result':r}
  except (ValueError,TypeError,KeyError) as e:
   return {'jsonrpc':'2.0','id':mid,'error':{'code':-32602,'message':str(e)}}

def main():
 endpoint=Endpoint()
 while True:
  line=sys.stdin.buffer.readline(131073)
  if not line:break
  if len(line)>131072:
   while line and not line.endswith(b'\n'):line=sys.stdin.buffer.readline(131073)
   out={'jsonrpc':'2.0','id':None,'error':{'code':-32600,'message':'Message too large'}}
  else:
   try:out=endpoint.handle(json.loads(line))
   except (UnicodeDecodeError,json.JSONDecodeError):out={'jsonrpc':'2.0','id':None,'error':{'code':-32700,'message':'Parse error'}}
  if out is not None:
   sys.stdout.write(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n');sys.stdout.flush()
if __name__=='__main__':main()
