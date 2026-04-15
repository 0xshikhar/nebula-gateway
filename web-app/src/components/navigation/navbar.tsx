"use client"

import Link from "next/link"
import { BadgeCheck, Sparkles } from "lucide-react"

const navItems = [
  { label: "Demo", href: "/demo" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Architecture", href: "/demo#architecture" },
]

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/demo" className="flex items-center gap-3 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
            <Sparkles className="h-5 w-5 text-emerald-200" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/45">NebulaID</p>
            <p className="text-sm font-semibold text-white">Nebula Trust Gateway</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 md:flex">
            <BadgeCheck className="h-4 w-4 text-emerald-200" />
            HashKey Chain testnet
          </div>
          <Link
            href="/demo"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Open demo
          </Link>
        </div>
      </div>
    </nav>
  )
}
