import re,json
A='/mnt/user-data/attachments/521589e0-0ba6-5c11-a4b8-9c4a0ba66287/'
def rd(n): return open(A+n,encoding='utf8').read()
def sub(s,a,b,cnt=1):
    assert a in s, 'MISSING: '+a[:70]
    return s.replace(a,b) if cnt==0 else s.replace(a,b,cnt)

# ---------------- TASKS ----------------
t=rd('2b63082e-Mindspace_Task_Tab_2.html')
t=sub(t,'<button class="chip" aria-label="Notifications">','<button class="chip" id="bellBtn" aria-label="Notifications">')
t=sub(t,'<span class="dotred"></span>','<span class="dotred" id="bellDot"></span>')
# build from injected state
i=t.index('tasks = JSON.parse(JSON.stringify(SEED));'); j=t.index('lastEarned = null;',i)+len('lastEarned = null;')
t=t[:i]+"""var I0 = window.__INIT || {};
    tasks = JSON.parse(JSON.stringify(I0.tasks || [])); customLists = (I0.customLists || []).slice();
    if (I0.names) names = I0.names; studyHidden = !!I0.studyHidden;
    selDate = null; count = I0.coins || 0; tasksDone = I0.tasksDone || 0; streak = I0.streak || 0; earned = I0.earned || {}; queue.length = 0; allDoneShown = false; $('#streakNum').textContent = streak; nextId = I0.nextId || 100; moreIdx = 0; lastEarned = null;
    $('#bellDot').hidden = !I0.unread;"""+t[j:]
# helpers
t=sub(t,"var K = function(){ return slow ? 2.6 : 1; };","""var K = function(){ return slow ? 2.6 : 1; };
  function post(m){ m.ms = 1; try{ parent.postMessage(m,'*'); }catch(e){} }
  var lastSnap = '';
  function postState(){ if (typeof tasks === 'undefined') return; var s = JSON.stringify({tasks:tasks,customLists:customLists,names:names,studyHidden:studyHidden,tasksDone:tasksDone,earned:earned,nextId:nextId}); if (s !== lastSnap){ lastSnap = s; post({type:'state',state:JSON.parse(s)}); } }""")
# coins
t=sub(t,"function setCount(n, animate){\n    count = n;","function setCount(n, animate){\n    if (n !== count) post({type:'coin', d:n-count, src:window.__src||''});\n    count = n;")
t=sub(t,"setCount(Math.max(0, count-1), true); refreshHead();","window.__src = 'undo'; setCount(Math.max(0, count-1), true); window.__src = ''; postState(); refreshHead();")
t=sub(t,"t.done = false; allDoneShown = false; li.classList.remove('done','pop');","t.done = false; delete t.doneAt; tasksDone = Math.max(0, tasksDone-1); allDoneShown = false; li.classList.remove('done','pop');")
t=sub(t,"lastEarned = t.id; tasksDone++;","lastEarned = t.id; t.doneAt = Date.now(); tasksDone++; postState();")
t=sub(t,"earned[g.id] = true;","earned[g.id] = true; window.__src = 'gem'; clearTimeout(window.__st); window.__st = setTimeout(function(){ window.__src = ''; }, 5000); postState();")
# deletions
t=sub(t,"if (t.rep && mode === 'one') spawned = spawnNext(t);","if (t.rep && mode === 'one') spawned = spawnNext(t);\n    post({type:'deleted', dates:items.filter(function(x){return !x.done;}).map(function(x){return x.date;})});")
t=sub(t,"var d = lastDel; lastDel = null; if (!d) return;","var d = lastDel; lastDel = null; if (!d) return;\n    post({type:'undeleted', dates:d.items.filter(function(x){return !x.done;}).map(function(x){return x.date;})});")
# boot
t=sub(t,"build();\n  setTimeout(function(){ booting = false; refreshHead(); }, 350);","""build();
  setTimeout(function(){ booting = false; refreshHead(); }, 350);
  lastSnap = JSON.stringify({tasks:tasks,customLists:customLists,names:names,studyHidden:studyHidden,tasksDone:tasksDone,earned:earned,nextId:nextId});
  setInterval(postState, 400);
  var sheetWas = null;
  setInterval(function(){ var o = !!document.querySelector('.sheet.open, .gemov:not([hidden])'); if (o !== sheetWas){ sheetWas = o; post({type:'sheet', open:o}); } }, 150);
  $('#bellBtn').addEventListener('click', function(){ post({type:'go', p:'notes'}); });
  window.addEventListener('message', function(e){
    var d = e.data; if (!d || d.ms !== 1) return;
    if (d.type === 'sync'){
      if (d.theme) document.documentElement.dataset.t = d.theme;
      if (d.coins != null && d.coins !== count && !busy){ count = d.coins; numEl.innerHTML = '<span class="n">'+count+'</span>'; }
      if (d.streak != null && d.streak !== streak){ streak = d.streak; $('#streakNum').textContent = streak; if (sheetOpen) renderSheet(); checkMilestones(); flush(); }
      $('#bellDot').hidden = !d.unread;
    } else if (d.type === 'theme'){ document.documentElement.dataset.t = d.theme; }
    else if (d.type === 'openRewards'){ audio(); openSheet(); }
  });""")
t=sub(t,"addBurst(innerWidth/2, 120, 60, ['#FFF4B8','#F7CF55','#F2B636','#FFFFFF','#34D27B'], 10);","try { burst({x:innerWidth/2, y:140}, 36, 120, 1); } catch(err){}")
css="""<style>
:root[data-t="light"]{--bg:#f3f3f5;--fg:#0b0b0d;--muted:#6b6d76;--faint:#b9bbc2;--line:#e4e5e9;--chip:#fff;--chip-line:#dcdde2;color-scheme:light}
:root[data-t="light"] .chip svg[stroke="#fff"]{stroke:#0b0b0d}
[data-t=light] .day,[data-t=light] .row,[data-t=light] .in{background:#fff}
[data-t=light] .row.done .in{background:#f0f0f3}
[data-t=light] .prog{background:#e4e5e9;--tick:#fff}
[data-t=light] .fld,[data-t=light] .sel input,[data-t=light] .rc,[data-t=light] .days button,[data-t=light] .lrow,[data-t=light] .dopt,[data-t=light] .pseg-wrap,[data-t=light] .stat,[data-t=light] .nextb{background:#f4f4f6;color:var(--fg)}
[data-t=light] .dopt.red,[data-t=light] .b-del{background:#fdeeed;border-color:#f3c9c7}
[data-t=light] .panel{background:#fff}[data-t=light] .grab{background:#d4d5da}
[data-t=light] .dchip,[data-t=light] .xbtn,[data-t=light] .cmon button{background:#ececef}
[data-t=light] .toast{background:#fff}[data-t=light] .toast button{background:#ececef;color:#9a6a00}
[data-t=light] .bar{background:#e4e5e9}
[data-t=light] .dback,[data-t=light] .cday.sel,[data-t=light] .rc[aria-pressed=true],[data-t=light] .days button[aria-pressed=true],[data-t=light] .pseg[aria-pressed=true],[data-t=light] .b-main,[data-t=light] .gbtn,[data-t=light] .fab{background:#0b0b0d;color:#fff}
[data-t=light] .fab{box-shadow:0 8px 24px rgba(0,0,0,.22)}
[data-t=light] .fab svg{stroke:#fff}
[data-t=light] .gcell:active{background:#ececef}
[data-t=light] .acts{background:linear-gradient(transparent,#fff 35%)}
[data-t=light] .grp span{color:#9a9ca4}
[data-t=light] .sel input{color-scheme:light}
[data-t=light] nav.tabs.gut{background:#e9eaee;border-color:#dcdde2;box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none}
[data-t=light] .tab{color:#6b6d76}[data-t=light] .tab[aria-selected="true"]{color:#0b0b0d;text-shadow:none}
[data-t=light] nav.tabs .gl{background:#fff;border-color:#dcdde2;box-shadow:0 2px 8px rgba(0,0,0,.12);-webkit-backdrop-filter:none;backdrop-filter:none}
[data-t=light] .dchip{background:#ececef;border-color:#dcdde2;color:#0b0b0d;box-shadow:none}
[data-t=light] .dchip svg{stroke:#0b0b0d}
.bnav{display:none!important}
.dock{bottom:calc(74px + env(safe-area-inset-bottom,0px))!important;background:none!important;padding-bottom:0!important;pointer-events:none}
.dock>*{pointer-events:auto}
.app{padding-bottom:170px}
</style>"""
t=sub(t,'</head>',css+'</head>')
open('emb_tasks.html','w',encoding='utf8').write(t)

# ---------------- SETTINGS ----------------
s=rd('91b4e115-Mindspace___Settings.html')
s=sub(s,'try{Object.assign(S,JSON.parse(localStorage.getItem("ms-settings")||"{}"))}catch(e){}','Object.assign(S,window.__CFG||{});')
s=sub(s,'const persist=()=>{try{localStorage.setItem("ms-settings",JSON.stringify(S))}catch(e){}};',"const persist=()=>{try{parent.postMessage({ms:1,type:'cfg',cfg:JSON.parse(JSON.stringify(S))},'*')}catch(e){}};")
s=sub(s,'id("smL").onclick=()=>toast("Sample data loaded");id("smR").onclick=()=>toast("Sample data removed");',
 """id("smL").onclick=()=>ask("Load sample data?","This replaces what is in the app now with 12 days of made-up data so you can see how it looks.",()=>parent.postMessage({ms:1,type:'sample'},'*'),false,"Load");
id("smR").onclick=()=>ask("Remove sample data?","All time, tasks and wellbeing records are cleared. Your settings stay.",()=>parent.postMessage({ms:1,type:'unsample'},'*'),false,"Remove");""")
s=sub(s,'function wipeAll(){try{localStorage.clear()}catch(e){}S=JSON.parse(JSON.stringify(D));chips();closePad();toast("All data deleted")}',
 'function wipeAll(){S=JSON.parse(JSON.stringify(D));chips();closePad();parent.postMessage({ms:1,type:"wipeAll"},"*")}')
s=sub(s,'()=>toast("Well-being data deleted")','()=>{parent.postMessage({ms:1,type:"wipeWell"},"*");toast("Well-being data deleted")}')
s=sub(s,'toast(`Exporting ${S.exTypes.length} types as ${S.exFmt.toUpperCase()}`)','parent.postMessage({ms:1,type:"export",o:{types:S.exTypes,range:S.exRange,from:S.exFrom,to:S.exTo,fmt:S.exFmt,notes:S.exNotes}},"*")')
s=sub(s,'if(S.pinHash)openPad("unlock");else id("pad").classList.remove("show");','if(window.__LOCK){document.querySelector("main").style.display="none";openPad("unlock")}else id("pad").classList.remove("show");')
s=sub(s,'document.addEventListener("visibilitychange",','document.addEventListener("visibilitychange-off",')
s=sub(s,'if(h===S.pinHash){fails=0;closePad();P.cb&&P.cb()}','if(h===S.pinHash){fails=0;closePad();if(window.__LOCK)parent.postMessage({ms:1,type:"unlock"},"*");P.cb&&P.cb()}')
s=sub(s,'openPad("set");toast("PIN removed. No data lost")','(window.__LOCK?parent.postMessage({ms:1,type:"unlock"},"*"):openPad("set"));toast("PIN removed. No data lost")',0)
s=sub(s,'</head>','<style>header h1{display:none}header{justify-content:flex-end!important;padding:0 0 8px!important}.pill{display:none}main{padding-top:4px}body::before{display:none}</style></head>')
open('emb_settings.html','w',encoding='utf8').write(s)

def js(x): return json.dumps(x).replace('</','<\\/')
open('p9a.js','w').write('const EMB={tasks:'+js(t)+',settings:'+js(s)+'};\n')
print('ok',len(t),len(s))
