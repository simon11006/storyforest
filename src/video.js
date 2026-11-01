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
export function videoAction(book){
 let href;try{href=youtubeLink(book.youtubeUrl);}catch{return null;}if(!href)return null;
 const link=document.createElement('a');link.href=href;link.target='_blank';link.rel='noopener noreferrer';link.className='video-action';link.textContent='▶ 영상 바로보기';link.setAttribute('aria-label',book.title+' 영상 바로보기 (새 탭)');return link;
}
