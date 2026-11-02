import {showBookSuccess} from './src/feedback.js';
import {youtubeLink,videoAction,prepareBook,openVideo} from './src/video.js';
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
 constructor(){super();savedStore=this;this.mode='firebase';this.isAdmin=false;this.canRead=false;this.canEdit=false;this.user={isAnonymous:true};this.auth={currentUser:this.user};this.logoutCalls=0;this.memory={classes:new Map(),books:new Map()};}
 async init(callback){this.onAuth=callback;await callback();}
 async classes(){if(this.failLoading)throw Error('connection failed');return[...this.memory.classes.values()];}
 async getClass(id){return this.memory.classes.get(id);}
 async books(){return[];}
 watch(){return()=>{};}
 async signup(email){this.user={email,emailVerified:false};this.auth.currentUser=this.user;await this.onAuth();}
 async login(email){this.user={email,emailVerified:true};this.auth.currentUser=this.user;this.role='teacher';this.canRead=this.canEdit=true;await this.onAuth();}
 async logout(){this.logoutCalls++;this.user={isAnonymous:true};this.auth.currentUser=this.user;this.role=null;this.canRead=this.canEdit=this.isAdmin=false;await this.onAuth();}
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
 await new AsyncFunction('LibraryStore','Gallery','Reader','inspectPDF','setupManagement','classCapacity','availableSlots','exhibitedBooks','showBookSuccess','youtubeLink','videoAction','prepareBook','openVideo',source)(TestStore,TestGallery,TestReader,()=>{},setupManagement,classCapacity,availableSlots,exhibitedBooks,showBookSuccess,youtubeLink,videoAction,prepareBook,openVideo);
 const $=s=>document.querySelector(s),tick=()=>new Promise(resolve=>setTimeout(resolve,0));
 assert.equal($('#entryLobby').hidden,false);assert.equal($('#entryLobby').tagName,'DIALOG');assert.equal($('#entryLobby').open,true);assert.equal($('#lobbyEmpty').hidden,false);assert.equal($('#lobbyClassSelect').options.length,1);assert.equal($('#lobbyClassSelect').options[0].textContent,'학급 선택하기');assert.equal($('#lobbyClassSelect').disabled,true);assert.equal($('#lobbyStudentBtn').disabled,true);assert.equal($('#studentBtn').disabled,true);
 $('#lobbyTeacherBtn').click();assert.equal($('#manager').open,true);assert.equal($('#teacherCreateHint').hidden,false);
 const login=$('#loginForm');login.elements.email.value='teacher@example.com';login.elements.password.value='test-password';await login.onsubmit({preventDefault(){},target:login,submitter:login.querySelector('[value=signup]')});await tick();
 assert.equal(savedStore.canCreateClass(),false,'email verification is still required');assert.equal($('#verifyEmail').hidden,false);await $('#verifyEmail').onclick();assert.equal(savedStore.verificationSent,true);await $('#refreshAuth').onclick();await tick();
 assert.equal($('#lobbySession').hidden,false);assert.equal($('#lobbyAccountEmail').textContent,'teacher@example.com');assert.equal($('#manager').open,true);assert.equal($('#teacherHome').hidden,false);assert.equal($('#logout').hidden,false);assert.match($('#teacherHomeNote').textContent,/아직 내 학급이 없어요/);assert.equal($('#classesDialog').open,false,'verification must land on the teacher home');assert.equal(savedStore.isAdmin,false);$('#managerCreateClass').click();assert.equal($('#classesDialog').open,true);assert.equal($('.class-create').hidden,false);
 const create=$('#createClassForm');create.elements.name.value='4학년 1반';create.elements.capacity.value='20';await create.onsubmit({preventDefault(){},target:create});await tick();
 assert.equal($('#entryLobby').hidden,true);assert.equal($('#className').textContent,'4학년 1반');assert.equal((await savedStore.getClass('new-class')).teacherEmail,'teacher@example.com');assert.equal($('#manager').open,true,'new classroom creation must open its management');assert.equal($('#managedClassSelect').value,'new-class');assert.equal($('#logout').hidden,false);$('#manager').close();
 $('#studentBtn').click();assert.equal($('#studentClass').textContent,'4학년 1반');assert.match($('#studentSubmit').textContent,/4학년 1반/);$('#studentDialog').close();
 $('#manageBtn').click();await tick();assert.equal($('#adminPanel').hidden,true);const remove=[...document.querySelectorAll('#classPolicy button')].find(b=>b.textContent==='내 학급 도서관 삭제');assert.ok(remove);confirmation=false;await remove.onclick();assert.ok(await savedStore.getClass('new-class'),'cancel must leave the class unchanged');assert.match(confirmationText,/PDF·표지 파일/);confirmation=true;await remove.onclick();await tick();
 assert.equal($('#entryLobby').hidden,false);assert.equal($('#lobbyEmpty').hidden,false);assert.equal($('#manager').open,false);
 savedStore.memory.classes.set('only',{id:'only',name:'한 학급',capacity:20,accepting:true});await savedStore.onAuth();
 assert.equal($('#lobbyClassSelect').options.length,2,'one classroom still uses the dropdown with a placeholder');assert.equal($('#lobbyClassSelect').value,'');assert.equal($('#lobbyVisitBtn').disabled,true);assert.equal($('#lobbyStudentBtn').disabled,false);
 $('#lobbyStudentBtn').click();assert.equal($('#studentDialog').open,true);assert.equal($('#studentClassSelect').value,'','direct registration must require an explicit class choice');assert.equal($('#studentSubmit').disabled,true);$('#studentDialog').close();
 $('#lobbyClassSelect').value='only';$('#lobbyClassSelect').onchange();assert.equal($('#lobbyVisitBtn').disabled,false);$('#lobbyStudentBtn').click();assert.equal($('#studentClassSelect').value,'only','a chosen welcome destination carries into registration');$('#studentDialog').close();
 savedStore.memory.classes.set('second',{id:'second',name:'두번째 학급',capacity:20,accepting:true});await savedStore.onAuth();assert.equal($('#lobbyClassSelect').options.length,3,'two classrooms use the same dropdown');assert.equal($('#lobbyClassSelect').value,'only','refresh preserves the explicit choice');savedStore.memory.classes.clear();
 for(let i=1;i<=14;i++)savedStore.memory.classes.set('c'+i,{id:'c'+i,name:`4학년 ${i}반`,capacity:20,teacherEmail:'teacher@example.com',accepting:true});savedStore.memory.classes.set('deleting-other',{id:'deleting-other',name:'다른 교사 학급',deleting:true,teacherEmail:'other@example.com'});await savedStore.onAuth();
 assert.equal($('#lobbyClassSelect').options.length,15);assert.equal($('#switchClassSelect').options.length,15);assert.equal($('#classesGrid'),null,'the classroom switcher must use a dropdown');assert.equal($('#lobbyTotal'),null,'the welcome screen must not show a classroom count badge');assert.equal($('#lobbyClassSelect').options[2].textContent,'4학년 2반 · 20개 전시 자리','class numbers must use natural sorting');assert.equal($('#lobbyClassSelect').value,'','removed choices must not silently pick a different classroom');
 assert.equal($('#lobbySearch'),null,'the welcome screen must list registered classes without search');
 $('#lobbyClassSelect').value='c14';$('#lobbyClassSelect').onchange();await $('#lobbyVisitBtn').onclick();assert.equal($('#className').textContent,'4학년 14반');assert.equal($('#entryLobby').hidden,true);
 savedStore.memory.classes.set('public-other',{id:'public-other',name:'다른 선생님 학급',teacherEmail:'other@example.com',capacity:8,accepting:true});await savedStore.onAuth();
 $('#classesBtn').click();await tick();$('#switchClassSelect').value='public-other';$('#switchClassSelect').onchange();await $('#classVisitBtn').onclick();assert.equal($('#className').textContent,'다른 선생님 학급');assert.equal($('#editorPanel').hidden,true);assert.equal($('#classPolicy').hidden,true);
 $('#classesBtn').click();await tick();assert.equal($('#classesSession').hidden,false);$('#classesManageBtn').click();assert.equal($('#manager').open,true);assert.equal($('#classesDialog').open,false);assert.equal($('#managedClassSelect').options.length,15,'management must list only the teacher’s classrooms');assert.equal([...$('#managedClassSelect').options].some(o=>o.value==='public-other'),false);assert.equal($('#logout').hidden,false);
 $('#managedClassSelect').value='c14';$('#managedClassSelect').onchange();await $('#manageSelectedClass').onclick();await tick();assert.equal($('#className').textContent,'4학년 14반');assert.equal($('#editorPanel').hidden,false);assert.equal($('#classPolicy').hidden,false);
 $('#managedClassSelect').value='c13';$('#managedClassSelect').onchange();await tick();assert.equal($('#editorPanel').hidden,true,'a pending class choice must not show another class’s editor');assert.equal($('#classPolicy').hidden,true);await savedStore.onAuth();assert.equal($('#managedClassSelect').value,'c13','roster refreshes preserve a pending management choice');assert.equal($('#editorPanel').hidden,true);
 $('#manager').close();$('#classesBtn').click();await tick();await $('#classesLogoutBtn').onclick();await tick();assert.equal(savedStore.logoutCalls,1);assert.equal($('#classesDialog').open,false);assert.equal($('#manager').open,false);assert.equal($('#logout').hidden,true);assert.equal($('#classesSession').hidden,true);assert.equal($('#teacherHome').hidden,true);assert.equal($('#editorPanel').hidden,true);assert.equal($('#classPolicy').hidden,true);assert.equal($('#submissionList').children.length,0);
 savedStore.memory.classes.clear();savedStore.memory.classes.set('only-owned',{id:'only-owned',name:'내 전용 학급',teacherEmail:'teacher@example.com',capacity:12,accepting:true});savedStore.memory.classes.set('other-owner',{id:'other-owner',name:'다른 교사 학급',teacherEmail:'other@example.com',capacity:20,accepting:true});
 $('#manageBtn').click();login.elements.email.value='teacher@example.com';login.elements.password.value='test-password';await login.onsubmit({preventDefault(){},target:login,submitter:login.querySelector('[value=login]')});await tick();assert.equal($('#manager').open,true);assert.equal($('#classesDialog').open,false);assert.equal($('#className').textContent,'내 전용 학급','login selects the sole assigned class rather than the class visited earlier');assert.equal($('#managedClassSelect').value,'only-owned');assert.equal($('#editorPanel').hidden,false);await $('#lobbyLogoutBtn').onclick();await tick();assert.equal($('#lobbySession').hidden,true);assert.equal($('#lobbyAccountEmail').textContent,'');assert.equal(savedStore.logoutCalls,2);assert.equal($('#logout').hidden,true);
 savedStore.failLoading=true;await savedStore.onAuth();assert.equal($('#lobbyRetry').hidden,false);assert.equal($('#lobbyEmpty').hidden,true,'a connection failure must not appear as an empty school');
 console.log('PASS empty-school entry, teacher signup → verification → teacher home → class creation, explicit destination, owned-class deletion, connection errors, one/two/14-class dropdowns, direct registration, natural sorting, scoped management choices, both logout controls, and sole-class login landing');
}finally{dom.window.close();globalThis.FormData=originalFormData;globalThis.confirm=originalConfirm;}
