import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {LibraryStore} from './src/store.js';
import {setupManagement} from './src/management.js';
import {classCapacity,availableSlots,exhibitedBooks} from './src/capacity.js';
const dom=new JSDOM(fs.readFileSync(new URL('./src/index.html',import.meta.url),'utf8'));
globalThis.document=dom.window.document;globalThis.MutationObserver=dom.window.MutationObserver;
dom.window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
dom.window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');};
const originalFetch=globalThis.fetch;globalThis.fetch=async()=>({json:async()=>[]});
let savedStore,scene;
class TestStore extends LibraryStore{
 constructor(){super();savedStore=this;this.isAdmin=true;this.canRead=true;this.user={email:'teacher@example.com',emailVerified:true};this.memory={classes:new Map([['existing',{id:'existing',name:'기존 학급',createdAt:1,teacherEmail:this.user.email,accepting:true,autoPublish:false}]]),books:new Map(Array.from({length:30},(_,i)=>{const slot=i+1;return[`existing:${slot}`,{slot,classId:'existing',title:`작품 ${slot}`,author:'작가',pages:1}];}))};}
 async init(){}
 async members(){return[{email:this.user.email,role:'admin'}];}
 async submissions(){return[];}
}
class TestGallery{
 constructor(){scene=this;this.renderer={};this.keys=new Set();}
 setClass(c){this.cls=c;}
 setBooks(books){this.books=exhibitedBooks(this.cls,books);}
 pause(){}
 reset(){}
}
class TestReader{}
const source=fs.readFileSync(new URL('./src/main.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
try{
 await new AsyncFunction('LibraryStore','Gallery','Reader','inspectPDF','setupManagement','classCapacity','availableSlots','exhibitedBooks',source)(TestStore,TestGallery,TestReader,()=>{},setupManagement,classCapacity,availableSlots,exhibitedBooks);
 const $=s=>document.querySelector(s),tick=()=>new Promise(resolve=>setTimeout(resolve,0));
 assert.equal($('#entryLobby').hidden,false);assert.equal($('#bookCount').textContent,'0','a class must not be selected automatically');
 assert.equal($('#lobbyClassSelect').options.length,2);assert.equal($('#lobbyClassSelect').value,'');$('#lobbyClassSelect').value='existing';$('#lobbyClassSelect').onchange();await $('#lobbyVisitBtn').onclick();assert.equal($('#entryLobby').hidden,true);
 $('#manageBtn').click();await tick();
 assert.equal($('#bookCount').textContent,'30');assert.equal(document.querySelectorAll('.book-tile').length,30);
 $('#classPolicy input[type=number]').value='20';await $('#classPolicy button').onclick();await tick();
 assert.equal((await savedStore.getClass('existing')).capacity,20);
 assert.equal($('#bookCount').textContent,'20');assert.equal(document.querySelectorAll('.book-tile').length,20);assert.equal(scene.books.length,20);
 assert.match($('#capacity').textContent,/20 \/ 20/);assert.equal($('#slotSelect').options.length,20);assert.equal($('[data-zone="2"]').hidden,true);
 assert.equal(document.querySelectorAll('.manage-item').length,30);assert.equal([...document.querySelectorAll('.manage-item')].filter(row=>row.textContent.includes('관람 화면에서 숨김')).length,10);
 assert.equal((await savedStore.books('existing')).length,30);
 $('#classPolicy input[type=number]').value='30';await $('#classPolicy button').onclick();await tick();
 assert.equal($('#bookCount').textContent,'30');assert.equal(document.querySelectorAll('.book-tile').length,30);assert.equal(scene.books.length,30);assert.equal($('[data-zone="2"]').hidden,false);
 console.log('PASS existing class 30 → 20 → 30: saved settings, gallery, catalog, counters, slots, zones, and retained works');
}finally{globalThis.fetch=originalFetch;dom.window.close();}
