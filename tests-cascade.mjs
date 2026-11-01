// Run in the demo Firestore/Storage emulators configured in firebase/emulators.json.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,updateDoc,writeBatch} from 'firebase/firestore';
import {ref,uploadBytes,listAll,deleteObject} from 'firebase/storage';
import {LibraryStore} from './src/store.js';
const env=await initializeTestEnvironment({projectId:'demo-storyforest-capacity',firestore:{host:'127.0.0.1',port:8086,rules:fs.readFileSync('firebase/firestore.rules','utf8')},storage:{host:'127.0.0.1',port:9196,rules:fs.readFileSync('firebase/storage.rules','utf8')}});
const base='schools/cascade-test',email='teacher@example.com',teacher=env.authenticatedContext('teacher',{email,email_verified:true}),other=env.authenticatedContext('other',{email:'other@example.com',email_verified:true}),student=env.authenticatedContext('student');
const store=new LibraryStore();store.mode='firebase';store.school='cascade-test';store.firestore=teacher.firestore()._delegate;store.storage=teacher.storage()._delegate;store.role='teacher';store.user={email,emailVerified:true};
const classData={name:'삭제 테스트',createdAt:1,capacity:20,teacherEmail:email,accepting:true,autoPublish:true};
const file=(c,path)=>`${base}/classes/${c}/${path}`;
const book=(c,slot)=>({slot,title:'테스트',author:'작가',pages:1,bytes:2,createdAt:1,pdfPath:file(c,`book-${slot}/book.pdf`),coverPath:file(c,`book-${slot}/cover.jpg`)});
async function seed(c,pendingCount=1){
 await env.withSecurityRulesDisabled(async ctx=>{
  const db=ctx.firestore(),storage=ctx.storage();await setDoc(doc(db,`${base}/classes/${c}`),classData);
  for(const slot of [1,30])await setDoc(doc(db,`${base}/classes/${c}/books/${slot}`),book(c,slot));
  for(let start=0;start<pendingCount;start+=250){const batch=writeBatch(db);for(let i=start;i<Math.min(start+250,pendingCount);i++)batch.set(doc(db,`${base}/classes/${c}/submissions/pending-${i}`),{title:'제출물',pdfPath:`${base}/incoming/${c}/pending-${i}/book.pdf`,coverPath:`${base}/incoming/${c}/pending-${i}/cover.jpg`});await batch.commit();}
  const paths=[file(c,'book-1/book.pdf'),file(c,'book-1/cover.jpg'),file(c,'book-30/book.pdf'),file(c,'book-30/cover.jpg'),`${base}/incoming/${c}/pending-0/book.pdf`,`${base}/incoming/${c}/pending-0/cover.jpg`,`${base}/incoming/${c}/unfinished/book.pdf`,file(c,'unfinished/book.pdf')];
  for(const path of paths)await uploadBytes(ref(storage,path),new Uint8Array([1,2]),{contentType:path.endsWith('.pdf')?'application/pdf':'image/jpeg'});
 });
}
async function assertGone(c){await env.withSecurityRulesDisabled(async ctx=>{const db=ctx.firestore();assert.equal((await getDoc(doc(db,`${base}/classes/${c}`))).exists(),false);assert.equal((await getDocs(collection(db,`${base}/classes/${c}/books`))).size,0);assert.equal((await getDocs(collection(db,`${base}/classes/${c}/submissions`))).size,0);for(const prefix of [`${base}/classes/${c}`,`${base}/incoming/${c}`]){const result=await listAll(ref(ctx.storage(),prefix));assert.equal(result.items.length+result.prefixes.length,0);}});}
try{
 await env.clearFirestore();await env.clearStorage();
 await store.refreshRole();assert.equal(store.role,'teacher','cascade management must work without administrator registration');
 await seed('populated',405);await seed('untouched');await seed('retry');
 await assertSucceeds(listAll(ref(teacher.storage(),`${base}/classes/populated`)));
 await assertFails(listAll(ref(other.storage(),`${base}/classes/populated`)));await assertFails(listAll(ref(student.storage(),`${base}/incoming/populated`)));
 await store.deleteClass({id:'populated'});await assertGone('populated');
 assert.equal((await getDoc(doc(teacher.firestore(),`${base}/classes/untouched/books/30`))).exists(),true,'another class must remain intact');
 const cleanup=store.deleteClassFiles.bind(store);store.deleteClassFiles=async c=>{await deleteObject(ref(store.storage,file(c,'book-1/book.pdf')));throw Error('simulated interruption');};
 await assert.rejects(()=>store.deleteClass({id:'retry'}),/삭제 계속하기/);const paused=await store.getClass('retry');assert.equal(paused.deleting,true);assert.equal(paused.accepting,false);
 await assertFails(updateDoc(doc(teacher.firestore(),`${base}/classes/retry`),{deleting:false,accepting:true}));
 await assertFails(setDoc(doc(teacher.firestore(),`${base}/classes/retry/books/2`),book('retry',2)));
 await assertFails(setDoc(doc(student.firestore(),`${base}/classes/retry/submissions/student`),{title:'추가 제출'}));
 await assertFails(uploadBytes(ref(teacher.storage(),file('retry','new-book/book.pdf')),new Uint8Array([1]),{contentType:'application/pdf',customMetadata:{slot:'2'}}));
 const intruder=new LibraryStore();Object.assign(intruder,{mode:'firebase',school:'cascade-test',firestore:other.firestore()._delegate,storage:other.storage()._delegate,role:'teacher',user:{email:'other@example.com',emailVerified:true}});await assert.rejects(()=>intruder.deleteClass({id:'retry'}),/자기 학급/);
 store.deleteClassFiles=cleanup;await store.deleteClass({id:'retry'});await assertGone('retry');
 console.log('PASS populated-class cascade, retained works, 405 submissions, orphan files, isolation, upload lock, and interrupted-deletion retry');
}finally{await env.cleanup();}
