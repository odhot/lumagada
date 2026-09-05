'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {Search,MapPin,ChevronRight,ShieldCheck,Truck,MessageCircle,Navigation,SlidersHorizontal} from 'lucide-react';
import {categories,listings} from '@/lib/data';
import {ListingCard} from '@/components/listing-card';

const cities:Record<string,{lat:number;lng:number}>={
 Indonesia:{lat:-2.5489,lng:118.0149},Jakarta:{lat:-6.2088,lng:106.8456},Bandung:{lat:-6.9175,lng:107.6191},Surabaya:{lat:-7.2575,lng:112.7521},Yogyakarta:{lat:-7.7956,lng:110.3695}
};
const distanceKm=(a:number,b:number,c:number,d:number)=>{const R=6371,rad=Math.PI/180;const x=(c-a)*rad,y=(d-b)*rad;const h=Math.sin(x/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));};

export default function Home(){
 const [q,setQ]=useState(''); const [loc,setLoc]=useState('Jakarta'); const [radius,setRadius]=useState('Semua jarak'); const [coords,setCoords]=useState(cities.Jakarta); const [usingGps,setUsingGps]=useState(false); const [gpsError,setGpsError]=useState('');
 useEffect(()=>{const p=new URLSearchParams(location.search);setQ(p.get('q')||'')},[]);
 const useMyLocation=()=>{setGpsError('');if(!navigator.geolocation){setGpsError('Lokasi tidak tersedia di browser ini.');return}navigator.geolocation.getCurrentPosition(pos=>{setCoords({lat:pos.coords.latitude,lng:pos.coords.longitude});setUsingGps(true);setLoc('Lokasi saya')},()=>setGpsError('Izin lokasi belum diberikan. Pilih kota secara manual.'))};
 const filtered=useMemo(()=>listings.map(x=>({...x,distance:distanceKm(coords.lat,coords.lng,x.lat,x.lng)})).filter(x=>{const text=(x.title+' '+x.category+' '+x.location).toLowerCase();const matches=text.includes(q.toLowerCase());const limit=radius==='Semua jarak'?Infinity:Number(radius);return matches&&x.distance<=limit}).sort((a,b)=>a.distance-b.distance),[q,coords,radius]);
 return <main>
  <section className="bg-[#edf8ef] border-b border-green-100"><div className="container py-14 md:py-20"><div className="max-w-4xl">
   <span className="pill">MARKETPLACE INDONESIA</span>
   <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-5 leading-[1.05]">Lo Mau Apa?<br/><span className="text-green-600">Gue Ada.</span></h1>
   <p className="text-gray-600 mt-5 text-lg max-w-xl">Cari apa aja, jual apa aja. Temukan iklan terdekat atau cari ke seluruh Indonesia.</p>
   <div className="card shadow mt-8 p-2 flex flex-col md:flex-row gap-2">
    <div className="search-field flex-1"><Search aria-hidden="true" className="search-icon text-gray-400"/><input aria-label="Cari di Lumagada" className="input search-input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari mobil, HP, rumah, jasa..."/></div>
    <div className="location-field md:w-48"><MapPin aria-hidden="true" className="search-icon text-gray-400"/><select aria-label="Pilih lokasi" className="input search-location-input appearance-none" value={usingGps?'Lokasi saya':loc} onChange={e=>{const v=e.target.value;setUsingGps(false);setLoc(v);setCoords(cities[v])}}><option>Jakarta</option><option>Bandung</option><option>Surabaya</option><option>Yogyakarta</option><option>Indonesia</option>{usingGps&&<option>Lokasi saya</option>}</select></div>
    <button type="button" onClick={useMyLocation} className="btn btn-light whitespace-nowrap"><Navigation className="button-icon w-4 h-4"/>Lokasi saya</button>
    <button type="button" className="btn btn-primary md:px-8"><Search aria-hidden="true" className="button-icon w-4 h-4"/>Cari</button>
   </div>
   <div className="mt-3 flex flex-wrap items-center gap-2">
    <span className="text-sm font-bold text-gray-700 flex items-center gap-1"><SlidersHorizontal className="w-4 h-4"/>Radius:</span>
    {['Semua jarak','5','10','25','50'].map(r=><button key={r} type="button" onClick={()=>setRadius(r)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${radius===r?'bg-green-600 text-white border-green-600':'bg-white text-gray-600 border-gray-200 hover:border-green-300'}`}>{r==='Semua jarak'?'Semua jarak':`≤ ${r} km`}</button>)}
   </div>
   {gpsError&&<p className="text-xs text-red-600 mt-2">{gpsError}</p>}
  </div></div></section>
  <section className="container py-10"><div><h2 className="text-2xl font-black">Kategori</h2><p className="text-gray-500 text-sm mt-1">Mau cari apa? Kemungkinan besar ada.</p></div><div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-3 mt-6">{categories.map(([icon,name,slug])=><Link href={`/?q=${slug}`} key={slug} className="card p-3 text-center hover:border-green-300 hover:bg-green-50 transition"><div className="text-2xl">{icon}</div><div className="text-xs font-bold mt-2 leading-tight">{name}</div></Link>)}</div></section>
  <section className="container pb-8"><div className="flex items-end justify-between"><div><h2 className="text-2xl font-black">Iklan di sekitar kamu</h2><p className="text-gray-500 text-sm mt-1">Diurutkan dari yang paling dekat berdasarkan lokasi yang dipilih.</p></div><span className="text-sm font-bold text-green-700">{filtered.length} iklan</span></div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">{filtered.map(x=><ListingCard item={x} key={x.id}/>)}</div>{filtered.length===0&&<div className="card p-10 text-center mt-6"><b>Tidak ada iklan dalam radius ini.</b><p className="text-sm text-gray-500 mt-1">Coba radius yang lebih luas atau ubah lokasi.</p></div>}</section>
  <section className="container pb-12"><div className="card p-6 md:p-8 bg-white"><div className="grid md:grid-cols-3 gap-6"><div><b className="text-lg">Cari berdasarkan jarak</b><p className="text-gray-500 text-sm mt-1">Gunakan lokasi saat ini dan pilih radius 5–50 km untuk menemukan barang yang dekat.</p></div><div><b className="text-lg">Iklan gratis 7 hari</b><p className="text-gray-500 text-sm mt-1">Pasang iklan tanpa ribet. Setelah 7 hari, login dan re-up dari akun untuk tayang lagi.</p></div><div><b className="text-lg">Pro Seller</b><p className="text-gray-500 text-sm mt-1">Seller terdaftar dengan kredensial lengkap untuk membangun kepercayaan.</p></div></div></div></section>
  <section className="bg-[#15251d] text-white mt-2"><div className="container py-12 grid md:grid-cols-3 gap-8"><div className="flex gap-4"><ShieldCheck/><div><b>Transaksi lebih aman</b><p className="text-white/60 text-sm mt-1">Profil seller dan panduan keamanan membantu transaksi lebih nyaman.</p></div></div><div className="flex gap-4"><Truck/><div><b>COD & pengiriman</b><p className="text-white/60 text-sm mt-1">Pilih metode transaksi yang sesuai kebutuhan.</p></div></div><div className="flex gap-4"><MessageCircle/><div><b>Chat penjual</b><p className="text-white/60 text-sm mt-1">Tanya detail sebelum membuat keputusan.</p></div></div></div></section>
 </main>
}