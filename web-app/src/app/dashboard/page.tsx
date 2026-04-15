import { NebulaDashboard } from "@/components/nebula/dashboard"

export default function DashboardPage() {
  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden bg-[#050816]">
      {/* Background gradients matching landing page */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.16),_transparent_46%),radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,0.12),_transparent_42%)]" />
        <div className="absolute left-[8%] top-10 h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute right-[2%] top-[28%] h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10">
        <NebulaDashboard />
      </div>
    </div>
  )
}
