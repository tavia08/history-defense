/* History Defense command-center auth bridge - Common Auth v1
 * Trusts the student session already verified by history-hub.
 * No second roster lookup, no popup/opener dependency, no credentials in the URL.
 */
(()=>{'use strict';
 const COMMON_KEY='HISTORY_HUB_AUTH_V1';
 const DEFENSE_KEY='HD_COMMON_AUTH_V1';

 function read(key){try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}}
 function valid(s){return !!(s&&s.verified===true&&s.student&&String(s.student.studentNo||'').trim()&&String(s.student.studentName||'').trim())}
 function accept(){
   const common=read(COMMON_KEY)||read(DEFENSE_KEY);
   if(!valid(common)){
     console.info('[HD CommonAuth] 직접 접속 상태입니다. 역사 학습실에서 로그인하면 학생 정보가 연결됩니다.');
     return false;
   }
   sessionStorage.setItem(DEFENSE_KEY,JSON.stringify(common));
   window.HDCommonAuthV1={session:()=>common,student:common.student};
   document.dispatchEvent(new CustomEvent('hd-common-auth-ready',{detail:{student:common.student}}));
   // Compatibility event used by older UI hooks.
   document.dispatchEvent(new Event('hd513-auth-ready'));
   console.info('[HD CommonAuth] 학습실 로그인 연결 완료:',common.student.studentNo,common.student.studentName);
   return true;
 }
 if(!accept()){
   window.HDCommonAuthV1={session:()=>read(COMMON_KEY)||read(DEFENSE_KEY),student:null};
 }
})();
