import * as THREE from 'three';

// Sit at alternating bench edges, with knees beyond the cushion and feet on the floor.
export function buildReaders(g){
 const visitors=new THREE.Group();visitors.name='reading-npcs';g.scene.add(visitors);
 const sphere=new THREE.SphereGeometry(1,20,16),cylinder=new THREE.CylinderGeometry(1,1,1,14);
 const material=color=>g.material(color,{roughness:.92});
 const pants=material('#34404c'),shoes=material('#35302e'),paper=material('#f5e8cf'),hair=material('#362921'),ink=material('#b8ad98');
 const poses=[[-4.3,11,.14,'#71827e','#deb49a'],[4.3,11,Math.PI-.18,'#a16c54','#bc8a68'],[-4.3,-3,Math.PI+.12,'#63758d','#e7c5ac'],[4.3,-17,-.12,'#a08a59','#c79c7e']];
 for(const [x,z,yaw,color,skinColor] of poses){
  const person=new THREE.Group();person.name='seated-reader';person.position.set(x+Math.sin(yaw)*.42,.08,z+Math.cos(yaw)*.42);person.rotation.y=yaw;visitors.add(person);
  const skin=material(skinColor),shirt=material(color);
  const oval=(m,pos,scale,parent=person)=>{const o=new THREE.Mesh(sphere,m);o.position.set(...pos);o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
  const limb=(a,b,r,m)=>{const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),o=new THREE.Mesh(cylinder,m);o.position.copy(start).add(end).multiplyScalar(.5);o.scale.set(r,start.distanceTo(end),r);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());o.castShadow=true;person.add(o);oval(m,a,[r,r,r]);oval(m,b,[r,r,r]);};
  oval(pants,[0,.86,0],[.25,.17,.22]);
  for(const side of [-1,1]){
   limb([side*.16,.85,.03],[side*.19,.73,.4],.105,pants);
   limb([side*.19,.73,.4],[side*.2,.09,.43],.085,pants);
   oval(shoes,[side*.2,.03,.52],[.105,.085,.2]);
  }
  const torso=oval(shirt,[0,1.18,.025],[.29,.36,.17]);torso.rotation.x=.12;
  // Collar, neck and a slightly bowed head looking at the open pages.
  oval(paper,[0,1.48,.06],[.13,.025,.1]);limb([0,1.43,.04],[0,1.57,.07],.075,skin);
  const head=new THREE.Group();head.position.set(0,1.69,.09);head.rotation.x=.22;person.add(head);
  oval(skin,[0,0,0],[.145,.19,.137],head);oval(hair,[0,.09,-.025],[.151,.135,.13],head);
  for(const side of [-1,1]){oval(skin,[side*.143,-.012,0],[.025,.044,.026],head);oval(hair,[side*.056,.012,.123],[.028,.009,.008],head);oval(shoes,[side*.054,-.005,.13],[.012,.006,.006],head);}
  oval(skin,[0,-.037,.142],[.022,.034,.023],head);oval(material('#9e6d5c'),[0,-.094,.119],[.033,.005,.006],head);
  for(const side of [-1,1]){
   limb([side*.25,1.39,.04],[side*.32,1.1,.17],.085,shirt);
   limb([side*.32,1.1,.17],[side*.23,1.04,.42],.06,shirt);
   oval(skin,[side*.22,1.045,.44],[.055,.035,.075]);
  }
  const book=new THREE.Group();book.position.set(0,1.05,.4);book.rotation.x=.2;person.add(book);
  for(const side of [-1,1]){
   const page=new THREE.Group();page.rotation.z=side*.15;book.add(page);
   g.box(.25,.024,.32,side*.125,0,0,shirt,page);g.box(.235,.025,.3,side*.122,.024,0,paper,page);
   for(let line=0;line<7;line++)g.box(.17,.002,.005,side*.122,.038,-.1+line*.03,ink,page);
  }
 }
 return visitors;
}
