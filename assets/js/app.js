// assets/js/app.js
const DATA_PATH = 'data/facts.json';
let FACTS = [];

async function loadFacts(){
  try{
    const res = await fetch(DATA_PATH);
    FACTS = await res.json();
    populateCategories();
    renderDailyFact();
    renderRecent();
  }catch(e){
    console.error('Failed load', e);
    document.getElementById('factArea').innerHTML = '<div class="alert alert-warning">Cannot load facts. Serve files via a local server for fetch to work.</div>';
  }
}

function populateCategories(){
  const sel = document.getElementById('categorySelect');
  const cats = ['all', ...new Set(FACTS.map(f=>f.category))];
  sel.innerHTML = '';
  cats.forEach(c => {
    const opt = document.createElement('option'); opt.value = c; opt.textContent = c; sel.appendChild(opt);
  });
}

function todayIndex(){
  // repeatable "today" index based on date
  const d = new Date();
  const seed = d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate();
  return seed % FACTS.length;
}

function renderDailyFact(){
  if(!FACTS.length) return;
  const idx = todayIndex();
  const fact = FACTS[idx];
  const area = document.getElementById('factArea');
  area.innerHTML = `
    <article class="card mb-3 fact-card">
      ${fact.image?`<img src="${fact.image}" class="card-img-top" alt="${fact.title}">`:''}
      <div class="card-body">
        <h2 class="card-title">${fact.title}</h2>
        <p class="card-text">${fact.text}</p>
        <div class="d-flex gap-2">
          <a href="fact.html?id=${encodeURIComponent(fact.id)}" class="btn btn-primary">Read More</a>
          <button onclick="bookmarkFact('${fact.id}')" class="btn btn-outline-secondary"><i class="bi bi-bookmark-plus"></i> Save</button>
          <button onclick="shareQuick('${fact.title}','${fact.text.replace(/'/g, "\'")}")" class="btn btn-outline-success"><i class="bi bi-share"></i> Share</button>
        </div>
      </div>
    </article>
  `;
  updateStreak();
}

function renderRecent(){
  const list = document.getElementById('recentList');
  list.innerHTML = '';
  FACTS.slice().reverse().forEach(f => {
    const col = document.createElement('div'); col.className='col';
    col.innerHTML = `
      <div class="card h-100">
        ${f.image?`<img src="${f.image}" class="card-img-top" alt="${f.title}">`:''}
        <div class="card-body">
          <h5 class="card-title">${f.title}</h5>
          <p class="card-text text-truncate">${f.text}</p>
          <a href="fact.html?id=${encodeURIComponent(f.id)}" class="stretched-link"></a>
        </div>
      </div>`;
    list.appendChild(col);
  })
}

function bookmarkFact(id){
  const bookmarks = JSON.parse(localStorage.getItem('til_bookmarks')||'[]');
  if(bookmarks.includes(id)){
    Swal.fire({toast:true, position:'top-end', icon:'info', title:'Already bookmarked', showConfirmButton:false, timer:1500});
    return;
  }
  bookmarks.push(id); localStorage.setItem('til_bookmarks', JSON.stringify(bookmarks));
  Swal.fire({toast:true, position:'top-end', icon:'success', title:'Bookmarked', showConfirmButton:false, timer:1400});
}

function shareQuick(title, text){
  if(navigator.share){
    navigator.share({title: 'Today I Learned', text: title + ' — ' + text}).catch(()=>{});
  } else {
    Swal.fire({toast:true, position:'top-end', icon:'info', title:'Use share button in your browser', showConfirmButton:false, timer:1400});
  }
}

// Simple streak implementation
function updateStreak(){
  const lastSeen = localStorage.getItem('til_last_seen');
  const today = new Date().toISOString().slice(0,10);
  if(lastSeen !== today){
    let streak = parseInt(localStorage.getItem('til_streak')||'0', 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0,10);
    if(lastSeen === yesterday) streak = streak + 1; else streak = 1;
    localStorage.setItem('til_streak', String(streak));
    localStorage.setItem('til_last_seen', today);
  }
  document.getElementById('streakBadge').textContent = 'Streak: ' + (localStorage.getItem('til_streak')||0) + ' 🔥';
}

// Setup events
window.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('categorySelect')){
    document.getElementById('categorySelect').addEventListener('change', (e)=>{
      // filter recent by category
      const v = e.target.value;
      if(v==='all') renderRecent(); else {
        const list = document.getElementById('recentList'); list.innerHTML='';
        FACTS.filter(f=>f.category===v).forEach(f=>{
          const col = document.createElement('div'); col.className='col';
          col.innerHTML = `<div class="card h-100">${f.image?`<img src="${f.image}" class="card-img-top">`:''}<div class="card-body"><h5 class="card-title">${f.title}</h5><p class="card-text text-truncate">${f.text}</p><a href="fact.html?id=${encodeURIComponent(f.id)}" class="stretched-link"></a></div></div>`;
          list.appendChild(col);
        })
      }
    })
    document.getElementById('randomFactBtn').addEventListener('click', ()=>{
      const idx = Math.floor(Math.random()*FACTS.length);
      const id = FACTS[idx].id; window.location.href = 'fact.html?id='+encodeURIComponent(id);
    })
  }

  // If on fact.html -> render single fact
  const params = new URLSearchParams(location.search);
  const factId = params.get('id');
  if(factId && document.getElementById('factCard')){
    const f = FACTS.find(x=>x.id===factId);
    if(f){
      document.getElementById('factImg').src = f.image || '';
      document.getElementById('factTitle').textContent = f.title;
      document.getElementById('factText').textContent = f.text;
      document.getElementById('bookmarkBtn').addEventListener('click', ()=>bookmarkFact(f.id));
      document.getElementById('shareBtn').addEventListener('click', ()=>shareQuick(f.title, f.text));
    }
  }

  // If on bookmarks page
  if(document.getElementById('bookmarkList')){
    const list = document.getElementById('bookmarkList');
    const bm = JSON.parse(localStorage.getItem('til_bookmarks')||'[]');
    if(bm.length===0) list.innerHTML = '<div class="col-12">No bookmarks yet.</div>';
    bm.forEach(id => {
      const f = FACTS.find(x=>x.id===id);
      if(!f) return;
      const el = document.createElement('div'); el.className='col-12';
      el.innerHTML = `<div class="card mb-2"><div class="card-body d-flex align-items-start gap-3"><div><h6>${f.title}</h6><p class="mb-0 text-truncate">${f.text}</p></div><div class="ms-auto text-end"><a href="fact.html?id=${encodeURIComponent(f.id)}" class="btn btn-sm btn-outline-primary">Open</a></div></div></div>`;
      list.appendChild(el);
    })
  }
});

// initial load
loadFacts();

// simple quiz generator
function generateQuiz(n=3){
  const pool = FACTS.slice();
  const picks = [];
  while(picks.length < Math.min(n, pool.length)){
    const i = Math.floor(Math.random()*pool.length); picks.push(pool.splice(i,1)[0]);
  }
  return picks.map((p,idx)=>({
    q: `Which of these is true about: ${p.title.split(' ')[0]}?`,
    correct: p.title,
    options: shuffle([p.title, ...FACTS.filter(x=>x.id!==p.id).slice(0,3).map(x=>x.title)])
  }));
}

function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a}

// expose generateQuiz to window for quiz page
window.generateQuiz = generateQuiz;
