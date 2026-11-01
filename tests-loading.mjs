import assert from 'node:assert/strict';
import {LibraryStore} from './src/store.js';
const store=new LibraryStore();store.memory={books:new Map(Array.from({length:12},(_,i)=>[i,{classId:'one',slot:i+1,title:'book'}]))};
let active=0,peak=0,calls=0;const pending=[];
store.loadCover=book=>{calls++;active++;peak=Math.max(peak,active);return new Promise((resolve,reject)=>pending.push(()=>{active--;book.slot===2?reject(Error('image error')):resolve('cover-'+book.slot);}));};
const books=await store.books('one',{covers:false});assert.equal(books.length,12);assert.equal(calls,0,'metadata returns before any cover downloads');
let updates=0;const job=store.loadCovers(books,()=>updates++);assert.equal(calls,4);while(updates<12){pending.splice(0).forEach(done=>done());await new Promise(r=>setTimeout(r,0));}assert.equal((await job).failed,1);assert.equal(peak,4);assert.equal(books[11].cover,'cover-12');
let current=true;updates=0;const cancelled=store.loadCovers(books,()=>updates++,()=>current);current=false;pending.splice(0).forEach(done=>done());await cancelled;assert.equal(updates,0,'old classroom does not update the new classroom');assert.equal(calls,16,'cancelled queue starts no further downloads');
console.log('PASS metadata first, four concurrent covers, isolated failures, stale-class cancellation');
