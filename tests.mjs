import assert from 'node:assert/strict';
import {slotPosition,canStand} from './src/gallery.js';
import {LibraryStore,assertSlot} from './src/store.js';
import * as THREE from 'three';
import {Gallery} from './src/gallery.js';
import {classTheme, classStyle, baseThemes, themes, chooseClassTheme, welcomePalette} from './src/themes.js';
import {classCapacity,assertCapacity,availableSlots,exhibitedBooks} from './src/capacity.js';
assert.equal(canStand(0,16.5),false);
assert.equal(canStand(2.5,16.5),true);
assert.equal(canStand(-2.5,16.5),true);
const gallery=Object.create(Gallery.prototype);
gallery.scene=new THREE.Scene();gallery.renderer={shadowMap:{}};gallery.texture=()=>new THREE.Texture();gallery.buildRoom();
const columns=gallery.scene.children.filter(o=>['portal-column','portal-base'].includes(o.name));assert.equal(columns.length,12);gallery.scene.updateMatrixWorld(true);for(const column of columns){const box=new THREE.Box3().setFromObject(column);assert.ok(box.min.x>9||box.max.x< -9,'columns and bases must be behind displays and outside the aisle');}const roomObjects=gallery.scene.children.length;
const seen=new Set();
const luminance=hex=>{const c=new THREE.Color(hex);return .2126*c.r+.7152*c.g+.0722*c.b;};
for(const theme of themes){const palette=welcomePalette(theme);assert.ok((luminance(palette.background)+.05)/(luminance(palette.ink)+.05)>=7,'welcome sign text must have at least 7:1 contrast in every theme');}
for(let i=1;i<=40;i++){
 const cls={id:`class-${i}`,name:`3학년 ${i}반`};gallery.setClass(cls);
 seen.add(classTheme(cls).id);
 const ceilingCanopy=gallery.classDecor.getObjectByName('forest-ceiling-canopy');assert.ok(ceilingCanopy?.isInstancedMesh,'ceiling foliage should use a shared instanced draw');gallery.scene.updateMatrixWorld(true);assert.ok(new THREE.Box3().setFromObject(ceilingCanopy).min.y>4.5,'ceiling foliage must remain clear of visitors and displays');
 assert.equal(gallery.scene.children.length,roomObjects+1,'old classroom decorations must be removed');
 assert.equal(gallery.environment.wall.color.getHexString(),classTheme(cls).wall.slice(1));assert.equal(gallery.environment.ceiling.color.getHexString(),classTheme(cls).ceiling.slice(1));assert.equal(gallery.environment.ceiling.map.userData.pattern,classTheme(cls).kind);assert.equal(gallery.environment.ceiling.map.userData.variant,classTheme(cls).variant);assert.equal(gallery.scene.getObjectByName('library-vault').geometry.attributes.uv.count,gallery.scene.getObjectByName('library-vault').geometry.attributes.position.count);assert.ok(gallery.scene.getObjectByName('library-vault'));assert.ok(gallery.scene.getObjectByName('library-left-wall'));assert.ok(gallery.scene.getObjectByName('library-right-wall'));for(const name of ['library-floor','library-vault','library-left-wall','library-right-wall'])assert.equal(gallery.scene.getObjectByName(name).frustumCulled,false,'the enclosing room must remain visible');
 assert.equal(gallery.classDecor.children.filter(o=>o.material?.map).length,2,'sign is readable from both sides');
 const planters=gallery.classDecor.children.filter(o=>o.name==='theme-planter');assert.equal(planters.length,10);assert.ok(planters.every(o=>o.userData.kind===classTheme(cls).kind&&o.userData.treeShape===classTheme(cls).treeShape&&Math.abs(o.position.x)===7.2));gallery.scene.updateMatrixWorld(true);let canopyCount=0;gallery.classDecor.traverse(o=>{if(o.name==='tree-canopy'){canopyCount+=o.isInstancedMesh?o.count:1;const bounds=new THREE.Box3().setFromObject(o);assert.ok(bounds.min.y>=3.2,'tree foliage must stay above book covers');}});assert.ok(canopyCount>=30);let decorMeshes=0;gallery.classDecor.traverse(o=>{if(o.isMesh)decorMeshes++;});assert.ok(decorMeshes<190,'theme decorations must stay within the mobile draw-call budget');
 const group=gallery.classDecor,map=gallery.environment.ceiling.map;gallery.setClass(cls);assert.equal(gallery.classDecor,group,'book or capacity refreshes must reuse the current room');assert.equal(gallery.environment.ceiling.map,map);
 let disposed=0;map.addEventListener('dispose',()=>disposed++);gallery.setClass({id:cls.id+'-next',name:cls.name});assert.equal(disposed,1,'switching rooms must release the previous ceiling texture');assert.equal(group.parent,null);
}
assert.equal(themes.length,12);assert.equal(baseThemes.length,4);assert.deepEqual(baseThemes.map(t=>t.kind),['spring','summer','autumn','tropical']);assert.ok(new Set(themes.map(t=>t.treeShape)).size>=9,'forest variants must include different tree silhouettes');assert.equal(seen.size,themes.length);for(const base of baseThemes)assert.equal(themes.filter(t=>t.kind===base.kind).length,3);
assert.equal(classTheme({id:'stable',name:'학급 이름 변경 전'}),classTheme({id:'stable',name:'이름 변경 후'}),'renaming a classroom must preserve its theme');assert.equal(new Set(Array.from({length:20},(_,i)=>classStyle({id:'class-'+i}).frameStyle)).size,3);
console.log('PASS twelve stable seasonal and regional forest variants with unobstructed book covers, ceiling patterns, themed planters, stable themes after rename, cached resources, texture disposal, two-sided signs and walkable detours');
assert.equal(new Set(Array.from({length:30},(_,i)=>JSON.stringify(slotPosition(i+1)))).size,30);
assertSlot(30);assert.throws(()=>assertSlot(31));assert.throws(()=>assertSlot(0));
assert.equal(canStand(0,20),true);assert.equal(canStand(10,0),false);assert.equal(canStand(4.3,11),false);
for(const z of [19.8,6.3,-7.2]){assert.equal(canStand(6.7,z),true);assert.equal(canStand(-6.7,z),true);assert.equal(canStand(0,z),true);}
assert.equal(canStand(-7.2,13.5),false);
const s=new LibraryStore();s.memory={classes:new Map(),books:new Map()};
await s.addBook('class-a',{slot:1,title:'책',author:'작가'});
await s.addBook('class-b',{slot:1,title:'다른 학급 책',author:'작가'});
await assert.rejects(()=>s.addBook('class-a',{slot:1,title:'덮어쓰기',author:'작가'}));
assert.equal((await s.books('class-a')).length,1);assert.equal((await s.books('class-b')).length,1);
console.log('PASS 30 unique positions, room collisions, slot capacity, duplicate protection, classroom isolation');

assert.equal(classCapacity({}),30);
for(const value of [0,31,20.5,NaN,'20'])assert.throws(()=>assertCapacity(value));
const cls=await s.addClass('20명 학급',20);
assert.equal((await s.getClass(cls.id)).capacity,20);
await s.addBook(cls.id,{slot:20,title:'마지막 자리',author:'작가'});
await assert.rejects(()=>s.addBook(cls.id,{slot:21,title:'정원 초과',author:'작가'}));
await s.updateClass(cls,{capacity:19});
assert.equal((await s.getClass(cls.id)).capacity,19);
assert.equal((await s.books(cls.id)).length,1,'reducing the capacity must keep the existing book');
assert.equal(exhibitedBooks(await s.getClass(cls.id),await s.books(cls.id)).length,0);
await s.updateClass(cls,{capacity:20});
assert.equal(exhibitedBooks(await s.getClass(cls.id),await s.books(cls.id)).length,1,'increasing the capacity must restore the retained book');
await s.updateClass(cls,{capacity:25});await s.updateClass(cls,{accepting:false});
assert.equal((await s.getClass(cls.id)).capacity,25,'a stale settings form must preserve the saved capacity');
assert.equal((await s.getClass(cls.id)).accepting,false);
await s.removeBook(cls.id,{slot:20});await s.updateClass(cls,{capacity:10});
assert.equal((await s.getClass(cls.id)).capacity,10);
assert.deepEqual(availableSlots({capacity:2},[{slot:1},{slot:2}]),[]);
assert.deepEqual(availableSlots({capacity:3},[{slot:1},{slot:3}]),[2]);
const exhibition=Object.create(Gallery.prototype);exhibition.scene=new THREE.Scene();exhibition.renderer={shadowMap:{}};exhibition.texture=()=>new THREE.Texture();exhibition.art=new THREE.Group();exhibition.buildRoom();
exhibition.setClass({id:'twenty',capacity:20});exhibition.setBooks([]);assert.equal(exhibition.art.children.length,20);assert.ok(exhibition.art.children.every(frame=>frame.userData.theme===classTheme({id:'twenty'}).kind&&frame.userData.frameStyle===classStyle({id:'twenty'}).frameStyle));assert.equal(exhibition.art.children[0].getObjectByName('frame-theme-crest').userData.motif,'leaf');let oldFrameDisposed=0;const frameTrim=exhibition.art.children[0].children[1].material;frameTrim.addEventListener('dispose',()=>oldFrameDisposed++);
exhibition.setClass({id:'seven',capacity:7});exhibition.setBooks([]);assert.equal(exhibition.art.children.length,7,'old exhibition frames must be removed');assert.equal(oldFrameDisposed,1,'shared frame trim must be disposed once');assert.ok(exhibition.art.children.every(frame=>frame.userData.theme===classTheme({id:'seven'}).kind));
exhibition.near={slot:20};exhibition.renderer=null;exhibition.setBooks([{slot:1},{slot:20}]);assert.deepEqual(exhibition.books,[{slot:1}]);assert.equal(exhibition.near,null,'retained books must not be reachable through the nearby-book action');
console.log('PASS per-class capacity, retained books after reductions, restored exhibits, stale settings, and exact 3D frame counts');
s.mode='firebase';s.role='teacher';s.user={email:'teacher@example.com',emailVerified:true};assert.equal(s.manages({teacherEmail:'teacher@example.com'}),true);assert.equal(s.manages({teacherEmail:'other@example.com'}),false);s.role='student';assert.equal(s.manages({teacherEmail:'teacher@example.com'}),false);s.isAdmin=true;assert.equal(s.manages({teacherEmail:'other@example.com'}),true);s.user.emailVerified=false;assert.equal(s.canCreateClass(),false);assert.equal(s.manages({teacherEmail:'teacher@example.com'}),false);console.log('PASS class ownership and super administrator UI permissions');

s.mode='local';const doomed=await s.addClass('작품이 있는 학급',3);await s.addBook(doomed.id,{slot:1,title:'삭제할 책',author:'작가'});s.memory.submissions=new Map([['pending',{classId:doomed.id}],['other',{classId:'class-a'}]]);await s.deleteClass(doomed);assert.equal(await s.getClass(doomed.id),undefined);assert.equal((await s.books(doomed.id)).length,0);assert.equal(s.memory.submissions.has('pending'),false);assert.equal(s.memory.submissions.has('other'),true);assert.equal((await s.books('class-a')).length,1);console.log('PASS local populated-class cascade and classroom isolation');

const balanced=[];for(let i=0;i<24;i++){const themeId=chooseClassTheme(balanced);balanced.push({id:'balanced-'+i,name:'학급',themeId});const counts=baseThemes.map(f=>balanced.filter(c=>classTheme(c).kind===f.kind).length);assert.ok(Math.max(...counts)-Math.min(...counts)<=1);}for(const t of themes)assert.equal(balanced.filter(c=>c.themeId===t.id).length,2);for(const c of balanced)assert.equal(classTheme(c),classTheme({...c,name:'이름 변경'}));console.log('PASS balanced family/variant allocation and persisted theme stability');

const themedStore=new LibraryStore();themedStore.memory={classes:new Map(),books:new Map()};const themedClass=await themedStore.addClass('테마 저장 검증',12);await themedStore.updateClass(themedClass,{themeId:'spring-0'});await themedStore.updateClass(themedClass,{name:'이름 변경',capacity:10});assert.equal((await themedStore.getClass(themedClass.id)).themeId,'spring-0');await assert.rejects(()=>themedStore.updateClass(themedClass,{themeId:'invalid'}));console.log('PASS explicit theme selection persists across unrelated settings changes');
