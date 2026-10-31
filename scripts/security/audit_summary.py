#!/usr/bin/env python3
import json,pathlib,sys
p=pathlib.Path(sys.argv[1]);data=json.loads(p.read_text())
if data.get('error'):
    print('Audit npm non abouti : '+str(data['error'].get('code','erreur')));sys.exit(2)
counts=data.get('metadata',{}).get('vulnerabilities')
if counts is None:raise SystemExit('Rapport npm incomplet.')
for level in ['info','low','moderate','high','critical','total']:print(level+': '+str(counts.get(level,0)))
for name,item in sorted(data.get('vulnerabilities',{}).items()):
    print(name+' : '+item.get('severity','?')+' ; plage npm '+str(item.get('range','?')))
print('Les alertes npm ne prouvent pas une exploitation dans les parcours du site.')
