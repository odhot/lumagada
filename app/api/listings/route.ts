import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {isRestrictedListing,restrictedServiceMessage} from '@/lib/policy';
import {boundedString,rateLimit,rateLimitedResponse} from '@/lib/security';

const publicSelect='id,title,description,price,condition,city,district,latitude,longitude,contact_phone,status,urgent,is_pro_listing,accepts_offers,expires_at,created_at,listing_images(url,sort_order),categories(name,slug)';

export async function GET(request:Request){
 const limitGuard=rateLimit(request,'listings:get',120,60_000);if(!limitGuard.allowed)return rateLimitedResponse(limitGuard.retryAfter);
 const supabase=await createClient();const u=new URL(request.url);const q=boundedString(u.searchParams.get('q'),100);const city=boundedString(u.searchParams.get('city'),100);const category=boundedString(u.searchParams.get('category'),80);const rawLimit=Number(u.searchParams.get('limit')||24);const rawOffset=Number(u.searchParams.get('offset')||0);const limit=Math.min(Math.max(Number.isFinite(rawLimit)?Math.trunc(rawLimit):24,1),100);const offset=Math.min(Math.max(Number.isFinite(rawOffset)?Math.trunc(rawOffset):0,0),10000);
 let query=supabase.from('listings').select(publicSelect).eq('status','active').order('created_at',{ascending:false}).range(offset,offset+limit-1);
 if(q)query=query.textSearch('search_vector',q,{config:'simple',type:'websearch'});if(city)query=query.eq('city',city);
 if(category){const {data:cat}=await supabase.from('categories').select('id').eq('name',category).maybeSingle();if(cat)query=query.eq('category_id',cat.id)}
 const {data,error}=await query;if(error)return NextResponse.json({error:'Gagal mengambil daftar iklan.'},{status:400,headers:{'cache-control':'no-store'}});
 return NextResponse.json({data:(data||[]).map((x:any)=>({...x,category:x.categories?.name||'Lainnya',category_slug:x.categories?.slug||'lainnya'})),pagination:{limit,offset,count:data?.length||0}},{headers:{'cache-control':'no-store'}});
}

export async function POST(request:Request){
 const limitGuard=rateLimit(request,'listings:post',10,10*60_000);if(!limitGuard.allowed)return rateLimitedResponse(limitGuard.retryAfter);
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:'Login diperlukan.'},{status:401});
 let body:any;try{body=await request.json()}catch{return NextResponse.json({error:'JSON tidak valid.'},{status:400})}
 const title=boundedString(body.title,120),description=boundedString(body.description,5000),condition=boundedString(body.condition,40),category=boundedString(body.category,80),city=boundedString(body.city,100),district=boundedString(body.district,100),phone=boundedString(body.contact_phone,30);const price=Number(body.price);const latitude=body.latitude==null?null:Number(body.latitude);const longitude=body.longitude==null?null:Number(body.longitude);
 if(!title||!city||!Number.isInteger(price)||price<0||price>9_000_000_000_000)return NextResponse.json({error:'Judul, lokasi, dan harga yang valid wajib diisi.'},{status:422});if(phone.replace(/\D/g,'').length<10)return NextResponse.json({error:'Nomor HP/WhatsApp yang valid wajib diisi.'},{status:422});if(latitude!==null&&(!Number.isFinite(latitude)||latitude<-90||latitude>90))return NextResponse.json({error:'Latitude tidak valid.'},{status:422});if(longitude!==null&&(!Number.isFinite(longitude)||longitude<-180||longitude>180))return NextResponse.json({error:'Longitude tidak valid.'},{status:422});if(isRestrictedListing({title,description,condition,category}))return NextResponse.json({error:restrictedServiceMessage},{status:422});
 const supabaseProfile=await supabase.from('profiles').select('seller_type').eq('id',user.id).maybeSingle();const {data:profile}=supabaseProfile;const {data:cat}=await supabase.from('categories').select('id').eq('name',category).maybeSingle();const isPro=profile?.seller_type==='pro';
 const {data,error}=await supabase.from('listings').insert({seller_id:user.id,category_id:cat?.id??null,title,description,condition,price,city,district:district||null,latitude,longitude,contact_phone:phone,accepts_offers:condition==='Lowongan'?false:body.accepts_offers!==false,is_pro_listing:isPro,status:'active',...(isPro?{expires_at:new Date(Date.now()+3650*24*60*60*1000).toISOString()}: {})}).select('id,expires_at,is_pro_listing').single();
 if(error)return NextResponse.json({error:'Iklan gagal dibuat.'},{status:400});return NextResponse.json({data},{status:201,headers:{'cache-control':'no-store'}});
}
