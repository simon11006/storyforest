import fs from 'node:fs';
import {createCanvas,DOMMatrix,ImageData,Path2D} from '@napi-rs/canvas';
Object.assign(globalThis,{DOMMatrix,ImageData,Path2D});
const {getDocument}=await import('pdfjs-dist/legacy/build/pdf.mjs');
const catalog=[];
for(const [id,title,author] of [['milk','우유와 밀크의 놀이공원 대모험','이윤우'],['penguin','펭귄 로봇의 공장 탈출!','장이수']]){
 const path=`inputs/${id}.pdf`, data=fs.readFileSync(path);
 const task=getDocument({data:new Uint8Array(data),useSystemFonts:true});
 const pdf=await task.promise;
 const page=await pdf.getPage(1),v=page.getViewport({scale:600/page.getViewport({scale:1}).width});
 const canvas=createCanvas(Math.ceil(v.width),Math.ceil(v.height));
 await page.render({canvasContext:canvas.getContext('2d'),viewport:v}).promise;
 fs.writeFileSync(`dist/books/${id}.jpg`,canvas.toBuffer('image/jpeg',88));
 const chunks=[];
 for(let i=0;i<data.length;i+=8*1024*1024){const p=`books/${id}-${chunks.length}.bin`;fs.writeFileSync(`dist/${p}`,data.subarray(i,i+8*1024*1024));chunks.push(p)}
 catalog.push({id,title,author,pages:pdf.numPages,cover:`books/${id}.jpg`,chunks,bytes:data.length});
 await task.destroy();
}
fs.writeFileSync('dist/books.json',JSON.stringify(catalog,null,2));
console.log(catalog.map(({title,pages,bytes})=>({title,pages,bytes})));
