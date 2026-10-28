/* v5.13 — single-login token receiver for the command center only.
 * Never adds credentials to a URL. Saves the token for stage pages in the same tab.
 */
(()=>{'use strict';
 const HUB_ORIGIN='PASTE_HUB_ORIGIN_HERE'; // e.g. https://tavia08.github.io (NO path)
 const SERVER='PASTE_V511_EXEC_URL_HERE';
 const KEY='HD512_AUTH_SESSION';
 if(!/^https:\/\/[^/]+$/.test(HUB_ORIGIN)||!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(SERVER)){
   console.warn('[HD513] Set HUB_ORIGIN and v5.11 /exec server URL in hd-command-auth-v513.js');return;
 }
 let accepted=false;
 function api(token){return new Promise((resolve,reject)=>{
  const cb='hd513verify_'+Date.now()+'_'+Math.random().toString(36).slice(2);
  const s=document.createElement('script');let done=false;
  const cleanup=()=>{if(done)return;done=true;clearTimeout(timer);delete window[cb];s.remove()};
  const timer=setTimeout(()=>{cleanup();reject(Error('인증 검증 응답 초과'))},12000);
  window[cb]=d=>{cleanup();d?.status==='ok'&&d?.valid?resolve(d):reject(Error(d?.message||'인증 실패'))};
  s.onerror=()=>{cleanup();reject(Error('인증 서버 연결 실패'))};
  s.src=SERVER+'?'+new URLSearchParams({action:'verifyToken',token,callback:cb}).toString();
  document.head.appendChild(s);
 })}
 window.addEventListener('message',async e=>{
  if(accepted||e.source!==window.opener||e.origin!==HUB_ORIGIN||e.data?.type!=='HD_AUTH_HANDOFF_V513')return;
  const d=e.data;
  if(d.serverUrl!==SERVER||!d.token||!Number.isFinite(Date.parse(d.expiresAt))||Date.parse(d.expiresAt)<=Date.now())return;
  try{
   const checked=await api(d.token);
   if(checked.expiresAt!==d.expiresAt)throw Error('인증 만료 시간이 다릅니다.');
   sessionStorage.setItem(KEY,JSON.stringify({token:d.token,expiresAt:Date.parse(d.expiresAt),student:checked.student}));
   accepted=true;
   console.info('[HD513] 통합 로그인 인증 완료. 전투 지휘소에서 스테이지를 선택하세요.');
   document.dispatchEvent(new Event('hd513-auth-ready'));
  }catch(err){console.warn('[HD513]',err)}
 });
 let tries=0;
 const interval=setInterval(()=>{
  if(accepted||++tries>40){clearInterval(interval);return}
  if(window.opener)window.opener.postMessage({type:'HD_AUTH_READY_V513'},HUB_ORIGIN);
 },350);
})();
