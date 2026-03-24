"use client"

import { useMemo, useState } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useChainId, useSignMessage, useSwitchChain } from "wagmi"
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Banknote,
  BellRing,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  Shield,
  Sparkles,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { createBrowserProof } from "@/lib/nebula-proof"
import { hashkeyTestnet } from "@/lib/customChain"
import {
  defaultProofLibrary,
  evaluateTrust,
  protocolPresets,
  type TrustDecision,
  type TrustInput,
  type TrustProtocol,
} from "@/lib/nebula-trust"

type ResultState = ReturnType<typeof evaluateTrust> & {
  wallet: string
  protocol: TrustProtocol
  proofId: string
  verifiedAt: string
}

const initialState: TrustInput = {
  wallet: "",
  protocol: "vault",
  reputationBand: 3,
  humanProof: true,
  cohortMember: true,
  credentialVerified: true,
  expired: false,
  proofLibrary: defaultProofLibrary,
  proofId: "",
}

const decisionStyles: Record<TrustDecision, string> = {
  allow: "border-emerald-400/20 bg-emerald-400/10 text-emerald-50",
  review: "border-amber-400/20 bg-amber-400/10 text-amber-50",
  deny: "border-rose-400/20 bg-rose-400/10 text-rose-50",
}

export function TrustGateway() {
  const { address } = useAccount()
  const chainId = useChainId()
  const { signMessageAsync } = useSignMessage()
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain()
  const [form, setForm] = useState<TrustInput>(initialState)
  const [result, setResult] = useState<ResultState | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [proofPreview, setProofPreview] = useState<{ proofId: string; issuedAt: string } | null>(null)

  const connectedWallet = address || form.wallet

  const recommendedProtocol = useMemo(
    () => protocolPresets.find((item) => item.key === form.protocol) ?? protocolPresets[0],
    [form.protocol],
  )

  const updateForm = (patch: Partial<TrustInput>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const applyPreset = (protocol: TrustProtocol) => {
    const presets: Record<TrustProtocol, Partial<TrustInput>> = {
      vault: { protocol, reputationBand: 4, humanProof: true, cohortMember: true, credentialVerified: true, expired: false },
      pool: { protocol, reputationBand: 3, humanProof: true, cohortMember: true, credentialVerified: false, expired: false },
      rewards: { protocol, reputationBand: 2, humanProof: true, cohortMember: true, credentialVerified: true, expired: false },
      airdrop: { protocol, reputationBand: 2, humanProof: true, cohortMember: false, credentialVerified: false, expired: false },
    }

    const next = { ...initialState, ...presets[protocol], wallet: address ?? "", protocol }
    setForm(next)
    setResult(null)
  }

  const runVerification = async () => {
    setIsLoading(true)
    try {
      if (!connectedWallet) {
        throw new Error("Connect a wallet before generating a proof")
      }

      if (chainId !== hashkeyTestnet.id) {
        await switchChainAsync?.({ chainId: hashkeyTestnet.id })
      }

      const proofArtifact = createBrowserProof({
        address: connectedWallet,
        chainId: hashkeyTestnet.id,
        protocol: form.protocol,
        trustBand: form.reputationBand,
      })

      const signature = await signMessageAsync({ message: proofArtifact.message })
      setProofPreview({
        proofId: proofArtifact.proofId,
        issuedAt: proofArtifact.issuedAt,
      })

      const response = await fetch("/api/trust/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          wallet: connectedWallet,
          proofId: proofArtifact.proofId,
          proofLibrary: defaultProofLibrary,
          proof: {
            message: proofArtifact.message,
            signature,
            nonce: proofArtifact.nonce,
            issuedAt: proofArtifact.issuedAt,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Trust verification failed")
      }

      const data = (await response.json()) as ResultState
      setResult(data)
      updateForm({ proofId: proofArtifact.proofId })
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative overflow-hidden">
      <section className="border-b border-white/10 bg-[#050816]">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <Badge className="rounded-full border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-emerald-100">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Nebula Trust Gateway for HashKey Chain
              </Badge>
              <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-white md:text-6xl">
                Proof-aware trust for DeFi protocols, without exposing identity.
              </h1>
              <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-slate-300 md:text-lg">
                Start the Nebula Trust Gateway on top of the existing Wagmi, Viem, Tailwind, and RainbowKit app.
                Users connect a wallet, generate a browser-based proof, and protocols receive a simple
                `allow`, `review`, or `deny` decision.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  onClick={runVerification}
                  disabled={!connectedWallet || isLoading || isSwitchingChain}
                  className="rounded-full bg-white px-6 text-slate-950 hover:bg-emerald-100"
                >
                  {isSwitchingChain ? "Switching to HashKey..." : isLoading ? "Generating browser proof..." : "Run trust verification"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-white/15 bg-white/5 px-6 text-white hover:bg-white/10"
                  onClick={() => applyPreset("vault")}
                >
                  Load vault preset
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-300">
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  HashKey RPC: https://testnet.hsk.xyz
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  Indexer: Blockscout
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  Proof: Browser signature
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-slate-200">
                  Deployment: Vercel
                </Badge>
              </div>
            </div>

            <Card className="border-white/10 bg-white/[0.04] text-white shadow-2xl shadow-black/30 backdrop-blur">
              <CardHeader>
                <CardTitle className="text-2xl">Protocol trust snapshot</CardTitle>
                <CardDescription className="text-slate-300">
                  The product starts here: one request, one policy engine, one decision.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Connected wallet</p>
                      <p className="mt-1 font-mono text-sm text-white">
                        {connectedWallet || "Connect a wallet to begin"}
                      </p>
                    </div>
                    <ConnectButton showBalance={false} />
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-slate-300">Protocol action</Label>
                      <p className="mt-1 text-sm text-slate-400">{recommendedProtocol.description}</p>
                    </div>
                    <Badge className="rounded-full border-white/10 bg-white/10 text-white">{recommendedProtocol.title}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {protocolPresets.map((preset) => (
                      <Button
                        key={preset.key}
                        variant={form.protocol === preset.key ? "default" : "outline"}
                        className={cn(
                          "rounded-2xl",
                          form.protocol === preset.key
                            ? "bg-white text-slate-950 hover:bg-slate-100"
                            : "border-white/10 bg-white/5 text-white hover:bg-white/10",
                        )}
                        onClick={() => applyPreset(preset.key)}
                      >
                        {preset.title}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <Label className="text-slate-300">Reputation band</Label>
                    <span className="text-sm text-slate-200">Band {form.reputationBand}</span>
                  </div>
                  <Slider
                    value={[form.reputationBand]}
                    min={0}
                    max={4}
                    step={1}
                    onValueChange={(value) => updateForm({ reputationBand: value[0] ?? 0 })}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      label: "Human proof",
                      key: "humanProof",
                      icon: Shield,
                    },
                    {
                      label: "Cohort member",
                      key: "cohortMember",
                      icon: Users,
                    },
                    {
                      label: "Credential verified",
                      key: "credentialVerified",
                      icon: BadgeCheck,
                    },
                    {
                      label: "Expired proof",
                      key: "expired",
                      icon: Clock3,
                    },
                  ].map((item) => {
                    const Icon = item.icon
                    const checked = Boolean(form[item.key as keyof TrustInput])

                    return (
                      <div key={item.key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-emerald-200" />
                          <Label className="text-sm text-slate-200">{item.label}</Label>
                        </div>
                        <Switch
                          checked={checked}
                          onCheckedChange={(value) => updateForm({ [item.key]: value } as Partial<TrustInput>)}
                        />
                      </div>
                    )
                  })}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={runVerification}
                    disabled={isLoading || isSwitchingChain}
                    className="flex-1 rounded-2xl bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                  >
                    {isSwitchingChain ? "Switching to HashKey..." : isLoading ? "Generating browser proof..." : "Generate proof + verify"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>

                {proofPreview ? (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm text-slate-300">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Latest proof</p>
                    <div className="mt-2 space-y-1 font-mono text-xs">
                      <p>proofId: {proofPreview.proofId}</p>
                      <p>issuedAt: {proofPreview.issuedAt}</p>
                      <p>chainId: {chainId}</p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

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
                title: "Browser proof",
                copy: "Wagmi + RainbowKit + browser-side proof preparation.",
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
