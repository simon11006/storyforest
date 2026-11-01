import * as THREE from 'three';

export const themes=[
 {name:'숲속 정원',wall:'#245c49',ceiling:'#153e36',carpet:'#527d50',accent:'#debc70',light:'#ffe2ac',fill:'#b0e4c3',kind:'forest'},
 {name:'별빛 우주',wall:'#30385f',ceiling:'#121b38',carpet:'#595880',accent:'#ceb9ef',light:'#ded5ff',fill:'#89bdff',kind:'space'},
 {name:'바닷속 산책',wall:'#205c70',ceiling:'#123d53',carpet:'#368a91',accent:'#9de5df',light:'#c2f6f3',fill:'#76c9ff',kind:'sea'},
 {name:'벚꽃 정원',wall:'#775065',ceiling:'#463343',carpet:'#aa7185',accent:'#f1cca2',light:'#ffe0d8',fill:'#e9b9d8',kind:'blossom'}
];
export function classTheme(c){let hash=0;for(const ch of c?.name||c?.id||'이야기숲')hash=(hash*31+ch.codePointAt(0))>>>0;return themes[hash%themes.length];}

export function applyClassTheme(g,c){
 if(!g.renderer)return;
 const t=classTheme(c),e=g.environment;
 // Keep the timber library architecture legible across classroom themes.
 e.wall.color.set('#275954');e.ceiling.color.set('#c7b994');e.gold.color.set('#d8ae63');
 e.carpets.forEach(m=>m.color.set(t.carpet));e.lights.forEach(l=>l.color.set(t.light));e.fill.color.set(t.fill);
 g.scene.background.set('#8d9e94');g.scene.fog.color.set('#a9b2a3');g.scene.fog.near=55;g.scene.fog.far=130;g.fireflies.material.color.set(t.accent);
 e.leaves.visible=t.kind==='forest'||t.kind==='blossom';e.leaves.material.color.set(t.kind==='blossom'?'#e8a8c1':'#497554');
 if(g.classDecor){g.classDecor.traverse(o=>{o.geometry?.dispose();if(o.material){o.material.map?.dispose();o.material.dispose();}});g.scene.remove(g.classDecor);}
 const group=new THREE.Group();g.classDecor=group;g.scene.add(group);
 const add=(geo,color,x,y,z)=>{const m=new THREE.Mesh(geo,g.material(color,{roughness:.45}));m.position.set(x,y,z);group.add(m);return m;};
 // Theme silhouettes sit above the exhibits, leaving all thirty book positions accessible.
 for(const z of [18,5,-8,-20])for(const side of [-1,1]){
  const x=side*7.8;
  if(t.kind==='space'){
   add(new THREE.SphereGeometry(.5,24,16),'#aaa0dc',x,5.45,z);
   const ring=add(new THREE.TorusGeometry(.82,.045,8,48),t.accent,x,5.45,z);ring.rotation.set(1.1,.3,side*.4);
   for(let i=0;i<3;i++){const star=add(new THREE.OctahedronGeometry(.18),t.accent,x+side*.7,4.5+i*.45,z+.5);star.rotation.z=.4;}
  }else if(t.kind==='sea'){
   for(let i=0;i<5;i++){const bubble=add(new THREE.SphereGeometry(.18+i*.055,16,12),'#98e6ee',x+Math.sin(i)*.45,4.5+i*.32,z+i*.15);bubble.material.transparent=true;bubble.material.opacity=.38;bubble.material.metalness=.4;}
   const fish=add(new THREE.SphereGeometry(.3,16,12),'#f6c577',x,5,z-1);fish.scale.set(1.8,.8,.5);
   const tail=add(new THREE.ConeGeometry(.25,.4,3),'#f6c577',x-.65,5,z-1);tail.rotation.z=-Math.PI/2;
  }else{
   add(new THREE.CylinderGeometry(.055,.09,1.1,8),'#806346',x,4.95,z);
   for(let i=0;i<7;i++){const a=i*2.4;const leaf=add(new THREE.IcosahedronGeometry(.42,1),t.kind==='blossom'?['#f4b5ce','#e194b8','#ffe1ed'][i%3]:['#78a569','#4e885b','#abc87b'][i%3],x+Math.cos(a)*.48,5.4+Math.sin(a)*.35,z+Math.sin(a)*.4);leaf.scale.y=t.kind==='blossom'?.7:1;}
  }
 }
 // A freestanding, two-sided welcome board in the central entrance aisle.
 g.box(2.3,.16,.85,0,.08,16.5,g.material(t.wall),group);
 for(const x of [-1.35,1.35]){g.box(.12,2.7,.14,x,1.35,16.5,g.material(t.accent),group);g.box(.42,.1,.75,x,.06,16.5,g.material(t.accent),group);}
 g.box(3.8,1.75,.18,0,2.25,16.5,g.material(t.accent),group);
 const texture=g.texture((ctx,w,h)=>{
  ctx.fillStyle=t.wall;ctx.fillRect(0,0,w,h);ctx.strokeStyle=t.accent;ctx.lineWidth=3;ctx.strokeRect(22,22,w-44,h-44);
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=t.accent;ctx.font='24px "Malgun Gothic", sans-serif';ctx.fillText('STORYFOREST  ·  '+t.name,w/2,85);
  const name=c?.name||'이야기숲';let size=76;do{ctx.font=`bold ${size}px "Malgun Gothic", sans-serif`;if(ctx.measureText(name).width<w-100)break;size-=2;}while(size>32);
  const lines=[];let line='';for(const ch of name){if(ctx.measureText(line+ch).width>w-100&&line){lines.push(line);line='';}line+=ch;}lines.push(line);
  ctx.fillStyle='#fff6e6';lines.forEach((s,i)=>ctx.fillText(s,w/2,235+(i-(lines.length-1)/2)*(size+12)));
  ctx.font='25px "Malgun Gothic", sans-serif';ctx.fillStyle=t.accent;ctx.fillText('우리 반 작가들의 이야기 전시관',w/2,370);
 },1024,448);
 for(const side of [-1,1]){const board=new THREE.Mesh(new THREE.PlaneGeometry(3.62,1.58),new THREE.MeshBasicMaterial({map:side===1?texture:texture.clone(),toneMapped:false}));board.position.set(0,2.25,16.5+side*.1);board.rotation.y=side===1?0:Math.PI;group.add(board);}
 g.renderer.shadowMap.needsUpdate=true;
}
