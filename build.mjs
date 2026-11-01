import {build} from 'esbuild';
import {copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('.',import.meta.url)));
for(const name of ['index.html','style.css'])copyFileSync('src/'+name,'dist/'+name);
await build({entryPoints:['src/main.js'],bundle:true,format:'esm',splitting:true,outdir:'dist/assets',minify:true,sourcemap:false,platform:'browser',target:['es2022'],external:['/vendor/*']});
console.log('Built first-person classroom gallery.');
