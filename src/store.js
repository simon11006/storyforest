import {chooseClassTheme,themes} from './themes.js';
import {initializeApp} from 'firebase/app';
import {getAuth,signInAnonymously,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,reload,signOut,onAuthStateChanged,getIdToken} from 'firebase/auth';
import {getFirestore,collection,doc,getDoc,getDocs,setDoc,runTransaction,deleteDoc,onSnapshot,query,limit,writeBatch} from 'firebase/firestore';
import {getStorage,ref,uploadBytesResumable,getBlob,deleteObject,listAll} from 'firebase/storage';
import {classCapacity,assertCapacity,assertSlot,availableSlots,MAX_CAPACITY} from './capacity.js';
import {youtubeLink,videoCover,videoThumbnailCover} from './video.js';
export {assertSlot} from './capacity.js';
export class LibraryStore {
 constructor(){this.mode='local';this.canEdit=true;this.user=null;this.persisted=true;this.urls=[];this.coverCache=new Map();}
 async init(onAuth){
  const r=await fetch('./library-config.json');if(!r.ok)throw Error('저장소 설정을 불러오지 못했어요.');const config=await r.json();
  if(config.firebase){this.mode='firebase';this.canEdit=false;this.school=config.schoolId;if(!this.school)throw Error('학교 식별자가 설정되지 않았어요.');const app=initializeApp(config.firebase);this.auth=getAuth(app);this.auth.languageCode='ko';this.firestore=getFirestore(app);this.storage=getStorage(app);this.onAuth=onAuth;onAuthStateChanged(this.auth,async user=>{try{if(!user){this.user=null;await this.refreshRole();await onAuth?.();await signInAnonymously(this.auth);return;}this.user=user;await this.refreshRole();await onAuth?.();}catch(e){this.authError=e;await onAuth?.();}});return;}
  try{this.db=await new Promise((resolve,reject)=>{const r=indexedDB.open('storyforest-campus',1);r.onupgradeneeded=()=>{r.result.createObjectStore('classes',{keyPath:'id'});r.result.createObjectStore('books',{keyPath:'key'});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
  catch{this.persisted=false;this.memory={classes:new Map(),books:new Map()};}
  if(!(await this.all('classes')).length){await this.write('classes',{id:'sample',name:'예시 학급',createdAt:Date.now()});const res=await fetch('./books.json');if(!res.ok)throw Error('예시 책을 가져오지 못했어요.');const sample=await res.json();for(let i=0;i<sample.length;i++)await this.write('books',{...sample[i],slot:i+1,classId:'sample',key:`sample:${i+1}`});}
 }
 async all(name){if(!this.db)return [...this.memory[name].values()];return new Promise((resolve,reject)=>{const r=this.db.transaction(name).objectStore(name).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 async write(name,value){if(!this.db){this.memory[name].set(value.key||value.id,value);return;}return new Promise((resolve,reject)=>{const t=this.db.transaction(name,'readwrite');t.objectStore(name).put(value);t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}
 classCollection(){return collection(this.firestore,'schools',this.school,'classes');}
 bookCollection(classId){return collection(this.firestore,'schools',this.school,'classes',classId,'books');}
 async classes(){if(this.mode==='local')return(await this.all('classes')).sort((a,b)=>a.createdAt-b.createdAt);return(await getDocs(this.classCollection())).docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>a.name.localeCompare(b.name,'ko'));}
 async getClass(id){if(this.mode==='local')return(await this.all('classes')).find(c=>c.id===id);const snapshot=await getDoc(doc(this.classCollection(),id));if(!snapshot.exists()){const error=Error('학급을 찾을 수 없어요.');error.code='class-not-found';throw error;}return{id:snapshot.id,...snapshot.data()};}
 canCreateClass(){return this.mode==='local'||(!!this.user?.email&&!this.user.isAnonymous&&this.user.emailVerified===true&&(this.isAdmin===true||this.role==='teacher'));}
 async addClass(name,capacity=MAX_CAPACITY){name=name.trim();assertCapacity(capacity);if(!name||name.length>40)throw Error('학급 이름을 40자 이내로 입력해 주세요.');if(!this.canCreateClass())throw Error('계정을 만들고 이메일 인증을 완료하면 내 학급을 개설할 수 있어요.');const themeId=chooseClassTheme(await this.classes());const item={id:crypto.randomUUID(),name,capacity,themeId,createdAt:Date.now(),teacherEmail:this.user?.email?.toLowerCase()||'',accepting:true,autoPublish:false};if(this.mode==='local')await this.write('classes',item);else{const{id,...data}=item;await setDoc(doc(this.classCollection(),id),data);}return item;}
 async books(classId,{covers=true}={}){
 const books=this.mode==='local'?(await this.all('books')).filter(b=>b.classId===classId).map(b=>({...b})):(await getDocs(this.bookCollection(classId))).docs.map(d=>({...d.data(),id:d.id,classId}));
 books.sort((a,b)=>a.slot-b.slot);if(covers)await this.loadCovers(books);return books;
 }
 async loadCover(book){
 if(book.kind==='video')return videoThumbnailCover(book);
 if(!book.coverPath)return book.cover;
 if(this.coverCache.has(book.coverPath))return this.coverCache.get(book.coverPath);
 this.coverLoads??=new Map();if(!this.coverLoads.has(book.coverPath)){const path=book.coverPath;const pending=getBlob(ref(this.storage,path),2*1024*1024).then(blob=>{const url=URL.createObjectURL(blob);this.coverCache.set(path,url);this.urls.push(url);return url;}).finally(()=>this.coverLoads.delete(path));this.coverLoads.set(path,pending);}
 return this.coverLoads.get(book.coverPath);
 }
 async loadCovers(books,onProgress=()=>{},isCurrent=()=>true){
 let index=0,done=0,failed=0;await Promise.all(Array.from({length:Math.min(4,books.length)},async()=>{while(isCurrent()&&index<books.length){const book=books[index++];try{book.cover=await this.loadCover(book);}catch{failed++;}done++;if(isCurrent())onProgress(book,done,books.length,failed);}}));return{failed};
 }
 watch(classId,callback,onError){if(this.mode!=='firebase')return()=>{};const stops=[onSnapshot(this.bookCollection(classId),()=>callback(),onError),onSnapshot(doc(this.classCollection(),classId),()=>callback(),onError)];return()=>stops.forEach(stop=>stop());}
 async addBook(classId,book,onProgress,directStudent=false){book={...book,youtubeUrl:youtubeLink(book.youtubeUrl)};if(book.kind==='video'&&!book.youtubeUrl)throw Error('영상북 유튜브 링크를 입력해 주세요.');const cls=await this.getClass(classId);if(cls?.deleting)throw Error('삭제 중인 학급에는 작품을 올릴 수 없어요.');assertSlot(book.slot,classCapacity(cls));if(!directStudent&&!this.manages(cls))throw Error('교사 권한이 필요해요.');if(!book.title.trim()||!book.author.trim())throw Error('제목과 작가를 입력해 주세요.');if(this.mode==='local'){const value={...book,classId,key:`${classId}:${book.slot}`,id:crypto.randomUUID()};if(!this.db){if(this.memory.books.has(value.key))throw Error('이미 사용 중인 전시 위치예요.');this.memory.books.set(value.key,value);return;}await new Promise((resolve,reject)=>{const tx=this.db.transaction('books','readwrite');tx.objectStore('books').add(value);tx.oncomplete=resolve;tx.onerror=()=>reject(Error(tx.error?.name==='ConstraintError'?'이미 사용 중인 전시 위치예요.':'저장 공간이 부족하거나 저장할 수 없어요.'));tx.onabort=()=>reject(Error('저장하지 못했어요. 같은 위치에 책이 있는지 확인해 주세요.'));});return;}
  if(book.kind==='video'){
   await runTransaction(this.firestore,async tx=>{const latest=await tx.get(doc(this.classCollection(),classId));if(!latest.exists()||latest.data().deleting)throw Error('작품을 등록할 수 없는 학급이에요.');assertSlot(book.slot,classCapacity(latest.data()));const dest=doc(this.bookCollection(classId),String(book.slot));if((await tx.get(dest)).exists())throw Error('이미 사용 중인 전시 위치예요.');tx.set(dest,{kind:'video',slot:book.slot,title:book.title,author:book.author,youtubeUrl:book.youtubeUrl,createdAt:Date.now()});});onProgress?.(100);return;
  }
  const folder=`schools/${this.school}/classes/${classId}/${directStudent?this.user.uid+'_':''}${crypto.randomUUID()}`,pdfPath=folder+'/book.pdf',coverPath=folder+'/cover.jpg';
  const coverBlob=await(await fetch(book.cover)).blob();const upload=(path,data,contentType)=>new Promise((resolve,reject)=>{const t=uploadBytesResumable(ref(this.storage,path),data,{contentType,customMetadata:{slot:String(book.slot)}});t.on('state_changed',s=>onProgress?.(Math.round(100*s.bytesTransferred/s.totalBytes)),reject,()=>resolve());});
  try{await upload(pdfPath,new Blob([book.data]),'application/pdf');await upload(coverPath,coverBlob,'image/jpeg');await runTransaction(this.firestore,async tx=>{const latest=await tx.get(doc(this.classCollection(),classId));if(!latest.exists())throw Error('학급을 찾을 수 없어요.');if(latest.data().deleting)throw Error('삭제 중인 학급에는 작품을 올릴 수 없어요.');assertSlot(book.slot,classCapacity(latest.data()));const dest=doc(this.bookCollection(classId),String(book.slot));const old=await tx.get(dest);if(old.exists())throw Error('이미 사용 중인 전시 위치예요.');tx.set(dest,{slot:book.slot,title:book.title,author:book.author,youtubeUrl:book.youtubeUrl,pages:book.pages,pdfPath,coverPath,bytes:book.data.byteLength,createdAt:Date.now()});});}
  catch(e){await Promise.allSettled([deleteObject(ref(this.storage,pdfPath)),deleteObject(ref(this.storage,coverPath))]);throw e;}
 }
 async updateBook(classId,book,changes,replacement,onProgress){
 if(!await this.canManageId(classId))throw Error('담임교사 또는 관리자만 수정할 수 있어요.');
 const patch={title:String(changes.title||'').trim(),author:String(changes.author||'').trim(),youtubeUrl:youtubeLink(changes.youtubeUrl)};
 if(!patch.title||patch.title.length>100||!patch.author||patch.author.length>50)throw Error('제목은 1~100자, 작가 이름은 1~50자로 입력해 주세요.');
 if(replacement&&(!replacement.data?.byteLength||replacement.data.byteLength>104857600||!Number.isInteger(replacement.pages)||replacement.pages<1||!replacement.cover))throw Error('올바른 100MB 이하 PDF를 선택해 주세요.');
 const validate=old=>{if(!old)throw Error('이미 삭제된 책입니다.');if(old.kind==='video'&&!replacement&&!patch.youtubeUrl)throw Error('영상북은 유튜브 링크가 필요해요.');};
 if(this.mode==='local'){const key=classId+':'+book.slot,old=(await this.all('books')).find(b=>b.classId===classId&&b.slot===book.slot);validate(old);await this.write('books',{...old,...patch,...(replacement?{...replacement,kind:'pdf',bytes:replacement.data.byteLength}:{}),key});return;}
 if(replacement){
 const cls=await this.getClass(classId);if(cls.deleting)throw Error('삭제 중인 학급입니다.');assertSlot(book.slot,classCapacity(cls));
 const folder='schools/'+this.school+'/classes/'+classId+'/'+crypto.randomUUID(),pdfPath=folder+'/book.pdf',coverPath=folder+'/cover.jpg';let oldPaths=[];
 const upload=(path,data,contentType)=>new Promise((resolve,reject)=>{const task=uploadBytesResumable(ref(this.storage,path),data,{contentType,customMetadata:{slot:String(book.slot)}});task.on('state_changed',s=>onProgress?.(Math.round(s.bytesTransferred/s.totalBytes*100)),reject,resolve);});
 try{await upload(pdfPath,new Blob([replacement.data]),'application/pdf');await upload(coverPath,await(await fetch(replacement.cover)).blob(),'image/jpeg');
 await runTransaction(this.firestore,async tx=>{const cls=await tx.get(doc(this.classCollection(),classId)),dest=doc(this.bookCollection(classId),String(book.slot)),snapshot=await tx.get(dest);if(!cls.exists()||cls.data().deleting)throw Error('삭제 중이거나 없는 학급입니다.');const old=snapshot.exists()?snapshot.data():null;validate(old);if(old.pdfPath!==book.pdfPath||old.coverPath!==book.coverPath||old.createdAt!==book.createdAt)throw Error('책이 다른 곳에서 변경되었습니다. 수정 창을 다시 열어 주세요.');oldPaths=[old.pdfPath,old.coverPath].filter(Boolean);tx.update(dest,{...patch,kind:'pdf',pages:replacement.pages,bytes:replacement.data.byteLength,pdfPath,coverPath});});
 }catch(error){await Promise.allSettled([pdfPath,coverPath].map(path=>deleteObject(ref(this.storage,path))));throw error;}
 await Promise.allSettled(oldPaths.map(path=>deleteObject(ref(this.storage,path))));return;
 }
 await runTransaction(this.firestore,async tx=>{const cls=await tx.get(doc(this.classCollection(),classId)),dest=doc(this.bookCollection(classId),String(book.slot)),snapshot=await tx.get(dest);if(!cls.exists()||cls.data().deleting)throw Error('삭제 중이거나 없는 학급입니다.');validate(snapshot.exists()?snapshot.data():null);tx.update(dest,patch);});
 }
 async removeBook(classId,book){if(!await this.canManageId(classId))throw Error('교사 권한이 필요해요.');if(this.mode==='local'){if(!this.db){this.memory.books.delete(`${classId}:${book.slot}`);return;}await new Promise((resolve,reject)=>{const t=this.db.transaction('books','readwrite');t.objectStore('books').delete(`${classId}:${book.slot}`);t.oncomplete=resolve;t.onerror=()=>reject(t.error);});}else{await deleteDoc(doc(this.bookCollection(classId),String(book.slot)));const results=await Promise.allSettled([book.pdfPath,book.coverPath].filter(Boolean).map(path=>deleteObject(ref(this.storage,path))));if(results.some(r=>r.status==='rejected'))throw Error('전시에서는 내렸지만 저장소 원본 정리가 필요해요.');}}
 async pdfBytes(book,onProgress){if(book.data)return new Uint8Array(book.data.slice(0));if(book.pdfPath){const blob=await getBlob(ref(this.storage,book.pdfPath),100*1024*1024);return new Uint8Array(await blob.arrayBuffer());}const parts=[];let total=0;for(const path of book.chunks){const r=await fetch(path);if(!r.ok)throw Error('책을 불러오지 못했어요.');const part=new Uint8Array(await r.arrayBuffer());parts.push(part);total+=part.length;onProgress?.(Math.round(total/book.bytes*100));}const all=new Uint8Array(total);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.length;}return all;}
 async refreshRole(){this.canRead=false;this.canEdit=false;this.isAdmin=false;this.role=null;if(this.user?.emailVerified&&this.user.email&&!this.user.isAnonymous){const d=await getDoc(doc(this.firestore,'schools',this.school,'members',this.user.email.toLowerCase()));this.isAdmin=d.data()?.role==='admin';this.role=this.isAdmin?'admin':'teacher';this.canRead=true;this.canEdit=true;}}
 async refreshAuth(){if(this.auth.currentUser){await reload(this.auth.currentUser);await getIdToken(this.auth.currentUser,true);this.user=this.auth.currentUser;await this.refreshRole();await this.onAuth?.();}}
 login(email,password){return signInWithEmailAndPassword(this.auth,email,password);}
 signup(email,password){return createUserWithEmailAndPassword(this.auth,email,password);}
 verify(){return sendEmailVerification(this.auth.currentUser);}
 resetPassword(email){return sendPasswordResetEmail(this.auth,email);}
 async logout(){await signOut(this.auth);this.user=this.auth.currentUser;await this.refreshRole();}
 manages(c){return this.mode==='local'||(this.canCreateClass()&&(this.isAdmin===true||c?.teacherEmail===this.user.email.toLowerCase()));}
 async canManageId(id){if(this.mode==='local')return true;return this.manages({...(await getDoc(doc(this.classCollection(),id))).data()});}
 async updateClass(c,changes){
  const nextData=latest=>{if(latest.deleting)throw Error('삭제 중인 학급입니다. 학급 삭제를 다시 눌러 남은 정리를 완료해 주세요.');if(!this.manages(latest))throw Error('이 학급의 담당 교사만 설정을 바꿀 수 있어요.');if(this.mode==='firebase'&&!this.isAdmin&&Object.keys(changes).some(key=>!['name','capacity','accepting','autoPublish','themeId'].includes(key)))throw Error('담당 교사 배정은 관리자만 할 수 있어요.');const data={name:latest.name,createdAt:latest.createdAt,teacherEmail:latest.teacherEmail,accepting:latest.accepting===true,autoPublish:latest.autoPublish===true,capacity:classCapacity(latest),...(latest.themeId?{themeId:latest.themeId}:{}),...changes};assertCapacity(data.capacity);if(data.themeId&&!themes.some(t=>t.id===data.themeId))throw Error('올바른 숲 테마를 선택해 주세요.');return data;};
  if(this.mode==='local'){const latest=await this.getClass(c.id);if(!latest)throw Error('학급을 찾을 수 없어요.');await this.write('classes',{id:c.id,...nextData(latest)});return;}
  await runTransaction(this.firestore,async tx=>{const dest=doc(this.classCollection(),c.id),snapshot=await tx.get(dest);if(!snapshot.exists())throw Error('학급을 찾을 수 없어요.');tx.set(dest,nextData(snapshot.data()));});
 }
 async deleteClass(c,onProgress=()=>{}){
  const latest=await this.getClass(c.id);if(!latest||!this.manages(latest))throw Error('자기 학급의 담당 교사 또는 관리자만 학급을 삭제할 수 있어요.');
  if(this.mode==='local'){
   if(!this.db){for(const [key,book]of this.memory.books)if(book.classId===c.id)this.memory.books.delete(key);for(const [key,item]of this.memory.submissions||[])if(item.classId===c.id)this.memory.submissions.delete(key);this.memory.classes.delete(c.id);return;}
   await new Promise((resolve,reject)=>{const tx=this.db.transaction(['classes','books'],'readwrite'),cursor=tx.objectStore('books').openCursor();cursor.onsuccess=()=>{const item=cursor.result;if(item){if(item.value.classId===c.id)item.delete();item.continue();}};tx.objectStore('classes').delete(c.id);tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error||Error('학급 삭제에 실패했어요.'));});return;
  }
  try{
   const classRef=doc(this.classCollection(),c.id);
   await runTransaction(this.firestore,async tx=>{const snapshot=await tx.get(classRef);if(!snapshot.exists()||!this.manages(snapshot.data()))throw Error('학급 삭제 권한을 확인해 주세요.');tx.update(classRef,{deleting:true,accepting:false});});
   onProgress('새 제출을 중단하고 작품과 제출물을 삭제하고 있어요…');
   await this.deleteClassFiles(c.id);
   for(const items of [this.bookCollection(c.id),this.submissionCollection(c.id)]){
    for(;;){const snapshot=await getDocs(query(items,limit(400)));if(snapshot.empty)break;const batch=writeBatch(this.firestore);for(const item of snapshot.docs)batch.delete(item.ref);await batch.commit();}
   }
   await this.deleteClassFiles(c.id);
   onProgress('학급 도서관 삭제를 마무리하고 있어요…');await deleteDoc(classRef);this.releaseCovers();
  }catch(e){throw Error('학급 삭제를 완료하지 못했어요. 학급 목록에서 ‘삭제 계속하기’를 눌러 남은 정리를 완료해 주세요.',{cause:e});}
 }
 async deleteClassFiles(classId){
  const remove=async folder=>{const result=await listAll(ref(this.storage,folder));for(const child of result.prefixes)await remove(child.fullPath);for(let i=0;i<result.items.length;i+=8){const results=await Promise.allSettled(result.items.slice(i,i+8).map(file=>deleteObject(file).catch(e=>{if(e.code!=='storage/object-not-found')throw e;})));const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;}};
  await remove(`schools/${this.school}/classes/${classId}`);await remove(`schools/${this.school}/incoming/${classId}`);
 }

 submissionCollection(id){return collection(this.firestore,'schools',this.school,'classes',id,'submissions');}
 async submissions(id){return(await getDocs(this.submissionCollection(id))).docs.map(d=>({id:d.id,classId:id,...d.data()}));}
 async submitBook(c,book,onProgress){
  book={...book,youtubeUrl:youtubeLink(book.youtubeUrl)};if(book.kind==='video'&&!book.youtubeUrl)throw Error('영상북 유튜브 링크를 입력해 주세요.');
  if(!this.user)throw Error('연결 준비 후 다시 시도해 주세요.');c=await this.getClass(c.id);if(c.deleting)throw Error('삭제 중인 학급에는 제출할 수 없어요.');if(!c.accepting)throw Error('현재 제출을 받지 않는 학급이에요.');if(c.autoPublish===true){const items=(await getDocs(this.bookCollection(c.id))).docs.map(d=>d.data());const slot=availableSlots(c,items)[0];if(!slot)throw Error(`이 학급은 ${classCapacity(c)}개 작품이 모두 전시 중이에요. 선생님께 문의해 주세요.`);await this.addBook(c.id,{...book,slot},onProgress,true);return{published:true};}
  const uid=this.user.uid,dest=doc(this.submissionCollection(c.id),uid);
  if((await getDoc(dest)).exists())throw Error('이미 제출한 책을 선생님이 확인 중이에요. 승인 또는 반려 후 다시 제출할 수 있어요.');
  if(book.kind==='video'){await setDoc(dest,{kind:'video',title:book.title,author:book.author,youtubeUrl:book.youtubeUrl,createdAt:Date.now()});onProgress?.(100);return{published:false};}
  const folder='schools/'+this.school+'/incoming/'+c.id+'/'+uid,pdfPath=folder+'/book.pdf',coverPath=folder+'/cover.jpg';
  // Remove an unfinished upload from this same browser before retrying.
  await Promise.allSettled([deleteObject(ref(this.storage,pdfPath)),deleteObject(ref(this.storage,coverPath))]);
  const upload=(path,data,type)=>new Promise((resolve,reject)=>{const task=uploadBytesResumable(ref(this.storage,path),data,{contentType:type});task.on('state_changed',s=>onProgress?.(Math.round(s.bytesTransferred/s.totalBytes*100)),reject,resolve);});
  try{await upload(pdfPath,new Blob([book.data]),'application/pdf');await upload(coverPath,await(await fetch(book.cover)).blob(),'image/jpeg');await setDoc(dest,{title:book.title,author:book.author,youtubeUrl:book.youtubeUrl,pages:book.pages,bytes:book.data.byteLength,createdAt:Date.now(),pdfPath,coverPath});return{published:false};}
  catch(e){await Promise.allSettled([deleteObject(ref(this.storage,pdfPath)),deleteObject(ref(this.storage,coverPath))]);throw e;}
 }
 async removeSubmission(c,b){await Promise.all([b.pdfPath,b.coverPath].filter(Boolean).map(path=>deleteObject(ref(this.storage,path)).catch(e=>{if(e.code!=='storage/object-not-found')throw e;})));await deleteDoc(doc(this.submissionCollection(c),b.id));}
 async approveSubmission(c,b,slot){if(b.kind==='video'){await this.addBook(c,{...b,slot,cover:videoCover(b.title)});await this.removeSubmission(c,b);return;}const data=await this.pdfBytes(b),cover=await getBlob(ref(this.storage,b.coverPath));const url=URL.createObjectURL(cover);try{await this.addBook(c,{...b,slot,data,cover:url});await this.removeSubmission(c,b);}finally{URL.revokeObjectURL(url);}}
 releaseCovers(){this.urls.forEach(URL.revokeObjectURL);this.urls=[];this.coverCache.clear();}
}
