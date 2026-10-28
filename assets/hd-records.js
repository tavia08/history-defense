/* History Defense v5.0 local-only record system. No remote submission. */
(()=>{'use strict';
const hdPersonalStage=document.currentScript?.dataset?.stage||'';
const hdPersonalScript=document.currentScript?.src||'';
if(hdPersonalScript){const el=document.createElement('script');el.src=new URL('hd-personal-best-v512.js',hdPersonalScript).href;el.onload=()=>window.HDPersonalBest512?.init(hdPersonalStage);document.head.appendChild(el);}
const STORE='hd_records_local_v5';
const stages={ansi:'안시성 전투',gwiju:'귀주대첩',cheonmun:'천문령 전투',hansan:'한산도 대첩'};
function read(){try{let a=JSON.parse(localStorage.getItem(STORE)||'[]');return Array.isArray(a)?a.filter(x=>x&&stages[x.stage]&&Number.isFinite(x.score)):[]}catch{return []}}
function list(stage){return read().filter(x=>x.stage===stage).sort((a,b)=>b.score-a.score||a.when-b.when).slice(0,50)}
function safe(t){return String(t).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function clamp(n,l,h){n=Number(n);return Number.isFinite(n)?Math.max(l,Math.min(h,n)):0}
function snapshot(stage){try{
let s=stage==='hansan'?state:S;if(!s)return null;
let wave=clamp(s.wave,1,5),base=0, quiz=0, won=false,terminal=false, extra=0;
if(stage==='ansi'){terminal=['won','lost'].includes(s.phase);won=s.phase==='won';base=clamp(s.keep,0,100);quiz=clamp(s.hdQuizTotal??s.quizCorrect,0,15);extra=Object.values(s.gates||{}).reduce((a,g)=>a+clamp(g.hp,0,100),0)/3;}
if(stage==='gwiju'){terminal=s.phase==='result';won=wave===5&&s.castle>0&&s.enemyCastle<=0; if(terminal&&wave<5) terminal=!document.querySelector('#continue')||document.querySelector('#continue').classList.contains('hide');base=clamp(s.castle,0,100);quiz=clamp(s.correct,0,15);extra=clamp(s.enemyCastle,0,100);}
if(stage==='cheonmun'){terminal=s.phase==='result'&&(wave===5||!document.querySelector('#resultDesc')?.textContent?.includes('다음 웨이브'));won=wave===5&&clamp(s.totalRescued,0,100)>0&&clamp(s.protect,0,100)>20; base=clamp(s.protect,0,100);quiz=clamp(s.score,0,15);extra=clamp(s.totalRescued,0,25)*4;}
if(stage==='hansan'){terminal=s.phase==='result';won=wave===5&&s.castle>0&&s.enemyCastle<=0; if(wave<5&&s.castle>0) terminal=false;base=clamp(s.castle,0,100);quiz=clamp(s.correct,0,15);extra=100-clamp(s.enemyCastle,0,100);}
// Approximate local practice scores, not verified or comparable to server scores.
let progress=(won?5:Math.max(0,wave-1))*900;
let score=Math.round(clamp(progress+quiz*110+base*12+extra*7+(won?1200:0),0,10000));
return {stage,score,wave,base:Math.round(base),quiz,won,terminal};
}catch{return null}}
function popup(stage, data){if(document.getElementById('hdRecordPrompt'))return;
let wrap=document.createElement('div');wrap.id='hdRecordPrompt';wrap.innerHTML=`<div class="hd-record-panel" role="dialog" aria-modal="true" aria-label="게임 기록 저장"><h2>🏆 내 전투 기록</h2><p>${safe(stages[stage])} · ${data.won?'최종 승리':'도전 종료'} · ${data.wave}웨이브</p><strong>${data.score.toLocaleString()}점</strong><p class="hd-note">이 점수는 시험용 계산값입니다. 로컬 기록은 즉시 저장되며, 온라인 전송은 별도로 시도합니다. 서버에 저장됐는지는 구글시트에서 확인하세요.</p><form id="hdRecordForm"><label>반 <select name="cls" required>${Array.from({length:15},(_,i)=>`<option value="${i+1}">${i+1}반</option>`).join('')}</select></label><label>이니셜(영문 2~4글자) <input name="initial" pattern="[A-Za-z]{2,4}" minlength="2" maxlength="4" autocomplete="off" placeholder="ABC" required></label><div class="hd-actions"><button type="submit">기록 저장 · 온라인 전송</button><button type="button" id="hdRecordSkip">건너뛰기</button></div></form></div>`;
document.body.append(wrap);document.getElementById('hdRecordSkip').onclick=()=>wrap.remove();document.getElementById('hdRecordForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);let initial=String(fd.get('initial')||'').toUpperCase();let cls=Number(fd.get('cls'));if(!/^[A-Z]{2,4}$/.test(initial)||!(cls>=1&&cls<=15))return;let r=read(), id=stage+'|'+cls+'|'+initial;let past=r.find(x=>x.id===id);if(!past||data.score>past.score){r=r.filter(x=>x.id!==id);r.push({...data,id,initial,cls,when:Date.now()});localStorage.setItem(STORE,JSON.stringify(r.slice(-1000)));}wrap.remove();
const saved=r.find(x=>x.id===id)||past;
if(window.HDOnline?.isConfigured()){
  // POST is no-cors: completion does not prove the Apps Script saved the row.
  window.HDOnline.submit({...data,initial,cls}).then(result=>{
    const status=result?.status;
    if(status==='saved')alert('온라인 저장 확인 완료! 구글시트에 최고 기록이 저장됐습니다.');
    else if(status==='unchanged')alert('서버 확인 완료: 기존 최고 점수가 더 높거나 같아 기록을 유지했습니다.');
    else if(status==='rejected')alert('온라인 등록 거부: '+String(result.reason||'입력값을 확인하세요.'));
    else alert('로컬 기록은 저장됐으나 온라인 저장은 확인되지 않았습니다. 연결 상태를 점검하고 구글시트를 확인하세요.');
  }).catch(()=>alert('로컬 기록은 저장됐지만 온라인 저장 결과를 확인할 수 없습니다.'));
}else alert('이 브라우저에 저장했습니다. 온라인 설정이 없어 공동 랭킹으로 전송하지 않았습니다.');};}
let lastKey='';function monitor(stage){let d=snapshot(stage);if(!d)return;if(!d.terminal){lastKey='';return}let key=[d.wave,d.won,d.score].join('|');if(lastKey===key)return;lastKey=key;try{window.HDPersonalBest512?.recordResult(d)}catch(e){console.warn('[HD512] personal record',e)}popup(stage,d)}
window.HDRecords={read,list,stages,safe};
const stage=document.currentScript?.dataset?.stage;if(stage&&stages[stage])setInterval(()=>monitor(stage),600);
})();