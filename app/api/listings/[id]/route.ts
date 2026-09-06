import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isRestrictedListing,restrictedServiceMessage} from '@/lib/policy';

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const supabase=await createClient();
 const {data,error}=await supabase.from('listings').select('id,title,description,price,condition,city,district,latitude,longitude,contact_phone,status,urgent,is_pro_listing,accepts_offers,expires_at,created_at,updated_at,listing_images(id,url,sort_order),seller_id').eq('id',id).maybeSingle();
 if(error)return NextResponse.json({error:error.message},{status:400});
 if(!data)return NextResponse.json({error:'Iklan tidak ditemukan.'},{status:404});
 return NextResponse.json({data});
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:'Login diperlukan.'},{status:401});
 const body=await request.json().catch(()=>({}));
 if(body.action==='reup'){
  const {data,error}=await supabase.rpc('reup_listing',{p_listing_id:id});
  if(error)return NextResponse.json({error:error.message},{status:400});
  if(!data)return NextResponse.json({error:'Iklan tidak dapat di-re-up.'},{status:422});
  return NextResponse.json({data});
 }
 const allowed=['title','description','price','city','district','latitude','longitude','contact_phone','accepts_offers','urgent'];
 const patch:any={};for(const key of allowed)if(key in body)patch[key]=body[key];
 if('title' in patch||'description' in patch){const current=await supabase.from('listings').select('title,description,condition,category_id').eq('id',id).eq('seller_id',user.id).maybeSingle();if(current.error||!current.data)return NextResponse.json({error:'Iklan tidak ditemukan.'},{status:404});if(isRestrictedListing({title:patch.title??current.data.title,description:patch.description??current.data.description,condition:current.data.condition,category:String(current.data.category_id||'')}))return NextResponse.json({error:restrictedServiceMessage},{status:422})}
 if(Object.keys(patch).length===0)return NextResponse.json({error:'Tidak ada perubahan.'},{status:422});
 const {data,error}=await supabase.from('listings').update(patch).eq('id',id).eq('seller_id',user.id).select('id,expires_at,status,accepts_offers').maybeSingle();
 if(error)return NextResponse.json({error:error.message},{status:400});if(!data)return NextResponse.json({error:'Iklan tidak ditemukan.'},{status:404});return NextResponse.json({data});
}

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
 if(!user)return NextResponse.json({error:'Login diperlukan.'},{status:401});
 const {data,error}=await supabase.from('listings').delete().eq('id',id).eq('seller_id',user.id).select('id').maybeSingle();
 if(error)return NextResponse.json({error:error.message},{status:400});if(!data)return NextResponse.json({error:'Iklan tidak ditemukan.'},{status:404});return NextResponse.json({data});
}
