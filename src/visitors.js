import * as THREE from 'three';

const readingLines=['안녕! 친구들이 만든 이야기를 읽고 있어.','표지에 어떤 이야기가 숨어 있을지 상상해 봐!','같은 책을 읽어도 좋아하는 장면은 서로 다를 수 있대.','마음에 드는 책을 찾으면 끝까지 읽어 보자.'];
export function giveDialogue(person,name,lines=readingLines){person.userData.npc={name,lines:[...lines],line:0,paused:false};const target=new THREE.Mesh(new THREE.BoxGeometry(.7,1.95,.8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));target.name='npc-touch-target';target.position.set(0,.98,.1);person.add(target);return person;}
export function nextNpcLine(person){const npc=person.userData.npc;if(!npc)return null;const text=npc.lines[npc.line%npc.lines.length];npc.line=(npc.line+1)%npc.lines.length;return{name:npc.name,text};}
export function npcOwner(object){for(let p=object;p;p=p.parent)if(p.userData.npc)return p;return null;}

export function buildWalkingVisitors(g){
 const group=new THREE.Group();group.name='walking-npcs';g.scene.add(group);g.walkers=[];
 const sphere=new THREE.SphereGeometry(1,14,10),limbGeometry=new THREE.CylinderGeometry(1,1,1,10),mat=c=>g.material(c,{roughness:.92});
 const profiles=[
  {name:'지우',gender:'girl',hair:'ponytail',shirt:'#c37e9e',skin:'#e5bc9e',side:-1,offset:0,lines:['안녕, 나는 지우야! 오늘은 어떤 책을 읽을까?','이 표지는 색이 참 예쁘다. 어떤 장면일지 궁금해!','책 속 주인공이 된다면 어떤 모험을 하고 싶어?','친구들이 만든 이야기를 천천히 구경하고 있어.']},
  {name:'하린',gender:'girl',hair:'bob',shirt:'#769db1',skin:'#c99272',side:1,offset:1,lines:['반가워! 나는 하린이야. 같이 책 구경할래?','제목만 보고 이야기를 상상해 보는 것도 재미있어.','마음에 드는 표지를 누르면 책을 볼 수 있어!','나도 언젠가 멋진 동화책을 만들어 보고 싶어.']},
  {name:'준호',gender:'boy',hair:'short',shirt:'#d0a15c',skin:'#e6c3a2',side:-1,offset:2,lines:['안녕! 나는 준호야. 재미있는 이야기를 찾고 있어.','모험 이야기를 읽으면 내가 여행하는 기분이 들어!','이번에는 평소에 안 읽던 이야기도 만나 보고 싶어.','너는 어떤 주인공이 가장 기억에 남아?']}
 ];
 for(const profile of profiles){
  const person=giveDialogue(new THREE.Group(),profile.name,profile.lines);person.name='walking-reader';person.userData.gender=profile.gender;group.add(person);
  const skin=mat(profile.skin),shirt=mat(profile.shirt),hair=mat('#382a25'),pants=mat('#405368'),shoe=mat('#e8e0ce'),dark=mat('#322a27');
  const oval=(material,pos,scale,parent=person)=>{const mesh=new THREE.Mesh(sphere,material);mesh.position.set(...pos);mesh.scale.set(...scale);parent.add(mesh);return mesh;};
  const limb=(material,a,b,r,parent)=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),mesh=new THREE.Mesh(limbGeometry,material);mesh.position.copy(start).lerp(end,.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.clone().sub(start).normalize());mesh.scale.set(r,start.distanceTo(end),r);parent.add(mesh);oval(material,b,[r,r,r],parent);};
  oval(pants,[0,.9,0],[.23,.15,.15]);oval(shirt,[0,1.2,0],[.27,.34,.16]);oval(skin,[0,1.51,0],[.07,.11,.07]);
  const head=new THREE.Group();head.position.set(0,1.73,0);person.add(head);oval(skin,[0,0,0],[.145,.185,.135],head);oval(hair,[0,.085,-.035],[.153,.14,.13],head);
  if(profile.hair==='ponytail'){oval(hair,[0,.045,-.18],[.09,.12,.14],head);oval(hair,[0,-.1,-.23],[.065,.18,.065],head);oval(shirt,[0,.06,-.18],[.1,.025,.065],head);}
  if(profile.hair==='bob'){for(const s of [-1,1])oval(hair,[s*.13,-.025,-.025],[.055,.17,.11],head);oval(hair,[0,-.06,-.1],[.13,.14,.065],head);}
  for(const s of [-1,1]){oval(skin,[s*.145,-.01,0],[.022,.035,.022],head);oval(dark,[s*.05,-.005,.128],[.012,.016,.008],head);oval(hair,[s*.05,.03,.13],[.027,.007,.007],head);}
  oval(skin,[0,-.038,.14],[.02,.027,.02],head);oval(mat('#9a5b50'),[0,-.09,.12],[.032,.007,.007],head);
  const legs=[],arms=[];
  for(const s of [-1,1]){const leg=new THREE.Group();leg.position.set(s*.13,.88,0);person.add(leg);limb(pants,[0,0,0],[0,-.39,.015],.085,leg);limb(pants,[0,-.39,.015],[0,-.76,0],.065,leg);oval(shoe,[0,-.81,.075],[.09,.065,.16],leg);legs.push(leg);
   const arm=new THREE.Group();arm.position.set(s*.255,1.43,0);person.add(arm);limb(shirt,[0,0,0],[s*.035,-.29,.01],.067,arm);limb(skin,[s*.035,-.29,.01],[s*.025,-.53,.035],.045,arm);oval(skin,[s*.025,-.55,.04],[.048,.065,.04],arm);arms.push(arm);}
  // Animated visitors use no dynamic shadow map, keeping tablet rendering inexpensive.
  const actor={person,head,legs,arms,profile,phase:profile.offset*1.7,target:1,wait:3+profile.offset,route:[],speed:.52};g.walkers.push(actor);
 }
 resetWalkingVisitors(g,30);return group;
}

export function resetWalkingVisitors(g,capacity){
 const rows=Math.max(1,Math.ceil(capacity/2)),last=19-(rows-1)*2.7;
 for(const actor of g.walkers||[]){const {side,offset}=actor.profile;let far=last+1;
  const near=offset===2?Math.max(last+2,12):20-offset*.8;
  if(offset===0&&rows>5)far=Math.max(far,10.5);
  actor.route=[{x:side*6.25,z:near},{x:side*6.25,z:Math.min(near-1.4,far)}];actor.person.position.set(actor.route[0].x,0,actor.route[0].z);actor.person.rotation.y=side*Math.PI/2;actor.target=1;actor.travelled=0;actor.wait=3+offset;actor.person.userData.npc.paused=false;
 }
}

export function updateWalkingVisitors(g,dt,{paused=false,reducedMotion=false}={}){
 if(paused)return;
 for(const actor of g.walkers||[]){const p=actor.person,target=actor.route[actor.target];if(!target)continue;
  const nearViewer=g.camera&&Math.hypot(g.camera.position.x-p.position.x,g.camera.position.z-p.position.z)<.8;
  let moving=false;
  if(!p.userData.npc.paused&&!nearViewer&&!reducedMotion){
   if(actor.wait>0){actor.wait=Math.max(0,actor.wait-dt);const face=actor.profile.side*Math.PI/2;p.rotation.y+=Math.atan2(Math.sin(face-p.rotation.y),Math.cos(face-p.rotation.y))*Math.min(1,dt*3);}
   else{const dx=target.x-p.position.x,dz=target.z-p.position.z,d=Math.hypot(dx,dz);if(d<.04){actor.target=1-actor.target;actor.travelled=0;actor.wait=5+actor.profile.offset;}
    else{moving=true;const step=Math.min(d,dt*actor.speed);p.position.x+=dx/d*step;p.position.z+=dz/d*step;actor.travelled+=step;if(actor.travelled>=2.7){actor.wait=3.5;actor.travelled=0;}const yaw=Math.atan2(dx,dz);p.rotation.y+=Math.atan2(Math.sin(yaw-p.rotation.y),Math.cos(yaw-p.rotation.y))*Math.min(1,dt*5);}}
  }
  actor.phase+=moving?dt*5:0;const swing=moving?Math.sin(actor.phase)*.3:0;actor.legs.forEach((limb,i)=>limb.rotation.x=swing*(i?1:-1));actor.arms.forEach((limb,i)=>limb.rotation.x=swing*(i?-1:1)*.7);actor.head.rotation.y=moving?0:Math.sin(actor.phase*.25)*.06;
 }
}
