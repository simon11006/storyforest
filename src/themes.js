import {buildForestGround} from './ground.js';
import * as THREE from 'three';

export const baseThemes=[
 {name:'봄의 숲',kind:'spring',wall:'#51664b',ceiling:'#ebdfc1',carpet:'#8c9b67',accent:'#d9bd80',wood:'#70513a',frame:'#405b3e',pale:'#f1e7cd',light:'#ffe8c4',fill:'#c8dfb1'},
 {name:'여름의 숲',kind:'summer',wall:'#355e49',ceiling:'#ccebdc',carpet:'#5d8356',accent:'#c4ad71',wood:'#59452f',frame:'#2c4d38',pale:'#e9e6cc',light:'#f5ebc8',fill:'#b5d9af'},
 {name:'가을의 숲',kind:'autumn',wall:'#71553d',ceiling:'#ffe5bc',carpet:'#a17d4b',accent:'#d5aa5d',wood:'#68452e',frame:'#654a30',pale:'#f0e2c5',light:'#ffe0b5',fill:'#dccaac'},
 {name:'열대의 숲',kind:'tropical',wall:'#2e5b42',ceiling:'#a8dacc',carpet:'#527a44',accent:'#c7b06a',wood:'#59442e',frame:'#274b34',pale:'#e9e3c8',light:'#ffe8bb',fill:'#afd5a8'}
];
const variants=[
 [{name:'벚꽃 숲',treeShape:'cherry',wall:'#dce8cf',ceiling:'#eaf8ff',carpet:'#efb1cf',wood:'#b98967',frame:'#ae617e',accent:'#fff0cb',pale:'#fff6fa',light:'#fff7fc',fill:'#fff0fa',plants:['#fff7fb','#ffe2ef','#ffc7df']},{name:'연둣빛 새순 숲',treeShape:'broadleaf',wall:'#536b49',carpet:'#8c9e5b',plants:['#739956','#9eb571','#c1ce91']},{name:'목련 숲',treeShape:'magnolia',wall:'#b5c4ac',ceiling:'#fff3de',carpet:'#91a889',frame:'#647d65',plants:['#6b8956','#d8d4b7','#fff0d9']}],
 [{name:'참나무 숲',treeShape:'oak',wall:'#355e49',carpet:'#5d8356',plants:['#3d7145','#64874b','#8aa45e']},{name:'자작나무 숲',treeShape:'birch',wall:'#4d6952',carpet:'#7c9368',plants:['#72985a','#96b773','#bdd09a']},{name:'소나무 숲',treeShape:'pine',wall:'#345743',carpet:'#58774c',plants:['#315e42','#497651','#73946a']}],
 [{name:'단풍 숲',treeShape:'maple',wall:'#78573e',carpet:'#af7948',plants:['#bc492c','#ed7d28','#ffbd55']},{name:'은행나무 숲',treeShape:'ginkgo',wall:'#70613d',carpet:'#b09b4f',plants:['#d1a40c','#f3cf38','#ffe989']},{name:'노을빛 참나무 숲',treeShape:'oak',wall:'#795947',carpet:'#a57c58',plants:['#9b633e','#bd8950','#d4ab6d']}],
 [{name:'야자 숲',treeShape:'palm',wall:'#2e5b42',carpet:'#527a44',plants:['#1b704b','#399557','#7abe65']},{name:'바나나 잎 숲',treeShape:'banana',wall:'#426447',carpet:'#6b8c4c',plants:['#4f7d3e','#72964e','#a2b672']},{name:'열대우림',treeShape:'rainforest',wall:'#284e3b',carpet:'#416b43',plants:['#2e6240','#4c7b47','#7c9c5c']}]
];
export const themes=baseThemes.flatMap((base,baseIndex)=>variants[baseIndex].map((variant,index)=>({...base,...variant,id:base.kind+'-'+index,variant:index,baseName:base.name,patternRepeat:[[5,9],[4,7],[6,11]][index]})));
export function classSeed(c){let hash=2166136261;for(const ch of c?.id||c?.name||'이야기숲')hash=Math.imul(hash^ch.codePointAt(0),16777619)>>>0;return hash;}
export function classTheme(c){if(!c)return themes[0];const saved=themes.find(t=>t.id===c.themeId);if(saved)return saved;const seed=classSeed(c);return themes[(seed%4)*3+Math.floor(seed/4)%3];}
export function chooseClassTheme(classes,random=Math.random){
 const counts=new Map(themes.map(t=>[t.id,0])),families=new Map(baseThemes.map(t=>[t.kind,0]));for(const cls of classes.filter(c=>!c.deleting)){const theme=classTheme(cls);counts.set(theme.id,counts.get(theme.id)+1);families.set(theme.kind,families.get(theme.kind)+1);}
 const min=Math.min(...families.values()),familyOptions=baseThemes.filter(t=>families.get(t.kind)===min),family=familyOptions[Math.floor(random()*familyOptions.length)].kind;const options=themes.filter(t=>t.kind===family),least=Math.min(...options.map(t=>counts.get(t.id))),available=options.filter(t=>counts.get(t.id)===least);return available[Math.floor(random()*available.length)].id;
}
export function classStyle(c){const seed=classSeed(c),theme=classTheme(c);return{...theme,seed,frameStyle:theme.variant,patternTurn:theme.variant*.17,crownScale:[1,.94,1.08][theme.variant]};}
function disposeDecor(group){const geometries=new Set(),materials=new Set(),textures=new Set();group?.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[]){materials.add(m);if(m.map)textures.add(m.map);}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());}
function leafShape(){const shape=new THREE.Shape();shape.moveTo(0,-.25);shape.bezierCurveTo(-.25,-.08,-.19,.15,0,.29);shape.bezierCurveTo(.19,.15,.25,-.08,0,-.25);return shape;}
function flowerShape(){const shape=new THREE.Shape();for(let i=0;i<=50;i++){const a=i/50*Math.PI*2,r=.22+.075*Math.cos(5*a),x=Math.cos(a)*r,y=Math.sin(a)*r;i?shape.lineTo(x,y):shape.moveTo(x,y);}return shape;}
function wallFoliageGeometry(t){const geometry=new THREE.ShapeGeometry(t.treeShape==='cherry'||t.treeShape==='magnolia'?flowerShape():t.treeShape==='maple'?mapleShape():t.treeShape==='ginkgo'?ginkgoShape():t.treeShape==='pine'?needleShape():leafShape(),8);const p=geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,['cherry','magnolia'].includes(t.treeShape)?1.5*(p.getX(i)**2+p.getY(i)**2):.22*p.getX(i)*p.getX(i));geometry.computeVertexNormals();return geometry;}
function ginkgoShape(){const shape=new THREE.Shape();shape.moveTo(0,-.22);for(let i=0;i<=20;i++){const a=.15+i/20*(Math.PI-.3);shape.lineTo(Math.cos(a)*.3,Math.sin(a)*.3-.05);}shape.lineTo(0,-.22);return shape;}
function needleShape(){const shape=new THREE.Shape();shape.moveTo(0,-.3);shape.lineTo(-.025,.2);shape.lineTo(0,.36);shape.lineTo(.025,.2);shape.closePath();return shape;}
// A whole needle-bearing shoot, rooted at the twig, rather than one isolated needle.
function pineSprayGeometry(){
 const vertices=[];for(let node=0;node<6;node++)for(const side of [-1,1])for(const layer of [-1,1]){
  const y=node*.145,spread=.32+Math.sin(node/6*Math.PI)*.27,z=layer*.045;
  vertices.push(-.035,y,0,.035,y+.04,0,side*spread,y+.28+(node%3)*.025,z);
  vertices.push(side*.015,y+.025,0,side*.085,y+.07,0,side*(spread*.82),y+.42,z*.7);
 }
 vertices.push(-.025,0,0,.025,0,0,0,1.22,0);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();geometry.userData.needleShoot=true;return geometry;
}
function mapleShape(){return new THREE.Shape([[-.03,-.24],[.03,-.24],[.02,-.1],[.17,-.14],[.12,-.04],[.25,.02],[.14,.08],[.17,.19],[.07,.14],[0,.3],[-.07,.14],[-.17,.19],[-.14,.08],[-.25,.02],[-.12,-.04],[-.17,-.14],[-.02,-.1]].map(([x,y])=>new THREE.Vector2(x,y)));}
function drawLeaf(ctx,x,y,size,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(0,size);ctx.bezierCurveTo(-size*.9,size*.2,-size*.65,-size*.55,0,-size);ctx.bezierCurveTo(size*.65,-size*.55,size*.9,size*.2,0,size);ctx.fill();ctx.beginPath();ctx.moveTo(0,size);ctx.lineTo(0,-size*.8);ctx.stroke();ctx.restore();}
function drawMaple(ctx,size){const points=mapleShape().getPoints();ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x*size,p.y*size):ctx.moveTo(p.x*size,p.y*size));ctx.closePath();ctx.fill();}
function ceilingTexture(g,t){const map=g.texture((ctx,w,h)=>{ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);for(let i=0;i<6;i++){const x=(i*193)%w,y=(i*137)%h,light=ctx.createRadialGradient(x,y,4,x,y,140);light.addColorStop(0,'#ffffffbb');light.addColorStop(1,'#73967e0a');ctx.fillStyle=light;ctx.fillRect(0,0,w,h);}},512,512);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(...t.patternRepeat);map.userData.pattern=t.kind;map.userData.variant=t.variant;map.userData.treeShape=t.treeShape;return map;}
function frondGeometry(length,width){const vertices=[],indices=[];for(let i=0;i<=10;i++){const u=i/10,x=u*length,y=Math.sin(u*Math.PI)*.18-u*u*.32,half=Math.sin(u*Math.PI)*width;vertices.push(x,y,-half,x,y,half);if(i<10){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;}
function addPlanters(g,group,t){
 const foliageGeometry=new THREE.IcosahedronGeometry(1,1),trunkGeometry=new THREE.CylinderGeometry(.09,.16,2.9,7),potGeometry=new THREE.CylinderGeometry(.55,.65,.24,9),leafMaterials=foliageColors(t).map(color=>g.material(color,{side:THREE.DoubleSide}));
 const add=(geometry,material,parent,x,y,z,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;parent.add(m);return m;};
 const trunkMaterial=g.material(t.treeShape==='birch'?'#f1ecda':t.wood),potMaterial=g.material(t.kind==='autumn'?'#948264':'#7b8865');
 if(t.treeShape==='birch'){trunkMaterial.map=g.texture((ctx,w,h)=>{ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.fillStyle='#514c4166';for(let i=0;i<15;i++){const x=(i*73)%w,y=i*h/15;ctx.fillRect(x,y,25+i%4*13,5);}},256,512);}
 const frond=t.treeShape==='palm'||t.treeShape==='banana'?frondGeometry(t.treeShape==='palm'?1.28:1.18,t.treeShape==='palm'?.13:.32):null;
 const cones=t.treeShape==='pine'?[new THREE.ConeGeometry(.8,1.25,8),new THREE.ConeGeometry(.63,1.05,8),new THREE.ConeGeometry(.43,.85,8)]:null;
 for(const x of [-7.2,7.2])for(const z of [22.5,13.5,0,-13.5,-22]){
  const plant=new THREE.Group();plant.name='theme-planter';plant.userData.kind=t.kind;plant.userData.treeShape=t.treeShape;plant.position.set(x,0,z);group.add(plant);add(potGeometry,potMaterial,plant,0,.12,0);
  if(frond){
   add(trunkGeometry,trunkMaterial,plant,0,2.18,0,1,1.08,1);const count=t.treeShape==='palm'?9:7;
   for(let i=0;i<count;i++){const leaf=add(frond,leafMaterials[i%leafMaterials.length],plant,0,3.78+(i%2)*.12,0);leaf.name='tree-canopy';leaf.rotation.y=i*Math.PI*2/count;leaf.rotation.z=(i%3-1)*.08;}
  }else if(t.treeShape==='cherry'||t.treeShape==='magnolia'){
   add(trunkGeometry,trunkMaterial,plant,0,2.25,0,1,1.12,1);
   for(let i=0;i<4;i++){const branch=add(new THREE.CylinderGeometry(.025,.06,1.1,5),trunkMaterial,plant,Math.cos(i*1.57)*.3,3.65,Math.sin(i*1.57)*.3);branch.rotation.z=Math.cos(i*1.57)*.65;branch.rotation.x=Math.sin(i*1.57)*.65;}
   const flowers=new THREE.InstancedMesh(wallFoliageGeometry(t),leafMaterials[1],100),dummy=new THREE.Object3D();flowers.name='tree-canopy';for(let i=0;i<100;i++){const a=i*2.399,r=.85*Math.sqrt((i+.5)/100);dummy.position.set(Math.cos(a)*r,4.15+Math.sin(i*1.8)*.32,Math.sin(a)*r);dummy.rotation.set(i*.8,a,i*.3);dummy.scale.setScalar(.45+(i%3)*.12);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);}plant.add(flowers);
  }else if(t.kind==='autumn'){
   add(trunkGeometry,trunkMaterial,plant,0,2.32,0,1,1.17,1);
   const leaves=new THREE.InstancedMesh(wallFoliageGeometry(t),g.material('#ffffff',{side:THREE.DoubleSide}),90),twigs=new THREE.InstancedMesh(new THREE.CylinderGeometry(.5,1,1,5),trunkMaterial,96),dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),palette=foliageColors(t);let stem=0,leaf=0;
   const branch=(a,b,r)=>{dummy.position.copy(a).lerp(b,.5);dummy.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());dummy.scale.set(r,a.distanceTo(b),r);dummy.updateMatrix();twigs.setMatrixAt(stem++,dummy.matrix);};
   for(let j=0;j<6;j++){const angle=j*Math.PI/3,root=new THREE.Vector3(0,3.65,0),tip=new THREE.Vector3(Math.cos(angle)*.95,4.65+(j%2)*.25,Math.sin(angle)*.95);branch(root,tip,.045);
    for(let k=0;k<5;k++)for(let n=0;n<3;n++){const node=root.clone().lerp(tip,.4+k*.15),a=angle+n*2.1+k*.8,anchor=node.clone().add(new THREE.Vector3(Math.cos(a)*.2,.06,Math.sin(a)*.2));branch(node,anchor,.01);dummy.position.copy(anchor);dummy.rotation.set(-.6+n*.7,a,k*.5);dummy.scale.setScalar(.8+(k%2)*.2);dummy.updateMatrix();leaves.setMatrixAt(leaf,dummy.matrix);leaves.setColorAt(leaf++,new THREE.Color(palette[(j+k%2)%palette.length]));}
   }leaves.name='tree-canopy';plant.add(twigs,leaves);
  }else if(cones){
   add(trunkGeometry,trunkMaterial,plant,0,2.1,0);cones.forEach((cone,i)=>{const crown=add(cone,leafMaterials[i%leafMaterials.length],plant,0,3.95+i*.57,0);crown.name='tree-canopy';});
  }else{
   add(trunkGeometry,trunkMaterial,plant,0,2.32,0,1,1.17,1);const count=t.treeShape==='rainforest'?9:7;for(let i=0;i<count;i++){const a=i*2.4,flowering=t.treeShape==='cherry'||t.treeShape==='magnolia';const crown=add(foliageGeometry,leafMaterials[i%leafMaterials.length],plant,Math.cos(a)*.43,4.4+Math.sin(a)*.18,Math.sin(a)*.42,.63*t.crownScale,flowering?.45+t.variant*.04:.75+t.variant*.04,.63*t.crownScale);crown.name='tree-canopy';}
   if(t.treeShape==='cherry'||t.treeShape==='magnolia')for(let i=0;i<5;i++)add(foliageGeometry,leafMaterials[2],plant,Math.sin(i*2.1)*.6,3.95+i*.12,Math.cos(i*2.1)*.6,.15,.09,.15);
  }
 }
}
export function welcomePalette(t){return{background:t.kind==='spring'?'#fff8fc':'#fff9e9',ink:{spring:'#652442',summer:'#153e2c',autumn:'#583016',tropical:'#123f38'}[t.kind]};}
export function foliageColors(t){return t.kind==='autumn'?[...t.plants,'#b73525','#e66c27','#985535','#6d7940']:t.plants;}
function addForestCanopy(g,group,t){
 const flowering=['cherry','magnolia'].includes(t.treeShape),tropical=t.kind==='tropical',cherry=t.treeShape==='cherry',pine=t.treeShape==='pine',dense=cherry||pine;
 const geometry=pine?pineSprayGeometry():tropical?frondGeometry(1.15,.17):wallFoliageGeometry(t);
 // Leaves pivot at their petiole; flowers meet the tip of their short stalk.
 if(!flowering&&!tropical&&!pine)geometry.translate(0,.25,0);
 const segments=[],foliage=[],colors=foliageColors(t).map(c=>new THREE.Color(c));let seed=t.seed;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const segment=(a,b,r)=>segments.push({a:a.clone(),b:b.clone(),r});
 const stations=dense?[-23,-18,-13.2,-8.3,-3.5,1.4,6.5,11.7,17,22.4]:[-22,-14.5,-6,1.7,9,16.6,23];
 for(const side of [-1,1])for(const station of stations){
  const z=station+(random()-.5)*2,bend=(random()-.5)*3,height=6.8+random()*1.1,root=new THREE.Vector3(side*9.25,4.8,z);
  const trunk=new THREE.CatmullRomCurve3([new THREE.Vector3(side*9.65,0,z-.35),new THREE.Vector3(side*9.5,2.3,z+.2),root]);
  for(let i=0;i<8;i++)segment(trunk.getPoint(i/8),trunk.getPoint((i+1)/8),.32-i*.018);
  const main=new THREE.CatmullRomCurve3([root,new THREE.Vector3(side*(6.5+random()),5.9,z+bend),new THREE.Vector3(side*(3+random()),height,z+1+bend),new THREE.Vector3(side*(random()-(dense?1.3:.3)),height-.15,z+1.8+bend)]);
  for(let i=0;i<16;i++)segment(main.getPoint(i/16),main.getPoint((i+1)/16),.19*(1-i/19));
  for(let j=0;j<(dense?12:10);j++){
   const u=dense?.12+j*.075:.18+j*.08,base=main.getPoint(u),direction=j%2?1:-1;
   const tip=base.clone().add(new THREE.Vector3(-side*(.5+random()*.7),-.1+random()*.4,direction*(1.8+random()*1.5)));
   const twig=new THREE.QuadraticBezierCurve3(base,base.clone().lerp(tip,.5).add(new THREE.Vector3(0,.2,0)),tip);
   for(let k=0;k<4;k++)segment(twig.getPoint(k/4),twig.getPoint((k+1)/4),.035*(1-k*.17));
   for(let k=0;k<6;k++){
    const node=twig.getPoint(.18+k*.16),count=flowering?6:pine?4:2;
    for(let n=0;n<count;n++){
     const angle=j*1.8+k*2.4+n*Math.PI*2/count,anchor=node.clone().add(new THREE.Vector3(Math.cos(angle)*(.2+random()*.25),-.03-random()*.3,Math.sin(angle)*(.2+random()*.25)));
     segment(node,anchor,.012);
     foliage.push({anchor,angle,tilt:(random()-.5)*(flowering?1.4:pine?.3:.55),scale:flowering?.85+random()*.35:pine?1.15+random()*.5:tropical?.65+random()*.25:.95+random()*.5,color:colors[(j+k+n+Math.floor(random()*3))%colors.length]});
    }
   }
  }
 }
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),branches=new THREE.InstancedMesh(new THREE.CylinderGeometry(.72,1,1,6),g.material(cherry?'#65473e':t.kind==='spring'?'#78503c':t.wood),segments.length);
 branches.name='canopy-branches';segments.forEach(({a,b,r},i)=>{dummy.position.copy(a).lerp(b,.5);dummy.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());dummy.scale.set(r,a.distanceTo(b),r);dummy.updateMatrix();branches.setMatrixAt(i,dummy.matrix);});group.add(branches);
 const leaves=new THREE.InstancedMesh(geometry,g.material('#ffffff',{side:THREE.DoubleSide,roughness:.9,emissive:flowering?'#ffdae9':pine?'#315e42':'#000000',emissiveIntensity:flowering?.32:pine?.2:0}),foliage.length);leaves.name='forest-ceiling-canopy';leaves.userData.kind=t.kind;
 foliage.forEach(({anchor,angle,tilt,scale,color},i)=>{dummy.position.copy(anchor);dummy.rotation.set(tropical?tilt:-Math.PI/2+tilt,tropical?angle:0,tropical?0:angle);dummy.scale.setScalar(scale);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,color);});group.add(leaves);
 if(t.kind==='autumn'){
  const fallen=new THREE.InstancedMesh(wallFoliageGeometry({...t,treeShape:'maple'}),leaves.material,140);fallen.name='fallen-autumn-leaves';
  for(let i=0;i<fallen.count;i++){dummy.position.set((i%2?1:-1)*(4.8+random()*2),.035,random()*45-22.5);dummy.rotation.set(-Math.PI/2,0,random()*Math.PI*2);dummy.scale.setScalar(.35+random()*.4);dummy.updateMatrix();fallen.setMatrixAt(i,dummy.matrix);fallen.setColorAt(i,colors[i%colors.length]);}group.add(fallen);
 }
}
export function applyClassTheme(g,c){
 if(!g.renderer)return;const t=classStyle(c),key=`${c?.id||''}:${c?.name||''}:${t.id}:${t.seed}`;g.theme=t;if(g.themeKey===key)return;g.themeKey=key;
 const e=g.environment;e.wall.color.set(t.wall);e.ceiling.color.set(t.ceiling);e.gold.color.set(t.accent);e.wood.color.set(t.wood);e.carpets.forEach(m=>m.color.set(t.carpet));e.lights.forEach(l=>l.color.set(t.light));e.fill.color.set(t.fill);
 e.ceiling.map?.dispose();e.ceiling.map=ceilingTexture(g,t);e.ceiling.needsUpdate=true;
 g.scene.background.set(t.ceiling);g.scene.fog.color.set(t.ceiling);g.scene.fog.near=55;g.scene.fog.far=130;g.fireflies.material.color.set(t.accent);e.leaves.visible=false;e.leaves.material.color.set(t.plants[t.treeShape==='cherry'?1:0]);e.leaves.geometry.dispose();e.leaves.geometry=wallFoliageGeometry(t);e.leaves.material.side=THREE.DoubleSide;e.floor?.color.set({spring:'#e3cfb7',summer:'#bec8a1',autumn:'#cda575',tropical:'#9daf8d'}[t.kind]);
 e.leaves.material.color.set('#ffffff');const wallColors=foliageColors(t);for(let i=0;i<e.leaves.count;i++)e.leaves.setColorAt(i,new THREE.Color(wallColors[i%wallColors.length]));e.leaves.instanceColor.needsUpdate=true;
 const zoneNames={spring:['새순의 문','꽃나무 길','봄빛 서가'],summer:['나무 그늘','초록 잎길','여름 서가'],autumn:['단풍의 문','낙엽 길','노을 서가'],tropical:['큰 잎의 문','야자 그늘','우림 서가']};
 e.zoneSigns.forEach((sign,i)=>{sign.material.map?.dispose();sign.material.map=g.texture((ctx,w,h)=>{ctx.fillStyle=t.frame;ctx.fillRect(0,0,w,h);ctx.fillStyle=t.pale;ctx.font='bold 90px "Malgun Gothic",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(`0${i+1}  ${zoneNames[t.kind][i]}`,w/2,h/2,w-40);},1024,256);});
 e.floorMarks.forEach(mark=>{mark.material.map?.dispose();mark.material.map=g.texture((ctx,w,h)=>{ctx.fillStyle=t.carpet;ctx.fillRect(0,0,w,h);ctx.translate(w/2,h/2);ctx.fillStyle=t.accent;ctx.strokeStyle=t.accent;ctx.lineWidth=3;drawLeaf(ctx,0,0,80,-.55);},256,256);});
 if(g.classDecor){disposeDecor(g.classDecor);g.scene.remove(g.classDecor);}const group=new THREE.Group();group.name='classroom-theme';g.classDecor=group;g.scene.add(group);addPlanters(g,group,t);addForestCanopy(g,group,t);buildForestGround(g,group,t);
 // All forest trees retain the established planter and walking footprints.
 g.box(2.3,.16,.85,0,.08,16.5,g.material(t.frame),group);for(const x of [-1.35,1.35]){g.box(.12,2.7,.14,x,1.35,16.5,g.material(t.accent),group);g.box(.42,.1,.75,x,.06,16.5,g.material(t.accent),group);}g.box(3.8,1.75,.18,0,2.25,16.5,g.material(t.accent),group);
 const signColors=welcomePalette(t);const texture=g.texture((ctx,w,h)=>{ctx.fillStyle=signColors.background;ctx.fillRect(0,0,w,h);ctx.strokeStyle=t.accent;ctx.lineWidth=3;ctx.strokeRect(22,22,w-44,h-44);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=signColors.ink;ctx.font='bold 34px "Malgun Gothic",sans-serif';ctx.fillText('작은 작가들의 이야기숲',w/2,85,w-90);const name=c?.name?c.name+' 도서관':'이야기숲 도서관';let size=88;do{ctx.font=`bold ${size}px "Malgun Gothic",sans-serif`;if(ctx.measureText(name).width<w-100)break;size-=2;}while(size>32);const lines=[];let line='';for(const ch of name){if(ctx.measureText(line+ch).width>w-100&&line){lines.push(line);line='';}line+=ch;}lines.push(line);ctx.fillStyle=signColors.ink;lines.forEach((s,i)=>ctx.fillText(s,w/2,235+(i-(lines.length-1)/2)*(size+12)));ctx.font='bold 32px "Malgun Gothic",sans-serif';ctx.fillStyle=signColors.ink;ctx.fillText('친구들이 만든 책 속으로 함께 떠나요!',w/2,370);},1024,448);
 for(const side of [-1,1]){const board=new THREE.Mesh(new THREE.PlaneGeometry(3.62,1.58),new THREE.MeshBasicMaterial({map:side===1?texture:texture.clone(),toneMapped:false}));board.name='classroom-welcome-board';board.position.set(0,2.25,16.5+side*.1);board.rotation.y=side===1?0:Math.PI;group.add(board);}g.renderer.shadowMap.needsUpdate=true;
}
export function buildExhibitFrame(g,group,occupied){
 const t=g.theme||classStyle(null);group.name='exhibit-frame';group.userData.theme=t.kind;group.userData.frameStyle=t.frameStyle;const trim=g.material(t.accent,{metalness:.35,roughness:.45}),wood=g.material(t.wood);
 g.box(2.18,3.3,.12,0,2.12,-.05,g.material(occupied?({spring:'#eee2dc',summer:'#dbe7d2',autumn:'#f0dfbe',tropical:'#d0e2d5'}[t.kind]):t.frame),group);for(const x of [-1.08,1.08])g.box(.07,3.4,.22,x,2.12,0,trim,group);g.box(2.32,.16,.65,0,.42,.12,wood,group);g.box(2.2,.065,.24,0,3.8,.03,trim,group);
 if(t.kind==='spring'||t.kind==='tropical'){const points=[];for(let i=0;i<=16;i++){const a=i*Math.PI/16;points.push(new THREE.Vector3(Math.cos(a)*1.08,3.8+Math.sin(a)*(t.kind==='spring'?.4:.22),.02));}group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),20,.055,6,false),trim));}
 else if(t.kind==='autumn'){for(const side of [-1,1]){const bar=g.box(1.2,.09,.2,side*.52,4,.02,wood,group);bar.rotation.z=-side*.36;}}
 else for(const x of [-.94,.94]){const cap=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),trim);cap.position.set(x,3.96,.03);group.add(cap);}
 let geometry;if(t.treeShape==='maple')geometry=new THREE.ShapeGeometry(mapleShape());else if(t.treeShape==='ginkgo')geometry=new THREE.CircleGeometry(.2,12,.15,Math.PI-.3);else geometry=new THREE.ShapeGeometry(leafShape());const icon=new THREE.Mesh(geometry,g.material(t.plants[1],{side:THREE.DoubleSide}));icon.scale.set(.65,.65,1);icon.position.set(0,4.05,.1);icon.name='frame-theme-crest';icon.userData.motif='leaf';group.add(icon);
}
