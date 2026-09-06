'use client';
import {useRef,useState} from 'react';
import Link from 'next/link';
import {MapPin,CheckCircle,Clock,ShieldCheck,X,ImagePlus,AlertTriangle,Tag} from 'lucide-react';
import {createClient} from '@/lib/supabase/client';
import {isRestrictedListing,restrictedServiceMessage} from '../../lib/policy';

const cities:Record<string,{lat:number;lng:number}>={Jakarta:{lat:-6.2088,lng:106.8456},Bandung:{lat:-6.9175,lng:107.6191},Surabaya:{lat:-7.2575,lng:112.7521},Yogyakarta:{lat:-7.7956,lng:110.3695},Tangerang:{lat:-6.1783,lng:106.6319}};
const ext=(type:string)=>type==='image/png'?'png':type==='image/webp'?'webp':'jpg';

export default function Sell(){
 const supabase=createClient();
 const [done,setDone]=useState(false),[images,setImages]=useState<File[]>([]),[previews,setPreviews]=useState<string[]>([]),[title,setTitle]=useState(''),[category,setCategory]=useState('Elektronik'),[condition,setCondition]=useState('Bekas'),[price,setPrice]=useState(''),[location,setLocation]=useState('Jakarta'),[phone,setPhone]=useState(''),[description,setDescription]=useState(''),[acceptsOffers,setAcceptsOffers]=useState(true),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 const inputRef=useRef<HTMLInputElement>(null);
 const addImages=(e:React.ChangeEvent<HTMLInputElement>)=>{const files=Array.from(e.target.files||[]);if(images.length+files.length>10){setError('Maksimal 10 foto.');return}if(files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type))){setError('Gunakan JPG, PNG, atau WEBP.');return}if(files.some(f=>f.size>10*1024*1024)){setError('Setiap foto maksimal 10 MB.');return}setError('');setImages(v=>[...v,...files]);setPreviews(v=>[...v,...files.map(f=>URL.createObjectURL(f))]);e.target.value=''};
 const removeImage=(i:number)=>{URL.revokeObjectURL(previews[i]);setImages(v=>v.filter((_,n)=>n!==i));setPreviews(v=>v.filter((_,n)=>n!==i))};
 const publish=async()=>{
  if(!title.trim()||!price||!phone.trim()||images.length===0){setError('Lengkapi judul, harga, nomor HP, dan minimal 1 foto.');return}
  const item={title:title.trim(),description,condition,category};if(isRestrictedListing(item)){setError(restrictedServiceMessage);return}
  if(condition==='Lowongan'&&acceptsOffers){setAcceptsOffers(false)}
  setSaving(true);setError('');
  try{
   const res=await fetch('/api/listings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({title:title.trim(),description,condition,category,city:location,price:Number(price.replace(/\D/g,'')),latitude:cities[location].lat,longitude:cities[location].lng,contact_phone:phone,accepts_offers:condition==='Lowongan'?false:acceptsOffers})});
   const payload=await res.json();if(!res.ok)throw new Error(payload.error||'Gagal menerbitkan iklan.');
   const listingId=payload.data.id;const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error('Sesi login berakhir. Silakan masuk lagi.');
   for(let i=0;i<images.length;i++){
    const file=images[i];const path=`${user.id}/${listingId}/${i+1}-${Date.now()}.${ext(file.type)}`;
    const upload=await supabase.storage.from('listing-images').upload(path,file,{upsert:false,contentType:file.type});
    if(upload.error)throw new Error(`Foto ${i+1} gagal diunggah: ${upload.error.message}`);
    const {data:publicUrl}=supabase.storage.from('listing-images').getPublicUrl(path);
    const ins=await supabase.from('listing_images').insert({listing_id:listingId,url:publicUrl.publicUrl,sort_order:i});
    if(ins.error)throw new Error(`Foto ${i+1} gagal disimpan: ${ins.error.message}`);
   }
   setDone(true);setTimeout(()=>window.location.href=`/listing/${listingId}`,250);
  }catch(e){setError(e instanceof Error?e.message:'Gagal menerbitkan iklan.');setSaving(false)}
 };
 if(done)return <main className="container py-20 max-w-xl text-center"><CheckCircle className="w-16 h-16 text-green-600 mx-auto"/><h1 className="text-3xl font-black mt-5">Iklan berhasil diterbitkan!</h1><p className="text-gray-500 mt-2">Iklan reguler aktif 14 hari. Kelola dan re-up dari dashboard akun.</p><Link href="/dashboard" className="btn btn-primary mt-6">Buka akun saya</Link></main>;
 return <main className="container py-10 max-w-3xl"><div><h1 className="text-3xl font-black">Jual di Lumagada</h1><p className="text-gray-500 mt-2">Pasang barang, jasa, atau lowongan dengan foto dan kontak yang siap dihubungi.</p></div>
 <div className="card mt-6 p-4 bg-[#edf8ef] border-green-100 flex gap-3"><Clock className="text-green-700 shrink-0"/><div><b>Iklan reguler tayang 14 hari</b><p className="text-sm text-gray-600 mt-1">Setelah habis, login dan re-up. Seller Pro mendapatkan masa tayang tanpa batas reguler sesuai status Pro.</p></div></div>
 <div className="card mt-4 p-6 space-y-6">
  <div><label className="font-bold text-sm">Foto iklan</label><input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addImages} className="hidden"/><button type="button" onClick={()=>inputRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center mt-2 hover:border-red-300 transition"><ImagePlus className="mx-auto text-red-600"/><p className="font-bold mt-2">Pilih foto dari perangkat</p><p className="text-xs text-gray-400 mt-1">JPG/PNG/WEBP · maksimal 10 foto · 10 MB/foto · {images.length}/10</p></button>{previews.length>0&&<div className="grid grid-cols-4 gap-2 mt-3">{previews.map((src,i)=><div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100" key={src}><img src={src} alt={'Foto '+(i+1)} className="w-full h-full object-cover"/><button type="button" onClick={()=>removeImage(i)} className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"><X className="w-3 h-3"/></button></div>)}</div>}</div>
  <div><label className="font-bold text-sm">Judul</label><input value={title} onChange={e=>setTitle(e.target.value)} className="input mt-2" placeholder="Contoh: iPhone 15 Pro 256GB" maxLength={120} required/></div>
  <div className="grid md:grid-cols-2 gap-4"><div><label className="font-bold text-sm">Kategori</label><select value={category} onChange={e=>setCategory(e.target.value)} className="input mt-2"><option>Elektronik</option><option>Mobil</option><option>Motor</option><option>Properti</option><option>Jasa & Lowongan</option><option>Fashion</option><option>Hobi & Koleksi</option><option>Rumah & Perabot</option><option>Hewan</option><option>Buku</option><option>Bisnis</option><option>Lainnya</option></select></div><div><label className="font-bold text-sm">Kondisi / tipe</label><select value={condition} onChange={e=>{const v=e.target.value;setCondition(v);if(v==='Lowongan')setAcceptsOffers(false)}} className="input mt-2"><option>Bekas</option><option>Baru</option><option>Jasa</option><option>Lowongan</option></select></div></div>
  <div><label className="font-bold text-sm">Harga</label><input value={price} onChange={e=>setPrice(e.target.value.replace(/\D/g,''))} inputMode="numeric" className="input mt-2" placeholder="12500000" required/></div>
  <div className="grid md:grid-cols-2 gap-4"><div><label className="font-bold text-sm">Lokasi</label><div className="field-with-icon mt-2"><MapPin className="field-icon"/><select value={location} onChange={e=>setLocation(e.target.value)} className="input appearance-none">{Object.keys(cities).map(c=><option key={c}>{c}</option>)}</select></div></div><div><label className="font-bold text-sm">Nomor HP / WhatsApp</label><input value={phone} onChange={e=>setPhone(e.target.value)} type="tel" className="input mt-2" placeholder="0812xxxxxxxx" required/></div></div>
  <div><label className="font-bold text-sm">Deskripsi</label><textarea value={description} onChange={e=>setDescription(e.target.value)} className="input mt-2 min-h-32" placeholder="Jelaskan kondisi, layanan, atau detail lowongan..."/></div>
  <div className="card p-4 bg-[#f6f9f7] flex gap-3"><Tag className="text-green-600 shrink-0"/><div className="text-sm w-full"><b>Penawaran harga</b>{condition==='Lowongan'?<p className="text-gray-500 mt-1">Lowongan kerja tidak menerima penawaran harga.</p>:<label className="flex items-center gap-3 mt-3 cursor-pointer"><input type="checkbox" checked={acceptsOffers} onChange={e=>setAcceptsOffers(e.target.checked)} className="w-4 h-4"/><span><b>{acceptsOffers?'Menerima penawaran':'Tidak menerima penawaran'}</b><span className="block text-xs text-gray-500 mt-0.5">Pembeli hanya dapat mengajukan harga jika opsi ini aktif.</span></span></label>}</div></div>
  <div className="card p-4 bg-[#fff8e8] border-yellow-100 flex gap-3"><AlertTriangle className="text-yellow-600 shrink-0"/><div className="text-sm"><b>Beberapa layanan tidak diperbolehkan</b><p className="text-gray-600 mt-1">Lumagada tidak menerima layanan berisiko atau ilegal, termasuk pijat/massage, layanan seksual, judi, narkoba, senjata, dokumen palsu, les private, dan aktivitas ilegal lainnya.</p></div></div>
  <div className="card p-4 bg-[#f6f9f7] flex gap-3"><ShieldCheck className="text-green-600 shrink-0"/><div className="text-sm"><b>Transaksi dilakukan antar pengguna</b><p className="text-gray-500 mt-1">Lumagada hanya menyediakan platform. Pastikan identitas, barang/jasa, lokasi, dan metode pembayaran sebelum transaksi.</p></div></div>
  {error&&<p className="text-sm text-red-600 font-semibold">{error}</p>}
  <button type="button" onClick={publish} disabled={saving} className="btn btn-primary w-full disabled:opacity-60">{saving?'Menerbitkan…':'Terbitkan Iklan'}</button>
 </div></main>;
}
