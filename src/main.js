import {showBookSuccess} from './feedback.js';
import {classCapacity,availableSlots,exhibitedBooks} from './capacity.js';
import {youtubeLink,videoAction,prepareBook,openVideo} from './video.js';
import {setupManagement} from './management.js';
import {LibraryStore} from './store.js';
import {Reader,inspectPDF} from './reader.js';
import {Gallery} from './gallery.js';
const $=s=>document.querySelector(s),store=new LibraryStore();let classes=[],books=[],current=null,preview=true,loading=0,stopWatch=()=>{},authLoading=0,toastTimer,gallery,classesLoaded=false,entryError='',creationIntent=false,teacherSessionKey='',loggingOut=false,managedChoice=null;
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
function status(selector,message,error=false){$(selector).textContent=message;$(selector).classList.toggle('error',error);}
function friendly(e){const code=e?.code||'';if(code.includes('invalid-credential'))return'이메일 또는 비밀번호가 맞지 않습니다. 이미 가입했다면 아래 비밀번호 재설정 메일을 이용해 주세요.';if(code.includes('email-already-in-use'))return'이미 가입된 이메일이에요. 로그인하거나 비밀번호를 재설정해 주세요.';if(code.includes('too-many-requests'))return'잠시 후 다시 시도해 주세요.';if(code.includes('permission-denied')||code.includes('unauthorized'))return'권한이 없어요. 이메일 인증 여부와 해당 학급의 담당 교사 계정인지 확인해 주세요.';if(code.includes('network'))return'인터넷 연결을 확인해 주세요.';return e?.message||'요청을 처리하지 못했어요. 다시 시도해 주세요.';}
function walking(){if(!current||!$('#entryLobby').hidden){gallery?.keys.clear();return;}$('#welcome').hidden=true;}
function openDialog(id){gallery?.pause();if(!$(id).open)$(id).showModal();if(id==='#manager')$('#manager [data-close]').focus({preventScroll:true});}
function read(book){gallery?.pause();$('#catalog').close();if(book.kind==='video')openVideo(book);else reader.open(book);}
const reader=new Reader(store,()=>$('#sceneHost').focus({preventScroll:true}));
gallery=new Gallery($('#sceneHost'),{onRead:read,onMove:walking,onNear:b=>{$('#readNear').hidden=!b;$('#nearTitle').textContent=b?.title||'';},onZone:n=>{$('#zoneLabel').textContent=`GALLERY 0${n+1}`;document.querySelectorAll('[data-zone]').forEach(b=>b.classList.toggle('active',Number(b.dataset.zone)===n));},onError:e=>{if(!gallery?.renderer){$('#webglFallback').hidden=false;$('#welcome').hidden=true;}else toast(e.message);}});
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',()=>{gallery?.keys.clear();if(!current&&!document.querySelector('dialog[open]'))showLobby(true);}));$('#entryLobby').addEventListener('cancel',e=>{if(!current)e.preventDefault();});
$('#enterBtn').onclick=enterExhibition;
$('#resetView').onclick=()=>{gallery?.reset();walking();};$('#immersiveBtn').onclick=async()=>{walking();try{await gallery.lock();}catch(e){toast('이 브라우저에서는 화면을 드래그해 둘러봐 주세요.');}};
$('#fullscreenBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#gallery').requestFullscreen();}catch{toast('이 브라우저에서는 전체 화면을 지원하지 않아요.');}};
let high=false;$('#qualityBtn').onclick=()=>{high=!high;gallery.quality(high);$('#qualityBtn').textContent=high?'화질 · 고화질':'화질 · 가볍게';};
document.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>{gallery.zone(Number(b.dataset.zone));walking();});
$('#readNear').onclick=()=>gallery.near&&read(gallery.near);$('#helpBtn').onclick=()=>openDialog('#help');$('#catalogBtn').onclick=$('#fallbackCatalog').onclick=()=>{renderCatalog();openDialog('#catalog');};$('#search').oninput=renderCatalog;
$('#classesBtn').onclick=async()=>{renderClasses();openDialog('#classesDialog');if(!preview){try{classes=await store.classes();classesLoaded=true;entryError='';renderClasses();}catch(e){status('#classesStatus',friendly(e),true);}}};$('#manageBtn').onclick=openTeacherHome;
function showLobby(show){const lobby=$('#entryLobby');if(show&&document.querySelector('dialog[open]:not(#entryLobby)'))return;lobby.hidden=!show;if(show){gallery?.pause();if(!lobby.open)lobby.showModal();}else if(lobby.open)lobby.close();document.body.classList.toggle('choosing-class',show);for(const node of document.querySelectorAll('body > header,body > main,body > footer'))node.inert=show;}
function returnToLobby(){creationIntent=false;for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();gallery?.reset();renderLobby();showLobby(true);}
function enterExhibition(){if(!current)return;showLobby(false);walking();gallery.active=true;$('#sceneHost').focus({preventScroll:true});}
function listedClasses(){return classes.filter(c=>!c.deleting||store.manages(c)).sort((a,b)=>a.name.localeCompare(b.name,'ko',{numeric:true}));}
function managedClasses(){return listedClasses().filter(c=>store.manages(c));}
function fillClassSelect(select,items,placeholderText,selection=select.value){
 const placeholder=element('option',placeholderText);placeholder.value='';select.replaceChildren(placeholder);for(const c of items){const option=element('option',c.name+(c.deleting?' · 삭제 정리 중':` · ${classCapacity(c)}개 전시 자리`));option.value=c.id;select.append(option);}select.value=items.some(c=>c.id===selection)?selection:'';
}
function updateClassActions(){
 const ready=classesLoaded&&!entryError&&!preview&&!lobbyVisiting;
 $('#switchClassSelect').disabled=!ready||!listedClasses().length;$('#classVisitBtn').disabled=!ready||!listedClasses().some(c=>c.id===$('#switchClassSelect').value);
 $('#managedClassSelect').disabled=!ready||!store.canCreateClass()||!managedClasses().length;$('#manageSelectedClass').disabled=!ready||!store.canCreateClass()||!managedClasses().some(c=>c.id===$('#managedClassSelect').value);
 $('#managerCreateClass').disabled=!ready||!store.canCreateClass();
}
async function visitClass(c,manage=false){
 if(!c||lobbyVisiting)return;lobbyVisiting=true;updateLobbyActions();updateClassActions();
 try{managedChoice=manage?c.id:null;await selectClass(c);$('#classesDialog').close();enterExhibition();if(manage||c.deleting){renderManager();openDialog('#manager');$('#classPolicy')?.scrollIntoView?.({block:'start'});}}
 catch(e){status('#classesStatus',friendly(e),true);status('#lobbyStatus',friendly(e),true);if(manage)status('#managerStatus',friendly(e),true);}
 finally{lobbyVisiting=false;updateLobbyActions();updateClassActions();}
}
let lobbyVisiting=false;
function updateLobbyActions(){
 const ready=classesLoaded&&!entryError&&!preview,selected=listedClasses().find(c=>c.id===$('#lobbyClassSelect').value);
 $('#lobbyClassSelect').disabled=!ready||!listedClasses().length||lobbyVisiting;
 $('#lobbyVisitBtn').disabled=!ready||!selected||lobbyVisiting;
 $('#lobbyStudentBtn').disabled=!ready||!store.user||!classes.some(c=>!c.deleting)||lobbyVisiting;
}
function renderLobby(){
 const visible=listedClasses(),select=$('#lobbyClassSelect'),selection=select.value,placeholder=element('option','학급 선택하기');placeholder.value='';select.replaceChildren(placeholder);
 for(const c of visible){const option=element('option',c.name+(c.deleting?' · 삭제 정리 중':` · ${classCapacity(c)}개 전시 자리`));option.value=c.id;select.append(option);}select.value=visible.some(c=>c.id===selection)?selection:'';
 $('#lobbyEmpty').hidden=!classesLoaded||visible.length>0||!!entryError;$('#lobbyRetry').hidden=!entryError;$('#lobbyTeacherBtn').disabled=!classesLoaded;$('#lobbyTeacherBtn').textContent=store.canCreateClass()&&!preview?'선생님 · 우리 반 관리하기 →':'선생님 · 학급 개설하기 →';
 status('#lobbyStatus',entryError||(classesLoaded?(visible.length?'학급 선택하기를 눌러 주세요.':'선생님이 첫 학급 도서관을 개설해 주세요.'):'학급 도서관을 불러오고 있어요…'),!!entryError);updateLobbyActions();
}
$('#lobbyClassSelect').onchange=updateLobbyActions;
$('#lobbyVisitBtn').onclick=()=>visitClass(listedClasses().find(c=>c.id===$('#lobbyClassSelect').value));
$('#switchClassSelect').onchange=updateClassActions;$('#managedClassSelect').onchange=()=>{managedChoice=$('#managedClassSelect').value;renderManager();};
$('#classVisitBtn').onclick=()=>visitClass(listedClasses().find(c=>c.id===$('#switchClassSelect').value));
$('#manageSelectedClass').onclick=()=>visitClass(managedClasses().find(c=>c.id===$('#managedClassSelect').value),true);
function openTeacherHome(){creationIntent=!store.canCreateClass();$('#classesDialog').close();renderManager();openDialog('#manager');$('#manager .parchment-content').scrollTop=0;}
function openClassSetup(){
 if(!store.canCreateClass()||preview){openTeacherHome();return;}creationIntent=false;$('#manager').close();renderClasses();openDialog('#classesDialog');$('#createClassForm input[name=name]').focus();
}
$('#lobbyTeacherBtn').onclick=$('#classesTeacherBtn').onclick=$('#classesManageBtn').onclick=openTeacherHome;$('#managerCreateClass').onclick=openClassSetup;$('#lobbyRetry').onclick=()=>location.reload();
function renderClasses(){
 const visible=listedClasses(),selection=$('#switchClassSelect').value||current?.id;fillClassSelect($('#switchClassSelect'),visible,'학급 선택하기',selection);
 const human=!!store.user&&!store.user.isAnonymous,canCreate=store.canCreateClass()&&!preview;$('#lobbySession').hidden=!human;$('#lobbyAccountEmail').textContent=human?store.user.email||'':'';$('#lobbyLogoutBtn').disabled=loggingOut;$('#classesSession').hidden=!human;$('#classesAccountEmail').textContent=human?store.user.email:'';$('#classesManageBtn').textContent=canCreate?'우리 반 관리':'내 계정';$('#classesLogoutBtn').disabled=loggingOut;
 $('#createClassForm button').disabled=!canCreate;$('.class-create').hidden=!canCreate;$('#classesTeacherBtn').hidden=human;$('#classCreateNote').textContent=store.isAdmin?'학급을 개설하면 나를 담당 교사로 지정합니다. 다른 교사 배정은 전체 학급 설정에서 변경할 수 있어요.':'학급을 개설하면 내가 담당 교사로 지정됩니다. 내 학급의 작품과 제출함을 관리할 수 있어요.';updateClassActions();renderLobby();
}
function renderExhibition(){
 const capacity=classCapacity(current),exhibited=exhibitedBooks(current,books);$('#className').textContent=current.name;$('#bookCount').textContent=exhibited.length;$('#capacity').textContent=`${current.name} · ${exhibited.length} / ${capacity}개 작품 전시 중`;
 for(const button of document.querySelectorAll('[data-zone]')){const start=Number(button.dataset.zone)*10+1;button.hidden=start>capacity;button.querySelector('small').textContent=`${start}–${Math.min(start+9,capacity)}`;}
 $('#minimap').setAttribute('aria-label',`현재 위치와 ${capacity}개 전시 자리를 표시한 안내도`);gallery.setClass(current);gallery.setBooks(books);renderCatalog();renderManager();renderClasses();
}
const pendingCover='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="420" height="600"><rect width="420" height="600" fill="#e9dfc2"/><text x="210" y="300" text-anchor="middle" fill="#68583e" font-size="25">표지 준비 중…</text></svg>');
function startCovers(list,g){
 let status=document.querySelector('#coverLoading');if(!status){status=document.createElement('div');status.id='coverLoading';status.setAttribute('role','status');document.body.append(status);}
 const visible=exhibitedBooks(current,list);status.hidden=!visible.length;status.textContent='책 표지를 불러오고 있어요… 0 / '+visible.length;
 const active=()=>g===loading&&books===list;
 void store.loadCovers(visible,(book,done,total,failed)=>{gallery.updateCover?.(book);for(const img of document.querySelectorAll('#bookList img[data-slot]'))if(Number(img.dataset.slot)===book.slot)img.src=book.cover||pendingCover;status.textContent=done<total?'책 표지를 불러오고 있어요… '+done+' / '+total:failed?'일부 표지를 불러오지 못했어요. 학급에 다시 입장하면 재시도합니다.':'';status.hidden=done===total&&!failed;},active);
}
async function selectClass(c){
 const g=++loading;stopWatch();gallery.pause();const next=c.deleting?[]:await store.books(c.id,{covers:false});if(g!==loading)return;current=c;books=next;for(const b of books)b.cover||=pendingCover;$('#search').value='';renderExhibition();gallery.reset();startCovers(books,g);
 let snapshotGeneration=0;
 if(!preview)stopWatch=store.watch(c.id,async()=>{const snapshot=++snapshotGeneration;try{const latest=await store.getClass(c.id),next=latest.deleting?[]:await store.books(c.id,{covers:false});if(g!==loading||snapshot!==snapshotGeneration)return;current=latest;classes=classes.map(cls=>cls.id===latest.id?latest:cls);books=next;for(const b of books)b.cover||=pendingCover;renderExhibition();startCovers(books,g);}catch(e){if(g===loading){if(e.code==='class-not-found')await authChanged();else toast(friendly(e));}}},e=>toast(friendly(e)));
}
function renderCatalog(){$('#catalogTitle').textContent=(current?.name||'우리 반')+'의 책장';const q=$('#search').value.trim().toLowerCase();$('#bookList').replaceChildren();const found=exhibitedBooks(current,books).filter(b=>(b.title+' '+b.author).toLowerCase().includes(q));for(const b of found){const tile=element('article',undefined,'book-tile'),cover=element('button',undefined,'cover-button'),im=element('img');im.src=b.cover;im.dataset.slot=b.slot;im.alt=b.title+' 표지';cover.setAttribute('aria-label',b.title+' 읽기');cover.append(im);cover.onclick=()=>read(b);const actions=element('div',undefined,'tile-actions'),readBtn=element('button',b.kind==='video'?'영상북 보기 ▶':'책 읽기 ↗'),go=element('button','책 앞으로 →');readBtn.onclick=()=>read(b);go.onclick=()=>{$('#catalog').close();gallery.focusBook(b);walking();};actions.append(readBtn,go);const video=videoAction(b);if(video)actions.append(video);tile.append(cover,element('strong',b.title),element('small',`${String(b.slot).padStart(2,'0')} · ${b.author} 작가 · ${b.kind==='video'?'영상북':b.pages+'쪽'}`),actions);$('#bookList').append(tile);}if(!found.length)$('#bookList').append(element('p',q?'검색 결과가 없어요. 다른 제목이나 작가로 찾아보세요.':'첫 이야기를 기다리고 있어요. 내 책 올리기로 우리 반 책을 제출해 주세요.','empty-state'));}
function renderManager(){
 $('#studentBtn').disabled=preview||!store.user||!current||current.deleting===true;
 $('#teacherCreateHint').hidden=!creationIntent;$('#teacherCreateHint').textContent=!store.user||store.user.isAnonymous?'처음이라면 본인 이메일로 계정을 만들고 인증해 주세요. 로그인 후 바로 내 학급을 개설할 수 있어요.':!store.user.emailVerified?'이메일 인증 후 ‘인증 완료 · 다시 확인’을 누르면 우리 반 관리를 시작할 수 있어요.':'이메일 인증이 완료되었습니다. 내 학급을 바로 개설할 수 있어요.';
 const human=store.user&&!store.user.isAnonymous,owns=store.manages(current)&&!!current,title=store.isAdmin?'관리자':store.canEdit?'우리 반 관리':human?'내 계정':'교사·관리자 로그인';
 $('#manageBtn').textContent=title;$('#managerHeading').textContent=title;
 $('#saveState').textContent=store.mode==='firebase'?'Firebase · 연결됨':'기기 저장';
 $('#storageNote').textContent=human?(store.user.email+' · '+(store.isAdmin?'관리자':store.role==='teacher'?'교사':store.user.emailVerified?'계정 연결을 확인하고 있어요. 인증 완료 · 다시 확인을 눌러 주세요.':'로그인은 완료되었습니다. 이메일 인증을 완료해야 관리 화면이 열립니다.')):'학생은 로그인하지 않고 ‘내 책 올리기’를 이용하세요. 이곳은 교사·관리자 로그인 화면입니다.';
 $('#managerAccount').hidden=!human;$('#teacherHome').hidden=!human||!store.canCreateClass()||preview;
 const mine=managedClasses(),selected=managedChoice??(mine.some(c=>c.id===current?.id)?current.id:mine.length===1?mine[0].id:'');fillClassSelect($('#managedClassSelect'),mine,'내 학급 선택하기',selected);const activeOwn=owns&&$('#managedClassSelect').value===current.id;$('#teacherHomeNote').textContent=entryError|| (mine.length?(activeOwn?'선택한 학급의 작품·제출물·전시 설정을 아래에서 관리할 수 있어요.':'담당 학급을 선택하고 ‘우리 반 관리 열기’를 눌러 주세요.'):'아직 내 학급이 없어요. 새 학급을 개설해 도서관을 시작해 보세요.');updateClassActions();
 $('#loginPanel').hidden=store.canRead;$('#loginForm').hidden=!!human;$('#verifyEmail').hidden=!human||store.user.emailVerified;$('#refreshAuth').hidden=!human;$('#logout').hidden=!human;$('#logout').disabled=loggingOut;$('#resetPassword').hidden=!!human;
 $('#editorPanel').hidden=!activeOwn||preview||current?.deleting===true;$('#adminPanel').hidden=!store.isAdmin;$('#reviewPanel').hidden=!activeOwn||preview;
 const policy=$('#classPolicy');if(policy)policy.hidden=!activeOwn;if(!activeOwn){$('#submissionList').replaceChildren();if(policy)policy.replaceChildren();}if(!store.isAdmin)$('#adminClasses').replaceChildren();
 $('#editorClass').textContent=(current?.name||'학급')+' · 교사가 책 직접 전시하기';
 $('#slotSelect').replaceChildren();for(let i=1;i<=classCapacity(current);i++){const used=books.some(b=>b.slot===i),o=element('option',i+'번'+(used?' (사용 중)':''));o.value=i;o.disabled=used;$('#slotSelect').append(o);}
 const empty=availableSlots(current,books)[0];if(empty)$('#slotSelect').value=empty;$('#uploadSubmit').disabled=!empty||!activeOwn||current?.deleting===true;
 $('#manageBooks').replaceChildren();if(activeOwn)for(const b of books){const hidden=b.slot>classCapacity(current),row=element('div',undefined,'manage-item'),remove=element('button',hidden?'보관 작품 삭제':'전시에서 내리기');remove.onclick=async()=>{if(!confirm(hidden?'이 보관 작품을 삭제할까요? 다시 전시하려면 작품을 새로 올려야 합니다.':'이 책을 전시에서 내릴까요?'))return;try{await store.removeBook(current.id,b);await selectClass(current);}catch(e){status('#managerStatus',friendly(e),true);}};const edit=element('button','수정');edit.type='button';edit.dataset.editBook=String(b.slot);edit.setAttribute('aria-label',b.title+' 수정');row.append(element('span',b.slot+' · '+b.title+(hidden?' · 관람 화면에서 숨김 (작품 수를 늘리면 다시 전시)':'')),edit,remove);$('#manageBooks').append(row);}

}
$('#createClassForm').onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;status('#classesStatus','새 학급을 개설하고 있어요…');try{const c=await store.addClass(new FormData(e.target).get('name'),Number(new FormData(e.target).get('capacity')));classes=await store.classes();managedChoice=c.id;await selectClass(c);e.target.reset();status('#classesStatus','학급을 개설했어요. 이 학급의 전시관으로 이동했습니다.');$('#classesDialog').close();enterExhibition();renderManager();openDialog('#manager');status('#managerStatus','학급을 개설했어요. 이제 우리 반 작품과 제출물을 관리할 수 있습니다.');}catch(e){status('#classesStatus',friendly(e),true);}finally{btn.disabled=!store.canCreateClass()||preview;}};
$('#pdfInput').onchange=e=>{const f=e.target.files[0];const title=$('#uploadForm input[name=title]');if(f&&!title.value)title.value=f.name.replace(/\.pdf$/i,'').slice(0,100);};
$('#uploadForm').onsubmit=async e=>{e.preventDefault();if(!current||preview)return;const f=new FormData(e.target),file=f.get('pdf');const classId=current.id,cls=current;$('#uploadSubmit').disabled=true;status('#managerStatus','작품을 확인하고 있어요…');try{const parsed=await prepareBook(file,f.get('youtubeUrl'),f.get('title'),inspectPDF);$('#uploadProgress').hidden=false;$('#uploadProgress').value=0;await store.addBook(classId,{...parsed,title:f.get('title').trim(),author:f.get('author').trim(),slot:Number(f.get('slot'))},n=>{$('#uploadProgress').value=n;status('#managerStatus',`책을 저장하는 중… ${n}%`);});await selectClass(cls);e.target.reset();renderManager();showBookSuccess(cls.name,true,returnToLobby);status('#managerStatus',`‘${f.get('title')}’을 전시했어요. 다른 기기에서도 볼 수 있습니다.`);}catch(e){status('#managerStatus',friendly(e),true);}finally{$('#uploadProgress').hidden=true;renderManager();}};
$('#loginForm').onsubmit=async e=>{e.preventDefault();const form=e.target,data=new FormData(form),signup=e.submitter?.value==='signup';for(const b of form.querySelectorAll('button'))b.disabled=true;status('#managerStatus',signup?'계정을 만들고 있어요…':'로그인하고 있어요…');try{if(signup){await store.signup(data.get('email').trim().toLowerCase(),data.get('password'));status('#managerStatus','계정을 만들었어요. 아래 ‘인증 메일 보내기’로 이메일 인증을 완료한 뒤 ‘인증 완료 · 다시 확인’을 누르면 우리 반 관리에서 학급을 개설할 수 있어요.');}else{await store.login(data.get('email').trim().toLowerCase(),data.get('password'));status('#managerStatus',store.auth.currentUser.emailVerified?'로그인했습니다. 권한을 확인하고 있어요.':'로그인 성공! 아래 ‘인증 메일 보내기’를 눌러 이메일 인증을 완료해 주세요.');}form.elements.password.value='';}catch(e){status('#managerStatus',friendly(e),true);}finally{for(const b of form.querySelectorAll('button'))b.disabled=false;}};
$('#verifyEmail').onclick=async()=>{try{await store.verify();status('#managerStatus','인증 메일을 보냈어요. 이메일에서 인증한 뒤 ‘인증 완료 · 다시 확인’을 눌러 주세요.');}catch(e){status('#managerStatus',friendly(e),true);}};
$('#refreshAuth').onclick=async()=>{try{await store.refreshAuth();status('#managerStatus',store.canRead?'이메일 인증을 확인했습니다. 이제 내 학급을 개설하고 관리할 수 있어요.':store.user?.emailVerified?'이메일 인증은 완료되었습니다. 계정 연결을 다시 확인해 주세요.':'이메일 인증이 아직 완료되지 않았어요.');}catch(e){status('#managerStatus',friendly(e),true);}};
$('#resetPassword').onclick=async()=>{const email=$('#loginForm input[name=email]').value.trim();if(!email){status('#managerStatus','먼저 이메일을 입력해 주세요.',true);return;}try{await store.resetPassword(email);status('#managerStatus','가입된 이메일이라면 비밀번호 재설정 메일을 받을 수 있어요.');}catch(e){status('#managerStatus',friendly(e),true);}};
async function logoutTeacher(){
 if(loggingOut)return;loggingOut=true;$('#logout').disabled=$('#classesLogoutBtn').disabled=$('#lobbyLogoutBtn').disabled=true;
 try{await store.logout();creationIntent=false;teacherSessionKey='';managedChoice=null;$('#managedClassSelect').value='';$('#manager').close();$('#classesDialog').close();renderClasses();renderManager();toast('로그아웃했어요.');if(!current)showLobby(true);}
 catch(e){status('#managerStatus',friendly(e),true);status('#classesStatus',friendly(e),true);status('#lobbyStatus',friendly(e),true);}
 finally{loggingOut=false;$('#logout').disabled=$('#classesLogoutBtn').disabled=$('#lobbyLogoutBtn').disabled=false;}
}
$('#logout').onclick=$('#classesLogoutBtn').onclick=$('#lobbyLogoutBtn').onclick=logoutTeacher;
async function authChanged(){
 const g=++authLoading;preview=false;try{const next=await store.classes();if(g!==authLoading)return;classes=next;classesLoaded=true;entryError='';
 const key=store.user&&!store.user.isAnonymous&&store.canCreateClass()?store.user.email||'local':'',entered=!!key&&key!==teacherSessionKey,mine=managedClasses();let choice=classes.find(c=>c.id===current?.id);if(entered){managedChoice=null;if(mine.length===1)choice=mine[0];}
 if(choice)await selectClass(choice);else{++loading;stopWatch();current=null;books=[];gallery.setClass(null);gallery.setBooks([]);$('#className').textContent=classes.length?'학급을 선택해 주세요':'학급을 개설해 주세요';$('#bookCount').textContent='0';$('#capacity').textContent='학급 도서관을 선택해 주세요';showLobby(true);}if(g!==authLoading)return;
 teacherSessionKey=key;renderClasses();renderManager();if(key&&(creationIntent||(entered&&$('#manager').open))){creationIntent=false;$('#classesDialog').close();if(current)showLobby(false);renderManager();openDialog('#manager');$('#manager .parchment-content').scrollTop=0;}
 }catch(e){entryError='학급 도서관을 불러오지 못했어요. '+friendly(e);renderLobby();toast(friendly(e));renderManager();}
}
showLobby(true);renderClasses();try{await store.init(authChanged);if(store.mode==='local'){preview=false;await authChanged();}else renderManager();}catch(e){entryError='학급 도서관에 연결하지 못했어요. '+friendly(e);renderLobby();$('#saveState').textContent='연결 오류';$('#storageNote').textContent='공유 저장소에 연결하지 못했습니다. 새로고침 후 다시 시도해 주세요.';}

setupManagement({store,inspectPDF,read,openDialog,status,friendly,getCurrent:()=>current,getClasses:()=>classes,getEntryClass:()=>classes.find(c=>!c.deleting&&c.id===$('#lobbyClassSelect').value),refresh:authChanged,renderManager,onBookComplete:returnToLobby});
