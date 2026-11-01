import {classCapacity,availableSlots,exhibitedBooks} from './capacity.js';
import {setupManagement} from './management.js';
import {LibraryStore} from './store.js';
import {Reader,inspectPDF} from './reader.js';
import {Gallery} from './gallery.js';
const $=s=>document.querySelector(s),store=new LibraryStore();let classes=[],books=[],current=null,preview=true,loading=0,stopWatch=()=>{},authLoading=0,toastTimer,gallery,classesLoaded=false,entryError='',creationIntent=false;
function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
function status(selector,message,error=false){$(selector).textContent=message;$(selector).classList.toggle('error',error);}
function friendly(e){const code=e?.code||'';if(code.includes('invalid-credential'))return'이메일 또는 비밀번호가 맞지 않습니다. 이미 가입했다면 아래 비밀번호 재설정 메일을 이용해 주세요.';if(code.includes('email-already-in-use'))return'이미 가입된 이메일이에요. 로그인하거나 비밀번호를 재설정해 주세요.';if(code.includes('too-many-requests'))return'잠시 후 다시 시도해 주세요.';if(code.includes('permission-denied')||code.includes('unauthorized'))return'권한이 없어요. 이메일 인증과 관리자에게 등록된 계정 권한을 확인해 주세요.';if(code.includes('network'))return'인터넷 연결을 확인해 주세요.';return e?.message||'요청을 처리하지 못했어요. 다시 시도해 주세요.';}
function walking(){if(!current||!$('#entryLobby').hidden){gallery?.keys.clear();return;}$('#welcome').hidden=true;}
function openDialog(id){gallery?.pause();if(!$(id).open)$(id).showModal();}
function read(book){gallery?.pause();$('#catalog').close();reader.open(book);}
const reader=new Reader(store,()=>$('#sceneHost').focus({preventScroll:true}));
gallery=new Gallery($('#sceneHost'),{onRead:read,onMove:walking,onNear:b=>{$('#readNear').hidden=!b;$('#nearTitle').textContent=b?.title||'';},onZone:n=>{$('#zoneLabel').textContent=`GALLERY 0${n+1}`;document.querySelectorAll('[data-zone]').forEach(b=>b.classList.toggle('active',Number(b.dataset.zone)===n));},onError:e=>{if(!gallery?.renderer){$('#webglFallback').hidden=false;$('#welcome').hidden=true;}else toast(e.message);}});
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>b.closest('dialog').close());document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',()=>{gallery?.keys.clear();if(!current&&!document.querySelector('dialog[open]'))showLobby(true);}));$('#entryLobby').addEventListener('cancel',e=>{if(!current)e.preventDefault();});
$('#enterBtn').onclick=enterExhibition;
$('#resetView').onclick=()=>{gallery?.reset();walking();};$('#immersiveBtn').onclick=async()=>{walking();try{await gallery.lock();}catch(e){toast('이 브라우저에서는 화면을 드래그해 둘러봐 주세요.');}};
$('#fullscreenBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#gallery').requestFullscreen();}catch{toast('이 브라우저에서는 전체 화면을 지원하지 않아요.');}};
let high=false;$('#qualityBtn').onclick=()=>{high=!high;gallery.quality(high);$('#qualityBtn').textContent=high?'화질 · 고화질':'화질 · 가볍게';};
document.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>{gallery.zone(Number(b.dataset.zone));walking();});
$('#readNear').onclick=()=>gallery.near&&read(gallery.near);$('#helpBtn').onclick=()=>openDialog('#help');$('#catalogBtn').onclick=$('#fallbackCatalog').onclick=()=>{renderCatalog();openDialog('#catalog');};$('#search').oninput=renderCatalog;
$('#classesBtn').onclick=async()=>{renderClasses();openDialog('#classesDialog');if(!preview){try{classes=await store.classes();classesLoaded=true;entryError='';renderClasses();}catch(e){status('#classesStatus',friendly(e),true);}}};$('#manageBtn').onclick=()=>{renderManager();openDialog('#manager');};
function showLobby(show){const lobby=$('#entryLobby');if(show&&document.querySelector('dialog[open]:not(#entryLobby)'))return;lobby.hidden=!show;if(show){gallery?.pause();if(!lobby.open)lobby.showModal();}else if(lobby.open)lobby.close();document.body.classList.toggle('choosing-class',show);for(const node of document.querySelectorAll('body > header,body > main,body > footer'))node.inert=show;}
function enterExhibition(){if(!current)return;showLobby(false);walking();gallery.active=true;$('#sceneHost').focus({preventScroll:true});}
function listedClasses(){return classes.filter(c=>!c.deleting||store.manages(c)).sort((a,b)=>a.name.localeCompare(b.name,'ko',{numeric:true}));}
function classCard(c){const btn=element('button',undefined,'class-card'+(current?.id===c.id?' selected':''));btn.append(element('strong',c.name),element('small',c.deleting?'삭제 계속하기':`${classCapacity(c)}개 전시 자리 · ${current?.id===c.id?'머무는 중':'도서관 들어가기'}`),element('span','↗','arrow'));btn.onclick=async()=>{btn.disabled=true;try{await selectClass(c);$('#classesDialog').close();enterExhibition();if(c.deleting)$('#manageBtn').click();}catch(e){status('#classesStatus',friendly(e),true);status('#lobbyStatus',friendly(e),true);}finally{btn.disabled=false;}};return btn;}
function updateLobbyListHint(){
 const host=$('#lobbyClasses'),hint=$('#lobbyListHint'),overflow=host.scrollHeight>host.clientHeight+2;hint.hidden=!overflow;host.tabIndex=overflow?0:-1;if(overflow)host.setAttribute('aria-describedby','lobbyListHint');else host.removeAttribute('aria-describedby');
}
function renderLobby(){
 const visible=listedClasses(),host=$('#lobbyClasses'),scrollTop=host.scrollTop;host.replaceChildren();for(const c of visible)host.append(classCard(c));host.scrollTop=scrollTop;
 $('#lobbyTotal').hidden=!classesLoaded||!visible.length||!!entryError;$('#lobbyTotal').textContent=visible.length+'개 학급';$('#lobbyEmpty').hidden=!classesLoaded||visible.length>0||!!entryError;$('#lobbyRetry').hidden=!entryError;$('#lobbyTeacherBtn').disabled=!classesLoaded;$('#lobbyTeacherBtn').textContent=store.canCreateClass()&&!preview?'내 학급 도서관 개설하기 →':'선생님 · 학급 개설하기 →';
 status('#lobbyStatus',entryError||(classesLoaded?(visible.length?'아래 목록에서 방문할 학급을 눌러 주세요.':'선생님이 첫 학급 도서관을 개설해 주세요.'):'학급 도서관을 불러오고 있어요…'),!!entryError);queueMicrotask(updateLobbyListHint);
}
if(typeof ResizeObserver!=='undefined'){const listObserver=new ResizeObserver(updateLobbyListHint);listObserver.observe($('#lobbyClasses'));}document.fonts?.ready.then(updateLobbyListHint);
function openClassSetup(){
 creationIntent=true;if(store.canCreateClass()&&!preview){creationIntent=false;$('#manager').close();renderClasses();openDialog('#classesDialog');$('#createClassForm input[name=name]').focus();return;}
 $('#classesDialog').close();$('#manageBtn').click();
}
$('#lobbyTeacherBtn').onclick=$('#classesTeacherBtn').onclick=openClassSetup;$('#lobbyRetry').onclick=()=>location.reload();
function renderClasses(){
 $('#classesGrid').replaceChildren();for(const c of listedClasses())$('#classesGrid').append(classCard(c));if(!listedClasses().length)$('#classesGrid').append(element('p','아직 개설된 학급 도서관이 없어요. 선생님은 로그인 후 첫 학급을 개설해 주세요.','empty-state'));
 const canCreate=store.canCreateClass()&&!preview;$('#createClassForm button').disabled=!canCreate;$('.class-create').hidden=!canCreate;$('#classesTeacherBtn').hidden=canCreate;$('#classCreateNote').textContent=store.isAdmin?'학급을 개설하면 나를 담당 교사로 지정합니다. 다른 교사 배정은 전체 학급 설정에서 변경할 수 있어요.':'학급을 개설하면 내가 담당 교사로 지정됩니다. 내 학급의 작품과 제출함을 관리할 수 있어요.';renderLobby();
}
function renderExhibition(){
 const capacity=classCapacity(current),exhibited=exhibitedBooks(current,books);$('#className').textContent=current.name;$('#bookCount').textContent=exhibited.length;$('#capacity').textContent=`${current.name} · ${exhibited.length} / ${capacity}개 작품 전시 중`;
 for(const button of document.querySelectorAll('[data-zone]')){const start=Number(button.dataset.zone)*10+1;button.hidden=start>capacity;button.querySelector('small').textContent=`${start}–${Math.min(start+9,capacity)}`;}
 $('#minimap').setAttribute('aria-label',`현재 위치와 ${capacity}개 전시 자리를 표시한 안내도`);gallery.setClass(current);gallery.setBooks(books);renderCatalog();renderManager();renderClasses();
}
async function selectClass(c){
 const g=++loading;stopWatch();gallery.pause();const next=c.deleting?[]:await store.books(c.id);if(g!==loading)return;current=c;books=next;$('#search').value='';renderExhibition();gallery.reset();
 let snapshotGeneration=0;
 if(!preview)stopWatch=store.watch(c.id,async()=>{const snapshot=++snapshotGeneration;try{const latest=await store.getClass(c.id),next=latest.deleting?[]:await store.books(c.id);if(g!==loading||snapshot!==snapshotGeneration)return;current=latest;classes=classes.map(cls=>cls.id===latest.id?latest:cls);books=next;renderExhibition();}catch(e){if(g===loading){if(e.code==='class-not-found')await authChanged();else toast(friendly(e));}}},e=>toast(friendly(e)));
}
function renderCatalog(){$('#catalogTitle').textContent=(current?.name||'우리 반')+'의 책장';const q=$('#search').value.trim().toLowerCase();$('#bookList').replaceChildren();const found=exhibitedBooks(current,books).filter(b=>(b.title+' '+b.author).toLowerCase().includes(q));for(const b of found){const tile=element('article',undefined,'book-tile'),cover=element('button',undefined,'cover-button'),im=element('img');im.src=b.cover;im.alt=b.title+' 표지';cover.setAttribute('aria-label',b.title+' 읽기');cover.append(im);cover.onclick=()=>read(b);const actions=element('div',undefined,'tile-actions'),readBtn=element('button','책 읽기 ↗'),go=element('button','책 앞으로 →');readBtn.onclick=()=>read(b);go.onclick=()=>{$('#catalog').close();gallery.focusBook(b);walking();};actions.append(readBtn,go);tile.append(cover,element('strong',b.title),element('small',`${String(b.slot).padStart(2,'0')} · ${b.author} 작가 · ${b.pages}쪽`),actions);$('#bookList').append(tile);}if(!found.length)$('#bookList').append(element('p',q?'검색 결과가 없어요. 다른 제목이나 작가로 찾아보세요.':'첫 이야기를 기다리고 있어요. 내 책 올리기로 우리 반 책을 제출해 주세요.','empty-state'));}
function renderManager(){
 $('#studentBtn').disabled=preview||!store.user||!current||current.deleting===true;
 $('#teacherCreateHint').hidden=!creationIntent;$('#teacherCreateHint').textContent=!store.user||store.user.isAnonymous?'교사로 등록된 계정은 로그인하면 내 학급 개설 화면으로 이동합니다. 처음이라면 아래에서 본인 이메일로 계정을 만들어 주세요.':!store.user.emailVerified?'이메일 인증을 완료한 뒤 ‘인증 완료 · 다시 확인’을 누르면 학급 개설 화면으로 이동합니다.':'학급 개설에는 교사 권한이 필요합니다. 관리자에게 이 이메일을 교사로 등록해 달라고 요청해 주세요.';
 const human=store.user&&!store.user.isAnonymous,owns=store.manages(current)&&!!current,title=store.isAdmin?'관리자':store.canEdit?'내 학급 관리':human?'내 계정':'교사·관리자 로그인';
 $('#manageBtn').textContent=title;$('#managerHeading').textContent=title;
 $('#saveState').textContent=store.mode==='firebase'?'Firebase · 연결됨':'기기 저장';
 $('#storageNote').textContent=human?(store.user.email+' · '+(store.isAdmin?'관리자':store.role==='teacher'?'교사':store.role==='student'?'학생':store.user.emailVerified?'교사 권한 등록이 필요합니다. 가입한 이메일을 관리자에게 알려 주세요.':'로그인은 완료되었습니다. 이메일 인증을 완료해야 관리 화면이 열립니다.')):'학생은 로그인하지 않고 ‘내 책 올리기’를 이용하세요. 이곳은 교사·관리자 로그인 화면입니다.';
 $('#loginPanel').hidden=store.canRead;$('#loginForm').hidden=!!human;$('#verifyEmail').hidden=!human||store.user.emailVerified;$('#refreshAuth').hidden=!human;$('#logout').hidden=!human;$('#resetPassword').hidden=!!human;
 $('#editorPanel').hidden=!owns||preview||current?.deleting===true;$('#invitePanel').hidden=!store.isAdmin;$('#adminPanel').hidden=!store.isAdmin;$('#reviewPanel').hidden=!owns||preview;
 $('#editorClass').textContent=(current?.name||'학급')+' · 교사가 책 직접 전시하기';
 $('#slotSelect').replaceChildren();for(let i=1;i<=classCapacity(current);i++){const used=books.some(b=>b.slot===i),o=element('option',i+'번'+(used?' (사용 중)':''));o.value=i;o.disabled=used;$('#slotSelect').append(o);}
 const empty=availableSlots(current,books)[0];if(empty)$('#slotSelect').value=empty;$('#uploadSubmit').disabled=!empty||!owns||current?.deleting===true;
 $('#manageBooks').replaceChildren();if(owns)for(const b of books){const hidden=b.slot>classCapacity(current),row=element('div',undefined,'manage-item'),remove=element('button',hidden?'보관 작품 삭제':'전시에서 내리기');remove.onclick=async()=>{if(!confirm(hidden?'이 보관 작품을 삭제할까요? 다시 전시하려면 작품을 새로 올려야 합니다.':'이 책을 전시에서 내릴까요?'))return;try{await store.removeBook(current.id,b);await selectClass(current);}catch(e){status('#managerStatus',friendly(e),true);}};row.append(element('span',b.slot+' · '+b.title+(hidden?' · 관람 화면에서 숨김 (작품 수를 늘리면 다시 전시)':'')),remove);$('#manageBooks').append(row);}
 if(store.canEdit&&!owns)$('#storageNote').textContent+=' 현재 학급의 담당 교사가 아닙니다. 담당 학급으로 이동해 주세요.';
}
$('#createClassForm').onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector('button');btn.disabled=true;status('#classesStatus','새 학급을 개설하고 있어요…');try{const c=await store.addClass(new FormData(e.target).get('name'),Number(new FormData(e.target).get('capacity')));classes=await store.classes();await selectClass(c);e.target.reset();status('#classesStatus','학급을 개설했어요. 이 학급의 전시관으로 이동했습니다.');$('#classesDialog').close();enterExhibition();if(c.deleting)$('#manageBtn').click();}catch(e){status('#classesStatus',friendly(e),true);}finally{btn.disabled=!store.canCreateClass()||preview;}};
$('#pdfInput').onchange=e=>{const f=e.target.files[0];const title=$('#uploadForm input[name=title]');if(f&&!title.value)title.value=f.name.replace(/\.pdf$/i,'').slice(0,100);};
$('#uploadForm').onsubmit=async e=>{e.preventDefault();if(!current||preview)return;const f=new FormData(e.target),file=f.get('pdf');if(!file?.size)return;const classId=current.id,cls=current;$('#uploadSubmit').disabled=true;status('#managerStatus','PDF 표지와 페이지를 확인하고 있어요…');try{const parsed=await inspectPDF(file);$('#uploadProgress').hidden=false;$('#uploadProgress').value=0;await store.addBook(classId,{...parsed,title:f.get('title').trim(),author:f.get('author').trim(),slot:Number(f.get('slot'))},n=>{$('#uploadProgress').value=n;status('#managerStatus',`책을 저장하는 중… ${n}%`);});await selectClass(cls);e.target.reset();renderManager();status('#managerStatus',`‘${f.get('title')}’을 전시했어요. 다른 기기에서도 볼 수 있습니다.`);}catch(e){status('#managerStatus',friendly(e),true);}finally{$('#uploadProgress').hidden=true;renderManager();}};
$('#loginForm').onsubmit=async e=>{e.preventDefault();const form=e.target,data=new FormData(form),signup=e.submitter?.value==='signup';for(const b of form.querySelectorAll('button'))b.disabled=true;status('#managerStatus',signup?'계정을 만들고 있어요…':'로그인하고 있어요…');try{if(signup){await store.signup(data.get('email').trim().toLowerCase(),data.get('password'));status('#managerStatus','계정을 만들었어요. 아래 ‘인증 메일 보내기’로 이메일 인증을 완료해 주세요. 관리자가 교사로 등록한 계정은 학급을 개설·관리할 수 있습니다.');}else{await store.login(data.get('email').trim().toLowerCase(),data.get('password'));status('#managerStatus',store.auth.currentUser.emailVerified?'로그인했습니다. 권한을 확인하고 있어요.':'로그인 성공! 아래 ‘인증 메일 보내기’를 눌러 이메일 인증을 완료해 주세요.');}form.elements.password.value='';}catch(e){status('#managerStatus',friendly(e),true);}finally{for(const b of form.querySelectorAll('button'))b.disabled=false;}};
$('#verifyEmail').onclick=async()=>{try{await store.verify();status('#managerStatus','인증 메일을 보냈어요. 이메일에서 인증한 뒤 ‘인증 완료 · 다시 확인’을 눌러 주세요.');}catch(e){status('#managerStatus',friendly(e),true);}};
$('#refreshAuth').onclick=async()=>{try{await store.refreshAuth();status('#managerStatus',store.canRead?'이메일 인증과 등록된 권한을 확인했습니다.':store.user?.emailVerified?'이메일 인증은 완료되었습니다. 관리자에게 가입한 이메일을 알려 교사 등록을 요청해 주세요.':'이메일 인증이 아직 완료되지 않았어요.');}catch(e){status('#managerStatus',friendly(e),true);}};
$('#resetPassword').onclick=async()=>{const email=$('#loginForm input[name=email]').value.trim();if(!email){status('#managerStatus','먼저 이메일을 입력해 주세요.',true);return;}try{await store.resetPassword(email);status('#managerStatus','가입된 이메일이라면 비밀번호 재설정 메일을 받을 수 있어요.');}catch(e){status('#managerStatus',friendly(e),true);}};
$('#logout').onclick=async()=>{await store.logout();status('#managerStatus','로그아웃했어요.');};$('#inviteForm').onsubmit=async e=>{e.preventDefault();const d=new FormData(e.target);try{await store.invite(d.get('email'),d.get('role'));status('#managerStatus','계정 권한을 등록했습니다. 해당 이메일로 가입·인증 후 로그인하면 적용됩니다.');e.target.reset();}catch(e){status('#managerStatus',friendly(e),true);}};
async function authChanged(){
 const g=++authLoading;preview=false;try{const next=await store.classes();if(g!==authLoading)return;classes=next;classesLoaded=true;entryError='';const choice=classes.find(c=>c.id===current?.id);
 if(choice)await selectClass(choice);else{++loading;stopWatch();current=null;books=[];gallery.setClass(null);gallery.setBooks([]);$('#className').textContent=classes.length?'학급을 선택해 주세요':'학급을 개설해 주세요';$('#bookCount').textContent='0';$('#capacity').textContent='학급 도서관을 선택해 주세요';showLobby(true);}
 renderClasses();renderManager();if(creationIntent&&store.canCreateClass())openClassSetup();
 }catch(e){entryError='학급 도서관을 불러오지 못했어요. '+friendly(e);renderLobby();toast(friendly(e));renderManager();}
}
showLobby(true);renderClasses();try{await store.init(authChanged);if(store.mode==='local'){preview=false;await authChanged();}else renderManager();}catch(e){entryError='학급 도서관에 연결하지 못했어요. '+friendly(e);renderLobby();$('#saveState').textContent='연결 오류';$('#storageNote').textContent='공유 저장소에 연결하지 못했습니다. 새로고침 후 다시 시도해 주세요.';}

setupManagement({store,inspectPDF,read,openDialog,status,friendly,getCurrent:()=>current,getClasses:()=>classes,refresh:authChanged,renderManager});
