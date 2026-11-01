export function youtubeLink(value){
 const text=String(value||'').trim();if(!text)return '';
 let url;try{url=new URL(text);}catch{throw Error('올바른 유튜브 영상 링크를 입력해 주세요.');}
 const host=url.hostname.toLowerCase().replace(/^www\./,'');let id;
 if(url.protocol==='https:'&&!url.username&&!url.password&&!url.port){
  if(host==='youtu.be')id=url.pathname.slice(1);
  else if(['youtube.com','m.youtube.com'].includes(host)){
   if(url.pathname==='/watch')id=url.searchParams.get('v');
   else id=url.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)\/?$/)?.[1];
  }
 }
 if(!/^[\w-]{11}$/.test(id||''))throw Error('유튜브의 영상 공유 링크를 입력해 주세요. 채널이나 재생목록 링크는 사용할 수 없어요.');
 return 'https://www.youtube.com/watch?v='+id;
}

export function videoCover(title){
 const escape=s=>s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
 const chars=Array.from(String(title||'영상북')),lines=[];for(let i=0;i<Math.min(chars.length,40);i+=10)lines.push('<text x="210" y="'+(450+i/10*30)+'" fill="#fff4da" text-anchor="middle" font-size="24">'+escape(chars.slice(i,i+10).join(''))+'</text>');
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="420" height="600"><rect width="420" height="600" fill="#244b43"/><rect x="20" y="20" width="380" height="560" rx="10" fill="none" stroke="#d9bc7d" stroke-width="3"/><text x="210" y="100" fill="#ead6a5" text-anchor="middle" font-size="28">STORY FOREST</text><circle cx="210" cy="260" r="65" fill="#d9bc7d"/><path d="M192 224 L192 296 L246 260 Z" fill="#244b43"/><text x="210" y="400" fill="#fff4da" text-anchor="middle" font-size="34">영상북</text>'+lines.join('')+'</svg>');
}
export async function prepareBook(file,value,title,inspectPDF){
 const youtubeUrl=youtubeLink(value);
 if(file?.size)return {...await inspectPDF(file),youtubeUrl};
 if(!youtubeUrl)throw Error('동화책 PDF 또는 영상북 유튜브 링크 중 하나를 입력해 주세요.');
 return {kind:'video',youtubeUrl,cover:videoCover(title)};
}
export function openVideo(book){
 const href=youtubeLink(book.youtubeUrl);if(!href)return;
 let dialog=document.querySelector('#videoReader');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='videoReader';dialog.className='video-dialog';dialog.setAttribute('aria-label','영상북 보기');const head=document.createElement('div');head.className='video-head';const title=document.createElement('h2');title.id='videoTitle';const close=document.createElement('button');close.textContent='닫기 ✕';close.onclick=()=>dialog.close();head.append(title,close);const body=document.createElement('div');body.className='video-body';dialog.append(head,body);document.body.append(dialog);dialog.addEventListener('close',()=>body.replaceChildren());}
 const frame=document.createElement('iframe');frame.title=book.title+' 영상북';frame.src='https://www.youtube.com/embed/'+new URL(href).searchParams.get('v')+'?playsinline=1&rel=0';frame.allow='autoplay; encrypted-media; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';dialog.querySelector('h2').textContent=book.title;dialog.querySelector('.video-body').replaceChildren(frame);if(!dialog.open)dialog.showModal();
}
export function videoAction(book){
 let href;try{href=youtubeLink(book.youtubeUrl);}catch{return null;}if(!href)return null;
 const button=document.createElement('button');button.type='button';button.className='video-action';button.textContent='▶ 영상 바로보기';button.setAttribute('aria-label',book.title+' 영상 바로보기');button.onclick=()=>openVideo(book);return button;
}

const thumbnailCovers=new Map();
export async function videoThumbnailCover(book){
 let url;try{url=youtubeLink(book.youtubeUrl);}catch{return videoCover(book.title);}
 if(!url||typeof Image==='undefined')return videoCover(book.title);
 const id=new URL(url).searchParams.get('v'),key=id+'|'+book.title;
 if(thumbnailCovers.has(key))return thumbnailCovers.get(key);
 const pending=(async()=>{
  for(const quality of ['maxresdefault','hqdefault']){
   try{
    const img=await new Promise((resolve,reject)=>{const image=new Image();image.crossOrigin='anonymous';const timer=setTimeout(()=>reject(Error('Thumbnail timeout')),4000);image.onload=()=>{clearTimeout(timer);image.naturalWidth>120?resolve(image):reject(Error('Missing thumbnail'));};image.onerror=()=>{clearTimeout(timer);reject(Error('Thumbnail unavailable'));};image.src='https://i.ytimg.com/vi/'+id+'/'+quality+'.jpg';});
    const canvas=document.createElement('canvas');canvas.width=420;canvas.height=600;const c=canvas.getContext('2d');c.fillStyle='#244b43';c.fillRect(0,0,420,600);c.strokeStyle='#d9bc7d';c.lineWidth=3;c.strokeRect(12,12,396,576);
    const scale=Math.max(420/img.naturalWidth,600/img.naturalHeight),w=img.naturalWidth*scale,h=img.naturalHeight*scale;c.drawImage(img,(420-w)/2,(600-h)/2,w,h);const shade=c.createLinearGradient(0,460,0,600);shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(1,'rgba(0,0,0,.85)');c.fillStyle=shade;c.fillRect(0,460,420,140);
    c.fillStyle='#fff4da';c.textAlign='center';c.font='bold 24px sans-serif';c.fillText('▶ 영상북',210,535,370);c.font='21px sans-serif';c.fillText(String(book.title||'영상북'),210,571,370);return canvas.toDataURL('image/jpeg',.9);
   }catch{}
  }
  thumbnailCovers.delete(key);return videoCover(book.title);
 })();thumbnailCovers.set(key,pending);return pending;
}
