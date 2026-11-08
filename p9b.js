
/* ===== embedded screens: Tasks, Settings, Lock ===== */
const TKD=()=>({tasks:[],customLists:[],names:{all:'My tasks',study:'Study'},studyHidden:false,tasksDone:0,earned:{},nextId:100});
const themeNow=()=>S.ui.theme==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):S.ui.theme;
const jsInj=o=>JSON.stringify(o).replace(/</g,'\\u003c');
const frameHtml=(src,pre)=>src.replace('<head>','<head><script>'+pre+'<\/script>');
let tkf=null,setf=null,lockf=null,tkSheet=false,tkWasOn=false,hiddenAt=0;
const unreadN=()=>S.notes.some(n=>!n.read);
function frameEl(id,title,html,css){const f=document.createElement('iframe');f.id=id;f.title=title;f.srcdoc=html;f.style.cssText='border:0;width:100%;background:var(--bg);'+css;return f}
function ensureTk(){if(!S.tk){S.tk=TKD();S.tasks={};S.taskLog=[];S.tkDays=[];S.tkCancel={}}if(!S.tkCancel)S.tkCancel={};if(!S.tkDays)S.tkDays=[]}
function mountTk(){if(tkf)return;ensureTk();
 const pre='window.__INIT='+jsInj(Object.assign({},S.tk,{coins:bal(),streak:streak(),theme:themeNow(),unread:unreadN()}))+';document.documentElement.dataset.t='+JSON.stringify(themeNow())+';';
 tkf=frameEl('tkf','Tasks',frameHtml(EMB.tasks,pre),'flex:1;min-height:0;display:none');$('.phone').insertBefore(tkf,$('#nav'))}
function resetTkFrame(){if(tkf){tkf.remove();tkf=null}tkSheet=false}
function postTk(m){if(tkf&&tkf.contentWindow){m.ms=1;tkf.contentWindow.postMessage(m,'*')}}
function pushSync(){postTk({type:'sync',coins:bal(),streak:streak(),unread:unreadN(),theme:themeNow()})}
function cfgInit(){const c=S.cfg||{};return Object.assign({},c,{name:S.name,theme:themeNow(),sound:S.ui.sound?1:0,focus:S.settings.focus,short:S.settings.short,long:S.settings.long,blocks:S.settings.blocks,auto:S.settings.auto?1:0,goal:S.studyTarget/60,subjects:studyCats().map(x=>x.name).slice(0,8),examDate:S.exam?S.exam.date:'',goalName:S.exam?S.exam.name:(c.goalName||'')})}
function mountSet(){const ph=$('.phdr');const top=ph?ph.getBoundingClientRect().bottom-$('.phone').getBoundingClientRect().top:60;
 setf=frameEl('setf','Settings',frameHtml(EMB.settings,'window.__CFG='+jsInj(cfgInit())+';'),'position:absolute;left:0;right:0;top:'+top+'px;height:calc(100% - '+top+'px);z-index:15');$('.phone').appendChild(setf)}
function lockNow(){if(lockf||!(S.cfg&&S.cfg.pinHash))return;
 lockf=frameEl('lockf','Locked',frameHtml(EMB.settings,'window.__LOCK=1;window.__CFG='+jsInj(cfgInit())+';'),'position:absolute;inset:0;height:100%;z-index:95');$('.phone').appendChild(lockf)}
function syncFrames(){
 mountTk();
 const P=R.page,on=S.tab==='tasks'&&!P;
 $('#hdr').style.display=on?'none':'';$('#scroll').style.display=on?'none':'';tkf.style.display=on?'block':'none';
 if(!on)tkSheet=false;$('#nav').style.display=(on&&tkSheet)?'none':'';
 if(on&&!tkWasOn)pushSync();tkWasOn=on;
 const ss=P&&P.name==='settings';
 if(ss&&!setf)mountSet();if(!ss&&setf){setf.remove();setf=null}}
addEventListener('message',e=>{const d=e.data;if(!d||d.ms!==1)return;const s=e.source;
 if(tkf&&s===tkf.contentWindow)tkMsg(d);else if(setf&&s===setf.contentWindow)setMsg(d);else if(lockf&&s===lockf.contentWindow){if(d.type==='unlock'){lockf.remove();lockf=null}}});

function deriveTasks(st){const T={},days=new Set(),cx=st.tkCancel||{},td=dk(Date.now()),mk=()=>({planned:0,done:0,pri:{},st:{Completed:0,Partial:0,Cancelled:0,Delayed:0}});
 ((st.tk&&st.tk.tasks)||[]).forEach(t=>{const k=t.date||td,x=T[k]||(T[k]=mk());x.planned++;const pn=['Low','Medium','High'][(t.pri||2)-1],pr=x.pri[pn]||(x.pri[pn]=[0,0]);pr[1]++;
  if(t.done){x.done++;pr[0]++;x.st.Completed++;if(t.doneAt)days.add(dk(t.doneAt))}else if(k<td)x.st.Delayed++});
 Object.keys(cx).forEach(k=>{if(cx[k]>0){const x=T[k]||(T[k]=mk());x.st.Cancelled=cx[k]}});
 st.tasks=T;st.tkDays=[...days];st.taskLog=((st.tk&&st.tk.tasks)||[]).filter(t=>t.done&&t.doneAt).map(t=>({id:t.id,ts:t.doneAt,title:t.title}))}
function tkMsg(d){
 if(d.type==='state'){ensureTk();S.tk=d.state;deriveTasks(S);save();postTk({type:'sync',streak:streak()})}
 else if(d.type==='coin'){
  if(d.src==='undo'){const i=S.coinLog.map(c=>c.label).lastIndexOf('Task completed');if(i>=0)S.coinLog.splice(i,1)}
  else if(d.src==='gem'){const l=S.coinLog[S.coinLog.length-1];if(l&&l.label==='Gem reward'&&Date.now()-l.ts<8000){l.amt+=d.d;l.ts=Date.now()}else S.coinLog.push({id:uid(),ts:Date.now(),amt:d.d,label:'Gem reward'})}
  else S.coinLog.push({id:uid(),ts:Date.now(),amt:d.d,label:'Task completed'});
  save();checkNotes();postTk({type:'sync',streak:streak(),unread:unreadN()})}
 else if(d.type==='deleted'||d.type==='undeleted'){ensureTk();const u=d.type==='deleted'?1:-1;(d.dates||[]).forEach(k=>{S.tkCancel[k]=Math.max(0,(S.tkCancel[k]||0)+u)});deriveTasks(S);save()}
 else if(d.type==='go'){go(d.p)}
 else if(d.type==='sheet'){tkSheet=!!d.open;$('#nav').style.display=(tkSheet&&S.tab==='tasks'&&!R.page)?'none':''}}

function syncSubjects(list){if(!Array.isArray(list))return;const cur=studyCats();
 list.forEach(n=>{if(!cur.some(c=>c.name.toLowerCase()===n.toLowerCase()))S.cats.push({id:'study-'+n.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+uid().slice(0,3),name:n,group:'Study'})});
 cur.forEach(c=>{if(cur.length>1&&!list.some(n=>n.toLowerCase()===c.name.toLowerCase())&&!S.entries.some(e=>e.catId===c.id)&&!S.plan.some(b=>b.catId===c.id)&&!(S.running&&S.running.catId===c.id))S.cats=S.cats.filter(x=>x.id!==c.id)})}
function applyCfg(c){S.cfg=c;S.name=c.name||'';S.ui.sound=!!c.sound;
 S.settings.focus=c.focus;S.settings.short=c.short;S.settings.long=c.long;S.settings.blocks=c.blocks;S.settings.auto=!!c.auto;
 S.studyTarget=Math.round(c.goal*60);
 if(c.examDate)S.exam={name:c.goalName||'Exam',date:c.examDate};else S.exam=null;
 syncSubjects(c.subjects);
 if(c.theme&&c.theme!==themeNow()){S.ui.theme=c.theme;applyUI();postTk({type:'theme',theme:c.theme})}
 save()}
const cfgOn=k=>!(S.cfg&&S.cfg[k]===0);
function resetData(){const keep={ui:S.ui,settings:S.settings,cfg:S.cfg,name:S.name};S=Object.assign(defaults(),keep);resetTkFrame();applyUI();R.sel=today();R.wk=weekStart(R.sel);R.stack=[];R.page=null;R.sheet=null;save();render(true)}
function setMsg(d){
 if(d.type==='cfg')applyCfg(d.cfg);
 else if(d.type==='sample'){loadSample()}
 else if(d.type==='unsample'){if(S.sample){resetData();toast('Sample data removed')}else toast('No sample data loaded')}
 else if(d.type==='wipeAll'){try{localStorage.removeItem(KEY)}catch(e){}S=defaults();resetTkFrame();applyUI();R.stack=[];R.page=null;R.sheet=null;R.sel=today();R.wk=weekStart(R.sel);render(true);toast('All data deleted')}
 else if(d.type==='wipeWell'){S.checkins=[];S.events=[];S.sleep=[];S.naps=[];save();render()}
 else if(d.type==='export')doExport(d.o)}
function doExport(o){
 const td=today(),from=o.range==='all'?0:o.range==='custom'?(o.from?k2t(o.from):0):addDays(td,-(+o.range)),to=o.range==='custom'&&o.to?addDays(k2t(o.to),1):Infinity,inR=ts=>ts>=from&&ts<to,T=o.types||[];
 const rows=[],iso=ts=>new Date(ts).toISOString();
 if(T.includes('time'))S.entries.filter(e=>inR(e.start)).forEach(e=>rows.push({type:'time',start:iso(e.start),end:iso(e.end),title:catLabel(e.catId),detail:e.src||''}));
 if(T.includes('study'))S.entries.filter(e=>inR(e.start)&&(cat(e.catId)||{}).group==='Study').forEach(e=>rows.push({type:'study',start:iso(e.start),end:iso(e.end),title:catLabel(e.catId),detail:e.focus!=null?'focus '+e.focus:''}));
 if(T.includes('tasks'))((S.tk&&S.tk.tasks)||[]).filter(t=>inR(k2t(t.date||dk(td)))).forEach(t=>rows.push({type:'task',start:t.date||'',end:t.doneAt?iso(t.doneAt):'',title:t.title,detail:(t.done?'done':'pending')+', '+['Low','Medium','High'][(t.pri||2)-1]+', '+(t.list||'')}));
 if(T.includes('wellbeing')){S.checkins.filter(c=>inR(c.ts)).forEach(c=>rows.push({type:'check-in',start:iso(c.ts),end:'',title:MET.map(m=>c[m.k]!=null?m.n+' '+c[m.k]:'').filter(Boolean).join(', '),detail:(c.feelings||[]).join(', ')+(o.notes&&c.note?' | '+c.note:'')}));S.events.filter(x=>inR(x.ts)).forEach(x=>rows.push({type:'event',start:iso(x.ts),end:'',title:(x.feelings||[]).join(', '),detail:o.notes&&x.note?x.note:''}))}
 if(T.includes('sleep')){S.sleep.filter(s=>inR(s.bed||k2t(s.date))).forEach(s=>rows.push({type:'sleep',start:iso(s.bed),end:iso(s.wake),title:'Quality '+s.q+', rested '+s.rest,detail:s.approx?'approximate':''}));S.naps.filter(n=>inR(n.start)).forEach(n=>rows.push({type:'nap',start:iso(n.start),end:iso(n.end),title:'Nap',detail:''}))}
 let body,mime,ext;
 if(o.fmt==='json'){body=JSON.stringify({exported:new Date().toISOString(),rows},null,2);mime='application/json';ext='json'}
 else{const q=v=>'"'+String(v).replace(/"/g,'""')+'"';body='type,start,end,title,detail\n'+rows.map(r=>[r.type,r.start,r.end,r.title,r.detail].map(q).join(',')).join('\n');mime='text/csv';ext='csv'}
 try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([body],{type:mime}));a.download='mindspace-export.'+ext;document.body.appendChild(a);a.click();a.remove();toast((o.fmt==='pdf'?'PDF is not available, exported CSV: ':'Exported ')+rows.length+' records')}
 catch(e){try{navigator.clipboard.writeText(body);toast('Download blocked, copied to clipboard')}catch(_){toast('Export was blocked here')}}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)hiddenAt=Date.now();else if(S.cfg&&S.cfg.pinHash&&hiddenAt&&Date.now()-hiddenAt>=(+S.cfg.lockAfter||0)*60000)lockNow()});
A.gems=()=>{closeSheet();setTab('tasks');setTimeout(()=>postTk({type:'openRewards'}),120)};
TABS.tasks=()=>'';

/* ===== Notifications (your design) ===== */
const NIC={alert:'<path d="M12 6v8M12 18h.01"/>',task:'<path d="M5 12l4 4 10-10"/>',goal:'<circle cx="12" cy="12" r="8"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',timer:'<circle cx="12" cy="13" r="7"/><path d="M12 9v4l2 2M9 3h6"/>',star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'};
const NCOL={alert:'#fbbf24',task:'#60a5fa',goal:'#34d399',timer:'#fb923c',star:'#34d399'};
const nIcon=n=>{const k=n.key||'';return k.startsWith('nochk')?'alert':k.startsWith('run')?'timer':k.startsWith('streak')||k.startsWith('fw')?'star':n.type==='prog'?'goal':n.type==='imp'?'timer':'task'};
const NLAB={rem:'Reminder',imp:'Important',prog:'Progress'};
PAGES.notes=()=>{const f=R.nf||'All',td=today(),un=S.notes.filter(n=>!n.read).length;
 const vis=S.notes.filter(n=>f==='All'||n.type===f);
 const item=n=>{const ic=nIcon(n),tm=n.ts>=td?fmtT(n.ts):new Date(n.ts).toLocaleDateString('en-US',{weekday:'short'});
  return `<div class="nitem ${n.read?'':'unread'}"><button class="nmain" data-a="nread" data-v="${n.id}"><span class="nic" style="background:${NCOL[ic]}"><svg width="20" height="20" viewBox="0 0 24 24" fill="${ic==='star'?'currentColor':'none'}" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NIC[ic]}</svg></span><span style="flex:1;min-width:0"><span class="nt">${esc(n.title)}</span><span class="nm">${tm} · ${NLAB[n.type]||'Reminder'}</span>${n.key&&n.key.startsWith('nochk')?'<span class="ncta">Check in</span>':''}</span></button>${n.read?'':'<i class="ndot" aria-label="Unread"></i>'}<button class="nx" data-a="ndel" data-v="${n.id}" aria-label="Dismiss"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>`};
 const grp=(t,rows)=>rows.length?`<div class="card ncard"><div class="eyebrow">${t}</div>${rows.map(item).join('')}</div>`:'';
 const body=vis.length?grp('Today',vis.filter(n=>n.ts>=td))+grp('Earlier',vis.filter(n=>n.ts<td)):`<div class="card empty"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0"/></svg><b>You’re all caught up</b>Nothing here right now.</div>`;
 const cs=[['All','All'],['rem','Reminders'],['imp','Important'],['prog','Progress']];
 return pageHdr('Notifications',un?`<span class="nbadge">${un} new</span>`:'')+`<div class="chips-w nchips">${cs.map(([k,n])=>`<button class="chip ${f===k?'on':''}" data-a="nf" data-v="${k}">${n}<small style="opacity:.7;margin-left:6px">${S.notes.filter(x=>k==='All'||x.type===k).length}</small></button>`).join('')}</div>`+body+
 `<div class="btns eq"><button class="btn sec" data-a="clearNotes" ${S.notes.length?'':'disabled'}>Clear all</button><button class="btn" data-a="readNotes" ${un?'':'disabled'}>Mark all read</button></div>`};
A.nf=el=>{R.nf=el.dataset.v;render()};
A.nread=el=>{const n=S.notes.find(x=>x.id===el.dataset.v);if(!n)return;n.read=true;save();if(n.key&&n.key.startsWith('nochk'))go('checkin');else render()};
A.ndel=el=>{const prev=S.notes.slice();S.notes=S.notes.filter(x=>x.id!==el.dataset.v);save();render();toast('Notification dismissed',()=>{S.notes=prev;save();render()})};
A.readNotes=()=>{const prev=JSON.stringify(S.notes);S.notes.forEach(n=>n.read=true);save();render();toast('All marked as read',()=>{S.notes=JSON.parse(prev);save();render()})};
A.clearNotes=()=>{const prev=S.notes.slice();S.notes=[];save();render();toast('All notifications cleared',()=>{S.notes=prev;save();render()})};
A.toastUndo=()=>{const f=toast._u;toast._u=null;$('#toast').classList.remove('on');f&&f()};

/* ===== Feelings picker (your design) ===== */
const FEEL=[{g:'Energised',c:'#fbbf24',f:['Happy','Excited','Hopeful','Proud','Confident','Joyful','Energetic','Grateful']},{g:'Calm',c:'#34d399',f:['Calm','Relaxed','Content','Peaceful','Focused','Satisfied','Curious']},{g:'Tense',c:'#f87171',f:['Anxious','Stressed','Angry','Frustrated','Overwhelmed','Irritated','Restless','Worried']},{g:'Low',c:'#60a5fa',f:['Tired','Sad','Bored','Lonely','Drained','Disappointed','Numb','Guilty']},{g:'Neutral',c:'#9ca3af',f:['Neutral','Confused','Other']}];
const FCK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function feelPicker(title){R.fpg='All';
 const rows=FEEL.map(g=>g.f.map(n=>`<button class="fp-r" data-a="fpTog" data-v="${n}" data-g="${g.g}" style="--g:${g.c}" aria-pressed="false"><i class="d"></i>${n}<span class="gl">${g.g}</span><span class="k">${FCK}</span></button>`).join('')).join('');
 return `<div class="card fp"><div class="row"><h3 style="margin:0">${title||'How does it feel?'}</h3><span class="muted small" id="fp-n">0 picked</span></div>
 <div class="fp-pk" id="fp-pk"><span class="muted small">Nothing picked yet.</span></div>
 <input class="inp" data-live="fps" placeholder="Search feelings" aria-label="Search feelings" autocomplete="off" style="margin-top:12px">
 <div class="fp-tabs">${['All',...FEEL.map(g=>g.g)].map((g,i)=>{const c=(FEEL.find(x=>x.g===g)||{}).c;return `<button class="fp-t" data-a="fpTab" data-v="${g}" aria-pressed="${i===0}" ${c?`style="--g:${c}"`:''}>${c?'<i></i>':''}${g}</button>`}).join('')}</div>
 <div class="fp-win"><div class="fp-list" id="feel-all" role="group" aria-label="Feelings">${rows}<div class="muted small center" id="fp-none" hidden style="padding:24px 0">No match. Try another word.</div></div><div class="fp-fade"></div></div>
 <p class="muted small center" style="margin:6px 0 0">Scroll for more. Tap to pick.</p></div>`}
function fpFilter(){const q=(($('[data-live="fps"]')||{}).value||'').trim().toLowerCase(),g=R.fpg||'All';let n=0;
 $$('#feel-all .fp-r').forEach(r=>{const ok=(g==='All'||r.dataset.g===g)&&(!q||r.dataset.v.toLowerCase().includes(q)||r.dataset.g.toLowerCase().startsWith(q));r.hidden=!ok;if(ok)n++});
 const e=$('#fp-none');if(e)e.hidden=n>0;const l=$('#feel-all');if(l)l.scrollTop=0}
function fpSync(){const on=$$('#feel-all .fp-r.on');$('#fp-n').textContent=on.length+' picked';
 $('#fp-pk').innerHTML=on.length?on.map(r=>`<button class="fp-c" data-a="fpTog" data-v="${r.dataset.v}" style="--g:${r.style.getPropertyValue('--g')}" aria-label="Remove ${r.dataset.v}"><i></i>${r.dataset.v}<b aria-hidden="true">&times;</b></button>`).join(''):'<span class="muted small">Nothing picked yet.</span>'}
A.fpTog=el=>{const r=$('#feel-all .fp-r[data-v="'+el.dataset.v+'"]');if(!r)return;r.classList.toggle('on');r.setAttribute('aria-pressed',r.classList.contains('on'));fpSync();try{navigator.vibrate&&navigator.vibrate(6)}catch(e){}};
A.fpTab=el=>{R.fpg=el.dataset.v;$$('.fp-t').forEach(b=>b.setAttribute('aria-pressed',b===el));fpFilter()};
PAGES.settings=()=>pageHdr("Settings");
