import {nextNpcLine} from './visitors.js';

export class NpcSpeech{
 constructor(container){
  this.element=document.createElement('section');this.element.className='npc-speech';this.element.hidden=true;this.element.setAttribute('aria-label','도서관 친구와 대화');
  this.element.innerHTML='<div class="npc-speech-head"><strong></strong><button type="button" aria-label="대화 닫기">×</button></div><p role="status" aria-live="polite"></p><button type="button" class="npc-next">다른 이야기 듣기</button>';
  container.append(this.element);this.name=this.element.querySelector('strong');this.message=this.element.querySelector('p');this.element.querySelector('button').onclick=()=>this.close();this.element.querySelector('.npc-next').onclick=()=>this.show(this.person);
 }
 show(person){if(!person)return;const line=nextNpcLine(person);if(!line)return;this.close();this.person=person;person.userData.npc.paused=true;this.name.textContent=line.name+' · 도서관 친구';this.message.textContent=line.text;this.element.hidden=false;this.timer=setTimeout(()=>this.close(),12000);}
 close(){clearTimeout(this.timer);if(this.person)this.person.userData.npc.paused=false;this.person=null;this.element.hidden=true;}
}
