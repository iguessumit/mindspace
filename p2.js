/* ===== Mindspace v3 · core ===== */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-3);
const dk=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const sod=t=>{const d=new Date(t);d.setHours(0,0,0,0);return d.getTime()};
const addDays=(t,n)=>{const d=new Date(t);d.setDate(d.getDate()+n);return d.getTime()};
const k2t=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d).getTime()};
const fmtT=t=>new Date(t).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
const fmtD=m=>{m=Math.round(m);if(m<1)return '0m';const h=Math.floor(m/60),r=m%60;return h?(r?h+'h '+r+'m':h+'h'):r+'m'};
const fmtH=m=>(m/60).toFixed(1)+'h';
const fmtDate=(t,o)=>new Date(t).toLocaleDateString('en-US',o||{weekday:'short',day:'numeric',month:'short'});
const hhmm=t=>{const d=new Date(t);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const atTime=(day,v)=>{const [h,m]=v.split(':').map(Number);const d=new Date(day);d.setHours(h,m,0,0);return d.getTime()};
const weekStart=t=>{const d=new Date(sod(t));return addDays(d.getTime(),-((d.getDay()+6)%7))};
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const r1=v=>v==null?'–':(Math.round(v*10)/10).toFixed(1);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const today=()=>sod(Date.now());
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];

const I={
 flame:'<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .5 1.5 1.5 2 2 2 0-3-1-5 1-8z"/></svg>',
 bell:'<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0"/></svg>',
 back:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
 next:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
 chev:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
 close:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
 plus:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
 logo:'<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/></svg>'
};

/* ---------- data ---------- */
const GROUPS=[{id:'Health',c:'#2fd28b'},{id:'Study',c:'#f5b73b'},{id:'College',c:'#e0629f'},{id:'Commute',c:'#5a9bf5'},{id:'Wasted',c:'#c4543f'}];
const gcol=g=>(GROUPS.find(x=>x.id===g)||{c:'#8d9198'}).c;
function defCats(){const m={Health:['Exercise','Sleep','Meal','Skin care','Nap'],Study:['Maths','Physics','Chemistry','General','Lecture','Revision','Test'],College:['College','Practical','Exam'],Commute:['Commute','In train','Walking'],Wasted:['Scrolling','Doing nothing','Using phone']};
 const out=[];for(const g in m)m[g].forEach(n=>out.push({id:g.toLowerCase()+'-'+n.toLowerCase().replace(/\s+/g,'-'),name:n,group:g}));return out}
const KEY='mindspace.v3';
const defaults=()=>({v:3,name:'',ui:{style:'b',theme:'system',sound:false},settings:{focus:25,short:5,long:15,blocks:4,auto:false},
 weights:{tasks:30,study:40,time:30},cats:defCats(),studyTarget:480,exam:null,entries:[],plan:[],running:null,lastCat:null,
 checkins:[],events:[],sleep:[],naps:[],tasks:{},taskLog:[],coinLog:[],fw:{have:0,used:[],lastCheck:null,awarded:[]},
 notes:[],hidden:[],fb:{},companion:null,tab:'home',tk:null,cfg:{},tkCancel:{},tkDays:[],sample:false});
let storageOk=true;
let loadErr=false;
function load(){let r=null;try{r=localStorage.getItem(KEY)}catch(e){storageOk=false;return defaults()}
 if(r){try{const o=JSON.parse(r),d=defaults();loadErr=false;return Object.assign(d,o,{ui:Object.assign(d.ui,o.ui),settings:Object.assign(d.settings,o.settings),weights:Object.assign(d.weights,o.weights),fw:Object.assign(d.fw,o.fw)})}catch(e){loadErr=true;return defaults()}}
 return defaults()}
let S=load(),_st=0;
function flush(){if(loadErr)return false;try{localStorage.setItem(KEY,JSON.stringify(S));storageOk=true;return true}catch(e){storageOk=false;return false}}
let _sig=null;const sigNow=()=>JSON.stringify(S,(k,v)=>k==='tab'?undefined:v);
function save(){if(loadErr)return;clearTimeout(_st);let ch=true;try{const g=sigNow();ch=g!==_sig;_sig=g}catch(e){}
 if(ch&&typeof pill==='function')pill('saving');_st=setTimeout(()=>{const ok=flush();if(ch&&typeof pill==='function')pill(ok?'saved':'error')},120)}
addEventListener('pagehide',flush);document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();else{tick();}});
const cat=id=>S.cats.find(c=>c.id===id);
const catLabel=id=>{const c=cat(id);return c?(c.group===c.name?c.name:c.group+' · '+c.name):'Deleted category'};
const catCol=id=>{const c=cat(id);return c?gcol(c.group):'#8d9198'};

/* ---------- derived: time, score, streak, coins ---------- */
function runSeg(){const r=S.running;if(!r)return null;if(r.mode==='sw')return{start:r.start};if(r.phase==='focus'&&!r.waiting)return{start:r.segStart};return null}
function entriesOn(k,live=true){const a=S.entries.filter(e=>dk(e.start)===k);const s=runSeg();if(live&&s&&dk(s.start)===k)a.push({id:'live',catId:S.running.catId,start:s.start,end:Date.now(),live:true});return a}
const mins=e=>Math.max(0,(e.end-e.start)/6e4);
const grpMin=(k,g,live=true)=>entriesOn(k,live).filter(e=>(cat(e.catId)||{}).group===g).reduce((a,e)=>a+mins(e),0);
const trackedMin=(k,live=true)=>entriesOn(k,live).reduce((a,e)=>a+mins(e),0);
const catMin=(k,id,live=true)=>entriesOn(k,live).filter(e=>e.catId===id).reduce((a,e)=>a+mins(e),0);
function score(k){
 const parts=[],W=S.weights,t=S.tasks[k];
 if(t&&t.planned>0)parts.push({id:'tasks',name:'Tasks',w:W.tasks,r:Math.min(1,t.done/t.planned),line:`${t.done} of ${t.planned} completed`});
 const sm=grpMin(k,'Study');
 if(S.studyTarget>0&&sm>0)parts.push({id:'study',name:'Study',w:W.study,r:Math.min(1,sm/S.studyTarget),line:`${fmtH(sm)} of ${fmtH(S.studyTarget)} goal`});
 const tr=trackedMin(k),wm=grpMin(k,'Wasted');
 if(tr>=5)parts.push({id:'time',name:'Time well spent',w:W.time,r:(tr-wm)/tr,line:`${fmtD(tr)} tracked, ${fmtD(wm)} Wasted`});
 const tw=parts.reduce((a,p)=>a+p.w,0);
 if(!parts.length||tw<=0)return{n:null,parts,tw};
 const n=Math.round(parts.reduce((a,p)=>a+p.w*p.r,0)/tw*100);
 const weak=[...parts].sort((a,b)=>a.r-b.r)[0];
 let head=n>=85?'Excellent day.':n>=70?'Doing well.':n>=50?'Getting there.':'A slow start.';
 if(weak.r<.7)head+={tasks:' Tasks are behind.',study:' Study is behind goal.',time:' Too much time lost.'}[weak.id];
 return{n,parts,tw,head}}
function dayActive(k){const t=S.tasks[k],tm=S.cfg&&S.cfg.streakMode==='time';return (!tm&&((t&&t.done>0)||(S.tkDays||[]).includes(k)))||S.entries.some(e=>dk(e.start)===k)||(S.running&&dk(S.running.start)===k)}
const covered=k=>dayActive(k)||S.fw.used.includes(k);
function streakEnd(ts){let n=0,t=ts;while(covered(dk(t))){n++;t=addDays(t,-1)}return n}
function streak(){const td=today();if(covered(dk(td)))return streakEnd(td);return streakEnd(addDays(td,-1))}
function longestStreak(){const ds=new Set([...S.entries.map(e=>dk(e.start)),...Object.keys(S.tasks).filter(k=>S.tasks[k].done>0),...S.fw.used]);let best=0;[...ds].sort().forEach(k=>{if(!ds.has(dk(addDays(k2t(k),-1)))){let n=0,t=k2t(k);while(ds.has(dk(t))){n++;t=addDays(t,1)}best=Math.max(best,n)}});return Math.max(best,streak())}
function timedStreak(){const has=k=>S.entries.some(e=>e.src==='timer'&&dk(e.start)===k)||(S.running&&dk(S.running.start)===k);let t=today(),n=0;if(!has(dk(t)))t=addDays(t,-1);while(has(dk(t))){n++;t=addDays(t,-1)}return n}
function runFirewood(){
 const td=today();let first=null;
 const ks=[...S.entries.map(e=>dk(e.start)),...Object.keys(S.tasks).filter(k=>S.tasks[k].done>0)].sort();first=ks[0]?k2t(ks[0]):null;
 if(first==null)return;
 let from=S.fw.lastCheck?addDays(k2t(S.fw.lastCheck),1):first;
 for(let t=from;t<td;t=addDays(t,1)){
  const k=dk(t);
  if(!covered(k)&&streakEnd(addDays(t,-1))>0&&S.fw.have>0&&cfgOn('autoWood')){S.fw.have--;S.fw.used.push(k);addNote('imp','Firewood saved your streak on '+fmtDate(t),'fw-'+k)}
  if(new Date(t).getDay()===0){const ws=weekStart(t),wk=dk(ws);if(!S.fw.awarded.includes(wk)){S.fw.awarded.push(wk);let p=0,d=0;for(let i=0;i<7;i++){const x=S.tasks[dk(addDays(ws,i))];if(x){p+=x.planned;d+=x.done}}if(p>0&&d>=p){S.fw.have=Math.min(3,S.fw.have+1);addNote('prog','Perfect week. You earned a firewood.','fwe-'+wk)}}}
 }
 S.fw.lastCheck=dk(addDays(td,-1));save()}
const bal=()=>S.coinLog.reduce((a,c)=>a+c.amt,0);
const earned=()=>S.coinLog.filter(c=>c.amt>0).reduce((a,c)=>a+c.amt,0);
const spent=()=>-S.coinLog.filter(c=>c.amt<0).reduce((a,c)=>a+c.amt,0);
function addCoins(n,label){S.coinLog.push({id:uid(),ts:Date.now(),amt:n,label:label||'Coins'});save();if(n>0){coinFx();chime()}render()}
function spendCoins(n,label){if(bal()<n)return false;S.coinLog.push({id:uid(),ts:Date.now(),amt:-n,label:label||'Purchase'});save();render();return true}

/* ---------- public hooks for the separately built Tasks tab and Store ---------- */
window.Mindspace={
 completeTask(o){const k=dk(Date.now());const t=S.tasks[k]||(S.tasks[k]={planned:0,done:0});t.done++;if(t.planned<t.done)t.planned=t.done;if(o&&o.priority){const pr=t.pri||(t.pri={});const x=pr[o.priority]||(pr[o.priority]=[0,0]);x[0]++;if(x[1]<x[0])x[1]=x[0]}S.taskLog.push({id:(o&&o.id)||uid(),ts:Date.now(),title:(o&&o.title)||'Task'});addCoins(1,'Task completed');checkNotes()},
 undoTask(o){const k=dk(Date.now());const t=S.tasks[k];if(t&&t.done>0)t.done--;const i=S.coinLog.map(c=>c.label).lastIndexOf('Task completed');if(i>=0)S.coinLog.splice(i,1);const j=S.taskLog.length-1;if(j>=0)S.taskLog.splice(j,1);save();render()},
 setTasks(dateKey,planned,done,extra){S.tasks[dateKey]=Object.assign({planned,done},extra||{});save();render()},
 coins:bal,addCoins,spendCoins,
 setCompanion(id){S.companion=id;save();render()},
 registerStore(fn){window.Mindspace._openStore=fn}};
window.addCoins=addCoins;

/* ---------- notifications ---------- */
function addNote(type,title,key){if(key&&S.notes.some(n=>n.key===key))return;const pk={rem:'nr',imp:'ni',prog:'np'}[type];if(pk&&S.cfg&&S.cfg[pk]===0)return;S.notes.unshift({id:uid(),ts:Date.now(),type,title,key,read:false});save()}
function checkNotes(){
 const td=today(),k=dk(td),now=new Date();
 if(now.getHours()>=18&&!S.checkins.some(c=>dk(c.ts)===k))addNote('rem','No wellbeing check-in yet today.','nochk-'+k);
 if(S.studyTarget>0&&grpMin(k,'Study')>=S.studyTarget)addNote('prog','Study goal reached. Excellent focus.','study-'+k);
 const st=streak();[7,14,30,50,100].forEach(n=>{if(st>=n)addNote('prog',n+'-day streak. Keep it up.','streak-'+n)});
 if(S.running&&Date.now()-S.running.start>((S.cfg&&S.cfg.overrun)||6)*36e5)addNote('imp','Your timer ran over 6 hours. Stop it if you forgot.','run-'+S.running.start)}

/* ---------- mood colour helpers ---------- */
const mIdx=v=>v==null?null:v<2.5?0:v<4.5?1:v<6.5?2:v<8.5?3:4;
const mCol=v=>v==null?'var(--dim)':`var(--m${mIdx(v)})`;
const MET=[{k:'mood',n:'Mood',c:'var(--w-mood)',lab:['Low','Down','Okay','Good','Great']},{k:'energy',n:'Energy',c:'var(--w-energy)',lab:['Drained','Low','Steady','Good','Charged']},{k:'focus',n:'Focus',c:'var(--w-focus)',lab:['Scattered','Drifting','Steady','Sharp','Locked in']},{k:'mot',n:'Motivation',c:'var(--w-mot)',lab:['None','Weak','Okay','Driven','Fired up']}];
const lvl=v=>v<=2?0:v<=4?1:v<=6?2:v<=8?3:4;
const winOf=h=>h>=5&&h<12?'Morning':h>=12&&h<17?'Afternoon':h>=17&&h<21?'Evening':'Night';

/* ---------- router / render ---------- */
const R={sel:today(),page:null,stack:[],sheet:null,ttab:'track',wtab:'today',wdate:today(),wmonth:today(),wrep:'weekly',rdate:today(),rtab:'activity',rrange:'week',rmonth:today(),tlf:'All',selCat:null,wk:weekStart(today()),wAnim:'',hmode:'time',hdate:today(),sleepEdit:null,custom:null,hist:today(),ci:null};
const TABS={},PAGES={},SHEETS={},A={};
function go(name,p){R.stack.push(R.page);R.page=Object.assign({name},p||{});R.sheet=null;render(true)}
function back(){R.page=R.stack.pop()||null;R.sheet=null;render(true)}
function setTab(t){S.tab=t;R.page=null;R.stack=[];R.sheet=null;save();render(true)}
function render(top){
 const P=R.page;let hdr='',body,nav=false;
 if(P){body=PAGES[P.name](P)}else{hdr=header();body=TABS[S.tab]();nav=true}
 $('#hdr').innerHTML=hdr;
 const pg=$('#pg');const sc=$('#scroll');const y=sc.scrollTop;
 pg.innerHTML=(typeof sysBanner==='function'?sysBanner():'')+body;sc.classList.toggle('withnav',nav);
 if(top){sc.scrollTop=0;pg.style.animation='none';void pg.offsetWidth;pg.style.animation=''}else sc.scrollTop=y;
 $('#nav').innerHTML=nav?navHtml():'';
 renderSheet();tick(true);if(typeof slLive==='function')slLive();if(typeof syncFrames==='function')syncFrames()}
function renderSheet(){const s=R.sheet;$('#sheet').innerHTML=s?`<div class="sbg" data-a="bg"><div class="sheet" role="dialog"><div class="grab"></div>${SHEETS[s.t](s)}</div></div>`:''}
function openSheet(t,p){R.sheet=Object.assign({t},p||{});renderSheet()}
function closeSheet(){R.sheet=null;renderSheet()}
function toast(m,fn){const t=$('#toast');toast._u=fn||null;t.innerHTML=fn?`<span>${esc(m)}</span><button data-a="toastUndo" style="margin-left:14px;font-weight:700;color:var(--info)">Undo</button>`:esc(m);t.classList.toggle('act',!!fn);t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('on'),fn?4500:2200)}
function navHtml(){const T=[['home','Home'],['tasks','Tasks'],['time','Time'],['wellbeing','Wellbeing'],['reports','Reports']];return `<nav class="nav" aria-label="Main">${T.map(([k,n])=>`<button data-a="tab" data-v="${k}" class="${S.tab===k?'on':''}" ${S.tab===k?'aria-current="page"':''}>${n}</button>`).join('')}</nav>`}
function chipsHtml(){const un=S.notes.some(n=>!n.read);return `<div class="chips"><button class="cb fl" data-a="go" data-p="streak" aria-label="Streak">${I.flame}<b>${streak()}</b></button><button class="cb" data-a="sheet" data-s="coin" aria-label="Coins"><i class="coin"></i></button><button class="cb" data-a="go" data-p="notes" aria-label="Notifications">${I.bell}${un?'<u class="dot"></u>':''}</button></div>`}
function shiftDays(n){if(!n)return;R.wk=addDays(R.wk,n);R.wAnim=n>0?'r':'l';render();R.wAnim=''}
function header(){
 if(S.tab==='home'){
  const td=today(),ws=R.wk,D=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const days=[0,1,2,3,4,5,6].map(i=>{const t=addDays(ws,i),k=dk(t),n=D[new Date(t).getDay()];return `<button class="wd ${t===R.sel?'wsel':''} ${t===td?'now':''}" data-a="selday" data-v="${t}" aria-label="${fmtDate(t)}"><span>${n.slice(0,2)}</span><i>${new Date(t).getDate()}</i><u class="${dayActive(k)?'':'off'}"></u></button>`}).join('');
  return `<header class="hdr home pad"><div class="hrow"><button class="brand" data-a="go" data-p="profile" aria-label="Profile"><span class="logo">${I.logo}</span><span><b>mindspace</b><small>Your personal control center</small></span></button>${chipsHtml()}</div><div class="week ${R.wAnim?'wa-'+R.wAnim:''}">${days}</div></header>`}
 const T={tasks:'Tasks',time:'Time',wellbeing:'Wellbeing',reports:'Reports'}[S.tab];
 return `<header class="hdr pad"><div class="hrow"><h1 class="title">${T}</h1>${chipsHtml()}</div></header>`}
const pageHdr=(t,right)=>`<div class="phdr"><button class="back" data-a="back" aria-label="Back">${I.back}</button><h1 class="title">${esc(t)}</h1>${right||''}</div>`;

/* ---------- generic click handling ---------- */
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-a]');if(!el)return;
 const a=el.dataset.a;
 if(a==='bg'){if(e.target===el)closeSheet();return}
 if(A[a])A[a](el,e)});
const pv=s=>{const e=$(s);return e?e.dataset.val:undefined};
const mv=s=>$$(s+' .on').map(e=>e.dataset.v);
Object.assign(A,{
 tab:el=>setTab(el.dataset.v),
 go:el=>go(el.dataset.p,el.dataset.q?JSON.parse(el.dataset.q):undefined),
 back:()=>back(),
 sheet:el=>openSheet(el.dataset.s,el.dataset.q?JSON.parse(el.dataset.q):undefined),
 close:()=>closeSheet(),
 selday:el=>{R.sel=+el.dataset.v;render()},
 today:()=>{R.sel=today();R.wk=weekStart(R.sel);render()},
 pick:el=>{const g=el.closest('[data-pick]');$$('.on',g).forEach(x=>x.classList.remove('on'));el.classList.add('on');g.dataset.val=el.dataset.v;if(g.dataset.cb&&A[g.dataset.cb])A[g.dataset.cb](el,g)},
 multi:el=>{el.classList.toggle('on');if(el.dataset.f)$$('[data-f="'+CSS.escape(el.dataset.f)+'"]').forEach(x=>x.classList.toggle('on',el.classList.contains('on')))},
 step:el=>{const g=el.closest('[data-step]');const mn=+g.dataset.min,mx=+g.dataset.max,st=+g.dataset.st||1;let v=(g.dataset.val===''?(+g.dataset.def||0):+g.dataset.val)+st*(+el.dataset.d);v=clamp(v,mn,mx);g.dataset.val=v;$('b',g).textContent=(g.dataset.fmt==='min'?fmtD(v):g.dataset.fmt==='pts'?v+' pts':v);if(g.dataset.cb&&A[g.dataset.cb])A[g.dataset.cb](el,g)},
 tog:el=>{el.classList.toggle('on');el.dataset.val=el.classList.contains('on')?'1':'';el.setAttribute('aria-checked',el.classList.contains('on'));if(el.dataset.cb&&A[el.dataset.cb])A[el.dataset.cb](el)}
});
const stepper=(id,val,mn,mx,st,fmt,cb,def)=>`<div class="stepper" id="${id}" data-step data-val="${val==null?'':val}" data-min="${mn}" data-max="${mx}" data-st="${st}" data-fmt="${fmt||''}" data-def="${def??mn}" ${cb?`data-cb="${cb}"`:''}><button data-a="step" data-d="-1" aria-label="Decrease">−</button><b>${val==null?'–':fmt==='min'?fmtD(val):fmt==='pts'?val+' pts':val}</b><button data-a="step" data-d="1" aria-label="Increase">+</button></div>`;
const toggle=(id,on,cb,label)=>`<button class="tog ${on?'on':''}" id="${id}" role="switch" aria-checked="${!!on}" aria-label="${esc(label||'Toggle')}" data-a="tog" data-val="${on?'1':''}" ${cb?`data-cb="${cb}"`:''}></button>`;

/* ---------- audio + coin fx ---------- */
let _ac=null;
function chime(){if(!S.ui.sound)return;try{_ac=_ac||new (window.AudioContext||window.webkitAudioContext)();const t=_ac.currentTime;[880,1318].forEach((f,i)=>{const o=_ac.createOscillator(),g=_ac.createGain();o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t+i*.09);g.gain.linearRampToValueAtTime(.12,t+i*.09+.02);g.gain.exponentialRampToValueAtTime(.001,t+i*.09+.5);o.connect(g).connect(_ac.destination);o.start(t+i*.09);o.stop(t+i*.09+.55)})}catch(e){}}
function coinFx(){
 const fx=$('#fx');if(!fx)return;const chip=$$('.cb')[1];const ph=$('.phone').getBoundingClientRect();
 if(chip){chip.classList.remove('pulse');void chip.offsetWidth;chip.classList.add('pulse')}
 if(matchMedia('(prefers-reduced-motion:reduce)').matches||!fx.animate)return;
 const c=document.createElement('div');c.className='cf';c.textContent='M';fx.appendChild(c);
 let dx=0,dy=0;if(chip){const r=chip.getBoundingClientRect();dx=r.left+r.width/2-(ph.left+ph.width/2);dy=r.top+r.height/2-(ph.top+ph.height*.44)}
 for(let i=0;i<10;i++){const p=document.createElement('div');p.className='cp';fx.appendChild(p);const a=i/10*Math.PI*2,d=70+Math.random()*40;p.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) scale(.2)`,opacity:0}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'}).onfinish=()=>p.remove()}
 const an=c.animate([{transform:'scale(.2) rotateY(0)',opacity:0},{transform:'scale(1.15) rotateY(360deg)',opacity:1,offset:.38},{transform:'scale(1) rotateY(540deg)',opacity:1,offset:.62},{transform:`translate(${dx}px,${dy}px) scale(.18) rotateY(720deg)`,opacity:.9}],{duration:1150,easing:'cubic-bezier(.4,0,.2,1)'});
 an.onfinish=()=>c.remove()}

/* ---------- timer engine ---------- */
function startRun(catId,mode){const now=Date.now();S.lastCat=catId;
 S.running=mode==='pomo'?{catId,mode:'pomo',start:now,phase:'focus',phaseStart:now,dur:S.settings.focus*6e4,block:1,segStart:now,waiting:false}:{catId,mode:'sw',start:now};save();render()}
function saveSeg(r,start,end){if(end-start<((S.cfg&&S.cfg.minSess)?S.cfg.minSess*60000:30000))return null;const e={id:uid(),catId:r.catId,start,end,src:'timer'};S.entries.push(e);save();return e}
function askFocus(e){if(e&&cfgOn('rateFocus')&&(cat(e.catId)||{}).group==='Study'&&mins(e)>=5)openSheet('focus',{id:e.id})}
function stopRun(){const r=S.running;if(!r)return;let e=null;
 if(r.mode==='sw')e=saveSeg(r,r.start,Date.now());else if(r.phase==='focus'&&!r.waiting)e=saveSeg(r,r.segStart,Date.now());
 S.running=null;save();render();checkNotes();if(e){toast('Saved '+fmtD(mins(e))+' · '+catLabel(e.catId));askFocus(e)}}
function phaseEnd(){const r=S.running;if(!r||r.mode!=='pomo'||r.waiting)return;const end=r.phaseStart+r.dur;let e=null;
 if(r.phase==='focus'){e=saveSeg(r,r.segStart,end);const long=r.block%S.settings.blocks===0;r.next=long?'long':'short'}else r.next='focus';
 r.waiting=true;r.endedAt=end;save();chime();render();
 if(S.settings.auto)nextPhase();else{toast(r.phase==='focus'?'Focus block done':'Break over');if(e)askFocus(e)}}
function nextPhase(){const r=S.running;if(!r||!r.waiting)return;const now=Date.now(),nx=r.next;
 if(nx==='focus'){r.block=r.phase==='long'?1:r.block+1;r.phase='focus';r.dur=S.settings.focus*6e4;r.segStart=now}
 else{r.phase=nx;r.dur=(nx==='long'?S.settings.long:S.settings.short)*6e4}
 r.phaseStart=now;r.waiting=false;save();render()}
function runText(){const r=S.running;if(!r)return '00:00:00';const now=Date.now();
 if(r.mode==='sw'){const s=Math.floor((now-r.start)/1e3),h=Math.floor(s/3600),m=Math.floor(s%3600/60);return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
 const left=r.waiting?0:Math.max(0,Math.ceil((r.phaseStart+r.dur-now)/1e3));return String(Math.floor(left/60)).padStart(2,'0')+':'+String(left%60).padStart(2,'0')}
function tick(force){
 const r=S.running;
 if(r&&r.mode==='pomo'&&!r.waiting&&Date.now()>=r.phaseStart+r.dur){phaseEnd();return}
 $$('[data-t="run"]').forEach(e=>{e.textContent=runText()});
 $$('[data-t="runbar"]').forEach(e=>{if(r&&r.mode==='pomo'&&!r.waiting)e.style.width=(100*(Date.now()-r.phaseStart)/r.dur).toFixed(1)+'%'});
 if(!force&&S.tab==='home'&&!R.page&&r&&Math.floor(Date.now()/1e3)%30===0&&R.sel===today()){/* keep home score live */const sc=$('[data-t="score"]');if(sc)sc.innerHTML=scoreCard(R.sel)}}
