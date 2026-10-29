#!/usr/bin/env python3
"""Inventorie les scripts HTML CDN sans executer le code applicatif."""
import argparse,collections,html.parser,json,pathlib,re,sys,urllib.parse
EXACT=re.compile(r'\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?\Z')
SPEC=re.compile(r'(?P<name>@[^/@]+/[^/@]+|[^/@]+)@(?P<version>[^/]+)(?:/|$)')
class Scripts(html.parser.HTMLParser):
    def __init__(self):super().__init__();self.urls=[]
    def handle_starttag(self,tag,attrs):
        if tag=='script':
            value=dict(attrs).get('src','')
            if value.startswith(('https://','http://','//')):self.urls.append(value)
def dependency(url):
    u=urllib.parse.urlsplit('https:'+url if url.startswith('//') else url)
    if u.scheme!='https':raise ValueError('Script externe sans HTTPS')
    path=urllib.parse.unquote(u.path).lstrip('/')
    if u.hostname=='cdn.jsdelivr.net' and path.startswith('npm/'):path=path[4:]
    elif u.hostname not in ['unpkg.com','esm.sh']:raise ValueError('Hote de script non couvert')
    m=SPEC.match(path)
    if not m:raise ValueError('Paquet ou version absent de l URL')
    name,version=m.group('name','version')
    if not re.fullmatch(r'(?:@[a-z0-9._-]+/)?[a-z0-9._-]+',name):raise ValueError('Nom npm invalide')
    if not re.fullmatch(r'[A-Za-z0-9.*^~+_-]+',version):raise ValueError('Version npm non prise en charge')
    return name,version

def inventory(root):
    found=collections.defaultdict(set);locations=collections.defaultdict(list);unsupported=[];jsr=[]
    for f in sorted(root.rglob('*')):
        rel=f.relative_to(root)
        if any(p in ['.git','node_modules','.security-audit'] for p in rel.parts) or not f.is_file():continue
        if f.suffix=='.html':
            parser=Scripts();parser.feed(f.read_text(errors='replace'))
            for url in parser.urls:
                try:name,version=dependency(url)
                except ValueError as e:unsupported.append({'file':str(rel),'reason':str(e)});continue
                found[name].add(version);locations[name].append(str(rel))
        elif f.suffix in ['.ts','.js','.mjs']:
            text=f.read_text(errors='replace')
            jsr.extend({'file':str(rel),'import':v} for v in re.findall(r'[\"\'](jsr:[^\"\']+)[\"\']',text))
    deps={};floating=[]
    for name,versions in sorted(found.items()):
        if len(versions)!=1:
            unsupported.append({'package':name,'reason':'Plusieurs versions : '+', '.join(sorted(versions))});continue
        version=next(iter(versions));deps[name]=version
        if not EXACT.fullmatch(version):floating.append({'package':name,'version':version})
    return {'dependencies':deps,'floating':floating,'unsupported':unsupported,'jsr_not_audited_by_npm':jsr,
            'locations':{k:sorted(set(v)) for k,v in sorted(locations.items())}}
def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',type=pathlib.Path,default=pathlib.Path('.'))
    ap.add_argument('--output',type=pathlib.Path,default=pathlib.Path('.security-audit'))
    ap.add_argument('--strict',action='store_true');a=ap.parse_args();report=inventory(a.root.resolve())
    a.output.mkdir(parents=True,exist_ok=True)
    (a.output/'inventory.json').write_text(json.dumps(report,indent=2)+'\n')
    manifest={'name':'rebondplay-cdn-security-audit','version':'1.0.0','private':True,'dependencies':report['dependencies']}
    (a.output/'package.json').write_text(json.dumps(manifest,indent=2)+'\n')
    for name,version in report['dependencies'].items():print(name+'@'+version)
    for x in report['floating']:print('VERSION FLOTTANTE : '+x['package']+'@'+x['version'])
    for x in report['unsupported']:print('NON COUVERT : '+json.dumps(x))
    if report['jsr_not_audited_by_npm']:print('NON COUVERT PAR NPM : '+str(len(report['jsr_not_audited_by_npm']))+' imports JSR ; revue separee necessaire.')
    if not report['dependencies']:print('Aucune dependance CDN reconnue : controle incomplet.');return 2
    if report['unsupported']:return 2
    if a.strict and (report['floating'] or report['jsr_not_audited_by_npm']):return 1
    return 0
if __name__=='__main__':sys.exit(main())
