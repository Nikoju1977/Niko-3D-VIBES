// Run the owner's separately maintained Code Mode X engine; never upload source.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const engine=process.argv[2];
if(!engine)throw Error('Usage: node scripts/code-mode-audit.mjs /path/to/AutoCoder-Studio-Niko/code-mode-x.mjs');
const hash=execFileSync('git',['hash-object',resolve(engine)],{encoding:'utf8'}).trim();
if(hash!=='2ca34b69a196e14881bb1c50847d4764387761a5')throw Error('Unreviewed Code Mode engine revision');
const {runCodeMode}=await import(pathToFileURL(resolve(engine)).href);
const paths=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const eligible=paths.filter(p=>/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}\.(py|html|css|js|md|json)$/.test(p));
const files=eligible.map(name=>({name,content:readFileSync(name,'utf8')}));
const result=await runCodeMode({prompt:'Audit local de sécurité',files});
console.log(JSON.stringify({engineBlob:hash,status:result.status,audit:result.audit??null,findings:result.events?.[0]?.findings??[],excluded:paths.filter(p=>!eligible.includes(p))},null,2));
if(!result.audit?.passed||result.audit.findings.length)process.exitCode=1;
