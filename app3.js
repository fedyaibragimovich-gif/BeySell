/* BuySell V18 - discovery, sharing and view analytics */
(function(){
  const RECENT_KEY='buysell-recent-v1';
  const MAX_RECENT=12;
  function readRecent(){try{return JSON.parse(localStorage.getItem(RECENT_KEY)||'[]')}catch(e){return []}}
  function writeRecent(items){try{localStorage.setItem(RECENT_KEY,JSON.stringify(items.slice(0,MAX_RECENT)))}catch(e){}}
  function rememberListing(id){if(!id)return;const a=readRecent().filter(x=>x!==id);a.unshift(id);writeRecent(a)}
  window.shareListing=async function(id,title){
    const url=location.origin+location.pathname+'#item/'+encodeURIComponent(id);
    try{
      if(navigator.share){await navigator.share({title:title||'BuySell e’lon',text:'BuySell’dagi e’lonni ko‘ring',url});toast('Ulashish oynasi ochildi');return;}
      if(navigator.clipboard){await navigator.clipboard.writeText(url);toast('E’lon havolasi nusxalandi');return;}
    }catch(e){if(e?.name==='AbortError')return;}
    openModal('<h2>E’lon havolasi</h2><input class="input" value="'+esc(url)+'" readonly onclick="this.select()"><div class="actions" style="margin-top:12px"><button class="btn primary" onclick="navigator.clipboard?.writeText('+JSON.stringify(url)+');toast(\'Nusxalandi\');closeModal()">Nusxalash</button><button class="btn" onclick="closeModal()">Yopish</button></div>');
  };
  window.clearRecent=()=>{try{localStorage.removeItem(RECENT_KEY)}catch(e){};toast('Ko‘rilganlar tozalandi');route()};
  window.incrementBuySellView=async function(id){
    rememberListing(id);
    const key='buysell-viewed-'+id;
    try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1')}catch(e){}
    try{await sb.rpc('increment_listing_view',{p_listing_id:id})}catch(e){console.warn('view counter',e)}
  };
  const originalItem=window.item;
  if(typeof originalItem==='function'){
    window.item=async function(id){
      await incrementBuySellView(id);
      const html=await originalItem(id);
      if(!html||html.indexOf('E’lon topilmadi')>=0)return html;
      const share=`<button class="btn" onclick="shareListing('${esc(id)}',${JSON.stringify('BuySell e’lon')})">↗ Ulashish</button>`;
      const marker='>♡ Sevimli</button>';
      return html.includes(marker)?html.replace(marker,marker+share):html;
    };
  }
  const originalProfile=window.profile;
  if(typeof originalProfile==='function'){
    window.profile=function(){
      const html=originalProfile();
      const recent=readRecent();
      if(!recent.length)return html;
      return html+'<section class="section recent-section"><div class="head"><div><h2>Yaqinda ko‘rilgan</h2><span class="muted">Oxirgi ko‘rgan e’lonlaringiz</span></div><button class="btn" onclick="clearRecent()">Tozalash</button></div><div class="panel"><div class="muted">Oxirgi '+recent.length+' ta e’lon ko‘rildi.</div></div></section>';
    };
  }
})();
