#!/usr/bin/env python3
"""Controle manuel, en lecture, des RPC de tableau de bord sur deux fixtures."""
import argparse,json,os,pathlib,re,sys,urllib.error,urllib.parse,urllib.request,uuid
FUNCTIONS=['rebond_session_dashboard','rebond_session_dashboard_v2']
def rpc(base,key,name,payload):
    req=urllib.request.Request(base+'/rest/v1/rpc/'+name,data=json.dumps(payload).encode(),
       headers={'apikey':key,'Content-Type':'application/json'},method='POST')
    try:
        with urllib.request.urlopen(req,timeout=15) as r:return r.status,json.load(r)
    except urllib.error.HTTPError as e:
        try:return e.code,json.load(e)
        except (ValueError,TypeError):return e.code,None

def verify(fixtures,key,call=rpc):
    base=fixtures['project_url'].rstrip('/')
    if not re.fullmatch(r'https://[a-z0-9]+\.supabase\.co',base):raise ValueError('URL Supabase HTTPS attendue.')
    if not key.startswith('sb_publishable_'):raise ValueError('Cle publique publishable attendue ; jamais service_role.')
    a,b=fixtures['A'],fixtures['B']
    if a['code']==b['code'] or a['management_token']==b['management_token']:raise ValueError('Deux sessions et cles distinctes sont necessaires.')
    for item in [a,b]:
        uuid.UUID(item['management_token'])
        if not item['team_name'].startswith('AUDIT-'):raise ValueError('Equipes fictives AUDIT- requises.')
    cases=[('bonne_A',a,a['management_token'],True),('bonne_B',b,b['management_token'],True),
           ('A_cle_B',a,b['management_token'],False),('B_cle_A',b,a['management_token'],False),
           ('aleatoire',a,str(uuid.uuid4()),False),('NULL',a,None,False),('vide',a,'',False),('mal_formee',a,'AUDIT-INVALIDE',False)]
    results=[]
    for fn in FUNCTIONS:
        for label,session,token,allowed in cases:
            status,data=call(base,key,fn,{'p_session_code':session['code'],'p_management_token':token})
            rows=data if isinstance(data,list) else []
            ok=(status==200 and len(rows)==1 and rows[0].get('team_name')==session['team_name']) if allowed else (
                status==400 and isinstance(data,dict) and data.get('code')=='P0001' and data.get('message')=='Accès refusé')
            results.append({'fonction':fn,'cas':label,'statut':status,'conforme':ok})
    # Detection de regression AUD-03 : ne jamais imprimer le jeton recupere.
    status,data=call(base,key,'rebond_retrouver_session',{'p_session_code':a['code']})
    leak=isinstance(data,list) and any(isinstance(row,dict) and row.get('management_token') for row in data)
    refused=status in [401,403] or (status==400 and isinstance(data,dict) and data.get('message')=='Accès refusé')
    safe_rows=status==200 and isinstance(data,list) and not leak
    results.append({'fonction':'rebond_retrouver_session','cas':'aucune_cle_gestion_anonyme','statut':status,'conforme':refused or safe_rows})
    return results

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--fixtures',type=pathlib.Path,required=True);a=p.parse_args()
    key=os.environ.get('AUDIT_PUBLIC_KEY','')
    try:results=verify(json.loads(a.fixtures.read_text()),key)
    except (KeyError,ValueError,OSError,urllib.error.URLError) as e:
        print('Controle incomplet ('+type(e).__name__+'). Verifier configuration et connectivite ; aucun secret affiche.');return 2
    for row in results:print(json.dumps(row,ensure_ascii=False))
    return 0 if all(r['conforme'] for r in results) else 1
if __name__=='__main__':sys.exit(main())
