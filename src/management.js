import {editBookDialog} from './book-editor.js';
import {showBookSuccess} from './feedback.js';
import {prepareBook} from './video.js';
import {classCapacity,assertCapacity,availableSlots} from './capacity.js';
export function setupManagement({store,inspectPDF,read,openDialog,status,friendly,getCurrent,getClasses,getEntryClass,refresh,renderManager,onBookComplete}){
 const $=s=>document.querySelector(s),el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
 $('#manageBooks').addEventListener('click',async event=>{const button=event.target.closest('[data-edit-book]');if(!button)return;const c=getCurrent();if(!c||!store.manages(c))return;try{const book=(await store.books(c.id,{covers:false})).find(b=>b.slot===Number(button.dataset.editBook));if(!book)throw Error('책을 찾을 수 없어요.');editBookDialog(store,c,book,refresh,inspectPDF);}catch(e){status('#managerStatus',friendly(e),true);}});
 $('#editorPanel').before($('#adminPanel'),$('#reviewPanel'));
 let submitting=false,reviewGeneration=0,studentClass;
 const error=e=>status('#managerStatus',friendly(e),true);
 const activeDeletes=new Set();
 async function requestDelete(c,button){
  if(activeDeletes.has(c.id))return;
  if(!confirm(`‘${c.name}’ 도서관을 삭제할까요?\n\n전시 작품, 보관 작품, 학생 제출물과 모든 PDF·표지 파일이 함께 삭제됩니다. 삭제한 내용은 되돌릴 수 없습니다.\n\n모두 삭제하려면 확인을 눌러 주세요.`))return;
  activeDeletes.add(c.id);button.disabled=true;status('#managerStatus','학급의 작품과 제출물을 삭제하고 있어요…');
  try{await store.deleteClass(c,message=>status('#managerStatus',message));if(getCurrent()?.id===c.id)$('#manager').close();await refresh();await dashboard();status('#classesStatus','학급과 모든 작품·제출물을 삭제했습니다.');status('#managerStatus','학급과 모든 작품·제출물을 삭제했습니다.');}
  catch(e){await refresh().catch(()=>{});error(e);await dashboard().catch(()=>{});}
  finally{activeDeletes.delete(c.id);button.disabled=false;renderPolicy();}
 }
 function deleteButton(c){const button=el('button',c.deleting?'삭제 계속하기':'내 학급 도서관 삭제');button.className='outline danger-button';button.disabled=activeDeletes.has(c.id);button.onclick=()=>requestDelete(c,button);return button;}

 function renderDestination(){const selected=$('#studentClassSelect');$('#studentClass').textContent=studentClass?.name||'학급 선택 전';$('#studentDestinationHeading').textContent='제출할 학급';document.querySelector('label[for=studentClassSelect]').textContent=studentClass?'다른 학급으로 변경':'제출할 학급 선택';selected.disabled=submitting||!selected.options.length;$('#studentSubmit').disabled=submitting||!studentClass?.accepting;$('#studentSubmit').textContent=studentClass?studentClass.name+'에 책 제출하기':'책 제출하기';$('#studentMode').textContent=!studentClass?'학급을 고른 뒤 책을 제출해 주세요.':!studentClass.accepting?'이 학급은 현재 새 작품 제출을 받지 않습니다.':studentClass.autoPublish?'제출하면 빈 자리에 바로 전시됩니다.':'선생님 승인 후 전시됩니다.';}
 function openStudent(destination){const classes=getClasses().filter(c=>!c.deleting);studentClass=classes.find(c=>c.id===destination?.id);const select=$('#studentClassSelect');select.replaceChildren();if(!studentClass){const option=el('option','제출할 학급을 선택해 주세요');option.value='';select.append(option);}for(const c of classes){const option=el('option',c.name+(c.accepting?' · 제출 가능':' · 제출 마감'));option.value=c.id;select.append(option);}select.value=studentClass?.id||'';renderDestination();status('#studentStatus','');openDialog('#studentDialog');}
 $('#studentBtn').onclick=()=>openStudent(getCurrent());$('#lobbyStudentBtn').onclick=()=>openStudent(getEntryClass?.());
 $('#studentClassSelect').onchange=e=>{studentClass=getClasses().find(c=>c.id===e.target.value);renderDestination();status('#studentStatus','');};
 $('#studentForm').onsubmit=async e=>{e.preventDefault();if(submitting)return;const c=studentClass;if(!c||!c.accepting)return;submitting=true;renderDestination();const data=new FormData(e.target);status('#studentStatus','작품을 확인하고 있어요…');try{const parsed=await prepareBook(data.get('pdf'),data.get('youtubeUrl'),data.get('title'),inspectPDF);const result=await store.submitBook(c,{...parsed,title:data.get('title').trim(),author:data.get('author').trim()},n=>status('#studentStatus','책을 제출하고 있어요… '+n+'%'));e.target.reset();await refresh();showBookSuccess(c.name,result?.published===true,onBookComplete);status('#studentStatus',result?.published?'등록 완료! '+c.name+' 전시관에서 지금 바로 읽을 수 있어요.':'제출 완료! '+c.name+' 선생님이 확인하면 전시됩니다.');}catch(err){status('#studentStatus',friendly(err),true);}finally{submitting=false;studentClass=getClasses().find(cls=>cls.id===c.id);renderDestination();}};
 const policy=el('section');policy.className='admin-row class-settings';policy.id='classPolicy';$('#reviewPanel').before(policy);
 const field=(text,input)=>{const label=el('label',text);label.className='class-setting';label.append(input);return label;};
 function capacityField(c){const input=el('input');input.type='number';input.min='1';input.max='30';input.step='1';input.required=true;input.value=classCapacity(c);input.setAttribute('aria-label',c.name+' 전시할 작품 수');return input;}
 function submissionField(c){const input=el('input');input.type='checkbox';input.checked=c.accepting===true;const label=el('label');label.className='submission-toggle';label.append(input,document.createTextNode('학생 작품 제출 허용'));return{input,label};}
 const capacityNote=()=>el('p','학생 1명당 1개 작품을 전시하려면 학생 수를 입력하세요. 기존 학급도 20개로 저장하면 전시 자리가 20개만 보입니다. 1~30개까지 설정할 수 있습니다. 줄인 범위 밖의 작품은 삭제하지 않고 보관하며, 숫자를 다시 늘리면 해당 자리의 작품이 다시 나타납니다.');
 const submissionNote=()=>el('p','체크하면 학생이 ‘내 책 올리기’로 새 작품을 제출할 수 있습니다. 체크를 해제하면 새 제출만 중단되고, 이미 전시된 작품과 승인 대기 작품은 유지됩니다. 교사는 계속 직접 전시할 수 있습니다.');
 function canManageCurrent(c){return !!c&&store.manages(c)&&($('#teacherHome').hidden||$('#managedClassSelect').value===c.id);}
 function renderPolicy(){
  const c=getCurrent();policy.replaceChildren();policy.hidden=!canManageCurrent(c);if(policy.hidden)return;if(c.deleting){policy.append(el('strong',c.name+' · 삭제 정리 중'),el('p','새 제출은 중단되었습니다. 삭제가 중단되었다면 아래 버튼으로 남은 작품과 제출물을 정리해 주세요.'),deleteButton(c));return;}
  const heading=el('strong',c.name+' · 전시 및 학생 제출 설정'),capacity=capacityField(c),accept=submissionField(c),mode=el('select'),save=el('button','전시·제출 설정 저장'),note=el('p','교사 승인 후 전시: 학생 작품을 제출함에 보관하고, 선생님이 승인하면 전시합니다. 바로 전시: 학생이 제출하면 빈 전시 자리에 즉시 공개합니다. 기존 승인 대기 작품은 자동으로 전시되지 않습니다.');
  mode.setAttribute('aria-label','학생 책 등록 방식');for(const [value,text]of [['review','교사 승인 후 전시'],['direct','학생이 올리면 바로 전시']]){const o=el('option',text);o.value=value;mode.append(o);}mode.value=c.autoPublish?'direct':'review';
  save.onclick=async()=>{save.disabled=true;try{assertCapacity(capacity.valueAsNumber);await store.updateClass(c,{capacity:capacity.valueAsNumber,accepting:accept.input.checked,autoPublish:mode.value==='direct'});await refresh();renderPolicy();await dashboard();status('#managerStatus','학급의 작품 수와 학생 제출 설정을 저장했습니다.');}catch(e){error(e);}finally{save.disabled=false;}};
  policy.append(heading,field('전시할 작품 수 (학생 수)',capacity),capacityNote(),accept.label,submissionNote(),field('제출한 작품의 전시 방식',mode),note,save);
  if(!store.isAdmin)policy.append(el('p','학급을 삭제하면 전시·보관 작품과 학생 제출물, PDF·표지가 모두 삭제됩니다.'),deleteButton(c));
 }
 async function review(){renderPolicy();const generation=++reviewGeneration,c=getCurrent(),host=$('#submissionList');host.replaceChildren();if(!canManageCurrent(c)||c.deleting)return;try{const items=await store.submissions(c.id);if(generation!==reviewGeneration||!canManageCurrent(c)||getCurrent()?.id!==c.id)return;if(!items.length)host.append(el('p','확인할 학생 책이 없습니다.'));for(const b of items){const row=el('article');row.className='admin-row';row.append(el('strong',b.title),el('p',b.author+' · '+(b.kind==='video'?'영상북':b.pages+'쪽')));const preview=el('button','책 확인'),approve=el('button','승인하여 전시'),reject=el('button','반려 · 제출 삭제'),slot=el('select');slot.setAttribute('aria-label',b.title+' 전시 위치');const books=await store.books(c.id);for(const i of availableSlots(c,books)){const o=el('option',i+'번 전시 자리');o.value=i;slot.append(o);}approve.disabled=!slot.options.length;preview.onclick=()=>{$('#manager').close();read(b);};approve.onclick=async()=>{approve.disabled=true;status('#managerStatus','책을 전시하고 있어요…');try{await store.approveSubmission(c.id,b,Number(slot.value));await refresh();await review();status('#managerStatus','승인하여 전시했습니다.');}catch(e){error(e);approve.disabled=false;}};reject.onclick=async()=>{if(!confirm('이 제출을 반려하고 삭제할까요? 학생은 다시 제출할 수 있습니다.'))return;try{await store.removeSubmission(c.id,b);await review();}catch(e){error(e);}};row.append(preview,slot,approve,reject);host.append(row);}}catch(e){error(e);}}
 async function dashboard(){if(!store.isAdmin)return;const host=$('#adminClasses');host.replaceChildren();for(const c of getClasses()){
  const row=el('article');row.className='admin-row class-settings';const name=el('input'),teacher=el('input'),capacity=capacityField(c),accept=submissionField(c),save=el('button','학급 설정 저장'),remove=el('button',c.deleting?'삭제 계속하기':'학급과 작품 모두 삭제');
  name.value=c.name;name.maxLength=40;name.setAttribute('aria-label',c.name+' 학급 이름');teacher.value=c.teacherEmail||'';teacher.type='email';teacher.placeholder='담당 교사 이메일';teacher.setAttribute('aria-label',c.name+' 담당 교사 이메일');row.append(field('학급 이름',name),field('담당 교사 이메일',teacher),field('전시할 작품 수 (학생 수)',capacity),capacityNote(),accept.label,submissionNote(),save,remove);
  save.onclick=async()=>{save.disabled=true;try{assertCapacity(capacity.valueAsNumber);const email=teacher.value.trim().toLowerCase();if(!name.value.trim()||!email||!teacher.checkValidity())throw Error('학급 이름과 올바른 교사 이메일을 입력해 주세요.');await store.updateClass(c,{name:name.value.trim(),teacherEmail:email,capacity:capacity.valueAsNumber,accepting:accept.input.checked});await refresh();await dashboard();renderPolicy();status('#managerStatus','학급 설정을 저장했습니다.');}catch(e){error(e);}finally{save.disabled=false;}};
  save.disabled=c.deleting===true;remove.disabled=activeDeletes.has(c.id);remove.className='danger-button';remove.onclick=()=>requestDelete(c,remove);host.append(row);
 }
 }
 $('#refreshSubmissions').onclick=review;
 $('#manageBtn').addEventListener('click',()=>{review();dashboard().catch(error);});
 if($('#manager').open){review();dashboard().catch(error);}
 // A newly authenticated manager can enter the console without reopening the dialog.
 const observer=new MutationObserver(()=>{if(!$('#adminPanel').hidden)dashboard().catch(error);});observer.observe($('#adminPanel'),{attributes:true,attributeFilter:['hidden']});const reviewObserver=new MutationObserver(()=>{if(!$('#reviewPanel').hidden)review();});reviewObserver.observe($('#reviewPanel'),{attributes:true,attributeFilter:['hidden']});
}
