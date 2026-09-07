/* BuySell V19 - saved searches */
(function(){
  function val(x){return String(x??'').trim()}
  function enc(x){return typeof esc==='function'?esc(x):String(x??'')}
  function renderSavedSearchesPage(body){
    const app=document.getElementById('app');
    if(app) app.innerHTML=header()+'<main class="wrap">'+body+'</main>'+mobile();
  }
  window.saveCurrentSearch=async function(){
    if(!state.user)return auth();
    openModal(`<h2>Qidiruvni saqlash</h2><p class="muted">Keyin shu qidiruvni bir bosishda qayta ochishingiz mumkin.</p><input id="ssName" class="input" maxlength="80" placeholder="Masalan: iPhone 16 Samarqand"><div class="actions" style="margin-top:14px"><button class="btn primary" onclick="confirmSaveSearch()">Saqlash</button><button class="btn" onclick="closeModal()">Bekor</button></div>`);
  };
  window.confirmSaveSearch=async function(){
    if(!state.user)return auth();
    const name=val(document.getElementById('ssName')?.value);if(name.length<2)return toast('Qidiruv nomini kiriting');
    const filters={search:val(state.search),category:val(state.category),subcategory:val(state.subcategory),region:val(state.region),minPrice:val(state.minPrice),maxPrice:val(state.maxPrice),condition:val(state.condition),sort:val(state.sort||'new')};
    const {error}=await sb.from('saved_searches').insert({user_id:state.user.id,name,filters});
    if(error)return toast('Saqlashda xatolik: '+error.message);closeModal();toast('Qidiruv saqlandi');
  };
  window.savedSearches=async function(){
    if(!state.user)return '<div class="panel"><h2>Saqlangan qidiruvlar</h2><p class="muted">Bu bo‘limdan foydalanish uchun hisobga kiring.</p><button class="btn primary" onclick="auth()">Kirish</button></div>';
    const {data,error}=await sb.from('saved_searches').select('id,name,filters,created_at').eq('user_id',state.user.id).order('created_at',{ascending:false});
    if(error)return `<div class="panel">Saqlangan qidiruvlarni yuklashda xatolik: ${enc(error.message)}</div>`;
    const rows=(data||[]).map(x=>{const f=x.filters||{};const summary=[f.search,f.category,f.subcategory,f.region].filter(Boolean).join(' · ');return `<div class="moderow"><div class="modinfo" style="flex:1"><b>${enc(x.name)}</b><div class="meta">${enc(summary||'Barcha e’lonlar')}</div></div><div class="actions"><button class="btn primary" onclick="runSavedSearch('${x.id}')">Qidirish</button><button class="btn danger" onclick="deleteSavedSearch('${x.id}')">O‘chirish</button></div></div>`}).join('');
    return `<div class="head"><div><h2>Saqlangan qidiruvlar</h2><div class="muted">${(data||[]).length} ta saqlangan qidiruv</div></div><button class="btn" onclick="go('#search')">Qidiruvga qaytish</button></div><div class="panel">${rows||'<div class="muted">Hali saqlangan qidiruv yo‘q.</div>'}</div>`;
  };
  window.runSavedSearch=async function(id){
    if(!state.user)return auth();
    const {data,error}=await sb.from('saved_searches').select('filters').eq('id',id).eq('user_id',state.user.id).maybeSingle();
    if(error||!data)return toast('Saqlangan qidiruv topilmadi');
    const f=data.filters||{};Object.assign(state,{search:val(f.search),category:val(f.category),subcategory:val(f.subcategory),region:val(f.region),minPrice:val(f.minPrice),maxPrice:val(f.maxPrice),condition:val(f.condition),sort:val(f.sort||'new')});go('#search');
  };
  window.deleteSavedSearch=async function(id){
    if(!state.user)return auth();const {error}=await sb.from('saved_searches').delete().eq('id',id).eq('user_id',state.user.id);
    if(error)return toast(error.message);toast('Saqlangan qidiruv o‘chirildi');route();
  };
  const originalSearchPage=window.searchPage;
  if(typeof originalSearchPage==='function'){
    window.searchPage=async function(){
      const html=await originalSearchPage();
      return `<div style="margin:0 0 14px"><button class="btn" onclick="saveCurrentSearch()">♡ Qidiruvni saqlash</button> <button class="btn" onclick="go('#saved-searches')">Saqlangan qidiruvlar</button></div>`+html;
    };
  }
  const originalRoute=window.route;
  if(typeof originalRoute==='function'){
    window.route=async function(){
      if((location.hash||'#/')==='#saved-searches'){renderSavedSearchesPage(await savedSearches());return;}
      return originalRoute.apply(this,arguments);
    };
  }
  const originalProfile=window.profile;
  if(typeof originalProfile==='function'){
    window.profile=function(){
      const html=originalProfile();if(!state.user)return html;
      return html.replace('</div></div>',`</div></div><div class="panel" style="margin-top:14px"><h3>Qidiruvlar</h3><div class="actions"><button class="btn" onclick="go('#saved-searches')">♡ Saqlangan qidiruvlar</button></div></div></div>`);
    };
  }
})();
