/* BuySell V19 - seller profiles, edit/delete, sharing, recent views */
(function(){
  const RECENT_KEY='buysell-recent-v1', MAX_RECENT=12;
  const readRecent=()=>{try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')}catch(e){return[]}};
  const writeRecent=a=>{try{localStorage.setItem(RECENT_KEY,JSON.stringify(a.slice(0,MAX_RECENT)))}catch(e){}};
  const rememberListing=id=>{if(!id)return;const a=readRecent().filter(x=>x!==id);a.unshift(id);writeRecent(a)};
  window.shareListing=async function(id,title){
    const url=location.origin+location.pathname+'#item/'+encodeURIComponent(id);
    try{
      if(navigator.share){await navigator.share({title:title||'BuySell e’lon',text:'BuySell’dagi e’lonni ko‘ring',url});toast('Ulashish oynasi ochildi');return;}
      if(navigator.clipboard){await navigator.clipboard.writeText(url);toast('E’lon havolasi nusxalandi');return;}
    }catch(e){if(e?.name==='AbortError')return;}
    openModal(`<h2>E’lon havolasi</h2><input class="input" value="${esc(url)}" readonly onclick="this.select()"><div class="actions" style="margin-top:12px"><button class="btn primary" onclick='navigator.clipboard?.writeText(${JSON.stringify(url)});toast("Nusxalandi");closeModal()'>Nusxalash</button><button class="btn" onclick="closeModal()">Yopish</button></div>`);
  };
  window.clearRecent=()=>{try{localStorage.removeItem(RECENT_KEY)}catch(e){};toast('Ko‘rilganlar tozalandi');route()};
  window.incrementBuySellView=async function(id){
    rememberListing(id);const key='buysell-viewed-'+id;
    try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1')}catch(e){}
    try{await sb.rpc('increment_listing_view',{p_listing_id:id})}catch(e){console.warn('view counter',e)}
  };
  async function sellerProfile(id){
    const {data:p,error:pe}=await sb.from('profiles').select('id,name,avatar_url,rating,verified,created_at').eq('id',id).maybeSingle();
    if(pe)return `<div class="panel"><h3>Profilni yuklab bo‘lmadi</h3><p class="muted">${esc(pe.message)}</p></div>`;
    if(!p)return '<div class="panel">Sotuvchi topilmadi.</div>';
    const {data:ls,error:le}=await sb.from('listings').select('id,title,price,negotiable,category,subcategory,condition,region,city,created_at,promotion').eq('user_id',id).eq('status','active').order('created_at',{ascending:false}).limit(40);
    if(le)console.error(le);
    const ids=(ls||[]).map(x=>x.id), imgs={};
    if(ids.length){const {data:is}=await sb.from('listing_images').select('listing_id,public_url,sort_order').in('listing_id',ids).order('sort_order');(is||[]).forEach(x=>(imgs[x.listing_id]??=[]).push(x));}
    (ls||[]).forEach(x=>x.listing_images=imgs[x.id]||[]);
    const avatar=p.avatar_url?`<img src="${esc(p.avatar_url)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:esc((p.name||'S')[0]);
    return `<div class="head"><button class="btn" onclick="go('#/')">← Bosh sahifa</button></div><section class="panel seller-page"><div class="seller" style="border-top:0;padding-top:0;margin-top:0"><div class="avatar" style="width:72px;height:72px;font-size:25px">${avatar}</div><div><h1 style="margin:0">${esc(p.name||'Sotuvchi')}${p.verified?' ✓':''}</h1><div class="meta">⭐ ${Number(p.rating||5).toFixed(1)} · ${ls?.length||0} ta faol e’lon</div><div class="meta">A’zo: ${new Date(p.created_at).toLocaleDateString('uz-UZ')}</div></div></div></section><section class="section"><div class="head"><div><h2>${esc(p.name||'Sotuvchi')} e’lonlari</h2><span class="muted">Faol e’lonlar</span></div></div>${ls?.length?`<div class="cards">${ls.map(card).join('')}</div>`:'<div class="panel muted">Hozircha faol e’lonlar yo‘q.</div>'}</section>`;
  }
  async function editListing(id){
    if(!state.user)return auth();
    const {data:l,error}=await sb.from('listings').select('id,title,price,negotiable,category,subcategory,condition,region,district,city,description,public_phone,status').eq('id',id).eq('user_id',state.user.id).maybeSingle();
    if(error||!l)return `<div class="panel"><h3>E’lonni tahrirlash mumkin emas</h3><p class="muted">${esc(error?.message||'E’lon topilmadi yoki sizga tegishli emas.')}</p></div>`;
    const options=(cats[l.category]||[]).map(x=>`<option ${x===l.subcategory?'selected':''}>${esc(x)}</option>`).join('');
    const conditions=['Yangi','Yaxshi','Ishlatilgan','Ta’mir talab'];
    return `<div class="head"><div><h2>E’lonni tahrirlash</h2><div class="muted">O‘zgarishlardan so‘ng e’lon qayta tekshirilishi mumkin.</div></div><button class="btn" onclick="go('#myads')">← Mening e’lonlarim</button></div><form class="panel form" id="editListingForm" onsubmit="event.preventDefault();saveEditedListing('${l.id}')"><div class="full"><label class="label">Sarlavha</label><input id="edTitle" class="input" maxlength="120" value="${esc(l.title)}" required></div><div><label class="label">Narx (so‘m)</label><input id="edPrice" class="input" type="number" min="0" value="${Number(l.price)||0}" required></div><div style="display:flex;align-items:end"><label><input id="edNegotiable" type="checkbox" ${l.negotiable?'checked':''}> Kelishiladi</label></div><div><label class="label">Kategoriya</label><select id="edCategory" class="select" onchange="refreshEditSubcats()">${Object.keys(cats).map(x=>`<option ${x===l.category?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div><label class="label">Subkategoriya</label><select id="edSubcategory" class="select">${options}</select></div><div><label class="label">Holati</label><select id="edCondition" class="select">${conditions.map(x=>`<option ${x===l.condition?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div><label class="label">Hudud</label><select id="edRegion" class="select">${regions.map(x=>`<option ${x===l.region?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div><label class="label">Shahar/tuman</label><input id="edCity" class="input" maxlength="80" value="${esc(l.city||l.district||'')}"></div><div><label class="label">Telefon</label><input id="edPhone" class="input" maxlength="30" value="${esc(l.public_phone||'')}"></div><div class="full"><label class="label">Tavsif</label><textarea id="edDescription" class="textarea" rows="7" maxlength="5000">${esc(l.description||'')}</textarea></div><div class="full actions"><button class="btn primary" type="submit">Saqlash</button><button class="btn" type="button" onclick="go('#myads')">Bekor qilish</button><button class="btn danger" type="button" onclick="deleteListing('${l.id}')">E’lonni o‘chirish</button></div></form>`;
  }
  window.refreshEditSubcats=()=>{const c=document.getElementById('edCategory'),s=document.getElementById('edSubcategory');if(!c||!s)return;s.innerHTML=(cats[c.value]||[]).map(x=>`<option>${esc(x)}</option>`).join('');};
  window.saveEditedListing=async function(id){
    if(!state.user)return auth();
    const title=document.getElementById('edTitle')?.value.trim(),price=Number(document.getElementById('edPrice')?.value||0);
    if(!title||!Number.isFinite(price)||price<0)return toast('Sarlavha va narxni tekshiring');
    const payload={title,price,negotiable:!!document.getElementById('edNegotiable')?.checked,category:document.getElementById('edCategory')?.value||'',subcategory:document.getElementById('edSubcategory')?.value||'',condition:document.getElementById('edCondition')?.value||'',region:document.getElementById('edRegion')?.value||'',city:document.getElementById('edCity')?.value.trim()||'',public_phone:document.getElementById('edPhone')?.value.trim()||'',description:document.getElementById('edDescription')?.value.trim()||'',updated_at:new Date().toISOString()};
    const {error}=await sb.from('listings').update(payload).eq('id',id).eq('user_id',state.user.id);if(error)return toast('Saqlashda xatolik: '+error.message);toast('E’lon yangilandi');go('#item/'+id);
  };
  window.deleteListing=async function(id){
    if(!state.user)return auth();
    const {data:l}=await sb.from('listings').select('id').eq('id',id).eq('user_id',state.user.id).maybeSingle();if(!l)return toast('E’lon topilmadi');
    if(!confirm('Bu e’lonni butunlay o‘chirishni tasdiqlaysizmi?'))return;
    await sb.from('listing_images').delete().eq('listing_id',id);
    const {error}=await sb.from('listings').delete().eq('id',id).eq('user_id',state.user.id);if(error)return toast('O‘chirishda xatolik: '+error.message);toast('E’lon o‘chirildi');go('#myads');
  };
  async function renderV19(){
    const h=location.hash||'#/';
    if(h.startsWith('#seller/')){document.getElementById('app').innerHTML=header()+`<main class="container">${await sellerProfile(decodeURIComponent(h.slice(8)))}</main>`+mobile();return true;}
    if(h.startsWith('#edit/')){document.getElementById('app').innerHTML=header()+`<main class="container">${await editListing(decodeURIComponent(h.slice(6)))}</main>`+mobile();return true;}
    return false;
  }
  async function enhance(){
    const h=location.hash||'#/'
    if(h.startsWith('#item/')){
      const id=decodeURIComponent(h.slice(6));
      try{
        const {data:l}=await sb.from('listings').select('id,user_id,title').eq('id',id).maybeSingle();
        if(l){
          const seller=document.querySelector('.seller');
          if(seller&&!seller.dataset.v19){seller.dataset.v19='1';seller.style.cursor='pointer';seller.title='Sotuvchi profilini ochish';seller.onclick=()=>go('#seller/'+encodeURIComponent(l.user_id));}
          const actions=document.querySelector('.detail .panel .actions');
          if(actions&&!actions.querySelector('[data-share]')){const b=document.createElement('button');b.className='btn';b.dataset.share='1';b.textContent='↗ Ulashish';b.onclick=()=>shareListing(l.id,l.title);actions.appendChild(b);}
          if(state.user?.id===l.user_id&&actions&&!actions.querySelector('[data-edit]')){const b=document.createElement('button');b.className='btn';b.dataset.edit='1';b.textContent='✎ Tahrirlash';b.onclick=()=>go('#edit/'+l.id);actions.appendChild(b);}
        }
      }catch(e){console.warn(e)}
    }
    if(h==='#myads'){
      document.querySelectorAll('.panel table tbody tr').forEach(tr=>{
        const btn=tr.querySelector('button[onclick*="go(\'#item/"]');if(!btn||tr.dataset.v19)return;tr.dataset.v19='1';
        const m=btn.getAttribute('onclick')?.match(/#item\/([^']+)/);if(!m)return;const id=m[1];
        const td=tr.lastElementChild||tr.appendChild(document.createElement('td'));
        td.insertAdjacentHTML('beforeend',` <button class="btn" onclick="go('#edit/${id}')">✎</button><button class="btn danger" onclick="deleteListing('${id}')">🗑</button>`);
      });
    }
  }
  const baseRoute=window.route;
  window.route=async function(){
    if(await renderV19())return;
    if(typeof baseRoute==='function')await baseRoute();
    setTimeout(enhance,120);
  };
  window.addEventListener('hashchange',()=>setTimeout(()=>window.route(),0));
  const oldItem=window.item;
  if(typeof oldItem==='function'){
    window.item=async function(id){await incrementBuySellView(id);return oldItem(id);};
  }
  setTimeout(()=>{if((location.hash||'#/').startsWith('#seller/')||(location.hash||'#/').startsWith('#edit/'))window.route();else enhance();},80);
})();
