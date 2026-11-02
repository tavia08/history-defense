/* History Defense personal best bridge - Common Auth v1 compatibility
 * Game access uses the already-verified History Hub session and never depends on the legacy roster server.
 * A still-valid legacy HD512 token may continue to load/save remote personal bests, but token failure never blocks play.
 */
(()=>{'use strict';
const STAGE_MAP={ansi:['ansiseong','안시성 전투'],gwiju:['gwiju','귀주대첩'],cheonmun:['cheonmunryeong','천문령 전투'],hansan:['hansando','한산도 대첩']};
const LEGACY_TOKEN_KEY='HD512_AUTH_SESSION', COMMON_KEY='HISTORY_HUB_AUTH_V1';
let stage='', legacySession=null, commonSession=null, best={}, requestInFlight=false, statusEl=null;
const configUrl=(document.currentScript&&document.currentScript.src)?new URL('hd-personal-config-v512.js',document.currentScript.src).href:'';
function status(msg){
 if(!statusEl){statusEl=document.createElement('aside');statusEl.id='hd512-personal-indicator';statusEl.setAttribute('role','status');statusEl.style.cssText='position:fixed;bottom:10px;left:10px;z-index:30000;max-width:310px;padding:9px 12px;border-radius:10px;background:#33271c;color:#fff1ce;border:1px solid #b99b64;font:13px/1.5 sans-serif;box-shadow:0 3px 12px #0005;';document.body.appendChild(statusEl)}
 statusEl.textContent=msg;
}
function url(){return String(window.HD_PERSONAL_V512_CONFIG?.serverUrl||'').trim().replace(/\/+$/,'')}
function readJson(key){try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}}
function loadCommon(){const s=readJson(COMMON_KEY);commonSession=(s&&s.verified===true&&s.student?.studentNo&&s.student?.studentName)?s:null;return commonSession}
function loadLegacy(){const s=readJson(LEGACY_TOKEN_KEY);legacySession=(s&&s.token&&Date.now()<Number(s.expiresAt||0))?s:null;if(!legacySession)sessionStorage.removeItem(LEGACY_TOKEN_KEY);return legacySession}
function jsonp(p){return new Promise((resolve,reject)=>{if(!url())return reject(Error('개인 기록 서버 주소가 설정되지 않았습니다.'));const cb='hd512_'+Date.now()+'_'+Math.random().toString(36).slice(2),script=document.createElement('script');let ended=false;const stop=()=>{if(ended)return;ended=true;clearTimeout(timer);try{delete window[cb]}catch{window[cb]=undefined}script.remove()};const timer=setTimeout(()=>{stop();reject(Error('서버 응답 시간 초과'))},12000);window[cb]=d=>{stop();(!d||d.status!=='ok')?reject(Error(d?.message||'서버 오류')):resolve(d)};script.onerror=()=>{stop();reject(Error('서버 연결 실패'))};script.src=url()+'?'+new URLSearchParams({...p,callback:cb}).toString();document.head.appendChild(script)})}
async function load(){
 if(!loadLegacy()){best={};if(loadCommon())status('학습실 로그인 연결 완료 · 개인 최고점은 이 기기 기록을 사용합니다.');else status('직접 접속 · 개인 최고점은 이 기기 기록을 사용합니다.');return best}
 try{const out=await jsonp({action:'loadBest',token:legacySession.token});best={};for(const rec of out.scores||[])if(rec&&rec.stageId)best[rec.stageId]=Number(rec.bestScore)||0;const id=STAGE_MAP[stage]?.[0];if(id)status('학습실 로그인 연결 완료 · 서버 최고점 '+(best[id]||0).toLocaleString()+'점');return best}
 catch(err){console.warn('[HD CommonAuth] legacy personal best load:',err);best={};status('학습실 로그인 연결 완료 · 서버 기록 미연결, 게임은 정상 이용 가능');return best}
}
async function recordResult(d){
 if(!STAGE_MAP[d?.stage]||!d.terminal||!Number.isInteger(Number(d.score)))return;
 if(!loadLegacy())return; // Local record system in hd-records.js still saves the run.
 if(requestInFlight)return;requestInFlight=true;
 try{const m=STAGE_MAP[d.stage];const out=await jsonp({action:'saveBest',token:legacySession.token,stageId:m[0],stageName:m[1],score:d.score,result:d.won?'승리':'패배',playSeconds:0,kills:0});best[m[0]]=Number(out.bestScore)||0;status('학습실 로그인 연결 완료 · 서버 최고점 '+best[m[0]].toLocaleString()+'점')}
 catch(err){console.warn('[HD CommonAuth] legacy personal best save:',err);status('게임 기록은 이 기기에 저장됨 · 개인 서버 기록만 미연결')}
 finally{requestInFlight=false}
}
function init(s){
 stage=s;if(!STAGE_MAP[stage])return;
 const ready=()=>{loadCommon();loadLegacy();load()};
 if(window.HD_PERSONAL_V512_CONFIG)ready();else if(configUrl){const x=document.createElement('script');x.src=configUrl;x.onload=ready;x.onerror=ready;document.head.appendChild(x)}else ready();
}
window.HDPersonalBest512={init,recordResult,load,getBest:()=>best[STAGE_MAP[stage]?.[0]]??null,getStudent:()=>loadCommon()?.student||null,logout(){legacySession=null;sessionStorage.removeItem(LEGACY_TOKEN_KEY);status(loadCommon()?'학습실 로그인 연결 완료 · 개인 서버 기록 미연결':'직접 접속')}};
})();
