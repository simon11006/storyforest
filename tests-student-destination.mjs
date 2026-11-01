import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {setupManagement} from './src/management.js';
const dom=new JSDOM(fs.readFileSync(new URL('./src/index.html',import.meta.url),'utf8'));
globalThis.document=dom.window.document;globalThis.MutationObserver=dom.window.MutationObserver;
const originalFormData=globalThis.FormData;globalThis.FormData=dom.window.FormData;
const classes=[{id:'one',name:'4학년 1반',accepting:true},{id:'two',name:'4학년 2반',accepting:true},{id:'closed',name:'4학년 3반',accepting:false}];
const $=s=>document.querySelector(s);let submittedTo,finishPDF;
const store={isAdmin:false,manages:()=>false,submitBook:async c=>{submittedTo=c;return{published:false};}};
setupManagement({store,getCurrent:()=>classes[0],getClasses:()=>classes,getEntryClass:()=>classes[1],openDialog:()=>{},refresh:async()=>{},status:(s,t)=>$(s).textContent=t,friendly:e=>e.message,inspectPDF:()=>new Promise(resolve=>finishPDF=resolve)});
try{
 $('#lobbyStudentBtn').onclick();assert.equal($('#studentClassSelect').value,'two','the welcome registration button uses its chosen class rather than the current gallery');
 $('#studentBtn').onclick();assert.equal($('#studentClass').textContent,'4학년 1반');assert.equal($('#studentClassSelect').value,'one');assert.match($('#studentSubmit').textContent,/4학년 1반/);
 const select=$('#studentClassSelect');select.value='closed';select.onchange({target:select});assert.equal($('#studentSubmit').disabled,true);assert.match($('#studentMode').textContent,/제출을 받지 않습니다/);
 select.value='two';select.onchange({target:select});assert.equal($('#studentClass').textContent,'4학년 2반');assert.match($('#studentSubmit').textContent,/4학년 2반/);
 const form=$('#studentForm');form.elements.title.value='우리 반 책';form.elements.author.value='작가';const submission=form.onsubmit({preventDefault(){},target:form});assert.equal(select.disabled,true,'the destination must stay fixed while uploading');finishPDF({pages:1});await submission;
 assert.equal(submittedTo.id,'two','submission must use the prominently selected destination');assert.match($('#studentStatus').textContent,/4학년 2반/);assert.equal(select.disabled,false);
 console.log('PASS visible submission destination, inline class change, closed classes, and destination locked during upload');
}finally{dom.window.close();globalThis.FormData=originalFormData;}
