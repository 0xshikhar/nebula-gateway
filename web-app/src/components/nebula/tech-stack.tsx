import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Banknote, BellRing, BadgeCheck, CheckCircle2, Clock3, Ban, Code2, Sparkles, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ResultState {
  decision: 'allow' | 'review' | 'deny'
  bandLabel: string
  trustScore: number
  policyVersion: string
  wallet: string
  protocol: string
  proofLibrary: string
  proofId: string
  verifiedAt: string
  reasons: string[]
}

interface TechStackProps {
  result?: ResultState | null
}

const decisionStyles = {
  allow: "border-emerald-400/20 bg-emerald-400/10 text-emerald-50",
  review: "border-amber-400/20 bg-amber-400/10 text-amber-50",
  deny: "border-rose-400/20 bg-rose-400/10 text-rose-50",
}

const TechStack = ({ result }: TechStackProps) => {
  return (
    <div>
         <section id="console" className="bg-[#08101f]">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 md:grid-cols-2">
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Why protocols buy this</CardTitle>
              <CardDescription className="text-slate-300">
                The product is a policy layer, not a consumer wallet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  title: "Vault access",
                  copy: "Gate premium vaults and lending pools by trust band and cohort membership.",
                  icon: Banknote,
                },
                {
                  title: "Airdrop protection",
                  copy: "Reduce sybil farming by verifying human proof before claims are accepted.",
                  icon: BellRing,
                },
                {
                  title: "Reward programs",
                  copy: "Give contributors and partners access to claims without exposing raw identity.",
                  icon: BadgeCheck,
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex gap-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <Icon className="h-4 w-4 text-emerald-200" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{item.copy}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.04] text-white" id="api">
            <CardHeader>
              <CardTitle className="text-2xl">Verification output</CardTitle>
              <CardDescription className="text-slate-300">
                Browser-generated proof flows into a stable API response.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {result ? (
                <>
                  <div className={cn("rounded-2xl border p-4", decisionStyles[result.decision])}>
                    <div className="flex items-center gap-3">
                      {result.decision === "allow" ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-200" />
                      ) : result.decision === "review" ? (
                        <Clock3 className="h-5 w-5 text-amber-200" />
                      ) : (
                        <Ban className="h-5 w-5 text-rose-200" />
                      )}
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] opacity-75">Decision</p>
                        <h3 className="text-3xl font-semibold capitalize">{result.decision}</h3>
                      </div>
                      <Badge className="ml-auto rounded-full border-white/10 bg-white/10 text-white">
                        {result.bandLabel}
                      </Badge>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Trust score</p>
                        <p className="mt-2 text-3xl font-semibold">{result.trustScore}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Policy</p>
                        <p className="mt-2 font-mono text-sm">{result.policyVersion}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Reasons</p>
                    <ul className="mt-3 space-y-2 text-sm text-slate-200">
                      {result.reasons.map((reason) => (
                        <li key={reason} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">API payload</p>
                    <pre className="mt-3 overflow-auto rounded-2xl bg-black/30 p-4 text-xs text-slate-200">
{JSON.stringify(
  {
    wallet: result.wallet,
    protocol: result.protocol,
    proofLibrary: result.proofLibrary,
    proofId: result.proofId,
    verifiedAt: result.verifiedAt,
  },
  null,
  2,
)}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-6 text-sm text-slate-400">
                  Connect a wallet, choose a policy, and run verification to see the decision payload.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="architecture" className="bg-[#050816]">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Architecture</p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">
              One Next.js app, one API, one protocol trust flow
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              {
                title: "Semaphore proof",
                copy: "Wagmi + RainbowKit + Semaphore identity and proof preparation.",
                icon: Code2,
              },
              {
                title: "HashKey Chain",
                copy: "Connect to testnet RPC and verify protocol context.",
                icon: Sparkles,
              },
              {
                title: "Policy engine",
                copy: "Return allow, review, or deny from a stable decision layer.",
                icon: Shield,
              },
              {
                title: "Audit trail",
                copy: "Store proof metadata, policy version, and decision reasons.",
                icon: CheckCircle2,
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.title} className="border-white/10 bg-white/[0.04] text-white">
                  <CardHeader>
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <Icon className="h-5 w-5 text-emerald-200" />
                    </div>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-6 text-slate-300">{item.copy}</CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default TechStack