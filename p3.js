/* ===== Home, score, tasks slot, coins, streak, notifications, profile, history ===== */
function ringSvg(p,size,sw,col,inner){const r=(size-sw)/2,c=2*Math.PI*r,h=size/2;
 return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="var(--card2)" stroke-width="${sw}"/><circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${(c*clamp(p,0,1)).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${h} ${h})"/>${inner||''}</svg>`}
const ringTxt=(a,b)=>`<text x="50%" y="${b?'43%':'52%'}" text-anchor="middle" dominant-baseline="central" font-size="${String(a).length>2?30:36}" font-weight="800" fill="var(--fg)">${a}</text>${b?`<text x="50%" y="68%" text-anchor="middle" dominant-baseline="central" font-size="11" fill="var(--mute)">${b}</text>`:''}`;
const ago=t=>{const m=Math.floor((Date.now()-t)/6e4);return m<1?'just now':m<60?m+'m ago':m<1440?Math.floor(m/60)+'h ago':fmtDate(t)};
const dayNav=(f,label)=>`<div class="row" style="margin-bottom:12px"><button class="back" data-a="dnav" data-f="${f}" data-d="-1" aria-label="Previous day">${I.back}</button><b>${label}</b><button class="back" data-a="dnav" data-f="${f}" data-d="1" aria-label="Next day" ${R[f]>=today()?'disabled style="opacity:.35"':''}>${I.next}</button></div>`;
A.dnav=el=>{const f=el.dataset.f;R[f]=Math.min(today(),addDays(R[f],+el.dataset.d));render()};
const rowBtn=(t,sub,a,p,q)=>`<button class="li" data-a="${a}" ${p?`data-p="${p}"`:''} ${q?`data-q='${q}'`:''} style="width:100%"><span>${t}${sub?`<small>${sub}</small>`:''}</span>${I.chev}</button>`;

function scoreCard(k){
 const sc=score(k),isT=k===dk(today());
 const q=`data-a="go" data-p="score" data-q='{"k":"${k}"}' role="button" tabindex="0"`;
 if(sc.n==null)return `<div class="card row" ${q} style="gap:18px;cursor:pointer">${ringSvg(0,112,10,'var(--fg)',ringTxt('–','no score yet'))}<div style="min-width:0"><div class="eyebrow">${isT?'Today’s score':fmtDate(k2t(k),{weekday:'short',day:'numeric',month:'short'})}</div><h2 style="font-size:20px;line-height:1.2;margin:6px 0 8px">${isT?'Nothing scored yet.':'Nothing recorded for this day yet.'}</h2><p class="muted small">Plan a task or log time and the score will appear.</p></div></div>`;
 return `<div class="card row" ${q} style="gap:18px;cursor:pointer">${ringSvg(sc.n/100,112,10,'var(--fg)',ringTxt(sc.n,'of 100'))}<div style="min-width:0"><div class="eyebrow">${isT?'Today’s score':fmtDate(k2t(k))}</div><h2 style="font-size:20px;line-height:1.2;margin:6px 0 8px">${esc(sc.head)}</h2><div class="muted small col" style="gap:2px">${sc.parts.map(p=>`<span>${esc(p.name==='Time well spent'?'Time':p.name)} · ${esc(p.line)}</span>`).join('')}</div></div></div>`}
const metCol=(m,v)=>v==null?'var(--dim)':m.k==='mood'?'var(--mood)':m.k==='energy'?(v>=5?'var(--ok)':'var(--red)'):m.k==='focus'?'var(--fg)':'var(--info)';
const metFix=m=>m.k==='mood'?'var(--mood)':m.k==='energy'?'var(--ok)':m.k==='focus'?'var(--fg)':'var(--info)';
const SHORT={mood:'Mood',energy:'Energy',focus:'Focus',mot:'Motiv.'};
function wellCard(k,isT){
 const cs=S.checkins.filter(c=>dk(c.ts)===k).sort((a,b)=>a.ts-b.ts),l=cs[cs.length-1];
 const glow=(Math.min(streak(),30)/30).toFixed(2),dur=l&&l.energy!=null?(5.6-l.energy*.34).toFixed(1):'4.6';
 const sig=MET.map(m=>l?l[m.k]:'x').join(),go=R.barSig!==sig;R.barSig=sig;
 const col=(m,ci)=>{const v=l&&l[m.k]!=null?l[m.k]:null,n=v==null?0:lvl(v)+1,c=metCol(m,v);
  return `<div class="col" role="img" aria-label="${m.n}: ${v==null?'not logged':m.lab[lvl(v)]+', '+v+' of 10'}" style="--c:${c}"><div class="stack">${[0,1,2,3,4].map(i=>`<i class="${i<n?'f':''} ${i<n&&go?'in':''} ${i===n-1?'top':''}" style="--i:${i};--ci:${ci}"></i>`).join('')}</div><span class="n">${SHORT[m.k]}</span></div>`};
 return `<div class="card"><div class="row"><h3 style="margin:0">Wellbeing</h3><span class="muted small">${l?(isT?'Last check-in '+ago(l.ts):cs.length+' check-in'+(cs.length>1?'s':'')):'No check-in yet'}</span></div>
 <div class="row gap2" style="gap:14px;align-items:center"><div class="orb" style="--oc:${l&&l.mood!=null?'var(--mood)':'var(--dim)'};--glow:${glow};--dur:${dur}s" role="img" aria-label="Companion orb"></div><div class="cols cmp" style="flex:1;min-width:0">${MET.map(col).join('')}</div></div>
 ${isT?`<button class="btn gap2" data-a="go" data-p="checkin">Check in now</button>`:''}</div>`}
/* ----- trend card ----- */
function dayAvg(k,mk){const v=S.checkins.filter(c=>dk(c.ts)===k&&c[mk]!=null).map(c=>c[mk]);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null}
function curvePath(p){if(p.length<2)return '';const n=p.length,dx=[],m=[],t=[];for(let i=0;i<n-1;i++){dx.push(p[i+1][0]-p[i][0]);m.push((p[i+1][1]-p[i][1])/dx[i])}
 t.push(m[0]);for(let i=1;i<n-1;i++)t.push(m[i-1]*m[i]<=0?0:(m[i-1]+m[i])/2);t.push(m[n-2]);
 for(let i=0;i<n-1;i++){if(m[i]===0){t[i]=0;t[i+1]=0}else{const a=t[i]/m[i],b=t[i+1]/m[i],h=Math.hypot(a,b);if(h>3){t[i]=3*a/h*m[i];t[i+1]=3*b/h*m[i]}}}
 let d='M'+p[0][0].toFixed(1)+' '+p[0][1].toFixed(1);for(let i=0;i<n-1;i++){const h=dx[i]/3;d+=` C${(p[i][0]+h).toFixed(1)} ${(p[i][1]+t[i]*h).toFixed(1)} ${(p[i+1][0]-h).toFixed(1)} ${(p[i+1][1]-t[i+1]*h).toFixed(1)} ${p[i+1][0].toFixed(1)} ${p[i+1][1].toFixed(1)}`}return d}
function trendCard(k,isT){const mk=R.trendM||'all',all=mk==='all',m=all?MET[0]:MET.find(x=>x.k===mk),end=k2t(k);
 const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
 const ser=x=>[0,1,2,3,4,5,6].map(i=>{const t=addDays(end,i-6);return {t,v:dayAvg(dk(t),x.k)}});
 const chg=x=>{const c=ser(x).filter(d=>d.v!=null).map(d=>d.v),p=[7,8,9,10,11,12,13].map(i=>dayAvg(dk(addDays(end,-i)),x.k)).filter(v=>v!=null);return c.length&&p.length?avg(c)-avg(p):null};
 let delta='<span class="delta">Log a few more days to see change</span>';
 if(all){let best=null;MET.forEach(x=>{const d=chg(x);if(d!=null&&(best==null||Math.abs(d)>Math.abs(best.d)))best={x,d}});
  if(best)delta=Math.abs(best.d)<.3?'<span class="delta">All four steady vs last week</span>':`<span class="delta ${best.d>0?'up':'dn'}">${best.d>0?'▲ ':'▼ '}Biggest change: ${best.x.n} ${best.d>0?'up':'down'} ${Math.abs(best.d).toFixed(1)}</span>`}
 else{const d=chg(m);if(d!=null){const a=Math.abs(d)<.3;delta=`<span class="delta ${a?'':d>0?'up':'dn'}">${a?'■ '+m.n+' steady vs last week':(d>0?'▲ ':'▼ ')+m.n+(d>0?' up ':' down ')+Math.abs(d).toFixed(1)+' vs last week'}</span>`}}
 const cd=S.checkins.filter(c=>dk(c.ts)===k).sort((a,b)=>a.ts-b.ts),l=cd[cd.length-1];
 let head='No check-in yet',sub=isT?'Check in above and your day appears here.':'Nothing was logged on this day.';
 if(l&&l.mood!=null){head=MET[0].lab[lvl(l.mood)];const sfx=l.focus!=null&&l.focus>=7?'with '+MET[2].lab[lvl(l.focus)].toLowerCase()+' focus':l.energy!=null&&l.energy<5?'with low energy':l.mot!=null&&l.mot>=7?'and '+MET[3].lab[lvl(l.mot)].toLowerCase():'';head+=sfx?', '+sfx:'';sub=''}
 const W=320,H=150,L=30,Rr=12,T=14,B=30,X=i=>L+i*(W-L-Rr)/6,Y=v=>T+(1-v/10)*(H-T-B);
 const dl=[0,1,2,3,4,5,6].map(i=>addDays(end,i-6));
 const lines=(all?MET:[m]).map(x=>{const d=ser(x),have=d.filter(z=>z.v!=null),last=have[have.length-1],fix=all?metFix(x):(last?metCol(x,last.v):'var(--dim)');
  const segs=[];let c2=[];d.forEach((z,i)=>{if(z.v==null){if(c2.length)segs.push(c2);c2=[]}else c2.push([X(i),Y(z.v)])});if(c2.length)segs.push(c2);
  const gid='tg'+x.k,multi=segs.filter(s=>s.length>1);
  const area=all?'':multi.map(s=>`<path d="${curvePath(s)} L${s[s.length-1][0].toFixed(1)} ${Y(0)} L${s[0][0].toFixed(1)} ${Y(0)}Z" fill="url(#${gid})"/>`).join('');
  const line=multi.map(s=>`<path class="ln" pathLength="1" d="${curvePath(s)}" fill="none" stroke="${fix}" stroke-width="${all?2.4:3.2}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const dots=all?'':d.map((z,i)=>z.v==null||z===last?'':`<circle cx="${X(i)}" cy="${Y(z.v)}" r="3.6" fill="${metCol(x,z.v)}" stroke="var(--card)" stroke-width="2"/>`).join('');
  let end2='';if(last){const li=d.indexOf(last),px=X(li),py=Y(last.v);
   end2=all?`<circle cx="${px}" cy="${py}" r="4.6" fill="${fix}" stroke="var(--card)" stroke-width="2"/>`:`<line x1="${px}" y1="${py}" x2="${px}" y2="${Y(0)}" stroke="${fix}" stroke-width="1.5" stroke-dasharray="3 4" opacity=".55"/><circle cx="${px}" cy="${py}" r="9" fill="${fix}" opacity=".22"/><circle cx="${px}" cy="${py}" r="5.2" fill="${fix}" stroke="var(--card)" stroke-width="2.5"/><g transform="translate(${Math.min(Math.max(px,L+14),W-Rr-14)} ${Math.max(py-26,2)})"><rect x="-17" y="-2" width="34" height="20" rx="10" fill="${fix}"/><text x="0" y="12.5" text-anchor="middle" font-size="11.5" font-weight="800" fill="${x.k==='focus'?'var(--bg)':'#0a0a0a'}">${Math.round(last.v*10)/10}</text></g>`}
  return {def:all?'':`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${fix};stop-opacity:.34"/><stop offset="1" style="stop-color:${fix};stop-opacity:0"/></linearGradient>`,body:area+line+dots+end2,have:have.length}}).reduce((a,x)=>({def:a.def+x.def,body:a.body+x.body,have:a.have+x.have}),{def:'',body:'',have:0});
 const grid=[0,5,10].map(v=>`<line x1="${L}" y1="${Y(v)}" x2="${W-Rr}" y2="${Y(v)}" stroke="var(--line)" stroke-width="1" ${v===5?'stroke-dasharray="4 5"':''}/><text x="${L-8}" y="${Y(v)+4}" text-anchor="end" font-size="10.5" fill="var(--mute)">${v}</text>`).join('');
 const lab=dl.map((t,i)=>`<text x="${X(i)}" y="${H-8}" text-anchor="middle" font-size="11" ${t===end?'font-weight="800" fill="var(--fg)"':'fill="var(--mute)"'}>${t===end&&isT?'Today':new Date(t).toLocaleDateString('en-US',{weekday:'short'}).slice(0,3)}</text>`).join('');
 const empty=lines.have?'':`<text x="${W/2}" y="${H/2-4}" text-anchor="middle" font-size="13" fill="var(--mute)">No check-ins in the last 7 days</text>`;
 const lc1=all?'var(--fg)':(()=>{const d=ser(m).filter(z=>z.v!=null);return d.length?metCol(m,d[d.length-1].v):'var(--dim)'})();
 const pick=`<button class="chip sm ${all?'on':''}" data-a="trendM" data-v="all"><span class="tdots"><i style="background:var(--mood)"></i><i style="background:var(--ok)"></i><i style="background:var(--fg)"></i><i style="background:var(--info)"></i></span>All</button>`+MET.map(x=>`<button class="chip sm ${x.k===mk?'on':''}" data-a="trendM" data-v="${x.k}"><i class="tdot" style="background:${metFix(x)}"></i>${x.n}</button>`).join('');
 return `<div class="card trend"><div class="eyebrow">How you are doing</div><div class="tbig">${esc(head)}</div>${sub?`<p class="muted small" style="margin:4px 0 0">${sub}</p>`:''}<div style="margin-top:8px">${delta}</div>
 <div class="tpick">${pick}</div>
 <svg class="spark ${R.trAnim?'draw':''}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${all?'All four metrics':m.n} over the last 7 days"><defs>${lines.def}</defs>${grid}${lines.body}${lab}${empty}</svg></div>`}
A.trendM=el=>{R.trendM=el.dataset.v;R.trAnim=1;render();R.trAnim=0};
TABS.home=()=>{const k=dk(R.sel),isT=R.sel===today();
 return (isT?'':`<div class="center" style="margin-bottom:12px"><button class="chip" data-a="today">← Back to today</button></div>`)+`<div data-t="score">${scoreCard(k)}</div>`+wellCard(k,isT)+trendCard(k,isT)+(isT?timerCard():'')};
A.stop=()=>stopRun();

/* ----- score detail ----- */
PAGES.score=P=>{const k=P.k||dk(today()),sc=score(k),W=S.weights,all=[['tasks','Tasks',W.tasks],['study','Study',W.study],['time','Time well spent',W.time]];
 const head=sc.n==null?`<div class="card row" style="gap:16px">${ringSvg(0,96,9,'var(--fg)',ringTxt('–'))}<div><h2 style="font-size:20px">No score yet</h2><p class="muted small">${fmtDate(k2t(k))}</p></div></div>`:`<div class="card row" style="gap:16px">${ringSvg(sc.n/100,96,9,'var(--fg)',ringTxt(sc.n,'of 100'))}<div><h2 style="font-size:20px;line-height:1.2">${esc(sc.head)}</h2><p class="muted small" style="margin-top:6px">${fmtDate(k2t(k))}</p></div></div>`;
 const cards=all.map(([id,n,w])=>{const p=sc.parts.find(x=>x.id===id),col={tasks:'var(--ok)',study:'var(--warn)',time:'var(--info)'}[id];
  if(!p)return `<div class="card" style="opacity:.7"><div class="row"><h3 style="margin:0">${n}</h3><span class="muted small">${w}% of score</span></div><p class="muted small gap">No data for this part, so it is left out and the rest are scaled up.</p></div>`;
  const pct=Math.round(p.r*100);return `<div class="card"><div class="row"><h3 style="margin:0">${n}</h3><span class="muted small">${w}% of score</span></div><div class="row gap"><span class="muted">${esc(p.line)}</span><b>${pct}% → ${Math.round(p.r*w)} of ${w}</b></div><div class="bar gap"><i style="width:${pct}%;background:${col}"></i></div></div>`}).join('');
 return pageHdr('Today’s score')+head+cards+`<div class="card"><h3>How it works</h3><p class="muted small">If a part has no data, such as no tasks planned, it is left out and the rest are scaled up. Missing data is never counted as zero. The score describes one day only. It says nothing about you as a person.</p><button class="btn sec gap" data-a="sheet" data-s="weights">Change the weights</button></div>`};
SHEETS.weights=()=>{const W=S.weights;return `<h2>Score weights</h2><label class="lbl">Tasks</label>${stepper('w-t',W.tasks,0,100,5,'','wchk')}<label class="lbl">Study</label>${stepper('w-s',W.study,0,100,5,'','wchk')}<label class="lbl">Time well spent</label>${stepper('w-m',W.time,0,100,5,'','wchk')}<p class="small muted gap" id="wmsg">Total ${W.tasks+W.study+W.time} of 100</p><div class="btns"><button class="btn sec" data-a="close">Cancel</button><button class="btn" data-a="saveW">Save</button></div>`};
A.wchk=()=>{const t=+pv('#w-t')+ +pv('#w-s')+ +pv('#w-m');$('#wmsg').textContent='Total '+t+' of 100'};
A.saveW=()=>{const a=+pv('#w-t'),b=+pv('#w-s'),c=+pv('#w-m');if(a+b+c!==100){toast('Weights must add up to 100');return}S.weights={tasks:a,study:b,time:c};save();closeSheet();render();toast('Weights saved')};

/* ----- tasks tab slot (the real Tasks tab merges in here) ----- */
TABS.tasks=()=>{const k=dk(today()),t=S.tasks[k]||{planned:0,done:0};
 if(window.Mindspace.renderTasks)return window.Mindspace.renderTasks();
 return `<div class="card"><div class="eyebrow">Merge slot</div><h3 style="margin-top:6px">Your Tasks tab goes here</h3><p class="muted small">The Tasks tab is built separately and merges in later. It talks to the rest of the app through <b>Mindspace.completeTask()</b>, <b>Mindspace.undoTask()</b> and <b>Mindspace.setTasks(date, planned, done)</b>. Each completed task earns 1 coin and feeds the score, streak and reports.</p></div>
 <div class="card"><h3>Preview controls</h3><div class="tiles two"><div class="tile"><b>${t.done}</b><small>done today</small></div><div class="tile"><b>${t.planned}</b><small>planned today</small></div></div><label class="lbl" for="tp">Priority</label><select class="sel" id="tp"><option>High</option><option selected>Medium</option><option>Low</option></select><div class="col gap"><button class="btn sec" data-a="tplan">Plan a task</button><button class="btn" data-a="tdone">Complete a task (+1 coin)</button><button class="btn sec" data-a="tcancel">Cancel a planned task</button><button class="btn sec" data-a="tundo">Undo last completion</button></div></div>`};
const tprio=()=>($('#tp')||{}).value||'Medium';
A.tplan=()=>{const k=dk(today());const t=S.tasks[k]||(S.tasks[k]={planned:0,done:0});const p=tprio();t.planned++;const pr=t.pri||(t.pri={});(pr[p]||(pr[p]=[0,0]))[1]++;save();render()};
A.tcancel=()=>{const k=dk(today());const t=S.tasks[k]||(S.tasks[k]={planned:0,done:0});t.planned++;const st=t.st||(t.st={});st.Cancelled=(st.Cancelled||0)+1;save();render()};
A.tdone=()=>window.Mindspace.completeTask({title:'Preview task',priority:tprio()});
A.tundo=()=>window.Mindspace.undoTask();

/* ----- coins ----- */
SHEETS.coin=()=>`<div class="center"><div class="coinbig" aria-hidden="true">M</div><div class="big">${bal()}</div><div class="muted small" style="margin-top:2px">coins</div></div>
 <div class="card gap2" style="margin-bottom:0"><div class="list"><div class="li"><span class="muted">Total earned</span><span class="v">${earned()}</span></div><div class="li"><span class="muted">Total spent</span><span class="v">${spent()}</span></div></div></div>
 <div class="eyebrow gap2" style="margin-bottom:6px">Recent</div>
 ${S.coinLog.length?`<div class="list">${S.coinLog.slice(-3).reverse().map(c=>`<div class="li"><span>${esc(c.label)}</span><span class="v">${c.amt>0?'+':''}${c.amt}</span></div>`).join('')}</div>`:`<p class="muted small">Complete a task to earn your first coin.</p>`}
 <button class="btn sec gap" data-a="gems">Rewards and gems</button><div class="btns eq"><button class="btn sec" data-a="go" data-p="streak">Streak</button><button class="btn" data-a="store">Open store</button></div>`;
A.store=()=>{if(window.Mindspace._openStore){closeSheet();window.Mindspace._openStore()}else go('store')};
PAGES.store=()=>pageHdr('Store')+`<div class="card center"><div class="coinbig" aria-hidden="true">M</div><div class="big">${bal()}</div><p class="muted small">coins to spend</p></div><div class="card"><div class="eyebrow">Merge slot</div><h3 style="margin-top:6px">Character store goes here</h3><p class="muted small">Your finished store merges into this page. It spends coins with <b>Mindspace.spendCoins(price, name)</b> and sets the Home companion with <b>Mindspace.setCompanion(id)</b>.</p></div>`;

/* ----- streak ----- */
PAGES.streak=()=>{const st=streak(),ms=[7,14,30,50,100,365],nx=ms.find(m=>m>st);
 return pageHdr('Streak')+`<p class="muted small" style="margin:0 2px 12px">Finish a task or log time to keep it going.</p>
 <div class="card"><div class="eyebrow">Current streak</div><div style="margin:8px 0 14px"><span class="big" style="font-size:76px">${st}</span> <span class="muted" style="font-size:22px;font-weight:600">day${st===1?'':'s'}</span></div>
 <div class="list"><div class="li"><span>${nx?`Next: ${nx}-day streak`:'Every milestone reached'}</span><span class="v" style="color:var(--flame)">${nx?nx-st+' to go':''}</span></div><div class="li"><span>Timed streak<small>Days you tracked time with the timer.</small></span><span class="v">${timedStreak()}</span></div><div class="li"><span>Longest streak</span><span class="v">${longestStreak()}</span></div></div></div>
 <div class="card"><div class="eyebrow">Firewood</div><h2 style="font-size:26px;margin:6px 0">${S.fw.have} in the bank</h2><p class="muted small">Firewood keeps a streak alive on a day you miss. Finish all tasks in a week to earn more. You can hold up to 3.</p></div>
 <div class="card"><div class="eyebrow">Coins</div><div class="big" style="margin:6px 0 2px">${bal()}</div><p class="muted small">Total earned ${earned()} · Total spent ${spent()}</p>
 ${S.coinLog.length?`<div class="list gap">${S.coinLog.slice(-20).reverse().map(c=>`<div class="li"><span>${esc(c.label)}<small>${fmtDate(c.ts)}, ${fmtT(c.ts)}</small></span><span class="v">${c.amt>0?'+':''}${c.amt}</span></div>`).join('')}</div>`:''}
 <button class="btn sec gap2" data-a="gems">Rewards and gems</button><button class="btn gap" data-a="store">Open store</button></div>`};

/* ----- notifications ----- */
const NT={rem:['!','var(--w-mot)','Reminder'],imp:['⏱','#f0a05a','Important'],prog:['★','var(--ok)','Progress']};
PAGES.notes=()=>{const f=R.nf||'All';const L=S.notes.filter(n=>f==='All'||n.type===f);const td=today();
 const row=n=>{const [ic,col,tn]=NT[n.type]||NT.rem;return `<div class="trow" style="grid-template-columns:auto 1fr auto;align-items:flex-start"><span class="ntf" style="background:${col}">${ic}</span><div><b>${esc(n.title)}</b><div class="muted small">${fmtT(n.ts)} · ${tn}</div>${n.key&&n.key.startsWith('nochk')?`<button class="btn sm gap" data-a="go" data-p="checkin">Check in</button>`:''}</div>${n.read?'':'<i style="width:8px;height:8px;border-radius:50%;background:var(--bad);margin-top:8px"></i>'}</div>`};
 const t=L.filter(n=>n.ts>=td),e=L.filter(n=>n.ts<td);
 return pageHdr('Notifications')+`<div class="chips-w" style="margin-bottom:12px">${[['All','All'],['rem','Reminders'],['imp','Important'],['prog','Progress']].map(([k,n])=>`<button class="chip ${f===k?'on':''}" data-a="nf" data-v="${k}">${n}</button>`).join('')}</div>`+
 (L.length?(t.length?`<div class="card"><div class="eyebrow">Today</div>${t.map(row).join('')}</div>`:'')+(e.length?`<div class="card"><div class="eyebrow">Earlier</div>${e.map(row).join('')}</div>`:''):`<div class="card empty"><b>All quiet</b>Reminders and progress notices show up here.</div>`)+
 `<div class="btns eq"><button class="btn sec" data-a="clearNotes">Clear all</button><button class="btn" data-a="readNotes">Mark all read</button></div>`};
A.nf=el=>{R.nf=el.dataset.v;render()};A.readNotes=()=>{S.notes.forEach(n=>n.read=true);save();render()};A.clearNotes=()=>{S.notes=[];save();render()};

/* ----- profile, appearance, data ----- */
PAGES.profile=()=>pageHdr('Profile')+`
 <div class="card row" style="gap:14px"><button class="row" data-a="sheet" data-s="name" style="gap:14px;flex:1;min-width:0"><span class="logo" style="width:60px;height:60px;border-radius:18px">${I.logo}</span><span style="min-width:0"><b style="font-size:20px">${esc(S.name||'Your name')}</b><small class="muted" style="display:block">${storageOk?'Data stays on this phone':'Storage is blocked here, so data lasts only while this page is open'}</small></span></button></div>
 <div class="card"><div class="list">${rowBtn('History','Time, tasks and mood records','go','history')}${rowBtn('Streak and rewards','Streak, firewood, coins','go','streak')}${rowBtn('Notifications','Reminders and notices','go','notes')}${rowBtn('Settings','Timer, reminders, sleep, security, data','go','settings')}</div></div>
 <div class="card"><div class="list"><div class="li"><span>Sound effects</span>${toggle('snd',S.ui.sound,'setSound','Sound effects')}</div>${rowBtn('Appearance','Colour style and theme','go','appearance')}${rowBtn('Export data','Copy a full backup','go','export')}${rowBtn('Import backup','Paste a backup to restore','go','import')}</div></div>
 <button class="btn sec" data-a="sheet" data-s="sample" style="margin-bottom:12px">Load sample data</button>
 <button class="btn dng" data-a="sheet" data-s="wipe">Delete local data</button>`;
function loadSample(){
 const td=today();const S2=defaults();S2.v=3;
 const rnd=(a,b)=>Math.round(a+Math.random()*(b-a));
 for(let i=11;i>=0;i--){const d=addDays(td,-i),k=dk(d);
  // sleep
  const q=[4,6,8,10,8,6][i%6];const bed=atTime(d,'23:15')-864e5+rnd(0,40)*6e4,wake=atTime(d,'06:'+(30+rnd(0,25)));
  if(i%5!==3)S2.sleep.push({date:k,bed,wake,q,rest:q,approx:i%4===0,gt:i%4===0?30:null});
  // checkins
  [['08:10',0],['12:30',1],['15:40',2],['20:00',3]].forEach(([t,j])=>{if(i===0&&j>0&&new Date().getHours()<12)return;if(i>0&&(i+j)%7===0)return;
   const m=clamp(rnd(3,9)+(j===0?1:0),0,10);S2.checkins.push({id:uid(),ts:atTime(d,t),rec:atTime(d,t),mood:m,energy:clamp((j===0?6:4)+(q>=8?1:-1)+rnd(-1,1),0,10),focus:rnd(4,9),mot:j<2?rnd(4,8):null,feelings:j%2?['Tired','Focused']:['Calm','Hopeful'],note:'',catId:null})});
  // entries
  [['09:00','11:30','college-college'],['15:05','16:20','study-maths'],['16:30','17:10','study-physics'],['18:00','18:40','wasted-scrolling'],['07:00','07:35','health-exercise']].forEach(([a,b,c],n)=>{if(i===0&&atTime(d,b)>Date.now())return;S2.entries.push({id:uid(),catId:c,start:atTime(d,a),end:atTime(d,b),src:n%2?'timer':'manual',focus:c.startsWith('study')?rnd(4,9):undefined})});
  const dn=i%3===0?5:rnd(2,4);S2.tasks[k]={planned:5,done:dn,pri:{High:[Math.min(dn,2),2],Medium:[Math.max(0,dn-2),2],Low:[0,1]},st:{Completed:dn,Partial:1,Cancelled:i%4===0?1:0,Delayed:i%5===0?1:0}};
  if(i>0)S2.plan.push({id:uid(),day:k,catId:'study-maths',s:15*60,e:16*60});
 }
 S2.coinLog=[{id:'a',ts:Date.now()-9e6,amt:38,label:'Task completed'}];
 S2.studyTarget=480;S2.cats.find(c=>c.id==='study-maths').goal=120;S2.exam={name:'Board exam',date:dk(addDays(td,41))};
 S2.fw.have=2;S2.fw.lastCheck=dk(addDays(td,-1));
 S2.events.push({id:'e1',ts:atTime(addDays(td,-1),'17:10'),rec:Date.now(),feelings:['Frustrated'],strength:6,note:'Could not solve Q7.'});
 S2.naps.push({id:'n1',start:atTime(td,'01:10'),end:atTime(td,'01:40')});
 

S2.tk=TKD();S2.tkCancel={};let nid=100;const TT=[['Daily update','My tasks',2],['Revise Physics formulas','Study',3],['Solve 15 algebra problems','Study',2],['Read 10 pages','My tasks',1],['Finish units and dimensions','Study',3],['Evening walk','My tasks',1]];
 for(let i=11;i>=-3;i--){const d=addDays(td,-i),k=dk(d),n=i<0?2:i===0?5:4+(i%2);for(let j=0;j<n;j++){const [title,list,pri]=TT[(i+j+12)%TT.length];const done=i>0?(j<n-(i%4===0?1:0)):i===0?j<2:false;S2.tk.tasks.push({id:nid++,title,date:k,time:j%2?'18:00':undefined,list,study:list==='Study',pri,done,doneAt:done?atTime(d,'19:'+String(10+j*5)):undefined,rep:false})}}
 S2.tk.nextId=nid;S2.tk.tasksDone=S2.tk.tasks.filter(t=>t.done).length;S2.tkCancel[dk(addDays(td,-2))]=1;deriveTasks(S2);
 S2.ui=S.ui;S2.settings=S.settings;S2.name=S.name||'Sumit';S2.tab='home';S=S2;S.sample=true;resetTkFrame();save();flush&&flush();R.sel=today();R.wk=weekStart(R.sel);R.stack=[];R.page=null;applyUI();render(true);toast('Sample data loaded')}
A.sample=()=>{closeSheet();loadSample()};
SHEETS.sample=()=>`<h2>Load sample data?</h2><p class="muted">This replaces everything currently in the app with 12 days of made-up tasks, time, check-ins and sleep, so you can see how it looks with data. You can delete it afterwards with Delete local data.</p><div class="btns eq"><button class="btn sec" data-a="close">Cancel</button><button class="btn" data-a="sample">Load</button></div>`;

A.setSound=el=>{S.ui.sound=!!el.dataset.val;save();if(S.ui.sound)chime()};
SHEETS.name=()=>`<h2>Your name</h2><input class="inp" id="nm" maxlength="40" value="${esc(S.name)}" placeholder="Your name" autocomplete="off"><div class="btns"><button class="btn sec" data-a="close">Cancel</button><button class="btn" data-a="saveName">Save</button></div>`;
A.saveName=()=>{S.name=$('#nm').value.trim();save();closeSheet();render()};
SHEETS.wipe=()=>`<h2>Delete all local data?</h2><p class="muted">Tasks, time, check-ins, sleep, coins and settings on this phone are removed. This cannot be undone. Export a backup first if you might want it back.</p><div class="btns eq"><button class="btn sec" data-a="close">Keep it</button><button class="btn dng" data-a="wipe">Delete</button></div>`;
A.wipe=()=>{try{localStorage.removeItem(KEY)}catch(e){}S=defaults();applyUI();R.stack=[];R.page=null;R.sheet=null;R.sel=today();R.wk=weekStart(R.sel);render(true);toast('Local data deleted')};
function applyUI(){const r=document.documentElement;S.ui.style='b';r.dataset.ui='b';if(S.ui.theme==='system')delete r.dataset.theme;else r.dataset.theme=S.ui.theme}
const UIV={a:'--pri:var(--emerald);--pri-fg:var(--emerald-fg);--tog:var(--emerald);--dng-bg:var(--brick);--dng-fg:#fff;--dng-bd:transparent',b:'--pri:var(--fg);--pri-fg:var(--bg);--tog:var(--red);--dng-bg:var(--red);--dng-fg:#fff;--dng-bd:transparent',c:'--pri:var(--emerald);--pri-fg:var(--emerald-fg);--tog:var(--emerald);--dng-bg:transparent;--dng-fg:var(--emerald);--dng-bd:var(--emerald)'};
PAGES.appearance=()=>pageHdr('Appearance')+`<div class="eyebrow" style="margin:6px 2px 8px">Theme</div><div class="seg">${[['system','System'],['dark','Dark'],['light','Light']].map(([k,n])=>`<button class="${S.ui.theme===k?'on':''}" data-a="theme" data-v="${k}">${n}</button>`).join('')}</div>`;
A.ui=el=>{S.ui.style=el.dataset.v;applyUI();save();render()};A.theme=el=>{S.ui.theme=el.dataset.v;applyUI();save();render()};
PAGES.export=()=>pageHdr('Export data')+`<div class="card"><p class="muted small">A full backup of everything on this phone. Copy it and keep it somewhere safe.</p><textarea class="inp copy gap" id="exp" readonly>${esc(JSON.stringify(S))}</textarea><button class="btn gap" data-a="copyExp">Copy backup</button></div>`;
A.copyExp=async()=>{const t=$('#exp');try{await navigator.clipboard.writeText(t.value);toast('Backup copied')}catch(e){t.select();toast('Select and copy the text')}};
PAGES.import=()=>pageHdr('Import backup')+`<div class="card"><p class="muted small">Paste a backup you exported earlier. It replaces what is on this phone now.</p><textarea class="inp copy gap" id="imp" placeholder="Paste backup here"></textarea><button class="btn gap" data-a="doImport">Import</button></div>`;
A.doImport=()=>{try{const o=JSON.parse($('#imp').value);if(!o||typeof o!=='object'||o.v!==3||!Array.isArray(o.entries))throw 0;S=Object.assign(defaults(),o);save();flush();applyUI();toast('Backup restored');R.stack=[];setTab('home')}catch(e){toast('That is not a Mindspace backup')}};
PAGES.settingsOld=()=>pageHdr('Pomodoro and reminders')+`<div class="card"><div class="eyebrow">Merge slot</div><h3 style="margin-top:6px">Your Settings pages go here</h3><p class="muted small">The settings pages are built separately and merge in later. The timer already reads these values.</p><div class="list gap"><div class="li"><span>Focus</span><span class="v">${S.settings.focus} min</span></div><div class="li"><span>Short break</span><span class="v">${S.settings.short} min</span></div><div class="li"><span>Long break</span><span class="v">${S.settings.long} min</span></div><div class="li"><span>Blocks per set</span><span class="v">${S.settings.blocks}</span></div></div></div>`;

/* ----- history ----- */
PAGES.history=()=>{const k=dk(R.hdate),m=R.hmode;
 const seg=`<div class="seg">${[['time','Time'],['tasks','Tasks'],['mood','Mood']].map(([a,n])=>`<button class="${m===a?'on':''}" data-a="hmode" data-v="${a}">${n}</button>`).join('')}</div>`;
 let body='';
 if(m==='time'){
  const es=entriesOn(k,false).sort((a,b)=>a.start-b.start),ns=S.naps.filter(n=>dk(n.start)===k).map(n=>({nap:1,start:n.start,end:n.end,id:n.id}));
  const all=[...es,...ns].sort((a,b)=>a.start-b.start);let prev=null,rows='';
  all.forEach(e=>{if(prev&&e.start-prev>=15*6e4)rows+=`<div class="trow" style="grid-template-columns:1fr auto"><span class="muted small">No time tracked ${fmtD((e.start-prev)/6e4)} · ${fmtT(prev)} – ${fmtT(e.start)}</span><button class="chip sm" data-a="sheet" data-s="logtime" data-q='{"day":${R.hdate},"s":${prev},"e":${e.start}}'>+ Log</button></div>`;
   rows+=e.nap?`<div class="trow"><i class="cbar" style="--bc:var(--w-sleep)"></i><div><b>Nap</b><div class="muted small">${fmtT(e.start)} – ${fmtT(e.end)}</div></div><b>${fmtD(mins(e))}</b></div>`:`<button class="trow" data-a="sheet" data-s="entry" data-q='{"id":"${e.id}"}' style="width:100%"><i class="cbar" style="--bc:${catCol(e.catId)}"></i><div><b>${esc(catLabel(e.catId))}</b><div class="muted small">${fmtT(e.start)} – ${fmtT(e.end)}${e.focus!=null?' · focus '+e.focus:''}</div></div><b>${fmtD(mins(e))}</b></button>`;prev=Math.max(prev||0,e.end)});
  body=`<div class="card">${rows||'<div class="empty"><b>No time logged</b>Start the timer or log time by hand.</div>'}</div><button class="btn" data-a="sheet" data-s="logtime" data-q='{"day":${R.hdate}}'>${I.plus} Log time</button>`}
 else if(m==='tasks'){const t=S.tasks[k],L=S.taskLog.filter(x=>dk(x.ts)===k);
  body=`<div class="card"><div class="tiles two"><div class="tile"><b>${t?t.done:0}</b><small>done</small></div><div class="tile"><b>${t?t.planned:0}</b><small>planned</small></div></div>${L.length?`<div class="list gap">${L.map(x=>`<div class="li"><span>${esc(x.title)}</span><span class="muted small">${fmtT(x.ts)}</span></div>`).join('')}</div>`:''}${!t?'<p class="muted small gap center">No tasks recorded for this day.</p>':''}</div>`}
 else{const cs=S.checkins.filter(c=>dk(c.ts)===k).sort((a,b)=>a.ts-b.ts);
  body=`<div class="card">${cs.length?cs.map(checkinRow).join(''):'<div class="empty"><b>No check-ins</b>Nothing was recorded on this day.</div>'}</div>`}
 return pageHdr('History')+seg+dayNav('hdate',fmtDate(R.hdate,{weekday:'short',day:'numeric',month:'short'}))+body};
A.hmode=el=>{R.hmode=el.dataset.v;render()};
