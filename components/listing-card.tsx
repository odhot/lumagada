'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin, BadgeCheck } from 'lucide-react';
import { rupiah } from '@/lib/data';

function conditionLabel(condition: string) {
  const value = String(condition || '').toLowerCase();
  if (value.includes('baru') || value.includes('new')) return 'Baru';
  if (value.includes('bekas') || value.includes('second')) return 'Bekas';
  return condition || 'Tidak disebutkan';
}

export function ListingCard({ item }: { item: any }) {
  const condition = conditionLabel(item.condition);
  const isNew = condition === 'Baru';
  return (
    <Link href={`/listing/${item.id}`} className="card overflow-hidden hover:-translate-y-1 transition shadow-sm hover:shadow-md block">
      <div className="aspect-[4/3] relative bg-gray-100">
        <Image src={item.image} alt={item.title} fill className="object-cover" />
        <div className="absolute left-3 top-3 flex gap-2">
          {item.featured && <span className="pill bg-white/95">FEATURED</span>}
          {item.urgent && <span className="pill bg-white/95">URGENT</span>}
        </div>
        <button type="button" aria-label="Simpan ke favorit" onClick={(e) => e.preventDefault()} className="absolute right-3 top-3 w-9 h-9 rounded-full bg-white/95 flex items-center justify-center shadow-sm">
          <Heart className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4">
        <div className="font-black text-lg">{rupiah(item.price)}</div>
        <span className={`inline-flex mt-1 px-2.5 py-1 rounded-full text-xs font-extrabold ${isNew ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
          {condition}
        </span>
        <div className="mt-2 font-semibold line-clamp-2 min-h-[42px]">{item.title}</div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span>{item.location}</span>
          {typeof item.distance === 'number' && <><span>·</span><span className="font-semibold text-gray-600">{item.distance < 1 ? '<1' : item.distance.toFixed(1)} km</span></>}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
          <span>{item.seller}</span>
          {item.verified && <BadgeCheck className="w-3.5 h-3.5 text-green-600" aria-label="Seller terverifikasi" />}
        </div>
      </div>
    </Link>
  );
}
