'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin } from 'lucide-react';
import { rupiah } from '@/lib/data';

export function ListingCard({ item }: { item: any }) {
  return (
    <Link
      href={`/listing/${item.id}`}
      className="card overflow-hidden hover:-translate-y-1 transition shadow-sm hover:shadow-md"
    >
      <div className="aspect-[4/3] relative bg-gray-100">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover"
        />
        <button
          type="button"
          aria-label="Simpan ke favorit"
          onClick={(e) => e.preventDefault()}
          className="absolute right-3 top-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center"
        >
          <Heart className="w-4 h-4" />
        </button>
        {item.urgent && <span className="absolute left-3 top-3 pill">URGENT</span>}
      </div>
      <div className="p-4">
        <div className="font-black text-lg">{rupiah(item.price)}</div>
        <div className="mt-1 font-semibold line-clamp-2 min-h-[42px]">{item.title}</div>
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-3">
          <MapPin className="w-3 h-3" />
          {item.location}
        </div>
        <div className="text-xs text-gray-400 mt-2">
          {item.condition} · {item.seller}
        </div>
      </div>
    </Link>
  );
}
