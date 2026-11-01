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
 async login(email){this.user={email,emailVerified:true};this.role='teacher';this.canRead=true;this.canEdit=true;await this.onAuth();}
 async addClass(name,capacity){assert.equal(this.canCreateClass(),true);const c={id:'new-class',name,capacity,teacherEmail:this.user.email,accepting:true,autoPublish:false};this.memory.classes.set(c.id,c);return c;}
 async deleteClass(c){assert.equal(this.manages(c),true);this.memory.classes.delete(c.id);}
 async submissions(){return[];}
}
class TestGallery{constructor(){this.renderer={};this.keys=new Set();}setClass(c){this.cls=c;}setBooks(){}pause(){}reset(){}}
class TestReader{}
const originalFormData=globalThis.FormData,originalConfirm=globalThis.confirm;
const dom=new JSDOM(html);globalThis.document=dom.window.document;globalThis.MutationObserver=dom.window.MutationObserver;globalThis.FormData=dom.window.FormData;globalThis.confirm=()=>true;
dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
try{
 await new AsyncFunction('LibraryStore','Gallery','Reader','inspectPDF','setupManagement','classCapacity','availableSlots','exhibitedBooks',source)(TestStore,TestGallery,TestReader,()=>{},setupManagement,classCapacity,availableSlots,exhibitedBooks);
 const $=s=>document.querySelector(s),tick=()=>new Promise(resolve=>setTimeout(resolve,0));
 assert.equal($('#entryLobby').hidden,false);assert.equal($('#lobbyEmpty').hidden,false);assert.equal(document.querySelectorAll('#lobbyClasses .class-card').length,0);assert.equal($('#studentBtn').disabled,true);
 $('#lobbyTeacherBtn').click();assert.equal($('#manager').open,true);assert.equal($('#teacherCreateHint').hidden,false);
 const login=$('#loginForm');login.elements.email.value='teacher@example.com';login.elements.password.value='test-password';await login.onsubmit({preventDefault(){},target:login,submitter:login.querySelector('[value=login]')});await tick();
 assert.equal($('#manager').open,false);assert.equal($('#classesDialog').open,true);assert.equal($('.class-create').hidden,false,'a verified teacher can open the creation form');assert.equal(savedStore.isAdmin,false);
 const create=$('#createClassForm');create.elements.name.value='4학년 1반';create.elements.capacity.value='20';await create.onsubmit({preventDefault(){},target:create});await tick();
 assert.equal($('#entryLobby').hidden,true);assert.equal($('#className').textContent,'4학년 1반');assert.equal((await savedStore.getClass('new-class')).teacherEmail,'teacher@example.com');
 $('#studentBtn').click();assert.equal($('#studentClass').textContent,'4학년 1반');assert.match($('#studentSubmit').textContent,/4학년 1반/);$('#studentDialog').close();
 $('#manageBtn').click();await tick();assert.equal($('#adminPanel').hidden,true);const remove=[...document.querySelectorAll('#classPolicy button')].find(b=>b.textContent==='내 학급 도서관 삭제');assert.ok(remove);await remove.onclick();await tick();
 assert.equal($('#entryLobby').hidden,false);assert.equal($('#lobbyEmpty').hidden,false);assert.equal($('#manager').open,false);
 savedStore.failLoading=true;await savedStore.onAuth();assert.equal($('#lobbyRetry').hidden,false);assert.equal($('#lobbyEmpty').hidden,true,'a connection failure must not appear as an empty school');
 console.log('PASS empty-school entry, teacher login → class creation, explicit destination, owned-class deletion, and connection errors');
}finally{dom.window.close();globalThis.FormData=originalFormData;globalThis.confirm=originalConfirm;}
