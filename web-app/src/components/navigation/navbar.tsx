"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"

const homeItems = [
  { label: "Use cases", href: "#use-cases" },
  { label: "SDK", href: "#sdk" },
  { label: "Features", href: "#features" },
  { label: "Protocols", href: "#protocols" },
]

const appItems = [
  { label: "Demo", href: "/demo" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Architecture", href: "/demo#architecture" },
]

export default function Navbar() {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const navItems = isHome ? homeItems : appItems

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#050816]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-xl">
            <Image
              src="/logo.png"
              alt="Nebula Gateway"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-white/45">NebulaID</p>
            <p className="text-sm font-semibold text-white">Nebula Gateway</p>
          </div>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="text-sm text-slate-300 transition-colors hover:text-white">
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="text-slate-300 hover:text-white">
            <Link href="/demo">
              Demo
            </Link>
          </Button>
          <Button asChild className="rounded-full bg-white text-slate-950 hover:bg-emerald-100">
            <Link href="/demo">
              Try now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
