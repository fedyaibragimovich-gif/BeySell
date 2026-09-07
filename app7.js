/* BuySell V20 - recent listings + unread message indicators */
(function(){
  const RECENT_KEY='buysell-recent-v1', READ_KEY='buysell-chat-read-v1';
  const esc2=x=>typeof esc==='function'?esc(x):String(x??'');
  const readRecent=()=>{try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')}catch(e){return[]}};
  const readMarks=()=>{try{return JSON.parse(localStorage.getItem(READ_KEY)||'{}')}catch(e){return{}}};
  const writeMarks=x=>{try{localStorage.setItem(READ_KEY,JSON.stringify(x))}catch(e){}};

  window.markConversationRead=function(id,at){
    if(!id)return;const m=readMarks();m[id]=at||new Date().toISOString();writeMarks(m);
  };

  window.recentListings=async function(){
    const ids=readRecent();
    if(!ids.length)return '<div class="panel"><h2>Yaqinda ko‘rilganlar</h2><p class="muted">Hali e’lon ko‘rilmagan.</p><button class="btn" onclick="go(\'#/\')">Bosh sahifa</button></div>';
    const {data:ls,error}=await sb.from('listings').select('id,title,price,negotiable,category,subcategory,condition,region,city,description,user_id,created_at,promotion,status').in('id',ids).eq('status','active');
    if(error)return `<div class="panel">${esc2(error.message)}</div>`;
    const ordered=ids.map(id=>(ls||[]).find(x=>x.id===id)).filter(Boolean);
    if(!ordered.length)return '<div class="panel"><h2>Yaqinda ko‘rilganlar</h2><p class="muted">E’lonlar endi mavjud emas.</p></div>';
    const imageIds=ordered.map(x=>x.id),{data:imgs}=await sb.from('listing_images').select('listing_id,public_url,sort_order').in('listing_id',imageIds).order('sort_order');
    const map={};(imgs||[]).forEach(x=>(map[x.listing_id]??=[]).push(x));ordered.forEach(x=>x.listing_images=map[x.id]||[]);
    return `<div class="head"><div><h2>Yaqinda ko‘rilganlar</h2><div class="muted">Oxirgi ${ordered.length} ta e’lon</div></div><button class="btn" onclick="clearRecent()">Tozalash</button></div><div class="cards">${ordered.map(card).join('')}</div>`;
  };

  window.getUnreadCount=async function(){
    if(!state.user)return 0;
    const {data:cs}=await sb.from('conversations').select('id,buyer_id,seller_id').or(`buyer_id.eq.${state.user.id},seller_id.eq.${state.user.id}`);
    if(!cs?.length)return 0;
    const marks=readMarks();let n=0;
    for(const c of cs){
      const {data:m}=await sb.from('messages').select('created_at,sender_id').eq('conversation_id',c.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(m&&m.sender_id!==state.user.id&&(!marks[c.id]||new Date(m.created_at)>new Date(marks[c.id])))n++;
    }
    return n;
  };

  async function decorateNav(){
    if(!state.user)return;
    try{
      const n=await getUnreadCount();
      document.querySelectorAll('[data-messages-nav]').forEach(x=>x.removeAttribute('data-messages-nav'));
      const targets=[...document.querySelectorAll('button')].filter(x=>x.textContent.includes('Xabarlar'));
      targets.forEach(b=>{b.dataset.messagesNav='1';if(n&&!b.querySelector('.unread-dot')){const s=document.createElement('span');s.className='unread-dot';s.textContent=n>9?'9+':String(n);s.style.cssText='margin-left:5px;display:inline-flex;min-width:18px;height:18px;padding:0 5px;align-items:center;justify-content:center;border-radius:99px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;vertical-align:middle';b.appendChild(s);}});
    }catch(e){console.warn('unread badge',e)}
  }

  const oldMessages=window.messages;
  if(typeof oldMessages==='function'){
    window.messages=async function(){
      const html=await oldMessages();
      if(state.conversation){
        const {data:m}=await sb.from('messages').select('created_at').eq('conversation_id',state.conversation).order('created_at',{ascending:false}).limit(1).maybeSingle();
        markConversationRead(state.conversation,m?.created_at||new Date().toISOString());
      }
      return html;
    };
  }

  const oldRoute=window.route;
  window.route=async function(){
    const h=location.hash||'#/'
    if(h==='#recent'){
      const app=document.getElementById('app');if(app)app.innerHTML=header()+`<main class="container">${await recentListings()}</main>`+mobile();return;
    }
    if(typeof oldRoute==='function')await oldRoute.apply(this,arguments);
    setTimeout(decorateNav,160);
  };
  window.addEventListener('hashchange',()=>setTimeout(()=>window.route(),0));
  setTimeout(decorateNav,500);
})();
