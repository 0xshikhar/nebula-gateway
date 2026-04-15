import { TrustGateway } from "@/components/nebula/trust-gateway"

export default function DemoPage() {
  return (
    <div className="relative min-h-[calc(100vh-73px)] overflow-hidden bg-[#050816]">
      {/* Background gradients matching landing page */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(16,185,129,0.16),_transparent_46%),radial-gradient(ellipse_at_bottom_right,_rgba(56,189,248,0.12),_transparent_42%)]" />
        <div className="absolute left-[8%] top-10 h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-[140px]" />
        <div className="absolute right-[2%] top-[28%] h-[26rem] w-[26rem] rounded-full bg-cyan-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:py-14">
        {/* Header section */}
        <div className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Interactive Demo
          </div>
          <h1 className="max-w-2xl text-balance text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
            Try the trust verification flow
          </h1>
          <p className="max-w-xl text-sm leading-6 text-slate-300/80 md:text-base">
            Connect your wallet, select a protocol preset, and generate a Semaphore proof. 
            See how Nebula Gateway evaluates trust without exposing identity.
          </p>
        </div>

        {/* Trust Gateway Component */}
        <TrustGateway />

        {/* Info cards below */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/60">Step 1</p>
            <h3 className="mt-1 text-sm font-medium text-white">Connect Wallet</h3>
            <p className="mt-1 text-xs text-slate-300/70">
              Link your wallet on HashKey testnet. No KYC required.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/60">Step 2</p>
            <h3 className="mt-1 text-sm font-medium text-white">Configure Policy</h3>
            <p className="mt-1 text-xs text-slate-300/70">
              Select protocol and reputation band for trust evaluation.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/60">Step 3</p>
            <h3 className="mt-1 text-sm font-medium text-white">Generate Proof</h3>
            <p className="mt-1 text-xs text-slate-300/70">
              Create Semaphore proof and register nullifier on-chain.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
