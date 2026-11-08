/* ===== Time: track (stopwatch, pomodoro, study goals), plan, sheets ===== */
const tmin=v=>{const [h,m]=v.split(':').map(Number);return h*60+m};
const minVal=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const catOptions=sel=>GROUPS.map(g=>`<optgroup label="${g.id}">${S.cats.filter(c=>c.group===g.id).map(c=>`<option value="${c.id}" ${c.id===sel?'selected':''}>${esc(c.name)}</option>`).join('')}</optgroup>`).join('');
const studyCats=()=>S.cats.filter(c=>c.group==='Study');
R.pdate=today();R.catEdit=false;
TABS.time=()=>`<div class="seg">${[['track','Track'],['plan','Plan']].map(([k,n])=>`<button class="${R.ttab===k?'on':''}" data-a="ttab" data-v="${k}">${n}</button>`).join('')}</div>`+(R.ttab==='plan'?planView():trackView());
A.ttab=el=>{R.ttab=el.dataset.v;render()};

function studyCard(){const k=dk(today()),sm=grpMin(k,'Study'),T=S.studyTarget,left=Math.max(0,T-sm);
 const subj=studyCats().filter(c=>c.goal>0||catMin(k,c.id)>0);
 let ex='';if(S.exam){const d=Math.ceil((k2t(S.exam.date)-today())/864e5);ex=`<button class="exb" data-a="sheet" data-s="exam" aria-label="Exam countdown"><b>${d>0?d:d===0?'0':'–'}</b><small>${d>0?'day'+(d===1?'':'s')+' to '+esc(S.exam.name||'exam'):d===0?esc(S.exam.name||'Exam')+' today':'passed'}</small></button>`}
 else ex=`<button class="chip sm" data-a="sheet" data-s="exam">${I.plus} Exam date</button>`;
 const rows=subj.map(c=>{const m=catMin(k,c.id),g=c.goal||0;return `<button class="srow" data-a="sheet" data-s="goal" data-q='{"id":"${c.id}"}'><span class="sn">${esc(c.name)}</span><span class="sb"><i style="width:${g?Math.min(100,m/g*100):(m?100:0)}%"></i></span><span class="sv">${fmtH(m)}${g?' / '+fmtH(g):''}</span></button>`}).join('');
 return `<div class="card study"><div class="row"><div class="eyebrow" style="margin:0">Today’s study target</div>${ex}</div>
 <div class="row" style="gap:18px;margin-top:14px">${ringSvg(T?sm/T:0,118,11,'var(--warn)',`<text x="50%" y="52%" text-anchor="middle" dominant-baseline="central" font-size="24" font-weight="800" fill="var(--fg)">${T?Math.round(100*Math.min(1,sm/T)):0}%</text>`)}<div style="flex:1;min-width:0"><div><b style="font-size:34px;font-weight:800;letter-spacing:-.02em">${fmtH(sm)}</b></div><div class="muted small" style="margin:2px 0 12px">${sm>=T&&T?'Target reached':fmtH(left)+' to go'} · target ${fmtH(T)}</div><div class="stepper" style="min-height:42px"><button data-a="tgt" data-d="-1" aria-label="Lower target">−</button><b style="font-size:15px">${fmtH(T)}</b><button data-a="tgt" data-d="1" aria-label="Raise target">+</button></div></div></div>
 ${rows?`<div class="srows">${rows}</div>`:''}
 <button class="chip sm gap2" data-a="sheet" data-s="goal">${I.plus} Subject goal</button></div>`}
A.tgt=el=>{S.studyTarget=clamp(S.studyTarget+30*(+el.dataset.d),30,960);save();render()};

/* ----- activity picker ----- */
function catPicker(id,sel,o={}){return `<button type="button" class="pkbtn" id="${id}" data-a="pkOpen" data-val="${sel||''}" ${o.none?`data-none="${esc(o.none)}"`:''} ${o.cb?`data-cb="${o.cb}"`:''} ${o.off?'disabled':''} aria-haspopup="dialog"><i class="pkd" style="background:${sel?catCol(sel):'var(--dim)'}"></i><span class="pkl">${esc(sel?catLabel(sel):(o.none||'Choose activity'))}</span>${I.next}</button>`}
function setPicker(id,v){const t=$('#'+id);if(!t)return;t.dataset.val=v||'';$('.pkl',t).textContent=v?catLabel(v):(t.dataset.none||'Choose activity');$('.pkd',t).style.background=v?catCol(v):'var(--dim)'}
let _pkT=null;
A.pkOpen=el=>{_pkT=el.id;const sel=el.dataset.val,none=el.dataset.none;
 const rec=[];S.entries.slice().sort((a,b)=>b.end-a.end).forEach(e=>{if(cat(e.catId)&&!rec.includes(e.catId)&&rec.length<5)rec.push(e.catId)});
 const it=c=>`<button class="pk-it ${c.id===sel?'on':''}" data-a="pkPick" data-v="${c.id}" data-n="${esc((c.name+' '+c.group).toLowerCase())}"><i class="pkd" style="background:${gcol(c.group)}"></i>${esc(c.name)}</button>`;
 const html=`<div class="sbg" id="pk" data-a="pkbg" style="z-index:60"><div class="sheet" role="dialog" aria-label="Choose activity"><div class="grab"></div><h2>Choose activity</h2><input class="inp" placeholder="Search" data-live="pks" autocomplete="off" aria-label="Search activities">
 ${none?`<button class="pk-it none ${!sel?'on':''}" data-a="pkPick" data-v="" style="margin-top:12px">${esc(none)}</button>`:''}
 ${rec.length?`<div class="pk-g"><div class="grp">Recent</div><div class="chips-w">${rec.map(id=>it(cat(id))).join('')}</div></div>`:''}
 ${GROUPS.map(g=>`<div class="pk-g"><div class="grp" style="color:${g.c}">${g.id}</div><div class="chips-w">${S.cats.filter(c=>c.group===g.id).map(it).join('')}</div></div>`).join('')}</div></div>`;
 $('.phone').insertAdjacentHTML('beforeend',html)};
A.pkbg=(el,e)=>{if(e.target===el)el.remove()};
A.pkPick=el=>{const t=$('#'+_pkT);const v=el.dataset.v;$('#pk').remove();if(!t)return;setPicker(_pkT,v);if(t.dataset.cb&&A[t.dataset.cb])A[t.dataset.cb](t)};

/* ----- stopwatch / pomodoro card (lives on Home) ----- */
function timerCard(){const r=S.running,mode=r?(r.mode==='pomo'?'pomo':'sw'):(S.tmode||'sw');
 if(!R.selCat||!cat(R.selCat))R.selCat=(S.lastCat&&cat(S.lastCat)?S.lastCat:studyCats()[0].id);
 const sel=r?r.catId:R.selCat;let clock,btn='',bar='';
 if(r){clock=runText();
  if(r.mode==='pomo'){bar=`<div class="bar gap"><i data-t="runbar" style="width:${r.waiting?100:(100*(Date.now()-r.phaseStart)/r.dur).toFixed(1)}%"></i></div>`;
   if(r.waiting)btn=`<button class="btn" data-a="nextPhase">Start ${r.next==='focus'?'next focus block':r.next==='long'?'long break':'short break'}</button>`}
  btn+=`<button class="btn dng ${btn?'gap':''}" data-a="stop">Stop and save</button>`}
 else{clock=mode==='pomo'?String(S.settings.focus).padStart(2,'0')+':00':'00:00:00';btn=`<button class="btn" data-a="start">Start</button>`}
 const lab=r?(r.mode==='pomo'?(r.waiting?'Ready':r.phase==='focus'?'Focus · block '+r.block:'Break'):'Running'):(mode==='pomo'?'Pomodoro ready':'Stopwatch ready');
 return `<div class="card"><div class="seg sm" style="${r?'opacity:.5;pointer-events:none':''}"><button class="${mode==='sw'?'on':''}" data-a="tmode" data-v="sw">Stopwatch</button><button class="${mode==='pomo'?'on':''}" data-a="tmode" data-v="pomo">Pomodoro</button></div>
 <div class="gap2">${catPicker('home-cat',sel,{cb:'homeCat',off:!!r})}</div>
 <div class="eyebrow center gap2">${esc(lab)}</div><div class="runbig center" data-t="run" style="margin-top:6px">${clock}</div>${bar}<div class="gap2">${btn}</div>
 <p class="center small muted gap"><button class="link" data-a="go" data-p="settings">Focus ${S.settings.focus} · Break ${S.settings.short} · Long break ${S.settings.long} · Settings</button></p></div>`}
A.homeCat=el=>{R.selCat=el.dataset.val;render()};

/* ----- Time > Track ----- */
function ctile(c,run){const k=dk(today()),m=catMin(k,c.id),g=c.goal||0,live=run&&run.catId===c.id;
 return `<button class="ctile ${live?'live':''}" style="--cc:${gcol(c.group)}" ${R.catEdit?`data-a="sheet" data-s="catedit" data-q='{"id":"${c.id}"}'`:`data-a="catgo" data-v="${c.id}"`} aria-label="${esc(c.name)}${live?', running, tap to stop':', tap to start'}"><span class="cn">${esc(c.name)}</span><b ${live?'data-t="run"':''}>${live?runText():(m?fmtH(m):'–')}</b><small>${R.catEdit?'Edit':live?'Tap to stop':m?'today · tap to start':'Tap to start'}</small>${g?`<span class="gb"><i style="width:${Math.min(100,m/g*100)}%"></i></span>`:''}</button>`}
function trackView(){const run=S.running;
 const strip=run?`<div class="card row runstrip"><div><div class="eyebrow" style="margin:0">${run.mode==='pomo'?'Pomodoro':'Tracking'} · ${esc(catLabel(run.catId))}</div><div class="runbig" data-t="run" style="font-size:34px;margin-top:6px">${runText()}</div></div><button class="btn dng sm" data-a="stop">Stop</button></div>`:'';
 const groups=GROUPS.map(g=>{const cs=S.cats.filter(c=>c.group===g.id);const tot=grpMin(dk(today()),g.id);return `<div class="cg"><div class="row cgh"><span class="grp" style="color:${g.c};margin:0">${g.id}</span><span class="muted small">${tot?fmtH(tot)+' today':''}</span></div><div class="ctiles">${cs.map(c=>ctile(c,run)).join('')}</div></div>`}).join('');
 return studyCard()+strip+`<div class="card"><div class="row"><h3 style="margin:0">Activities</h3><button class="link small" data-a="catedit">${R.catEdit?'Done':'Edit'}</button></div><p class="muted small" style="margin:6px 0 0">${R.catEdit?'Tap an activity to rename or delete it.':run?'Tap another activity to switch, or the running one to stop.':'Tap an activity to start tracking right away.'}</p>${groups}<div class="btns eq gap2"><button class="btn sec" data-a="sheet" data-s="newcat">${I.plus} New activity</button><button class="btn sec" data-a="sheet" data-s="logtime" data-q='{"day":${today()}}'>${I.plus} Log manually</button></div></div>`}
A.catgo=el=>{const id=el.dataset.v,r=S.running;R.selCat=id;
 if(r&&r.catId===id){stopRun();return}
 const m=r?r.mode:(S.tmode||'sw');if(r)stopRun();startRun(id,m);toast('Tracking '+catLabel(id))};
A.tmode=el=>{S.tmode=el.dataset.v;save();render()};A.catedit=()=>{R.catEdit=!R.catEdit;render()};
A.start=()=>{if(S.running)return;startRun(R.selCat,S.tmode||'sw')};A.nextPhase=()=>nextPhase();

/* ----- plan ----- */
const HH=56,H0=5,H1=24;
function planView(){const k=dk(R.pdate),isT=R.pdate===today(),blocks=S.plan.filter(b=>b.day===k),tr=entriesOn(k).filter(e=>(e.end-R.pdate)/6e4>H0*60);
 const nav=`<div class="row" style="margin-bottom:12px"><button class="back" data-a="pnav" data-d="-1" aria-label="Previous day">${I.back}</button><b>${fmtDate(R.pdate,{weekday:'short',day:'numeric',month:'short'})}</b><button class="back" data-a="pnav" data-d="1" aria-label="Next day">${I.next}</button></div>`;
 const quick=`<div class="chips-w" style="margin-bottom:12px">${['Study','College','Health','Commute'].map(g=>`<button class="chip" data-a="sheet" data-s="block" data-q='{"day":"${k}","g":"${g}"}'>${g}</button>`).join('')}</div>`;
 let grid='';for(let h=H0;h<H1;h++){const y=(h-H0)*HH;grid+=`<div class="hr" style="top:${y}px"><span>${h%12||12}${h<12||h===24?' AM':' PM'}</span></div><button aria-label="Add block at ${h}:00" data-a="sheet" data-s="block" data-q='{"day":"${k}","s":${h*60}}' style="position:absolute;left:44px;right:0;top:${y}px;height:${HH}px"></button>`}
 const top=m=>clamp((m-H0*60)/60*HH,0,(H1-H0)*HH);
 const bl=blocks.map(b=>{const t=top(b.s),h=Math.max(28,top(b.e)-t);return `<button class="blk" style="--bc:${catCol(b.catId)};top:${t}px;height:${h}px" data-a="sheet" data-s="block" data-q='{"id":"${b.id}"}'>${esc(catLabel(b.catId))}<small>${fmtT(atTime(R.pdate,minVal(b.s)))} – ${fmtT(atTime(R.pdate,minVal(b.e)))}</small></button>`}).join('');
 const trk=tr.map(e=>{const s=(e.start-R.pdate)/6e4,en=(e.end-R.pdate)/6e4,t=top(s);return `<i class="trk" style="--bc:${catCol(e.catId)};top:${t}px;height:${Math.max(4,top(en)-t)}px"></i>`}).join('');
 let now='';if(isT){const m=(Date.now()-R.pdate)/6e4;if(m>=H0*60&&m<=H1*60)now=`<i class="now" style="top:${top(m)}px"></i>`}
 return nav+quick+`<div class="card" style="padding:14px 12px"><div class="plan" style="height:${(H1-H0)*HH}px">${grid}${bl}${trk}${now}</div></div><p class="muted small center">Tap an hour to add a block, or a block to edit it. The thin bar on the right shows what you tracked.</p>`}
A.pnav=el=>{R.pdate=addDays(R.pdate,+el.dataset.d);render()};

/* ----- sheets ----- */
SHEETS.logtime=P=>{const day=P.day||today(),isT=day===today();
 let s=P.s,e=P.e;if(!e){e=isT?Date.now():atTime(day,'18:00');s=e-30*6e4}
 return `<h2>Log time</h2><label class="lbl" for="lt-c">Category</label>${catPicker('lt-c',R.selCat)}<label class="lbl" for="lt-d">Date</label><input class="inp" type="date" id="lt-d" value="${dk(day)}" max="${dk(today())}"><div class="two"><div><label class="lbl" for="lt-s">Start</label><input class="inp" type="time" id="lt-s" value="${hhmm(s)}"></div><div><label class="lbl" for="lt-e">End</label><input class="inp" type="time" id="lt-e" value="${hhmm(e)}"></div></div><div class="btns"><button class="btn sec" data-a="close">Cancel</button><button class="btn" data-a="saveLog">Save</button></div>`};
A.saveLog=()=>{const d=k2t($('#lt-d').value),s=atTime(d,$('#lt-s').value),e=atTime(d,$('#lt-e').value);if(!(e>s)){toast('End must be after start');return}if(e>Date.now()){toast('That time is in the future');return}
 S.entries.push({id:uid(),catId:pv('#lt-c'),start:s,end:e,src:'manual'});S.lastCat=pv('#lt-c');save();closeSheet();render();checkNotes();toast('Logged '+fmtD((e-s)/6e4))};
SHEETS.entry=P=>{const e=S.entries.find(x=>x.id===P.id);if(!e)return `<h2>Entry not found</h2><button class="btn" data-a="close">Close</button>`;
 return `<h2>Edit entry</h2><label class="lbl" for="en-c">Category</label>${catPicker('en-c',e.catId)}<div class="two"><div><label class="lbl" for="en-s">Start</label><input class="inp" type="time" id="en-s" value="${hhmm(e.start)}"></div><div><label class="lbl" for="en-e">End</label><input class="inp" type="time" id="en-e" value="${hhmm(e.end)}"></div></div>${e.focus!=null?`<p class="muted small gap">Focus rated ${e.focus}/10${e.blockers&&e.blockers.length?' · '+esc(e.blockers.join(', ')):''}</p>`:''}<div class="btns eq"><button class="btn dng" data-a="delEntry" data-v="${e.id}">Delete</button><button class="btn" data-a="saveEntry" data-v="${e.id}">Save</button></div>`};
A.saveEntry=el=>{const e=S.entries.find(x=>x.id===el.dataset.v),d=sod(e.start),s=atTime(d,$('#en-s').value),en=atTime(d,$('#en-e').value);if(!(en>s)){toast('End must be after start');return}e.start=s;e.end=en;e.catId=pv('#en-c');save();closeSheet();render()};
A.delEntry=el=>{S.entries=S.entries.filter(x=>x.id!==el.dataset.v);save();closeSheet();render();toast('Entry deleted')};
SHEETS.focus=P=>`<h2>How was your focus?</h2><p class="muted small" style="margin:-8px 0 14px">${esc(catLabel((S.entries.find(e=>e.id===P.id)||{}).catId))}</p><div class="row"><input type="range" id="fr" min="0" max="10" value="7" data-live="frv" style="flex:1;accent-color:var(--pri)" aria-label="Focus 0 to 10"><b id="frv" style="font-size:28px;width:34px;text-align:right">7</b></div><label class="lbl">What got in the way? Optional</label><div class="chips-w" id="fb">${['Phone','Noise','Tired','Hungry','Wandering thoughts'].map(x=>`<button class="chip" data-a="multi" data-v="${x}">${x}</button>`).join('')}</div><div class="col gap2"><button class="btn" data-a="saveFocus" data-v="${P.id}">Save rating</button><button class="btn sec" data-a="close">Skip</button></div>`;
A.saveFocus=el=>{const e=S.entries.find(x=>x.id===el.dataset.v);if(e){e.focus=+$('#fr').value;e.blockers=mv('#fb')}save();closeSheet();render();toast('Focus saved')};
SHEETS.block=P=>{const b=P.id?S.plan.find(x=>x.id===P.id):null,k=b?b.day:P.day;let s=b?b.s:P.s,cs=b?b.catId:(P.g?(S.cats.find(c=>c.group===P.g)||{}).id:R.selCat);
 if(s==null){s=k===dk(today())?Math.min(22*60,(new Date().getHours()+1)*60):9*60}const e=b?b.e:Math.min(24*60-1,s+60);
 return `<h2>${b?'Edit block':'Plan a block'}</h2><label class="lbl" for="bl-c">Category</label>${catPicker('bl-c',cs)}<div class="two"><div><label class="lbl" for="bl-s">Start</label><input class="inp" type="time" id="bl-s" value="${minVal(s)}"></div><div><label class="lbl" for="bl-e">End</label><input class="inp" type="time" id="bl-e" value="${minVal(e)}"></div></div><div class="btns ${b?'eq':''}">${b?`<button class="btn dng" data-a="delBlock" data-v="${b.id}">Delete</button>`:`<button class="btn sec" data-a="close">Cancel</button>`}<button class="btn" data-a="saveBlock" data-v="${b?b.id:''}" data-day="${k}">Save</button></div>`};
A.saveBlock=el=>{const s=tmin($('#bl-s').value),e=tmin($('#bl-e').value);if(!(e>s)){toast('End must be after start');return}
 if(el.dataset.v){const b=S.plan.find(x=>x.id===el.dataset.v);Object.assign(b,{catId:pv('#bl-c'),s,e})}else S.plan.push({id:uid(),day:el.dataset.day,catId:pv('#bl-c'),s,e});save();closeSheet();render()};
A.delBlock=el=>{S.plan=S.plan.filter(x=>x.id!==el.dataset.v);save();closeSheet();render()};
SHEETS.newcat=()=>`<h2>New category</h2><label class="lbl" for="nc-n">Name</label><input class="inp" id="nc-n" maxlength="24" placeholder="e.g. Biology" autocomplete="off"><label class="lbl">Group</label><div class="chips-w" data-pick data-val="Study" id="nc-g">${GROUPS.map(g=>`<button class="chip ${g.id==='Study'?'on':''}" data-a="pick" data-v="${g.id}">${g.id}</button>`).join('')}</div><div class="btns"><button class="btn sec" data-a="close">Cancel</button><button class="btn" data-a="saveCat">Add</button></div>`;
A.saveCat=()=>{const n=$('#nc-n').value.trim();if(!n){toast('Give it a name');return}const g=pv('#nc-g');if(S.cats.some(c=>c.group===g&&c.name.toLowerCase()===n.toLowerCase())){toast('That category already exists');return}
 const c={id:uid(),name:n,group:g,custom:true};S.cats.push(c);R.selCat=c.id;save();closeSheet();render();toast('Added '+n)};
SHEETS.catedit=P=>{const c=cat(P.id);if(!c)return '';const used=S.entries.some(e=>e.catId===c.id)||S.plan.some(b=>b.catId===c.id)||(S.running&&S.running.catId===c.id);
 return `<h2>Edit category</h2><p class="muted small" style="margin:-8px 0 12px">${c.group}</p><label class="lbl" for="ce-n">Name</label><input class="inp" id="ce-n" maxlength="24" value="${esc(c.name)}" autocomplete="off">${used?'<p class="muted small gap">Used in your records, so it cannot be deleted. You can rename it.</p>':''}<div class="btns eq">${used?`<button class="btn sec" data-a="close">Cancel</button>`:`<button class="btn dng" data-a="delCat" data-v="${c.id}">Delete</button>`}<button class="btn" data-a="renCat" data-v="${c.id}">Save</button></div>`};
A.renCat=el=>{const n=$('#ce-n').value.trim();if(!n){toast('Give it a name');return}cat(el.dataset.v).name=n;save();closeSheet();render()};
A.delCat=el=>{S.cats=S.cats.filter(c=>c.id!==el.dataset.v);if(R.selCat===el.dataset.v)R.selCat=null;save();closeSheet();render()};
SHEETS.goal=P=>{const c=P.id?cat(P.id):null;return `<h2>Subject goal</h2>${c?`<p class="muted small" style="margin:-8px 0 8px">${esc(c.name)}</p>`:`<label class="lbl" for="g-c">Subject</label><select class="sel" id="g-c">${studyCats().map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>`}<label class="lbl">Daily goal</label>${stepper('g-v',(c&&c.goal)||60,0,600,15,'min')}<p class="muted small gap">Set to 0 to remove the goal.</p><div class="btns"><button class="btn sec" data-a="close">Cancel</button><button class="btn" data-a="saveGoal" data-v="${c?c.id:''}">Save</button></div>`};
A.saveGoal=el=>{const id=el.dataset.v||$('#g-c').value,v=+pv('#g-v'),c=cat(id);if(v>0)c.goal=v;else delete c.goal;save();closeSheet();render()};
SHEETS.exam=()=>{const x=S.exam||{};return `<h2>Exam countdown</h2><label class="lbl" for="x-n">Name</label><input class="inp" id="x-n" maxlength="30" value="${esc(x.name||'')}" placeholder="e.g. Board exam" autocomplete="off"><label class="lbl" for="x-d">Date</label><input class="inp" type="date" id="x-d" value="${x.date||''}" min="${dk(today())}"><div class="btns eq">${S.exam?`<button class="btn sec" data-a="rmExam">Remove</button>`:`<button class="btn sec" data-a="close">Cancel</button>`}<button class="btn" data-a="saveExam">Save</button></div>`};
A.saveExam=()=>{const d=$('#x-d').value;if(!d){toast('Pick a date');return}S.exam={name:$('#x-n').value.trim(),date:d};save();closeSheet();render()};
A.rmExam=()=>{S.exam=null;save();closeSheet();render()};
