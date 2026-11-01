import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {LibraryStore} from './src/store.js';
import {setupManagement} from './src/management.js';
import {classCapacity,availableSlots,exhibitedBooks} from './src/capacity.js';
const source=fs.readFileSync(new URL('./src/main.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
const html=fs.readFileSync(new URL('./src/index.html',import.meta.url),'utf8');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
let savedStore;
class TestStore extends LibraryStore{
 constructor(){super();savedStore=this;this.mode='firebase';this.isAdmin=false;this.canRead=false;this.canEdit=false;this.user={isAnonymous:true};this.memory={classes:new Map(),books:new Map()};}
 async init(callback){this.onAuth=callback;await callback();}
 async classes(){if(this.failLoading)throw Error('connection failed');return[...this.memory.classes.values()];}
 async getClass(id){return this.memory.classes.get(id);}
 async books(){return[];}
 watch(){return()=>{};}
 async signup(email){this.user={email,emailVerified:false};await this.onAuth();}
 async verify(){this.verificationSent=true;}
 async refreshAuth(){this.user.emailVerified=true;this.role='teacher';this.canRead=true;this.canEdit=true;await this.onAuth();}
 async addClass(name,capacity){assert.equal(this.canCreateClass(),true);const c={id:'new-class',name,capacity,teacherEmail:this.user.email,accepting:true,autoPublish:false};this.memory.classes.set(c.id,c);return c;}
 async deleteClass(c){assert.equal(this.manages(c),true);this.memory.classes.delete(c.id);}
 async submissions(){return[];}
}
class TestGallery{constructor(){this.renderer={};this.keys=new Set();}setClass(c){this.cls=c;}setBooks(){}pause(){}reset(){}}
class TestReader{}
const originalFormData=globalThis.FormData,originalConfirm=globalThis.confirm;
const dom=new JSDOM(html);globalThis.document=dom.window.document;globalThis.MutationObserver=dom.window.MutationObserver;globalThis.FormData=dom.window.FormData;let confirmation=true,confirmationText='';globalThis.confirm=text=>{confirmationText=text;return confirmation;};
dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
try{
 await new AsyncFunction('LibraryStore','Gallery','Reader','inspectPDF','setupManagement','classCapacity','availableSlots','exhibitedBooks',source)(TestStore,TestGallery,TestReader,()=>{},setupManagement,classCapacity,availableSlots,exhibitedBooks);
 const $=s=>document.querySelector(s),tick=()=>new Promise(resolve=>setTimeout(resolve,0));
 assert.equal($('#entryLobby').hidden,false);assert.equal($('#entryLobby').tagName,'DIALOG');assert.equal($('#entryLobby').open,true);assert.equal($('#lobbyEmpty').hidden,false);assert.equal($('#lobbyClassSelect').options.length,1);assert.equal($('#lobbyClassSelect').options[0].textContent,'학급 선택하기');assert.equal($('#lobbyClassSelect').disabled,true);assert.equal($('#lobbyStudentBtn').disabled,true);assert.equal($('#studentBtn').disabled,true);
 $('#lobbyTeacherBtn').click();assert.equal($('#manager').open,true);assert.equal($('#teacherCreateHint').hidden,false);
 const login=$('#loginForm');login.elements.email.value='teacher@example.com';login.elements.password.value='test-password';await login.onsubmit({preventDefault(){},target:login,submitter:login.querySelector('[value=signup]')});await tick();
 assert.equal(savedStore.canCreateClass(),false,'email verification is still required');assert.equal($('#verifyEmail').hidden,false);await $('#verifyEmail').onclick();assert.equal(savedStore.verificationSent,true);await $('#refreshAuth').onclick();await tick();
 assert.equal($('#manager').open,false);assert.equal($('#classesDialog').open,true);assert.equal($('.class-create').hidden,false,'a verified teacher can open the creation form');assert.equal(savedStore.isAdmin,false);
 const create=$('#createClassForm');create.elements.name.value='4학년 1반';create.elements.capacity.value='20';await create.onsubmit({preventDefault(){},target:create});await tick();
 assert.equal($('#entryLobby').hidden,true);assert.equal($('#className').textContent,'4학년 1반');assert.equal((await savedStore.getClass('new-class')).teacherEmail,'teacher@example.com');
 $('#studentBtn').click();assert.equal($('#studentClass').textContent,'4학년 1반');assert.match($('#studentSubmit').textContent,/4학년 1반/);$('#studentDialog').close();
 $('#manageBtn').click();await tick();assert.equal($('#adminPanel').hidden,true);const remove=[...document.querySelectorAll('#classPolicy button')].find(b=>b.textContent==='내 학급 도서관 삭제');assert.ok(remove);confirmation=false;await remove.onclick();assert.ok(await savedStore.getClass('new-class'),'cancel must leave the class unchanged');assert.match(confirmationText,/PDF·표지 파일/);confirmation=true;await remove.onclick();await tick();
 assert.equal($('#entryLobby').hidden,false);assert.equal($('#lobbyEmpty').hidden,false);assert.equal($('#manager').open,false);
 savedStore.memory.classes.set('only',{id:'only',name:'한 학급',capacity:20,accepting:true});await savedStore.onAuth();
 assert.equal($('#lobbyClassSelect').options.length,2,'one classroom still uses the dropdown with a placeholder');assert.equal($('#lobbyClassSelect').value,'');assert.equal($('#lobbyVisitBtn').disabled,true);assert.equal($('#lobbyStudentBtn').disabled,false);
 $('#lobbyStudentBtn').click();assert.equal($('#studentDialog').open,true);assert.equal($('#studentClassSelect').value,'','direct registration must require an explicit class choice');assert.equal($('#studentSubmit').disabled,true);$('#studentDialog').close();
 $('#lobbyClassSelect').value='only';$('#lobbyClassSelect').onchange();assert.equal($('#lobbyVisitBtn').disabled,false);$('#lobbyStudentBtn').click();assert.equal($('#studentClassSelect').value,'only','a chosen welcome destination carries into registration');$('#studentDialog').close();
 savedStore.memory.classes.set('second',{id:'second',name:'두번째 학급',capacity:20,accepting:true});await savedStore.onAuth();assert.equal($('#lobbyClassSelect').options.length,3,'two classrooms use the same dropdown');assert.equal($('#lobbyClassSelect').value,'only','refresh preserves the explicit choice');savedStore.memory.classes.clear();
 for(let i=1;i<=14;i++)savedStore.memory.classes.set('c'+i,{id:'c'+i,name:`4학년 ${i}반`,capacity:20,teacherEmail:'teacher@example.com',accepting:true});savedStore.memory.classes.set('deleting-other',{id:'deleting-other',name:'다른 교사 학급',deleting:true,teacherEmail:'other@example.com'});await savedStore.onAuth();
 assert.equal($('#lobbyClassSelect').options.length,15);assert.equal($('#lobbyTotal'),null,'the welcome screen must not show a classroom count badge');assert.equal($('#lobbyClassSelect').options[2].textContent,'4학년 2반 · 20개 전시 자리','class numbers must use natural sorting');assert.equal($('#lobbyClassSelect').value,'','removed choices must not silently pick a different classroom');
 assert.equal($('#lobbySearch'),null,'the welcome screen must list registered classes without search');
 $('#lobbyClassSelect').value='c14';$('#lobbyClassSelect').onchange();await $('#lobbyVisitBtn').onclick();assert.equal($('#className').textContent,'4학년 14반');assert.equal($('#entryLobby').hidden,true);
 savedStore.failLoading=true;await savedStore.onAuth();assert.equal($('#lobbyRetry').hidden,false);assert.equal($('#lobbyEmpty').hidden,true,'a connection failure must not appear as an empty school');
 console.log('PASS empty-school entry, teacher signup → email verification → class creation without administrator approval, explicit destination, owned-class deletion, connection errors, one/two/14-class dropdowns, direct registration, natural sorting, and no search field');
}finally{dom.window.close();globalThis.FormData=originalFormData;globalThis.confirm=originalConfirm;}
