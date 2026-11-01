import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const source=fileURLToPath(new URL('.',import.meta.url));
const target=path.resolve(source,'../storyforest-github');
const remote='https://github.com/simon11006/storyforest.git';
const git=(...args)=>execFileSync('git',args,{cwd:target,encoding:'utf8',windowsHide:true}).trim();
if(target===path.resolve(source)||!target.startsWith(path.dirname(path.resolve(source))+path.sep))throw Error('Unsafe checkout location');
fs.mkdirSync(target,{recursive:true});
if(!fs.existsSync(path.join(target,'.git'))){if(fs.readdirSync(target).length)throw Error('Target directory must be empty before cloning');execFileSync('git',['clone',remote,target],{encoding:'utf8',windowsHide:true});}
if(git('remote','get-url','origin')!==remote)throw Error('Unexpected public repository remote');
if(git('status','--porcelain'))throw Error('GitHub checkout has uncommitted changes; review them before syncing');
const heads=git('ls-remote','--heads','origin','main');
if(heads){git('checkout','main');git('pull','--ff-only','origin','main');}
else if(git('symbolic-ref','--short','HEAD')!=='main')git('symbolic-ref','HEAD','refs/heads/main');
const isPrivate=rel=>rel==='dist/books.json'||rel.startsWith('dist/books/')||rel.startsWith('inputs/')||rel.endsWith('.log')||/(^|\/)\.env($|\.)/.test(rel)||/service.?account|credential|\.pem$|\.p12$/i.test(rel);
const tracked=execFileSync('git',['ls-files','-z'],{cwd:source,encoding:'utf8'}).split('\0').filter(Boolean);
const allowed=tracked.filter(p=>!isPrivate(p));
// Remove only formerly tracked public files absent from this source snapshot.
for(const rel of git('ls-files','-z').split('\0').filter(Boolean))if(!allowed.includes(rel)&&rel!=='dist/books.json'){
 const resolved=path.resolve(target,rel);if(!resolved.startsWith(target+path.sep))throw Error('Invalid tracked path');fs.rmSync(resolved,{force:true});
}
for(const rel of allowed){const dest=path.join(target,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(source,rel),dest);}
fs.mkdirSync(path.join(target,'dist'),{recursive:true});fs.writeFileSync(path.join(target,'dist/books.json'),'[]\n');
fs.appendFileSync(path.join(target,'.gitignore'),'\n# Student work stays in Firebase, not public Git history.\ndist/books/\n.env\n.env.*\n*service-account*.json\n*.pem\n');
git('add','--all');
if(git('diff','--cached','--name-only'))git('commit','-m',process.argv[2]||'Update Storyforest classroom gallery');
git('push','-u','origin','main');
const local=git('rev-parse','HEAD'),published=git('ls-remote','--heads','origin','main').split(/\s/)[0];
if(local!==published)throw Error('Remote main verification failed');
console.log(JSON.stringify({repository:remote,branch:'main',commit:local,checkout:target,studentAssetsIncluded:false}));
