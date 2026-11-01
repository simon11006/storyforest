export function showBookSuccess(className,published=true){
 let dialog=document.querySelector('#bookSuccess');
 if(!dialog){
  dialog=document.createElement('dialog');dialog.id='bookSuccess';dialog.className='book-success';dialog.setAttribute('aria-labelledby','bookSuccessTitle');dialog.setAttribute('aria-describedby','bookSuccessMessage');
  const icon=document.createElement('div');icon.className='success-mark';icon.textContent='✓';icon.setAttribute('aria-hidden','true');
  const title=document.createElement('h2');title.id='bookSuccessTitle';const message=document.createElement('p');message.id='bookSuccessMessage';const button=document.createElement('button');button.type='button';button.textContent='확인';button.onclick=()=>dialog.close();dialog.append(icon,title,message,button);document.body.append(dialog);
 }
 dialog.querySelector('h2').textContent=published?'책 등록이 완료되었어요!':'책 제출이 완료되었어요!';
 dialog.querySelector('p').textContent=published?className+' 도서관에 전시되었습니다. 지금 바로 볼 수 있어요.':className+' 선생님의 승인을 기다리고 있어요. 승인 후 도서관에 전시됩니다.';
 if(!dialog.open)dialog.showModal();
}
