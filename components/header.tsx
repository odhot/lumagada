'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Search,
  Heart,
  UserRound,
  PlusCircle,
  Menu,
  X,
  Home,
  MessageCircle,
  LayoutDashboard,
  ShieldCheck,
  CircleHelp,
  FileText,
  LogIn,
} from 'lucide-react';

const menuItems = [
  { href: '/', label: 'Beranda', icon: Home },
  { href: '/favorites', label: 'Favorit', icon: Heart },
  { href: '/chat', label: 'Pesan & Chat', icon: MessageCircle },
  { href: '/dashboard', label: 'Dashboard Saya', icon: LayoutDashboard },
  { href: '/sell', label: 'Jual / Pasang Iklan', icon: PlusCircle, primary: true },
  { href: '/login', label: 'Masuk / Daftar', icon: LogIn },
];

const infoItems = [
  { href: '/trust-and-safety', label: 'Keamanan & Tips Transaksi', icon: ShieldCheck },
  { href: '/terms', label: 'Syarat & Ketentuan', icon: FileText },
  { href: '/help', label: 'Pusat Bantuan', icon: CircleHelp },
];

export function Header() {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  const submit = () => {
    const value = q.trim();
    location.href = value ? `/?q=${encodeURIComponent(value)}` : '/';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#e4ebe6]">
      <div className="container h-16 flex items-center gap-3 md:gap-4 relative">
        <Link href="/" aria-label="Lumagada — Lu Mau Gue Ada" className="shrink-0 flex items-center">
          <img src="/lumagada-logo.svg" alt="Lumagada — Lu Mau Gue Ada" className="w-[112px] sm:w-[132px] md:w-[142px] h-[54px] sm:h-[58px] object-contain" />
        </Link>

        <form onSubmit={e => { e.preventDefault(); submit(); }} className="hidden md:flex flex-1 max-w-xl search-field">
          <Search aria-hidden="true" className="search-icon text-gray-400 w-4 h-4" />
          <input aria-label="Cari di Lumagada" value={q} onChange={e => setQ(e.target.value)} className="input search-input bg-[#f6f9f7]" placeholder="Cari mobil, HP, rumah, jasa..." />
        </form>

        <nav className="ml-auto flex items-center gap-2">
          <Link href="/favorites" className="hidden sm:flex btn text-sm">
            <Heart aria-hidden="true" className="button-icon w-4 h-4" />Favorit
          </Link>
          <Link href="/login" className="hidden sm:flex btn text-sm">
            <UserRound aria-hidden="true" className="button-icon w-4 h-4" />Masuk
          </Link>
          <Link href="/sell" className="btn btn-primary text-sm">
            <PlusCircle aria-hidden="true" className="button-icon w-4 h-4" />Jual
          </Link>
          <button
            type="button"
            aria-label={open ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={open}
            aria-controls="main-menu"
            onClick={() => setOpen(v => !v)}
            className="btn p-3 border border-[#dce5df] bg-white hover:bg-[#f6f9f7]"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {open && (
          <div id="main-menu" className="absolute right-0 top-[calc(100%+8px)] w-[min(390px,calc(100vw-32px))] max-h-[calc(100vh-88px)] overflow-y-auto border border-[#e4ebe6] bg-white rounded-2xl shadow-2xl">
            <div className="p-4">
              <form onSubmit={e => { e.preventDefault(); submit(); closeMenu(); }} className="search-field mb-4">
                <Search aria-hidden="true" className="search-icon text-gray-400" />
                <input aria-label="Cari di Lumagada" value={q} onChange={e => setQ(e.target.value)} className="input search-input bg-[#f6f9f7]" placeholder="Cari di Lumagada..." />
              </form>

              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400 px-1 mb-2">Menu utama</div>
              <div className="grid gap-1">
                {menuItems.map(({ href, label, icon: Icon, primary }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 font-bold transition hover:bg-gray-50 ${primary ? 'bg-[#fff1f3] text-[#d9081b]' : 'text-[#15251d]'}`}
                  >
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center ${primary ? 'bg-[#d9081b] text-white' : 'bg-[#f3f6f4] text-gray-700'}`}>
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>
                    <span>{label}</span>
                  </Link>
                ))}
              </div>

              <div className="h-px bg-[#e9eeeb] my-4" />
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-gray-400 px-1 mb-2">Bantuan & keamanan</div>
              <div className="grid gap-1">
                {infoItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Icon className="w-4 h-4 text-gray-500" aria-hidden="true" />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>

              <div className="mt-4 rounded-2xl bg-[#15251d] text-white p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0 text-green-300" />
                  <div>
                    <div className="font-extrabold text-sm">Tetap aman saat transaksi</div>
                    <div className="text-xs text-white/65 mt-1 leading-relaxed">Gunakan chat Lumagada, cek barang atau layanan, dan hindari pembayaran sebelum semuanya jelas.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
