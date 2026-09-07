/* BuySell V18 - archive-aware listing lifecycle */
(function(){
  window.deactivateListing=async function(id){
    if(!state.user)return auth();
    if(!confirm('Bu e’lonni faol ro‘yxatdan chiqaramizmi?'))return;
    const {data,error}=await sb.rpc('archive_listing',{p_listing_id:id,p_archived:true});
    if(error)return toast(error.message);
    if(data!==true)return toast('E’lonni o‘chirishga ruxsat yo‘q');
    toast('E’lon arxivlandi');route();
  };
  window.reactivateListing=async function(id){
    if(!state.user)return auth();
    const {data,error}=await sb.rpc('archive_listing',{p_listing_id:id,p_archived:false});
    if(error)return toast(error.message);
    if(data!==true)return toast('E’lonni qayta joylashga ruxsat yo‘q');
    toast('E’lon qayta faollashtirildi');route();
  };
  window.queryListings=async function(){
    let q=sb.from('listings').select('id,title,price,negotiable,category,subcategory,condition,region,district,city,description,user_id,created_at,promotion').eq('status','active').eq('archived',false).order('created_at',{ascending:false}).limit(60);
    if(state.search){const term=safeSearch(state.search);if(term)q=q.or(`title.ilike.%${term}%,description.ilike.%${term}%`);}
    if(state.category)q=q.eq('category',state.category);if(state.subcategory)q=q.eq('subcategory',state.subcategory);if(state.region)q=q.eq('region',state.region);if(state.condition)q=q.eq('condition',state.condition);
    if(state.minPrice!==''&&Number.isFinite(Number(state.minPrice)))q=q.gte('price',Number(state.minPrice));if(state.maxPrice!==''&&Number.isFinite(Number(state.maxPrice)))q=q.lte('price',Number(state.maxPrice));
    if(state.sort==='price_asc')q=q.order('price',{ascending:true});else if(state.sort==='price_desc')q=q.order('price',{ascending:false});else if(state.sort==='views')q=q.order('views',{ascending:false});else q=q.order('created_at',{ascending:false});
    let {data,error}=await q;if(error){console.error('queryListings',error);toast('E’lonlarni yuklashda xatolik: '+error.message);return []}
    let ids=(data||[]).map(x=>x.id);if(!ids.length)return data||[];
    let {data:imgs,error:ie}=await sb.from('listing_images').select('listing_id,public_url,sort_order').in('listing_id',ids).order('sort_order');if(ie)console.error('listing_images',ie);
    const map={};(imgs||[]).forEach(x=>(map[x.listing_id]??=[]).push(x));return (data||[]).map(x=>({...x,listing_images:map[x.id]||[]}));
  };
  const baseItem=window.item;
  if(typeof baseItem==='function'){
    window.item=async function(id){
      const {data:l,error}=await sb.from('listings').select('id,user_id,archived').eq('id',id).maybeSingle();
      if(error)return '<div class="panel">E’lonni ochib bo‘lmadi.</div>';
      if(l?.archived && l.user_id!==state.user?.id)return '<div class="panel"><h3>E’lon mavjud emas</h3><p class="muted">Bu e’lon sotuvchi tomonidan arxivlangan.</p></div>';
      return baseItem(id);
    };
  }
})();
