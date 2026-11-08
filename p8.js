/* ===== boot ===== */
document.addEventListener('input',e=>{const t=e.target,l=t.dataset&&t.dataset.live;if(l==='frv'){const o=$('#frv');if(o)o.textContent=t.value}else if(l==='sl')slLive();else if(l==='fps')fpFilter();else if(l==='pks'){const q=t.value.trim().toLowerCase();$$('.pk-it:not(.none)').forEach(b=>b.hidden=!b.dataset.n.includes(q));$$('.pk-g').forEach(g=>g.hidden=!$$('.pk-it',g).some(b=>!b.hidden))}});
let _sw=null,_swd=0;
document.addEventListener('pointerdown',e=>{const w=e.target.closest&&e.target.closest('.week');_sw=w?{x:e.clientX,y:e.clientY,w,drag:false}:null});
document.addEventListener('pointermove',e=>{if(!_sw)return;const dx=e.clientX-_sw.x,dy=e.clientY-_sw.y;if(!_sw.drag&&Math.abs(dx)>8&&Math.abs(dx)>Math.abs(dy)*1.3)_sw.drag=true;if(_sw.drag){_sw.w.style.transition='none';_sw.w.style.transform='translateX('+(dx*.85).toFixed(0)+'px)'}});
document.addEventListener('pointerup',e=>{if(!_sw)return;const dx=e.clientX-_sw.x,w=_sw.w,drag=_sw.drag;_sw=null;if(!drag)return;_swd=Date.now();
 const cell=w.clientWidth/7;let n=Math.round(-dx/cell);if(!n&&Math.abs(dx)>20)n=dx<0?1:-1;n=Math.max(-14,Math.min(14,n));
 if(n)shiftDays(n);else{w.style.transition='transform .22s ease';w.style.transform=''}});
document.addEventListener('pointercancel',()=>{if(_sw&&_sw.w){_sw.w.style.transform=''}_sw=null});
document.addEventListener('click',e=>{if(Date.now()-_swd<350&&e.target.closest&&e.target.closest('.week')){e.stopPropagation();e.preventDefault()}},true);
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches&&e.target.matches('[role="button"][data-a]')){e.preventDefault();e.target.click()}});
addEventListener('online',()=>render());addEventListener('offline',()=>render());
applyUI();
$('#pg').innerHTML='<div class="card sk" aria-hidden="true"><i></i><i></i><i class="s"></i></div>'.repeat(3);
let _booted=false;const boot=()=>{if(_booted)return;_booted=true;runFirewood();checkNotes();render(true);lockNow();try{_sig=sigNow()}catch(e){}};
Promise.race([document.fonts?document.fonts.ready:0,new Promise(r=>setTimeout(r,450))]).then(boot,boot);setTimeout(boot,900);
setInterval(()=>tick(),1000);setInterval(checkNotes,60000);
