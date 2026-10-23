/* Shared leaderboard optional connector v5.1. This is NOT tamper-proof. */
(()=>{'use strict';
const endpoint=()=>String(window.HD_ONLINE_ENDPOINT||'').trim();
function isConfigured(){return /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:\?.*)?$/.test(endpoint())}
function playerId(){const k='hd_player_device_v51';let s=localStorage.getItem(k);if(!/^[0-9a-f]{32}$/.test(s||'')){const v=new Uint8Array(16);crypto.getRandomValues(v);s=Array.from(v,x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem(k,s)}return s}
function receiptId(){const v=new Uint8Array(16);crypto.getRandomValues(v);return Array.from(v,x=>x.toString(16).padStart(2,'0')).join('')}
async function submit(d){if(!isConfigured())return {ok:false,status:'not_configured'};
const requestId=receiptId();
const payload={action:'submit',version:'5.2',requestId,playerId:playerId(),stage:d.stage,initial:d.initial,cls:d.cls,score:d.score,wave:d.wave,quiz:d.quiz,base:d.base,won:d.won};
try{await fetch(endpoint(),{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload),redirect:'follow'})}
catch{return {ok:false,status:'network_error'}}
// The browser cannot read a no-cors POST response. Verify the result through a separate read-only receipt lookup.
for(let attempt=0;attempt<5;attempt++){
 await new Promise(resolve=>setTimeout(resolve,650+attempt*550));
 try{const result=await jsonp({action:'receipt',id:requestId});if(result.status&&result.status!=='pending')return result}catch(_){/* retry */}
}
return {ok:false,status:'unconfirmed'};
}
function jsonp(params){return new Promise((resolve,reject)=>{
 const cb='__hdLb'+Math.random().toString(36).slice(2);const tag=document.createElement('script');let done=false;
 function finish(err,data){if(done)return;done=true;clearTimeout(timer);delete window[cb];tag.remove();err?reject(err):resolve(data)}
 window[cb]=d=>finish(null,d);tag.onerror=()=>finish(new Error('network'));
 const timer=setTimeout(()=>finish(new Error('timeout')),7000);
 const qs=new URLSearchParams({...params,callback:cb,t:String(Date.now())});
 tag.src=endpoint()+(endpoint().includes('?')?'&':'?')+qs.toString();document.head.append(tag);
})}
// A JSONP response from the teacher's own Apps Script, for read-only public ranks.
function top(stage){return new Promise((resolve,reject)=>{if(!isConfigured())return reject(new Error('not configured'));if(!/^(ansi|gwiju|cheonmun|hansan)$/.test(stage))return reject(new Error('bad stage'));
const cb='__hdLb'+Math.random().toString(36).slice(2);const tag=document.createElement('script');let finished=false;
function end(err,data){if(finished)return;finished=true;clearTimeout(timer);delete window[cb];tag.remove();err?reject(err):resolve(data)}
window[cb]=d=>end(null,d);tag.onerror=()=>end(new Error('network'));
const timer=setTimeout(()=>end(new Error('timeout')),9000);
tag.src=endpoint()+'?action=top&stage='+encodeURIComponent(stage)+'&callback='+cb+'&t='+Date.now();document.head.append(tag)
})}
window.HDOnline={isConfigured,submit,top};
})();
