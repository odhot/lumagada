'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {Search,MapPin,ChevronRight,ShieldCheck,Truck,MessageCircle} from 'lucide-react';
import {categories,listings} from '@/lib/data';
import {ListingCard} from '@/components/listing-card';

export default function Home(){
 const [q,setQ]=useState(''); const [loc,setLoc]=useState('Indonesia');
 useEffect(()=>{const p=new URLSearchParams(location.search);setQ(p.get('q')||'')},[]);
 const filtered=useMemo(()=>listings.filter(x=>(x.title+' '+x.category+' '+x.location).toLowerCase().includes(q.toLowerCase())),[q]);
 return <main>
  <section className="bg-[#edf8ef] border-b border-green-100"><div className="container py-14 md:py-20"><div className="max-w-3xl">
   <span className="pill">MARKETPLACE INDONESIA</span>
   <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-5 leading-[1.05]">Lo Mau Apa?<br/><span className="text-green-600">Gue Ada.</span></h1>
   <p className="text-gray-600 mt-5 text-lg max-w-xl">Cari apa aja, jual apa aja. Semua orang bebas pasang iklan di Lumagada, dengan masa tayang 7 hari.</p>
   <div className="card shadow mt-8 p-2 flex flex-col md:flex-row gap-2">
    <div className="flex-1 relative min-w-0"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"/><input className="input border-0 pl-14" value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari apa aja..."/></div>
    <div className="md:w-48 relative"><MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"/><select className="input pl-12 appearance-none" value={loc} onChange={e=>setLoc(e.target.value)}><option>Indonesia</option><option>Jakarta</option><option>Bandung</option><option>Surabaya</option><option>Yogyakarta</option></select></div>
    <button type="button" className="btn btn-primary md:px-8"><Search className="w-4 h-4"/>Cari</button>
   </div>
  </div></div></section>
  <section className="container py-10"><div><h2 className="text-2xl font-black">Kategori</h2><p className="text-gray-500 text-sm mt-1">Mau cari apa? Kemungkinan besar ada.</p></div><div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-3 mt-6">{categories.map(([icon,name,slug])=><Link href={`/?q=${slug}`} key={slug} className="card p-3 text-center hover:border-green-300 hover:bg-green-50 transition"><div className="text-2xl">{icon}</div><div className="text-xs font-bold mt-2 leading-tight">{name}</div></Link>)}</div></section>
  <section className="container pb-8"><div className="flex items-end justify-between"><div><h2 className="text-2xl font-black">Pilihan untukmu</h2><p className="text-gray-500 text-sm mt-1">Iklan dari berbagai kota di Indonesia</p></div><button type="button" className="text-green-700 font-bold text-sm flex items-center">Lihat semua <ChevronRight className="w-4 h-4"/></button></div><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">{filtered.map(x=><ListingCard item={x} key={x.id}/>)}</div></section>
  <section className="container pb-12"><div className="card p-6 md:p-8 bg-white"><div className="grid md:grid-cols-3 gap-6"><div><b className="text-lg">Iklan gratis 7 hari</b><p className="text-gray-500 text-sm mt-1">Pasang iklan tanpa ribet. Setelah 7 hari, login dan re-up dari akun untuk tayang lagi.</p></div><div><b className="text-lg">Pro Seller</b><p className="text-gray-500 text-sm mt-1">Seller terdaftar dengan kredensial lengkap untuk membangun kepercayaan dan transaksi lebih serius.</p></div><div><b className="text-lg">Fee hanya transaksi besar</b><p className="text-gray-500 text-sm mt-1">Untuk transaksi di atas Rp1.000.000, Lumagada mengambil fee kecil sesuai ketentuan platform.</p></div></div></div></section>
  <section className="bg-[#15251d] text-white mt-2"><div className="container py-12 grid md:grid-cols-3 gap-8"><div className="flex gap-4"><ShieldCheck/><div><b>Transaksi lebih aman</b><p className="text-white/60 text-sm mt-1">Profil seller dan panduan keamanan membantu transaksi lebih nyaman.</p></div></div><div className="flex gap-4"><Truck/><div><b>COD & pengiriman</b><p className="text-white/60 text-sm mt-1">Pilih metode transaksi yang sesuai kebutuhan.</p></div></div><div className="flex gap-4"><MessageCircle/><div><b>Chat penjual</b><p className="text-white/60 text-sm mt-1">Tanya detail sebelum membuat keputusan.</p></div></div></div></section>
 </main>
}