{
const P=['Amélie','Bastien','Chloé','Dorian','Emma','Florian','Gaëlle','Hugo','Inès','Julien','Léa','Mathis'];
const POOL=['Les Marcheurs','Les Bolides','Les Escaliers','Les Pas Chassés','Les Kilomètres','Les Ricochets','Les Mollets d\'acier','Les Pieds Ailés','Les Glissades','Les Semelles','Les Rampes','Les Foulées','Les Arpenteurs','Les Randonneurs','Les Lacets','Les Trotteurs'];
const BASE=[
 {id:'2026-10',pairs:[[0,7],[1,4],[2,9],[3,11],[5,10],[6,8]],names:['Les Marcheurs','Les Bolides','Les Escaliers','Les Pas Chassés','Les Kilomètres','Les Ricochets']},
 {id:'2026-11',pairs:[[0,3],[1,8],[2,6],[4,11],[5,9],[7,10]],names:['Les Mollets d\'acier','Les Pieds Ailés','Les Glissades','Les Semelles','Les Foulées','Les Rampes']}];
const SEEDED=new Set(BASE.map(m=>m.id));
const KEY='tobogogans-steps',MK='tobogogans-months';
const ls={get(k,d){try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
let over=ls.get(KEY,{});
let added=ls.get(MK,[]);if(!Array.isArray(added))added=[];
const DAY=864e5,NOW=new Date();NOW.setHours(12,0,0,0);
const $=id=>document.getElementById(id);
const fmt=n=>n.toLocaleString('fr-BE');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mon=d=>d.toLocaleDateString('fr-BE',{month:'short'});
const monthLabel=id=>{const[y,m]=id.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString('fr-BE',{month:'long',year:'numeric'})};
const monthName=id=>{const[y,m]=id.split('-').map(Number);return new Date(y,m-1,1).toLocaleDateString('fr-BE',{month:'long'})};
const nextId=id=>{const[y,m]=id.split('-').map(Number);return m===12?`${y+1}-01`:`${y}-${String(m+1).padStart(2,'0')}`};
function weeksOf(id){
  const[y,m]=id.split('-').map(Number),d=new Date(y,m-1,1,12),out=[];
  while(d.getDay()!==1)d.setDate(d.getDate()+1);
  while(d.getMonth()===m-1){
    const s=new Date(d),e=new Date(d.getTime()+6*DAY);
    const label=s.getMonth()===e.getMonth()?`${s.getDate()}–${e.getDate()} ${mon(e)}`:`${s.getDate()} ${mon(s)}–${e.getDate()} ${mon(e)}`;
    const st=NOW<s?'future':NOW>e?'done':'live';
    out.push({label,s,e,st,frac:st==='live'?Math.min(1,(Math.floor((NOW-s)/DAY)+1)/7):1});
    d.setDate(d.getDate()+7);
  }
  return out;
}
let M=[];
function build(){
  const map=new Map(BASE.map(m=>[m.id,{...m}]));
  added.forEach(m=>map.set(m.id,m));
  M=[...map.values()].sort((a,b)=>a.id<b.id?-1:1).map(m=>({...m,label:monthLabel(m.id),name:monthName(m.id),weeks:weeksOf(m.id)}));
  M.forEach(m=>{m.started=m.weeks.map((w,i)=>i).filter(i=>m.weeks[i].st!=='future');m.live=m.weeks.findIndex(w=>w.st==='live')});
}
const seed=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}h>>>=0;h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296};
function steps(m,w,e){
  const k=m.id+'|'+w+'|'+e;if(k in over)return over[k];
  const wk=m.weeks[w];if(!SEEDED.has(m.id)||wk.st==='future')return 0;
  return Math.round((36000+seed(k)*50000)*wk.frac/10)*10;
}
const teams=m=>m.pairs.map((p,i)=>{
  const wk=m.weeks.map((_,w)=>p.map(e=>steps(m,w,e)));
  const wt=wk.map(a=>a.reduce((x,y)=>x+y,0));
  return{i,name:m.names[i]||'Équipe '+(i+1),p,wk,wt,total:m.started.reduce((a,w)=>a+wt[w],0)}});
const members=p=>p.map(e=>P[e]).join(' et ');

let mi=0,wi=0;
function pickDefault(){
  let k=M.findIndex(m=>m.live>=0);
  if(k<0){k=M.length-1;while(k>0&&!M[k].started.length)k--}
  mi=Math.max(0,k);wi=M[mi].live>=0?M[mi].live:(M[mi].started.at(-1)??0);
}

function intro(){
  $('today').textContent=NOW.toLocaleDateString('fr-BE',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase());
  const m=M.find(x=>x.live>=0)||M[mi];
  if(!m.started.length){$('facts').innerHTML='';return}
  const w=m.live>=0?m.live:m.started.at(-1),t=teams(m);
  const bw=[...t].sort((a,b)=>b.wt[w]-a.wt[w])[0],bm=[...t].sort((a,b)=>b.total-a.total)[0];
  const sum=t.reduce((a,x)=>a+x.total,0);
  $('facts').innerHTML=`
   <div><dt>Semaine ${m.live>=0?'en cours':'terminée'} (${esc(m.weeks[w].label)})</dt><dd>${esc(bw.name)}<small>${fmt(bw.wt[w])} pas · ${esc(members(bw.p))}</small></dd></div>
   <div><dt>En tête de ${esc(m.name)}</dt><dd>${esc(bm.name)}<small>${fmt(bm.total)} pas · ${esc(members(bm.p))}</small></dd></div>
   <div><dt>Total de l'entreprise en ${esc(m.name)}</dt><dd>${fmt(sum)} pas<small>environ ${fmt(Math.round(sum*.75/1000))} km</small></dd></div>`;
}
function monthSelect(){
  $('mSel').innerHTML=M.map((m,i)=>`<option value="${i}"${i===mi?' selected':''}>${esc(m.label)}</option>`).join('');
}
function week(){
  const m=M[mi];
  $('weekTabs').innerHTML=m.weeks.map((w,i)=>w.st==='future'?'':`<button type="button" data-w="${i}" aria-pressed="${i===wi}">${esc(w.label)}${w.st==='live'?' <em>en cours</em>':''}</button>`).join('');
  if(!m.started.length){$('weekTable').innerHTML=`<p class="empty">Le défi de ${esc(m.name)} n'a pas encore commencé. Première semaine : ${esc(m.weeks[0].label)}</p>`;return}
  const t=teams(m).sort((a,b)=>b.wt[wi]-a.wt[wi]),top=t[0].wt[wi];
  $('weekTable').innerHTML=`<div class="scroll"><table><thead><tr><th>#</th><th>Équipe</th><th class="det">Détail</th><th class="n">Pas</th><th class="n gap">Écart</th></tr></thead><tbody>${
   t.map((x,k)=>`<tr${k?'':' class="first"'}><td class="rk">${k+1}</td><td><span class="duo">${esc(x.name)}</span><span class="sub m">${x.p.map((e,j)=>`${P[e]} ${fmt(x.wk[wi][j])}`).join(' · ')}</span></td><td class="muted det">${x.p.map((e,j)=>`${P[e]} ${fmt(x.wk[wi][j])}`).join('<br>')}</td><td class="n tot">${fmt(x.wt[wi])}</td><td class="n muted gap">${k?'−'+fmt(top-x.wt[wi]):'—'}</td></tr>`).join('')}</tbody></table></div>`;
}
function month(){
  const m=M[mi];
  $('monthTitle').textContent='Classement de '+m.name;
  if(!m.started.length){$('monthTable').innerHTML=`<p class="empty">Aucune semaine jouée pour l'instant.</p>`;return}
  const t=teams(m).sort((a,b)=>b.total-a.total),top=t[0].total;
  $('monthTable').innerHTML=`<div class="scroll"><table><thead><tr><th>#</th><th>Équipe</th>${m.started.map(w=>`<th class="n">${esc(m.weeks[w].label)}${m.weeks[w].st==='live'?'*':''}</th>`).join('')}<th class="n">Total</th><th class="n">Écart</th></tr></thead><tbody>${
   t.map((x,k)=>`<tr${k?'':' class="first"'}><td class="rk">${k+1}</td><td><span class="duo">${esc(x.name)}</span><span class="sub">${esc(members(x.p))}</span></td>${m.started.map(w=>`<td class="n">${fmt(x.wt[w])}</td>`).join('')}<td class="n tot">${fmt(x.total)}</td><td class="n muted">${k?'−'+fmt(top-x.total):'—'}</td></tr>`).join('')}</tbody></table></div>${m.live>=0?'<p class="note">* semaine en cours, résultats provisoires.</p>':''}`;
}
function teamList(){
  const m=M[mi];
  $('teamTitle').textContent='Équipes de '+m.name;
  $('teams').innerHTML=`<div class="teams">${teams(m).map(x=>`<div><b>${esc(x.name)}</b><span>${esc(members(x.p))}</span></div>`).join('')}</div>`;
}
function all(){monthSelect();intro();week();month();teamList();if(admin)admRender()}

$('mSel').addEventListener('change',e=>{mi=+e.target.value;const m=M[mi];wi=m.live>=0?m.live:(m.started.at(-1)??0);all()});
$('weekTabs').addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(b){wi=+b.dataset.w;week()}});

/* ---------- administration ---------- */
const CODE='admin2026',AK='tobogogans-admin';
let admin=false;try{admin=sessionStorage.getItem(AK)==='1'}catch(e){}
let ami=-1,awi=-1,draft=null,gTarget='';
const dlg=$('dlg');
const closeDlg=()=>{try{dlg.close()}catch(e){dlg.removeAttribute('open')}};
const say=(id,t,c='')=>{$(id).textContent=t;$(id).className='msg '+c};
const scrollTo_=el=>{try{el.scrollIntoView()}catch(e){}};

/* tirage */
function genTargets(){
  const ids=M.filter(m=>!m.started.length).map(m=>m.id);
  const nx=nextId(M.at(-1).id);if(!ids.includes(nx))ids.push(nx);
  return ids;
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function draw(id,avoid){
  const prev=M.filter(m=>m.id<id).at(-1);
  const bad=new Set(avoid&&prev?prev.pairs.flatMap(p=>p.flatMap(a=>p.filter(b=>b!==a).map(b=>a+'-'+b))):[]);
  let best=null;
  for(let t=0;t<3000;t++){
    const ids=shuffle(P.map((_,i)=>i)),pairs=[];
    for(let i=0;i+1<ids.length;i+=2)pairs.push([ids[i],ids[i+1]]);
    if(ids.length%2)pairs.at(-1).push(ids.at(-1));
    const clash=pairs.some(p=>p.some(a=>p.some(b=>a!==b&&bad.has(a+'-'+b))));
    best=pairs;if(!clash)break;
  }
  const used=new Set(prev?prev.names:[]);
  const names=shuffle(POOL.filter(n=>!used.has(n))).slice(0,best.length);
  while(names.length<best.length)names.push('Équipe '+(names.length+1));
  return{pairs:best,names};
}
function genRender(){
  const ids=genTargets();if(!ids.includes(gTarget))gTarget=ids[0];
  $('gMonth').innerHTML=ids.map(id=>`<option value="${id}"${id===gTarget?' selected':''}>${esc(monthLabel(id))}</option>`).join('');
  const ex=M.find(m=>m.id===gTarget),first=weeksOf(gTarget)[0];
  $('gStatus').innerHTML=ex?`Équipes de ${esc(ex.name)} <b>déjà validées</b>. Un nouveau tirage les remplacera. Premier lundi : semaine du ${esc(first.label)}`
    :`Aucune équipe pour ${esc(monthName(gTarget))}. Premier lundi : semaine du ${esc(first.label)}`;
  const src=draft||(ex?{pairs:ex.pairs,names:ex.names}:null);
  $('gActions').hidden=!draft;
  $('gDraw').textContent=ex?'Nouveau tirage':'Tirer au sort';
  if(!src){$('gPreview').innerHTML='';return}
  $('gPreview').innerHTML=`<div class="scroll"><table class="gen"><thead><tr><th>#</th><th>Nom de l'équipe</th><th>Membres</th></tr></thead><tbody>${
    src.pairs.map((p,i)=>`<tr><td class="rk">${i+1}</td><td>${draft?`<input data-n="${i}" value="${esc(src.names[i])}" aria-label="Nom de l'équipe ${i+1}" maxlength="40">`:`<span class="duo">${esc(src.names[i])}</span>`}</td><td>${esc(members(p))}</td></tr>`).join('')}</tbody></table></div>`;
}
$('gMonth').addEventListener('change',e=>{gTarget=e.target.value;draft=null;genRender()});
const doDraw=()=>{draft=draw(gTarget,$('gAvoid').checked);genRender();say('gMsg','Tirage provisoire : vérifiez puis validez.')};
$('gDraw').addEventListener('click',doDraw);
$('gRedo').addEventListener('click',doDraw);
$('gPreview').addEventListener('input',e=>{const i=e.target.dataset.n;if(draft&&i!==undefined)draft.names[+i]=e.target.value});
$('gSave').addEventListener('click',()=>{
  if(!draft)return;
  const names=draft.names.map((n,i)=>n.trim()||'Équipe '+(i+1));
  added=added.filter(m=>m.id!==gTarget);added.push({id:gTarget,pairs:draft.pairs,names});ls.set(MK,added);
  const nm=monthName(gTarget);draft=null;build();all();
  say('gMsg','');$('gStatus').innerHTML+=` <b style="color:var(--ok)">Équipes de ${esc(nm)} enregistrées.</b>`;
});

/* encodage */
function encRender(){
  const ok=M.map((m,i)=>i).filter(i=>M[i].started.length);
  if(!ok.includes(ami))ami=ok.includes(mi)?mi:ok.at(-1);
  const m=M[ami];if(!m.started.includes(awi))awi=m.live>=0?m.live:m.started.at(-1);
  $('aMonth').innerHTML=ok.map(i=>`<option value="${i}"${i===ami?' selected':''}>${esc(M[i].label)}</option>`).join('');
  $('aWeek').innerHTML=m.started.map(w=>`<option value="${w}"${w===awi?' selected':''}>${esc(m.weeks[w].label)}${m.weeks[w].st==='live'?' (en cours)':''}</option>`).join('');
  $('admGrid').innerHTML=`<table class="entry"><thead><tr><th>Équipe</th><th>Collègue</th><th class="n">Pas</th><th class="n">Total équipe</th></tr></thead><tbody>${
    m.pairs.map((p,i)=>p.map((e,j)=>{const v=steps(m,awi,e);return`<tr>${j?'':`<td rowspan="${p.length}"><span class="duo">${esc(m.names[i])}</span></td>`}<td><label for="a${e}" style="color:var(--ink);font-size:15px">${P[e]}</label></td><td class="n"><input id="a${e}" data-e="${e}" data-t="${i}" data-o="${v}" type="number" inputmode="numeric" min="0" max="300000" value="${v}"></td>${j?'':`<td class="n tot" rowspan="${p.length}" data-tt="${i}">${fmt(p.reduce((a,x)=>a+steps(m,awi,x),0))}</td>`}</tr>`}).join('')).join('')}</tbody></table>`;
}
const dirty=()=>!!document.querySelector('#admGrid input.chg');
$('admGrid').addEventListener('input',e=>{
  const i=e.target;if(!i.dataset.e)return;
  i.classList.toggle('chg',i.value!==i.dataset.o);
  const ins=[...document.querySelectorAll(`#admGrid input[data-t="${i.dataset.t}"]`)],c=document.querySelector(`[data-tt="${i.dataset.t}"]`);
  c.textContent=fmt(ins.reduce((a,x)=>a+(Math.round(+x.value)||0),0));c.classList.toggle('chg',ins.some(x=>x.classList.contains('chg')));
  say('admMsg',dirty()?'Modifications non enregistrées.':'');
});
let warned=false;
const guard=()=>{if(!dirty()||warned){warned=false;return true}warned=true;say('admMsg','Modifications non enregistrées. Enregistrez, ou changez à nouveau pour les abandonner.','err');return false};
$('aMonth').addEventListener('change',e=>{if(!guard())return encRender();ami=+e.target.value;awi=-1;encRender();say('admMsg','')});
$('aWeek').addEventListener('change',e=>{if(!guard())return encRender();awi=+e.target.value;encRender();say('admMsg','')});
$('admUndo').addEventListener('click',()=>{warned=false;encRender();say('admMsg','Modifications annulées.')});
$('admForm').addEventListener('submit',e=>{
  e.preventDefault();
  const m=M[ami],ins=[...document.querySelectorAll('#admGrid input')];
  const bad=ins.find(x=>x.value===''||!(+x.value>=0)||+x.value>300000);
  if(bad){bad.focus();return say('admMsg',`Valeur invalide pour ${P[+bad.dataset.e]} (entre 0 et 300 000).`,'err')}
  let n=0;ins.forEach(x=>{if(x.value!==x.dataset.o)n++;over[m.id+'|'+awi+'|'+x.dataset.e]=Math.round(+x.value)});
  ls.set(KEY,over);warned=false;mi=ami;wi=awi;all();
  say('admMsg',n?`${n} valeur${n>1?'s':''} enregistrée${n>1?'s':''} (${m.weeks[awi].label}).`:'Aucune modification.','ok');
});
$('reset').addEventListener('click',()=>{over={};added=[];ls.set(KEY,over);ls.set(MK,added);draft=null;build();pickDefault();all();say('admMsg','Données d\'exemple rétablies.','ok')});

function admRender(){
  $('admin').hidden=!admin;$('admOpen').textContent=admin?'Administration (connecté)':'Administration';
  if(admin){genRender();if(!dirty())encRender()}
}
$('admOpen').addEventListener('click',()=>{
  if(admin)return scrollTo_($('admin'));
  $('dlgCode').value='';$('dlgMsg').textContent='';
  try{dlg.showModal()}catch(e){dlg.setAttribute('open','')}
  $('dlgCode').focus();
});
$('dlgCancel').addEventListener('click',closeDlg);
$('dlgForm').addEventListener('submit',e=>{
  e.preventDefault();
  if($('dlgCode').value!==CODE){$('dlgMsg').textContent='Code incorrect.';return}
  admin=true;try{sessionStorage.setItem(AK,'1')}catch(e){}
  closeDlg();admRender();scrollTo_($('admin'));
});
$('admOut').addEventListener('click',()=>{admin=false;try{sessionStorage.removeItem(AK)}catch(e){}admRender();scrollTo(0,0)});

build();pickDefault();all();admRender();
}
