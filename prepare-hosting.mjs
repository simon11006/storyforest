import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import './build.mjs';

const root=fileURLToPath(new URL('.',import.meta.url));
const output=path.resolve(root,'.firebase-hosting');
// Rebuild a dedicated public artifact. Private Sites samples never enter it.
if(path.dirname(output)!==path.resolve(root)||path.basename(output)!=='.firebase-hosting')throw Error('Unsafe hosting output');
if(fs.existsSync(output)&&fs.lstatSync(output).isSymbolicLink())throw Error('Hosting output must not be a symlink');
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output);
function copy(relative){
 const source=path.join(root,'dist',relative),destination=path.join(output,relative);
 if(fs.lstatSync(source).isSymbolicLink())throw Error('Unexpected symbolic link');
 if(fs.statSync(source).isDirectory()){
  fs.mkdirSync(destination,{recursive:true});
  for(const name of fs.readdirSync(source))copy(path.join(relative,name));
 }else{
  if(/\.(pdf|jpg|jpeg|png|bin)$/i.test(relative))throw Error('Unexpected media in public hosting assets: '+relative);
  fs.copyFileSync(source,destination);
 }
}
for(const item of ['index.html','style.css','library-config.json','assets','vendor'])copy(item);
fs.writeFileSync(path.join(output,'books.json'),'[]\n');
console.log('Firebase Hosting prepared: application files only; no student samples.');
