#!/usr/bin/env python3
"""Execute only generated synthetic Code-node rules offline, without any n8n/provider I/O."""
import json, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'automation-kits'
def run(kit,name,data):
    wf=json.loads((ROOT/kit/'workflows'/f'{name}.json').read_text())
    codes=[n['parameters']['jsCode'] for n in wf['nodes'] if n['type']=='n8n-nodes-base.code'][1:]
    program='let data='+json.dumps(data)+';\n'
    for code in codes:
        program+='data=(function($input){'+code+'})({first:()=>({json:data})})[0].json;\n'
    program+='process.stdout.write(JSON.stringify(data));'
    result=subprocess.run(['node','-e',program],check=True,text=True,capture_output=True)
    return json.loads(result.stdout)
def fixture(kit,name):return json.loads((ROOT/kit/'sample-payloads.json').read_text())[name]
def expect(kit,name,data,status):
    out=run(kit,name,data)
    assert out['status']==status,(kit,name,out['status'],out.get('reason'))
    assert out.get('correlation_id')==data.get('correlation_id')
    return out
k='local-site-leadgen'; n='site-score-preview';d=fixture(k,n)
expect(k,n,d,'DRAFT_ONLY')
x=json.loads(json.dumps(d));x['analyzer_output']['score']=78;expect(k,n,x,'NEEDS_HUMAN_REVIEW')
x=json.loads(json.dumps(d));x['analyzer_output']['ok']=False;expect(k,n,x,'NEEDS_HUMAN_REVIEW')
x=json.loads(json.dumps(d));x['analyzer_output']['score']=-1;expect(k,n,x,'NEEDS_HUMAN_REVIEW')
x=fixture(k,'outreach-review');x['duplicate_found']=True;expect(k,'outreach-review',x,'NEEDS_HUMAN_REVIEW')
k='realestate-lead-desk';n='broker-viewing';d=fixture(k,n);expect(k,n,d,'DRAFT_ONLY');x={**d,'staff_approval':False};expect(k,n,x,'NEEDS_HUMAN_REVIEW')
k='gold-showroom';n='estimate-slip';d=fixture(k,n);out=expect(k,n,d,'DRAFT_ONLY');assert out['action_draft']['estimate']['total']>0
x=json.loads(json.dumps(d));x['estimate_settings']['making_charge_value']='not a number';expect(k,n,x,'NEEDS_HUMAN_REVIEW')
x=json.loads(json.dumps(d));x['weight_grams']=-1;expect(k,n,x,'NEEDS_HUMAN_REVIEW')
x=json.loads(json.dumps(d));x['rate_source']['gold_22k']=-1;expect(k,n,x,'NEEDS_HUMAN_REVIEW')
k='gold-showroom';n='scheme-reminder';d=fixture(k,n);expect(k,n,d,'DRAFT_ONLY')
x={**d,'opted_in':'yes'};expect(k,n,x,'DRAFT_ONLY')
x={**d,'next_due':'2030-01-16'};expect(k,n,x,'NEEDS_HUMAN_REVIEW')
x={**d,'next_due':'2030-01-17T09:00:00Z'};expect(k,n,x,'NEEDS_HUMAN_REVIEW')
x={**d,'duplicate_found':True};expect(k,n,x,'NEEDS_HUMAN_REVIEW')
print('PASS: 16 offline synthetic rule cases (no network, provider calls, sends, or database writes).')
