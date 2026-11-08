/* ===== Wellbeing: today, check-in, event, sleep, insights, reports ===== */
const fcol=n=>(FEEL.find(g=>g.f.includes(n))||{c:'var(--dim)'}).c;
const fchip=(n,on)=>`<button class="chip sm ${on?'on':''}" style="--mc:${fcol(n)}" data-a="multi" data-f="${n}" data-v="${n}">${n}</button>`;
const clock=m=>new Date(2000,0,1,Math.floor(m/60)%24,Math.round(m%60)).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
const sdv=a=>{if(a.length<2)return 0;const m=avg(a);return Math.sqrt(avg(a.map(x=>(x-m)**2)))};
const sdur=n=>(n.wake-n.bed)/6e4;
const bedMin=n=>{const d=new Date(n.bed);return (d.getHours()*60+d.getMinutes()-1080+1440)%1440};
const wakeMin=n=>{const d=new Date(n.wake);return d.getHours()*60+d.getMinutes()};
const QL=['Poor','Fair','Okay','Good','Great'],RL=['Not at all','Slightly','Okay','Rested','Fully rested'];
R.wrd=today();R.tlf='All';
function lineChart(series,xmin,xmax,xl){const W=320,H=140,l=26,r=8,t=8,b=22,pw=W-l-r,ph=H-t-b,X=x=>l+(x-xmin)/(xmax-xmin)*pw,Y=y=>t+ph-y/10*ph;
 let s=`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Chart of check-ins through the day">`;
 [0,5,10].forEach(v=>{s+=`<line x1="${l}" x2="${W-r}" y1="${Y(v)}" y2="${Y(v)}" style="stroke:var(--line)" stroke-width="1"/><text x="${l-6}" y="${Y(v)+4}" text-anchor="end" font-size="10" style="fill:var(--mute)">${v}</text>`});
 xl.forEach(([x,n])=>{s+=`<text x="${X(x)}" y="${H-5}" text-anchor="middle" font-size="10" style="fill:var(--mute)">${n}</text>`});
 series.forEach(se=>{const p=se.pts;if(p.length>1)s+=`<path d="${p.map((q,i)=>(i?'L':'M')+X(q[0]).toFixed(1)+' '+Y(q[1]).toFixed(1)).join('')}" fill="none" style="stroke:${se.c}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;p.forEach(q=>{s+=`<circle cx="${X(q[0]).toFixed(1)}" cy="${Y(q[1]).toFixed(1)}" r="3.6" style="fill:${se.c}"/>`})});
 return s+'</svg>'}
function checkinRow(c){const parts=MET.filter(m=>c[m.k]!=null).map(m=>`${m.n} ${c[m.k]}`).join(' · ');
 return `<div class="trow" style="grid-template-columns:64px 1fr;align-items:flex-start"><span class="muted small" style="font-weight:600;padding-top:2px">${fmtT(c.ts)}</span><div><b>${parts||'Note only'}</b>${c.feelings&&c.feelings.length?`<div class="chips-w feel gap">${c.feelings.map(f=>`<span class="chip sm" style="--mc:${fcol(f)};pointer-events:none">${f}</span>`).join('')}</div>`:''}${c.note?`<div class="muted small gap">“${esc(c.note)}”</div>`:''}</div></div>`}

/* ----- shell ----- */
TABS.wellbeing=()=>`<div class="seg">${[['today','Today'],['sleep','Sleep'],['insights','Insights'],['reports','Reports']].map(([k,n])=>`<button class="${R.wtab===k?'on':''}" data-a="wtab" data-v="${k}">${n}</button>`).join('')}</div>`+({today:wToday,sleep:wSleep,insights:wInsights,reports:wReports}[R.wtab])();
A.wtab=el=>{R.wtab=el.dataset.v;render()};

/* ----- today ----- */
function tlEvents(k){const ev=[],d=k2t(k);
 S.sleep.filter(s=>s.date===k).forEach(s=>ev.push({ts:s.wake,f:'Sleep',tag:'Sleep',col:'var(--w-sleep)',t:'Woke up',s:`${fmtD(sdur(s))} night · slept ${fmtT(s.bed)}${s.approx?' (approx.)':''}`}));
 S.naps.filter(n=>dk(n.start)===k).forEach(n=>ev.push({ts:n.start,f:'Sleep',tag:'Sleep',col:'var(--w-sleep)',t:'Nap',s:fmtD((n.end-n.start)/6e4)}));
 S.checkins.filter(c=>dk(c.ts)===k).forEach(c=>ev.push({ts:c.ts,f:'Check-ins',tag:'Wellbeing',col:'var(--w-mot)',t:'Check-in',s:MET.filter(m=>c[m.k]!=null).map(m=>m.n+' '+c[m.k]).join(' · ')+(c.feelings&&c.feelings.length?' · '+c.feelings.slice(0,3).join(', '):'')}));
 entriesOn(k,false).forEach(e=>ev.push({ent:e,ts:e.start,f:'Activities',tag:'Activity',col:catCol(e.catId),t:catLabel(e.catId),s:fmtD(mins(e))+(e.focus!=null?' · focus '+e.focus:'')}));
 S.taskLog.filter(x=>dk(x.ts)===k).forEach(x=>ev.push({ts:x.ts,f:'Tasks',tag:'Tasks',col:'var(--ok)',t:'Task completed',s:x.title}));
 S.events.filter(x=>dk(x.ts)===k).forEach(x=>ev.push({ts:x.ts,f:'Events',tag:'Wellbeing',col:'var(--w-mood)',t:'Emotional event',s:(x.feelings||[]).join(', ')+(x.strength?' · intensity '+x.strength:'')+(x.note?` · “${x.note}”`:'')}));
 return ev.sort((a,b)=>a.ts-b.ts)}
A.tlf=el=>{R.tlf=el.dataset.v;render()};

/* ----- check-in page (quick, with detail on demand) ----- */
const sugFor=v=>v==null?['Calm','Tired','Focused','Anxious','Content']:v>=7?['Happy','Calm','Content','Hopeful','Focused']:v<=4?['Tired','Sad','Anxious','Drained','Worried']:['Neutral','Calm','Tired','Focused','Bored'];
function suggest(){const k=Date.now();const e=entriesOn(dk(k)).find(x=>x.start<=k&&x.end>=k-60000);return e}
PAGES.checkin=()=>{const sg=suggest(),now=Date.now();
 const mcard=m=>`<div class="card" id="mc-${m.k}" style="--mc:${m.c}"><div class="row"><h3 style="margin:0;color:${m.c}">${m.n}</h3>${stepper('ci-'+m.k,null,0,10,1,'','ciStep',5)}</div><div class="scale gap" data-pick data-val="" data-cb="ciPick">${m.lab.map((n,i)=>`<button style="--mc:var(--m${i})" data-a="pick" data-v="${[1,3,5,7,9][i]}">${n}</button>`).join('')}</div><div class="center gap"><button class="link small" data-a="ciSkip" data-v="${m.k}">Skip ${m.n}</button></div></div>`;
 return pageHdr('Check in',`<span></span>`)+`<p class="muted small" style="margin:-4px 2px 12px">About 20 seconds. Skip anything you like.</p>
 <div class="card"><div class="row"><div><div class="eyebrow">Happened</div><b id="ci-wl" style="font-size:17px">Now · ${fmtT(now)}</b></div><button class="chip sm" data-a="ciEarlier">It was earlier</button></div>
 <div id="ci-et" hidden class="gap2"><div class="chips-w" data-pick data-val="" data-cb="ciQuick">${[['30 min ago',30],['1 hour ago',60],['This morning','m'],['Last night','n']].map(([n,v])=>`<button class="chip sm" data-a="pick" data-v="${v}">${n}</button>`).join('')}</div><div class="two gap"><div><label class="lbl" for="ci-d">Date</label><input class="inp" type="date" id="ci-d" value="${dk(now)}" max="${dk(now)}"></div><div><label class="lbl" for="ci-t">Time</label><input class="inp" type="time" id="ci-t" value="${hhmm(now)}"></div></div><p class="muted small gap">The time it happened links activities. The recording time is kept too.</p></div></div>
 <div class="card center"><div class="orb lg" id="ci-orb" style="--oc:var(--dim);margin:6px auto 12px" role="img" aria-label="Orb follows your mood"></div><h3 id="ci-ol" style="margin:0">Mood: not set</h3><p class="muted small">The orb follows your mood</p></div>
 ${mcard(MET[0])}${mcard(MET[1])}${mcard(MET[2])}${mcard(MET[3])}
 ${feelPicker()}
 <div id="ci-detail" hidden>
  <div class="card"><h3>Stress or overwhelm <span class="muted small" style="font-weight:500">Optional</span></h3><div class="scale" data-pick data-val="" id="ci-stress">${['None','Mild','Some','High','Intense'].map((n,i)=>`<button style="--mc:var(--w-mood)" data-a="pick" data-v="${i}">${n}</button>`).join('')}</div></div>
  <div class="card"><h3>What were you doing?</h3>${sg?`<div class="note ok" id="ci-sg">Your timer shows ${esc(catLabel(sg.catId))} (${fmtT(sg.start)}${sg.live?' – now':' – '+fmtT(sg.end)}).<div class="chips-w gap"><button class="chip sm on" data-a="ciConfirm" data-v="${sg.catId}">Confirm</button><button class="chip sm" data-a="ciNot">Not this</button></div></div><div class="sp"></div>`:''}${catPicker('ci-act',sg?sg.catId:'',{none:'Nothing specific'})}<label class="lbl" for="ci-trig">Possible trigger · your words</label><input class="inp" id="ci-trig" placeholder="Maybe because…" autocomplete="off"><p class="muted small gap">This stays your interpretation. It is never shown as a proven cause.</p></div>
 </div>
 <div class="card"><label class="lbl" for="ci-note">Note · optional</label><input class="inp" id="ci-note" placeholder="In your own words" autocomplete="off"></div>
 <div class="btns"><button class="btn sec" data-a="ciDetail" id="ci-dbtn">Add detail</button><button class="btn" data-a="ciSave">Save</button></div>`};
function ciSet(card,v){const k=card.id.slice(3),st=$('[data-step]',card),sc=$('.scale',card);
 st.dataset.val=v;$('b',st).textContent=v;sc.dataset.val=v;$$('button',sc).forEach((b,i)=>b.classList.toggle('on',i===lvl(v)));
 if(k==='mood'){$('#ci-orb').style.setProperty('--oc',mCol(v));$('#ci-ol').textContent='Mood: '+MET[0].lab[lvl(v)]}}
A.ciStep=(el,g)=>ciSet(g.closest('.card'),+g.dataset.val);
A.ciPick=(el,g)=>ciSet(g.closest('.card'),+el.dataset.v);
A.ciSkip=el=>{const k=el.dataset.v,card=$('#mc-'+k),st=$('[data-step]',card);st.dataset.val='';$('b',st).textContent='–';const sc=$('.scale',card);sc.dataset.val='';$$('button',sc).forEach(b=>b.classList.remove('on'));if(k==='mood'){$('#ci-orb').style.setProperty('--oc','var(--dim)');$('#ci-ol').textContent='Mood: not set'}};
A.ciMore=()=>{const f=$('#feel-all');f.hidden=!f.hidden;$('#ci-more').textContent=f.hidden?'More feelings (35)':'Fewer feelings'};
A.ciDetail=()=>{const d=$('#ci-detail');d.hidden=!d.hidden;$('#ci-dbtn').textContent=d.hidden?'Add detail':'Hide detail'};
A.ciEarlier=el=>{const e=$('#ci-et');e.hidden=!e.hidden;el.textContent=e.hidden?'It was earlier':'It was just now';if(e.hidden)$('#ci-wl').textContent='Now · '+fmtT(Date.now())};
A.ciQuick=el=>{const v=el.dataset.v,n=Date.now();let t;if(v==='m'){const d=new Date(n);d.setHours(9,0,0,0);t=d.getTime()>n?n-36e5:d.getTime()}else if(v==='n'){t=atTime(addDays(today(),-1),'22:30')}else t=n-(+v)*6e4;$('#ci-d').value=dk(t);$('#ci-t').value=hhmm(t)};
A.ciConfirm=el=>{setPicker('ci-act',el.dataset.v);$('#ci-sg').hidden=true};A.ciNot=()=>{$('#ci-sg').hidden=true};
A.ciSave=()=>{const g=k=>{const v=pv('#ci-'+k);return v===''||v==null?null:+v};
 let ts=Date.now();if(!$('#ci-et').hidden){ts=atTime(k2t($('#ci-d').value),$('#ci-t').value);if(ts>Date.now()+6e4){toast('That time is in the future');return}}
 const c={id:uid(),ts,rec:Date.now(),mood:g('mood'),energy:g('energy'),focus:g('focus'),mot:g('mot'),feelings:mv('#feel-all'),stress:pv('#ci-stress')===''||pv('#ci-stress')==null?null:+pv('#ci-stress'),note:$('#ci-note').value.trim(),catId:pv('#ci-act')||null,trigger:$('#ci-trig').value.trim()};
 if(c.mood==null&&c.energy==null&&c.focus==null&&c.mot==null&&!c.feelings.length&&!c.note){toast('Add a rating, a feeling or a note');return}
 S.checkins.push(c);save();R.wdate=sod(ts);checkNotes();back();toast('Check-in saved')};

/* ----- event page ----- */
PAGES.event=()=>{const now=Date.now(),sg=suggest();
 return pageHdr('Log an event')+`<p class="muted small" style="margin:-4px 2px 12px">Something changed. Record it in your own words.</p>
 <div class="card"><div class="two"><div><label class="lbl" for="ev-d">Date</label><input class="inp" type="date" id="ev-d" value="${dk(now)}" max="${dk(now)}"></div><div><label class="lbl" for="ev-t">It happened</label><input class="inp" type="time" id="ev-t" value="${hhmm(now)}"></div></div><p class="muted small gap">Recorded ${fmtT(now)}</p></div>
 ${feelPicker('What did you feel?')}
 <div class="card"><h3>How strong? <span class="muted small" style="font-weight:500">Optional</span></h3><div class="scale" data-pick data-val="" id="ev-str">${['Mild','Some','Strong','Intense','Over-whelming'].map((n,i)=>`<button style="--mc:var(--w-mood)" data-a="pick" data-v="${(i+1)*2}">${n}</button>`).join('')}</div></div>
 <div class="card"><h3>What was happening?</h3>${sg?`<div class="note ok" id="ev-sg">${esc(catLabel(sg.catId))} was running.<div class="chips-w gap"><button class="chip sm on" data-a="evConfirm" data-v="${sg.catId}">Confirm</button><button class="chip sm" data-a="ciNot2">Not this</button></div></div><div class="sp"></div>`:''}${catPicker('ev-act',sg?sg.catId:'',{none:'Nothing specific'})}</div>
 <div class="card"><label class="lbl" for="ev-note">What happened? Your words</label><textarea class="inp" id="ev-note" placeholder="Describe it briefly"></textarea><label class="lbl">Do you think something contributed? Optional</label><div class="chips-w" id="ev-con">${['Hard question','Tired','Interrupted','Phone','Other'].map(x=>`<button class="chip" data-a="multi" data-v="${x}">${x}</button>`).join('')}</div><p class="muted small gap">Saved as your explanation. It is never shown as a proven cause.</p></div>
 <button class="btn" data-a="evSave">Save event</button>`};
A.evConfirm=el=>{setPicker('ev-act',el.dataset.v);$('#ev-sg').hidden=true};A.ciNot2=()=>{$('#ev-sg').hidden=true};
A.evSave=()=>{const ts=atTime(k2t($('#ev-d').value),$('#ev-t').value),f=mv('#feel-all'),n=$('#ev-note').value.trim();if(ts>Date.now()+6e4){toast('That time is in the future');return}if(!f.length&&!n){toast('Pick a feeling or write a note');return}
 S.events.push({id:uid(),ts,rec:Date.now(),feelings:f,strength:pv('#ev-str')?+pv('#ev-str'):null,note:n,catId:pv('#ev-act')||null,contrib:mv('#ev-con')});save();R.wdate=sod(ts);back();toast('Event saved')};

/* ----- sleep ----- */
function wSleep(){
 const ed=R.sleepEdit?S.sleep.find(s=>s.date===R.sleepEdit):null,td=today();let wd=ed?k2t(ed.date):td;
 const typ=S.sleep.slice(-1)[0],bedV=ed?hhmm(ed.bed):typ?hhmm(typ.bed):'23:30',wakeV=ed?hhmm(ed.wake):typ?hhmm(typ.wake):'06:45';if(!ed&&atTime(td,wakeV)>Date.now()+36e5)wd=addDays(td,-1);
 const q=ed?ed.q:null,rs=ed?ed.rest:null;
 const form=`<div class="card"><div class="row"><h3 style="margin:0">${ed?'Edit night':'Log sleep'}</h3><span class="muted small">${ed?fmtDate(wd):'Last night'}</span></div>
 <div class="two gap"><div><label class="lbl" for="sl-b">Fell asleep</label><input class="inp" type="time" id="sl-b" value="${bedV}" data-live="sl"></div><div><label class="lbl" for="sl-w">Woke up</label><input class="inp" type="time" id="sl-w" value="${wakeV}" data-live="sl"></div></div>
 <label class="lbl" for="sl-d">Night ending on</label><input class="inp" type="date" id="sl-d" value="${dk(wd)}" max="${dk(td)}">
 <p class="muted small gap" id="sl-dur"></p>
 <label class="lbl">Sleep quality</label><div class="scale" data-pick data-val="${q??''}" id="sl-q">${QL.map((n,i)=>`<button style="--mc:var(--w-sleep)" class="${q===(i+1)*2?'on':''}" data-a="pick" data-v="${(i+1)*2}">${n}</button>`).join('')}</div>
 <label class="lbl">How rested do you feel?</label><div class="scale" data-pick data-val="${rs??''}" id="sl-r">${RL.map((n,i)=>`<button style="--mc:var(--w-sleep)" class="${rs===(i+1)*2?'on':''}" data-a="pick" data-v="${(i+1)*2}">${n}</button>`).join('')}</div>
 <div class="row gap2"><div><b>Bedtime is approximate</b><div class="muted small">Marked with a ~ and kept apart from exact times.</div></div>${toggle('sl-ap',ed&&ed.approx,'slAp','Approximate bedtime')}</div>
 <div id="sl-gt" class="gap" ${ed&&ed.approx?'':'hidden'}><label class="lbl">Give or take</label>${stepper('sl-g',ed&&ed.gt||30,15,120,15,'min')}</div>
 <div class="${ed?'btns eq':''} gap2">${ed?'<button class="btn sec" data-a="slCancel">Cancel</button>':''}<button class="btn" data-a="slSave">${ed?'Save changes':'Save sleep'}</button></div></div>`;
 const nd=S.naps.filter(n=>dk(n.start)===dk(td));
 const naps=`<div class="card"><div class="row"><h3 style="margin:0">Naps</h3><span class="muted small">Today</span></div>${nd.length?`<div class="list gap">${nd.map(n=>`<div class="li"><span>${fmtT(n.start)} – ${fmtT(n.end)}</span><span class="v">${fmtD((n.end-n.start)/6e4)} <button class="link small" data-a="delNap" data-v="${n.id}" style="margin-left:8px">Delete</button></span></div>`).join('')}</div>`:''}<div class="two gap"><div><label class="lbl" for="np-s">Started</label><input class="inp" type="time" id="np-s" value="14:10"></div><div><label class="lbl" for="np-e">Ended</label><input class="inp" type="time" id="np-e" value="14:40"></div></div><button class="btn sec gap" data-a="napSave">Log a nap</button></div>`;
 const days=[...Array(7)].map((_,i)=>addDays(td,i-6)),nights=days.map(d=>S.sleep.find(s=>s.date===dk(d)));
 const bars=`<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;align-items:end;height:120px">${nights.map(n=>n?`<div style="height:${Math.min(100,sdur(n)/60/10*100)}%;border-radius:10px;background:linear-gradient(var(--w-focus),var(--w-sleep))" title="${fmtD(sdur(n))}"></div>`:`<div class="dash" style="height:60%;border-radius:10px"></div>`).join('')}</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-top:6px;text-align:center" class="muted tiny">${days.map(d=>`<span>${'SMTWTFS'[new Date(d).getDay()]}</span>`).join('')}</div>`;
 const rec=S.sleep.filter(s=>days.some(d=>dk(d)===s.date)),bm=rec.map(bedMin),wm=rec.map(wakeMin);
 const last7=`<div class="card"><div class="row"><h3 style="margin:0">Last 7 nights</h3><span class="muted small">Duration</span></div><div class="gap2">${bars}</div>${rec.length<7?`<p class="muted small gap">${7-rec.length} night${7-rec.length===1?'':'s'} not recorded. They stay blank and are not counted.</p>`:''}<div class="list gap"><div class="li"><span>Typical bedtime</span><span class="v">${rec.length>1?clock((avg(bm)+1080)%1440)+' ± '+Math.round(sdv(bm))+' min':'Needs 2+ nights'}</span></div><div class="li"><span>Typical wake time</span><span class="v">${rec.length>1?clock(avg(wm))+' ± '+Math.round(sdv(wm))+' min':'Needs 2+ nights'}</span></div></div>${rec.length?`<p class="muted small gap">Based on ${rec.length} recorded night${rec.length===1?'':'s'}.</p>`:''}</div>`;
 const hist=S.sleep.length?`<div class="card"><h3>Recorded nights</h3><div class="list">${S.sleep.slice(-8).reverse().map(n=>`<div class="li"><span>${fmtDate(k2t(n.date))}<small>${n.approx?'~':''}${fmtT(n.bed)} → ${fmtT(n.wake)} · quality ${n.q??'–'} · rested ${n.rest??'–'}</small></span><span class="v">${n.approx?'~':''}${fmtD(sdur(n))}</span></div><div class="chips-w" style="padding-bottom:12px"><button class="chip sm" data-a="slEdit" data-v="${n.date}">Edit</button><button class="chip sm" data-a="sheet" data-s="delnight" data-q='{"d":"${n.date}"}' style="color:var(--bad)">Delete night</button></div>`).join('')}</div></div>`:'';
 return form+naps+last7+hist}
SHEETS.delnight=P=>`<h2>Delete this night?</h2><p class="muted">${fmtDate(k2t(P.d))} is removed from sleep history. Averages and insights that used it are recalculated. This cannot be undone.</p><div class="btns eq"><button class="btn sec" data-a="close">Keep it</button><button class="btn dng" data-a="slDel" data-v="${P.d}">Delete</button></div>`;
A.slDel=el=>{S.sleep=S.sleep.filter(s=>s.date!==el.dataset.v);if(R.sleepEdit===el.dataset.v)R.sleepEdit=null;save();closeSheet();render()};
A.slEdit=el=>{R.sleepEdit=el.dataset.v;render(true)};A.slCancel=()=>{R.sleepEdit=null;render(true)};
A.slAp=el=>{$('#sl-gt').hidden=!el.dataset.val};
A.delNap=el=>{S.naps=S.naps.filter(n=>n.id!==el.dataset.v);save();render()};
A.napSave=()=>{const d=today(),s=atTime(d,$('#np-s').value),e=atTime(d,$('#np-e').value);if(!(e>s)){toast('End must be after start');return}S.naps.push({id:uid(),start:s,end:e});save();render();toast('Nap logged')};
A.slSave=()=>{const wd=k2t($('#sl-d').value),wake=atTime(wd,$('#sl-w').value);let bed=atTime(wd,$('#sl-b').value);if(bed>=wake)bed-=864e5;const d=(wake-bed)/6e4;
 if(d<30||d>16*60){toast('Check the times: that is '+fmtD(d));return}if(wake>Date.now()+36e5){toast('Wake time is in the future');return}
 const n={date:dk(wd),bed,wake,q:pv('#sl-q')?+pv('#sl-q'):null,rest:pv('#sl-r')?+pv('#sl-r'):null,approx:!!pv('#sl-ap'),gt:pv('#sl-ap')?+pv('#sl-g'):null};
 S.sleep=S.sleep.filter(s=>s.date!==n.date);S.sleep.push(n);S.sleep.sort((a,b)=>a.date<b.date?-1:1);R.sleepEdit=null;save();render();toast('Sleep saved · '+fmtD(d))};
function slLive(){const b=$('#sl-b'),w=$('#sl-w');if(!b||!w||!$('#sl-dur'))return;let d=tmin(w.value)-tmin(b.value);if(d<=0)d+=1440;$('#sl-dur').innerHTML=`Calculated duration: <b style="color:var(--fg)">${fmtD(d)}</b>${tmin(w.value)<=tmin(b.value)?' · crosses midnight':''}`}

/* ----- insights ----- */
function monthGrid(ref,cell){const d=new Date(ref),y=d.getFullYear(),m=d.getMonth(),first=new Date(y,m,1),lead=(first.getDay()+6)%7,n=new Date(y,m+1,0).getDate();
 let h=['MON','TUE','WED','THU','FRI','SAT','SUN'].map(x=>`<div class="h">${x}</div>`).join('')+'<span class="e"></span>'.repeat(lead);
 for(let i=1;i<=n;i++){const t=new Date(y,m,i).getTime();h+=cell(t,dk(t),i)}return `<div class="cal">${h}</div>`}
const monthNav=(f)=>{const d=new Date(R[f]);return `<div class="row" style="margin-bottom:12px"><b style="font-size:17px">${MONTHS[d.getMonth()]} ${d.getFullYear()}</b><div class="chips-w" style="gap:8px"><button class="back" data-a="mnav" data-f="${f}" data-d="-1" aria-label="Previous month">${I.back}</button><button class="back" data-a="mnav" data-f="${f}" data-d="1" aria-label="Next month">${I.next}</button></div></div>`};
A.mnav=el=>{const d=new Date(R[el.dataset.f]);d.setDate(1);d.setMonth(d.getMonth()+(+el.dataset.d));R[el.dataset.f]=d.getTime();render()};
function evLabel(n,insuff,k){if(S.fb[k]&&S.fb[k].v==='Accurate')return['User-confirmed interpretation','user'];if(insuff)return['Insufficient evidence',''];if(n===1)return['Single observation',''];if(n<8)return['Early pattern','early'];return['Repeated association','rep']}
function insights(){
 const out=[],by={};S.checkins.forEach(c=>(by[dk(c.ts)]=by[dk(c.ts)]||[]).push(c));
 const wm=(k,w,m)=>avg((by[k]||[]).filter(c=>winOf(new Date(c.ts).getHours())===w&&c[m]!=null).map(c=>c[m]));
 const rng=ks=>{const s=[...ks].sort();return s.length?fmtDate(k2t(s[0]),{day:'numeric',month:'short'})+(s.length>1?' – '+fmtDate(k2t(s[s.length-1]),{day:'numeric',month:'short'}):''):''};
 const push=o=>{const [lab,cls]=evLabel(o.n,o.insuff,o.id);out.push(Object.assign({lab,cls},o))};
 // 1 sleep quality vs morning energy
 let P=S.sleep.filter(s=>s.q!=null).map(s=>({k:s.date,a:s.q,b:wm(s.date,'Morning','energy')})).filter(p=>p.b!=null),hi=P.filter(p=>p.a>=8),lo=P.filter(p=>p.a<8);
 if(S.sleep.some(s=>s.q!=null)){const ins=P.length<3||!hi.length||!lo.length,A1=avg(hi.map(p=>p.b)),B1=avg(lo.map(p=>p.b));
  push({id:'sq-me',title:'Morning energy and sleep quality',n:P.length,insuff:ins,range:rng(P.map(p=>p.k)),text:ins?`Only ${P.length} night${P.length===1?'':'s'} ${P.length===1?'has':'have'} both a sleep rating and a morning energy rating, and they need to include better and lower-rated nights.`:`Morning energy averaged ${r1(A1)} after nights rated Good or better and ${r1(B1)} after the rest.`,
   rec:{head:['Date','Sleep quality','Morning energy','Used'],rows:P.map(p=>[fmtDate(k2t(p.k),{weekday:'short',day:'numeric'}),QL[p.a/2-1],r1(p.b),p.a>=8?'Good or better':'Under Good'])},
   method:['Took mornings with a sleep quality rating and a morning energy rating.',`Split them: Good or better (${hi.length}) and the rest (${lo.length}).`,`Compared average morning energy: ${r1(A1)} and ${r1(B1)}.`]})}
 // 2 sleep duration vs morning energy
 P=S.sleep.map(s=>({k:s.date,a:sdur(s)/60,b:wm(s.date,'Morning','energy')})).filter(p=>p.b!=null);hi=P.filter(p=>p.a>=7);lo=P.filter(p=>p.a<6);
 if(P.length){const ins=hi.length+lo.length<3||!hi.length||!lo.length;
  push({id:'sd-me',title:'Sleep length and morning energy',n:hi.length+lo.length,insuff:ins,range:rng(P.map(p=>p.k)),text:ins?`Not enough nights with both 7h+ and under 6h of sleep and a morning energy rating yet.`:`Morning energy averaged ${r1(avg(hi.map(p=>p.b)))} after 7h or more and ${r1(avg(lo.map(p=>p.b)))} after under 6h.`,
   rec:{head:['Date','Slept','Morning energy','Used'],rows:P.map(p=>[fmtDate(k2t(p.k),{weekday:'short',day:'numeric'}),fmtD(p.a*60),r1(p.b),p.a>=7?'7h+':p.a<6?'Under 6h':'Left out'])},
   method:['Took nights with a morning energy rating.','Grouped them: 7h or more, and under 6h. Nights in between are left out.','Compared the averages of each group.']})}
 // 3 afternoon vs morning
 const dd=Object.keys(by).map(k=>({k,m:wm(k,'Morning','energy'),a:wm(k,'Afternoon','energy')})).filter(d=>d.m!=null&&d.a!=null);
 if(dd.length){const low=dd.filter(d=>d.a<d.m).length,ins=dd.length<3;
  push({id:'pm-am',title:'Afternoon and morning energy',n:dd.length,insuff:ins,range:rng(dd.map(d=>d.k)),text:ins?`Only ${dd.length} day${dd.length===1?'':'s'} with both a morning and an afternoon energy rating.`:`Afternoon energy was lower than morning on ${low} of ${dd.length} days with both.`,
   rec:{head:['Date','Morning','Afternoon','Used'],rows:dd.map(d=>[fmtDate(k2t(d.k),{weekday:'short',day:'numeric'}),r1(d.m),r1(d.a),d.a<d.m?'Lower':d.a>d.m?'Higher':'Same'])},method:['Took days with energy rated in both windows.','Averaged each window per day.',`Counted days where the afternoon average was lower: ${low}.`]})}
 // 4 mood by time of day
 const W=['Morning','Afternoon','Evening','Night'].map(w=>{const a=S.checkins.filter(c=>c.mood!=null&&winOf(new Date(c.ts).getHours())===w).map(c=>c.mood);return{w,n:a.length,v:avg(a)}}).filter(x=>x.n>=2);
 if(W.length>=2){const s=[...W].sort((a,b)=>b.v-a.v),tn=W.reduce((a,x)=>a+x.n,0);
  push({id:'tod',title:'Mood through the day',n:tn,insuff:false,range:rng(Object.keys(by)),text:`Mood was highest in the ${s[0].w.toLowerCase()} (${r1(s[0].v)}) and lowest in the ${s[s.length-1].w.toLowerCase()} (${r1(s[s.length-1].v)}).`,
   rec:{head:['Window','Check-ins','Avg mood'],rows:W.map(x=>[x.w,x.n,r1(x.v)])},method:['Put each check-in with a mood rating into its time-of-day window.','Left out windows with fewer than 2 check-ins.','Compared the average mood of each window.']})}
 // 5 activity and mood
 const overall=avg(S.checkins.filter(c=>c.mood!=null).map(c=>c.mood)),G={};
 S.checkins.filter(c=>c.mood!=null).forEach(c=>{let id=c.catId;if(!id){const e=S.entries.find(e=>e.start<=c.ts&&e.end>=c.ts-60000);id=e&&e.catId}if(id)(G[id]=G[id]||[]).push({k:dk(c.ts),m:c.mood})});
 const gl=Object.keys(G).filter(id=>G[id].length>=2&&cat(id)).map(id=>({id,n:G[id].length,d:avg(G[id].map(x=>x.m))-overall}));
 if(gl.length){const s=[...gl].sort((a,b)=>b.d-a.d),top=s[0],bot=s[s.length-1],n=gl.reduce((a,x)=>a+x.n,0);
  push({id:'act',title:'What goes with your mood',n,insuff:false,range:rng(Object.keys(by)),text:(top.d>0?`Mood was higher around ${cat(top.id).name} (${top.d>0?'+':''}${r1(top.d)})`:`Mood was closest to your average around ${cat(top.id).name}`)+(bot.id!==top.id&&bot.d<0?` and lower around ${cat(bot.id).name} (${r1(bot.d)}).`:'.'),
   rec:{head:['Activity','Check-ins','Mood vs your average'],rows:s.map(x=>[cat(x.id).name,x.n,(x.d>0?'+':'')+r1(x.d)])},method:['Linked each mood check-in to the activity you confirmed, or the timer running at that time.','Left out activities with fewer than 2 check-ins.',`Compared each activity’s average mood with your overall average (${r1(overall)}).`]})}
 // 6 focus by subject
 const F={};S.entries.filter(e=>e.focus!=null&&cat(e.catId)).forEach(e=>(F[e.catId]=F[e.catId]||[]).push(e.focus));
 const fl=Object.keys(F).filter(id=>F[id].length>=2).map(id=>({id,n:F[id].length,v:avg(F[id])}));
 if(fl.length>=2){const s=[...fl].sort((a,b)=>b.v-a.v);push({id:'fsub',title:'Focus by subject',n:fl.reduce((a,x)=>a+x.n,0),insuff:false,range:'Rated sessions',text:`Focus was rated highest in ${cat(s[0].id).name} (${r1(s[0].v)}) and lowest in ${cat(s[s.length-1].id).name} (${r1(s[s.length-1].v)}).`,
  rec:{head:['Subject','Sessions','Avg focus'],rows:s.map(x=>[cat(x.id).name,x.n,r1(x.v)])},method:['Took sessions where you rated your focus.','Left out subjects with fewer than 2 rated sessions.','Compared the average rating of each subject.']})}
 return out}
A.calDay=el=>{R.wdate=+el.dataset.v;R.wtab='today';render(true)};A.unhide=()=>{S.hidden=[];save();render()};
PAGES.insight=P=>{const i=insights().find(x=>x.id===P.id);if(!i)return pageHdr('Insight')+'<div class="card empty"><b>Not available</b>This insight needs more records.</div>';const fb=S.fb[i.id]||{};
 return pageHdr('Insight')+`<div class="card"><h3>${esc(i.title)}</h3><span class="lab ${i.cls}">${i.lab}</span><p class="gap" style="font-size:16px">${esc(i.text)}</p><p class="muted small gap">${i.range?esc(i.range)+' · ':''}n = ${i.n} · A description of your records, not proof of cause.</p></div>
 <div class="card"><div class="row"><h3 style="margin:0">Records behind this</h3></div><div style="overflow-x:auto" class="gap"><table class="tbl"><thead><tr>${i.rec.head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${i.rec.rows.map(r=>`<tr>${r.map((c,j)=>`<td class="${j===0?'':'m'}">${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
 <div class="card"><h3>How it was worked out</h3><div class="list">${i.method.map((m,n)=>`<div class="li" style="align-items:flex-start"><span class="muted">${n+1}</span><span style="flex:1;font-weight:500">${esc(m)}</span></div>`).join('')}</div></div>
 <div class="card"><div class="row"><h3 style="margin:0">Other things that could explain it</h3></div><p class="muted small gap">Workload that day, the time you woke up, interruptions and how hard the day was. Your records cannot separate these yet.</p></div>
 <div class="card"><h3>What you think <span class="muted small" style="font-weight:500">Optional</span></h3><div class="chips-w" data-pick data-val="${esc(fb.v||'')}" id="fb-v">${['Accurate','Partly accurate','Not accurate','Need more data'].map(x=>`<button class="chip ${fb.v===x?'on':''}" data-a="pick" data-v="${x}">${x}</button>`).join('')}</div><label class="lbl" for="fb-n">Add my explanation</label><textarea class="inp" id="fb-n" placeholder="Your own words">${esc(fb.note||'')}</textarea><div class="col gap"><button class="btn" data-a="fbSave" data-v="${i.id}">Save my view</button><button class="btn sec" data-a="hideIns" data-v="${i.id}">Hide this insight</button></div></div>`};
A.fbSave=el=>{S.fb[el.dataset.v]={v:pv('#fb-v')||'',note:$('#fb-n').value.trim()};save();back();toast('Saved as your interpretation')};
A.hideIns=el=>{if(!S.hidden.includes(el.dataset.v))S.hidden.push(el.dataset.v);save();back()};

/* ----- wellbeing reports ----- */
const INC=[['sleep','Sleep'],['energy','Energy'],['focus','Focus'],['mot','Motivation'],['mood','Mood and feelings'],['activity','Activity context'],['tasks','Tasks and discipline'],['study','Study']];
function wdata(from,to){const ks=[];for(let t=from;t<=to;t=addDays(t,1))ks.push(dk(t));
 const cs=S.checkins.filter(c=>ks.includes(dk(c.ts))).sort((a,b)=>a.ts-b.ts),nights=S.sleep.filter(s=>ks.includes(s.date));
 const m={};MET.forEach(x=>{const a=cs.filter(c=>c[x.k]!=null).map(c=>c[x.k]);m[x.k]={v:avg(a),n:a.length}});
 const fe={};cs.forEach(c=>(c.feelings||[]).forEach(f=>fe[f]=(fe[f]||0)+1));
 const ac={};ks.forEach(k=>entriesOn(k,false).forEach(e=>ac[e.catId]=(ac[e.catId]||0)+mins(e)));
 let p=0,d=0;ks.forEach(k=>{const t=S.tasks[k];if(t){p+=t.planned;d+=t.done}});
 const tod={Morning:0,Afternoon:0,Evening:0,Night:0};cs.forEach(c=>tod[winOf(new Date(c.ts).getHours())]++);
 return{ks,cs,nights,m,fe:Object.entries(fe).sort((a,b)=>b[1]-a[1]).slice(0,5),ac:Object.entries(ac).sort((a,b)=>b[1]-a[1]),tasks:{p,d},tod,
  daysWith:new Set(cs.map(c=>dk(c.ts))).size,events:S.events.filter(e=>ks.includes(dk(e.ts))).sort((a,b)=>a.ts-b.ts),
  sl:{n:nights.length,dur:avg(nights.map(sdur)),q:avg(nights.filter(x=>x.q!=null).map(x=>x.q)),bm:nights.map(bedMin)},
  study:ks.reduce((a,k)=>a+grpMin(k,'Study',false),0)}}
function nextStep(D){if(D.sl.n>=3&&D.sl.dur<7*60)return 'Try keeping your bedtime within 30 minutes of the same time for 5 nights, then compare morning energy.';if(D.m.energy.n>=3&&D.m.energy.v<5)return 'Try one planned break in your lowest-energy window for a week, then compare energy.';if(D.cs.length<3)return 'Check in a few more times this week. Patterns need a few more days to show.';return 'Keep checking in at similar times of day so comparisons stay fair.'}
function reportBody(from,to,inc,cmp,title,sugg,kind){
 const D=wdata(from,to),single=from===to,sections=[],ptxt=[`${title}`];
 const sec=(t,r,body)=>{sections.push(`<div class="card"><div class="row"><h3 style="margin:0">${t}</h3><span class="muted small">${r||''}</span></div><div class="gap">${body}</div></div>`)};
 const li=(a,b)=>`<div class="li"><span class="muted">${a}</span><span class="v">${b}</span></div>`;
 sec('Data coverage',single?'This day':'',`<div class="list">${li('Days with check-ins',D.daysWith+' of '+D.ks.length)}${li('Nights recorded',D.sl.n+' of '+D.ks.length)}${kind==='monthly'?prevRow(from):''}</div>`);
 ptxt.push(`Days with check-ins: ${D.daysWith} of ${D.ks.length}`,`Nights recorded: ${D.sl.n} of ${D.ks.length}`);
 if(inc.sleep){sec('Sleep',D.sl.n?`n = ${D.sl.n} night${D.sl.n===1?'':'s'}`:'',D.sl.n?`<div class="list">${li(single?'Slept':'Average duration',fmtD(D.sl.dur))}${D.sl.bm.length?li('Typical bedtime',clock((avg(D.sl.bm)+1080)%1440)):''}${D.sl.q!=null?li('Average quality',r1(D.sl.q)+' / 10'):''}</div>`:`<p class="muted small">No sleep recorded in this period.</p>`);ptxt.push(D.sl.n?`Sleep: ${fmtD(D.sl.dur)} average over ${D.sl.n} nights`:'Sleep: none recorded')}
 const ms=MET.filter(x=>inc[x.k]&&x.k!=='mood').concat(inc.mood?[MET[0]]:[]);
 if(ms.length){const first=D.cs[0],last=D.cs[D.cs.length-1];
  sec(single?'Through the day':'Averages',single?D.cs.length+' check-in'+(D.cs.length===1?'':'s'):'',`<div class="tiles two">${ms.map(x=>{const a=D.m[x.k];let big,sub;if(single){const f=D.cs.find(c=>c[x.k]!=null),l=[...D.cs].reverse().find(c=>c[x.k]!=null);big=f?(f===l?f[x.k]:f[x.k]+' → '+l[x.k]):'–';sub=f?(f===l?'1 rating':fmtT(f.ts)+' to '+fmtT(l.ts)):'Not rated'}else{big=r1(a.v);sub=a.n?'n = '+a.n:'Not rated'}return `<div class="tile" style="padding:16px 8px"><small class="eyebrow" style="margin:0 0 6px">${x.n}</small><b style="color:${x.c}">${big}</b><small>${sub}</small></div>`}).join('')}</div>${!single?`<p class="muted small gap">Check-ins by time of day: morning ${D.tod.Morning}, afternoon ${D.tod.Afternoon}, evening ${D.tod.Evening}, night ${D.tod.Night}. ${Object.values(D.tod).some(v=>v===0)?'Uneven, so read with care.':''}</p>`:''}`);
  ptxt.push(...ms.map(x=>`${x.n}: ${single?(D.cs.filter(c=>c[x.k]!=null).map(c=>c[x.k]).join(' → ')||'not rated'):r1(D.m[x.k].v)+' (n='+D.m[x.k].n+')'}`))}
 if(kind==='monthly')monthlyExtras(from,to,D,sec);
 if(inc.mood){sec('Feelings','Most recorded',D.fe.length?`<div class="list">${D.fe.map(([f,n])=>li(f,n+(n===1?' time':' times'))).join('')}</div>`:'<p class="muted small">No feelings recorded.</p>');
  if(D.events.length)sec('Events',D.events.length+' recorded',`<div class="list">${D.events.map(e=>li(fmtDate(e.ts,{day:'numeric',month:'short'})+', '+fmtT(e.ts)+' · '+esc((e.feelings||[]).join(', ')),e.strength?'Intensity '+e.strength:'')).join('')}</div>${D.events.some(e=>e.note)?`<p class="muted small gap">Your note: “${esc(D.events.find(e=>e.note).note)}”</p>`:''}`);ptxt.push('Feelings: '+(D.fe.map(f=>f[0]+' '+f[1]).join(', ')||'none'))}
 if(inc.activity)sec('Activity and tasks','From your records',D.ac.length?`<div class="list">${D.ac.slice(0,5).map(([id,m])=>li(esc(catLabel(id)),fmtD(m))).join('')}</div>`:'<p class="muted small">No time tracked in this period.</p>');
 if(inc.tasks)sec('Tasks','',D.tasks.p?`<div class="list">${li('Completed of planned',D.tasks.d+' of '+D.tasks.p)}</div>`:'<p class="muted small">No tasks planned in this period.</p>');
 if(inc.study)sec('Study','',`<div class="list">${li('Study time',fmtD(D.study))}</div>`);
 if(cmp){const len=Math.round((to-from)/864e5)+1,pf=addDays(from,-len),pt=addDays(from,-1),Q=wdata(pf,pt);
  if(Q.daysWith!==D.daysWith)sections.push(`<div class="note warn" style="margin-bottom:12px">The previous period has ${Q.daysWith} of ${len} days with check-ins. This period has ${D.daysWith} of ${len}. Comparisons are made with care.</div>`);
  sec('Compared with previous period',Q.daysWith===D.daysWith?'':'Different coverage',`<div class="list">${li('Energy',r1(D.m.energy.v)+' vs '+r1(Q.m.energy.v))}${li('Mood',r1(D.m.mood.v)+' vs '+r1(Q.m.mood.v))}${li('Sleep',(D.sl.n?fmtD(D.sl.dur):'–')+' vs '+(Q.sl.n?fmtD(Q.sl.dur):'–'))}</div>`)}
 if(kind==='monthly'&&D.cs.length&&D.tod.Night<5)sec('Uncertain findings','',`<p class="muted small">Night check-ins are very few (n = ${D.tod.Night}), so nothing is said about nights. ${D.ks.length-D.daysWith} day${D.ks.length-D.daysWith===1?' has':'s have'} no check-ins.</p>`);
 const miss=[];if(D.daysWith<D.ks.length)miss.push(`${D.ks.length-D.daysWith} day${D.ks.length-D.daysWith===1?' has':'s have'} no check-ins.`);if(D.sl.n<D.ks.length)miss.push(`${D.ks.length-D.sl.n} night${D.ks.length-D.sl.n===1?' is':'s are'} not recorded.`);
 sec(single?'Missing data':'Limits',miss.length?'':'None',miss.length?`<p class="muted small">${miss.join(' ')} Patterns here are early.</p>`:'<p class="muted small">Every day and night in this period has a record.</p>');
 if(sugg){sec('One next step','If it fits',`<p style="font-size:16px">${nextStep(D)}</p>`);ptxt.push('Next step: '+nextStep(D))}
 return{html:sections.join(''),text:ptxt.join('\n')}}
function wReports(){
 const m=R.wrep,seg=`<div class="seg sm">${[['daily','Daily'],['weekly','Weekly'],['monthly','Monthly'],['custom','Custom']].map(([k,n])=>`<button class="${m===k?'on':''}" data-a="wrep" data-v="${k}">${n}</button>`).join('')}</div>`;
 if(m==='custom')return seg+customReport();
 const d=R.wrd;let from,to,label,step;
 if(m==='daily'){from=to=sod(d);label=fmtDate(d,{weekday:'short',day:'numeric',month:'short'})}
 else if(m==='weekly'){from=weekStart(d);to=addDays(from,6);label=fmtDate(from,{day:'numeric',month:'short'})+' – '+fmtDate(to,{day:'numeric',month:'short'})}
 else{const x=new Date(d);from=new Date(x.getFullYear(),x.getMonth(),1).getTime();to=new Date(x.getFullYear(),x.getMonth()+1,0).getTime();label=MONTHS[x.getMonth()]+' '+x.getFullYear()}
 const nav=`<div class="row" style="margin-bottom:12px"><button class="back" data-a="rnav" data-d="-1" aria-label="Previous">${I.back}</button><b>${label}</b><button class="back" data-a="rnav" data-d="1" aria-label="Next" ${to>=today()?'disabled style="opacity:.35"':''}>${I.next}</button></div>`;
 const inc={};INC.forEach(([k])=>inc[k]=true);
 return seg+nav+reportBody(from,Math.min(to,today()),inc,m!=='daily',label,true,m).html}
A.wrep=el=>{R.wrep=el.dataset.v;render()};
A.rnav=el=>{const m=R.wrep,d=+el.dataset.d,x=new Date(R.wrd);if(m==='daily')R.wrd=addDays(R.wrd,d);else if(m==='weekly')R.wrd=addDays(R.wrd,7*d);else{x.setDate(1);x.setMonth(x.getMonth()+d);R.wrd=x.getTime()}R.wrd=Math.min(R.wrd,today());render()};
function customReport(){const c=R.custom||(R.custom={from:addDays(today(),-6),to:today(),inc:Object.fromEntries(INC.map(([k])=>[k,true])),cmp:true,sugg:false,out:'view'});
 const form=`<div class="card"><h3>Period</h3><div class="chips-w" style="margin-bottom:12px"><button class="chip sm" data-a="cpre" data-v="7">Last 7 days</button><button class="chip sm" data-a="cpre" data-v="30">Last 30 days</button></div><div class="two"><div><label class="lbl" for="cr-f">From</label><input class="inp" type="date" id="cr-f" value="${dk(c.from)}" max="${dk(today())}"></div><div><label class="lbl" for="cr-t">To</label><input class="inp" type="date" id="cr-t" value="${dk(c.to)}" max="${dk(today())}"></div></div></div>
 <div class="card"><div class="row"><h3 style="margin:0">What to include</h3><span class="muted small">${INC.length} options</span></div><div class="list gap">${INC.map(([k,n])=>`<div class="li"><span>${n}</span>${toggle('cr-'+k,c.inc[k],'','Include '+n)}</div>`).join('')}</div><p class="muted small gap">Observation counts and data gaps are always included.</p></div>
 <div class="card"><div class="row"><h3 style="margin:0">Compare</h3><span class="muted small">Optional</span></div><div class="list gap"><div class="li"><span>With the previous equal period</span>${toggle('cr-cmp',c.cmp,'','Compare')}</div><div class="li"><span>Include suggestions</span>${toggle('cr-sg',c.sugg,'','Suggestions')}</div></div></div>
 <div class="card"><div class="row"><h3 style="margin:0">Output</h3><span class="muted small">Choose one</span></div><div class="chips-w gap" data-pick data-val="${c.out}" id="cr-out">${[['view','View here'],['copy','Copy as text']].map(([k,n])=>`<button class="chip ${c.out===k?'on':''}" data-a="pick" data-v="${k}">${n}</button>`).join('')}</div></div>
 <button class="btn" data-a="cmake" style="margin-bottom:12px">Create report</button>`;
 return form+(c.show?reportBody(c.from,c.to,c.inc,c.cmp,'Custom report',c.sugg).html:'')}
A.cpre=el=>{const c=R.custom;c.to=today();c.from=addDays(today(),-(+el.dataset.v-1));c.show=false;render()};
A.cmake=async()=>{const c=R.custom;let f=k2t($('#cr-f').value),t=k2t($('#cr-t').value);if(!(t>=f)){toast('The end date is before the start');return}if(t>today())t=today();
 c.from=f;c.to=t;c.inc=Object.fromEntries(INC.map(([k])=>[k,!!pv('#cr-'+k)]));c.cmp=!!pv('#cr-cmp');c.sugg=!!pv('#cr-sg');c.out=pv('#cr-out')||'view';
 const out=reportBody(f,t,c.inc,c.cmp,'Custom report',c.sugg);
 if(c.out==='copy'){try{await navigator.clipboard.writeText(out.text);toast('Report copied as text')}catch(e){c.show=true;render();toast('Copy blocked here. Showing the report instead.');return}c.show=false;render();return}
 c.show=true;render()};
