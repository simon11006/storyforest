import * as THREE from 'three';

// Repeated architectural parts share materials and geometry to keep the world light.
export function buildForest(g) {
 const scene=g.scene, mat=(c,o)=>g.material(c,o), box=(...a)=>g.box(...a);
 const wood=mat('#684632'), gold=mat('#d8ae63',{metalness:.65,roughness:.32}), stone=mat('#dfd6bd'), teal=mat('#275954');
 const carpets=[],lights=[];const ceiling=mat('#c7b994',{side:THREE.DoubleSide,roughness:.8});
 const glow=new THREE.MeshBasicMaterial({color:'#ffe4a0'});
 const mesh=(geo,m,x,y,z)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.receiveShadow=true;scene.add(o);return o;};
 const floorMap=g.texture((c,w,h)=>{c.fillStyle='#a78056';c.fillRect(0,0,w,h);for(let y=0;y<h;y+=128){c.fillStyle=['#aa8259','#b58e64','#9f7953','#b08c62'][y/128%4];c.fillRect(0,y,w,126);for(let i=0;i<35;i++){c.strokeStyle='#5b382c15';c.beginPath();c.moveTo(0,y+i*3.6);c.bezierCurveTo(300,y+i*3.6+5,700,y+i*3.6-6,w,y+i*3.6);c.stroke();}c.fillStyle='#60433255';c.fillRect(y%256?200:700,y,2,128);}});
 floorMap.wrapS=floorMap.wrapT=THREE.RepeatWrapping;floorMap.repeat.set(4,10);
 const floor=mesh(new THREE.PlaneGeometry(20,49),mat('#ffffff',{map:floorMap,roughness:.55}),0,0,0);floor.rotation.x=-Math.PI/2;floor.name='library-floor';
 for(const x of [-10,10]){const wall=box(.4,5.8,49,x,2.9,0,teal);wall.name=x<0?'library-left-wall':'library-right-wall';box(.15,.22,49,x*.978,.22,0,gold);box(.15,.18,49,x*.978,4.7,0,gold);}
 // Vaulted timber ribs and a translucent blue-green canopy.
 const vaultVertices=[],vaultIndices=[];for(let i=0;i<=48;i++){const a=i/48*Math.PI;for(const z of [-24.5,24.5])vaultVertices.push(Math.cos(a)*10.2,4.6+Math.sin(a)*4.35,z);if(i<48){const k=i*2;vaultIndices.push(k,k+1,k+2,k+1,k+3,k+2);}}
 const vault=new THREE.BufferGeometry();vault.setAttribute('position',new THREE.Float32BufferAttribute(vaultVertices,3));vault.setIndex(vaultIndices);vault.computeVertexNormals();mesh(vault,ceiling,0,0,0).name='library-vault';
 for(let z=-23;z<25;z+=5.4){const points=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI;points.push(new THREE.Vector3(Math.cos(a)*9.8,4.5+Math.sin(a)*4.2,z));}mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,.12,6,false),wood,0,0,0);for(const x of [-9.7,9.7])box(.24,4.6,.25,x,2.3,z,wood);}
 for(const x of [-6.5,-3.3,0,3.3,6.5])box(.09,.09,48,x,4.5+Math.sqrt(1-(x/9.8)**2)*4.2,0,gold);
 const themes=['#4b8171','#7484a8','#bb8359'];
 const names=['새싹의 숲','별빛의 숲','노을의 숲'];
 for(let zone=0;zone<3;zone++){
  const z=18-zone*13.5,color=themes[zone];
  // Woven runner, metallic edging and a medallion beneath each chandelier.
  const carpet=mat(color);carpets.push(carpet);box(5.4,.025,12.4,0,.025,z-4,carpet);
  for(const x of [-2.57,2.57])box(.035,.01,12.2,x,.045,z-4,gold);
  for(const zz of [z+1.8,z-9.8])box(5.1,.012,.035,0,.045,zz,gold);
  const medal=mesh(new THREE.RingGeometry(.85,.89,64),gold,0,.05,z-2);medal.rotation.x=-Math.PI/2;
  const star=g.label('✦',1.1,1.1,{background:color,color:'#e6c58b',font:100});star.rotation.x=-Math.PI/2;star.position.set(0,.052,z-2);scene.add(star);
  // Large welcoming portals frame the route without blocking the walking area.
  for(const x of [-6.7,6.7]){box(.5,5.5,.6,x,2.75,z+1.8,wood);box(.8,.3,.9,x,.15,z+1.8,stone);box(.7,.18,.8,x,4.7,z+1.8,gold);}
  const arch=[];for(let i=0;i<=32;i++){let a=i/32*Math.PI;arch.push(new THREE.Vector3(6.7*Math.cos(a),4.7+1.7*Math.sin(a),z+1.8));}
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch),40,.22,8,false),wood,0,0,0);
  const sign=g.label(`0${zone+1}  ${names[zone]}`,3.7,.6,{background:color,color:'#fff0cb',font:58});sign.position.set(0,5.5,z+2.05);scene.add(sign);
  for(const x of [-4,4]){
   box(.035,1.4,.035,x,5.8,z-1,gold);
   const lantern=mesh(new THREE.CylinderGeometry(.28,.36,.58,8),glow,x,4.85,z-1);
   for(const y of [4.54,5.16])mesh(new THREE.CylinderGeometry(.38,.38,.07,8),gold,x,y,z-1);
   for(let i=0;i<4;i++){const a=i*Math.PI/2;box(.035,.65,.035,x+Math.cos(a)*.28,4.85,z-1+Math.sin(a)*.28,gold);}
  }
  const ring=mesh(new THREE.TorusGeometry(1.25,.045,8,64),gold,0,5.3,z-2);ring.rotation.x=Math.PI/2;
  for(let i=0;i<8;i++){let a=i*Math.PI/4;mesh(new THREE.SphereGeometry(.075,8,6),glow,Math.cos(a)*1.25,5.3,z-2+Math.sin(a)*1.25);}
  const light=new THREE.PointLight('#ffdda0',34,17,2);light.position.set(0,4.8,z-2);scene.add(light);lights.push(light);
 }
 // Upholstered reading islands, miniature stacks of books, and lush planters.
 const bookColors=['#b45d50','#d3ab58','#577d84','#758b61','#9b789d'];
 for(const z of [11,-3,-17])for(const x of [-4.3,4.3]){
  box(3.2,.25,1.2,x,.4,z,wood);box(3.05,.22,1.1,x,.64,z,mat('#bdbb91'));
  for(const dx of [-1.25,1.25])box(.15,.4,.85,x+dx,.2,z,gold);
  box(.75,.12,.75,x-.9,.8,z,mat('#48786b'));
  for(let i=0;i<3;i++){const b=box(.42,.075,.58,x+.95,.81+i*.08,z,mat(bookColors[i]));b.rotation.y=i*.2;}
 }
 for(const x of [-7.2,7.2])for(const z of [22.5,13.5,0,-13.5,-22])g.plant(x,z,1);
 // Dense leaf clusters above the display walls: shared instancing, not hundreds of draw calls.
 const leaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),mat('#497554'),240);
 const dummy=new THREE.Object3D();for(let i=0;i<240;i++){let side=i%2?1:-1;dummy.position.set(side*(9.25-Math.sin(i*2.4)*.35),4.8+Math.sin(i*1.8)*.3,23-(i/2|0)*.39);dummy.scale.set(.55,.19,.4);dummy.rotation.set(i*.3,i*2.4,i*.6);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);}scene.add(leaves);
 // Full-height bookcases at the far end give the walk a destination.
 box(20,8,.4,0,4,-24,teal);
 for(const x of [-7,-3.5,3.5,7]){
  box(3.1,4.5,.5,x,2.25,-23.65,wood);
  for(let r=0;r<5;r++){box(2.85,.09,.6,x,.5+r*.79,-23.3,gold);for(let j=0;j<12;j++){const h=.4+(j*7%5)*.055;box(.16,h,.32,x-1.25+j*.22,.55+r*.79+h/2,-23.25,mat(bookColors[(j+r)%5]));}}
 }
 const emblem=mesh(new THREE.TorusGeometry(1.15,.05,8,64),gold,0,3.3,-23.65);
 const end=g.label('우리의 이야기는 계속돼',5.5,.65,{background:'#275954',color:'#f3dfb4',font:49});end.position.set(0,5.3,-23.6);scene.add(end);
 const openBook=new THREE.Group();for(const side of [-1,1]){const page=box(.8,.08,1.1,side*.38,0,0,stone,openBook);page.rotation.z=side*.22;}openBook.position.set(0,3.25,-23.3);openBook.rotation.x=.65;scene.add(openBook);
 const dustGeo=new THREE.BufferGeometry(),p=[];for(let i=0;i<100;i++)p.push(Math.sin(i*12.3)*8,2+(i%17)/4,23-(i*7%47));dustGeo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.fireflies=new THREE.Points(dustGeo,new THREE.PointsMaterial({color:'#ffe3a4',size:.045,transparent:true,opacity:.65,depthWrite:false}));scene.add(g.fireflies);
 scene.background=new THREE.Color('#203d42');scene.fog=new THREE.Fog('#294b48',28,85);
 scene.add(new THREE.HemisphereLight('#e2f4ef','#775332',2.5));const sun=new THREE.DirectionalLight('#ffdfad',3);sun.position.set(-5,12,20);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-14,right:14,top:29,bottom:-29,near:1,far:80});sun.shadow.normalBias=.035;sun.target.position.set(0,0,-8);scene.add(sun,sun.target);
 const fill=new THREE.DirectionalLight('#96d7dd',1.8);fill.position.set(5,6,-20);scene.add(fill);lights.push(sun);g.environment={wall:teal,ceiling,gold,carpets,lights,fill,leaves};
 // This fixed room surrounds the viewer. Keep its enclosing architecture visible
 // at the entrance and while turning; exhibition frames retain normal culling.
 scene.traverse(object=>{if(object.isMesh)object.frustumCulled=false;});
}
