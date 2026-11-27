from pathlib import Path
from html.parser import HTMLParser
import json, ast, re
class Parser(HTMLParser):
    def __init__(self): super().__init__(); self.ids=[]; self.files=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        for k in ('src','href'):
            if k in a and not re.match(r'^(https?:|#|data:)',a[k]):self.files.append(a[k])
p=Parser();p.feed(Path('index.html').read_text());ids=p.ids
assert len(ids)==len(set(ids)), 'duplicate DOM IDs'
for f in p.files:assert Path(f).is_file(),f
for f in ['app.js','advanced.js','scene.js']:
    for id in re.findall(r"\$\('([^']+)'\)",Path(f).read_text()):assert id in ids,id
for icon in json.loads(Path('manifest.webmanifest').read_text())['icons']:assert Path(icon['src']).is_file()
for f in re.findall(r"'\./([^']*)'",Path('sw.js').read_text()):assert Path(f or '.').exists(),f
ast.parse(Path('blender_import.py').read_text());print('DOM references, local assets, manifest, cache and Blender syntax: OK')
