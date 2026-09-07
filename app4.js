/* BuySell V18 - account and listing management */
(function(){
  const s=x=>String(x??'').trim();
  const e=x=>typeof esc==='function'?esc(x):String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const m=x=>typeof money==='function'?money(x):new Intl.NumberFormat('uz-UZ').format(Number(x||0))+" so'm";

  window.editListing=async function(id){
    if(!state.user)return auth();
    const {data:l,error}=await sb.from('listings').select('id,title,price,negotiable,description,region,condition,category,subcategory').eq('id',id).eq('user_id',state.user.id).maybeSingle();
    if(error||!l)return toast(error?.message||'E’lon topilmadi');
    const regs=(typeof regions!=='undefined'?regions:[]).map(x=>`<option ${l.region===x?'selected':''}>${e(x)}</option>`).join('');
    const cond=['Yangi','Yaxshi','Ishlatilgan','Ta’mirtalab'].map(x=>`<option ${l.condition===x?'selected':''}>${x}</option>`).join('');
    openModal(`<h2>E’lonni tahrirlash</h2><div class="muted">${e(l.category)} · ${e(l.subcategory||'')}</div><input id="elTitle" class="input" style="margin-top:10px" maxlength="120" value="${e(l.title)}" placeholder="Sarlavha"><input id="elPrice" class="input" style="margin-top:10px" type="number" min="0" value="${Number(l.price)||0}" placeholder="Narx"><select id="elRegion" class="select" style="margin-top:10px"><option value="">Hudud</option>${regs}</select><select id="elCondition" class="select" style="margin-top:10px"><option value="">Holati</option>${cond}</select><textarea id="elDesc" class="textarea" rows="6" maxlength="5000" style="margin-top:10px" placeholder="Tavsif">${e(l.description||'')}</textarea><label style="display:flex;gap:8px;align-items:center;margin-top:10px"><input id="elNegotiable" type="checkbox" ${l.negotiable?'checked':''}> Kelishiladi</label><div class="actions" style="margin-top:14px"><button class="btn primary" onclick="saveListingEdit('${l.id}')">Saqlash</button><button class="btn" onclick="closeModal()">Bekor</button></div>`);
  };

  window.saveListingEdit=async function(id){
    if(!state.user)return auth();
    const title=s(document.getElementById('elTitle')?.value), price=Number(document.getElementById('elPrice')?.value||0), region=s(document.getElementById('elRegion')?.value), condition=s(document.getElementById('elCondition')?.value), description=s(document.getElementById('elDesc')?.value), negotiable=!!document.getElementById('elNegotiable')?.checked;
    if(title.length<3)return toast('Sarlavha kamida 3 belgi bo‘lsin');
    if(!Number.isFinite(price)||price<0)return toast('Narxni to‘g‘ri kiriting');
    if(description.length<10)return toast('Tavsif kamida 10 belgi bo‘lsin');
    const {error}=await sb.from('listings').update({title,price,region:region||null,condition:condition||null,description,negotiable,updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',state.user.id);
    if(error)return toast(error.message);
    closeModal();toast('E’lon yangilandi');route();
  };

  window.deactivateListing=async function(id){
    if(!state.user)return auth();
    if(!confirm('Bu e’lonni faol ro‘yxatdan chiqaramizmi?'))return;
    const {error}=await sb.from('listings').update({status:'rejected',updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',state.user.id);
    if(error)return toast(error.message);
    toast('E’lon faol ro‘yxatdan chiqarildi');route();
  };

  window.reactivateListing=async function(id){
    if(!state.user)return auth();
    const {error}=await sb.from('listings').update({status:'pending',updated_at:new Date().toISOString()}).eq('id',id).eq('user_id',state.user.id);
    if(error)return toast(error.message);
    toast('E’lon qayta moderatsiyaga yuborildi');route();
  };

  window.editProfile=async function(){
    if(!state.user)return auth();
    const p=state.profile||{};
    openModal(`<h2>Profilni tahrirlash</h2><input id="pn" class="input" maxlength="80" value="${e(p.name||'')}" placeholder="Ism"><input id="pp" class="input" style="margin-top:10px" maxlength="30" value="${e(p.phone||'')}" placeholder="Telefon"><input id="pa" class="input" style="margin-top:10px" maxlength="500" value="${e(p.avatar_url||'')}" placeholder="Avatar URL (ixtiyoriy)"><div class="actions" style="margin-top:14px"><button class="btn primary" onclick="saveProfileEdit()">Saqlash</button><button class="btn" onclick="closeModal()">Bekor</button></div>`);
  };

  window.saveProfileEdit=async function(){
    if(!state.user)return auth();
    const name=s(document.getElementById('pn')?.value),phone=s(document.getElementById('pp')?.value),avatar_url=s(document.getElementById('pa')?.value);
    if(name.length<2)return toast('Ismni kiriting');
    if(phone&&!/^[+()\-\s\d]{7,30}$/.test(phone))return toast('Telefon raqamini tekshiring');
    const {data,error}=await sb.from('profiles').update({name,phone:phone||null,avatar_url:avatar_url||null}).eq('id',state.user.id).select('id,name,phone,avatar_url,rating,verified,role,created_at').maybeSingle();
    if(error)return toast(error.message);
    state.profile=data||{...state.profile,name,phone,avatar_url};closeModal();toast('Profil saqlandi');route();
  };

  window.openAccountSettings=function(){
    if(!state.user)return auth();
    openModal(`<h2>Hisob sozlamalari</h2><div class="muted">${e(state.user.email||'')}</div><input id="ne" class="input" style="margin-top:10px" type="email" placeholder="Yangi email"><div class="actions" style="margin-top:14px"><button class="btn primary" onclick="changeAuthEmail()">Emailni o‘zgartirish</button><button class="btn" onclick="closeModal()">Yopish</button></div>`);
  };

  window.changeAuthEmail=async function(){
    if(!state.user)return auth();const next=s(document.getElementById('ne')?.value);
    if(!/^\S+@\S+\.\S+$/.test(next))return toast('Emailni to‘g‘ri kiriting');
    const {error}=await sb.auth.updateUser({email:next});if(error)return toast(error.message);
    closeModal();toast('Tasdiqlash havolasi yangi emailga yuborildi');
  };

  window.myads=async function(){
    if(!state.user)return '<div class="panel">Kirish kerak.</div>';
    let {data:ls,error}=await sb.from('listings').select('id,title,price,region,status,created_at,category,subcategory').eq('user_id',state.user.id).order('created_at',{ascending:false});
    if(error)return `<div class="panel">E’lonlarni yuklashda xatolik: ${e(error.message)}</div>`;
    ls=ls||[];const active=ls.filter(x=>x.status==='active').length,pending=ls.filter(x=>x.status==='pending').length;
    return `<div class="head"><div><h2>Mening e’lonlarim</h2><div class="muted">${active} faol · ${pending} moderatsiyada · jami ${ls.length}</div></div><button class="btn primary" onclick="go('#create')">+ Yangi</button></div><div class="panel"><div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><tbody>${ls.map(l=>`<tr><td style="padding:12px;border-bottom:1px solid var(--line);min-width:190px"><b>${e(l.title)}</b><div class="meta">${e(l.category||'')} · ${e(l.region||'')}</div></td><td style="padding:12px;white-space:nowrap">${m(l.price)}</td><td style="padding:12px"><span class="badge">${e(l.status)}</span></td><td style="padding:12px"><div class="actions"><button class="btn" onclick="go('#item/${l.id}')">Ko‘rish</button><button class="btn" onclick="editListing('${l.id}')">Tahrirlash</button>${l.status==='active'?`<button class="btn danger" onclick="deactivateListing('${l.id}')">O‘chirish</button>`:l.status==='rejected'?`<button class="btn primary" onclick="reactivateListing('${l.id}')">Qayta joylash</button>`:''}</div></td></tr>`).join('')||'<tr><td style="padding:16px">Hali e’lon yo‘q.</td></tr>'}</tbody></table></div></div>`;
  };

  window.profile=function(){
    if(!state.user)return `<div class="panel"><h2>Profil</h2><p class="muted">E’lon berish, sevimlilar va chat uchun hisobga kiring.</p><button class="btn primary" onclick="auth()">Kirish / Ro‘yxatdan o‘tish</button></div>`;
    const p=state.profile||{};
    return `<div class="profilegrid"><div class="panel"><div class="seller"><div class="avatar" style="width:64px;height:64px;font-size:24px;overflow:hidden">${p.avatar_url?`<img src="${e(p.avatar_url)}" style="width:100%;height:100%;object-fit:cover">`:e((p.name||'F')[0])}</div><div><h2 style="margin:0">${e(p.name||'Foydalanuvchi')} ${p.verified?'✓':''}</h2><div class="meta">${e(p.phone||'Telefon kiritilmagan')} · ⭐ ${p.rating||5}</div></div></div><div class="actions" style="margin-top:16px"><button class="btn primary" onclick="editProfile()">Profilni tahrirlash</button><button class="btn" onclick="openAccountSettings()">Hisob sozlamalari</button></div></div><div class="panel"><h3>Tezkor bo‘limlar</h3><div class="actions"><button class="btn" onclick="go('#myads')">📦 Mening e’lonlarim</button><button class="btn" onclick="go('#favorites')">♡ Sevimlilar</button><button class="btn" onclick="go('#messages')">💬 Xabarlar</button>${p.role==='admin'?`<button class="btn" onclick="go('#moderation')">🛡 Moderatsiya</button>`:''}</div></div></div>`;
  };
})();
