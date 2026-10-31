#!/usr/bin/env python3
"""Installation locale du binaire officiel Linux x64, version et SHA-256 figes."""
import argparse,hashlib,io,pathlib,platform,tarfile,urllib.request
VERSION='8.30.1'
SHA256='551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb'
URL=f'https://github.com/gitleaks/gitleaks/releases/download/v{VERSION}/gitleaks_{VERSION}_linux_x64.tar.gz'
def main():
    p=argparse.ArgumentParser();p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args()
    if platform.system()!='Linux' or platform.machine() not in ['x86_64','AMD64']:p.error('Binaire prevu pour Linux x64 uniquement.')
    with urllib.request.urlopen(URL,timeout=60) as r:archive=r.read(50*1024*1024+1)
    if len(archive)>50*1024*1024 or hashlib.sha256(archive).hexdigest()!=SHA256:raise SystemExit('Archive Gitleaks refusee : taille ou empreinte incorrecte.')
    with tarfile.open(fileobj=io.BytesIO(archive),mode='r:gz') as t:
        member=t.getmember('gitleaks')
        if not member.isfile():raise SystemExit('Binaire Gitleaks absent.')
        binary=t.extractfile(member).read()
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_bytes(binary);a.output.chmod(0o755)
    print('Gitleaks '+VERSION+' installe ; empreinte SHA-256 verifiee.')
if __name__=='__main__':main()
