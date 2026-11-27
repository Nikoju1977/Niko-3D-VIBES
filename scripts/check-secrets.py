"""Heuristic pre-publication scan. Never prints matched secret contents."""
from pathlib import Path
import re, subprocess, sys
root = Path(__file__).resolve().parents[1]
patterns = [
    re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----'),
    re.compile(r'\b(?:ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9]{30,}\b'),
    re.compile(r'\bgithub_pat_[A-Za-z0-9_]{40,}\b'),
    re.compile(r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b'),
    re.compile(r'\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}\b'),
]
paths = subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0')
findings=[]
for name in filter(None, paths):
    p=root/name
    if p.name.startswith('.env') and p.name != '.env.example' or p.suffix.lower() in {'.pem','.key','.p12','.pfx'} or p.name in {'credentials.json','secrets.json','.npmrc','.envrc'}:
        findings.append((name, 'sensitive filename')); continue
    if not p.is_file() or p.is_symlink(): continue
    try: content=p.read_text(encoding='utf-8')
    except UnicodeDecodeError: continue
    for n,line in enumerate(content.splitlines(),1):
        if any(pattern.search(line) for pattern in patterns): findings.append((name, f'line {n}: possible secret'))
for name, reason in findings: print(f'{name}: {reason}', file=sys.stderr)
if findings: sys.exit(1)
print('Tracked files: no known secret patterns found (heuristic only)')
