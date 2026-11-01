import assert from 'node:assert/strict';
import {slotPosition,canStand} from './src/gallery.js';
import {LibraryStore,assertSlot} from './src/store.js';
import * as THREE from 'three';
import {Gallery} from './src/gallery.js';
import {classTheme, themes} from './src/themes.js';
assert.equal(canStand(0,16.5),false);
assert.equal(canStand(2.5,16.5),true);
assert.equal(canStand(-2.5,16.5),true);
const gallery=Object.create(Gallery.prototype);
gallery.scene=new THREE.Scene();gallery.renderer={shadowMap:{}};gallery.texture=()=>new THREE.Texture();gallery.buildRoom();
const roomObjects=gallery.scene.children.length;
const seen=new Set();
for(let i=1;i<=8;i++){
 const cls={id:`class-${i}`,name:`3학년 ${i}반`};gallery.setClass(cls);
 seen.add(classTheme(cls).kind);
 assert.equal(gallery.scene.children.length,roomObjects+1,'old classroom decorations must be removed');
 assert.equal(gallery.environment.wall.color.getHexString(),classTheme(cls).wall.slice(1));
 assert.equal(gallery.classDecor.children.filter(o=>o.material?.map).length,2,'sign is readable from both sides');
 const count=gallery.classDecor.children.length;gallery.setClass(cls);assert.equal(gallery.classDecor.children.length,count);
}
assert.equal(seen.size,themes.length);
console.log('PASS four classroom themes, repeated transitions, two-sided sign and walkable detours');
assert.equal(new Set(Array.from({length:30},(_,i)=>JSON.stringify(slotPosition(i+1)))).size,30);
assertSlot(30);assert.throws(()=>assertSlot(31));assert.throws(()=>assertSlot(0));
assert.equal(canStand(0,20),true);assert.equal(canStand(10,0),false);assert.equal(canStand(4.3,11),false);
for(const z of [19.8,6.3,-7.2]){assert.equal(canStand(6.7,z),false);assert.equal(canStand(0,z),true);}
assert.equal(canStand(-7.2,13.5),false);
const s=new LibraryStore();s.memory={classes:new Map(),books:new Map()};
await s.addBook('class-a',{slot:1,title:'책',author:'작가'});
await s.addBook('class-b',{slot:1,title:'다른 학급 책',author:'작가'});
await assert.rejects(()=>s.addBook('class-a',{slot:1,title:'덮어쓰기',author:'작가'}));
assert.equal((await s.books('class-a')).length,1);assert.equal((await s.books('class-b')).length,1);
console.log('PASS 30 unique positions, room collisions, slot capacity, duplicate protection, classroom isolation');

s.mode='firebase';s.role='teacher';s.user={email:'teacher@example.com'};assert.equal(s.manages({teacherEmail:'teacher@example.com'}),true);assert.equal(s.manages({teacherEmail:'other@example.com'}),false);s.role='student';assert.equal(s.manages({teacherEmail:'teacher@example.com'}),false);s.isAdmin=true;assert.equal(s.manages({teacherEmail:'other@example.com'}),true);console.log('PASS class ownership and super administrator UI permissions');
