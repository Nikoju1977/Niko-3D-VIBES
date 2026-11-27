"""Explicit, fail-closed publication; public requires a separate flag. Requires authenticated GitHub CLI."""
import argparse, json, subprocess, sys
REPO='Nikoju1977/Niko-3D-VIBES'
URL='https://github.com/'+REPO+'.git'
def run(*args):
    return subprocess.check_output(args, text=True).strip()
def private_repo(allow_public=False):
    metadata=json.loads(run('gh','api','repos/'+REPO))
    visibility_ok = (metadata.get('private') is True and metadata.get('visibility')=='private') or (allow_public and metadata.get('private') is False and metadata.get('visibility')=='public')
    if metadata.get('full_name','').lower()!=REPO.lower() or not visibility_ok or metadata.get('permissions',{}).get('push') is not True:
        raise RuntimeError('Publication refusée : visibilité autorisée et droit push non confirmés.')
def main():
    parser=argparse.ArgumentParser();parser.add_argument('engine');parser.add_argument('--approve');parser.add_argument('--allow-public',action='store_true');args=parser.parse_args()
    private_repo(args.allow_public)
    if run('git','status','--porcelain'):raise RuntimeError('Arbre de travail non propre.')
    head=run('git','rev-parse','HEAD')
    for cmd in [('node','scripts/code-mode-audit.mjs',args.engine),('python3','scripts/check-secrets.py'),('npm','test'),('npm','run','check'),('python3','scripts/verify.py'),('npm','run','build')]:subprocess.run(cmd,check=True)
    if not args.approve:print('Approbation requise pour le commit '+head);return
    if args.approve!=head or run('git','rev-parse','HEAD')!=head or run('git','status','--porcelain'):raise RuntimeError('Commit non approuvé ou modifié.')
    private_repo(args.allow_public)
    subprocess.run(['git','push',URL,head+':refs/heads/main'],check=True)
if __name__=='__main__':
    try:main()
    except (RuntimeError, ValueError, OSError, subprocess.CalledProcessError) as e:
        print('Publication interrompue : '+str(e),file=sys.stderr);sys.exit(1)
