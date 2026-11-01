import * as THREE from 'three';

export const baseThemes=[
 {name:'숲속 정원',kind:'forest',wall:'#365c43',ceiling:'#ead9b4',carpet:'#6b874c',accent:'#d8b36b',wood:'#62472e',frame:'#2f5138',pale:'#efe7cf',light:'#ffe2ac',fill:'#c0e3bd',plants:['#477a45','#739c55','#a5bb70']},
 {name:'별빛 우주',kind:'space',wall:'#39466b',ceiling:'#bbc1df',carpet:'#53628d',accent:'#d6c5f3',wood:'#494159',frame:'#30395b',pale:'#e8e6f1',light:'#eee7ff',fill:'#adc9ff',plants:['#9387c4','#c0b7e9','#e4d4fa']},
 {name:'바닷속 산책',kind:'sea',wall:'#2c7080',ceiling:'#bfe2de',carpet:'#438e96',accent:'#aedfda',wood:'#3d6465',frame:'#255d6b',pale:'#e4f0e8',light:'#d8fff4',fill:'#96d7ed',plants:['#4eaaa0','#72c1ad','#c2d9a6']},
 {name:'벚꽃 정원',kind:'blossom',wall:'#875767',ceiling:'#f2d7c8',carpet:'#b77e94',accent:'#edc797',wood:'#785451',frame:'#774b60',pale:'#f5e5df',light:'#ffe7dc',fill:'#f3cbdc',plants:['#d887a9','#efa8c1','#ffe0e7']}
];
const variants=[
 [{name:'새싹',wall:'#365c43',ceiling:'#ead9b4',carpet:'#6b874c'},{name:'이끼',wall:'#405e49',ceiling:'#e1d8b8',carpet:'#627d55'},{name:'햇살',wall:'#506649',ceiling:'#ecddb9',carpet:'#879057'}],
 [{name:'달빛',wall:'#39466b',ceiling:'#bbc1df',carpet:'#53628d'},{name:'은하',wall:'#494663',ceiling:'#d0c5de',carpet:'#71618c'},{name:'새벽',wall:'#3e5669',ceiling:'#c7d5e2',carpet:'#627f95'}],
 [{name:'산호',wall:'#2c7080',ceiling:'#bfe2de',carpet:'#438e96'},{name:'진주',wall:'#47777a',ceiling:'#d4e3d9',carpet:'#6b9b96'},{name:'물결',wall:'#356b7c',ceiling:'#c8dce4',carpet:'#577e9c'}],
 [{name:'연분홍',wall:'#875767',ceiling:'#f2d7c8',carpet:'#b77e94'},{name:'복숭아',wall:'#8d665f',ceiling:'#f1ddc7',carpet:'#ba9180'},{name:'라일락',wall:'#766079',ceiling:'#e3d7e8',carpet:'#a48bac'}]
];
const variantPlants=[
 [['#477a45','#739c55','#a5bb70'],['#41674c','#65805a','#a0b47a'],['#64804b','#90a55d','#c2c87c']],
 [['#9387c4','#c0b7e9','#e4d4fa'],['#a08bb9','#c7b1d8','#f2d7ed'],['#7f9fbf','#adcadc','#e4e8f1']],
 [['#4eaaa0','#72c1ad','#c2d9a6'],['#77a99f','#aad0b9','#deccb0'],['#578e9e','#80adbd','#b1d1d8']],
 [['#d887a9','#efa8c1','#ffe0e7'],['#df9b9b','#f0bca2','#ffe4ca'],['#b793c8','#d3b1dc','#f5dff2']]
];
export const themes=baseThemes.flatMap((base,baseIndex)=>variants[baseIndex].map((variant,index)=>({...base,...variant,plants:variantPlants[baseIndex][index],id:base.kind+'-'+index,name:base.name+' · '+variant.name,variant:index,baseName:base.name,patternRepeat:[[5,9],[4,7],[6,11]][index]})));
export function classSeed(c){let hash=2166136261;for(const ch of c?.id||c?.name||'이야기숲')hash=Math.imul(hash^ch.codePointAt(0),16777619)>>>0;return hash;}
export function classTheme(c){if(!c)return themes[0];const seed=classSeed(c);return themes[(seed%4)*3+Math.floor(seed/4)%3];}
export function classStyle(c){const seed=classSeed(c),theme=classTheme(c);return{...theme,seed,frameStyle:theme.variant,patternTurn:theme.variant*.17,crownScale:[1,.94,1.08][theme.variant]};}
function disposeDecor(group){const geometries=new Set(),materials=new Set(),textures=new Set();group?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);if(m.map)textures.add(m.map);}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());}
function starPoints(outer,inner,count=5){return Array.from({length:count*2},(_,i)=>{const a=i*Math.PI/count-Math.PI/2,r=i%2?inner:outer;return new THREE.Vector2(Math.cos(a)*r,Math.sin(a)*r);});}
function starGeometry(radius=.3){return new THREE.ShapeGeometry(new THREE.Shape(starPoints(radius,radius*.45)));}
function ceilingTexture(g,t){
 const map=g.texture((ctx,w,h)=>{
  ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.translate(w/2,h/2);ctx.rotate(t.patternTurn*Math.PI/2);ctx.strokeStyle='#51604c66';ctx.fillStyle='#596b4b44';ctx.lineWidth=4;ctx.globalAlpha=.58;
  if(t.kind==='forest'){
   for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.ellipse(0,-92,42,82,.3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(0,-165);ctx.stroke();ctx.restore();}
   ctx.strokeStyle='#9b7c4566';ctx.strokeRect(-202,-202,404,404);
  }else if(t.kind==='space'){
   ctx.fillStyle='#4b54836b';ctx.strokeStyle='#68709b66';for(const [x,y,r] of [[0,0,76],[-172,-150,30],[170,158,28]]){ctx.beginPath();for(const [i,p]of starPoints(r,r*.4).entries())i?ctx.lineTo(p.x+x,p.y+y):ctx.moveTo(p.x+x,p.y+y);ctx.closePath();ctx.fill();}
   ctx.beginPath();ctx.ellipse(0,0,200,108,-.45,0,Math.PI*2);ctx.stroke();for(const [x,y]of [[-145,120],[128,-145]]){ctx.beginPath();ctx.arc(x,y,9,0,Math.PI*2);ctx.fill();}
  }else if(t.kind==='sea'){
   ctx.strokeStyle='#3f8d9977';ctx.lineWidth=9;for(let y=-240;y<=240;y+=80){ctx.beginPath();ctx.moveTo(-256,y);for(let x=-256;x<256;x+=128)ctx.bezierCurveTo(x+32,y-40,x+96,y+40,x+128,y);ctx.stroke();}
  }else{
   ctx.fillStyle='#b46a8c66';for(let i=0;i<5;i++){ctx.save();ctx.rotate(i*Math.PI*2/5);ctx.beginPath();ctx.ellipse(0,-82,44,82,0,0,Math.PI*2);ctx.fill();ctx.restore();}ctx.fillStyle='#af8a4e88';ctx.beginPath();ctx.arc(0,0,20,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#b990a14d';ctx.strokeRect(-205,-205,410,410);
  }
 },512,512);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(...t.patternRepeat);map.userData.pattern=t.kind;map.userData.variant=t.variant;return map;
}
function addPlanters(g,group,t){
 const foliageGeometry=new THREE.IcosahedronGeometry(1,1),trunkGeometry=new THREE.CylinderGeometry(.09,.16,2.9,7),potGeometry=new THREE.CylinderGeometry(.45,.35,.75,12),leafMaterials=t.plants.map(color=>g.material(color));
 const add=(geometry,material,parent,x,y,z,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;};
 const trunkMaterial=g.material(t.wood),potMaterial=g.material(t.pale),accent=g.material(t.accent,{metalness:.3});
 for(const x of [-7.2,7.2])for(const z of [22.5,13.5,0,-13.5,-22]){
  const plant=new THREE.Group();plant.name='theme-planter';plant.userData.kind=t.kind;plant.position.set(x,0,z);group.add(plant);add(potGeometry,potMaterial,plant,0,.375,0);
  if(t.kind==='space'){
   add(new THREE.CylinderGeometry(.055,.09,2.8,6),accent,plant,0,1.9,0);add(foliageGeometry,leafMaterials[0],plant,0,3.5,0,.55,.55,.55);
   const ring=add(new THREE.TorusGeometry(.9,.045,6,32),accent,plant,0,3.5,0);ring.rotation.set(1.1+t.variant*.15,.4,x<0?.3:-.3);
   const star=add(starGeometry(.32),leafMaterials[2],plant,0,4.65,0);star.material.side=THREE.DoubleSide;
  }else if(t.kind==='sea'){
   for(let i=0;i<5;i++){
    const points=[];for(let j=0;j<=7;j++)points.push(new THREE.Vector3(Math.sin(j*.6+i+t.variant*.4)*.19+i*.13-.26,.7+j*.4,Math.cos(i*2)*.2));
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,.07,5,false),leafMaterials[i%3],plant,0,0,0);
   }
   for(let i=0;i<4;i++){const leaf=add(foliageGeometry,leafMaterials[(i+1)%3],plant,Math.sin(i*2)*.35,1.7+i*.35,Math.cos(i*2)*.25,.2,.7,.1);leaf.rotation.z=Math.sin(i*2)*.4;}
  }else{
   add(trunkGeometry,trunkMaterial,plant,0,2.1,0);for(let i=0;i<7;i++){const a=i*2.4;add(foliageGeometry,leafMaterials[i%3],plant,Math.cos(a)*.43,3.55+Math.sin(a)*.32,Math.sin(a)*.42,.63*t.crownScale,t.kind==='blossom'?.45+t.variant*.04:.75+t.variant*.04,.63*t.crownScale);}
   if(t.kind==='blossom')for(let i=0;i<5;i++)add(foliageGeometry,leafMaterials[2],plant,Math.sin(i*2.1)*.6,3.3+i*.12,Math.cos(i*2.1)*.6,.15,.09,.15);
  }
 }
}
function addCeilingDecor(g,group,t){
 const accents=g.material(t.accent,{metalness:.3,roughness:.5}),foliage=t.plants.map(c=>g.material(c));
 for(const z of [16,3,-10,-21]){
  const motif=new THREE.Group();motif.name='theme-ceiling-motif';motif.userData.kind=t.kind;motif.position.set(0,6.9,z);group.add(motif);
  const add=(geo,mat,x=0,y=0,zz=0)=>{const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,zz);motif.add(mesh);return mesh;};
  if(t.kind==='space'){
   for(const radius of [1,1.7]){const ring=add(new THREE.TorusGeometry(radius,.045,6,40),accents);ring.rotation.set(Math.PI/2,.25,radius*.3);}
   for(let i=0;i<5;i++){const a=i*Math.PI*2/5,star=add(starGeometry(.24),foliage[i%3],Math.cos(a)*1.6,-.25,Math.sin(a)*1.6);star.material.side=THREE.DoubleSide;}
   add(new THREE.IcosahedronGeometry(.4,1),foliage[0],0,-.15,0);
  }else if(t.kind==='sea'){
   for(const x of [-1.5,0,1.5]){const points=[];for(let i=0;i<=14;i++)points.push(new THREE.Vector3(x+Math.sin(i*.6)*.25,Math.sin(i*.7)*.17,-1.8+i*.26));add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.055,5,false),foliage[Math.round(x+1.5)%3]);}
   const pearl=add(new THREE.SphereGeometry(.24,10,8),accents,0,-.2,0);
  }else{
   const leafGeometry=new THREE.IcosahedronGeometry(.8,1);for(let i=0;i<(t.kind==='blossom'?5:6);i++){const a=i*Math.PI*2/(t.kind==='blossom'?5:6),leaf=add(leafGeometry,foliage[i%3],Math.cos(a)*.85,0,Math.sin(a)*.85);leaf.scale.set(.65,.18,1.2);leaf.rotation.y=-a;}
   add(new THREE.SphereGeometry(.18,10,6),accents,0,-.05,0);
  }
 }
}
export function applyClassTheme(g,c){
 if(!g.renderer)return;const t=classStyle(c),key=`${c?.id||''}:${c?.name||''}:${t.seed}`;g.theme=t;if(g.themeKey===key)return;g.themeKey=key;
 const e=g.environment;e.wall.color.set(t.wall);e.ceiling.color.set(t.ceiling);e.gold.color.set(t.accent);e.wood.color.set(t.wood);e.carpets.forEach(m=>m.color.set(t.carpet));e.lights.forEach(l=>l.color.set(t.light));e.fill.color.set(t.fill);
 e.ceiling.map?.dispose();e.ceiling.map=ceilingTexture(g,t);e.ceiling.needsUpdate=true;
 g.scene.background.set('#8d9e94');g.scene.fog.color.set('#a9b2a3');g.scene.fog.near=55;g.scene.fog.far=130;g.fireflies.material.color.set(t.accent);
 e.leaves.visible=t.kind==='forest'||t.kind==='blossom';e.leaves.material.color.set(t.plants[0]);
 const zoneNames={forest:['새싹의 숲','나무의 길','햇살 정원'],space:['달빛의 문','별자리 길','은하의 책장'],sea:['산호의 문','물결의 길','진주 도서관'],blossom:['꽃잎의 문','벚꽃 길','봄의 책장']};
 e.zoneSigns.forEach((sign,i)=>{sign.material.map?.dispose();sign.material.map=g.texture((ctx,w,h)=>{ctx.fillStyle=t.frame;ctx.fillRect(0,0,w,h);ctx.fillStyle=t.pale;ctx.font='bold 90px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`0${i+1}  ${zoneNames[t.kind][i]}`,w/2,h/2,w-40);},1024,256);});
 e.floorMarks.forEach(mark=>{mark.material.map?.dispose();mark.material.map=g.texture((ctx,w,h)=>{ctx.fillStyle=t.carpet;ctx.fillRect(0,0,w,h);ctx.fillStyle=t.accent;ctx.font='180px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t.kind==='sea'?'≈':t.kind==='blossom'?'❀':'✦',w/2,h/2);},256,256);});
 if(g.classDecor){disposeDecor(g.classDecor);g.scene.remove(g.classDecor);}const group=new THREE.Group();group.name='classroom-theme';g.classDecor=group;g.scene.add(group);addPlanters(g,group,t);addCeilingDecor(g,group,t);
 // Board and all themed plants use the existing collision footprints.
 g.box(2.3,.16,.85,0,.08,16.5,g.material(t.frame),group);for(const x of [-1.35,1.35]){g.box(.12,2.7,.14,x,1.35,16.5,g.material(t.accent),group);g.box(.42,.1,.75,x,.06,16.5,g.material(t.accent),group);}g.box(3.8,1.75,.18,0,2.25,16.5,g.material(t.accent),group);
 const texture=g.texture((ctx,w,h)=>{ctx.fillStyle=t.frame;ctx.fillRect(0,0,w,h);ctx.strokeStyle=t.accent;ctx.lineWidth=3;ctx.strokeRect(22,22,w-44,h-44);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=t.accent;ctx.font='24px "Malgun Gothic",sans-serif';ctx.fillText('STORYFOREST  ·  '+t.name,w/2,85,w-90);const name=c?.name||'이야기숲';let size=76;do{ctx.font=`bold ${size}px "Malgun Gothic",sans-serif`;if(ctx.measureText(name).width<w-100)break;size-=2;}while(size>32);const lines=[];let line='';for(const ch of name){if(ctx.measureText(line+ch).width>w-100&&line){lines.push(line);line='';}line+=ch;}lines.push(line);ctx.fillStyle='#fff6e6';lines.forEach((s,i)=>ctx.fillText(s,w/2,235+(i-(lines.length-1)/2)*(size+12)));ctx.font='25px "Malgun Gothic",sans-serif';ctx.fillStyle=t.accent;ctx.fillText('우리 반 작가들의 이야기 전시관',w/2,370);},1024,448);
 for(const side of [-1,1]){const board=new THREE.Mesh(new THREE.PlaneGeometry(3.62,1.58),new THREE.MeshBasicMaterial({map:side===1?texture:texture.clone(),toneMapped:false}));board.name='classroom-welcome-board';board.position.set(0,2.25,16.5+side*.1);board.rotation.y=side===1?0:Math.PI;group.add(board);}g.renderer.shadowMap.needsUpdate=true;
}
export function buildExhibitFrame(g,group,occupied){
 const t=g.theme||classStyle(null);group.name='exhibit-frame';group.userData.theme=t.kind;group.userData.frameStyle=t.frameStyle;const trim=g.material(t.accent,{metalness:.35,roughness:.45}),wood=g.material(t.wood);
 g.box(2.18,3.3,.12,0,2.12,-.05,g.material(occupied?t.pale:t.frame),group);for(const x of [-1.08,1.08])g.box(.07,3.4,.22,x,2.12,0,trim,group);g.box(2.32,.16,.65,0,.42,.12,wood,group);g.box(2.2,.065,.24,0,3.8,.03,trim,group);
 if(t.frameStyle===0){const points=[];for(let i=0;i<=16;i++){const a=i*Math.PI/16;points.push(new THREE.Vector3(Math.cos(a)*1.08,3.8+Math.sin(a)*.4,.02));}group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.055,6,false),trim));}
 else if(t.frameStyle===1){for(const side of [-1,1]){const bar=g.box(1.2,.09,.2,side*.52,4,.02,wood,group);bar.rotation.z=-side*.36;}}
 else for(const x of [-.94,.94]){const cap=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),trim);cap.position.set(x,3.96,.03);group.add(cap);}
 let icon;if(t.kind==='space')icon=new THREE.Mesh(starGeometry(.2),trim);else if(t.kind==='sea'){icon=new THREE.Mesh(new THREE.TorusGeometry(.15,.035,6,18,Math.PI),trim);}else{icon=new THREE.Mesh(new THREE.IcosahedronGeometry(.18,1),g.material(t.plants[1]));icon.scale.set(t.kind==='blossom'?1:.6,.7,1);}icon.position.set(0,4.05,.1);icon.name='frame-theme-crest';group.add(icon);
}
